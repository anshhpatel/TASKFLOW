from datetime import date
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.progress import ProgressSummaryResponse
from app.services.progress_service import get_progress_summary

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get(
    "/summary",
    response_model=ProgressSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get progress summary",
)
def get_summary(
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProgressSummaryResponse:
    """Calculate and return task and routine progress metrics for a date range."""
    return get_progress_summary(db, current_user.id, from_date, to_date)
