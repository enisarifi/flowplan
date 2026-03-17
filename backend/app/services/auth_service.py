from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt, JWTError
from fastapi import HTTPException, status

from app.config import settings
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import RegisterRequest, TokenResponse


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(data: dict, expires_delta: timedelta) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + expires_delta
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def register(self, data: RegisterRequest) -> TokenResponse:
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        user = User(
            email=data.email,
            display_name=data.display_name,
            password_hash=hash_password(data.password),
        )
        user = await self.user_repo.create(user)
        return self._make_tokens(user)

    async def login(self, email: str, password: str) -> TokenResponse:
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return self._make_tokens(user)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await self.user_repo.get(payload["sub"])
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return self._make_tokens(user)

    def _make_tokens(self, user: User) -> TokenResponse:
        access = create_token(
            {"sub": str(user.id), "type": "access"},
            timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        refresh = create_token(
            {"sub": str(user.id), "type": "refresh"},
            timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        return TokenResponse(access_token=access, refresh_token=refresh)
