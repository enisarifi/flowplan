import logging
import uuid
from datetime import datetime, date as date_type
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

logger = logging.getLogger(__name__)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user, get_schedule_repo
from app.models.user import User
from app.models.subject import Subject
from app.repositories.schedule_repo import ScheduleRepository
from app.services.schedule_service import ScheduleService
from app.services.ai_service import AIResponseValidationError, AIService
from app.schemas.schedule import ScheduleEntryResponse, GenerateScheduleRequest

router = APIRouter()


def get_schedule_service(db: AsyncSession = Depends(get_db)) -> ScheduleService:
    return ScheduleService(db)


@router.get("", response_model=list[ScheduleEntryResponse])
async def get_schedule(
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    schedule_repo: ScheduleRepository = Depends(get_schedule_repo),
):
    return await schedule_repo.get_entries_for_user(current_user.id, start, end)


@router.post("/generate", response_model=list[ScheduleEntryResponse], status_code=201)
async def generate_schedule(
    data: GenerateScheduleRequest,
    current_user: User = Depends(get_current_user),
    service: ScheduleService = Depends(get_schedule_service),
):
    try:
        return await service.generate(current_user.id, data.start_date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except AIResponseValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/adapt", response_model=list[ScheduleEntryResponse], status_code=201)
async def adapt_schedule(
    data: GenerateScheduleRequest,
    current_user: User = Depends(get_current_user),
    service: ScheduleService = Depends(get_schedule_service),
):
    try:
        return await service.adapt(current_user.id, data.start_date)
    except ValueError as e:
        logger.error("adapt ValueError: %s", e)
        raise HTTPException(status_code=400, detail=str(e))
    except AIResponseValidationError as e:
        logger.error("adapt AIResponseValidationError: %s", e)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("adapt unexpected error")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/future", status_code=204)
async def delete_future_schedule(
    current_user: User = Depends(get_current_user),
    schedule_repo: ScheduleRepository = Depends(get_schedule_repo),
):
    from datetime import timezone
    now = datetime.now(timezone.utc)
    await schedule_repo.delete_future_planned(current_user.id, now)


@router.get("/export/ical")
async def export_ical(
    current_user: User = Depends(get_current_user),
    schedule_repo: ScheduleRepository = Depends(get_schedule_repo),
):
    from fastapi.responses import Response
    entries = await schedule_repo.get_entries_for_user(current_user.id)

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//FlowPlan//Study Schedule//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:FlowPlan Study Schedule",
    ]

    for entry in entries:
        start = entry.start_time.strftime("%Y%m%dT%H%M%SZ")
        end = entry.end_time.strftime("%Y%m%dT%H%M%SZ")
        summary = entry.title or "Study Session"
        description = entry.ai_suggested_topic or ""
        status_map = {"planned": "TENTATIVE", "completed": "CONFIRMED", "skipped": "CANCELLED"}

        lines.extend([
            "BEGIN:VEVENT",
            f"DTSTART:{start}",
            f"DTEND:{end}",
            f"SUMMARY:{summary}",
            f"DESCRIPTION:{description}",
            f"STATUS:{status_map.get(entry.status, 'TENTATIVE')}",
            f"UID:{entry.id}@flowplan",
            "END:VEVENT",
        ])

    lines.append("END:VCALENDAR")
    ical_content = "\r\n".join(lines)

    return Response(
        content=ical_content,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=flowplan-schedule.ics"},
    )


@router.get("/exam-prep/{subject_id}")
async def get_exam_prep(
    subject_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subject).where(Subject.id == subject_id, Subject.user_id == current_user.id)
    )
    subject = result.scalar_one_or_none()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    if not subject.exam_date:
        raise HTTPException(status_code=400, detail="No exam date set for this subject")

    days_until = (subject.exam_date - date_type.today()).days
    if days_until < 0:
        raise HTTPException(status_code=400, detail="Exam date has passed")

    ai = AIService()
    try:
        prep = await ai.generate_exam_prep(subject.name, subject.difficulty, days_until, subject.notes)
    except Exception:
        prep = {
            "checklist": ["Review all notes", "Practice past exams", "Focus on weak areas"],
            "daily_hours": 2.0,
            "priority": "high",
            "tips": ["Start with the hardest topics first", "Take breaks every 45 minutes"],
        }

    return {
        "subject_name": subject.name,
        "exam_date": str(subject.exam_date),
        "days_until": days_until,
        **prep,
    }
