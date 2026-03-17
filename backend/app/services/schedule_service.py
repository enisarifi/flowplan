import uuid
from datetime import datetime, timezone, date
from dateutil import parser as dateutil_parser

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schedule_entry import ScheduleEntry, SessionFeedback
from app.models.ai_log import AIGenerationLog
from app.repositories.user_repo import UserRepository
from app.repositories.subject_repo import SubjectRepository
from app.repositories.schedule_repo import ScheduleRepository
from app.services.ai_service import AIService, AIResponseValidationError
from app.schemas.schedule import AIScheduleEntrySchema


class ScheduleService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.subject_repo = SubjectRepository(db)
        self.schedule_repo = ScheduleRepository(db)
        self.ai_service = AIService()

    async def generate(self, user_id: uuid.UUID, start_date_str: str | None = None) -> list[ScheduleEntry]:
        prefs = await self.user_repo.get_preferences(user_id)
        if not prefs:
            raise ValueError("User preferences not set. Complete onboarding first.")

        subjects = await self.subject_repo.get_all_for_user(user_id, active_only=True)
        if not subjects:
            raise ValueError("No active subjects found. Add subjects first.")

        start_date: date | None = None
        if start_date_str:
            start_date = dateutil_parser.parse(start_date_str).date()

        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        await self.schedule_repo.delete_future_planned(user_id, today_start)

        parsed, prompt_tokens, completion_tokens = self.ai_service.generate_schedule(prefs, subjects, start_date)

        log = AIGenerationLog(
            user_id=user_id,
            generation_type="initial",
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            model_used=self.ai_service.model,
            raw_response={"schedule": [e.model_dump() for e in parsed.schedule], "reasoning": parsed.reasoning},
        )
        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(log)

        subject_map = {s.name: s for s in subjects}
        entries = []
        for item in parsed.schedule:
            subject = subject_map[item.subject_name]
            entry = ScheduleEntry(
                user_id=user_id,
                subject_id=subject.id,
                generation_id=log.id,
                title=item.title,
                start_time=dateutil_parser.parse(item.start_time),
                end_time=dateutil_parser.parse(item.end_time),
                status="planned",
                ai_suggested_topic=item.suggested_topic,
            )
            entries.append(entry)

        return await self.schedule_repo.bulk_insert(entries)

    async def adapt(self, user_id: uuid.UUID, start_date_str: str | None = None) -> list[ScheduleEntry]:
        prefs = await self.user_repo.get_preferences(user_id)
        if not prefs:
            raise ValueError("User preferences not set.")

        subjects = await self.subject_repo.get_all_for_user(user_id, active_only=True)
        feedback_rows = await self.schedule_repo.get_feedback_for_user(user_id, limit=50)

        start_date: date | None = None
        if start_date_str:
            start_date = dateutil_parser.parse(start_date_str).date()

        parsed, prompt_tokens, completion_tokens = self.ai_service.adapt_schedule(
            prefs, subjects, feedback_rows, start_date
        )

        log = AIGenerationLog(
            user_id=user_id,
            generation_type="adaptation",
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            model_used=self.ai_service.model,
            raw_response={"schedule": [e.model_dump() for e in parsed.schedule], "reasoning": parsed.reasoning},
        )
        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(log)

        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        await self.schedule_repo.delete_future_planned(user_id, today_start)

        subject_map = {s.name: s for s in subjects}
        entries = []
        for item in parsed.schedule:
            subject = subject_map.get(item.subject_name)
            if not subject:
                continue
            entry = ScheduleEntry(
                user_id=user_id,
                subject_id=subject.id,
                generation_id=log.id,
                title=item.title,
                start_time=dateutil_parser.parse(item.start_time),
                end_time=dateutil_parser.parse(item.end_time),
                status="planned",
                ai_suggested_topic=item.suggested_topic,
            )
            entries.append(entry)

        return await self.schedule_repo.bulk_insert(entries)
