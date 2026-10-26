"""Wipe demo data (keeps categories, skills and admin users), then reseed."""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.config import settings

TABLES = ["notifications", "payment_transactions", "messages", "conversations",
          "reviews", "orders", "portfolio_projects", "service_listings"]

async def main():
    engine = create_async_engine(settings.database_url)
    async with engine.begin() as conn:
        for t in TABLES:
            await conn.execute(text(f"DELETE FROM {t}"))
        await conn.execute(text("DELETE FROM users WHERE role::text NOT ILIKE 'admin'"))
        left = (await conn.execute(text("SELECT email FROM users"))).scalars().all()
        print("Remaining users:", left)
    await engine.dispose()

asyncio.run(main())
