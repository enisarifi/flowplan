import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.goal import Goal
from app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse

router = APIRouter()


def _to_response(g: Goal) -> GoalResponse:
    pct = round(g.current_value / g.target_value * 100, 1) if g.target_value > 0 else 0.0
    return GoalResponse(
        **{c.key: getattr(g, c.key) for c in g.__table__.columns},
        subject_name=g.subject.name if g.subject else None,
        progress_pct=min(pct, 100.0),
    )


@router.get("", response_model=list[GoalResponse])
async def list_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Goal)
        .options(selectinload(Goal.subject))
        .where(Goal.user_id == current_user.id)
        .order_by(Goal.is_completed, Goal.created_at.desc())
    )
    return [_to_response(g) for g in result.scalars().all()]


@router.post("", response_model=GoalResponse, status_code=201)
async def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    goal = Goal(
        user_id=current_user.id,
        title=data.title,
        target_type=data.target_type,
        target_value=data.target_value,
        subject_id=data.subject_id,
        deadline=data.deadline,
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    # Re-fetch with relationship loaded
    result = await db.execute(select(Goal).options(selectinload(Goal.subject)).where(Goal.id == goal.id))
    return _to_response(result.scalar_one())


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: uuid.UUID,
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Goal).options(selectinload(Goal.subject)).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(goal, field, value)

    if goal.current_value >= goal.target_value:
        goal.is_completed = True

    await db.commit()
    await db.refresh(goal)
    return _to_response(goal)


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(
    goal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    await db.delete(goal)
    await db.commit()
