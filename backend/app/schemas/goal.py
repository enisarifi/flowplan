import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel


class GoalCreate(BaseModel):
    title: str
    target_type: str = "sessions"
    target_value: int
    subject_id: Optional[uuid.UUID] = None
    deadline: Optional[date] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_value: Optional[int] = None
    current_value: Optional[int] = None
    deadline: Optional[date] = None
    is_completed: Optional[bool] = None


class GoalResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    subject_id: Optional[uuid.UUID]
    title: str
    target_type: str
    target_value: int
    current_value: int
    deadline: Optional[date]
    is_completed: bool
    subject_name: Optional[str] = None
    progress_pct: float = 0.0
    created_at: datetime

    model_config = {"from_attributes": True}
