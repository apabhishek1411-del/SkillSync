"""Payment routes for Razorpay integration."""
import hmac
import hashlib
import logging
import uuid
from datetime import datetime
from typing import Optional

try:
    import razorpay
except ImportError:
    razorpay = None

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.models import Order, OrderStatus, PaymentStatus, PaymentTransaction, User
from app.schemas import (
    CreateRazorpayOrderRequest,
    CreateRazorpayOrderResponse,
    VerifyPaymentRequest,
    PaymentTransactionResponse,
    OrderResponse,
)
from app.utils import get_current_user

logger = logging.getLogger(__name__)

payment_router = APIRouter(prefix="/payments", tags=["Payments"])


def get_razorpay_client():
    """Return an authenticated Razorpay client."""
    if razorpay is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay payment gateway SDK is not installed in this environment."
        )
    if not (settings.razorpay_key_id or "").strip() or not (settings.razorpay_key_secret or "").strip():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env."
        )
    return razorpay.Client(
        auth=(settings.razorpay_key_id, settings.razorpay_key_secret)
    )


def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify Razorpay payment signature using HMAC SHA-256."""
    message = f"{order_id}|{payment_id}"
    expected = hmac.new(
        settings.razorpay_key_secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


# ── 1. Create Razorpay Order ────────────────────────────────────────────────

@payment_router.post("/create-order", response_model=CreateRazorpayOrderResponse)
async def create_razorpay_order(
    body: CreateRazorpayOrderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Called by the client when they click 'Accept & Pay'.
    Creates a Razorpay order and stores a PaymentTransaction record.
    """
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.transactions))
        .where(Order.id == body.order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the client can initiate payment")
    if order.status != OrderStatus.DELIVERED:
        raise HTTPException(
            status_code=400,
            detail=f"Payment can only be initiated for delivered orders (current: {order.status.value})"
        )
    if order.payment_status == PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Order is already paid")

    # Create Razorpay order (amount in paise = INR × 100)
    amount_paise = int(float(order.agreed_price) * 100)
    try:
        rzp = get_razorpay_client()
        rzp_order = rzp.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": order.order_number,
            "notes": {
                "order_id": str(order.id),
                "client_email": current_user.email,
                "service": order.service_title or "",
            },
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=502,
            detail=f"Razorpay gateway error: {str(e)}"
        )

    # Persist transaction record
    txn = PaymentTransaction(
        order_id=order.id,
        razorpay_order_id=rzp_order["id"],
        amount_paise=amount_paise,
        currency="INR",
        status="created",
    )
    db.add(txn)
    await db.commit()

    return CreateRazorpayOrderResponse(
        razorpay_order_id=rzp_order["id"],
        amount=amount_paise,
        currency="INR",
        key_id=settings.razorpay_key_id,
        order_number=order.order_number,
        order_id=order.id,
    )


# ── 2. Verify Payment & Complete Order ────────────────────────────────────

@payment_router.post("/verify", response_model=OrderResponse)
async def verify_payment(
    body: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verify the Razorpay signature returned by the checkout popup.
    On success: marks payment as PAID and auto-completes the order.
    """
    # 1. Verify HMAC signature
    if not verify_razorpay_signature(
        body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature
    ):
        raise HTTPException(status_code=400, detail="Invalid payment signature. Payment not verified.")

    # 2. Load transaction
    txn_result = await db.execute(
        select(PaymentTransaction).where(
            PaymentTransaction.razorpay_order_id == body.razorpay_order_id
        )
    )
    txn = txn_result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment transaction not found")

    # 3. Load order with all relations
    order_result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.client),
            selectinload(Order.provider),
            selectinload(Order.service),
        )
        .where(Order.id == txn.order_id)
    )
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 4. Update transaction record
    txn.razorpay_payment_id = body.razorpay_payment_id
    txn.razorpay_signature = body.razorpay_signature
    txn.status = "captured"

    # Fetch payment method from Razorpay
    try:
        rzp = get_razorpay_client()
        payment_detail = rzp.payment.fetch(body.razorpay_payment_id)
        method = payment_detail.get("method", "card")
        txn.payment_method = method
    except Exception:
        method = "card"
        txn.payment_method = method

    # 5. Update order: mark PAID and COMPLETED
    order.payment_status = PaymentStatus.PAID
    order.payment_method = method
    order.status = OrderStatus.COMPLETED
    order.completed_at = datetime.utcnow()

    # 6. Credit provider earnings, debit client spent
    provider_result = await db.execute(select(User).where(User.id == order.provider_id))
    provider = provider_result.scalar_one()
    provider.total_earnings += float(order.agreed_price)

    client_result = await db.execute(select(User).where(User.id == order.client_id))
    client = client_result.scalar_one()
    client.total_spent += float(order.agreed_price)

    await db.commit()
    await db.refresh(order, ["client", "provider", "service"])

    # 🔔 Notify provider of payment received
    try:
        from app.notification_routes import create_notification
        await create_notification(
            db, order.provider_id,
            type="payment_received",
            title="Payment Received 💰",
            message=f"₹{order.agreed_price} received for '{order.service_title}'. Your earnings have been credited!",
            link=f"/orders/{order.id}",
        )
        await db.commit()
    except Exception as exc:
        logger.error(f"Failed to send payment notification: {exc}", exc_info=True)

    logger.info(
        f"✅ Payment verified — Order #{order.order_number} | "
        f"₹{order.agreed_price} | Razorpay: {body.razorpay_payment_id}"
    )
    return order


# ── 3. Webhook (for server-to-server reliability) ─────────────────────────

@payment_router.post("/webhook", status_code=200)
async def razorpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Receives server-to-server webhook events from Razorpay.
    Handles: payment.captured, payment.failed, refund.processed
    """
    body_bytes = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    # Verify webhook signature
    expected = hmac.new(
        settings.razorpay_webhook_secret.encode("utf-8"),
        body_bytes,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        logger.warning("Webhook: invalid signature received")
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    import json
    payload = json.loads(body_bytes)
    event = payload.get("event", "")
    entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    rzp_order_id = entity.get("order_id", "")

    result = await db.execute(
        select(PaymentTransaction).where(
            PaymentTransaction.razorpay_order_id == rzp_order_id
        )
    )
    txn = result.scalar_one_or_none()
    if not txn:
        return {"status": "ignored"}  # Unknown order, ignore

    if event == "payment.captured":
        txn.razorpay_payment_id = entity.get("id")
        txn.status = "captured"
        txn.payment_method = entity.get("method")
        # Ensure order is marked paid (backup for verify flow)
        order_result = await db.execute(select(Order).where(Order.id == txn.order_id))
        order = order_result.scalar_one_or_none()
        if order and order.payment_status == PaymentStatus.PENDING:
            order.payment_status = PaymentStatus.PAID
            order.payment_method = entity.get("method")

    elif event == "payment.failed":
        txn.status = "failed"
        txn.error_code = entity.get("error_code")
        txn.error_description = entity.get("error_description")

    elif event == "refund.processed":
        refund_entity = payload.get("payload", {}).get("refund", {}).get("entity", {})
        txn.razorpay_refund_id = refund_entity.get("id")
        txn.status = "refunded"
        order_result = await db.execute(select(Order).where(Order.id == txn.order_id))
        order = order_result.scalar_one_or_none()
        if order:
            order.payment_status = PaymentStatus.REFUNDED

    await db.commit()
    return {"status": "ok"}


# ── 4. Refund ──────────────────────────────────────────────────────────────

@payment_router.post("/refund/{order_id}", response_model=PaymentTransactionResponse)
async def initiate_refund(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Initiate a Razorpay refund for a paid order.
    Allowed only for: the client (if order cancelled/disputed) or an admin.
    """
    order_result = await db.execute(select(Order).where(Order.id == order_id))
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    is_client = order.client_id == current_user.id
    is_admin = current_user.role.value == "admin"
    if not (is_client or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to refund this order")
    if order.payment_status != PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Order has not been paid — nothing to refund")

    # Find the captured transaction
    txn_result = await db.execute(
        select(PaymentTransaction).where(
            PaymentTransaction.order_id == order_id,
            PaymentTransaction.status == "captured",
        )
    )
    txn = txn_result.scalar_one_or_none()
    if not txn or not txn.razorpay_payment_id:
        raise HTTPException(status_code=400, detail="No captured payment found for this order")

    try:
        rzp = get_razorpay_client()
        refund = rzp.payment.refund(txn.razorpay_payment_id, {"amount": txn.amount_paise})
        refund_id = refund.get("id")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Razorpay refund failed: {e}")
        raise HTTPException(status_code=502, detail=f"Refund failed: {str(e)}")

    # Update records
    txn.razorpay_refund_id = refund_id
    txn.status = "refunded"
    order.payment_status = PaymentStatus.REFUNDED

    # Reverse earnings
    provider_result = await db.execute(select(User).where(User.id == order.provider_id))
    provider = provider_result.scalar_one_or_none()
    if provider:
        provider.total_earnings = max(0.0, provider.total_earnings - float(order.agreed_price))

    client_result = await db.execute(select(User).where(User.id == order.client_id))
    client = client_result.scalar_one_or_none()
    if client:
        client.total_spent = max(0.0, client.total_spent - float(order.agreed_price))

    await db.commit()
    await db.refresh(txn)
    return txn


# ── 5. Payment Status ──────────────────────────────────────────────────────

@payment_router.get("/status/{order_id}", response_model=Optional[PaymentTransactionResponse])
async def get_payment_status(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the latest PaymentTransaction for a given order."""
    order_result = await db.execute(select(Order).where(Order.id == order_id))
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.client_id != current_user.id and order.provider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    txn_result = await db.execute(
        select(PaymentTransaction)
        .where(PaymentTransaction.order_id == order_id)
        .order_by(PaymentTransaction.created_at.desc())
    )
    return txn_result.scalars().first()
