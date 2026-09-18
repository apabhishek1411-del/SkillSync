"""Master API router aggregator for SkillSphere.

Sub-routers are modularized under app/routers/:
- auth: Authentication & token refresh
- users: User profiles & search
- skills: Skill taxonomy & categories
- services: Service listings & TF-IDF semantic search
- orders: Order lifecycle & status machine
- reviews: Reviews, sentiment analysis & responses
- admin: Campus administration & moderation
- chat: P2P messaging & conversations
- portfolio: Student portfolio showcase
- upload: File uploads with magic byte validation
"""
from fastapi import APIRouter

from app.routers.auth import auth_router
from app.routers.users import users_router
from app.routers.skills import skills_router
from app.routers.services import services_router, ALLOWED_SORT_FIELDS
from app.routers.orders import orders_router
from app.routers.reviews import reviews_router
from app.routers.admin import admin_router
from app.routers.chat import chat_router
from app.routers.portfolio import portfolio_router
from app.routers.upload import upload_router, _detect_image_type
from app.routers.common import paginate

# Master API router
api_router = APIRouter()

# Register all modular sub-routers
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(skills_router)
api_router.include_router(services_router)
api_router.include_router(orders_router)
api_router.include_router(reviews_router)
api_router.include_router(admin_router)
api_router.include_router(chat_router)
api_router.include_router(portfolio_router)
api_router.include_router(upload_router)

__all__ = [
    "api_router",
    "auth_router",
    "users_router",
    "skills_router",
    "services_router",
    "orders_router",
    "reviews_router",
    "admin_router",
    "chat_router",
    "portfolio_router",
    "upload_router",
    "paginate",
    "ALLOWED_SORT_FIELDS",
    "_detect_image_type",
]
