from datetime import date
from typing import List
from pydantic import BaseModel


class DailyBreakdownItem(BaseModel):
    date: date
    tasks_completed: int
    routines_completed: int


class ProgressSummaryResponse(BaseModel):
    tasks_total: int
    tasks_completed: int
    tasks_pending: int
    routines_total_occurrences: int
    routines_completed_occurrences: int
    completion_rate_tasks: float
    completion_rate_routines: float
    daily_breakdown: List[DailyBreakdownItem]
