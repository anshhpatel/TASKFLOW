from datetime import date, timedelta
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.routine import Routine
from app.models.routine_log import RoutineLog
from app.models.task import Task
from app.schemas.progress import DailyBreakdownItem, ProgressSummaryResponse

WEEKDAY_NAMES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def get_progress_summary(
    db: Session, user_id: int, from_date: date, to_date: date
) -> ProgressSummaryResponse:
    """Calculate task and routine progress across a date range directly from persisted records."""
    if from_date > to_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="'from' date cannot be after 'to' date",
        )

    # 1. Tasks metrics
    # Completed tasks for user
    all_completed_tasks = (
        db.query(Task)
        .filter(
            Task.user_id == user_id,
            Task.status == "completed",
            Task.completed_at.is_not(None),
        )
        .all()
    )

    in_range_completed_tasks = [
        t for t in all_completed_tasks
        if t.completed_at and from_date <= (t.completed_at.date() if hasattr(t.completed_at, "date") else t.completed_at) <= to_date
    ]
    completed_tasks_count = len(in_range_completed_tasks)

    # Currently pending tasks
    pending_tasks_count = (
        db.query(Task)
        .filter(
            Task.user_id == user_id,
            Task.status == "pending",
        )
        .count()
    )

    total_tasks = completed_tasks_count + pending_tasks_count
    completion_rate_tasks = (
        round((completed_tasks_count / total_tasks) * 100.0, 2)
        if total_tasks > 0
        else 0.0
    )

    # 2. Routine occurrences and completions
    user_routines = (
        db.query(Routine)
        .filter(Routine.user_id == user_id, Routine.active.is_(True))
        .all()
    )

    # Completed logs for user routines in date range
    completed_routine_logs = (
        db.query(RoutineLog)
        .join(Routine, Routine.id == RoutineLog.routine_id)
        .filter(
            Routine.user_id == user_id,
            RoutineLog.completed.is_(True),
            RoutineLog.occurrence_date >= from_date,
            RoutineLog.occurrence_date <= to_date,
        )
        .all()
    )
    completed_routine_count = len(completed_routine_logs)

    # Calculate scheduled routine occurrences in range
    scheduled_occurrences_count = 0
    num_days = (to_date - from_date).days + 1
    daily_breakdown: List[DailyBreakdownItem] = []

    # Map completed logs by date
    completed_logs_by_date = {}
    for log in completed_routine_logs:
        completed_logs_by_date[log.occurrence_date] = (
            completed_logs_by_date.get(log.occurrence_date, 0) + 1
        )

    # Group completed tasks by date
    completed_tasks_by_date = {}
    for t in in_range_completed_tasks:
        d = t.completed_at.date() if hasattr(t.completed_at, "date") else t.completed_at
        completed_tasks_by_date[d] = completed_tasks_by_date.get(d, 0) + 1

    for i in range(num_days):
        day = from_date + timedelta(days=i)
        weekday = WEEKDAY_NAMES[day.weekday()]

        # Check which routines were scheduled for this day
        for routine in user_routines:
            routine_days = [d.strip().lower() for d in routine.schedule_days.split(",")]
            if weekday in routine_days:
                scheduled_occurrences_count += 1

        day_tasks_completed = completed_tasks_by_date.get(day, 0)
        day_routines_completed = completed_logs_by_date.get(day, 0)

        daily_breakdown.append(
            DailyBreakdownItem(
                date=day,
                tasks_completed=day_tasks_completed,
                routines_completed=day_routines_completed,
            )
        )

    completion_rate_routines = (
        round(
            (completed_routine_count / scheduled_occurrences_count) * 100.0,
            2,
        )
        if scheduled_occurrences_count > 0
        else 0.0
    )

    return ProgressSummaryResponse(
        tasks_total=total_tasks,
        tasks_completed=completed_tasks_count,
        tasks_pending=pending_tasks_count,
        routines_total_occurrences=scheduled_occurrences_count,
        routines_completed_occurrences=completed_routine_count,
        completion_rate_tasks=completion_rate_tasks,
        completion_rate_routines=completion_rate_routines,
        daily_breakdown=daily_breakdown,
    )
