import os
import numpy as np
from PIL import Image, ImageOps, ImageEnhance, ImageFilter

TEMPLATES_DIR = "backend/templates"
DOWNLOADS_DIR = "backend/templates/downloads"

def prepare_clean_flatlay():
    """
    Creates pure blank flatlay templates from ironed_black_tee.jpg (3312x4416)
    100% clean, NO badges, NO logos, authentic cotton on natural wood floor.
    """
    src = os.path.join(DOWNLOADS_DIR, "ironed_black_tee.jpg")
    im = Image.open(src).convert("RGB")
    
    # Crop to 4:5 commercial aspect ratio centered on the t-shirt
    # T-shirt is centered around X=1656
    w, h = im.size
    # Target 4:5 crop
    target_w = int(h * 0.8) # 3532
    if target_w <= w:
        left = (w - target_w) // 2
        im_crop = im.crop((left, 0, left + target_w, h))
    else:
        target_h = int(w * 1.25)
        top = (h - target_h) // 2
        im_crop = im.crop((0, top, w, top + target_h))
        
    # Resize to standardized 2000x2500
    flatlay_2000 = im_crop.resize((2000, 2500), Image.Resampling.LANCZOS)
    
    # Save garment_black.png
    out_black = os.path.join(TEMPLATES_DIR, "garment_black.png")
    flatlay_2000.save(out_black, "PNG")
    print(f"Saved clean blank: {out_black}")
    
    # Color variations using authentic fabric texture
    arr = np.array(flatlay_2000, dtype=np.float32)
    # Background is warm wood (R > 180, B < 120), shirt is dark grey/black (R,G,B < 140)
    is_shirt = (arr[:, :, 0] < 150) & (arr[:, :, 1] < 150) & (arr[:, :, 2] < 150)
    
    # Relative shirt luminance (wrinkles & highlights)
    shirt_lum = (0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2])
    lum_min, lum_max = np.min(shirt_lum[is_shirt]), np.percentile(shirt_lum[is_shirt], 98)
    norm_lum = np.clip((shirt_lum - lum_min) / (lum_max - lum_min + 1e-5), 0.0, 1.5)
    
    colors = {
        "garment_navy_heather.png": (24, 36, 56),     # Navy Heather
        "garment_military_green.png": (48, 62, 46),   # Military Green
        "garment_sport_grey.png": (148, 154, 164)     # Sport Grey
    }
    
    for filename, base_rgb in colors.items():
        var_arr = arr.copy()
        for c in range(3):
            val = base_rgb[c] * (0.6 + 0.8 * norm_lum)
            var_arr[:, :, c] = np.where(is_shirt, np.clip(val, 0, 255), var_arr[:, :, c])
            
        var_img = Image.fromarray(np.uint8(var_arr))
        out_f = os.path.join(TEMPLATES_DIR, filename)
        var_img.save(out_f, "PNG")
        print(f"Saved clean color variant: {out_f}")

def prepare_clean_model():
    """
    Creates pure blank model templates from ringflash_blank.jpg (1356x2048)
    Pure real blank cotton shirt on model.
    """
    src = os.path.join(DOWNLOADS_DIR, "ringflash_blank.jpg")
    im = Image.open(src).convert("RGB")
    
    # Scale to 2000x2500
    model_2000 = im.resize((2000, 2500), Image.Resampling.LANCZOS)
    
    # 1. Clean studio
    out_studio = os.path.join(TEMPLATES_DIR, "lifestyle_studio_clean.png")
    model_2000.save(out_studio, "PNG")
    print(f"Saved clean model: {out_studio}")
    
    # 2. Texas Ranch (warm golden hour sunlight)
    ranch_arr = np.array(model_2000, dtype=np.float32)
    ranch_arr[:, :, 0] = np.clip(ranch_arr[:, :, 0] * 1.06 + 8, 0, 255)
    ranch_arr[:, :, 1] = np.clip(ranch_arr[:, :, 1] * 1.02 + 4, 0, 255)
    ranch_arr[:, :, 2] = np.clip(ranch_arr[:, :, 2] * 0.94, 0, 255)
    out_ranch = os.path.join(TEMPLATES_DIR, "lifestyle_texas_ranch.png")
    Image.fromarray(np.uint8(ranch_arr)).save(out_ranch, "PNG")
    print(f"Saved clean model: {out_ranch}")
    
    # 3. Midwest Porch
    out_porch = os.path.join(TEMPLATES_DIR, "lifestyle_midwest_porch.png")
    model_2000.save(out_porch, "PNG")
    
    # 4. Rocky Mountain
    rocky_arr = np.array(model_2000, dtype=np.float32)
    rocky_arr[:, :, 2] = np.clip(rocky_arr[:, :, 2] * 1.05 + 6, 0, 255)
    out_rocky = os.path.join(TEMPLATES_DIR, "lifestyle_rocky_mountain.png")
    Image.fromarray(np.uint8(rocky_arr)).save(out_rocky, "PNG")
    
    # 5. Coastal
    out_coastal = os.path.join(TEMPLATES_DIR, "lifestyle_coastal_patriot.png")
    model_2000.save(out_coastal, "PNG")
    
    # 6. Workshop
    out_workshop = os.path.join(TEMPLATES_DIR, "lifestyle_urban_workshop.png")
    model_2000.save(out_workshop, "PNG")

if __name__ == "__main__":
    prepare_clean_flatlay()
    prepare_clean_model()
    print("ALL CLEAN BLANK TEMPLATES SUCCESSFULLY DEPLOYED!")

