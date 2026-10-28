from app.routers.auth import router as auth_router
from app.routers.daily_missions import router as daily_missions_router
from app.routers.focus_support import router as focus_support_router
from app.routers.goals import router as goals_router
from app.routers.notifications import router as notifications_router
from app.routers.progress import router as progress_router
from app.routers.reminders import router as reminders_router
from app.routers.routines import router as routines_router
from app.routers.tasks import router as tasks_router

__all__ = [
    "auth_router",
    "goals_router",
    "tasks_router",
    "routines_router",
    "daily_missions_router",
    "reminders_router",
    "notifications_router",
    "progress_router",
    "focus_support_router",
]
