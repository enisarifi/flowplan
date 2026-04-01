import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ResourceCreate(BaseModel):
    subject_id: uuid.UUID
    title: str
    url: str
    type: str = "link"
    page_ref: Optional[str] = None


class ResourceResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    subject_id: uuid.UUID
    title: str
    url: str
    type: str
    page_ref: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
