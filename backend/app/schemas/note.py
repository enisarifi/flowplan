import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class NoteCreate(BaseModel):
    title: str
    content: str = ""
    subject_id: Optional[uuid.UUID] = None
    schedule_entry_id: Optional[uuid.UUID] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    subject_id: Optional[uuid.UUID] = None


class NoteResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    subject_id: Optional[uuid.UUID]
    schedule_entry_id: Optional[uuid.UUID]
    title: str
    content: str
    subject_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
