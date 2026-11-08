from PIL import Image, ImageOps, ImageEnhance
import numpy as np
import os

artwork_path = "D:/TaoanhbangAI/output/artworks/art_e4062735a8_dtg_master.png"
art_img = Image.open(artwork_path).convert("RGBA")

def test_composite(bg_path, out_name, chest_bbox):
    """
    chest_bbox: (x, y, w, h)
    """
    bg = Image.open(bg_path).convert("RGBA")
    bx, by, bw, bh = chest_bbox
    
    # Scale artwork to fit chest_bbox while preserving aspect ratio
    aw, ah = art_img.size
    scale = min(bw / aw, bh / ah)
    target_w = int(aw * scale)
    target_h = int(ah * scale)
    
    resized_art = art_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Center within chest_bbox
    paste_x = bx + (bw - target_w) // 2
    paste_y = by + (bh - target_h) // 2
    
    # Fabric shading
    crop_bg = bg.crop((paste_x, paste_y, paste_x + target_w, paste_y + target_h))
    gray = crop_bg.convert("L")
    gray_arr = np.array(gray, dtype=np.float32)
    mean_val = np.mean(gray_arr)
    shading = np.clip((gray_arr - mean_val) * 0.4 + 128.0, 75.0, 180.0) / 128.0
    
    art_arr = np.array(resized_art, dtype=np.float32)
    for c in range(3):
        art_arr[:, :, c] = np.clip(art_arr[:, :, c] * shading, 0.0, 255.0)
    
    shaded_art = Image.fromarray(np.uint8(art_arr), mode="RGBA")
    
    comp = bg.copy()
    comp.paste(shaded_art, (paste_x, paste_y), shaded_art)
    
    out_path = f"D:/TaoanhbangAI/output/mockups/{out_name}.jpg"
    comp.convert("RGB").save(out_path, quality=92)
    print(f"Rendered {out_name}: saved to {out_path}")

# 1. Real Flatlay Black Tee (1600x2240)
# Chest is roughly x=500, y=700, w=600, h=700
test_composite("backend/templates/downloads/black_tee_flatlay.jpg", "test_real_flatlay_black", (500, 700, 600, 750))

# 2. Real Male Model Studio (1966x2809)
# Chest is roughly x=600, y=1000, w=760, h=850
test_composite("backend/templates/downloads/black_model_modern.jpg", "test_real_male_model", (600, 1050, 760, 850))

# 3. Real Woman Model Studio (1600x2400)
# Chest is roughly x=520, y=850, w=560, h=650
test_composite("backend/templates/downloads/woman_model_tee.jpg", "test_real_woman_model", (520, 850, 560, 650))

# 4. Real Flatlay Ironed Tee on Wood (3312x4416)
# Chest is roughly x=1050, y=1400, w=1200, h=1400
test_composite("backend/templates/downloads/ironed_black_tee.jpg", "test_real_flatlay_wood", (1050, 1400, 1200, 1400))

