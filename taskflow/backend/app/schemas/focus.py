from typing import Optional
from pydantic import BaseModel


class FocusSupportRequest(BaseModel):
    task_id: Optional[int] = None


class FocusSupportResponse(BaseModel):
    suggestion: str
    tip: str
    task_title: Optional[str] = None
