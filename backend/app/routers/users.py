from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user, get_user_repo
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserResponse, UserUpdate, PreferencesUpdate, PreferencesResponse
from app.services.auth_service import verify_password, hash_password

router = APIRouter()


class ChangeEmailRequest(BaseModel):
    new_email: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class DeleteAccountRequest(BaseModel):
    password: str


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
    db_session = user_repo.db
    await db_session.commit()
    await db_session.refresh(current_user)
    return current_user


@router.patch("/me/email", response_model=UserResponse)
async def change_email(
    data: ChangeEmailRequest,
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repo),
):
    if not verify_password(data.password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect password")
    existing = await user_repo.get_by_email(data.new_email)
    if existing and str(existing.id) != str(current_user.id):
        raise HTTPException(status_code=400, detail="Email already in use")
    current_user.email = data.new_email
    await user_repo.db.commit()
    await user_repo.db.refresh(current_user)
    return current_user


@router.patch("/me/password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repo),
):
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    current_user.password_hash = hash_password(data.new_password)
    await user_repo.db.commit()
    return {"message": "Password updated"}


@router.delete("/me")
async def delete_account(
    data: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repo),
):
    if not verify_password(data.password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect password")
    await user_repo.db.delete(current_user)
    await user_repo.db.commit()
    return {"message": "Account deleted"}


@router.get("/me/preferences", response_model=PreferencesResponse)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repo),
):
    prefs = await user_repo.get_preferences(current_user.id)
    if not prefs:
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
