"""Common router utilities and pagination helpers."""
from sqlalchemy.ext.asyncio import AsyncSession


async def paginate(db: AsyncSession, query, count_query, page: int, page_size: int, order_by=None):
    """Run a paginated query and return (items, total, pages)."""
    total = (await db.execute(count_query)).scalar()
    if order_by is not None:
        query = query.order_by(order_by)
    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    pages = (total + page_size - 1) // page_size if total > 0 else 0
    return result.scalars().all(), total, pages
