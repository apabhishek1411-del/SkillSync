"""Routers package: modular endpoint collections for SkillSphere."""
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

__all__ = [
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
