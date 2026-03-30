import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_
from sqlalchemy.orm import selectinload

from app.models.schedule_entry import ScheduleEntry, SessionFeedback
from app.repositories.base import BaseRepository


class ScheduleRepository(BaseRepository[ScheduleEntry]):
    def __init__(self, db: AsyncSession):
        super().__init__(ScheduleEntry, db)

    async def get_entries_for_user(
        self, user_id: uuid.UUID, start: datetime | None = None, end: datetime | None = None
    ) -> list[ScheduleEntry]:
        query = (
            select(ScheduleEntry)
            .options(selectinload(ScheduleEntry.subject), selectinload(ScheduleEntry.feedback))
            .where(ScheduleEntry.user_id == user_id)
        )
        if start:
            query = query.where(ScheduleEntry.start_time >= start)
        if end:
            query = query.where(ScheduleEntry.end_time <= end)
        result = await self.db.execute(query.order_by(ScheduleEntry.start_time))
        return list(result.scalars().all())

    async def bulk_insert(self, entries: list[ScheduleEntry]) -> list[ScheduleEntry]:
        for entry in entries:
            self.db.add(entry)
        await self.db.commit()
        return entries

    async def delete_future_planned(self, user_id: uuid.UUID, from_time: datetime) -> int:
        result = await self.db.execute(
            delete(ScheduleEntry).where(
                and_(
                    ScheduleEntry.user_id == user_id,
                    ScheduleEntry.start_time >= from_time,
                    ScheduleEntry.status == "planned",
                )
            )
        )
        await self.db.commit()
        return result.rowcount

    async def get_entry_with_feedback(self, entry_id: uuid.UUID, user_id: uuid.UUID) -> ScheduleEntry | None:
        result = await self.db.execute(
            select(ScheduleEntry)
            .options(selectinload(ScheduleEntry.feedback))
            .where(ScheduleEntry.id == entry_id, ScheduleEntry.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def update_status(self, entry: ScheduleEntry, status: str) -> ScheduleEntry:
        entry.status = status
        await self.db.commit()
        await self.db.refresh(entry)
        return entry

    async def get_feedback_for_user(self, user_id: uuid.UUID, limit: int = 50) -> list[SessionFeedback]:
        result = await self.db.execute(
            select(SessionFeedback)
            .options(
                selectinload(SessionFeedback.schedule_entry).selectinload(ScheduleEntry.subject)
            )
            .where(SessionFeedback.user_id == user_id)
            .order_by(SessionFeedback.submitted_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def add_feedback(self, feedback: SessionFeedback) -> SessionFeedback:
        self.db.add(feedback)
        await self.db.commit()
        await self.db.refresh(feedback)
        return feedback

    async def get_all_entries_for_stats(self, user_id: uuid.UUID) -> list[ScheduleEntry]:
        result = await self.db.execute(
            select(ScheduleEntry)
            .options(selectinload(ScheduleEntry.subject))
            .where(ScheduleEntry.user_id == user_id)
        )
        return list(result.scalars().all())

    async def get_entries_with_subjects(self, user_id: uuid.UUID) -> list[ScheduleEntry]:
        result = await self.db.execute(
            select(ScheduleEntry)
            .options(selectinload(ScheduleEntry.subject))
            .where(ScheduleEntry.user_id == user_id)
        )
        return list(result.scalars().all())
