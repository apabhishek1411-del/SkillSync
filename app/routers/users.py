"""Users router: profile management and user search."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models import User
from app.schemas import UserResponse, UserUpdate, UserListResponse
from app.utils import get_current_user
from app.routers.common import paginate

users_router = APIRouter(prefix="/users", tags=["Users"])


@users_router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@users_router.put("/me", response_model=UserResponse)
async def update_my_profile(
    update_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _MUTABLE_FIELDS = {
        "full_name", "student_id", "department", "year_of_study",
        "phone", "semester", "batch", "course_duration", "bio", "profile_image"
    }
    for field, value in update_data.model_dump(exclude_unset=True).items():
        if field in _MUTABLE_FIELDS:
            setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@users_router.get("/{user_id}", response_model=UserResponse)
async def get_user_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@users_router.get("/", response_model=UserListResponse)
async def list_users(
    page: int = 1,
    page_size: int = 20,
    search: str = None,
    department: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(User)
    count_query = select(func.count(User.id))
    
    if search:
        query = query.where(User.full_name.ilike(f"%{search}%"))
        count_query = count_query.where(User.full_name.ilike(f"%{search}%"))
    if department:
        query = query.where(User.department == department)
        count_query = count_query.where(User.department == department)
    
    items, total, pages = await paginate(db, query, count_query, page, page_size, User.created_at.desc())
    return UserListResponse(items=items, total=total, page=page, page_size=page_size, pages=pages)
