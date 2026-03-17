import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, field_validator


class SubjectCreate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()
    difficulty: int
    color_hex: str = "#6366f1"
    exam_date: Optional[date] = None
    weekly_hours_target: float = 3.0
    notes: Optional[str] = None


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    difficulty: Optional[int] = None
    color_hex: Optional[str] = None
    exam_date: Optional[date] = None
    weekly_hours_target: Optional[float] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class SubjectResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    difficulty: int
    color_hex: str
    exam_date: Optional[date]
    weekly_hours_target: float
    notes: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
