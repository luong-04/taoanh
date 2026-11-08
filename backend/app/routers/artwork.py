"""
Artwork Generation Router for POD Design Studio.
Handles prompt assembly, creative concept generation, batch artwork production,
and local background removal for 4500x5400 px DTG master transparent PNG.
"""
import uuid
import os
import shutil
import asyncio
from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.config import ARTWORKS_DIR, MOCKUPS_DIR, PRODUCT_COLORS
from app.services.prompt_builder import (
    build_artwork_prompt,
    suggest_slogans_for_state,
    generate_creative_concepts,
    get_state_by_code,
    get_design_ideas
)
from app.services.shopapi_client import check_shopapi_status, generate_slogans_with_shopapi
from app.services.ai_providers import generate_artwork_image
from app.services.background_removal import process_and_save_artwork_files
from app.services.extractor_service import extract_artwork_with_ai, extract_artwork_locally
from app.database import save_artwork

router = APIRouter(prefix="/api/artwork", tags=["Artwork"])

class SloganRequest(BaseModel):
    state_code: str
    theme: str
    niche: Optional[str] = None
    audience: Optional[str] = "All Veterans"
    variation: Optional[int] = 0

class SloganResponse(BaseModel):
    state_code: str
    theme: str
    niche: Optional[str] = None
    slogans: List[str]

class ConceptRequest(BaseModel):
    state_code: str
    theme: str
    niche: Optional[str] = None
    audience: Optional[str] = "All Veterans"
    design_layout: Optional[str] = "open_silhouette"
    variation: Optional[int] = 0

class PromptBuildRequest(BaseModel):
    state_code: str
    theme: str
    niche: Optional[str] = None
    design_style: str
    slogan: str
    product_color: str
    audience: Optional[str] = "All Veterans"
    product_type: Optional[str] = "T-shirt"
    design_layout: Optional[str] = "open_silhouette"
    custom_notes: Optional[str] = None

class GenerateArtworkRequest(BaseModel):
    state_code: str
    theme: str
    niche: Optional[str] = None
    design_style: str
    slogan: str
    product_color: str
    audience: Optional[str] = "All Veterans"
    product_type: Optional[str] = "T-shirt"
    design_layout: Optional[str] = "open_silhouette"
    provider: str = "shopapi"
    api_key: Optional[str] = None
    custom_prompt: Optional[str] = None
    custom_negative_prompt: Optional[str] = None
    batch_size: int = 1
    api_key: Optional[str] = None
    idea_title: Optional[str] = None

@router.get("/design-ideas")
async def list_design_ideas():
    """
    Returns the 10 authentic design ideas extracted from user Google Sheet.
    """
    ideas = get_design_ideas()
    return {"design_ideas": ideas}

@router.get("/provider-status")
async def get_provider_status():
    """
    Returns current status and credit/image balance for ShopAPI.
    """
    status = check_shopapi_status()
    return status

@router.post("/suggest-slogans", response_model=SloganResponse)
async def suggest_slogans(req: SloganRequest):
    state = get_state_by_code(req.state_code)
    state_name = state["name"] if state else req.state_code
    state_nickname = state.get("nickname", "The Free State") if state else "The Free State"

    # 1. First attempt: Real AI slogan generation via ShopAPI (Claude Sonnet 5)
    ai_slogans = await generate_slogans_with_shopapi(
        state_code=req.state_code,
        state_name=state_name,
        state_nickname=state_nickname,
        theme=req.theme,
        niche=req.niche,
        audience=req.audience or "All Veterans",
        variation=req.variation or 0
    )

    if ai_slogans and len(ai_slogans) > 0:
        return SloganResponse(
            state_code=req.state_code,
            theme=req.theme,
            niche=req.niche,
            slogans=ai_slogans
        )

    # 2. Seamless high-fidelity fallback if ShopAPI is unreachable or offline
    fallback_slogans = suggest_slogans_for_state(req.state_code, req.theme, req.audience, req.variation or 0, niche=req.niche)
    return SloganResponse(
        state_code=req.state_code,
        theme=req.theme,
        niche=req.niche,
        slogans=fallback_slogans
    )

@router.post("/concepts")
async def get_concepts(req: ConceptRequest):
    state = get_state_by_code(req.state_code)
    state_name = state["name"] if state else req.state_code
    state_nickname = state.get("nickname", "The Free State") if state else "The Free State"

    # Attempt to use real AI slogans from ShopAPI to enrich creative concepts
    ai_slogans = await generate_slogans_with_shopapi(
        state_code=req.state_code,
        state_name=state_name,
        state_nickname=state_nickname,
        theme=req.theme,
        niche=req.niche,
        audience=req.audience or "All Veterans",
        variation=req.variation or 0
    )

    concepts = generate_creative_concepts(
        req.state_code,
        req.theme,
        req.audience or "All Veterans",
        req.design_layout or "open_silhouette",
        req.variation or 0,
        slogan_pool_override=ai_slogans,
        niche=req.niche
    )
    return {"concepts": concepts}

@router.post("/build-prompt")
async def build_prompt(req: PromptBuildRequest):
    result = build_artwork_prompt(
        state_code=req.state_code,
        theme=req.theme,
        design_style=req.design_style,
        slogan=req.slogan,
        product_color=req.product_color,
        audience=req.audience or "All Veterans",
        design_layout=req.design_layout or "open_silhouette",
        custom_notes=req.custom_notes,
        niche=req.niche
    )
    return result

@router.post("/generate")
async def generate_artwork(
    req: GenerateArtworkRequest,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    try:
        state = get_state_by_code(req.state_code)
        state_name = state["name"] if state else req.state_code
        effective_key = req.api_key or x_api_key
        
        # Build prompt or use user's custom edited prompt
        prompt_info = build_artwork_prompt(
            state_code=req.state_code,
            theme=req.theme,
            design_style=req.design_style,
            slogan=req.slogan,
            product_color=req.product_color,
            audience=req.audience or "All Veterans",
            design_layout=req.design_layout or "open_silhouette",
            niche=req.niche
        )
        base_prompt = req.custom_prompt.strip() if req.custom_prompt and req.custom_prompt.strip() else prompt_info["prompt"]
        final_negative = req.custom_negative_prompt.strip() if req.custom_negative_prompt and req.custom_negative_prompt.strip() else prompt_info["negative_prompt"]
        
        generated_artworks = []
        count = max(1, min(4, req.batch_size))
        
        for idx in range(count):
            artwork_id = f"art_{uuid.uuid4().hex[:10]}"
            # Add slight variant seed to prompt if batch > 1
            variant_prompt = base_prompt
            if count > 1:
                variant_prompt += f" Concept variation #{idx+1}."
                
            # 1. Call AI Provider or Procedural Engine
            raw_img = await generate_artwork_image(
                provider=req.provider,
                prompt=variant_prompt,
                negative_prompt=final_negative,
                api_key=effective_key,
                state_code=req.state_code,
                theme=req.theme,
                design_style=req.design_style,
                slogan=req.slogan,
                product_color=req.product_color
            )
            
            # 2. Run Background Removal & DTG 4500x5400 300 DPI processor in thread
            file_results = await asyncio.to_thread(
                process_and_save_artwork_files,
                raw_img=raw_img,
                artwork_id=artwork_id,
                output_dir=str(ARTWORKS_DIR)
            )
            
            preview_url = f"/static/artworks/{os.path.basename(file_results['preview_path'])}"
            transparent_url = f"/static/artworks/{os.path.basename(file_results['master_path'])}"
            
            # 3. Save to SQLite database
            artwork_data = {
                "id": artwork_id,
                "title": f"{state_name} {req.theme} - {req.design_style}" + (f" (Var {idx+1})" if count > 1 else ""),
                "state_code": req.state_code,
                "state_name": state_name,
                "theme": req.theme,
                "design_style": req.design_style,
                "slogan": req.slogan,
                "product_color": req.product_color,
                "prompt": variant_prompt,
                "negative_prompt": final_negative,
                "provider": req.provider,
                "model_name": req.provider,
                "original_image_path": file_results["raw_path"],
                "transparent_image_path": file_results["master_path"],
                "preview_url": preview_url,
                "width": file_results["width"],
                "height": file_results["height"],
                "dpi": file_results["dpi"],
                "metadata": {
                    "audience": req.audience or "All Veterans",
                    "product_type": req.product_type or "T-shirt",
                    "symbols": state.get("cultural_heritage", {}).get("symbols", []) if state else [],
                    "transparent_url": transparent_url,
                    "garment_hex": PRODUCT_COLORS.get(req.product_color, {}).get("hex", "#000000")
                }
            }
            save_artwork(artwork_data)
            generated_artworks.append(artwork_data)
            
        return {
            "success": True,
            "artwork": generated_artworks[0],
            "batch": generated_artworks,
            "total_generated": len(generated_artworks)
        }
    except Exception as e:
        print(f"Artwork generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract-from-mockup")
async def extract_artwork_from_mockup(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    hint: Optional[str] = Form(None),
    target_state: Optional[str] = Form("US"),
    extraction_engine: Optional[str] = Form("shopapi")
):
    """
    Extracts the printed graphic design from an uploaded mockup image into a 4K RGBA transparent PNG master.
    Saves as a new Artwork in the database so it can immediately be used in Mockup Studio.
    """
    try:
        artwork_id = f"art_ext_{uuid.uuid4().hex[:10]}"
        os.makedirs(str(MOCKUPS_DIR), exist_ok=True)
        os.makedirs(str(ARTWORKS_DIR), exist_ok=True)
        
        # Save uploaded mockup image to disk
        ext = os.path.splitext(file.filename or "")[1] or ".png"
        temp_mockup_path = os.path.join(str(MOCKUPS_DIR), f"upload_extract_{artwork_id}{ext}")
        with open(temp_mockup_path, "wb") as buf:
            shutil.copyfileobj(file.file, buf)
            
        print(f"[Artwork Extractor] Uploaded mockup saved to {temp_mockup_path}. Extracting design...")
        
        raw_reconstructed = None
        if extraction_engine == "shopapi":
            raw_reconstructed = await asyncio.to_thread(
                extract_artwork_with_ai,
                mockup_image_path=temp_mockup_path,
                user_hint=hint
            )
            
        if not raw_reconstructed:
            print("[Artwork Extractor] ShopAPI not available or fallback requested, using precision CV extraction...")
            raw_reconstructed = await asyncio.to_thread(
                extract_artwork_locally,
                mockup_image_path=temp_mockup_path
            )
            
        # Run background removal & 4500x5400 300 DPI master processing
        file_results = await asyncio.to_thread(
            process_and_save_artwork_files,
            raw_img=raw_reconstructed,
            artwork_id=artwork_id,
            output_dir=str(ARTWORKS_DIR)
        )
        
        preview_url = f"/static/artworks/{os.path.basename(file_results['preview_path'])}"
        transparent_url = f"/static/artworks/{os.path.basename(file_results['master_path'])}"
        
        artwork_title = title.strip() if title and title.strip() else f"Extracted Graphic ({target_state or 'POD'})"
        
        artwork_data = {
            "id": artwork_id,
            "title": artwork_title,
            "state_code": target_state or "US",
            "state_name": target_state or "United States",
            "theme": "Extracted Graphic",
            "design_style": "Isolated 2D POD",
            "slogan": hint or "Print-On-Demand Master",
            "product_color": "Black",
            "prompt": f"AI Extracted POD Artwork from mockup: {file.filename}",
            "negative_prompt": "mockup, model, wrinkles, seams, shadows",
            "provider": extraction_engine or "shopapi",
            "model_name": "ShopAPI-Extraction-Specialist",
            "original_image_path": file_results["raw_path"],
            "transparent_image_path": file_results["master_path"],
            "preview_url": preview_url,
            "width": file_results["width"],
            "height": file_results["height"],
            "dpi": file_results["dpi"],
            "metadata": {
                "source": "extracted_from_mockup",
                "original_mockup": f"/static/mockups/{os.path.basename(temp_mockup_path)}",
                "transparent_url": transparent_url,
                "garment_hex": "#141416"
            }
        }
        save_artwork(artwork_data)
        
        return {
            "success": True,
            "artwork": artwork_data,
            "message": "Trích xuất thành công thiết kế 4K trong suốt từ áo mockup!"
        }
    except Exception as e:
        print(f"Error in extract_artwork_from_mockup: {e}")
        raise HTTPException(status_code=500, detail=str(e))
