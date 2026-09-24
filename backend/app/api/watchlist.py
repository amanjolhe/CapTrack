from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import List, Dict, Any
from app.core.database import get_session
from app.models.ipo import IPO, Watchlist, IPOReminder, IPOGMPHistory, IPOSubscription

router = APIRouter(tags=["Watchlist & Reminders"])

@router.get("/watchlist", response_model=List[Dict[str, Any]])
def get_user_watchlist(user_id: str = "default_user", session: Session = Depends(get_session)):
    """Get all watched IPOs for the user."""
    watched_items = session.exec(
        select(Watchlist).where(Watchlist.user_id == user_id)
    ).all()

    results = []
    for item in watched_items:
        ipo = session.get(IPO, item.ipo_id)
        if ipo:
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

            results.append({
                "watchlist_id": item.id,
                "ipo": ipo,
                "latest_gmp": latest_gmp.gmp_amount if latest_gmp else 0.0,
                "est_listing_gain_percent": latest_gmp.estimated_gain_percent if latest_gmp else 0.0,
                "total_subscription_x": latest_sub.total_x if latest_sub else 0.0
            })

    return results

@router.get("/reminders", response_model=List[Dict[str, Any]])
def get_user_reminders(user_id: str = "default_user", session: Session = Depends(get_session)):
    """Get all active reminders for the user."""
    reminders = session.exec(
        select(IPOReminder).where(IPOReminder.user_id == user_id)
    ).all()

    results = []
    for rem in reminders:
        ipo = session.get(IPO, rem.ipo_id)
        if ipo:
            results.append({
                "reminder_id": rem.id,
                "ipo_id": ipo.id,
                "ipo_name": ipo.name,
                "symbol": ipo.symbol,
                "event_type": rem.event_type,
                "reminder_time": rem.reminder_time,
                "is_notified": rem.is_notified
            })

    return results
