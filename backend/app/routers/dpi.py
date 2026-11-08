"""
DPI & Print Resolution Router for POD Design Studio.
Provides endpoints for DPI inspection, physical print dimension calculation,
and industrial 300 DPI upscaling with transparent PNG master generation.
"""
import os
import uuid
import shutil
import asyncio
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from PIL import Image

from app.config import ARTWORKS_DIR, OUTPUT_DIR
from app.services.dpi_service import inspect_image_dpi, inspect_image_file, upscale_image_to_300dpi
from app.database import get_artwork_by_id, save_artwork

router = APIRouter(prefix="/api/dpi", tags=["DPI & Print Quality"])

@router.post("/inspect")
async def inspect_dpi(
    file: Optional[UploadFile] = File(None),
    artwork_id: Optional[str] = Form(None),
    image_url: Optional[str] = Form(None)
):
    """
    Inspects image resolution, DPI metadata, physical print dimensions (Inches & CM),
    and evaluates print readiness for POD printing.
    """
    try:
        # Case 1: Uploaded file
        if file and file.filename:
            content = await file.read()
            file_size = len(content)
            img = Image.open(io_bytes := __import__("io").BytesIO(content))
            return inspect_image_dpi(img, file_size_bytes=file_size, filename=file.filename)
            
        # Case 2: Existing Artwork ID
        if artwork_id:
            art = get_artwork_by_id(artwork_id)
            if not art:
                raise HTTPException(status_code=404, detail="Artwork không tồn tại")
            # Prefer transparent master image path if exists, otherwise preview/original
            img_path = art.get("transparent_image_path") or art.get("original_image_path")
            if img_path and os.path.exists(img_path):
                return inspect_image_file(img_path)
            else:
                raise HTTPException(status_code=404, detail="File ảnh của artwork không tìm thấy trên đĩa")

        # Case 3: Local Image URL / Path
        if image_url:
            # Handle static URL like /static/artworks/...
            clean_path = image_url
            if clean_path.startswith("/static/artworks/"):
                clean_path = os.path.join(str(ARTWORKS_DIR), clean_path.replace("/static/artworks/", ""))
            elif clean_path.startswith("/static/"):
                clean_path = os.path.join(str(OUTPUT_DIR), clean_path.replace("/static/", ""))
                
            if os.path.exists(clean_path):
                return inspect_image_file(clean_path)
            else:
                raise HTTPException(status_code=404, detail="Đường dẫn ảnh không hợp lệ hoặc không tồn tại")

        raise HTTPException(status_code=400, detail="Vui lòng cung cấp file ảnh, artwork_id hoặc image_url")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in inspect_dpi: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upscale")
async def upscale_dpi(
    file: Optional[UploadFile] = File(None),
    artwork_id: Optional[str] = Form(None),
    image_url: Optional[str] = Form(None),
    target_mode: Optional[str] = Form("dtg_standard"),
    target_width: Optional[int] = Form(None),
    target_height: Optional[int] = Form(None),
    enhance_sharpness: Optional[bool] = Form(True),
    auto_remove_background: Optional[bool] = Form(False),
    save_to_library: Optional[bool] = Form(True),
    title: Optional[str] = Form(None),
    state_code: Optional[str] = Form("US")
):
    """
    Upscales image quality to 300 DPI DTG print standards.
    Supports DTG 4500x5400 master canvas, proportional scaling, or 2X/4X scale.
    """
    try:
        input_img = None
        input_filename = "custom_image.png"
        source_art = None
        
        # 1. Resolve Input Image
        if file and file.filename:
            content = await file.read()
            input_filename = file.filename
            input_img = Image.open(__import__("io").BytesIO(content))
        elif artwork_id:
            source_art = get_artwork_by_id(artwork_id)
            if not source_art:
                raise HTTPException(status_code=404, detail="Artwork không tồn tại")
            img_path = source_art.get("transparent_image_path") or source_art.get("original_image_path")
            if not img_path or not os.path.exists(img_path):
                raise HTTPException(status_code=404, detail="File ảnh của artwork không tìm thấy trên đĩa")
            input_filename = os.path.basename(img_path)
            input_img = Image.open(img_path)
            if not title:
                title = f"{source_art.get('title', 'Thiết Kế')} (300 DPI Master)"
        elif image_url:
            clean_path = image_url
            if clean_path.startswith("/static/artworks/"):
                clean_path = os.path.join(str(ARTWORKS_DIR), clean_path.replace("/static/artworks/", ""))
            if not os.path.exists(clean_path):
                raise HTTPException(status_code=404, detail="Không tìm thấy file ảnh từ URL")
            input_filename = os.path.basename(clean_path)
            input_img = Image.open(clean_path)
        else:
            raise HTTPException(status_code=400, detail="Vui lòng cung cấp file ảnh, artwork_id hoặc image_url")

        # 2. Run Upscale & 300 DPI enhancement in background thread
        result = await asyncio.to_thread(
            upscale_image_to_300dpi,
            input_img=input_img,
            target_mode=target_mode or "dtg_standard",
            target_width=target_width,
            target_height=target_height,
            enhance_sharpness=enhance_sharpness if enhance_sharpness is not None else True,
            auto_remove_background=auto_remove_background if auto_remove_background is not None else False,
            output_dir=str(ARTWORKS_DIR)
        )

        # 3. Save to Artwork Database if requested
        saved_artwork_data = None
        if save_to_library:
            new_art_id = result["artwork_id"]
            art_title = title.strip() if title and title.strip() else f"300 DPI Master ({os.path.splitext(input_filename)[0]})"
            theme_val = source_art.get("theme", "HD 300 DPI Master") if source_art else "HD 300 DPI Master"
            style_val = source_art.get("design_style", "High-Resolution DTG") if source_art else "High-Resolution DTG"
            slogan_val = source_art.get("slogan", "300 DPI Industrial Print Ready") if source_art else "300 DPI Industrial Print Ready"
            
            saved_artwork_data = {
                "id": new_art_id,
                "title": art_title,
                "state_code": state_code or (source_art.get("state_code", "US") if source_art else "US"),
                "state_name": source_art.get("state_name", "United States") if source_art else "United States",
                "theme": theme_val,
                "design_style": style_val,
                "slogan": slogan_val,
                "product_color": source_art.get("product_color", "Black") if source_art else "Black",
                "prompt": f"Upscaled 300 DPI DTG Master from {input_filename}",
                "negative_prompt": "low resolution, blurry, artifacts",
                "provider": "dpi_engine_300",
                "model_name": "Lanczos-HD-Unsharp-300DPI",
                "original_image_path": result["master_path"],
                "transparent_image_path": result["master_path"],
                "preview_url": result["preview_url"],
                "width": result["after"]["width"],
                "height": result["after"]["height"],
                "dpi": 300,
                "metadata": {
                    "source": "dpi_upscaler",
                    "mode": target_mode,
                    "transparent_url": result["master_url"],
                    "garment_hex": "#141416",
                    "before_dpi": result["before"]["effective_dpi"],
                    "after_dpi": 300
                }
            }
            save_artwork(saved_artwork_data)
            result["saved_artwork"] = saved_artwork_data

        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in upscale_dpi: {e}")
        raise HTTPException(status_code=500, detail=str(e))

