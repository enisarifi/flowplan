import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, TIMESTAMP, ForeignKey, Text, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class ScheduleEntry(Base):
    __tablename__ = "schedule_entries"
    __table_args__ = (
        CheckConstraint("status IN ('planned', 'completed', 'skipped', 'rescheduled')", name="ck_entry_status"),
        Index("idx_schedule_entries_user_start", "user_id", "start_time"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    generation_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_generation_logs.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    start_time: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="planned")
    ai_suggested_topic: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="schedule_entries")
    subject: Mapped["Subject"] = relationship("Subject", back_populates="schedule_entries")
    feedback: Mapped["SessionFeedback"] = relationship("SessionFeedback", back_populates="schedule_entry", uselist=False, cascade="all, delete-orphan")

    @property
    def duration_min(self) -> int:
        return int((self.end_time - self.start_time).total_seconds() / 60)


class SessionFeedback(Base):
    __tablename__ = "session_feedback"
    __table_args__ = (
        CheckConstraint("energy_rating BETWEEN 1 AND 5", name="ck_energy_rating"),
        CheckConstraint("difficulty_rating BETWEEN 1 AND 5", name="ck_difficulty_rating"),
        CheckConstraint("completion_pct BETWEEN 0 AND 100", name="ck_completion_pct"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schedule_entry_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("schedule_entries.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    actual_duration_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    energy_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    difficulty_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completion_pct: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))

    schedule_entry: Mapped["ScheduleEntry"] = relationship("ScheduleEntry", back_populates="feedback")
