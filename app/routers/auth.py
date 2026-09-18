"""Authentication router: registration, login, and token refresh."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, UserStatus
from app.schemas import UserCreate, UserLogin, UserResponse, Token, RefreshToken
from app.utils import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token, decode_token
)
from app.config import settings

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    result = await db.execute(select(User).where(User.email == user_data.email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if user_data.student_id and user_data.student_id.strip():
        result = await db.execute(select(User).where(User.student_id == user_data.student_id.strip()))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Student ID already registered")
    
    user = User(
        email=user_data.email.lower(),
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        student_id=user_data.student_id.strip() if user_data.student_id and user_data.student_id.strip() else None,
        department=user_data.department.strip() if user_data.department and user_data.department.strip() else None,
        year_of_study=user_data.year_of_study,
        phone=user_data.phone.strip() if user_data.phone and user_data.phone.strip() else None,
        semester=user_data.semester,
        batch=user_data.batch.strip() if user_data.batch and user_data.batch.strip() else None,
        course_duration=user_data.course_duration.strip() if user_data.course_duration and user_data.course_duration.strip() else None,
        status=UserStatus.ACTIVE,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@auth_router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    result = await db.execute(select(User).where(User.email == credentials.email.lower()))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=403, detail=f"Account is {user.status.value}")
    
    user.last_login = datetime.utcnow()
    await db.commit()
    
    return Token(
        access_token=create_access_token(user.id, {"role": user.role.value}),
        refresh_token=create_refresh_token(user.id),
        expires_in=settings.access_token_expire_minutes * 60
    )


@auth_router.post("/refresh", response_model=Token)
async def refresh_token(token_data: RefreshToken, db: AsyncSession = Depends(get_db)):
    """Refresh access token."""
    payload = decode_token(token_data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    
    if not user or user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    return Token(
        access_token=create_access_token(user.id, {"role": user.role.value}),
        refresh_token=create_refresh_token(user.id),
        expires_in=settings.access_token_expire_minutes * 60
    )
