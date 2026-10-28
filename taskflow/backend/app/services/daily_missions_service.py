from datetime import date
from typing import List
from sqlalchemy import cast, Date, or_
from sqlalchemy.orm import Session

from app.models.routine import Routine
from app.models.routine_log import RoutineLog
from app.models.task import Task
from app.schemas.daily_missions import (
    DailyMissionsResponse,
    DailyMissionsSummary,
    RoutineOccurrence,
)
from app.schemas.task import TaskResponse

WEEKDAY_NAMES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def get_daily_missions(
    db: Session, user_id: int, target_date: date
) -> DailyMissionsResponse:
    """Aggregate tasks and active routine occurrences for a given date."""
    # 1. Tasks where deadline date == target_date OR scheduled_start date == target_date
    all_user_tasks = (
        db.query(Task)
        .filter(Task.user_id == user_id)
        .order_by(Task.created_at.asc())
        .all()
    )
    tasks = []
    for t in all_user_tasks:
        matched = False
        if t.deadline is not None:
            t_date = t.deadline.date() if hasattr(t.deadline, "date") else None
            if t_date == target_date:
                matched = True
        if not matched and t.scheduled_start is not None:
            s_date = t.scheduled_start.date() if hasattr(t.scheduled_start, "date") else None
            if s_date == target_date:
                matched = True
        if matched:
            tasks.append(t)

    # 2. Routines that are active and scheduled for target_date's weekday
    current_weekday = WEEKDAY_NAMES[target_date.weekday()]
    routines = (
        db.query(Routine)
        .filter(Routine.user_id == user_id, Routine.active.is_(True))
        .all()
    )

    routine_occurrences: List[RoutineOccurrence] = []
    for routine in routines:
        days = [d.strip().lower() for d in routine.schedule_days.split(",")]
        if current_weekday in days:
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

            routine_occurrences.append(
                RoutineOccurrence(
                    routine_id=routine.id,
                    name=routine.name,
                    description=routine.description,
                    completed=is_completed,
                    completed_at=completed_at,
                )
            )

    # 3. Calculate summary
    completed_tasks_count = sum(1 for t in tasks if t.status == "completed")
    completed_routines_count = sum(1 for r in routine_occurrences if r.completed)

    total_items = len(tasks) + len(routine_occurrences)
    completed_items = completed_tasks_count + completed_routines_count

    return DailyMissionsResponse(
        date=target_date,
        tasks=[TaskResponse.model_validate(t) for t in tasks],
        routine_occurrences=routine_occurrences,
        summary=DailyMissionsSummary(
            total=total_items,
            completed=completed_items,
        ),
    )
