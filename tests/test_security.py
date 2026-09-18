"""
Security and validation tests for SkillSphere backend hardening.
"""
import pytest
from pydantic import ValidationError
from app.utils import get_password_hash, verify_password
from app.routes import _detect_image_type, ALLOWED_SORT_FIELDS
from app.config import Settings


class TestSecurityHardening:
    """Tests covering security hardening fixes from Phase 2."""

    def test_password_hashing(self):
        pwd = "CollegeSecure@2026"
        hashed = get_password_hash(pwd)
        assert hashed != pwd
        assert verify_password(pwd, hashed) is True
        assert verify_password("WrongPassword", hashed) is False

    def test_magic_byte_validation_jpeg(self):
        fake_jpeg = b"\xff\xd8\xff\xe0" + b"randompayload"
        assert _detect_image_type(fake_jpeg) == "image/jpeg"

    def test_magic_byte_validation_png(self):
        fake_png = b"\x89PNG\r\n\x1a\n" + b"randompayload"
        assert _detect_image_type(fake_png) == "image/png"

    def test_magic_byte_validation_rejects_malicious_script(self):
        # A php file disguised with image name
        malicious_script = b"<?php echo 'malicious'; ?>"
        assert _detect_image_type(malicious_script) is None

    def test_sort_fields_whitelist(self):
        # Whitelist must only contain safe columns
        assert "hashed_password" not in _ALLOWED_SORT_FIELDS
        assert "is_superuser" not in _ALLOWED_SORT_FIELDS
        assert "created_at" in _ALLOWED_SORT_FIELDS
        assert "price" in _ALLOWED_SORT_FIELDS
        assert "average_rating" in _ALLOWED_SORT_FIELDS

    def test_production_mode_blocks_default_secrets(self):
        # Settings in production mode with default secret must raise RuntimeError
        s = Settings(
            app_env="production",
            secret_key="change-this-in-production",
            jwt_secret_key="change-this-jwt-secret"
        )
        with pytest.raises(RuntimeError) as exc_info:
            s.validate_secrets()
        assert "INSECURE CONFIGURATION DETECTED" in str(exc_info.value)
