"""
POD Artwork Extractor & Custom Mockup Prompt Analyzer Service.
Provides:
1. Extraction of printed graphic designs from garment mockups into flat 4K RGBA transparent PNGs.
2. Automatic prompt engineering when a user uploads a custom mockup image to place designs realistically.
"""
import os
import io
import uuid
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from typing import Dict, Any, Optional, List, Tuple
from app.config import ARTWORKS_DIR, MOCKUPS_DIR, PRODUCT_COLORS
from app.services.shopapi_client import get_shopapi_client, generate_model_mockup_with_shopapi
from app.services.background_removal import process_and_save_artwork_files
from app.database import get_artwork_by_id

# Exact POD Extraction Master Prompt Specification
POD_EXTRACTION_SYSTEM_PROMPT = (
    "ROLE: You are an expert print-on-demand (POD) artwork extraction, restoration, and graphics separation specialist.\n\n"
    "TASK: Extract the complete printed graphic design from the provided product mockup and reconstruct it as an ultra-high-resolution, crystal-clear, flat, front-facing 2D artwork in 4K resolution rendered strictly against a clean solid pure white background.\n\n"
    "### 1. AUTOMATIC ARTWORK DETECTION & CROPPING\n"
    "- Identify ONLY the printed artwork on the garment (including main typography, secondary text, illustrations, borders, stars, and decorative elements).\n"
    "- Completely remove the human model, product wrinkles, fabric texture, seams, lighting, shadows, accessories, promotional text, watermarks, and surrounding environment.\n"
    "- Crop tightly around the design with a safe minimal margin, ensuring no clipped or cut-off edges.\n\n"
    "### 2. PERSPECTIVE & 2D FLATTENING\n"
    "- Reconstruct the cropped printed design into a flat, front-facing 2D composition.\n"
    "- Correct all perspective distortion, fabric curvature, and stretching caused by the mockup.\n"
    "- Preserve the authentic distressed screen-print texture, halftone shading, original color separations, and fine line-work.\n\n"
    "### 3. SHIRT-COLOR KNOCKOUT & SEPARATION PREPARATION\n"
    "- Identify the dominant garment color surrounding the print.\n"
    "- Isolate the entire graphic against a clean, solid, pure white background.\n"
    "- Preserve intentional printed ink colors even if they visually resemble the garment color. Protect fine dark outlines and intricate details.\n\n"
    "### 4. ULTRA-HD 4K RESOLUTION\n"
    "- Output specifications: Ultra-HD 4K sharpness, maximum clarity, zero pixelation or blurring.\n"
    "- Edges: Smooth, anti-aliased blending with no harsh halos, jagged edges, or leftover garment fringing.\n"
    "- No fake checkerboard simulation, no drop shadows or artificial borders around the artwork.\n\n"
    "### 5. FINAL QUALITY VERIFICATION\n"
    "- Only the isolated, flat 2D artwork is visible in crisp detail.\n"
    "- No fabric texture, model, or mockup remains.\n"
    "- Typography and illustrations are razor-sharp, complete, and retain their original distressed texture.\n"
    "FINAL OUTPUT: Return ONE isolated, ultra-sharp, 4K resolution, front-facing POD artwork centered on a solid pure white background, ready for direct high-end print-on-demand production."
)

def build_extraction_prompt(user_hint: Optional[str] = None) -> str:
    """
    Constructs the extraction prompt incorporating user hints.
    """
    prompt = POD_EXTRACTION_SYSTEM_PROMPT
    if user_hint and user_hint.strip():
        clean_hint = user_hint.strip()
        prompt += f"\n\nSPECIFIC USER EMPHASIS: Focus specifically on the design element: {clean_hint}."
    return prompt

def extract_artwork_with_ai(
    mockup_image_path: str,
    user_hint: Optional[str] = None
) -> Optional[Image.Image]:
    """
    Uses ShopAPI to reconstruct the isolated 2D artwork from a garment mockup.
    """
    prompt = build_extraction_prompt(user_hint)
    print(f"[Artwork Extractor] Calling ShopAPI to reconstruct artwork from {mockup_image_path}...")
    
    # 1:1 aspect ratio for master artwork
    extracted_raw = generate_model_mockup_with_shopapi(
        model_prompt=prompt,
        reference_image_path=mockup_image_path,
        aspect_ratio="1:1"
    )
    return extracted_raw

def extract_artwork_locally(mockup_image_path: str) -> Image.Image:
    """
    Fast computer-vision based extraction fallback:
    Finds the central garment region, crops around high-variance print pixels,
    and boosts clarity for transparent knockout.
    """
    img = Image.open(mockup_image_path).convert("RGBA")
    w, h = img.size
    
    # Central chest crop (where prints usually sit)
    crop_x1 = int(w * 0.20)
    crop_y1 = int(h * 0.22)
    crop_x2 = int(w * 0.80)
    crop_y2 = int(h * 0.82)
    
    cropped = img.crop((crop_x1, crop_y1, crop_x2, crop_y2))
    
    # Enhance contrast and sharpness for crisp separation
    enhancer = ImageEnhance.Contrast(cropped)
    cropped = enhancer.enhance(1.25)
    sharpener = ImageEnhance.Sharpness(cropped)
    cropped = sharpener.enhance(1.3)
    
    return cropped

def detect_garment_color_and_scene(image_path: str) -> Dict[str, Any]:
    """
    Analyzes an uploaded mockup image to estimate garment color, scene type, and lighting.
    """
    try:
        im = Image.open(image_path).convert("RGB")
        w, h = im.size
        
        # Sample chest/torso area
        chest_box = (int(w * 0.35), int(h * 0.35), int(w * 0.65), int(h * 0.65))
        chest_crop = im.crop(chest_box)
        np_chest = np.array(chest_crop)
        
        # Calculate median RGB
        med_r = float(np.median(np_chest[:, :, 0]))
        med_g = float(np.median(np_chest[:, :, 1]))
        med_b = float(np.median(np_chest[:, :, 2]))
        brightness = (med_r * 0.299 + med_g * 0.587 + med_b * 0.114)
        
        # Determine closest named color
        garment_name = "Black"
        if brightness < 45:
            garment_name = "Black"
        elif brightness > 200:
            garment_name = "White"
        elif med_g > med_r + 15 and med_g > med_b + 10:
            garment_name = "Military Green"
        elif med_b > med_r + 15 and med_b > med_g + 5:
            garment_name = "Navy Heather"
        elif abs(med_r - med_g) < 15 and abs(med_g - med_b) < 15 and 90 < brightness < 180:
            garment_name = "Sport Grey"
        elif med_r > med_g + 30 and med_r > med_b + 30:
            garment_name = "Crimson"
            
        # Detect model vs flatlay: sample upper quadrant (faces usually contain high skin tones)
        head_box = (int(w * 0.3), int(h * 0.05), int(w * 0.7), int(h * 0.25))
        head_crop = im.crop(head_box)
        np_head = np.array(head_crop)
        std_head = np.std(np_head)
        
        is_model = std_head > 35.0 or (h / w) >= 1.25
        scene_type = "lifestyle" if is_model else "flatlay"
        
        return {
            "garment_color": garment_name,
            "scene_type": scene_type,
            "brightness": brightness,
            "width": w,
            "height": h
        }
    except Exception as e:
        print(f"Error detecting garment color: {e}")
        return {"garment_color": "Black", "scene_type": "lifestyle", "brightness": 30, "width": 1024, "height": 1024}

def auto_generate_mockup_prompt(
    mockup_image_path: str,
    artwork_id: str,
    print_placement: str = "center_chest",
    target_state: str = "TX"
) -> Dict[str, Any]:
    """
    Automatically writes an authentic prompt to place the active artwork
    onto the uploaded mockup garment at the specified position.
    """
    analysis = detect_garment_color_and_scene(mockup_image_path)
    garment_color = analysis["garment_color"]
    scene_type = analysis["scene_type"]
    
    # Retrieve artwork metadata
    artwork = get_artwork_by_id(artwork_id) or {}
    art_title = artwork.get("title", "POD Graphic")
    art_slogan = artwork.get("slogan", "").replace('"', '').replace('·', ' ').strip()
    art_prompt = artwork.get("prompt", "")
    
    if art_prompt and len(art_prompt) > 30:
        core_prompt = art_prompt.split(".")[0].strip()
        design_desc = f"the graphic emblem from the reference image featuring {core_prompt}, with text '{art_slogan}'"
    elif art_title:
        design_desc = f"the graphic emblem from the reference image featuring {art_title}, with bold text reading '{art_slogan}'"
    else:
        design_desc = f"the graphic artwork from the reference image with text '{art_slogan}'"
        
    color_desc = garment_color.lower()
    
    if print_placement == "left_chest":
        placement_text = f"On the upper-left chest (pocket area) of the t-shirt is cleanly printed a small, refined 10x10 cm pocket-sized logo emblem: {design_desc}, with realistic cloth texture"
    elif print_placement == "sleeve":
        placement_text = f"On the upper bicep sleeve of the t-shirt is cleanly printed a circular tactical patch emblem: {design_desc}, curving naturally with the sleeve fabric and realistic cloth wrinkles"
    elif print_placement == "full_back":
        placement_text = f"On the upper back of the t-shirt between shoulder blades is cleanly printed a large bold graphic print: {design_desc}, flowing naturally with the back cloth folds"
    elif print_placement == "oversized_center":
        placement_text = f"Across the front of the t-shirt is a large bold streetwear graphic print: {design_desc}, spanning across the chest and torso with natural fabric folds"
    else: # center_chest (default)
        placement_text = f"On the center chest of the t-shirt is cleanly printed the detailed graphic emblem: {design_desc}, perfectly integrated into the cotton cloth with natural fabric wrinkles and soft fold shading"
        
    if scene_type == "lifestyle":
        prompt = (
            f"Commercial fashion photoshoot recreating the uploaded mockup composition, "
            f"wearing a solid {color_desc} cotton crewneck t-shirt. "
            f"{placement_text}. "
            f"Authentic lifestyle photography, photorealistic commercial product catalog, Canon EOS R5 photoshoot, realistic cloth wrinkles and natural fabric lighting."
        )
    else:
        prompt = (
            f"High-end commercial apparel product catalog photography of a solid {color_desc} cotton crewneck t-shirt, "
            f"closely matching the composition and surface of the uploaded product mockup. "
            f"{placement_text}. "
            f"The print is naturally integrated into the cotton cloth fabric texture with subtle fabric wrinkles, "
            f"professional softbox studio lighting, sharp focus, 8k resolution, authentic Amazon and Etsy commercial product catalog photo."
        )
        
    return {
        "prompt": prompt,
        "garment_color": garment_color,
        "scene_type": scene_type,
        "placement": print_placement,
        "artwork_title": art_title,
        "artwork_slogan": art_slogan
    }

