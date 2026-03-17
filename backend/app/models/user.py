import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, TIMESTAMP, ForeignKey, Numeric, Integer, ARRAY, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    preferences: Mapped["UserPreferences"] = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")
    subjects: Mapped[list["Subject"]] = relationship("Subject", back_populates="user", cascade="all, delete-orphan")
    schedule_entries: Mapped[list["ScheduleEntry"]] = relationship("ScheduleEntry", back_populates="user", cascade="all, delete-orphan")


class UserPreferences(Base):
    __tablename__ = "user_preferences"
    __table_args__ = (
        UniqueConstraint("user_id"),
        CheckConstraint("energy_peak IN ('morning', 'afternoon', 'evening')", name="ck_energy_peak"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    available_hours_day: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False, default=4.0)
    energy_peak: Mapped[str] = mapped_column(String(20), nullable=False, default="morning")
    preferred_session_len_min: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    break_len_min: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    study_days: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=["mon", "tue", "wed", "thu", "fri"])
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="preferences")
