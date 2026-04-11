from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from App.profile_management.infrastructure.database.database import get_db
from App.auth.infrastructure.database.repository import SqlAlchemyUserRepository
from App.auth.application.usecase.auth_usecase import AuthUseCase

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

async def get_auth_usecase(db: AsyncSession = Depends(get_db)) -> AuthUseCase:
    repo = SqlAlchemyUserRepository(db)
    return AuthUseCase(user_repository=repo)

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, usecase: AuthUseCase = Depends(get_auth_usecase)):
    try:
        result = await usecase.register(
            email=request.email,
            password=request.password,
            first_name=request.first_name,
            last_name=request.last_name
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

@router.post("/login")
async def login(req: Request, request: LoginRequest, usecase: AuthUseCase = Depends(get_auth_usecase)):
    try:
        client_ip = req.client.host if req.client else ""
        result = await usecase.login(email=request.email, password=request.password, device_ip=client_ip)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

@router.post("/refresh")
async def refresh(request: RefreshRequest, usecase: AuthUseCase = Depends(get_auth_usecase)):
    try:
        result = await usecase.refresh_token(refresh_token=request.refresh_token)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
