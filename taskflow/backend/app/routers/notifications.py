from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.services.notification_service import list_notifications, mark_read

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get(
    "",
    response_model=List[NotificationResponse],
    status_code=status.HTTP_200_OK,
    summary="List notifications",
)
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[NotificationResponse]:
    """List notifications with unread notifications listed first."""
    notifications = list_notifications(db, current_user.id)
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark notification read",
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationResponse:
    """Mark a notification as read and set read_at timestamp."""
    notification = mark_read(db, current_user.id, notification_id)
    return NotificationResponse.model_validate(notification)
