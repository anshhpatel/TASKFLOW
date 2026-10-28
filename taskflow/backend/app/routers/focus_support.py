from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.focus import FocusSupportRequest, FocusSupportResponse
from app.services.focus_service import get_focus_suggestion

router = APIRouter(prefix="/focus-support", tags=["focus-support"])


@router.post(
    "/suggestion",
    response_model=FocusSupportResponse,
    status_code=status.HTTP_200_OK,
    summary="Get actionable focus or anti-slump suggestion",
)
def get_suggestion(
    req: FocusSupportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FocusSupportResponse:
    """Return a deterministic next-step suggestion without modifying task data."""
    return get_focus_suggestion(db, current_user.id, req)
