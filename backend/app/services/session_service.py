import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.schedule_entry import SessionFeedback
from app.repositories.schedule_repo import ScheduleRepository
from app.services.ai_service import AIService
from app.schemas.feedback import SessionCompleteRequest, SessionStatsResponse, SubjectStatsItem, WeeklySummaryResponse, WeeklyTrendItem, EnergyHeatmapItem, HistoryDayItem, HistoryEntryItem


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

    async def get_subject_stats(self, user_id: uuid.UUID) -> list[SubjectStatsItem]:
        entries = await self.schedule_repo.get_entries_with_subjects(user_id)
        groups: dict[str, dict] = {}
        for entry in entries:
            if not entry.subject:
                continue
            sid = str(entry.subject_id)
            if sid not in groups:
                groups[sid] = {
                    "subject_id": sid,
                    "subject_name": entry.subject.name,
                    "total": 0,
                    "completed": 0,
                    "minutes": 0,
                }
            groups[sid]["total"] += 1
            if entry.status == "completed":
                groups[sid]["completed"] += 1
                groups[sid]["minutes"] += entry.duration_min

        return sorted(
            [
                SubjectStatsItem(
                    subject_id=g["subject_id"],
                    subject_name=g["subject_name"],
                    total_sessions=g["total"],
                    completed_sessions=g["completed"],
                    completion_rate=round(g["completed"] / g["total"] * 100, 1) if g["total"] else 0.0,
                    total_minutes_studied=g["minutes"],
                )
                for g in groups.values()
            ],
            key=lambda x: x.subject_name,
        )

    async def get_weekly_summary(self, user_id: uuid.UUID) -> WeeklySummaryResponse:
        now = datetime.now(timezone.utc)
        week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=7)

        entries = await self.schedule_repo.get_all_entries_for_stats(user_id)
        week_entries = [e for e in entries if e.start_time and week_start <= e.start_time < week_end]

        total = len(week_entries)
        completed = sum(1 for e in week_entries if e.status == "completed")
        skipped = sum(1 for e in week_entries if e.status == "skipped")
        total_minutes = sum(e.duration_min for e in week_entries if e.status == "completed")

        feedback_rows = await self.schedule_repo.get_feedback_for_user(user_id, limit=200)
        week_feedback = [f for f in feedback_rows if f.submitted_at and week_start <= f.submitted_at < week_end]
        energy_ratings = [f.energy_rating for f in week_feedback if f.energy_rating]
        avg_energy = round(sum(energy_ratings) / len(energy_ratings), 1) if energy_ratings else None

        # Per-subject breakdown for the week
        subject_mins: dict[str, int] = {}
        for e in week_entries:
            if e.status == "completed" and e.subject:
                name = e.subject.name
                subject_mins[name] = subject_mins.get(name, 0) + e.duration_min

        top_subject = max(subject_mins, key=subject_mins.get) if subject_mins else None

        subject_completion: dict[str, dict] = {}
        for e in week_entries:
            if e.subject:
                name = e.subject.name
                if name not in subject_completion:
                    subject_completion[name] = {"total": 0, "completed": 0}
                subject_completion[name]["total"] += 1
                if e.status == "completed":
                    subject_completion[name]["completed"] += 1

        weakest_subject = None
        lowest_rate = 100.0
        for name, data in subject_completion.items():
            rate = (data["completed"] / data["total"] * 100) if data["total"] > 0 else 0
            if rate < lowest_rate and data["total"] >= 2:
                lowest_rate = rate
                weakest_subject = name

        # AI summary
        ai_summary = None
        ai_tips = None
        if total > 0:
            try:
                ai_service = AIService()
                stats_text = f"""Week: {week_start.strftime('%b %d')} - {week_end.strftime('%b %d')}
Total sessions: {total}, Completed: {completed}, Skipped: {skipped}
Hours studied: {round(total_minutes / 60, 1)}h
Completion rate: {round(completed / total * 100, 1)}%
Average energy: {avg_energy or 'N/A'}/5
Top subject by time: {top_subject or 'N/A'}
Weakest subject: {weakest_subject or 'N/A'} ({round(lowest_rate, 1)}% completion)
Subjects studied: {', '.join(f'{name} ({mins}min)' for name, mins in subject_mins.items())}"""

                result = await ai_service.generate_weekly_summary(stats_text)
                ai_summary = result.get("summary")
                ai_tips = result.get("tips", [])
            except Exception:
                pass

        return WeeklySummaryResponse(
            week_start=week_start.isoformat(),
            week_end=week_end.isoformat(),
            total_sessions=total,
            completed_sessions=completed,
            skipped_sessions=skipped,
            total_hours_studied=round(total_minutes / 60, 1),
            completion_rate=round(completed / total * 100, 1) if total else 0.0,
            avg_energy=avg_energy,
            top_subject=top_subject,
            weakest_subject=weakest_subject,
            ai_summary=ai_summary,
            ai_tips=ai_tips,
        )

    async def get_weekly_trend(self, user_id: uuid.UUID) -> list[WeeklyTrendItem]:
        entries = await self.schedule_repo.get_all_entries_for_stats(user_id)
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(days=28)

        day_data: dict[str, dict] = {}
        for e in entries:
            if not e.start_time or e.start_time < cutoff:
                continue
            day_str = e.start_time.strftime("%Y-%m-%d")
            if day_str not in day_data:
                day_data[day_str] = {"sessions": 0, "minutes": 0}
            if e.status == "completed":
                day_data[day_str]["sessions"] += 1
                day_data[day_str]["minutes"] += e.duration_min

        return sorted(
            [WeeklyTrendItem(date=d, sessions=v["sessions"], minutes=v["minutes"]) for d, v in day_data.items()],
            key=lambda x: x.date,
        )

    async def get_energy_heatmap(self, user_id: uuid.UUID) -> list[EnergyHeatmapItem]:
        feedback_rows = await self.schedule_repo.get_feedback_for_user(user_id, limit=500)
        grid: dict[tuple[int, int], list[int]] = {}

        for f in feedback_rows:
            if not f.energy_rating or not f.schedule_entry or not f.schedule_entry.start_time:
                continue
            day = f.schedule_entry.start_time.weekday()
            hour = f.schedule_entry.start_time.hour
            grid.setdefault((day, hour), []).append(f.energy_rating)

        return [
            EnergyHeatmapItem(
                day=day,
                hour=hour,
                avg_energy=round(sum(ratings) / len(ratings), 1),
                count=len(ratings),
            )
            for (day, hour), ratings in grid.items()
        ]

    async def get_history(self, user_id: uuid.UUID, days: int = 28, subject_id: uuid.UUID | None = None) -> list[HistoryDayItem]:
        entries = await self.schedule_repo.get_all_entries_for_stats(user_id)
        feedback_rows = await self.schedule_repo.get_feedback_for_user(user_id, limit=500)
        feedback_map = {str(f.schedule_entry_id): f for f in feedback_rows}

        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        completed = [
            e for e in entries
            if e.status == "completed" and e.start_time and e.start_time >= cutoff
            and (subject_id is None or str(e.subject_id) == str(subject_id))
        ]

        day_groups: dict[str, list] = {}
        for e in completed:
            day_str = e.start_time.strftime("%Y-%m-%d")
            fb = feedback_map.get(str(e.id))
            item = HistoryEntryItem(
                entry_id=str(e.id),
                title=e.title or "Study session",
                subject_name=e.subject.name if e.subject else None,
                subject_color=e.subject.color_hex if e.subject else None,
                planned_min=e.duration_min,
                actual_min=fb.actual_duration_min if fb else None,
                energy=fb.energy_rating if fb else None,
                difficulty=fb.difficulty_rating if fb else None,
                completion_pct=fb.completion_pct if fb else None,
                completed_at=e.start_time.isoformat(),
            )
            day_groups.setdefault(day_str, []).append(item)

        return sorted(
            [
                HistoryDayItem(
                    date=day,
                    total_minutes=sum(e.actual_min or e.planned_min for e in items),
                    session_count=len(items),
                    entries=sorted(items, key=lambda x: x.completed_at),
                )
                for day, items in day_groups.items()
            ],
            key=lambda x: x.date,
            reverse=True,
        )
