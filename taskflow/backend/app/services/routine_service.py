from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.routine import Routine
from app.models.routine_log import RoutineLog
from app.schemas.routine import (
    RoutineCreate,
    RoutineResponse,
    RoutineTodayResponse,
    RoutineUpdate,
)

WEEKDAY_NAMES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def list_routines(db: Session, user_id: int) -> List[Routine]:
    """List all routines owned by the user."""
    return (
        db.query(Routine)
        .filter(Routine.user_id == user_id)
        .order_by(Routine.created_at.asc())
        .all()
    )


def create_routine(db: Session, user_id: int, req: RoutineCreate) -> Routine:
    """Create a new routine for the authenticated user."""
    routine = Routine(
        user_id=user_id,
        name=req.name,
        description=req.description,
        schedule_days=req.schedule_days,
        active=req.active if req.active is not None else True,
    )
    db.add(routine)
    db.commit()
    db.refresh(routine)
    return routine


def get_routine(db: Session, user_id: int, routine_id: int) -> Routine:
    """Get a single routine, verifying ownership."""
    routine = (
        db.query(Routine)
        .filter(Routine.id == routine_id, Routine.user_id == user_id)
        .first()
    )
    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found",
        )
    return routine


def update_routine(
    db: Session, user_id: int, routine_id: int, req: RoutineUpdate
) -> Routine:
    """Update routine attributes."""
    routine = get_routine(db, user_id, routine_id)
    update_dict = req.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(routine, field, val)

    db.commit()
    db.refresh(routine)
    return routine


def delete_routine(db: Session, user_id: int, routine_id: int) -> None:
    """Soft-delete a routine by deactivating it."""
    routine = get_routine(db, user_id, routine_id)
    routine.active = False
    db.commit()


def get_routines_today(
    db: Session, user_id: int, target_date: Optional[date] = None
) -> List[RoutineTodayResponse]:
    """Retrieve today's active scheduled routines with completion status for that date."""
    if target_date is None:
        target_date = datetime.now(timezone.utc).date()

    current_weekday = WEEKDAY_NAMES[target_date.weekday()]

    routines = (
        db.query(Routine)
        .filter(Routine.user_id == user_id, Routine.active.is_(True))
        .all()
    )

    result: List[RoutineTodayResponse] = []
    for routine in routines:
        routine_days = [d.strip().lower() for d in routine.schedule_days.split(",")]
        if current_weekday in routine_days:
            log = (
                db.query(RoutineLog)
                .filter(
                    RoutineLog.routine_id == routine.id,
                    RoutineLog.occurrence_date == target_date,
                )
                .first()
            )
            is_completed = log.completed if log else False
            completed_at = log.completed_at if log else None

            result.append(
                RoutineTodayResponse(
                    id=routine.id,
                    user_id=routine.user_id,
                    name=routine.name,
                    description=routine.description,
                    schedule_days=routine.schedule_days,
                    active=routine.active,
                    created_at=routine.created_at,
                    updated_at=routine.updated_at,
                    is_completed_today=is_completed,
                    completed_at=completed_at,
                )
            )
    return result


def toggle_completion(
    db: Session, user_id: int, routine_id: int, occurrence_date: date, completed: bool
) -> RoutineLog:
    """Record or toggle completion of a routine on a specific date."""
    # Verify routine ownership
    get_routine(db, user_id, routine_id)

    log = (
        db.query(RoutineLog)
        .filter(
            RoutineLog.routine_id == routine_id,
            RoutineLog.occurrence_date == occurrence_date,
        )
        .first()
    )
    now_utc = datetime.now(timezone.utc)
    if not log:
        log = RoutineLog(
            routine_id=routine_id,
            occurrence_date=occurrence_date,
            completed=completed,
            completed_at=now_utc if completed else None,
        )
        db.add(log)
    else:
        log.completed = completed
        log.completed_at = now_utc if completed else None

    db.commit()
    db.refresh(log)
    return log
