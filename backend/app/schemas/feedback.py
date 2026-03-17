import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SessionCompleteRequest(BaseModel):
    actual_duration_min: Optional[int] = None
    energy_rating: Optional[int] = None
    difficulty_rating: Optional[int] = None
    completion_pct: Optional[int] = None
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
