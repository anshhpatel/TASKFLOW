from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get(
    "",
    response_model=List[TaskResponse],
    status_code=status.HTTP_200_OK,
    summary="List tasks",
)
def get_user_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    goal_id_filter: Optional[int] = Query(None, alias="goal_id"),
    due_date_filter: Optional[date] = Query(None, alias="due_date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[TaskResponse]:
    """List tasks owned by current user with optional filters."""
    tasks = task_service.list_tasks(
        db,
        current_user.id,
        status_filter=status_filter,
        priority_filter=priority_filter,
        goal_id_filter=goal_id_filter,
        due_date_filter=due_date_filter,
    )
    return [TaskResponse.model_validate(t) for t in tasks]


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a task",
)
def create_new_task(
    req: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    """Create a new task owned by current user."""
    task = task_service.create_task(db, current_user.id, req)
    return TaskResponse.model_validate(task)


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a task by ID",
)
def get_task_by_id(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    """Retrieve an owned task."""
    task = task_service.get_task(db, current_user.id, task_id)
    return TaskResponse.model_validate(task)


@router.patch(
    "/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a task",
)
def update_task_by_id(
    task_id: int,
    req: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    """Update fields on an owned task."""
    task = task_service.update_task(db, current_user.id, task_id, req)
    return TaskResponse.model_validate(task)


@router.delete(
    "/{task_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete a task",
)
def delete_task_by_id(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """Delete a task and cascade its reminders."""
    task_service.delete_task(db, current_user.id, task_id)
    return MessageResponse(message="Task deleted successfully")


@router.patch(
    "/{task_id}/complete",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark task complete",
)
def mark_task_complete(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    """Mark task status as completed and set completed_at timestamp."""
    task = task_service.complete_task(db, current_user.id, task_id)
    return TaskResponse.model_validate(task)


@router.patch(
    "/{task_id}/reopen",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Reopen task",
)
def reopen_task_by_id(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    """Reopen a completed task back to pending."""
    task = task_service.reopen_task(db, current_user.id, task_id)
    return TaskResponse.model_validate(task)
