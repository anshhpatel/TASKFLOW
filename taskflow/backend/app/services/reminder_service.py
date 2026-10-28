from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.reminder import Reminder
from app.models.routine import Routine
from app.models.task import Task
from app.schemas.reminder import ReminderCreate, ReminderUpdate


def list_reminders(db: Session, user_id: int) -> List[Reminder]:
    """List all reminders for the authenticated user."""
    return (
        db.query(Reminder)
        .filter(Reminder.user_id == user_id)
        .order_by(Reminder.due_at.asc())
        .all()
    )


def create_reminder(db: Session, user_id: int, req: ReminderCreate) -> Reminder:
    """Create a reminder for an owned task or routine."""
    if req.task_id is not None:
        task = (
            db.query(Task)
            .filter(Task.id == req.task_id, Task.user_id == user_id)
            .first()
        )
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or does not belong to user",
            )
    elif req.routine_id is not None:
        routine = (
            db.query(Routine)
            .filter(Routine.id == req.routine_id, Routine.user_id == user_id)
            .first()
        )
        if not routine:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Routine not found or does not belong to user",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Exactly one of task_id or routine_id must be provided",
        )

    reminder = Reminder(
        user_id=user_id,
        task_id=req.task_id,
        routine_id=req.routine_id,
        due_at=req.due_at,
        enabled=req.enabled if req.enabled is not None else True,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


def get_reminder(db: Session, user_id: int, reminder_id: int) -> Reminder:
    """Get a single reminder, verifying user ownership."""
    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.user_id == user_id)
        .first()
    )
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found",
        )
    return reminder


def update_reminder(
    db: Session, user_id: int, reminder_id: int, req: ReminderUpdate
) -> Reminder:
    """Update a reminder's due time or enabled state."""
    reminder = get_reminder(db, user_id, reminder_id)
    update_dict = req.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(reminder, field, val)

    db.commit()
    db.refresh(reminder)
    return reminder


def delete_reminder(db: Session, user_id: int, reminder_id: int) -> None:
    """Delete a reminder owned by the user."""
    reminder = get_reminder(db, user_id, reminder_id)
    db.delete(reminder)
    db.commit()
