from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories.user_repo import UserRepository
from app.services.auth_service import AuthService
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshRequest, TokenResponse

router = APIRouter()


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(UserRepository(db))


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: RegisterRequest, service: AuthService = Depends(get_auth_service)):
    return await service.register(data)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, service: AuthService = Depends(get_auth_service)):
    return await service.login(data.email, data.password)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, service: AuthService = Depends(get_auth_service)):
    return await service.refresh(data.refresh_token)
