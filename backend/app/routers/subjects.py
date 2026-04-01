import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user, get_subject_repo
from app.models.user import User
from app.models.subject import Subject
from app.repositories.subject_repo import SubjectRepository
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse


class BulkSubjectItem(BaseModel):
    name: str
    difficulty: int = 3
    exam_date: Optional[str] = None
    weekly_hours_target: float = 3.0


class BulkImportRequest(BaseModel):
    subjects: list[BulkSubjectItem]

router = APIRouter()


@router.get("", response_model=list[SubjectResponse])
async def list_subjects(
    current_user: User = Depends(get_current_user),
    subject_repo: SubjectRepository = Depends(get_subject_repo),
):
    return await subject_repo.get_all_for_user(current_user.id)


@router.post("", response_model=SubjectResponse, status_code=201)
async def create_subject(
    data: SubjectCreate,
    current_user: User = Depends(get_current_user),
    subject_repo: SubjectRepository = Depends(get_subject_repo),
):
    subject = Subject(user_id=current_user.id, **data.model_dump())
    return await subject_repo.create(subject)


@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(
    subject_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    subject_repo: SubjectRepository = Depends(get_subject_repo),
):
    subject = await subject_repo.get_user_subject(current_user.id, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


@router.patch("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: uuid.UUID,
    data: SubjectUpdate,
    current_user: User = Depends(get_current_user),
    subject_repo: SubjectRepository = Depends(get_subject_repo),
):
    subject = await subject_repo.get_user_subject(current_user.id, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    kwargs = {k: v for k, v in data.model_dump().items() if v is not None}
    return await subject_repo.update(subject, **kwargs)


@router.delete("/{subject_id}", status_code=204)
async def delete_subject(
    subject_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    subject_repo: SubjectRepository = Depends(get_subject_repo),
):
    subject = await subject_repo.get_user_subject(current_user.id, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    await subject_repo.update(subject, is_active=False)


@router.post("/bulk-import", response_model=list[SubjectResponse], status_code=201)
async def bulk_import_subjects(
    data: BulkImportRequest,
    current_user: User = Depends(get_current_user),
    subject_repo: SubjectRepository = Depends(get_subject_repo),
):
    created = []
    for item in data.subjects:
        subject = Subject(
            user_id=current_user.id,
            name=item.name,
            difficulty=min(max(item.difficulty, 1), 5),
            exam_date=item.exam_date,
            weekly_hours_target=item.weekly_hours_target,
        )
        result = await subject_repo.create(subject)
        created.append(result)
    return created
