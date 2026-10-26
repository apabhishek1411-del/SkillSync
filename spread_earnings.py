"""Spread completed/paid order dates across the last 6 months so the earnings chart looks realistic."""
import asyncio, random
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.config import settings
from app.models import Order, OrderStatus, PaymentStatus, PaymentTransaction

async def main():
    random.seed(7)
    engine = create_async_engine(settings.database_url)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as db:
        orders = (await db.execute(select(Order).where(
            Order.status == OrderStatus.COMPLETED, Order.payment_status == PaymentStatus.PAID))).scalars().all()
        now = datetime.utcnow()
        for o in orders:
            done = now - timedelta(days=random.randint(1, 165))
            start = done - timedelta(days=random.randint(3, 8))
            o.created_at, o.accepted_at, o.completed_at, o.actual_delivery = start, start, done, done
            o.updated_at = done
            for t in (await db.execute(select(PaymentTransaction).where(PaymentTransaction.order_id == o.id))).scalars():
                t.created_at, t.updated_at = start, done
        await db.commit()
        print("Updated", len(orders), "orders")
    await engine.dispose()
asyncio.run(main())
