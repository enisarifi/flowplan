import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    display_name: Optional[str] = None


class PreferencesUpdate(BaseModel):
    available_hours_day: Optional[float] = None
    energy_peak: Optional[str] = None
    preferred_session_len_min: Optional[int] = None
    break_len_min: Optional[int] = None
    study_days: Optional[list[str]] = None
    timezone: Optional[str] = None


class PreferencesResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    available_hours_day: float
    energy_peak: str
    preferred_session_len_min: int
    break_len_min: int
    study_days: list[str]
    timezone: str

    model_config = {"from_attributes": True}
