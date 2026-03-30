import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.models.note import Note


class NoteRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_notes_for_user(
        self, user_id: uuid.UUID, subject_id: Optional[uuid.UUID] = None, limit: int = 50, offset: int = 0
    ) -> list[Note]:
        query = (
            select(Note)
            .options(selectinload(Note.subject))
            .where(Note.user_id == user_id)
        )
        if subject_id:
            query = query.where(Note.subject_id == subject_id)
        query = query.order_by(Note.updated_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_id(self, note_id: uuid.UUID, user_id: uuid.UUID) -> Note | None:
        result = await self.db.execute(
            select(Note)
            .options(selectinload(Note.subject))
            .where(Note.id == note_id, Note.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create(self, note: Note) -> Note:
        self.db.add(note)
        await self.db.commit()
        await self.db.refresh(note)
        return note

    async def update(self, note: Note) -> Note:
        await self.db.commit()
        await self.db.refresh(note)
        return note

    async def delete(self, note: Note) -> None:
        await self.db.delete(note)
        await self.db.commit()
