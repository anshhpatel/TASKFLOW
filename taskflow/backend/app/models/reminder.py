from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    task_id = Column(
        Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True
    )
    routine_id = Column(
        Integer, ForeignKey("routines.id", ondelete="CASCADE"), nullable=True, index=True
    )
    due_at = Column(DateTime(timezone=True), nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)
    notification_sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint(
            "(task_id IS NOT NULL AND routine_id IS NULL) OR (task_id IS NULL AND routine_id IS NOT NULL)",
            name="ck_reminder_target",
        ),
    )

    user = relationship("User", back_populates="reminders")
    task = relationship("Task", back_populates="reminders")
    routine = relationship("Routine", back_populates="reminders")
    notifications = relationship("Notification", back_populates="reminder")
