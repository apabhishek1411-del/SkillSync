"""Upload router: secure image and asset uploads with magic-byte validation."""
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.models import User
from app.utils import get_current_user

upload_router = APIRouter(prefix="/upload", tags=["Upload"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

# Magic byte signatures for allowed image formats
_MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"GIF87a": "image/gif",
    b"GIF89a": "image/gif",
    b"RIFF": "image/webp",  # WebP starts with RIFF....WEBP
}


def _detect_image_type(data: bytes) -> str | None:
    """Detect image type from magic bytes. Returns MIME type or None."""
    for magic, mime in _MAGIC_BYTES.items():
        if data[:len(magic)] == magic:
            if magic == b"RIFF" and data[8:12] != b"WEBP":
                continue
            return mime
    return None


@upload_router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload an image file. Returns the URL to access it."""
    # 1. Check declared content type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, GIF, and WebP images are allowed")
    
    # 2. Check file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension '{ext}' is not allowed")
    
    # 3. Read and check size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5 MB)")
    
    # 4. Validate magic bytes — the real content check
    detected_type = _detect_image_type(contents)
    if detected_type is None:
        raise HTTPException(
            status_code=400,
            detail="File content does not match a valid image format. Upload a real JPEG, PNG, GIF, or WebP file."
        )
    
    # 5. Force a safe extension based on detected type (ignore client extension)
    safe_ext = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
    }[detected_type]
    
    unique_name = f"{uuid.uuid4().hex}{safe_ext}"
    
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, unique_name)
    with open(file_path, "wb") as f:
        f.write(contents)
    
    return {"url": f"/static/uploads/{unique_name}", "filename": unique_name}
