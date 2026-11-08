"""
Settings & BYOK Validation Router for POD Design Studio.
"""
import os
import shutil
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from app.config import OUTPUT_DIR, ARTWORKS_DIR, MOCKUPS_DIR
from app.services.ai_providers import verify_provider_key

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class VerifyKeyRequest(BaseModel):
    provider: str
    api_key: str

@router.post("/verify")
async def verify_key(req: VerifyKeyRequest):
    result = await verify_provider_key(req.provider, req.api_key)
    return result

@router.get("/status")
async def get_system_status():
    artworks_count = len(os.listdir(ARTWORKS_DIR)) if os.path.exists(ARTWORKS_DIR) else 0
    mockups_count = len(os.listdir(MOCKUPS_DIR)) if os.path.exists(MOCKUPS_DIR) else 0
    
    total, used, free = shutil.disk_usage(OUTPUT_DIR)
    
    return {
        "status": "healthy",
        "output_directory": str(OUTPUT_DIR),
        "counts": {
            "artworks_files": artworks_count,
            "mockups_files": mockups_count
        },
        "storage": {
            "free_gb": round(free / (1024**3), 2),
            "total_gb": round(total / (1024**3), 2)
        }
    }

