from datetime import datetime, timezone
from typing import List
from fastapi import HTTPException, status
from sqlalchemy import case
from sqlalchemy.orm import Session

from app.models.notification import Notification


def list_notifications(db: Session, user_id: int) -> List[Notification]:
    """List notifications for the user, prioritizing unread items."""
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(
            case((Notification.read_at.is_(None), 0), else_=1),
            Notification.created_at.desc(),
        )
        .all()
    )


def mark_read(db: Session, user_id: int, notification_id: int) -> Notification:
    """Mark a specific owned notification as read."""
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
        .first()
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    if notification.read_at is None:
        notification.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notification)

    return notification
