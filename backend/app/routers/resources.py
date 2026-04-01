import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.resource import Resource
from app.schemas.resource import ResourceCreate, ResourceResponse

router = APIRouter()


@router.get("", response_model=list[ResourceResponse])
async def list_resources(
    subject_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Resource).where(Resource.user_id == current_user.id)
    if subject_id:
        query = query.where(Resource.subject_id == subject_id)
    query = query.order_by(Resource.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("", response_model=ResourceResponse, status_code=201)
async def create_resource(
    data: ResourceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resource = Resource(
        user_id=current_user.id,
        subject_id=data.subject_id,
        title=data.title,
        url=data.url,
        type=data.type,
        page_ref=data.page_ref,
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return resource


@router.delete("/{resource_id}", status_code=204)
async def delete_resource(
    resource_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Resource).where(Resource.id == resource_id, Resource.user_id == current_user.id)
    )
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    await db.delete(resource)
    await db.commit()
