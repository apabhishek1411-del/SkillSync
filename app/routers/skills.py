"""Skills & Categories router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Category, Skill, User
from app.schemas import (
    CategoryCreate, CategoryResponse, CategoryListResponse,
    SkillCreate, SkillResponse, SkillListResponse
)
from app.utils import get_admin_user

skills_router = APIRouter(prefix="/skills", tags=["Skills & Categories"])


@skills_router.get("/categories", response_model=CategoryListResponse)
async def list_categories(include_inactive: bool = False, db: AsyncSession = Depends(get_db)):
    query = select(Category).options(selectinload(Category.skills))
    if not include_inactive:
        query = query.where(Category.is_active == True)
    result = await db.execute(query.order_by(Category.display_order, Category.name))
    categories = result.scalars().all()
    return CategoryListResponse(items=categories, total=len(categories))


@skills_router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).options(selectinload(Category.skills)).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@skills_router.post("/categories", response_model=CategoryResponse, status_code=201)
async def create_category(
    category_data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    result = await db.execute(select(Category).where(Category.slug == category_data.slug))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Category with this slug exists")
    category = Category(**category_data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@skills_router.get("/", response_model=SkillListResponse)
async def list_skills(category_id: int = None, include_inactive: bool = False, db: AsyncSession = Depends(get_db)):
    query = select(Skill)
    if category_id:
        query = query.where(Skill.category_id == category_id)
    if not include_inactive:
        query = query.where(Skill.is_active == True)
    result = await db.execute(query.order_by(Skill.name))
    skills = result.scalars().all()
    return SkillListResponse(items=skills, total=len(skills))


@skills_router.get("/{skill_id}", response_model=SkillResponse)
async def get_skill(skill_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Skill).where(Skill.id == skill_id))
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill


@skills_router.post("/", response_model=SkillResponse, status_code=201)
async def create_skill(
    skill_data: SkillCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    result = await db.execute(select(Category).where(Category.id == skill_data.category_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Category not found")
    skill = Skill(**skill_data.model_dump())
    db.add(skill)
    await db.commit()
    await db.refresh(skill)
    return skill
