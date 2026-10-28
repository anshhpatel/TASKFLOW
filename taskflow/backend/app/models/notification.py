from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reminder_id = Column(
        Integer, ForeignKey("reminders.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    read_at = Column(DateTime(timezone=True), nullable=True)
    fired_date = Column(Date, nullable=False)

    __table_args__ = (
        UniqueConstraint("reminder_id", "fired_date", name="uq_reminder_fired_date"),
    )

    user = relationship("User", back_populates="notifications")
    reminder = relationship("Reminder", back_populates="notifications")
