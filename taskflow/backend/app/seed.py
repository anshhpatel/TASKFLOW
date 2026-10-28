"""
Taskflow Seed Data Script
Creates reproducible demo data for local demonstration and evaluation.
Usage:
    cd taskflow/backend
    python -m app.seed
"""
import sys
import os
from datetime import datetime, date, timedelta, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.goal import Goal
from app.models.task import Task
from app.models.routine import Routine
from app.models.routine_log import RoutineLog
from app.models.reminder import Reminder
from app.models.notification import Notification


def seed_database():
    print("Ensuring database schema exists...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        demo_email = "alex@taskflow.dev"
        existing = db.query(User).filter(User.email == demo_email).first()
        if existing:
            print(f"Demo user '{demo_email}' already exists. Skipping seed.")
            return

        print(f"Creating demo user: {demo_email}")
        user = User(
            name="Alex River",
            email=demo_email,
            password_hash=get_password_hash("TaskflowDemo123!"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        today = date.today()
        now = datetime.now(timezone.utc)

        # 1. Goals
        print("Creating demo goals...")
        goal1 = Goal(
            user_id=user.id,
            title="Master Modern Web Stack",
            description="Build scalable full-stack applications with React, TypeScript, and FastAPI.",
            target_date=today + timedelta(days=45),
            status="active",
        )
        goal2 = Goal(
            user_id=user.id,
            title="Consistent Wellness & Health",
            description="Daily physical activity and deliberate evening reflection.",
            target_date=today + timedelta(days=60),
            status="active",
        )
        db.add_all([goal1, goal2])
        db.commit()
        db.refresh(goal1)
        db.refresh(goal2)

        # 2. Tasks
        print("Creating demo tasks...")
        task1 = Task(
            user_id=user.id,
            goal_id=goal1.id,
            title="Design Clean REST API & Database Schema",
            description="Finalize OpenAPI contracts, Alembic migrations, and SQLAlchemy models.",
            priority="high",
            status="completed",
            deadline=now - timedelta(hours=2),
            completed_at=now - timedelta(hours=1),
        )
        task2 = Task(
            user_id=user.id,
            goal_id=goal1.id,
            title="Complete Responsive React Frontend Slice",
            description="Implement Tailwind CSS views, modal forms, and token-based client.",
            priority="high",
            status="pending",
            deadline=now + timedelta(hours=4),
            scheduled_start=now + timedelta(hours=1),
        )
        task3 = Task(
            user_id=user.id,
            goal_id=goal1.id,
            title="Execute Apache JMeter Test Suite",
            description="Collect genuine throughput and latency benchmarks against local endpoints.",
            priority="medium",
            status="pending",
            deadline=now + timedelta(days=1),
        )
        task4 = Task(
            user_id=user.id,
            goal_id=goal2.id,
            title="30-Minute Outdoor Aerobic Session",
            description="Brisk walk or light cardio to disconnect and reset focus.",
            priority="low",
            status="completed",
            scheduled_start=now - timedelta(hours=3),
            completed_at=now - timedelta(hours=2),
        )
        db.add_all([task1, task2, task3, task4])
        db.commit()
        db.refresh(task2)

        # 3. Routines
        print("Creating demo routines...")
        routine1 = Routine(
            user_id=user.id,
            name="Morning Planning & Priority Review",
            description="Review today's Daily Missions and select the primary high-focus task.",
            schedule_days="mon,tue,wed,thu,fri",
            active=True,
        )
        routine2 = Routine(
            user_id=user.id,
            name="Evening Reflection & Shutdown",
            description="Log daily achievements, celebrate small wins, and plan tomorrow's focus.",
            schedule_days="mon,tue,wed,thu,fri,sat,sun",
            active=True,
        )
        db.add_all([routine1, routine2])
        db.commit()
        db.refresh(routine1)
        db.refresh(routine2)

        # 4. Routine completion log for today (Morning routine completed)
        routine_log = RoutineLog(
            routine_id=routine1.id,
            occurrence_date=today,
            completed=True,
            completed_at=now - timedelta(hours=4),
        )
        db.add(routine_log)
        db.commit()

        # 5. Reminders
        print("Creating demo reminders...")
        reminder1 = Reminder(
            user_id=user.id,
            task_id=task2.id,
            due_at=now + timedelta(hours=2),
            enabled=True,
        )
        reminder2 = Reminder(
            user_id=user.id,
            routine_id=routine2.id,
            due_at=now + timedelta(hours=6),
            enabled=True,
        )
        db.add_all([reminder1, reminder2])
        db.commit()
        db.refresh(reminder1)

        # 6. Notification (demonstrating in-app notification inbox)
        print("Creating demo notification...")
        notification = Notification(
            user_id=user.id,
            reminder_id=reminder1.id,
            title="Upcoming Focus Task Due",
            body="Remember to finalize the responsive frontend view for Taskflow today.",
            fired_date=today,
            read_at=None,
        )
        db.add(notification)
        db.commit()

        print("\n=== Demo Seed Completed Successfully ===")
        print(f"Credentials:")
        print(f"  Email:    {demo_email}")
        print(f"  Password: TaskflowDemo123!")
        print("========================================")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
