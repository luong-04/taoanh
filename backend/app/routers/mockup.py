"""
Mockup Router for POD Design Studio.
Handles high-fidelity realistic garment compositing, custom shirt uploads,
model demographics styling, regional lifestyle presets, and Virtual Try-On routing.
"""
import uuid
import os
import shutil
import asyncio
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.config import MOCKUPS_DIR, PRODUCT_COLORS, MODEL_GENDERS, MODEL_AGE_BRACKETS, MODEL_VIBES, OUTPUT_DIR
from app.database import get_artwork_by_id, save_mockup, get_all_artworks, get_mockup_by_id, update_mockup
from app.services.mockup_engine import render_commercial_mockup, render_ai_model_mockup, render_ai_flatlay_mockup, render_ai_custom_mockup, recomposite_mockup_image
from app.services.prompt_builder import get_state_by_code
from app.services.extractor_service import auto_generate_mockup_prompt

router = APIRouter(prefix="/api/mockup", tags=["Mockup"])

class MockupGenerateRequest(BaseModel):
    artwork_id: str
    target_state: str = "TX"
    garment_color: str = "Black"
    mockup_type: str = "lifestyle" # "lifestyle" (Có người mẫu), "flatlay" (Không có người mẫu), "custom_mockup" (Upload ảnh mẫu)
    lifestyle_scene: str = "outdoor_lifestyle"
    product_style: str = "flatlay_wood" # "flatlay_wood", "flatlay_studio", "hanger_wall", "folded_display"
    print_placement: str = "center_chest" # "center_chest", "left_chest", "sleeve", "side_pose", "full_back", "oversized_center", "custom"
    model_gender: str = "Male"
    model_age: str = "30-40"
    model_body_type: str = "Athletic"
    model_ethnicity: str = "State AI Proposed"
    camera_style: str = "Lifestyle"
    pose: str = "Standing"
    aspect_ratio: str = "4:5" # "1:1", "4:5", "3:2", "16:9"
    custom_garment_url: Optional[str] = None
    uploaded_mockup_url: Optional[str] = None
    custom_mockup_prompt: Optional[str] = None
    provider: str = "shopapi"
    api_key: Optional[str] = None
    # Freeform custom placement controls
    custom_x_pct: Optional[float] = None
    custom_y_pct: Optional[float] = None
    custom_scale: Optional[float] = None
    custom_rotation: Optional[float] = 0.0
    blend_mode: str = "natural_dtg"
    opacity: float = 0.96

class MockupAdjustPlacementRequest(BaseModel):
    mockup_id: str
    artwork_id: Optional[str] = None
    x_pct: float
    y_pct: float
    scale: float
    rotation: float = 0.0
    blend_mode: str = "natural_dtg"
    opacity: float = 0.96

@router.get("/presets")
async def get_mockup_presets():
    """
    Returns available garment colors, general lifestyle scenes, print placements, and model presets.
    """
    return {
        "garment_colors": list(PRODUCT_COLORS.keys()),
        "mockup_types": ["lifestyle", "flatlay", "custom_mockup"],
        "lifestyle_scenes": [
            {"id": "outdoor_lifestyle", "name": "Đời Thường Ngoài Trời (Outdoor Lifestyle)", "desc": "Khung cảnh thiên nhiên, núi đồi, đồng cỏ bản địa đặc trưng theo Bang"},
            {"id": "residential_porch", "name": "Hiên Nhà Khu Dân Cư (Suburban Porch)", "desc": "Hiên nhà gỗ ngoại ô ấm cúng, sân vườn xanh mát theo phong cách Bang"},
            {"id": "urban_street", "name": "Phố Thị Hiện Đại (Downtown Urban)", "desc": "Đường phố trung tâm, kiến trúc đô thị năng động đặc trưng của Bang"},
            {"id": "workshop_garage", "name": "Xưởng Cơ Khí & Garage (Artisan Workshop)", "desc": "Xưởng làm việc, nhà kho mộc mạc phong trần chuẩn phong cách người lao động"},
            {"id": "commercial_studio", "name": "Studio Sản Phẩm Sạch (Clean Studio)", "desc": "Phông nền studio trung tính, ánh sáng thương mại chuẩn Etsy/Amazon"}
        ],
        "product_styles": [
            {"id": "flatlay_wood", "name": "Trải Sàn Gỗ Mộc (Rustic Reclaimed Wood)", "desc": "Mặt bàn gỗ mộc rustic tự nhiên, ánh sáng ấm cúng chân thực"},
            {"id": "flatlay_studio", "name": "Studio Tối Giản (Amazon / Etsy Clean)", "desc": "Nền trung tính sáng sạch chuyên nghiệp chuẩn sàn thương mại điện tử"},
            {"id": "hanger_wall", "name": "Móc Gỗ Treo Tường (Minimalist Wall Hanger)", "desc": "Áo treo trên móc gỗ tự nhiên trên nền tường studio hiện đại"},
            {"id": "folded_display", "name": "Gấp Gọn Trưng Bày (Boutique Folded)", "desc": "Áo gấp gọn tinh tế trên bàn trưng bày cửa hàng thời trang cao cấp"}
        ],
        "print_placements": [
            {"id": "center_chest", "name": "Giữa Ngực (Center Chest)", "desc": "In DTG tiêu chuẩn chính giữa ngực áo (30x35 cm)"},
            {"id": "left_chest", "name": "Ngực Trái / Túi Áo (Left Chest)", "desc": "Logo thương hiệu nhỏ gọn trên ngực trái (10x10 cm)"},
            {"id": "sleeve", "name": "Cánh Tay Áo (Sleeve / Shoulder Patch)", "desc": "Huy hiệu in trên bắp tay áo (10x10 cm)"},
            {"id": "side_pose", "name": "Dáng Nghiêng (Side Pose / Profile)", "desc": "Tối ưu cho người mẫu đứng nghiêng hoặc quay đầu nhìn xa"},
            {"id": "full_back", "name": "Mặt Lưng (Full Back)", "desc": "In khổ lớn trên toàn bộ mặt lưng áo (35x45 cm)"},
            {"id": "oversized_center", "name": "Khổ Lớn Streetwear (Oversized)", "desc": "Họa tiết graphic lớn phủ từ ngực xuống thân áo (38x48 cm)"},
            {"id": "custom", "name": "Tùy Chỉnh Tự Do (Freeform Custom)", "desc": "Tự do kéo thả hoặc chỉnh tọa độ X, Y, Kích thước %, Góc xoay"}
        ],
        "blend_modes": [
            {"id": "natural_dtg", "name": "DTG Thấm Sợi Vải (Natural In-Fiber)", "desc": "Đổ bóng nếp vải tự nhiên, bề mặt sợi cotton chân thực"},
            {"id": "multiply", "name": "Hòa Trộn Đậm Đà (Multiply)", "desc": "Hòa trộn sâu vào nền áo cho màu áo sáng"},
            {"id": "vintage_wash", "name": "Hiệu Ứng Bạc Màu Cổ Điển (Vintage Wash)", "desc": "Phong cách wash bạc màu nhẹ phong trần"},
            {"id": "vibrant", "name": "Màu Sắc Nổi Bật (Vibrant Pop)", "desc": "Màu sắc tươi tắn rõ nét nhưng vẫn giữ nếp gấp vải"}
        ],
        "model_genders": ["Male", "Female", "Couple"],
        "model_age_brackets": ["20-30", "30-40", "40-50", "50+"],
        "model_body_types": ["Slim", "Athletic", "Average", "Plus-size"],
        "model_ethnicities": ["State AI Proposed", "Diverse", "White / Caucasian", "Black / African American", "Hispanic / Latino", "Asian", "Native American"],
        "camera_styles": ["Lifestyle", "Commercial", "Editorial", "Close-up Detail"],
        "poses": ["Standing", "Sitting on Porch", "Walking Outdoors", "Heroic Front View"],
        "aspect_ratios": ["1:1", "4:5", "3:2", "16:9"]
    }

@router.post("/upload-garment")
async def upload_custom_garment(file: UploadFile = File(...)):
    """
    Allows user to upload a custom blank t-shirt or POD platform rendered preview (from Printify/Printful).
    """
    upload_id = f"garment_{uuid.uuid4().hex[:8]}"
    ext = os.path.splitext(file.filename)[1] or ".png"
    save_filename = f"{upload_id}{ext}"
    save_path = os.path.join(str(MOCKUPS_DIR), save_filename)
    
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {
        "success": True,
        "garment_url": f"/static/mockups/{save_filename}",
        "filename": save_filename
    }

@router.post("/analyze-uploaded-mockup")
async def analyze_uploaded_mockup(
    file: Optional[UploadFile] = File(None),
    mockup_url: Optional[str] = Form(None),
    artwork_id: str = Form(...),
    print_placement: str = Form("center_chest"),
    target_state: str = Form("TX")
):
    """
    Analyzes an uploaded mockup image (model or flatlay), determines garment color and scene type,
    and automatically crafts a custom FLUX/ShopAPI prompt to cleanly place the chosen artwork
    at the user's selected position (center chest, left chest, sleeve, full back, oversized).
    """
    try:
        os.makedirs(str(MOCKUPS_DIR), exist_ok=True)
        if file:
            upload_id = f"custom_mock_{uuid.uuid4().hex[:8]}"
            ext = os.path.splitext(file.filename or "")[1] or ".png"
            save_filename = f"{upload_id}{ext}"
            save_path = os.path.join(str(MOCKUPS_DIR), save_filename)
            with open(save_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            resolved_mockup_url = f"/static/mockups/{save_filename}"
        elif mockup_url:
            resolved_mockup_url = mockup_url
            fname = os.path.basename(mockup_url.split("?")[0])
            save_path = os.path.join(str(MOCKUPS_DIR), fname)
            if not os.path.exists(save_path):
                save_path = mockup_url
        else:
            raise HTTPException(status_code=400, detail="Vui lòng tải lên ảnh mockup hoặc truyền mockup_url")
            
        if not os.path.exists(save_path):
            raise HTTPException(status_code=404, detail="File ảnh mockup không tồn tại trên hệ thống")

        analysis = auto_generate_mockup_prompt(
            mockup_image_path=save_path,
            artwork_id=artwork_id,
            print_placement=print_placement,
            target_state=target_state
        )
        
        return {
            "success": True,
            "uploaded_mockup_url": resolved_mockup_url,
            "prompt": analysis["prompt"],
            "garment_color": analysis["garment_color"],
            "scene_type": analysis["scene_type"],
            "placement": analysis["placement"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in analyze_uploaded_mockup: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate")
async def generate_mockup(
    req: MockupGenerateRequest,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    try:
        mockup_id = f"mock_{uuid.uuid4().hex[:10]}"
        
        # Verify artwork
        artwork = get_artwork_by_id(req.artwork_id)
        if not artwork:
            raise HTTPException(status_code=404, detail=f"Artwork with id '{req.artwork_id}' not found")
            
        artwork_path = artwork.get("transparent_image_path")
        if not artwork_path or not os.path.exists(artwork_path):
            raise HTTPException(status_code=400, detail="Master transparent artwork image file not found on disk")
            
        state = get_state_by_code(req.target_state)
        state_name = state["name"] if state else req.target_state
        
        # Check custom garment if user uploaded a POD shirt (e.g. from Printify or Printful)
        custom_garment_path = None
        if req.custom_garment_url:
            fname = os.path.basename(req.custom_garment_url)
            candidate = os.path.join(str(MOCKUPS_DIR), fname)
            if os.path.exists(candidate):
                custom_garment_path = candidate
            elif os.path.exists(req.custom_garment_url):
                custom_garment_path = req.custom_garment_url
        
        # Render high-fidelity commercial mockup with zero hallucination
        artwork_title = artwork.get("title", "")
        artwork_slogan = artwork.get("slogan", "")
        artwork_prompt = artwork.get("prompt", "")

        if req.mockup_type == "custom_mockup" or req.uploaded_mockup_url:
            custom_mockup_candidate = None
            raw_url = req.uploaded_mockup_url or req.custom_garment_url
            if raw_url:
                fname = os.path.basename(raw_url.split("?")[0])
                candidate = os.path.join(str(MOCKUPS_DIR), fname)
                if os.path.exists(candidate):
                    custom_mockup_candidate = candidate
                elif os.path.exists(raw_url):
                    custom_mockup_candidate = raw_url
            
            if not custom_mockup_candidate or not os.path.exists(custom_mockup_candidate):
                raise HTTPException(status_code=400, detail="Uploaded custom mockup image file not found on disk")
                
            prompt = req.custom_mockup_prompt
            if not prompt or not prompt.strip():
                auto_res = auto_generate_mockup_prompt(
                    mockup_image_path=custom_mockup_candidate,
                    artwork_id=req.artwork_id,
                    print_placement=req.print_placement,
                    target_state=req.target_state
                )
                prompt = auto_res["prompt"]
                
            render_result = await asyncio.to_thread(
                render_ai_custom_mockup,
                artwork_path=artwork_path,
                custom_mockup_path=custom_mockup_candidate,
                custom_prompt=prompt,
                print_placement=req.print_placement,
                aspect_ratio=req.aspect_ratio,
                output_dir=str(MOCKUPS_DIR),
                mockup_id=mockup_id,
                custom_x_pct=req.custom_x_pct,
                custom_y_pct=req.custom_y_pct,
                custom_scale=req.custom_scale,
                custom_rotation=req.custom_rotation,
                blend_mode=req.blend_mode,
                opacity=req.opacity
            )
        elif req.mockup_type == "lifestyle":
            if req.provider in ["shopapi", "ai_shopapi", "local_compositor", "auto"]:
                try:
                    render_result = await asyncio.to_thread(
                        render_ai_model_mockup,
                        artwork_path=artwork_path,
                        state_code=req.target_state,
                        state_name=state_name,
                        garment_color=req.garment_color,
                        lifestyle_scene=req.lifestyle_scene,
                        model_gender=req.model_gender,
                        model_age=req.model_age,
                        model_body_type=req.model_body_type,
                        model_ethnicity=req.model_ethnicity,
                        pose=req.pose,
                        aspect_ratio=req.aspect_ratio,
                        print_placement=req.print_placement,
                        artwork_title=artwork_title,
                        artwork_slogan=artwork_slogan,
                        artwork_prompt=artwork_prompt,
                        output_dir=str(MOCKUPS_DIR),
                        mockup_id=mockup_id,
                        custom_garment_path=custom_garment_path,
                        custom_x_pct=req.custom_x_pct,
                        custom_y_pct=req.custom_y_pct,
                        custom_scale=req.custom_scale,
                        custom_rotation=req.custom_rotation,
                        blend_mode=req.blend_mode,
                        opacity=req.opacity
                    )
                except Exception as ai_err:
                    print(f"[Mockup Router] AI model generation error: {ai_err}. Falling back to commercial template...")
                    render_result = await asyncio.to_thread(
                        render_commercial_mockup,
                        artwork_path=artwork_path,
                        garment_color=req.garment_color,
                        mockup_type="lifestyle",
                        lifestyle_scene=req.lifestyle_scene,
                        aspect_ratio=req.aspect_ratio,
                        print_placement=req.print_placement,
                        output_dir=str(MOCKUPS_DIR),
                        mockup_id=mockup_id,
                        custom_garment_path=custom_garment_path,
                        custom_x_pct=req.custom_x_pct,
                        custom_y_pct=req.custom_y_pct,
                        custom_scale=req.custom_scale,
                        custom_rotation=req.custom_rotation,
                        blend_mode=req.blend_mode,
                        opacity=req.opacity
                    )
            else:
                render_result = await asyncio.to_thread(
                    render_commercial_mockup,
                    artwork_path=artwork_path,
                    garment_color=req.garment_color,
                    mockup_type="lifestyle",
                    lifestyle_scene=req.lifestyle_scene,
                    aspect_ratio=req.aspect_ratio,
                    print_placement=req.print_placement,
                    output_dir=str(MOCKUPS_DIR),
                    mockup_id=mockup_id,
                    custom_garment_path=custom_garment_path,
                    custom_x_pct=req.custom_x_pct,
                    custom_y_pct=req.custom_y_pct,
                    custom_scale=req.custom_scale,
                    custom_rotation=req.custom_rotation,
                    blend_mode=req.blend_mode,
                    opacity=req.opacity
                )
        else: # "flatlay" (Không có người mẫu - Commercial Product Catalog Shoot)
            if req.provider in ["shopapi", "ai_shopapi", "local_compositor", "auto"]:
                try:
                    render_result = await asyncio.to_thread(
                        render_ai_flatlay_mockup,
                        artwork_path=artwork_path,
                        state_code=req.target_state,
                        state_name=state_name,
                        garment_color=req.garment_color,
                        product_style=req.product_style or "flatlay_wood",
                        aspect_ratio=req.aspect_ratio,
                        print_placement=req.print_placement,
                        artwork_title=artwork_title,
                        artwork_slogan=artwork_slogan,
                        artwork_prompt=artwork_prompt,
                        output_dir=str(MOCKUPS_DIR),
                        mockup_id=mockup_id,
                        custom_garment_path=custom_garment_path,
                        custom_x_pct=req.custom_x_pct,
                        custom_y_pct=req.custom_y_pct,
                        custom_scale=req.custom_scale,
                        custom_rotation=req.custom_rotation,
                        blend_mode=req.blend_mode,
                        opacity=req.opacity
                    )
                except Exception as fl_err:
                    print(f"[Mockup Router] AI flatlay generation error: {fl_err}. Falling back to commercial template...")
                    render_result = await asyncio.to_thread(
                        render_commercial_mockup,
                        artwork_path=artwork_path,
                        garment_color=req.garment_color,
                        mockup_type="flatlay",
                        lifestyle_scene=req.product_style or "flatlay_wood",
                        aspect_ratio=req.aspect_ratio,
                        print_placement=req.print_placement,
                        output_dir=str(MOCKUPS_DIR),
                        mockup_id=mockup_id,
                        custom_garment_path=custom_garment_path,
                        custom_x_pct=req.custom_x_pct,
                        custom_y_pct=req.custom_y_pct,
                        custom_scale=req.custom_scale,
                        custom_rotation=req.custom_rotation,
                        blend_mode=req.blend_mode,
                        opacity=req.opacity
                    )
            else:
                render_result = await asyncio.to_thread(
                    render_commercial_mockup,
                    artwork_path=artwork_path,
                    garment_color=req.garment_color,
                    mockup_type="flatlay",
                    lifestyle_scene=req.product_style or "flatlay_wood",
                    aspect_ratio=req.aspect_ratio,
                    print_placement=req.print_placement,
                    output_dir=str(MOCKUPS_DIR),
                    mockup_id=mockup_id,
                    custom_garment_path=custom_garment_path,
                    custom_x_pct=req.custom_x_pct,
                    custom_y_pct=req.custom_y_pct,
                    custom_scale=req.custom_scale,
                    custom_rotation=req.custom_rotation,
                    blend_mode=req.blend_mode,
                    opacity=req.opacity
                )
        
        preview_url = f"/static/mockups/{os.path.basename(render_result['preview_path'])}"
        full_url = f"/static/mockups/{os.path.basename(render_result['mockup_path'])}"
        
        mock_title = (
            f"Custom Mockup - {artwork_title}" if req.mockup_type == "custom_mockup"
            else (f"{req.garment_color} - {state_name} Flat-lay" if req.mockup_type == "flatlay"
            else f"{req.garment_color} - {state_name} ({req.model_gender}, {req.model_age})")
        )
        
        mockup_data = {
            "id": mockup_id,
            "artwork_id": req.artwork_id,
            "title": mock_title,
            "target_state": req.target_state,
            "garment_color": req.garment_color,
            "model_gender": req.model_gender,
            "model_age": req.model_age,
            "model_vibe": f"{req.model_body_type} • {req.model_ethnicity}",
            "environment": req.lifestyle_scene,
            "aspect_ratio": req.aspect_ratio,
            "provider": req.provider,
            "mockup_image_path": render_result["mockup_path"],
            "preview_url": preview_url,
            "metadata": {
                "full_url": full_url,
                "clean_image_path": render_result.get("clean_image_path"),
                "width": render_result["width"],
                "height": render_result["height"],
                "mockup_type": req.mockup_type,
                "print_placement": req.print_placement,
                "custom_x_pct": req.custom_x_pct,
                "custom_y_pct": req.custom_y_pct,
                "custom_scale": req.custom_scale,
                "custom_rotation": req.custom_rotation,
                "blend_mode": req.blend_mode,
                "opacity": req.opacity,
                "model_body_type": req.model_body_type,
                "model_ethnicity": req.model_ethnicity,
                "camera_style": req.camera_style,
                "pose": req.pose,
                "artwork_title": artwork.get("title", ""),
                "state_name": state_name
            }
        }
        
        save_mockup(mockup_data)
        
        return {
            "success": True,
            "mockup": mockup_data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Mockup generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/adjust-placement")
async def adjust_mockup_placement(req: MockupAdjustPlacementRequest):
    """
    Instantly reposition, resize, rotate, and re-composite the print on an existing mockup
    with authentic fabric wrinkles & DTG in-fiber blending in < 0.2s without waiting for AI generation.
    """
    try:
        mockup = get_mockup_by_id(req.mockup_id)
        if not mockup:
            raise HTTPException(status_code=404, detail=f"Mockup '{req.mockup_id}' not found")
            
        artwork_id = req.artwork_id or mockup.get("artwork_id")
        if not artwork_id:
            raise HTTPException(status_code=400, detail="No artwork associated with this mockup")
            
        artwork = get_artwork_by_id(artwork_id)
        if not artwork:
            raise HTTPException(status_code=404, detail=f"Artwork '{artwork_id}' not found")
            
        artwork_path = artwork.get("transparent_image_path")
        if not artwork_path or not os.path.exists(artwork_path):
            raise HTTPException(status_code=400, detail="Master transparent artwork image file not found on disk")
            
        meta = mockup.get("metadata", {})
        
        # Locate clean base image
        clean_base = meta.get("clean_image_path")
        candidate_clean = os.path.join(str(MOCKUPS_DIR), f"{req.mockup_id}_clean.png")
        
        if not clean_base or not os.path.exists(clean_base):
            if os.path.exists(candidate_clean):
                clean_base = candidate_clean
            elif mockup.get("mockup_image_path") and os.path.exists(mockup["mockup_image_path"]):
                # If clean file doesn't exist, we can use the current mockup image as base
                clean_base = mockup["mockup_image_path"]
            else:
                raise HTTPException(status_code=400, detail="Clean base garment image not found for re-compositing")
                
        out_mockup_path = mockup.get("mockup_image_path") or os.path.join(str(MOCKUPS_DIR), f"{req.mockup_id}.png")
        out_preview_path = os.path.join(str(MOCKUPS_DIR), f"{req.mockup_id}_preview.png")
        
        is_life = meta.get("mockup_type", "lifestyle") == "lifestyle"
        
        render_result = await asyncio.to_thread(
            recomposite_mockup_image,
            clean_base_path=clean_base,
            artwork_path=artwork_path,
            output_mockup_path=out_mockup_path,
            output_preview_path=out_preview_path,
            placement="custom",
            x_pct=req.x_pct,
            y_pct=req.y_pct,
            scale=req.scale,
            rotation=req.rotation,
            opacity=req.opacity,
            blend_mode=req.blend_mode,
            is_lifestyle=is_life
        )
        
        # Update metadata in database
        meta.update({
            "clean_image_path": clean_base,
            "custom_x_pct": req.x_pct,
            "custom_y_pct": req.y_pct,
            "custom_scale": req.scale,
            "custom_rotation": req.rotation,
            "blend_mode": req.blend_mode,
            "opacity": req.opacity,
            "print_placement": "custom"
        })
        
        preview_url = f"/static/mockups/{os.path.basename(out_preview_path)}?t={int(os.path.getmtime(out_preview_path))}"
        full_url = f"/static/mockups/{os.path.basename(out_mockup_path)}?t={int(os.path.getmtime(out_mockup_path))}"
        meta["preview_url"] = preview_url
        meta["full_url"] = full_url
        
        update_mockup(req.mockup_id, {
            "metadata": meta,
            "preview_url": preview_url,
            "mockup_image_path": out_mockup_path
        })
        
        updated_mockup = get_mockup_by_id(req.mockup_id)
        
        return {
            "success": True,
            "mockup": updated_mockup
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Repositioning error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
