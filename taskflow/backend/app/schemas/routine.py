from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

VALID_WEEKDAYS = {"mon", "tue", "wed", "thu", "fri", "sat", "sun"}


class RoutineCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    schedule_days: str = Field(..., min_length=1)
    active: Optional[bool] = True

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Routine name cannot be blank")
        return v.strip()

    @field_validator("schedule_days")
    @classmethod
    def validate_schedule_days(cls, v: str) -> str:
        days = [d.strip().lower() for d in v.split(",") if d.strip()]
        if not days:
            raise ValueError("schedule_days must include at least one valid day")
        for day in days:
            if day not in VALID_WEEKDAYS:
                raise ValueError(
                    f"Invalid day '{day}'. Must be one of {', '.join(sorted(VALID_WEEKDAYS))}"
                )
        return ",".join(days)


class RoutineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    schedule_days: Optional[str] = None
    active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank_if_provided(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v or not v.strip():
                raise ValueError("Routine name cannot be blank")
            return v.strip()
        return v

    @field_validator("schedule_days")
    @classmethod
    def validate_schedule_days_if_provided(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            days = [d.strip().lower() for d in v.split(",") if d.strip()]
            if not days:
                raise ValueError("schedule_days must include at least one valid day")
            for day in days:
                if day not in VALID_WEEKDAYS:
                    raise ValueError(
                        f"Invalid day '{day}'. Must be one of {', '.join(sorted(VALID_WEEKDAYS))}"
                    )
            return ",".join(days)
        return v


class RoutineResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    schedule_days: str
    active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoutineTodayResponse(RoutineResponse):
    is_completed_today: bool = False
    completed_at: Optional[datetime] = None


class RoutineCompletionUpdate(BaseModel):
    completed: bool = True
