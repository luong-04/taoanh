"""
History & Export Router for POD Design Studio.
Provides generation history, item deletion, and one-click ZIP bundle downloads.
"""
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any
from app.config import OUTPUT_DIR
from app.database import (
    get_all_artworks,
    get_artwork_by_id,
    get_all_mockups,
    delete_history_item,
    get_db_connection
)
from app.services.export_service import create_export_zip

router = APIRouter(prefix="/api/history", tags=["History"])

@router.get("")
async def get_history():
    artworks = get_all_artworks(limit=50)
    mockups = get_all_mockups(limit=50)
    return {
        "artworks": artworks,
        "mockups": mockups,
        "total_artworks": len(artworks),
        "total_mockups": len(mockups)
    }

@router.delete("/{item_type}/{item_id}")
async def delete_item(item_type: str, item_id: str):
    if item_type not in ["artwork", "mockup"]:
        raise HTTPException(status_code=400, detail="Invalid item type. Must be 'artwork' or 'mockup'")
    success = delete_history_item(item_type, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"success": True, "message": f"{item_type} deleted successfully"}

@router.post("/export-bundle/{artwork_id}")
async def export_bundle(artwork_id: str):
    artwork = get_artwork_by_id(artwork_id)
    if not artwork:
        raise HTTPException(status_code=404, detail=f"Artwork '{artwork_id}' not found")
        
    # Get associated mockups
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM mockups WHERE artwork_id = ?", (artwork_id,))
    mockup_rows = cursor.fetchall()
    conn.close()
    
    mockups = [dict(r) for r in mockup_rows]
    
    # Target ZIP path in output directory
    zip_filename = f"bundle_{artwork_id}.zip"
    zip_path = os.path.join(str(OUTPUT_DIR), zip_filename)
    
    create_export_zip(artwork, mockups, zip_path)
    
    return {
        "success": True,
        "download_url": f"/api/history/download/{zip_filename}",
        "filename": zip_filename
    }

@router.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(str(OUTPUT_DIR), filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested file not found")
    return FileResponse(
        file_path,
        media_type="application/zip",
        filename=filename
    )

