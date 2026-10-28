from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    reminder_id: Optional[int] = None
    title: str
    body: str
    created_at: datetime
    read_at: Optional[datetime] = None
    fired_date: date

    model_config = ConfigDict(from_attributes=True)
