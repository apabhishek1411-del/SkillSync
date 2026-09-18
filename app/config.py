"""Application configuration using Pydantic Settings."""
import logging
import warnings
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

# Secrets that MUST be changed before production deployment
_UNSAFE_DEFAULTS = {
    "change-this-in-production",
    "change-this-jwt-secret",
    "dev-only-secret-change-in-production",
    "dev-only-jwt-secret-change-in-production",
    "CHANGE_ME_generate_a_random_secret",
    "CHANGE_ME_generate_a_random_jwt_secret",
}


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Application
    app_name: str = "SkillSphere"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-this-in-production"
    
    # Database
    database_url: str = "postgresql+asyncpg://skillhub:skillhub123@localhost:5432/skillhub"
    database_url_sync: str = "postgresql://skillhub:skillhub123@localhost:5432/skillhub"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # JWT
    jwt_secret_key: str = "change-this-jwt-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # College Domain
    allowed_email_domain: str = "ceconline.edu"
    
    # Admin
    admin_email: str = "admin@ceconline.edu"
    admin_password: str = "Admin@123"

    # Razorpay Payment Gateway
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.app_env.lower() == "production"

    def validate_secrets(self) -> None:
        """Validate that secrets are not using unsafe default values.
        
        In production: raises RuntimeError.
        In development: logs a loud warning.
        """
        problems: list[str] = []
        if self.secret_key in _UNSAFE_DEFAULTS:
            problems.append("SECRET_KEY is using an unsafe default value")
        if self.jwt_secret_key in _UNSAFE_DEFAULTS:
            problems.append("JWT_SECRET_KEY is using an unsafe default value")

        if not problems:
            return

        msg = (
            "⚠️  INSECURE CONFIGURATION DETECTED ⚠️\n"
            + "\n".join(f"  • {p}" for p in problems)
            + "\nGenerate secure keys with: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
        )

        if self.is_production:
            raise RuntimeError(
                f"Cannot start in production with default secrets.\n{msg}"
            )
        else:
            warnings.warn(msg, stacklevel=2)
            logger.warning(msg)


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    s = Settings()
    s.validate_secrets()
    return s


settings = get_settings()
