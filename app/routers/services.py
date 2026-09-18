"""Services router: CRUD operations and TF-IDF AI semantic search."""
from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import (
    User, UserRole,
    ServiceListing, ServiceStatus, PricingType,
    Skill
)
from app.schemas import (
    ServiceCreate, ServiceUpdate, ServiceResponse, ServiceListResponse
)
from app.utils import get_current_user
from app.ml import rank_services_by_semantic_relevance
from app.routers.common import paginate

ALLOWED_SORT_FIELDS = {"created_at", "price", "average_rating", "order_count", "view_count", "title"}

services_router = APIRouter(prefix="/services", tags=["Services"])


@services_router.get("/", response_model=ServiceListResponse)
async def list_services(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = None, skill_id: Optional[int] = None,
    provider_id: Optional[int] = None,
    min_price: Optional[Decimal] = None, max_price: Optional[Decimal] = None,
    pricing_type: Optional[PricingType] = None, min_rating: Optional[float] = None,
    max_delivery_days: Optional[int] = None,
    search: Optional[str] = None, sort_by: str = "created_at", sort_order: str = "desc",
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(ServiceListing)
        .options(selectinload(ServiceListing.provider), selectinload(ServiceListing.skill).selectinload(Skill.category))
        .where(ServiceListing.status == ServiceStatus.APPROVED)
    )
    count_query = select(func.count(ServiceListing.id)).where(ServiceListing.status == ServiceStatus.APPROVED)
    
    if provider_id:
        query = query.where(ServiceListing.provider_id == provider_id)
        count_query = count_query.where(ServiceListing.provider_id == provider_id)
    if category_id:
        query = query.join(Skill).where(Skill.category_id == category_id)
        count_query = count_query.join(Skill).where(Skill.category_id == category_id)
    if skill_id:
        query = query.where(ServiceListing.skill_id == skill_id)
        count_query = count_query.where(ServiceListing.skill_id == skill_id)
    if min_price is not None:
        query = query.where(ServiceListing.price >= min_price)
        count_query = count_query.where(ServiceListing.price >= min_price)
    if max_price is not None:
        query = query.where(ServiceListing.price <= max_price)
        count_query = count_query.where(ServiceListing.price <= max_price)
    if pricing_type:
        query = query.where(ServiceListing.pricing_type == pricing_type)
        count_query = count_query.where(ServiceListing.pricing_type == pricing_type)
    if min_rating is not None:
        query = query.where(ServiceListing.average_rating >= min_rating)
        count_query = count_query.where(ServiceListing.average_rating >= min_rating)
    if max_delivery_days is not None:
        query = query.where(ServiceListing.delivery_time_days <= max_delivery_days)
        count_query = count_query.where(ServiceListing.delivery_time_days <= max_delivery_days)
    if search:
        search_filter = or_(ServiceListing.title.ilike(f"%{search}%"), ServiceListing.description.ilike(f"%{search}%"))
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    if sort_by not in ALLOWED_SORT_FIELDS:
        sort_by = "created_at"
    sort_column = getattr(ServiceListing, sort_by)
    order = sort_column.desc() if sort_order == "desc" else sort_column.asc()
    items, total, pages = await paginate(db, query, count_query, page, page_size, order)
    
    # AI/ML Semantic Search Fallback:
    # If the user searched in natural language and exact SQL ILIKE found 0 results,
    # run semantic smart ranking on all active services so the user gets relevant matches!
    if search and total == 0:
        base_query = (
            select(ServiceListing)
            .options(selectinload(ServiceListing.provider), selectinload(ServiceListing.skill).selectinload(Skill.category))
            .where(ServiceListing.status == ServiceStatus.APPROVED)
        )
        if category_id:
            base_query = base_query.join(Skill).where(Skill.category_id == category_id)
        if skill_id:
            base_query = base_query.where(ServiceListing.skill_id == skill_id)

        candidates = (await db.execute(base_query)).scalars().all()
        ranked = rank_services_by_semantic_relevance(search, candidates)
        if ranked:
            semantic_items = [s for s, _ in ranked]
            total = len(semantic_items)
            pages = (total + page_size - 1) // page_size
            items = semantic_items[(page - 1) * page_size : page * page_size]

    return ServiceListResponse(items=items, total=total, page=page, page_size=page_size, pages=pages)


@services_router.get("/search/semantic")
async def semantic_search_services(
    q: str = Query(..., min_length=2, description="Natural language search query"),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """
    AI-Powered Semantic Smart Search.
    Uses TF-IDF Vector Space Model and campus synonym expansion to find services matching conversational queries.
    """
    result = await db.execute(
        select(ServiceListing)
        .options(selectinload(ServiceListing.provider), selectinload(ServiceListing.skill).selectinload(Skill.category))
        .where(ServiceListing.status == ServiceStatus.APPROVED)
    )
    all_services = result.scalars().all()
    ranked = rank_services_by_semantic_relevance(q, all_services)
    items = [s for s, _ in ranked[:limit]]
    scores = {str(s.id): score for s, score in ranked[:limit]}
    return {
        "query": q,
        "total": len(items),
        "items": items,
        "relevance_scores": scores
    }


@services_router.get("/my-services", response_model=ServiceListResponse)
async def list_my_services(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    status: Optional[ServiceStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(ServiceListing)
        .options(selectinload(ServiceListing.skill).selectinload(Skill.category))
        .where(ServiceListing.provider_id == current_user.id)
    )
    count_query = select(func.count(ServiceListing.id)).where(ServiceListing.provider_id == current_user.id)
    if status:
        query = query.where(ServiceListing.status == status)
        count_query = count_query.where(ServiceListing.status == status)
    items, total, pages = await paginate(db, query, count_query, page, page_size, ServiceListing.created_at.desc())
    return ServiceListResponse(items=items, total=total, page=page, page_size=page_size, pages=pages)


@services_router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(service_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ServiceListing)
        .options(selectinload(ServiceListing.provider), selectinload(ServiceListing.skill).selectinload(Skill.category))
        .where(ServiceListing.id == service_id)
    )
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    service.view_count += 1
    await db.commit()
    return service


@services_router.post("/", response_model=ServiceResponse, status_code=201)
async def create_service(
    service_data: ServiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if service_data.skill_id is not None and service_data.skill_id <= 0:
        service_data.skill_id = None
    if not service_data.skill_id and not service_data.custom_skill_name:
        raise HTTPException(status_code=400, detail="Either skill_id or custom_skill_name required")
    if service_data.skill_id:
        result = await db.execute(select(Skill).where(Skill.id == service_data.skill_id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Skill not found")
    service = ServiceListing(**service_data.model_dump(), provider_id=current_user.id, status=ServiceStatus.APPROVED)
    db.add(service)
    await db.commit()
    result = await db.execute(
        select(ServiceListing)
        .options(selectinload(ServiceListing.provider), selectinload(ServiceListing.skill).selectinload(Skill.category))
        .where(ServiceListing.id == service.id)
    )
    return result.scalar_one()


@services_router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: int,
    update_data: ServiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ServiceListing).where(ServiceListing.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service.provider_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(service, field, value)
    await db.commit()
    result = await db.execute(
        select(ServiceListing)
        .options(selectinload(ServiceListing.provider), selectinload(ServiceListing.skill).selectinload(Skill.category))
        .where(ServiceListing.id == service.id)
    )
    return result.scalar_one()


@services_router.delete("/{service_id}", status_code=204)
async def delete_service(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ServiceListing).where(ServiceListing.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service.provider_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.delete(service)
    await db.commit()
