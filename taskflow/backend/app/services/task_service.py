from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import cast, Date
from sqlalchemy.orm import Session

from app.models.goal import Goal
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate


def list_tasks(
    db: Session,
    user_id: int,
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    goal_id_filter: Optional[int] = None,
    due_date_filter: Optional[date] = None,
) -> List[Task]:
    """List tasks owned by the authenticated user with optional filtering."""
    query = db.query(Task).filter(Task.user_id == user_id)

    if status_filter:
        query = query.filter(Task.status == status_filter.lower())
    if priority_filter:
        query = query.filter(Task.priority == priority_filter.lower())
    if goal_id_filter is not None:
        query = query.filter(Task.goal_id == goal_id_filter)
    if due_date_filter is not None:
        query = query.filter(cast(Task.deadline, Date) == due_date_filter)

    return query.order_by(Task.created_at.desc()).all()


def create_task(db: Session, user_id: int, req: TaskCreate) -> Task:
    """Create a new task owned by the authenticated user."""
    if req.goal_id is not None:
        goal = (
            db.query(Goal)
            .filter(Goal.id == req.goal_id, Goal.user_id == user_id)
            .first()
        )
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found or does not belong to user",
            )

    task = Task(
        user_id=user_id,
        goal_id=req.goal_id,
        title=req.title,
        description=req.description,
        priority=req.priority or "medium",
        status=req.status or "pending",
        deadline=req.deadline,
        scheduled_start=req.scheduled_start,
        scheduled_end=req.scheduled_end,
    )
    if task.status == "completed":
        task.completed_at = datetime.now(timezone.utc)

    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_task(db: Session, user_id: int, task_id: int) -> Task:
    """Get a single task, ensuring it belongs to the authenticated user."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


def update_task(db: Session, user_id: int, task_id: int, req: TaskUpdate) -> Task:
    """Update only the submitted fields of an owned task."""
    task = get_task(db, user_id, task_id)

    update_dict = req.model_dump(exclude_unset=True)

    if "goal_id" in update_dict and update_dict["goal_id"] is not None:
        goal = (
            db.query(Goal)
            .filter(Goal.id == update_dict["goal_id"], Goal.user_id == user_id)
            .first()
        )
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found or does not belong to user",
            )

    for field, val in update_dict.items():
        setattr(task, field, val)

    if task.status == "completed" and task.completed_at is None:
        task.completed_at = datetime.now(timezone.utc)
    elif task.status == "pending":
        task.completed_at = None

    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, user_id: int, task_id: int) -> None:
    """Delete a task owned by the user. Associated reminders are deleted."""
    task = get_task(db, user_id, task_id)
    db.delete(task)
    db.commit()


def complete_task(db: Session, user_id: int, task_id: int) -> Task:
    """Mark a task as completed and record the completion timestamp."""
    task = get_task(db, user_id, task_id)
    task.status = "completed"
    task.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task


def reopen_task(db: Session, user_id: int, task_id: int) -> Task:
    """Reopen a completed task back to pending status."""
    task = get_task(db, user_id, task_id)
    task.status = "pending"
    task.completed_at = None
    db.commit()
    db.refresh(task)
    return task
