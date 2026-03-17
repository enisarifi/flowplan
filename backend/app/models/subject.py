import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, Boolean, TIMESTAMP, ForeignKey, Numeric, Integer, SmallInteger, Text, Date, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Subject(Base):
    __tablename__ = "subjects"
    __table_args__ = (
        CheckConstraint("difficulty BETWEEN 1 AND 5", name="ck_subject_difficulty"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    color_hex: Mapped[str] = mapped_column(String(7), nullable=False, default="#6366f1")
    difficulty: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    exam_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    weekly_hours_target: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False, default=3.0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="subjects")
    schedule_entries: Mapped[list["ScheduleEntry"]] = relationship("ScheduleEntry", back_populates="subject")
