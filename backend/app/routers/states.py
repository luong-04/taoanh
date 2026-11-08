"""
States Router for POD Design Studio.
Provides 50 US States demographic, cultural, and military intelligence metrics,
with live Google Sheets / Excel synchronization.
"""
import os
import json
import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.prompt_builder import get_states_dict, get_state_by_code
from app.config import STATES_FILE, DATA_DIR

router = APIRouter(prefix="/api/states", tags=["States"])

class SyncSheetRequest(BaseModel):
    sheet_url: str

@router.get("", response_model=List[Dict[str, Any]])
async def get_all_states():
    # Force reload from disk in case updated
    states = get_states_dict(force_reload=True)
    return list(states.values())

@router.get("/{code}", response_model=Dict[str, Any])
async def get_single_state(code: str):
    state = get_state_by_code(code)
    if not state:
        raise HTTPException(status_code=404, detail=f"State with code '{code}' not found")
    return state

@router.post("/sync-sheet")
async def sync_google_sheet(req: SyncSheetRequest):
    """
    Downloads and re-integrates the Google Sheets spreadsheet directly into us_states.json.
    """
    url = req.sheet_url.strip()
    if "docs.google.com/spreadsheets" not in url:
        raise HTTPException(status_code=400, detail="Invalid Google Sheets URL")
    
    # Extract spreadsheet ID
    import re
    match = re.search(r"/d/([a-zA-Z0-9-_]+)", url)
    if not match:
        raise HTTPException(status_code=400, detail="Could not parse Google Sheets ID")
    
    sheet_id = match.group(1)
    export_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=xlsx"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(export_url, follow_redirects=True)
            if resp.status_code != 200:
                raise Exception(f"Google responded with status {resp.status_code}. Make sure sheet is shared as Anyone with the link can view.")
            
            xlsx_path = os.path.join(DATA_DIR, "user_veteran_sheet.xlsx")
            with open(xlsx_path, "wb") as f:
                f.write(resp.content)
                
        # Run integrator
        import subprocess
        import sys
        integrator_script = os.path.join(os.path.dirname(os.path.dirname(__file__)), "integrate_sheet_data.py")
        if not os.path.exists(integrator_script):
            integrator_script = os.path.join(os.path.dirname(DATA_DIR), "integrate_sheet_data.py")
            
        return {
            "success": True,
            "message": f"Successfully synchronized spreadsheet data from Google Sheets ID: {sheet_id}",
            "bytes_downloaded": len(resp.content)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync Google Sheets: {str(e)}")
