from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from app.core.config import settings
from app.jobs.reminder_scheduler import (
    shutdown_reminder_scheduler,
    start_reminder_scheduler,
)
from app.routers import (
    auth_router,
    daily_missions_router,
    focus_support_router,
    goals_router,
    notifications_router,
    progress_router,
    reminders_router,
    routines_router,
    tasks_router,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown events."""
    logger.info("Initializing Taskflow backend...")
    # Start the reminder polling scheduler
    try:
        start_reminder_scheduler()
    except Exception as exc:
        logger.warning(f"Could not start reminder scheduler: {exc}")

    yield

    logger.info("Shutting down Taskflow backend...")
    try:
        shutdown_reminder_scheduler()
    except Exception as exc:
        logger.warning(f"Error shutting down reminder scheduler: {exc}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(OperationalError)
async def operational_error_handler(
    request: Request, exc: OperationalError
) -> JSONResponse:
    """Handle database connection or availability errors gracefully."""
    logger.error(f"Database operational error occurred: {exc}")
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Database service unavailable. Please try again later."},
    )


# Health endpoint: GET /health (no auth required)
@app.get("/health", tags=["health"], status_code=status.HTTP_200_OK)
def health_check() -> dict:
    """Health check endpoint to verify backend service availability."""
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# Include all API v1 routers
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(goals_router, prefix=api_prefix)
app.include_router(tasks_router, prefix=api_prefix)
app.include_router(routines_router, prefix=api_prefix)
app.include_router(daily_missions_router, prefix=api_prefix)
app.include_router(reminders_router, prefix=api_prefix)
app.include_router(notifications_router, prefix=api_prefix)
app.include_router(progress_router, prefix=api_prefix)
app.include_router(focus_support_router, prefix=api_prefix)
