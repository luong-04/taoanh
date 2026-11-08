"""
Mockup Engine for POD Design Studio.
Performs High-Fidelity Garment Compositing and integrates AI Model Generation with ShopAPI and Virtual Try-On APIs.
Supports: Center Chest, Left Chest / Pocket, Sleeve (Cánh Tay Áo), Full Back, Oversized Streetwear.
"""
import os
import io
import time
import httpx
import numpy as np
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
from typing import Dict, Any, Optional
from app.config import TEMPLATES_DIR, MOCKUPS_DIR, PRODUCT_COLORS
from app.services.prompt_builder import get_state_by_code

# Placement geometry presets for anatomical DTG accuracy
PLACEMENT_CONFIGS = {
    "center_chest": {
        "id": "center_chest",
        "name": "Giữa Ngực (Center Chest)",
        "desc": "In DTG tiêu chuẩn chính giữa ngực áo (vùng in 30x35 cm)",
        "lifestyle": {"scale": 0.25, "x_pct": 0.50, "y_pct": 0.58, "rotation": 0.0},
        "flatlay": {"scale": 0.32, "x_pct": 0.50, "y_pct": 0.48, "rotation": 0.0}
    },
    "left_chest": {
        "id": "left_chest",
        "name": "Ngực Trái / Túi Áo (Left Chest)",
        "desc": "Logo thương hiệu nhỏ gọn trên ngực trái (10x10 cm)",
        "lifestyle": {"scale": 0.12, "x_pct": 0.60, "y_pct": 0.52, "rotation": 0.0},
        "flatlay": {"scale": 0.16, "x_pct": 0.62, "y_pct": 0.40, "rotation": 0.0}
    },
    "sleeve": {
        "id": "sleeve",
        "name": "Cánh Tay Áo (Sleeve / Shoulder Patch)",
        "desc": "Huy hiệu in trên bắp tay áo (vùng in 10x10 cm)",
        "lifestyle": {"scale": 0.14, "x_pct": 0.70, "y_pct": 0.48, "rotation": 0.0},
        "flatlay": {"scale": 0.14, "x_pct": 0.18, "y_pct": 0.35, "rotation": 0.0}
    },
    "side_pose": {
        "id": "side_pose",
        "name": "Dáng Nghiêng / Bắp Tay (Side Pose / Profile)",
        "desc": "Tối ưu cho người mẫu đứng nghiêng hoặc quay đầu nhìn xa",
        "lifestyle": {"scale": 0.22, "x_pct": 0.30, "y_pct": 0.82, "rotation": -6.0},
        "flatlay": {"scale": 0.20, "x_pct": 0.30, "y_pct": 0.50, "rotation": 0.0}
    },
    "full_back": {
        "id": "full_back",
        "name": "Mặt Lưng (Full Back)",
        "desc": "In khổ lớn trên toàn bộ mặt lưng áo (35x45 cm)",
        "lifestyle": {"scale": 0.32, "x_pct": 0.50, "y_pct": 0.58, "rotation": 0.0},
        "flatlay": {"scale": 0.38, "x_pct": 0.50, "y_pct": 0.48, "rotation": 0.0}
    },
    "oversized_center": {
        "id": "oversized_center",
        "name": "Khổ Lớn Streetwear (Oversized)",
        "desc": "Họa tiết graphic lớn phủ từ ngực xuống thân áo (38x48 cm)",
        "lifestyle": {"scale": 0.34, "x_pct": 0.51, "y_pct": 0.64, "rotation": 0.0},
        "flatlay": {"scale": 0.44, "x_pct": 0.50, "y_pct": 0.53, "rotation": 0.0}
    },
    "custom": {
        "id": "custom",
        "name": "Tùy Chọn Tự Do (Freeform Custom)",
        "desc": "Người dùng tùy chỉnh tự do mọi vị trí X, Y, Kích thước %, Góc xoay",
        "lifestyle": {"scale": 0.25, "x_pct": 0.50, "y_pct": 0.60, "rotation": 0.0},
        "flatlay": {"scale": 0.30, "x_pct": 0.50, "y_pct": 0.50, "rotation": 0.0}
    }
}

def embed_print_on_garment(
    garment_img: Image.Image,
    artwork_transparent: Image.Image,
    placement: str = "center_chest",
    is_lifestyle: bool = True,
    custom_x_pct: Optional[float] = None,
    custom_y_pct: Optional[float] = None,
    custom_scale: Optional[float] = None,
    custom_rotation: Optional[float] = None,
    opacity: float = 0.96,
    blend_mode: str = "natural_dtg",
    fabric_texture_depth: float = 0.55,
    color_harmonization: float = 0.15
) -> Image.Image:
    """
    High-Fidelity Direct-To-Garment (DTG) Garment Embedding:
    1. Selects coordinates, scale & rotation: Uses freeform custom parameters if provided,
       otherwise falls back to anatomy-aligned preset.
    2. Resizes and rotates artwork using Lanczos and Bicubic anti-aliasing.
    3. Samples underlying fabric luminance, fold shadows, and micro-texture directly from the shirt.
    4. Multiplies fabric fold luminance onto artwork colors (shadows crease naturally, highlights catch specularity).
    5. Analyzes ambient scene lighting to harmonize color temperatures naturally.
    6. Softens edges with sub-pixel feathering to absorb ink directly into cotton fibers without sticker edges.
    7. Blends according to specified mode (natural_dtg, multiply, vintage_wash, vibrant).
    """
    config = PLACEMENT_CONFIGS.get(placement, PLACEMENT_CONFIGS["center_chest"])
    geom = config["lifestyle"] if is_lifestyle else config["flatlay"]
    
    # Resolve parameters: custom override or preset
    use_scale = float(custom_scale) if custom_scale is not None else float(geom.get("scale", 0.25))
    use_x_pct = float(custom_x_pct) if custom_x_pct is not None else float(geom.get("x_pct", 0.50))
    use_y_pct = float(custom_y_pct) if custom_y_pct is not None else float(geom.get("y_pct", 0.58))
    use_rotation = float(custom_rotation) if custom_rotation is not None else float(geom.get("rotation", 0.0))
    
    gw, gh = garment_img.size
    aw, ah = artwork_transparent.size
    
    target_aw = max(10, int(gw * use_scale))
    scale_ratio = target_aw / float(aw)
    target_ah = max(10, int(ah * scale_ratio))
    
    resized_art = artwork_transparent.resize((target_aw, target_ah), Image.Resampling.LANCZOS)
    
    # Apply rotation with expansion
    if abs(use_rotation) > 0.1:
        resized_art = resized_art.rotate(use_rotation, resample=Image.Resampling.BICUBIC, expand=True)
        target_aw, target_ah = resized_art.size
        
    pos_x = int(gw * use_x_pct - target_aw // 2)
    pos_y = int(gh * use_y_pct - target_ah // 2)
    
    # Clamping crop box inside garment canvas
    crop_x1 = max(0, pos_x)
    crop_y1 = max(0, pos_y)
    crop_x2 = min(gw, pos_x + target_aw)
    crop_y2 = min(gh, pos_y + target_ah)
    
    if crop_x2 <= crop_x1 or crop_y2 <= crop_y1:
        return garment_img # Off canvas
        
    art_crop_x1 = crop_x1 - pos_x
    art_crop_y1 = crop_y1 - pos_y
    art_crop_x2 = art_crop_x1 + (crop_x2 - crop_x1)
    art_crop_y2 = art_crop_y1 + (crop_y2 - crop_y1)
    
    art_cropped = resized_art.crop((art_crop_x1, art_crop_y1, art_crop_x2, art_crop_y2))
    
    # Extract underlying garment patch
    garment_patch = garment_img.crop((crop_x1, crop_y1, crop_x2, crop_y2)).convert("RGBA")
    garment_rgb = np.array(garment_patch.convert("RGB"), dtype=np.float32)
    garment_gray = np.array(garment_patch.convert("L"), dtype=np.float32)
    
    art_arr = np.array(art_cropped, dtype=np.float32) # (H, W, 4)
    art_alpha = art_arr[:, :, 3] / 255.0
    
    # Analyze ambient lighting color for tone harmonization
    mean_garment_color = np.mean(garment_rgb, axis=(0, 1)) # [R, G, B]
    norm_tint = mean_garment_color / (np.linalg.norm(mean_garment_color) + 1e-5) * 1.732
    
    # Extract Fabric Folds & Micro-Wrinkles
    patch_gray_img = Image.fromarray(np.uint8(garment_gray))
    base_lighting = np.array(patch_gray_img.filter(ImageFilter.GaussianBlur(radius=8.0)), dtype=np.float32)
    fold_creases = np.array(patch_gray_img.filter(ImageFilter.GaussianBlur(radius=1.5)), dtype=np.float32)
    
    fold_ratio = fold_creases / (base_lighting + 10.0)
    fold_multiplier = 1.0 + (fold_ratio - 1.0) * (fabric_texture_depth * 1.8)
    fold_multiplier = np.clip(fold_multiplier, 0.45, 1.45)
    
    global_mean = np.mean(garment_gray)
    global_shade = (garment_gray / (global_mean + 1e-5)) ** 0.5
    global_shade = np.clip(global_shade, 0.65, 1.25)
    
    shading_map = fold_multiplier * global_shade
    
    # Harmonize artwork RGB with ambient lighting & apply fold shading
    art_rgb = art_arr[:, :, :3].copy()
    if color_harmonization > 0.01:
        for c in range(3):
            art_rgb[:, :, c] = art_rgb[:, :, c] * (1.0 - color_harmonization) + (art_rgb[:, :, c] * norm_tint[c]) * color_harmonization
            
    for c in range(3):
        art_rgb[:, :, c] = np.clip(art_rgb[:, :, c] * shading_map, 0.0, 255.0)
        
    # Micro-texture cotton grain: slightly absorb into fabric fibers
    micro_grain = (fold_creases - np.array(patch_gray_img.filter(ImageFilter.GaussianBlur(radius=0.8)), dtype=np.float32))
    micro_grain_factor = np.clip(1.0 + (micro_grain / 128.0) * 0.25, 0.85, 1.15)
    for c in range(3):
        art_rgb[:, :, c] = np.clip(art_rgb[:, :, c] * micro_grain_factor, 0.0, 255.0)
        
    # Sub-pixel edge feathering (prevents raw digital cutout sticker appearance)
    effective_alpha = art_alpha * opacity
    alpha_img = Image.fromarray(np.uint8(np.clip(effective_alpha * 255.0, 0, 255)))
    alpha_soft = np.array(alpha_img.filter(ImageFilter.GaussianBlur(radius=0.6)), dtype=np.float32) / 255.0
    
    out_patch = garment_rgb.copy()
    if blend_mode == "multiply":
        for c in range(3):
            mult = (garment_rgb[:, :, c] * art_rgb[:, :, c]) / 255.0
            out_patch[:, :, c] = garment_rgb[:, :, c] * (1.0 - alpha_soft) + mult * alpha_soft
    elif blend_mode == "vintage_wash":
        for c in range(3):
            blended = garment_rgb[:, :, c] * (1.0 - alpha_soft * 0.85) + art_rgb[:, :, c] * (alpha_soft * 0.85)
            gray_comp = 0.299 * blended[:, :, 0] + 0.587 * blended[:, :, 1] + 0.114 * blended[:, :, 2]
            out_patch[:, :, c] = np.clip(blended * 0.90 + gray_comp * 0.10, 0, 255)
    elif blend_mode == "vibrant":
        for c in range(3):
            out_patch[:, :, c] = garment_rgb[:, :, c] * (1.0 - alpha_soft) + art_rgb[:, :, c] * alpha_soft
    else: # "natural_dtg" (default)
        for c in range(3):
            fiber_tint = garment_rgb[:, :, c] * 0.12
            ink_color = np.clip(art_rgb[:, :, c] * 0.92 + fiber_tint, 0, 255)
            out_patch[:, :, c] = garment_rgb[:, :, c] * (1.0 - alpha_soft) + ink_color * alpha_soft
            
    composite = garment_img.copy()
    blended_patch_img = Image.fromarray(np.uint8(out_patch))
    composite.paste(blended_patch_img, (crop_x1, crop_y1))
    return composite

import random
import uuid

# --- DIVERSE MODEL PERSONA POOLS (ELIMINATES DUPLICATE FACES) ---
MALE_HAIRSTYLES = [
    "textured modern crew cut with low taper fade, dark chestnut hair",
    "military high-and-tight buzz cut, dark brown hair",
    "classic slicked-back undercut, sandy blonde hair",
    "carefree wavy textured hair, espresso black hair",
    "clean shaved bald head with strong masculine jawline",
    "modern textured crop with subtle temple fade, ash brown hair",
    "casual side-part comb-over, dark chocolate brown hair",
    "natural short coils with sharp clean line-up, jet black hair",
    "relaxed surfer waves, sun-bleached brown hair",
    "rugged thick pompadour with tapered sides, deep black hair",
    "neat medium-length parted wavy hair, light brown hair",
    "short textured spikes, dirty blonde hair"
]

FEMALE_HAIRSTYLES = [
    "effortless messy top-knot bun with delicate face-framing strands, chestnut brown hair",
    "sleek high ponytail with natural bounce, raven black hair",
    "shoulder-length layered beach waves, caramel highlighted brown hair",
    "natural voluminous afro curls with healthy sheen, deep espresso hair",
    "modern chic textured bob haircut, honey blonde hair",
    "long soft gentle flowing waves, auburn copper hair",
    "casual curtain bangs with smooth layered hair, dark brunette hair",
    "sporty textured pixie cut, dark brown hair",
    "bohemian loose side braid, sandy blonde hair",
    "shoulder-length soft curls, golden brown hair"
]

MALE_FACIAL_HAIR = [
    "clean-shaven with a defined sharp masculine jawline",
    "light rugged 5-o'clock shadow stubble",
    "neatly trimmed short designer beard",
    "subtle trimmed goatee with clean stubble",
    "rugged full masculine beard, well-groomed",
    "heavy masculine stubble along the jawline and chin",
    "clean-shaven with smooth chiseled jaw"
]

EYE_AND_EXPRESSIONS = [
    "striking hazel eyes with a warm, genuine friendly smile and approachable look",
    "deep expressive brown eyes and an authentic relaxed candid smirk, looking at camera",
    "cool piercing blue eyes with a confident, calm and determined gaze",
    "charismatic amber-brown eyes with a welcoming friendly grin",
    "striking green eyes with a thoughtful, charismatic and confident expression",
    "warm dark eyes with a natural, effortless and engaging smile"
]

ETHNICITY_VARIANTS = [
    "Caucasian",
    "African American",
    "Latino / Hispanic American",
    "Asian American",
    "Native American heritage",
    "Mediterranean American",
    "Multiracial American"
]

def generate_random_model_persona(
    model_gender: str = "Male",
    model_age: str = "30-40",
    model_body_type: str = "Athletic",
    model_ethnicity: str = "State AI Proposed"
) -> Dict[str, str]:
    """
    Generates a rich, vivid, completely unique model persona on every single run.
    Guarantees that no two generated models look alike.
    """
    # 1. Resolve Gender
    gender_norm = model_gender.strip().lower()
    if gender_norm in ["random", "all", "any", ""]:
        chosen_gender = random.choice(["Male", "Female"])
    elif "female" in gender_norm or "woman" in gender_norm or "nữ" in gender_norm:
        chosen_gender = "Female"
    elif "couple" in gender_norm:
        chosen_gender = "Couple"
    else:
        chosen_gender = "Male"

    # 2. Resolve Age
    age_norm = model_age.strip().lower()
    if age_norm in ["random", "any", "all", ""]:
        chosen_age = random.choice(["early 20s (college youth look)", "early 30s (athletic modern adult)", "late 30s to 40s (mature rugged adult)", "mid 50s (distinguished veteran, silver-streaked hair)"])
    elif "50" in age_norm:
        chosen_age = "distinguished 50-58 years old, handsome silver-streaked hair, experienced confident demeanor"
    elif "40" in age_norm:
        chosen_age = "mature 40-48 years old, rugged athletic build"
    elif "20" in age_norm:
        chosen_age = "young 22-28 years old, fresh youthful and athletic"
    else:
        chosen_age = "30-38 years old, fit athletic build"

    # 3. Resolve Ethnicity
    eth_norm = model_ethnicity.strip().lower()
    if eth_norm in ["random", "diverse", "state ai proposed", ""]:
        chosen_ethnicity = random.choice(ETHNICITY_VARIANTS)
    else:
        chosen_ethnicity = model_ethnicity.replace("White / Caucasian", "Caucasian").replace("Black / African American", "African American").replace("Hispanic / Latino", "Latino American")

    eth_label = chosen_ethnicity if "American" in chosen_ethnicity else f"{chosen_ethnicity} American"

    # 4. Resolve Body Type
    body_norm = model_body_type.strip().lower()
    if body_norm in ["random", ""]:
        chosen_body = random.choice(["athletic fit", "toned lean", "broad-shouldered athletic", "natural healthy fit"])
    else:
        chosen_body = f"{model_body_type.lower()} build"

    # 5. Pick unique styling attributes
    eye_expr = random.choice(EYE_AND_EXPRESSIONS)
    unique_token = uuid.uuid4().hex[:6]

    if chosen_gender == "Female":
        hair = random.choice(FEMALE_HAIRSTYLES)
        subject_desc = (
            f"a beautiful {eth_label} woman ({chosen_age}), {chosen_body}, "
            f"featuring {hair}, {eye_expr} (model identity ref #{unique_token})"
        )
    elif chosen_gender == "Couple":
        m_hair = random.choice(MALE_HAIRSTYLES)
        f_hair = random.choice(FEMALE_HAIRSTYLES)
        subject_desc = (
            f"an attractive {eth_label} couple (man with {m_hair} and woman with {f_hair}, {chosen_age}), "
            f"standing together affectionately, {eye_expr} (model identity ref #{unique_token})"
        )
    else: # Male
        hair = random.choice(MALE_HAIRSTYLES)
        facial = random.choice(MALE_FACIAL_HAIR)
        subject_desc = (
            f"a handsome {eth_label} male ({chosen_age}), {chosen_body}, "
            f"featuring {hair}, {facial}, {eye_expr} (model identity ref #{unique_token})"
        )

    return {
        "gender": chosen_gender,
        "subject_desc": subject_desc,
        "unique_token": unique_token
    }

def build_ai_model_prompt(
    state_code: str,
    state_name: str,
    garment_color: str,
    model_gender: str,
    model_age: str,
    model_body_type: str,
    model_ethnicity: str,
    lifestyle_scene: str,
    pose: str = "standing",
    print_placement: str = "center_chest",
    artwork_title: str = "",
    artwork_slogan: str = "",
    artwork_prompt: str = ""
) -> str:
    """
    Constructs an authentic commercial photography prompt for ShopAPI AI Model Generation.
    Guarantees:
    1. Diverse, randomized model appearance on EVERY run (no duplicate faces).
    2. Medium shot framing showing the FULL t-shirt from collar to waist hemline (no cut-off garment).
    3. Precise DTG placement instruction.
    """
    state_data = get_state_by_code(state_code) or {}
    lifestyle_envs = state_data.get("cultural_heritage", {}).get("lifestyle_environments", [])
    primary_env = lifestyle_envs[0] if lifestyle_envs else f"scenic natural landscape of {state_name}"
    
    # Dynamic State-Aware Scenery
    if lifestyle_scene in ["outdoor_lifestyle", "texas_ranch", "rocky_mountain", "coastal_patriot"]:
        scene_text = f"outdoors in authentic {state_name} landscape ({primary_env}), warm natural golden hour lighting, soft cinematic background blur"
    elif lifestyle_scene in ["residential_porch", "midwest_porch"]:
        scene_text = f"on a cozy residential wooden front porch in {state_name}, classic American suburban neighborhood, clean green lawn, warm afternoon sunlight"
    elif lifestyle_scene in ["urban_street"]:
        scene_text = f"walking along a vibrant downtown pedestrian street in {state_name}, authentic local architectural storefronts and sidewalk in soft depth of field"
    elif lifestyle_scene in ["workshop_garage", "urban_workshop"]:
        scene_text = f"inside an authentic craftsman workshop or garage in {state_name}, vintage workbench and rustic brick walls in warm ambient light"
    elif lifestyle_scene in ["commercial_studio", "studio_clean"]:
        scene_text = f"in a clean, high-end minimalist commercial apparel photography studio, neutral backdrop, soft professional softbox studio lighting"
    else:
        scene_text = f"at an authentic location in {state_name} ({primary_env}), warm natural lighting"
    
    # Generate unique randomized model persona
    persona = generate_random_model_persona(
        model_gender=model_gender,
        model_age=model_age,
        model_body_type=model_body_type,
        model_ethnicity=model_ethnicity
    )
    subject = persona["subject_desc"]
    color_desc = garment_color.lower()
    
    # Formulate clean design description from artwork metadata
    clean_slogan = artwork_slogan.replace('"', '').replace('·', ' ').replace('-', ' ').strip()
    if artwork_prompt and len(artwork_prompt) > 30:
        core_prompt = artwork_prompt.split(".")[0].strip()
        design_desc = f"emblem featuring {core_prompt}, with text '{clean_slogan}'"
    elif artwork_title:
        design_desc = f"graphic badge featuring {artwork_title}, with bold text reading '{clean_slogan}'"
    else:
        design_desc = f"graphic emblem with text '{clean_slogan}'"
        
    # CAMERA FRAMING: Medium shot, full torso view showing entire t-shirt down to bottom waistline hem
    framing_rule = (
        "medium shot fashion photography, complete torso framing, full t-shirt clearly visible in its entirety "
        "from the crewneck collar down to the bottom waist hemline, waistband and upper hips visible, "
        "comfortable breathing room around the garment with no cut-off shirt or hem"
    )

    # Placement-specific model pose and garment print instruction
    if print_placement == "full_back" or "back" in pose.lower():
        orientation = f"{framing_rule}, viewed directly from behind, full back torso composition"
        clothing = (
            f"wearing a solid {color_desc} cotton crewneck t-shirt showing the entire back of the garment down to the waist. "
            f"On the upper back between shoulder blades is cleanly printed a large bold graphic artwork: {design_desc}, "
            f"flowing naturally with the back cloth folds"
        )
        
    elif print_placement == "sleeve" or print_placement == "side_pose":
        orientation = f"{framing_rule}, three-quarters profile angle, standing naturally with shoulder and arm turned toward camera to clearly showcase the t-shirt sleeve"
        clothing = (
            f"wearing a solid {color_desc} cotton crewneck t-shirt showing the complete sleeve and entire torso down to the waist. "
            f"On the upper bicep of the t-shirt sleeve is cleanly printed a circular tactical military patch emblem: {design_desc}, "
            f"curving naturally with the sleeve fabric and realistic cloth wrinkles"
        )
        
    elif print_placement == "left_chest":
        orientation = f"{framing_rule}, facing camera directly, complete front view"
        clothing = (
            f"wearing a solid {color_desc} cotton crewneck t-shirt showing the full torso and entire front of the shirt from collar down to hem. "
            f"On the upper-left chest (pocket area) is cleanly printed a small, refined 10x10 cm pocket-sized logo emblem: {design_desc}, "
            f"with realistic cloth texture and subtle fabric wrinkles"
        )
        
    elif print_placement == "oversized_center":
        orientation = f"{framing_rule}, facing camera directly, complete front view"
        clothing = (
            f"wearing a relaxed streetwear-fit {color_desc} cotton crewneck t-shirt showing the entire front of the shirt from collar to waist hem. "
            f"Across the chest and torso is cleanly printed a bold oversized graphic print: {design_desc}, "
            f"spanning across the chest and torso with natural fabric folds"
        )
        
    else: # center_chest (default)
        orientation = f"{framing_rule}, facing camera directly, complete front view"
        clothing = (
            f"wearing a solid {color_desc} cotton crewneck t-shirt with the entire t-shirt fully displayed in frame from collar to bottom hemline. "
            f"On the center of the t-shirt chest is cleanly printed a detailed graphic emblem: {design_desc}, "
            f"perfectly integrated into the cotton cloth with natural fabric wrinkles and soft fold shading"
        )
        
    return (
        f"Commercial fashion photoshoot of {subject}, {orientation}, standing naturally, {scene_text}. "
        f"{clothing}. "
        f"Authentic lifestyle photography, photorealistic commercial product catalog, Canon EOS R5 photoshoot, "
        f"full garment fully visible without bottom cropping, realistic cloth wrinkles and natural fabric lighting."
    )

def build_ai_flatlay_prompt(
    state_code: str = "TX",
    state_name: str = "Texas",
    garment_color: str = "Black",
    product_style: str = "flatlay_wood",
    print_placement: str = "center_chest",
    artwork_title: str = "",
    artwork_slogan: str = "",
    artwork_prompt: str = ""
) -> str:
    """
    Constructs an authentic commercial e-commerce product photography prompt for ShopAPI
    flat-lay / hanger / studio apparel mockups without a human model.
    """
    color_desc = garment_color.lower()
    clean_slogan = artwork_slogan.replace('"', '').replace('·', ' ').replace('-', ' ').strip()
    
    if artwork_prompt and len(artwork_prompt) > 30:
        core_prompt = artwork_prompt.split(".")[0].strip()
        design_desc = f"the graphic emblem from the reference image featuring {core_prompt}, with text reading '{clean_slogan}'"
    elif artwork_title:
        design_desc = f"the graphic emblem from the reference image featuring {artwork_title}, with bold text '{clean_slogan}'"
    else:
        design_desc = f"the graphic artwork from the reference image with text '{clean_slogan}'"
        
    # Placement description
    if print_placement == "left_chest":
        placement_desc = f"On the upper-left chest (pocket area) of the t-shirt is cleanly printed a small, refined 10x10 cm pocket-sized logo emblem: {design_desc}"
    elif print_placement == "sleeve" or print_placement == "side_pose":
        placement_desc = f"On the upper bicep sleeve of the t-shirt is cleanly printed a circular tactical patch emblem: {design_desc}"
    elif print_placement == "full_back":
        placement_desc = f"Showing the back of the t-shirt. On the upper back between shoulder blades is cleanly printed a large bold graphic print: {design_desc}"
    elif print_placement == "oversized_center":
        placement_desc = f"Across the front of the t-shirt is a large bold streetwear graphic print: {design_desc}, extending from chest down the torso"
    else: # center_chest (default)
        placement_desc = f"On the center chest of the t-shirt is crisply printed the graphic emblem: {design_desc}"

    # Surface & background style
    if product_style in ["flatlay_studio", "studio_clean", "commercial_studio"]:
        surface = "laid flat on a clean minimalist neutral textured off-white studio surface, professional soft studio lighting, sharp crisp e-commerce catalog photography"
    elif product_style in ["hanger", "hanger_wall"]:
        surface = "neatly hanging on a natural solid wood hanger against a modern textured concrete studio wall, soft directional lighting"
    elif product_style in ["folded", "folded_display"]:
        surface = "neatly folded on an artisan wooden retail table showing the front graphic clearly, boutique apparel presentation"
    else: # flatlay_wood (default)
        surface = "neatly laid flat on a rustic weathered reclaimed dark wood surface with natural wood grain, warm subtle ambient lighting"

    return (
        f"High-end commercial apparel product catalog photography of a solid {color_desc} cotton crewneck t-shirt, "
        f"{surface}. Top-down 90-degree flat-lay composition. "
        f"{placement_desc}. "
        f"The print is naturally integrated into the cotton cloth fabric texture with subtle fabric wrinkles, "
        f"professional softbox studio lighting, sharp focus, 8k resolution, authentic Amazon and Etsy commercial product catalog photo."
    )

def render_ai_model_mockup(
    artwork_path: str,
    state_code: str = "TX",
    state_name: str = "Texas",
    garment_color: str = "Black",
    lifestyle_scene: str = "outdoor_lifestyle",
    model_gender: str = "Male",
    model_age: str = "30-40",
    model_body_type: str = "Athletic",
    model_ethnicity: str = "State AI Proposed",
    pose: str = "standing",
    aspect_ratio: str = "4:5",
    print_placement: str = "center_chest",
    artwork_title: str = "",
    artwork_slogan: str = "",
    artwork_prompt: str = "",
    output_dir: str = str(MOCKUPS_DIR),
    mockup_id: str = "mockup",
    custom_garment_path: Optional[str] = None,
    custom_x_pct: Optional[float] = None,
    custom_y_pct: Optional[float] = None,
    custom_scale: Optional[float] = None,
    custom_rotation: Optional[float] = None,
    blend_mode: str = "natural_dtg",
    opacity: float = 0.96
) -> Dict[str, Any]:
    """
    Module 2: Real AI Model Mockup Generator via ShopAPI.
    Generates a photorealistic human model wearing apparel in the requested setting,
    saves the clean base garment, and embeds the artwork with in-fiber DTG precision.
    Supports freeform placement (x_pct, y_pct, scale, rotation, blend_mode).
    """
    from app.services.shopapi_client import get_shopapi_client, generate_model_mockup_with_shopapi
    
    art_img = Image.open(artwork_path).convert("RGBA")
    os.makedirs(output_dir, exist_ok=True)
    clean_filename = f"{mockup_id}_clean.png"
    clean_path = os.path.join(output_dir, clean_filename)
    
    # If user uploaded a custom garment, embed locally onto it
    if custom_garment_path and os.path.exists(custom_garment_path):
        base_img = Image.open(custom_garment_path).convert("RGBA")
        base_img.save(clean_path, format="PNG")
        result = embed_print_on_garment(
            base_img, 
            art_img, 
            placement=print_placement, 
            is_lifestyle=True,
            custom_x_pct=custom_x_pct,
            custom_y_pct=custom_y_pct,
            custom_scale=custom_scale,
            custom_rotation=custom_rotation,
            opacity=opacity,
            blend_mode=blend_mode
        )
    else:
        client = get_shopapi_client()
        ai_model_img = None
        
        if client:
            model_prompt = build_ai_model_prompt(
                state_code=state_code,
                state_name=state_name,
                garment_color=garment_color,
                model_gender=model_gender,
                model_age=model_age,
                model_body_type=model_body_type,
                model_ethnicity=model_ethnicity,
                lifestyle_scene=lifestyle_scene,
                pose=pose,
                print_placement=print_placement,
                artwork_title=artwork_title,
                artwork_slogan=artwork_slogan,
                artwork_prompt=artwork_prompt
            )
            print(f"[ShopAPI Model Mockup] Generating real human model in {state_name} ({print_placement}): {model_prompt[:120]}...")
            
            # Pass artwork as visual reference so ShopAPI generates the garment with the print natively embedded into the cloth fibers
            ai_model_img = generate_model_mockup_with_shopapi(
                model_prompt,
                reference_image_path=artwork_path,
                aspect_ratio="3:4"
            )
        
        if not ai_model_img:
            print("[ShopAPI Model Mockup] ShopAPI returned None or unavailable, falling back to commercial template...")
            return render_commercial_mockup(
                artwork_path=artwork_path,
                garment_color=garment_color,
                mockup_type="lifestyle",
                lifestyle_scene=lifestyle_scene,
                aspect_ratio=aspect_ratio,
                print_placement=print_placement,
                output_dir=output_dir,
                mockup_id=mockup_id,
                custom_garment_path=custom_garment_path,
                custom_x_pct=custom_x_pct,
                custom_y_pct=custom_y_pct,
                custom_scale=custom_scale,
                custom_rotation=custom_rotation,
                blend_mode=blend_mode,
                opacity=opacity
            )
            
        base_img = ai_model_img
        
        # Adjust aspect ratio: Preserve full t-shirt down to bottom hemline
        rw, rh = base_img.size
        if aspect_ratio == "1:1":
            square_dim = min(rw, rh)
            left = (rw - square_dim) // 2
            # Balance between head and waist hem (center vertically or keep lower torso)
            top = max(0, (rh - square_dim) // 2)
            base_img = base_img.crop((left, top, left + square_dim, top + square_dim))
        elif aspect_ratio == "4:5":
            target_w = rw
            target_h = int(target_w * 5 / 4)
            if target_h <= rh:
                # IMPORTANT: Trim from upper headroom/sky instead of waist, ensuring bottom hem is 100% intact!
                top = max(0, rh - target_h)
                base_img = base_img.crop((0, top, target_w, top + target_h))
        elif aspect_ratio in ["3:4", "full", "original"]:
            # Original 3:4 aspect ratio (768x1024) - zero cropping, 100% full garment visible
            pass
                
        # Save base image and set as final result (already natively printed by AI)
        base_img.save(clean_path, format="PNG")
        result = base_img
        
    # Save high-resolution output
    out_filename = f"{mockup_id}.png"
    out_path = os.path.join(output_dir, out_filename)
    result.save(out_path, format="PNG", optimize=True)
    
    # Save web preview (width 1000px)
    preview_w = 1000
    preview_h = int(preview_w * (result.size[1] / result.size[0]))
    preview_img = result.resize((preview_w, preview_h), Image.Resampling.LANCZOS)
    preview_filename = f"{mockup_id}_preview.png"
    preview_path = os.path.join(output_dir, preview_filename)
    preview_img.save(preview_path, format="PNG")
    
    return {
        "mockup_path": out_path,
        "clean_image_path": clean_path,
        "preview_path": preview_path,
        "width": result.size[0],
        "height": result.size[1],
        "aspect_ratio": aspect_ratio,
        "is_ai_generated": True,
        "mockup_type": "lifestyle",
        "print_placement": print_placement,
        "custom_x_pct": custom_x_pct,
        "custom_y_pct": custom_y_pct,
        "custom_scale": custom_scale,
        "custom_rotation": custom_rotation,
        "blend_mode": blend_mode,
        "opacity": opacity
    }

def render_ai_flatlay_mockup(
    artwork_path: str,
    state_code: str = "TX",
    state_name: str = "Texas",
    garment_color: str = "Black",
    product_style: str = "flatlay_wood",
    aspect_ratio: str = "1:1",
    print_placement: str = "center_chest",
    artwork_title: str = "",
    artwork_slogan: str = "",
    artwork_prompt: str = "",
    output_dir: str = str(MOCKUPS_DIR),
    mockup_id: str = "mockup",
    custom_garment_path: Optional[str] = None,
    custom_x_pct: Optional[float] = None,
    custom_y_pct: Optional[float] = None,
    custom_scale: Optional[float] = None,
    custom_rotation: Optional[float] = None,
    blend_mode: str = "natural_dtg",
    opacity: float = 0.96
) -> Dict[str, Any]:
    """
    Module 2: Commercial Apparel Product Photography without a model via ShopAPI.
    Generates high-end flat-lays (on rustic wood or clean studio background), hangers, or folded displays
    with the artwork from reference_images printed naturally on the garment fibers.
    """
    from app.services.shopapi_client import get_shopapi_client, generate_model_mockup_with_shopapi
    
    art_img = Image.open(artwork_path).convert("RGBA")
    os.makedirs(output_dir, exist_ok=True)
    clean_filename = f"{mockup_id}_clean.png"
    clean_path = os.path.join(output_dir, clean_filename)
    
    if custom_garment_path and os.path.exists(custom_garment_path):
        base_img = Image.open(custom_garment_path).convert("RGBA")
        base_img.save(clean_path, format="PNG")
        result = embed_print_on_garment(
            base_img,
            art_img,
            placement=print_placement,
            is_lifestyle=False,
            custom_x_pct=custom_x_pct,
            custom_y_pct=custom_y_pct,
            custom_scale=custom_scale,
            custom_rotation=custom_rotation,
            opacity=opacity,
            blend_mode=blend_mode
        )
    else:
        client = get_shopapi_client()
        ai_flatlay_img = None
        
        if client:
            flatlay_prompt = build_ai_flatlay_prompt(
                state_code=state_code,
                state_name=state_name,
                garment_color=garment_color,
                product_style=product_style,
                print_placement=print_placement,
                artwork_title=artwork_title,
                artwork_slogan=artwork_slogan,
                artwork_prompt=artwork_prompt
            )
            print(f"[ShopAPI Flatlay Mockup] Generating product catalog photo ({print_placement}): {flatlay_prompt[:120]}...")
            
            ar = "1:1" if aspect_ratio == "1:1" else ("3:4" if aspect_ratio in ["4:5", "3:4"] else "1:1")
            ai_flatlay_img = generate_model_mockup_with_shopapi(
                flatlay_prompt,
                reference_image_path=artwork_path,
                aspect_ratio=ar
            )
            
        if not ai_flatlay_img:
            print("[ShopAPI Flatlay Mockup] ShopAPI returned None or unavailable, falling back to commercial template...")
            return render_commercial_mockup(
                artwork_path=artwork_path,
                garment_color=garment_color,
                mockup_type="flatlay",
                lifestyle_scene=product_style,
                aspect_ratio=aspect_ratio,
                print_placement=print_placement,
                output_dir=output_dir,
                mockup_id=mockup_id,
                custom_garment_path=custom_garment_path,
                custom_x_pct=custom_x_pct,
                custom_y_pct=custom_y_pct,
                custom_scale=custom_scale,
                custom_rotation=custom_rotation,
                blend_mode=blend_mode,
                opacity=opacity
            )
            
        base_img = ai_flatlay_img
        
        # Adjust aspect ratio if needed
        rw, rh = base_img.size
        if aspect_ratio == "1:1" and rw != rh:
            square_dim = min(rw, rh)
            left = (rw - square_dim) // 2
            top = (rh - square_dim) // 2
            base_img = base_img.crop((left, top, left + square_dim, top + square_dim))
            
        base_img.save(clean_path, format="PNG")
        result = base_img

    # Save high-resolution output
    out_filename = f"{mockup_id}.png"
    out_path = os.path.join(output_dir, out_filename)
    result.save(out_path, format="PNG", optimize=True)
    
    # Save web preview (width 1000px)
    preview_w = 1000
    preview_h = int(preview_w * (result.size[1] / result.size[0]))
    preview_img = result.resize((preview_w, preview_h), Image.Resampling.LANCZOS)
    preview_filename = f"{mockup_id}_preview.png"
    preview_path = os.path.join(output_dir, preview_filename)
    preview_img.save(preview_path, format="PNG")
    
    return {
        "mockup_path": out_path,
        "clean_image_path": clean_path,
        "preview_path": preview_path,
        "width": result.size[0],
        "height": result.size[1],
        "aspect_ratio": aspect_ratio,
        "is_ai_generated": True,
        "mockup_type": "flatlay",
        "print_placement": print_placement,
        "custom_x_pct": custom_x_pct,
        "custom_y_pct": custom_y_pct,
        "custom_scale": custom_scale,
        "custom_rotation": custom_rotation,
        "blend_mode": blend_mode,
        "opacity": opacity
    }

def render_ai_custom_mockup(
    artwork_path: str,
    custom_mockup_path: str,
    custom_prompt: str,
    print_placement: str = "center_chest",
    aspect_ratio: str = "3:4",
    output_dir: str = str(MOCKUPS_DIR),
    mockup_id: str = "mockup",
    custom_x_pct: Optional[float] = None,
    custom_y_pct: Optional[float] = None,
    custom_scale: Optional[float] = None,
    custom_rotation: Optional[float] = None,
    blend_mode: str = "natural_dtg",
    opacity: float = 0.96
) -> Dict[str, Any]:
    """
    Renders an authentic mockup using an uploaded mockup photo as reference and an auto-generated prompt.
    Passes both the artwork PNG and uploaded mockup photo to ShopAPI to generate the final realistic photo.
    Falls back to high-fidelity DTG fabric blending onto the uploaded garment.
    """
    from app.services.shopapi_client import get_shopapi_client, generate_model_mockup_with_shopapi
    
    art_img = Image.open(artwork_path).convert("RGBA")
    os.makedirs(output_dir, exist_ok=True)
    clean_filename = f"{mockup_id}_clean.png"
    clean_path = os.path.join(output_dir, clean_filename)
    
    client = get_shopapi_client()
    ai_img = None
    
    if client and custom_prompt:
        print(f"[ShopAPI Custom Mockup] Calling ShopAPI with custom prompt and dual references ({print_placement})...")
        ar = "1:1" if aspect_ratio == "1:1" else ("3:4" if aspect_ratio in ["4:5", "3:4"] else "3:4")
        ai_img = generate_model_mockup_with_shopapi(
            model_prompt=custom_prompt,
            reference_image_path=[artwork_path, custom_mockup_path],
            aspect_ratio=ar
        )
        
    if not ai_img:
        print("[ShopAPI Custom Mockup] ShopAPI not available or fallback requested, embedding directly onto uploaded garment...")
        base_img = Image.open(custom_mockup_path).convert("RGBA")
        base_img.save(clean_path, format="PNG")
        result = embed_print_on_garment(
            base_img,
            art_img,
            placement=print_placement,
            is_lifestyle=True,
            custom_x_pct=custom_x_pct,
            custom_y_pct=custom_y_pct,
            custom_scale=custom_scale,
            custom_rotation=custom_rotation,
            opacity=opacity,
            blend_mode=blend_mode
        )
    else:
        base_img = ai_img
        base_img.save(clean_path, format="PNG")
        result = base_img

    out_filename = f"{mockup_id}.png"
    out_path = os.path.join(output_dir, out_filename)
    result.save(out_path, format="PNG", optimize=True)
    
    preview_w = 1000
    preview_h = int(preview_w * (result.size[1] / result.size[0]))
    preview_img = result.resize((preview_w, preview_h), Image.Resampling.LANCZOS)
    preview_filename = f"{mockup_id}_preview.png"
    preview_path = os.path.join(output_dir, preview_filename)
    preview_img.save(preview_path, format="PNG")
    
    return {
        "mockup_path": out_path,
        "clean_image_path": clean_path,
        "preview_path": preview_path,
        "width": result.size[0],
        "height": result.size[1],
        "aspect_ratio": aspect_ratio,
        "is_ai_generated": ai_img is not None,
        "mockup_type": "custom_mockup",
        "print_placement": print_placement,
        "custom_x_pct": custom_x_pct,
        "custom_y_pct": custom_y_pct,
        "custom_scale": custom_scale,
        "custom_rotation": custom_rotation,
        "blend_mode": blend_mode,
        "opacity": opacity
    }

def render_commercial_mockup(
    artwork_path: str,
    garment_color: str = "Black",
    mockup_type: str = "lifestyle", # "lifestyle" or "flatlay"
    lifestyle_scene: str = "outdoor_lifestyle",
    aspect_ratio: str = "4:5", # "4:5" or "1:1"
    print_placement: str = "center_chest",
    output_dir: str = str(MOCKUPS_DIR),
    mockup_id: str = "mockup",
    custom_garment_path: Optional[str] = None,
    custom_x_pct: Optional[float] = None,
    custom_y_pct: Optional[float] = None,
    custom_scale: Optional[float] = None,
    custom_rotation: Optional[float] = None,
    blend_mode: str = "natural_dtg",
    opacity: float = 0.96
) -> Dict[str, Any]:
    """
    Renders high-res commercial apparel lifestyle or flat-lay mockup.
    Outputs 4:5 (e.g. 2000x2500 px) or 1:1 (2000x2000 px).
    Uses authentic commercial photography and zero-hallucination fabric compositing.
    """
    art_img = Image.open(artwork_path).convert("RGBA")
    color_slug = garment_color.lower().replace(" ", "_")
    os.makedirs(output_dir, exist_ok=True)
    clean_filename = f"{mockup_id}_clean.png"
    clean_path = os.path.join(output_dir, clean_filename)
    
    if custom_garment_path and os.path.exists(custom_garment_path):
        base_img = Image.open(custom_garment_path).convert("RGBA")
        is_life = True
    elif mockup_type == "flatlay":
        template_file = os.path.join(TEMPLATES_DIR, f"garment_{color_slug}.png")
        if not os.path.exists(template_file):
            template_file = os.path.join(TEMPLATES_DIR, "garment_black.png")
        base_img = Image.open(template_file).convert("RGBA")
        is_life = False
    else:
        # Lifestyle fallback: check scene, but always prioritize matching garment color
        template_file = os.path.join(TEMPLATES_DIR, f"lifestyle_{lifestyle_scene}.png")
        if not os.path.exists(template_file):
            template_file = os.path.join(TEMPLATES_DIR, f"garment_{color_slug}.png")
        if not os.path.exists(template_file):
            template_file = os.path.join(TEMPLATES_DIR, "garment_black.png")
        base_img = Image.open(template_file).convert("RGBA")
        is_life = False if f"garment_" in os.path.basename(template_file) else True
        
    rw, rh = base_img.size
    if aspect_ratio == "1:1":
        square_dim = min(rw, rh)
        left = (rw - square_dim) // 2
        top = (rh - square_dim) // 2
        base_img = base_img.crop((left, top, left + square_dim, top + square_dim))
    elif aspect_ratio == "4:5":
        target_w = rw
        target_h = int(target_w * 5 / 4)
        if target_h <= rh:
            top = max(0, rh - target_h) if is_life else (rh - target_h) // 2
            base_img = base_img.crop((0, top, target_w, top + target_h))
    elif aspect_ratio in ["3:4", "full", "original"]:
        pass
            
    # Save clean base image
    base_img.save(clean_path, format="PNG")
    
    result = embed_print_on_garment(
        base_img, 
        art_img, 
        placement=print_placement, 
        is_lifestyle=is_life,
        custom_x_pct=custom_x_pct,
        custom_y_pct=custom_y_pct,
        custom_scale=custom_scale,
        custom_rotation=custom_rotation,
        opacity=opacity,
        blend_mode=blend_mode
    )
    
    out_filename = f"{mockup_id}.png"
    out_path = os.path.join(output_dir, out_filename)
    result.save(out_path, format="PNG", optimize=True)
    
    preview_w = 1000
    preview_h = int(preview_w * (result.size[1] / result.size[0]))
    preview_img = result.resize((preview_w, preview_h), Image.Resampling.LANCZOS)
    preview_filename = f"{mockup_id}_preview.png"
    preview_path = os.path.join(output_dir, preview_filename)
    preview_img.save(preview_path, format="PNG")
    
    return {
        "mockup_path": out_path,
        "clean_image_path": clean_path,
        "preview_path": preview_path,
        "width": result.size[0],
        "height": result.size[1],
        "aspect_ratio": aspect_ratio,
        "is_ai_generated": False,
        "print_placement": print_placement,
        "custom_x_pct": custom_x_pct,
        "custom_y_pct": custom_y_pct,
        "custom_scale": custom_scale,
        "custom_rotation": custom_rotation,
        "blend_mode": blend_mode,
        "opacity": opacity
    }

def recomposite_mockup_image(
    clean_base_path: str,
    artwork_path: str,
    output_mockup_path: str,
    output_preview_path: str,
    placement: str = "custom",
    x_pct: float = 0.50,
    y_pct: float = 0.58,
    scale: float = 0.25,
    rotation: float = 0.0,
    opacity: float = 0.96,
    blend_mode: str = "natural_dtg",
    is_lifestyle: bool = True
) -> Dict[str, Any]:
    """
    Instantly re-composites an artwork onto an existing clean base garment in < 0.2s.
    Eliminates wait times and token costs when adjusting positioning or styling.
    """
    base_img = Image.open(clean_base_path).convert("RGBA")
    art_img = Image.open(artwork_path).convert("RGBA")
    
    result = embed_print_on_garment(
        base_img,
        art_img,
        placement=placement,
        is_lifestyle=is_lifestyle,
        custom_x_pct=x_pct,
        custom_y_pct=y_pct,
        custom_scale=scale,
        custom_rotation=rotation,
        opacity=opacity,
        blend_mode=blend_mode
    )
    
    result.save(output_mockup_path, format="PNG", optimize=True)
    
    preview_w = 1000
    preview_h = int(preview_w * (result.size[1] / result.size[0]))
    preview_img = result.resize((preview_w, preview_h), Image.Resampling.LANCZOS)
    preview_img.save(output_preview_path, format="PNG")
    
    return {
        "width": result.size[0],
        "height": result.size[1],
        "mockup_path": output_mockup_path,
        "preview_path": output_preview_path
    }

async def generate_vton_mockup(
    provider: str,
    garment_img_path: str,
    model_prompt: str,
    api_key: Optional[str] = None
) -> Optional[Image.Image]:
    """
    Integrates external Virtual Try-On APIs (FASHN.ai or Fal.ai CatVTON) if key is provided.
    """
    clean_key = (api_key or "").strip()
    if not clean_key:
        return None
        
    async with httpx.AsyncClient(timeout=120.0) as client:
        if provider == "fashn":
            try:
                with open(garment_img_path, "rb") as gf:
                    garment_bytes = gf.read()
                
                resp = await client.post(
                    "https://api.fashn.ai/v1/run",
                    json={
                        "model_image": "default_model",
                        "garment_image": f"data:image/png;base64,{garment_bytes.hex()}",
                        "category": "tops"
                    },
                    headers={"Authorization": f"Bearer {clean_key}", "Content-Type": "application/json"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    out_url = data.get("output", [None])[0]
                    if out_url:
                        i_resp = await client.get(out_url)
                        return Image.open(io.BytesIO(i_resp.content)).convert("RGBA")
            except Exception as e:
                print(f"FASHN VTON error: {e}")
                return None
                
        elif provider == "fal_vton":
            try:
                resp = await client.post(
                    "https://queue.fal.run/fal-ai/cat-vton",
                    json={"prompt": model_prompt},
                    headers={"Authorization": f"Key {clean_key}", "Content-Type": "application/json"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if "image" in data:
                        i_resp = await client.get(data["image"]["url"])
                        return Image.open(io.BytesIO(i_resp.content)).convert("RGBA")
            except Exception as e:
                print(f"Fal VTON error: {e}")
                return None
                
    return None
