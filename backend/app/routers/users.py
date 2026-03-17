from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, get_user_repo
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserResponse, UserUpdate, PreferencesUpdate, PreferencesResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repo),
):
    if data.display_name:
        current_user.display_name = data.display_name
        from app.database import AsyncSessionLocal
    db_session = user_repo.db
    await db_session.commit()
    await db_session.refresh(current_user)
    return current_user


@router.get("/me/preferences", response_model=PreferencesResponse)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repo),
):
    prefs = await user_repo.get_preferences(current_user.id)
    if not prefs:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Preferences not set yet")
    return prefs


@router.put("/me/preferences", response_model=PreferencesResponse)
async def upsert_preferences(
    data: PreferencesUpdate,
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repo),
):
    kwargs = {k: v for k, v in data.model_dump().items() if v is not None}
    return await user_repo.upsert_preferences(current_user.id, **kwargs)
