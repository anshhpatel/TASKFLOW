# NOTE: Reminder delivery requires the backend process to be continuously running. In this single-instance prototype, reminders are not delivered if the backend is stopped. For production, use a dedicated job queue such as Celery + Redis.

import logging
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.exc import IntegrityError

from app.core.database import SessionLocal
from app.models.notification import Notification
from app.models.reminder import Reminder
from app.models.routine import Routine
from app.models.task import Task

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def process_due_reminders() -> None:
    """Poll for due reminders and emit exactly one notification per fired date."""
    db = SessionLocal()
    try:
        now_utc = datetime.now(timezone.utc)
        today_date = now_utc.date()

        # Find enabled reminders where due_at is past or now
        due_reminders = (
            db.query(Reminder)
            .filter(
                Reminder.enabled.is_(True),
                Reminder.due_at <= now_utc,
            )
            .all()
        )

        for reminder in due_reminders:
            # Check if a notification has already been created for this reminder today
            existing = (
                db.query(Notification)
                .filter(
                    Notification.reminder_id == reminder.id,
                    Notification.fired_date == today_date,
                )
                .first()
            )
            if existing:
                continue

            # Construct notification title & body based on linked task or routine
            title = "Reminder"
            body = "You have a scheduled reminder."

            if reminder.task_id:
                task = db.query(Task).filter(Task.id == reminder.task_id).first()
                if task:
                    title = f"Task Reminder: {task.title}"
                    body = task.description or f"It is time to work on '{task.title}'."
            elif reminder.routine_id:
                routine = (
                    db.query(Routine)
                    .filter(Routine.id == reminder.routine_id)
                    .first()
                )
                if routine:
                    title = f"Routine Reminder: {routine.name}"
                    body = (
                        routine.description
                        or f"Time for your routine: '{routine.name}'."
                    )

            notification = Notification(
                user_id=reminder.user_id,
                reminder_id=reminder.id,
                title=title,
                body=body,
                created_at=now_utc,
                fired_date=today_date,
            )
            reminder.notification_sent_at = now_utc

            db.add(notification)
            try:
                db.commit()
                logger.info(
                    f"Generated notification for reminder ID {reminder.id} on {today_date}"
                )
            except IntegrityError:
                db.rollback()
                logger.warning(
                    f"Duplicate notification avoided for reminder ID {reminder.id} on {today_date}"
                )

    except Exception as exc:
        db.rollback()
        logger.error(f"Error executing reminder scheduler: {exc}", exc_info=True)
    finally:
        db.close()


def start_reminder_scheduler() -> None:
    """Start the APScheduler background polling job."""
    if not scheduler.running:
        scheduler.add_job(
            process_due_reminders,
            "interval",
            minutes=1,
            id="poll_reminders",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("APScheduler reminder background job started.")


def shutdown_reminder_scheduler() -> None:
    """Shutdown the APScheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler reminder background job stopped.")
