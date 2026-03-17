import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.subject import Subject
from app.repositories.base import BaseRepository


class SubjectRepository(BaseRepository[Subject]):
    def __init__(self, db: AsyncSession):
        super().__init__(Subject, db)

    async def get_all_for_user(self, user_id: uuid.UUID, active_only: bool = True) -> list[Subject]:
        query = select(Subject).where(Subject.user_id == user_id)
        if active_only:
            query = query.where(Subject.is_active == True)
        result = await self.db.execute(query.order_by(Subject.created_at))
        return list(result.scalars().all())

    async def get_user_subject(self, user_id: uuid.UUID, subject_id: uuid.UUID) -> Subject | None:
        result = await self.db.execute(
            select(Subject).where(Subject.id == subject_id, Subject.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def update(self, subject: Subject, **kwargs) -> Subject:
        for key, value in kwargs.items():
            if value is not None:
                setattr(subject, key, value)
        await self.db.commit()
        await self.db.refresh(subject)
        return subject
