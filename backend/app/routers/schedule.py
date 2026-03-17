import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

logger = logging.getLogger(__name__)
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, get_schedule_repo
from app.models.user import User
from app.repositories.schedule_repo import ScheduleRepository
from app.services.schedule_service import ScheduleService
from app.services.ai_service import AIResponseValidationError
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
