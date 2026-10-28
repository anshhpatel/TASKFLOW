from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.reminder import (
    ReminderCreate,
    ReminderResponse,
    ReminderUpdate,
)
from app.services.reminder_service import (
    create_reminder,
    delete_reminder,
    get_reminder,
    list_reminders,
    update_reminder,
)

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get(
    "",
    response_model=List[ReminderResponse],
    status_code=status.HTTP_200_OK,
    summary="List reminders",
)
def get_user_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ReminderResponse]:
    """List all reminders configured by the authenticated user."""
    reminders = list_reminders(db, current_user.id)
    return [ReminderResponse.model_validate(r) for r in reminders]


@router.post(
    "",
    response_model=ReminderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create reminder",
)
def create_new_reminder(
    req: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReminderResponse:
    """Create a new reminder for an owned task or routine."""
    reminder = create_reminder(db, current_user.id, req)
    return ReminderResponse.model_validate(reminder)


@router.get(
    "/{reminder_id}",
    response_model=ReminderResponse,
    status_code=status.HTTP_200_OK,
    summary="Get reminder by ID",
)
def get_reminder_by_id(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReminderResponse:
    """Get single reminder details."""
    reminder = get_reminder(db, current_user.id, reminder_id)
    return ReminderResponse.model_validate(reminder)


@router.patch(
    "/{reminder_id}",
    response_model=ReminderResponse,
    status_code=status.HTTP_200_OK,
    summary="Update reminder",
)
def update_reminder_by_id(
    reminder_id: int,
    req: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReminderResponse:
    """Update due time or enabled state of a reminder."""
    reminder = update_reminder(db, current_user.id, reminder_id, req)
    return ReminderResponse.model_validate(reminder)


@router.delete(
    "/{reminder_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete reminder",
)
def delete_reminder_by_id(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """Delete a reminder."""
    delete_reminder(db, current_user.id, reminder_id)
    return MessageResponse(message="Reminder deleted successfully")
