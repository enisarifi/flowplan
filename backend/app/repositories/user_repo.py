import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.user import User, UserPreferences
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_with_preferences(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(
            select(User).options(selectinload(User.preferences)).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def upsert_preferences(self, user_id: uuid.UUID, **kwargs) -> UserPreferences:
        result = await self.db.execute(select(UserPreferences).where(UserPreferences.user_id == user_id))
        prefs = result.scalar_one_or_none()
        if prefs is None:
            prefs = UserPreferences(user_id=user_id, **kwargs)
            self.db.add(prefs)
        else:
            for key, value in kwargs.items():
                if value is not None:
                    setattr(prefs, key, value)
        await self.db.commit()
        await self.db.refresh(prefs)
        return prefs

    async def get_preferences(self, user_id: uuid.UUID) -> UserPreferences | None:
        result = await self.db.execute(select(UserPreferences).where(UserPreferences.user_id == user_id))
        return result.scalar_one_or_none()
