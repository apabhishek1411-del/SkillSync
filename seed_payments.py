"""Create captured PaymentTransaction rows for all paid orders lacking one (so receipts show in demo)."""
import asyncio, random, string
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.config import settings
from app.models import Order, PaymentStatus, PaymentTransaction

def rid(n=14):
    return "".join(random.choices(string.ascii_letters + string.digits, k=n))

async def main():
    engine = create_async_engine(settings.database_url)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as db:
        orders = (await db.execute(select(Order).where(Order.payment_status == PaymentStatus.PAID))).scalars().all()
        n = 0
        for o in orders:
            exists = (await db.execute(select(PaymentTransaction).where(PaymentTransaction.order_id == o.id))).first()
            if exists:
                continue
            paid_at = o.accepted_at or o.created_at
            db.add(PaymentTransaction(
                order_id=o.id,
                razorpay_order_id=f"order_{rid()}",
                razorpay_payment_id=f"pay_{rid()}",
                amount_paise=int(o.agreed_price * 100),
                currency="INR",
                status="captured",
                payment_method=o.payment_method or "upi",
                created_at=paid_at,
                updated_at=o.completed_at or paid_at,
            ))
            n += 1
        await db.commit()
        print(f"Created {n} payment transactions")
    await engine.dispose()

asyncio.run(main())
