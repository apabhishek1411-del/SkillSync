"""Portfolio router: student projects and project showcase."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, PortfolioProject
from app.schemas import (
    PortfolioProjectCreate, PortfolioProjectResponse, PortfolioProjectListResponse
)
from app.utils import get_current_user

portfolio_router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


@portfolio_router.get("/user/{user_id}", response_model=PortfolioProjectListResponse)
async def list_user_portfolio(user_id: int, db: AsyncSession = Depends(get_db)):
    """List all portfolio projects for a user."""
    result = await db.execute(
        select(PortfolioProject)
        .where(PortfolioProject.user_id == user_id)
        .order_by(PortfolioProject.created_at.desc())
    )
    items = result.scalars().all()
    return PortfolioProjectListResponse(items=items, total=len(items))


@portfolio_router.post("/", response_model=PortfolioProjectResponse, status_code=201)
async def create_portfolio_project(
    project_data: PortfolioProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a portfolio project."""
    project = PortfolioProject(**project_data.model_dump(), user_id=current_user.id)
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@portfolio_router.delete("/{project_id}", status_code=204)
async def delete_portfolio_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete own portfolio project."""
    result = await db.execute(
        select(PortfolioProject).where(PortfolioProject.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.delete(project)
    await db.commit()
