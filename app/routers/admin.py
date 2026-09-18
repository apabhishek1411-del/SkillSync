"""Admin router: campus statistics, user moderation, and service approval."""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete, update
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import (
    User, UserRole, UserStatus,
    ServiceListing, ServiceStatus,
    Order, Review, Skill
)
from app.schemas import (
    UserResponse, UserListResponse,
    ServiceResponse, ServiceListResponse, ServiceVerify
)
from app.utils import get_admin_user
from app.routers.common import paginate

admin_router = APIRouter(prefix="/admin", tags=["Admin"])


@admin_router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    pending_services = (await db.execute(select(func.count(ServiceListing.id)).where(ServiceListing.status == ServiceStatus.PENDING))).scalar()
    total_services = (await db.execute(select(func.count(ServiceListing.id)))).scalar()
    total_orders = (await db.execute(select(func.count(Order.id)))).scalar()
    total_revenue = (await db.execute(select(func.sum(Order.agreed_price)).where(Order.status == "completed"))).scalar() or 0
    return {
        "total_users": total_users,
        "pending_services": pending_services,
        "total_services": total_services,
        "total_orders": total_orders,
        "total_revenue": float(total_revenue)
    }


@admin_router.get("/users", response_model=UserListResponse)
async def list_all_users(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    user_status: Optional[UserStatus] = None, role: Optional[UserRole] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    query = select(User)
    count_query = select(func.count(User.id))
    if user_status:
        query = query.where(User.status == user_status)
        count_query = count_query.where(User.status == user_status)
    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)
    if search:
        query = query.where(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
        count_query = count_query.where(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
    items, total, pages = await paginate(db, query, count_query, page, page_size, User.created_at.desc())
    return UserListResponse(items=items, total=total, page=page, page_size=page_size, pages=pages)


@admin_router.put("/users/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: int,
    new_status: UserStatus = Query(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change own status")
    user.status = new_status
    await db.commit()
    await db.refresh(user)
    return user


@admin_router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: int,
    new_role: UserRole = Query(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    user.role = new_role
    await db.commit()
    await db.refresh(user)
    return user


@admin_router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    # Delete reviews
    await db.execute(delete(Review).where((Review.reviewer_id == user_id) | (Review.reviewee_id == user_id)))
    # Preserve order history by nullifying user references
    await db.execute(update(Order).where(Order.client_id == user_id).values(client_id=None))
    await db.execute(update(Order).where(Order.provider_id == user_id).values(provider_id=None))
    # Delete services
    await db.execute(delete(ServiceListing).where(ServiceListing.provider_id == user_id))
    await db.delete(user)
    await db.commit()
    return {"message": f"User {user.full_name} deleted successfully"}


@admin_router.get("/services", response_model=ServiceListResponse)
async def list_all_services(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None, status: Optional[ServiceStatus] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    query = select(ServiceListing).options(selectinload(ServiceListing.provider), selectinload(ServiceListing.skill).selectinload(Skill.category))
    count_query = select(func.count(ServiceListing.id))
    if status:
        query = query.where(ServiceListing.status == status)
        count_query = count_query.where(ServiceListing.status == status)
    if search:
        query = query.where(ServiceListing.title.ilike(f"%{search}%"))
        count_query = count_query.where(ServiceListing.title.ilike(f"%{search}%"))
    items, total, pages = await paginate(db, query, count_query, page, page_size, ServiceListing.created_at.desc())
    return ServiceListResponse(items=items, total=total, page=page, page_size=page_size, pages=pages)


@admin_router.delete("/services/{service_id}")
async def admin_delete_service(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    result = await db.execute(select(ServiceListing).where(ServiceListing.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    title = service.title
    await db.execute(delete(Review).where(Review.service_id == service_id))
    await db.execute(update(Order).where(Order.service_id == service_id).values(service_id=None))
    await db.delete(service)
    await db.commit()
    return {"message": f"Service '{title}' deleted successfully"}


@admin_router.put("/services/{service_id}/verify", response_model=ServiceResponse)
async def verify_service(
    service_id: int,
    verification: ServiceVerify,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    result = await db.execute(select(ServiceListing).options(selectinload(ServiceListing.provider), selectinload(ServiceListing.skill).selectinload(Skill.category)).where(ServiceListing.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if verification.status not in [ServiceStatus.APPROVED, ServiceStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="Can only approve or reject")
    if verification.status == ServiceStatus.REJECTED and not verification.rejection_reason:
        raise HTTPException(status_code=400, detail="Rejection reason required")
    service.status = verification.status
    service.approved_by = admin.id
    service.approved_at = datetime.utcnow()
    if verification.status == ServiceStatus.REJECTED:
        service.rejection_reason = verification.rejection_reason
    await db.commit()
    await db.refresh(service, ["provider", "skill"])
    return service


@admin_router.get("/reviews/flagged")
async def list_flagged_reviews(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    query = select(Review).options(selectinload(Review.reviewer)).where(Review.is_flagged == True)
    total = (await db.execute(select(func.count(Review.id)).where(Review.is_flagged == True))).scalar()
    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size).order_by(Review.created_at.desc()))
    return {"items": result.scalars().all(), "total": total, "page": page, "page_size": page_size}


@admin_router.put("/reviews/{review_id}/visibility")
async def toggle_review_visibility(
    review_id: int,
    is_visible: bool,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_visible = is_visible
    review.is_flagged = False
    await db.commit()
    return {"message": f"Review visibility set to {is_visible}"}
