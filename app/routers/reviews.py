"""Reviews router: service/user reviews, VADER sentiment tagging, and provider replies."""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import (
    User, ServiceListing,
    Order, OrderStatus,
    Review
)
from app.schemas import (
    ReviewCreate, ReviewUpdate, ReviewResponse, ReviewListResponse, ProviderResponseCreate
)
from app.utils import get_current_user
from app.ml import analyze_sentiment, get_sentiment_summary
from app.routers.common import paginate

reviews_router = APIRouter(prefix="/reviews", tags=["Reviews"])


@reviews_router.get("/service/{service_id}", response_model=ReviewListResponse)
async def list_service_reviews(
    service_id: int,
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = select(Review).options(selectinload(Review.reviewer)).where(Review.service_id == service_id, Review.is_visible == True)
    count_query = select(func.count(Review.id)).where(Review.service_id == service_id, Review.is_visible == True)
    avg_result = await db.execute(select(func.avg(Review.rating)).where(Review.service_id == service_id, Review.is_visible == True))
    avg_rating = avg_result.scalar() or 0
    items, total, pages = await paginate(db, query, count_query, page, page_size, Review.created_at.desc())
    summary = get_sentiment_summary(items)
    return ReviewListResponse(items=items, total=total, page=page, page_size=page_size, pages=pages, average_rating=float(avg_rating), sentiment_summary=summary)


@reviews_router.get("/user/{user_id}", response_model=ReviewListResponse)
async def list_user_reviews(
    user_id: int,
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = select(Review).options(selectinload(Review.reviewer)).where(Review.reviewee_id == user_id, Review.is_visible == True)
    count_query = select(func.count(Review.id)).where(Review.reviewee_id == user_id, Review.is_visible == True)
    avg_result = await db.execute(select(func.avg(Review.rating)).where(Review.reviewee_id == user_id, Review.is_visible == True))
    avg_rating = avg_result.scalar() or 0
    items, total, pages = await paginate(db, query, count_query, page, page_size, Review.created_at.desc())
    summary = get_sentiment_summary(items)
    return ReviewListResponse(items=items, total=total, page=page, page_size=page_size, pages=pages, average_rating=float(avg_rating), sentiment_summary=summary)


async def _recalc_ratings(db, service_id, provider_id):
    """Recompute average rating / review count for a service and its provider."""
    service = (await db.execute(select(ServiceListing).where(ServiceListing.id == service_id))).scalar_one_or_none()
    if service:
        avg, cnt = (await db.execute(select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.service_id == service_id, Review.is_visible == True))).one()
        service.average_rating = float(avg) if avg else 0.0
        service.total_reviews = cnt
    provider = (await db.execute(select(User).where(User.id == provider_id))).scalar_one_or_none()
    if provider:
        avg, cnt = (await db.execute(select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.reviewee_id == provider_id, Review.is_visible == True))).one()
        provider.average_rating = float(avg) if avg else 0.0
        provider.total_reviews = cnt


@reviews_router.get("/order/{order_id}", response_model=Optional[ReviewResponse])
async def get_order_review(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return the review for an order (visible to the order's client and provider)."""
    order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.id not in (order.client_id, order.provider_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    return (await db.execute(
        select(Review).options(selectinload(Review.reviewer)).where(Review.order_id == order_id)
    )).scalar_one_or_none()


@reviews_router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    data: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Let the reviewer edit their own review; sentiment and ratings are recalculated."""
    review = (await db.execute(select(Review).where(Review.id == review_id))).scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the reviewer can edit this review")
    review.rating = data.rating
    review.title = data.title
    review.comment = data.comment
    nlp_res = analyze_sentiment(data.comment, data.rating)
    review.sentiment = nlp_res["label"]
    review.sentiment_score = nlp_res["compound_score"]
    await db.flush()
    await _recalc_ratings(db, review.service_id, review.reviewee_id)
    await db.commit()
    await db.refresh(review, ["reviewer"])
    return review


@reviews_router.post("/", response_model=ReviewResponse, status_code=201)
async def create_review(
    review_data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Order).where(Order.id == review_data.order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only client can review")
    if order.status != OrderStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only review completed orders")
    existing = await db.execute(select(Review).where(Review.order_id == order.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already reviewed")
    
    # AI/ML Sentiment Analysis
    nlp_res = analyze_sentiment(review_data.comment, review_data.rating)
    
    review = Review(
        rating=review_data.rating, title=review_data.title, comment=review_data.comment,
        communication_rating=review_data.communication_rating, quality_rating=review_data.quality_rating,
        delivery_rating=review_data.delivery_rating, reviewer_id=current_user.id,
        reviewee_id=order.provider_id, service_id=order.service_id, order_id=order.id,
        sentiment=nlp_res["label"],
        sentiment_score=nlp_res["compound_score"]
    )
    db.add(review)
    
    # Update service ratings
    service = (await db.execute(select(ServiceListing).where(ServiceListing.id == order.service_id))).scalar_one()
    rating_result = await db.execute(select(func.avg(Review.rating), func.count(Review.id)).where(Review.service_id == order.service_id, Review.is_visible == True))
    avg_rating, review_count = rating_result.one()
    service.average_rating = float(avg_rating) if avg_rating else review_data.rating
    service.total_reviews = review_count + 1
    
    # Update provider ratings
    provider = (await db.execute(select(User).where(User.id == order.provider_id))).scalar_one()
    provider_result = await db.execute(select(func.avg(Review.rating), func.count(Review.id)).where(Review.reviewee_id == order.provider_id, Review.is_visible == True))
    provider_avg, provider_count = provider_result.one()
    provider.average_rating = float(provider_avg) if provider_avg else review_data.rating
    provider.total_reviews = provider_count + 1
    
    await db.commit()
    await db.refresh(review, ["reviewer"])
    return review


@reviews_router.post("/{review_id}/response", response_model=ReviewResponse)
async def add_provider_response(
    review_id: int,
    response_data: ProviderResponseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.reviewee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only provider can respond")
    review.provider_response = response_data.provider_response
    review.response_at = datetime.utcnow()
    await db.commit()
    await db.refresh(review, ["reviewer"])
    return review
