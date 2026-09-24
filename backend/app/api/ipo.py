from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlmodel import Session, select
from typing import List, Optional, Dict, Any
from datetime import datetime
import zoneinfo
from app.core.database import get_session
from app.models.ipo import (
    IPO, IPOGMPHistory, IPOSubscription, IPOFinancials,
    IPOGeminiSummary, Watchlist, IPOReminder
)
from app.services.gemini import gemini_service
from app.services.gmp_service import gmp_service
from app.services.scraper import scraper_service
from app.services.scheduler import sync_live_ipos_to_db

from datetime import datetime, timezone
import logging

logger = logging.getLogger("captrack.api")
router = APIRouter(prefix="/ipo", tags=["IPOs"])
LAST_SYNC_TIMESTAMP: Optional[datetime] = None

async def check_and_sync_if_expired(max_age_seconds: int = 1800):
    """30-minute Smart Caching: Auto-syncs live data on app open if cache is older than 30 mins."""
    global LAST_SYNC_TIMESTAMP
    now = datetime.now(timezone.utc)
    if LAST_SYNC_TIMESTAMP is None or (now - LAST_SYNC_TIMESTAMP).total_seconds() >= max_age_seconds:
        logger.info(f"Cache expired (>{max_age_seconds//60} mins) or first launch. Syncing Groww live feed...")
        try:
            await sync_live_ipos_to_db()
            LAST_SYNC_TIMESTAMP = datetime.now(timezone.utc)
        except Exception as e:
            logger.error(f"Error during 30-min auto sync: {e}")

def compute_ipo_status(ipo: IPO) -> str:
    """
    Computes IPO status:
    Respects explicit status set from official Groww catalog classification (Upcoming, Active, Pre Apply, Waiting for Allotment, Listed).
    Falls back to dynamic IST date comparison if missing.
    """
    if ipo.status and ipo.status in ["Upcoming", "Active", "Pre Apply", "Waiting for Allotment", "Listed"]:
        return ipo.status

    try:
        ist = zoneinfo.ZoneInfo("Asia/Kolkata")
        today_str = datetime.now(ist).strftime("%Y-%m-%d")
    except Exception:
        today_str = datetime.now().strftime("%Y-%m-%d")

    if not ipo.open_date or ipo.open_date == "TBA":
        return "Upcoming"
    if ipo.listing_date and ipo.listing_date != "TBA" and today_str >= ipo.listing_date:
        return "Listed"
    if ipo.close_date and ipo.close_date != "TBA" and today_str > ipo.close_date:
        return "Waiting for Allotment"
    if ipo.open_date and ipo.open_date != "TBA" and today_str < ipo.open_date:
        return "Pre Apply"
    return "Active"

@router.get("/stats", response_model=Dict[str, int])
def get_ipo_stats(session: Session = Depends(get_session)):
    """
    Returns dashboard summary counts matching Groww statistics strip:
    - open_count: Active applying + Pre Apply + Waiting for Allotment IPOs
    - upcoming_count: Upcoming (To Be Announced) IPOs
    - closed_count: Listed IPOs
    - listed_gains_count: Listed IPOs with positive listing gains
    - listed_loss_count: Listed IPOs with negative listing gains
    """
    ipos = session.exec(select(IPO)).all()
    open_count = 0
    upcoming_count = 0
    closed_count = 0
    listed_gains_count = 0
    listed_loss_count = 0

    for ipo in ipos:
        st = compute_ipo_status(ipo)
        if st in ["Active", "Pre Apply", "Waiting for Allotment"]:
            open_count += 1
        elif st == "Upcoming":
            upcoming_count += 1
        elif st == "Listed":
            closed_count += 1
            latest_gmp = session.exec(
                select(IPOGMPHistory)
                .where(IPOGMPHistory.ipo_id == ipo.id)
                .order_by(IPOGMPHistory.id.desc())
            ).first()
            if latest_gmp and latest_gmp.estimated_gain_percent < 0:
                listed_loss_count += 1
            else:
                listed_gains_count += 1

    return {
        "open_count": open_count,
        "upcoming_count": upcoming_count,
        "closed_count": closed_count,
        "listed_gains_count": listed_gains_count,
        "listed_loss_count": listed_loss_count
    }

@router.get("/list", response_model=List[Dict[str, Any]])
async def get_ipo_list(
    status: Optional[str] = None,  # all, active, upcoming, listed
    issue_type: Optional[str] = None, # all, mainboard, sme
    search: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """
    Fetch list of IPOs.
    Auto-triggers 30-min smart cache sync if data is older than 30 minutes.
    """
    await check_and_sync_if_expired(1800)
    ipos = session.exec(select(IPO)).all()
    results = []

    for ipo in ipos:
        current_status = compute_ipo_status(ipo)

        # Status filtering
        if status and status.lower() != "all":
            req_status = status.lower()
            if req_status == "active":
                if current_status.lower() not in ["active", "pre apply", "waiting for allotment"]:
                    continue
            else:
                if current_status.lower() != req_status:
                    continue

        # Issue type filtering (Mainboard vs SME)
        if issue_type and issue_type.lower() != "all":
            if getattr(ipo, "issue_type", "Mainboard").lower() != issue_type.lower():
                continue

        if search:
            query_str = search.lower()
            if query_str not in ipo.name.lower() and query_str not in ipo.symbol.lower():
                continue

        latest_gmp = session.exec(
            select(IPOGMPHistory)
            .where(IPOGMPHistory.ipo_id == ipo.id)
            .order_by(IPOGMPHistory.id.desc())
        ).first()

        latest_sub = session.exec(
            select(IPOSubscription)
            .where(IPOSubscription.ipo_id == ipo.id)
            .order_by(IPOSubscription.day.desc())
        ).first()

        is_watched = session.exec(
            select(Watchlist).where(Watchlist.ipo_id == ipo.id)
        ).first() is not None

        calc_ltp = round(latest_gmp.est_listing_price, 2) if (latest_gmp and latest_gmp.est_listing_price) else round(ipo.issue_price_max * (1 + (latest_gmp.estimated_gain_percent if latest_gmp else 0.0) / 100.0), 2)

        results.append({
            "id": ipo.id,
            "name": ipo.name,
            "symbol": ipo.symbol,
            "exchange": ipo.exchange,
            "issue_price_min": ipo.issue_price_min,
            "issue_price_max": ipo.issue_price_max,
            "lot_size": ipo.lot_size,
            "open_date": ipo.open_date,
            "close_date": ipo.close_date,
            "listing_date": ipo.listing_date,
            "issue_size_cr": ipo.issue_size_cr,
            "issue_type": getattr(ipo, "issue_type", "Mainboard"),
            "status": current_status,
            "company_logo": ipo.company_logo,
            "latest_gmp": latest_gmp.gmp_amount if latest_gmp else 0.0,
            "est_listing_gain_percent": latest_gmp.estimated_gain_percent if latest_gmp else 0.0,
            "listing_price": calc_ltp,
            "total_subscription_x": latest_sub.total_x if latest_sub else 0.0,
            "is_watched": is_watched
        })

    return results

@router.post("/sync-live", response_model=Dict[str, Any])
async def trigger_live_sync(background_tasks: BackgroundTasks):
    """Trigger dynamic live web scraping sync for IPO catalog, GMP, subscription tables, and Gemini summaries."""
    background_tasks.add_task(sync_live_ipos_to_db)
    return {"message": "Live dynamic IPO sync triggered in background", "status": "processing"}

@router.get("/{ipo_id}/details", response_model=Dict[str, Any])
def get_ipo_details(ipo_id: int, session: Session = Depends(get_session)):
    """Fetch complete metadata, latest GMP, financials, and Gemini prospectus summaries for an IPO."""
    ipo = session.get(IPO, ipo_id)
    if not ipo:
        raise HTTPException(status_code=404, detail="IPO not found")

    current_status = compute_ipo_status(ipo)

    gmp_history = session.exec(
        select(IPOGMPHistory).where(IPOGMPHistory.ipo_id == ipo_id).order_by(IPOGMPHistory.id.asc())
    ).all()

    financials = session.exec(
        select(IPOFinancials).where(IPOFinancials.ipo_id == ipo_id)
    ).all()

    gemini_summary = session.exec(
        select(IPOGeminiSummary).where(IPOGeminiSummary.ipo_id == ipo_id)
    ).first()

    latest_gmp = gmp_history[-1] if gmp_history else None

    meta_dict = ipo.model_dump()
    meta_dict["status"] = current_status

    return {
        "metadata": meta_dict,
        "latest_gmp": latest_gmp,
        "gmp_history": gmp_history,
        "financials": financials,
        "gemini_summary": gemini_summary
    }

@router.get("/{ipo_id}/subscription", response_model=List[IPOSubscription])
def get_ipo_subscription(ipo_id: int, session: Session = Depends(get_session)):
    """Fetch day-wise and category-wise subscription data for an IPO."""
    ipo = session.get(IPO, ipo_id)
    if not ipo:
        raise HTTPException(status_code=404, detail="IPO not found")

    subs = session.exec(
        select(IPOSubscription)
        .where(IPOSubscription.ipo_id == ipo_id)
        .order_by(IPOSubscription.day.asc())
    ).all()
    return subs

@router.post("/{ipo_id}/watch", response_model=Dict[str, Any])
def toggle_watchlist(ipo_id: int, user_id: str = "default_user", session: Session = Depends(get_session)):
    """Add or remove an IPO from the user's watchlist."""
    ipo = session.get(IPO, ipo_id)
    if not ipo:
        raise HTTPException(status_code=404, detail="IPO not found")

    existing = session.exec(
        select(Watchlist)
        .where(Watchlist.ipo_id == ipo_id)
        .where(Watchlist.user_id == user_id)
    ).first()

    if existing:
        session.delete(existing)
        session.commit()
        return {"status": "removed", "ipo_id": ipo_id, "is_watched": False}
    else:
        new_watch = Watchlist(ipo_id=ipo_id, user_id=user_id)
        session.add(new_watch)
        session.commit()
        return {"status": "added", "ipo_id": ipo_id, "is_watched": True}

@router.post("/{ipo_id}/reminder", response_model=Dict[str, Any])
def set_ipo_reminder(
    ipo_id: int,
    reminder_time: str,
    event_type: str = "open_date",
    user_id: str = "default_user",
    session: Session = Depends(get_session)
):
    """Set a reminder alert time for an IPO event."""
    ipo = session.get(IPO, ipo_id)
    if not ipo:
        raise HTTPException(status_code=404, detail="IPO not found")

    reminder = IPOReminder(
        ipo_id=ipo_id,
        user_id=user_id,
        reminder_time=reminder_time,
        event_type=event_type
    )
    session.add(reminder)
    session.commit()
    session.refresh(reminder)

    return {
        "message": "Reminder scheduled successfully",
        "reminder_id": reminder.id,
        "ipo_name": ipo.name,
        "event_type": event_type,
        "reminder_time": reminder_time
    }

@router.post("/{ipo_id}/analyze", response_model=Dict[str, Any])
async def trigger_gemini_analysis(ipo_id: int, session: Session = Depends(get_session)):
    """Trigger Gemini API prospectus summary and valuation narrative generation."""
    ipo = session.get(IPO, ipo_id)
    if not ipo:
        raise HTTPException(status_code=404, detail="IPO not found")

    summary_data = await gemini_service.analyze_prospectus(ipo.name, ipo.prospectus_url)

    existing = session.exec(
        select(IPOGeminiSummary).where(IPOGeminiSummary.ipo_id == ipo_id)
    ).first()

    if existing:
        for k, v in summary_data.items():
            setattr(existing, k, v)
        session.add(existing)
    else:
        existing = IPOGeminiSummary(ipo_id=ipo_id, **summary_data)
        session.add(existing)

    fin = session.exec(select(IPOFinancials).where(IPOFinancials.ipo_id == ipo_id)).first()
    if fin:
        narratives = await gemini_service.generate_valuation_narrative(
            company_name=ipo.name,
            pe_ratio=fin.pe_ratio,
            ronw=fin.ronw_percent,
            pat_cr=fin.pat_cr,
            peers="Premier Tech Ltd, Enterprise India"
        )
        fin.valuation_narrative = narratives["valuation_narrative"]
        fin.peer_comparison_narrative = narratives["peer_comparison_narrative"]
        session.add(fin)

    session.commit()
    session.refresh(existing)
    return {"status": "success", "gemini_summary": existing}
