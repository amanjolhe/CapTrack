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
    """Get all active reminders for the specific user/client."""
    query = select(IPOReminder)
    if user_id != "all":
        query = query.where(IPOReminder.user_id == user_id)
    reminders = session.exec(query).all()

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
                "is_notified": rem.is_notified,
                "user_id": rem.user_id
            })

    return results

@router.delete("/reminders/{reminder_id}", response_model=Dict[str, Any])
def delete_user_reminder(reminder_id: int, user_id: str = "default_user", session: Session = Depends(get_session)):
    """Delete a scheduled reminder."""
    rem = session.get(IPOReminder, reminder_id)
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    session.delete(rem)
    session.commit()
    return {"status": "success", "deleted_id": reminder_id}

from pydantic import BaseModel
from app.models.ipo import UserPushSubscription

class PushSubPayload(BaseModel):
    user_id: str
    endpoint: str
    p256dh: str
    auth: str

@router.post("/push-subscribe")
def subscribe_push(payload: PushSubPayload, session: Session = Depends(get_session)):
    """Save user web push notification subscription."""
    existing = session.exec(
        select(UserPushSubscription).where(UserPushSubscription.endpoint == payload.endpoint)
    ).first()
    if existing:
        existing.user_id = payload.user_id
        existing.p256dh = payload.p256dh
        existing.auth = payload.auth
        session.add(existing)
    else:
        new_sub = UserPushSubscription(
            user_id=payload.user_id,
            endpoint=payload.endpoint,
            p256dh=payload.p256dh,
            auth=payload.auth
        )
        session.add(new_sub)
    session.commit()
    return {"status": "subscribed"}


