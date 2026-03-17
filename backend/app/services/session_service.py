import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.schedule_entry import SessionFeedback
from app.repositories.schedule_repo import ScheduleRepository
from app.schemas.feedback import SessionCompleteRequest, SessionStatsResponse


class SessionService:
    def __init__(self, db: AsyncSession):
        self.schedule_repo = ScheduleRepository(db)

    async def complete(self, user_id: uuid.UUID, entry_id: uuid.UUID, data: SessionCompleteRequest):
        entry = await self.schedule_repo.get_entry_with_feedback(entry_id, user_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Session not found")

        await self.schedule_repo.update_status(entry, "completed")

        feedback = SessionFeedback(
            schedule_entry_id=entry.id,
            user_id=user_id,
            actual_duration_min=data.actual_duration_min,
            energy_rating=data.energy_rating,
            difficulty_rating=data.difficulty_rating,
            completion_pct=data.completion_pct,
            notes=data.notes,
        )
        return await self.schedule_repo.add_feedback(feedback)

    async def skip(self, user_id: uuid.UUID, entry_id: uuid.UUID):
        entry = await self.schedule_repo.get_entry_with_feedback(entry_id, user_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Session not found")
        return await self.schedule_repo.update_status(entry, "skipped")

    async def get_stats(self, user_id: uuid.UUID) -> SessionStatsResponse:
        entries = await self.schedule_repo.get_all_entries_for_stats(user_id)
        total = len(entries)
        completed = sum(1 for e in entries if e.status == "completed")
        skipped = sum(1 for e in entries if e.status == "skipped")

        feedback_rows = await self.schedule_repo.get_feedback_for_user(user_id, limit=1000)
        energy_ratings = [f.energy_rating for f in feedback_rows if f.energy_rating]
        difficulty_ratings = [f.difficulty_rating for f in feedback_rows if f.difficulty_rating]

        return SessionStatsResponse(
            total_sessions=total,
            completed_sessions=completed,
            skipped_sessions=skipped,
            completion_rate=round(completed / total * 100, 1) if total else 0.0,
            avg_energy_rating=round(sum(energy_ratings) / len(energy_ratings), 2) if energy_ratings else None,
            avg_difficulty_rating=round(sum(difficulty_ratings) / len(difficulty_ratings), 2) if difficulty_ratings else None,
        )
