from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from app.schemas.task import TaskResponse


class RoutineOccurrence(BaseModel):
    routine_id: int
    name: str
    description: Optional[str] = None
    completed: bool = False
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DailyMissionsSummary(BaseModel):
    total: int
    completed: int


class DailyMissionsResponse(BaseModel):
    date: date
    tasks: List[TaskResponse]
    routine_occurrences: List[RoutineOccurrence]
    summary: DailyMissionsSummary
