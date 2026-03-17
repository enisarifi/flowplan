import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.repositories.subject_repo import SubjectRepository
from app.repositories.schedule_repo import ScheduleRepository
from app.services.auth_service import decode_token

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    user_id = payload.get("sub")
    user_repo = UserRepository(db)
    user = await user_repo.get(uuid.UUID(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_user_repo(db: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_subject_repo(db: AsyncSession = Depends(get_db)) -> SubjectRepository:
    return SubjectRepository(db)


def get_schedule_repo(db: AsyncSession = Depends(get_db)) -> ScheduleRepository:
    return ScheduleRepository(db)
