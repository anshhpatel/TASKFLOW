from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    status: Optional[str] = "pending"
    deadline: Optional[datetime] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    goal_id: Optional[int] = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Task title cannot be blank")
        return v.strip()

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> str:
        if v is None:
            return "medium"
        valid_priorities = {"low", "medium", "high"}
        if v.lower() not in valid_priorities:
            raise ValueError(f"Priority must be one of {valid_priorities}")
        return v.lower()

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> str:
        if v is None:
            return "pending"
        valid_statuses = {"pending", "completed"}
        if v.lower() not in valid_statuses:
            raise ValueError(f"Status must be one of {valid_statuses}")
        return v.lower()

    @model_validator(mode="after")
    def validate_schedule_times(self) -> "TaskCreate":
        if self.scheduled_start and self.scheduled_end:
            if self.scheduled_end < self.scheduled_start:
                raise ValueError("scheduled_end cannot be earlier than scheduled_start")
        return self


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    goal_id: Optional[int] = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank_if_provided(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v or not v.strip():
                raise ValueError("Task title cannot be blank")
            return v.strip()
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority_if_provided(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_priorities = {"low", "medium", "high"}
            if v.lower() not in valid_priorities:
                raise ValueError(f"Priority must be one of {valid_priorities}")
            return v.lower()
        return v

    @field_validator("status")
    @classmethod
    def validate_status_if_provided(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_statuses = {"pending", "completed"}
            if v.lower() not in valid_statuses:
                raise ValueError(f"Status must be one of {valid_statuses}")
            return v.lower()
        return v

    @model_validator(mode="after")
    def validate_schedule_times(self) -> "TaskUpdate":
        if self.scheduled_start and self.scheduled_end:
            if self.scheduled_end < self.scheduled_start:
                raise ValueError("scheduled_end cannot be earlier than scheduled_start")
        return self


class TaskResponse(BaseModel):
    id: int
    user_id: int
    goal_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    deadline: Optional[datetime] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
