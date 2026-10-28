from datetime import date, datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.daily_missions import DailyMissionsResponse
from app.services.daily_missions_service import get_daily_missions

router = APIRouter(prefix="/daily-missions", tags=["daily-missions"])


@router.get(
    "",
    response_model=DailyMissionsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get aggregated daily missions for date",
)
def get_missions_for_date(
    target_date: Optional[date] = Query(None, alias="date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DailyMissionsResponse:
    """Aggregate tasks (due or scheduled) and active routine occurrences for a given date."""
    if target_date is None:
        target_date = datetime.now(timezone.utc).date()
    return get_daily_missions(db, current_user.id, target_date)
