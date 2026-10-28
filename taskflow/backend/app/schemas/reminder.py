from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, model_validator


class ReminderCreate(BaseModel):
    task_id: Optional[int] = None
    routine_id: Optional[int] = None
    due_at: datetime
    enabled: Optional[bool] = True

    @model_validator(mode="after")
    def validate_target(self) -> "ReminderCreate":
        has_task = self.task_id is not None
        has_routine = self.routine_id is not None
        if has_task == has_routine:
            raise ValueError(
                "Exactly one of 'task_id' or 'routine_id' must be specified."
            )
        return self


class ReminderUpdate(BaseModel):
    due_at: Optional[datetime] = None
    enabled: Optional[bool] = None


class ReminderResponse(BaseModel):
    id: int
    user_id: int
    task_id: Optional[int] = None
    routine_id: Optional[int] = None
    due_at: datetime
    enabled: bool
    notification_sent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
