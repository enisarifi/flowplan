import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SessionCompleteRequest(BaseModel):
    actual_duration_min: Optional[int] = Field(None, ge=1, le=600)
    energy_rating: Optional[int] = Field(None, ge=1, le=5)
    difficulty_rating: Optional[int] = Field(None, ge=1, le=5)
    completion_pct: Optional[int] = Field(None, ge=0, le=100)
    notes: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: uuid.UUID
    schedule_entry_id: uuid.UUID
    actual_duration_min: Optional[int]
    energy_rating: Optional[int]
    difficulty_rating: Optional[int]
    completion_pct: Optional[int]
    notes: Optional[str]
    submitted_at: datetime

    model_config = {"from_attributes": True}


class SessionStatsResponse(BaseModel):
    total_sessions: int
    completed_sessions: int
    skipped_sessions: int
    completion_rate: float
    avg_energy_rating: Optional[float]
    avg_difficulty_rating: Optional[float]


class SubjectStatsItem(BaseModel):
    subject_id: str
    subject_name: str
    total_sessions: int
    completed_sessions: int
    completion_rate: float
    total_minutes_studied: int


class HistoryEntryItem(BaseModel):
    entry_id: str
    title: str
    subject_name: Optional[str]
    subject_color: Optional[str]
    planned_min: int
    actual_min: Optional[int]
    energy: Optional[int]
    difficulty: Optional[int]
    completion_pct: Optional[int]
    completed_at: str


class HistoryDayItem(BaseModel):
    date: str
    total_minutes: int
    session_count: int
    entries: list[HistoryEntryItem]


class WeeklyTrendItem(BaseModel):
    date: str
    sessions: int
    minutes: int


class EnergyHeatmapItem(BaseModel):
    day: int  # 0=Mon, 6=Sun
    hour: int  # 0-23
    avg_energy: float
    count: int


class WeeklySummaryResponse(BaseModel):
    week_start: str
    week_end: str
    total_sessions: int
    completed_sessions: int
    skipped_sessions: int
    total_hours_studied: float
    completion_rate: float
    avg_energy: Optional[float]
    top_subject: Optional[str]
    weakest_subject: Optional[str]
    ai_summary: Optional[str]
    ai_tips: Optional[list[str]]
