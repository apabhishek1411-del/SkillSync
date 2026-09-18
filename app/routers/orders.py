"""Orders router: order lifecycle, status transitions, and payments."""
from datetime import datetime, timedelta
from typing import Optional
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import (
    User, ServiceListing, ServiceStatus,
    Order, OrderStatus, PaymentStatus
)
from app.schemas import (
    OrderCreate, OrderResponse, OrderListResponse, OrderStatusUpdate, PaymentUpdate
)
from app.utils import get_current_user, generate_order_number
from app.routers.common import paginate

logger = logging.getLogger(__name__)

orders_router = APIRouter(prefix="/orders", tags=["Orders"])


@orders_router.get("/", response_model=OrderListResponse)
async def list_my_orders(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    role: str = Query("all", pattern="^(client|provider|all)$"),
    order_status: Optional[OrderStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Order).options(selectinload(Order.client), selectinload(Order.provider), selectinload(Order.service))
    count_query = select(func.count(Order.id))
    
    if role == "client":
        query = query.where(Order.client_id == current_user.id)
        count_query = count_query.where(Order.client_id == current_user.id)
    elif role == "provider":
        query = query.where(Order.provider_id == current_user.id)
        count_query = count_query.where(Order.provider_id == current_user.id)
    else:
        condition = or_(Order.client_id == current_user.id, Order.provider_id == current_user.id)
        query = query.where(condition)
        count_query = count_query.where(condition)
    
    if order_status:
        query = query.where(Order.status == order_status)
        count_query = count_query.where(Order.status == order_status)
    
    items, total, pages = await paginate(db, query, count_query, page, page_size, Order.created_at.desc())
    return OrderListResponse(items=items, total=total, page=page, page_size=page_size, pages=pages)


@orders_router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Order).options(selectinload(Order.client), selectinload(Order.provider), selectinload(Order.service)).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.client_id != current_user.id and order.provider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return order


@orders_router.post("/", response_model=OrderResponse, status_code=201)
async def create_order(
    order_data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ServiceListing).where(ServiceListing.id == order_data.service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service.status != ServiceStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Service not available")
    if service.provider_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot hire your own service")
    
    order = Order(
        order_number=generate_order_number(),
        requirements=order_data.requirements,
        additional_notes=order_data.additional_notes,
        agreed_price=order_data.agreed_price,
        expected_delivery=datetime.utcnow() + timedelta(days=service.delivery_time_days),
        max_revisions=service.revision_count,
        client_id=current_user.id,
        provider_id=service.provider_id,
        service_id=service.id,
        service_title=service.title,
        status=OrderStatus.PENDING
    )
    db.add(order)
    service.order_count += 1
    await db.commit()
    result = await db.execute(select(Order).options(selectinload(Order.client), selectinload(Order.provider), selectinload(Order.service)).where(Order.id == order.id))
    created = result.scalar_one()

    # 🔔 Notify provider of new order
    try:
        from app.notification_routes import create_notification
        await create_notification(
            db, service.provider_id,
            type="order_placed",
            title="New Order Received! 🎉",
            message=f"{current_user.full_name} placed an order for '{service.title}' — ₹{order_data.agreed_price}",
            link=f"/orders/{created.id}",
        )
        await db.commit()
    except Exception as exc:
        logger.error(f"Failed to send order notification: {exc}", exc_info=True)

    return created


@orders_router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    is_client = order.client_id == current_user.id
    is_provider = order.provider_id == current_user.id
    if not is_client and not is_provider:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_status = status_update.status
    current_status = order.status
    
    valid_transitions = {
        (OrderStatus.PENDING, OrderStatus.ACCEPTED, True),
        (OrderStatus.PENDING, OrderStatus.REJECTED, True),
        (OrderStatus.ACCEPTED, OrderStatus.IN_PROGRESS, True),
        (OrderStatus.IN_PROGRESS, OrderStatus.DELIVERED, True),
        (OrderStatus.REVISION, OrderStatus.DELIVERED, True),
        (OrderStatus.DELIVERED, OrderStatus.COMPLETED, False),
        (OrderStatus.DELIVERED, OrderStatus.REVISION, False),
    }
    
    if new_status == OrderStatus.CANCELLED:
        if current_status == OrderStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Cannot cancel completed order")
        order.cancellation_reason = status_update.cancellation_reason
    elif (current_status, new_status, is_provider) not in valid_transitions:
        raise HTTPException(status_code=400, detail=f"Invalid transition {current_status.value} -> {new_status.value}")
    
    order.status = new_status
    if new_status == OrderStatus.ACCEPTED:
        order.accepted_at = datetime.utcnow()
    elif new_status == OrderStatus.REJECTED:
        order.rejection_reason = status_update.rejection_reason
    elif new_status == OrderStatus.DELIVERED:
        order.actual_delivery = datetime.utcnow()
    elif new_status == OrderStatus.COMPLETED:
        order.completed_at = datetime.utcnow()
    elif new_status == OrderStatus.REVISION:
        order.revision_count += 1
    
    await db.commit()
    await db.refresh(order, ["client", "provider", "service"])

    # 🔔 Trigger notification based on new status
    try:
        from app.notification_routes import create_notification
        notif_user_id = None
        notif_type    = None
        notif_title   = None
        notif_msg     = None

        if new_status == OrderStatus.ACCEPTED:
            notif_user_id = order.client_id
            notif_type    = "order_accepted"
            notif_title   = "Order Accepted ✅"
            notif_msg     = f"Your order for '{order.service_title}' was accepted. Work will begin soon!"
        elif new_status == OrderStatus.REJECTED:
            notif_user_id = order.client_id
            notif_type    = "order_rejected"
            notif_title   = "Order Rejected"
            notif_msg     = f"Your order for '{order.service_title}' was rejected."
        elif new_status == OrderStatus.DELIVERED:
            notif_user_id = order.client_id
            notif_type    = "order_delivered"
            notif_title   = "Order Delivered 📦"
            notif_msg     = f"'{order.service_title}' has been delivered. Review and pay to complete."
        elif new_status == OrderStatus.REVISION:
            notif_user_id = order.provider_id
            notif_type    = "order_revision"
            notif_title   = "Revision Requested 🔄"
            notif_msg     = f"Client requested a revision on '{order.service_title}'."
        elif new_status == OrderStatus.CANCELLED:
            notif_user_id = order.provider_id
            notif_type    = "order_cancelled"
            notif_title   = "Order Cancelled"
            notif_msg     = f"Order for '{order.service_title}' was cancelled."

        if notif_user_id:
            await create_notification(db, notif_user_id, type=notif_type,
                title=notif_title, message=notif_msg, link=f"/orders/{order.id}")
            await db.commit()
    except Exception as exc:
        logger.error(f"Failed to send status notification: {exc}", exc_info=True)

    return order


@orders_router.put("/{order_id}/payment", response_model=OrderResponse)
async def update_payment(
    order_id: int,
    payment_update: PaymentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.provider_id != current_user.id and order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only client or provider can update payment")
    order.payment_status = payment_update.payment_status
    order.payment_method = payment_update.payment_method
    await db.commit()
    await db.refresh(order, ["client", "provider", "service"])
    return order
