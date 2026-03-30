import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.session_service import SessionService
from app.schemas.feedback import SessionCompleteRequest, FeedbackResponse, SessionStatsResponse, SubjectStatsItem, WeeklySummaryResponse, WeeklyTrendItem, EnergyHeatmapItem, HistoryDayItem

router = APIRouter()


def get_session_service(db: AsyncSession = Depends(get_db)) -> SessionService:
    return SessionService(db)


@router.patch("/{session_id}/complete", response_model=FeedbackResponse)
async def complete_session(
    session_id: uuid.UUID,
    data: SessionCompleteRequest,
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service),
):
    return await service.complete(current_user.id, session_id, data)


@router.patch("/{session_id}/skip", status_code=204)
async def skip_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service),
):
    await service.skip(current_user.id, session_id)


@router.get("/stats", response_model=SessionStatsResponse)
async def get_stats(
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service),
):
    return await service.get_stats(current_user.id)


@router.get("/stats/subjects", response_model=list[SubjectStatsItem])
async def get_subject_stats(
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service),
):
    return await service.get_subject_stats(current_user.id)


@router.get("/weekly-summary", response_model=WeeklySummaryResponse)
async def get_weekly_summary(
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service),
):
    return await service.get_weekly_summary(current_user.id)


@router.get("/analytics/weekly-trend", response_model=list[WeeklyTrendItem])
async def get_weekly_trend(
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service),
):
    return await service.get_weekly_trend(current_user.id)


@router.get("/analytics/energy-heatmap", response_model=list[EnergyHeatmapItem])
async def get_energy_heatmap(
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service),
):
    return await service.get_energy_heatmap(current_user.id)


@router.get("/history", response_model=list[HistoryDayItem])
async def get_history(
    days: int = Query(28, le=365),
    subject_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service),
):
    return await service.get_history(current_user.id, days, subject_id)
