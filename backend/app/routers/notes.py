import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.note import Note
from app.repositories.note_repo import NoteRepository
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter()


def get_note_repo(db: AsyncSession = Depends(get_db)) -> NoteRepository:
    return NoteRepository(db)


@router.get("", response_model=list[NoteResponse])
async def list_notes(
    subject_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    repo: NoteRepository = Depends(get_note_repo),
):
    notes = await repo.get_notes_for_user(current_user.id, subject_id, limit, offset)
    return [
        NoteResponse(
            **{c.key: getattr(n, c.key) for c in n.__table__.columns},
            subject_name=n.subject.name if n.subject else None,
        )
        for n in notes
    ]


@router.post("", response_model=NoteResponse, status_code=201)
async def create_note(
    data: NoteCreate,
    current_user: User = Depends(get_current_user),
    repo: NoteRepository = Depends(get_note_repo),
):
    note = Note(
        user_id=current_user.id,
        title=data.title,
        content=data.content,
        subject_id=data.subject_id,
        schedule_entry_id=data.schedule_entry_id,
    )
    created = await repo.create(note)
    return NoteResponse(
        **{c.key: getattr(created, c.key) for c in created.__table__.columns},
        subject_name=created.subject.name if created.subject else None,
    )


@router.patch("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: uuid.UUID,
    data: NoteUpdate,
    current_user: User = Depends(get_current_user),
    repo: NoteRepository = Depends(get_note_repo),
):
    note = await repo.get_by_id(note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if data.title is not None:
        note.title = data.title
    if data.content is not None:
        note.content = data.content
    if data.subject_id is not None:
        note.subject_id = data.subject_id

    updated = await repo.update(note)
    return NoteResponse(
        **{c.key: getattr(updated, c.key) for c in updated.__table__.columns},
        subject_name=updated.subject.name if updated.subject else None,
    )


@router.delete("/{note_id}", status_code=204)
async def delete_note(
    note_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    repo: NoteRepository = Depends(get_note_repo),
):
    note = await repo.get_by_id(note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    await repo.delete(note)
