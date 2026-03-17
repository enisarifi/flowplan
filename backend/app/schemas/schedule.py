import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ScheduleEntryResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    subject_id: uuid.UUID
    title: str
    start_time: datetime
    end_time: datetime
    duration_min: int
    status: str
    ai_suggested_topic: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class GenerateScheduleRequest(BaseModel):
    start_date: Optional[str] = None  # ISO date string, defaults to next Monday


class AIScheduleEntrySchema(BaseModel):
    subject_name: str
    title: str
    start_time: str
    end_time: str
    suggested_topic: Optional[str] = None


class AIScheduleResponseSchema(BaseModel):
    schedule: list[AIScheduleEntrySchema]
    reasoning: Optional[str] = None
