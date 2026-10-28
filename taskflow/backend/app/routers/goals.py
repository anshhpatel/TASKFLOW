from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.goal import (
    GoalCreate,
    GoalDetailResponse,
    GoalResponse,
    GoalUpdate,
)
from app.services.goal_service import (
    create_goal,
    delete_goal,
    get_goal,
    list_goals,
    update_goal,
)

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get(
    "",
    response_model=List[GoalResponse],
    status_code=status.HTTP_200_OK,
    summary="List user's goals",
)
def get_user_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[GoalResponse]:
    """Retrieve all goals for current user with derived task completion counts."""
    return list_goals(db, current_user.id)


@router.post(
    "",
    response_model=GoalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a goal",
)
def create_new_goal(
    req: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GoalResponse:
    """Create a new goal owned by current user."""
    return create_goal(db, current_user.id, req)


@router.get(
    "/{goal_id}",
    response_model=GoalDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get goal details with tasks",
)
def get_goal_by_id(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GoalDetailResponse:
    """Retrieve a single goal and its associated tasks."""
    return get_goal(db, current_user.id, goal_id)


@router.patch(
    "/{goal_id}",
    response_model=GoalResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a goal",
)
def update_goal_by_id(
    goal_id: int,
    req: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GoalResponse:
    """Partially update goal attributes."""
    return update_goal(db, current_user.id, goal_id, req)


@router.delete(
    "/{goal_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete a goal",
)
def delete_goal_by_id(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """Delete goal and dissociate linked tasks (set task.goal_id to NULL)."""
    delete_goal(db, current_user.id, goal_id)
    return MessageResponse(message="Goal deleted successfully")
