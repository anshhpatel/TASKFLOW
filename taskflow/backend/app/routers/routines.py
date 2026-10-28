from datetime import date
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.routine import (
    RoutineCompletionUpdate,
    RoutineCreate,
    RoutineResponse,
    RoutineTodayResponse,
    RoutineUpdate,
)
from app.services.routine_service import (
    create_routine,
    delete_routine,
    get_routines_today,
    list_routines,
    toggle_completion,
    update_routine,
)

router = APIRouter(prefix="/routines", tags=["routines"])


@router.get(
    "",
    response_model=List[RoutineResponse],
    status_code=status.HTTP_200_OK,
    summary="List routines",
)
def get_user_routines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[RoutineResponse]:
    """List all routines owned by the authenticated user."""
    routines = list_routines(db, current_user.id)
    return [RoutineResponse.model_validate(r) for r in routines]


@router.post(
    "",
    response_model=RoutineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create routine",
)
def create_new_routine(
    req: RoutineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoutineResponse:
    """Create a new routine definition."""
    routine = create_routine(db, current_user.id, req)
    return RoutineResponse.model_validate(routine)


@router.get(
    "/today",
    response_model=List[RoutineTodayResponse],
    status_code=status.HTTP_200_OK,
    summary="Get today's routines with completion state",
)
def get_today_routines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[RoutineTodayResponse]:
    """Retrieve today's active routines with completion log status."""
    return get_routines_today(db, current_user.id)


@router.patch(
    "/{routine_id}",
    response_model=RoutineResponse,
    status_code=status.HTTP_200_OK,
    summary="Update routine",
)
def update_routine_by_id(
    routine_id: int,
    req: RoutineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoutineResponse:
    """Update routine attributes."""
    routine = update_routine(db, current_user.id, routine_id, req)
    return RoutineResponse.model_validate(routine)


@router.delete(
    "/{routine_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Soft-delete routine",
)
def delete_routine_by_id(
    routine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """Soft-delete a routine by deactivating it."""
    delete_routine(db, current_user.id, routine_id)
    return MessageResponse(message="Routine deactivated successfully")


@router.put(
    "/{routine_id}/completions/{occurrence_date}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Toggle completion for a routine occurrence date",
)
def mark_routine_completion(
    routine_id: int,
    occurrence_date: date,
    body: RoutineCompletionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """Record or toggle completion for a routine on a specific date (YYYY-MM-DD)."""
    toggle_completion(db, current_user.id, routine_id, occurrence_date, body.completed)
    status_str = "completed" if body.completed else "incomplete"
    return MessageResponse(
        message=f"Routine occurrence marked as {status_str} for {occurrence_date}"
    )
