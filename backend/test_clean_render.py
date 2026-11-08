from PIL import Image, ImageOps, ImageEnhance
import numpy as np
import os

art_path = "D:/TaoanhbangAI/output/artworks/art_e4062735a8_dtg_master.png"
art = Image.open(art_path).convert("RGBA")

def render_test(bg_file, out_name, v_offset=0.40, scale=0.36):
    bg = Image.open(f"backend/templates/{bg_file}").convert("RGBA")
    gw, gh = bg.size
    aw, ah = art.size
    
    target_w = int(gw * scale)
    scale_r = target_w / float(aw)
    target_h = int(ah * scale_r)
    
    resized_art = art.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    pos_x = int(gw * 0.50 - target_w // 2)
    pos_y = int(gh * v_offset - target_h // 2)
    
    # Extract fabric fold texture underneath the artwork
    garment_crop = bg.crop((pos_x, pos_y, pos_x + target_w, pos_y + target_h))
    garment_gray = garment_crop.convert("L")
    gray_arr = np.array(garment_gray, dtype=np.float32)
    mean_val = np.mean(gray_arr)
    shading = np.clip((gray_arr - mean_val) * 0.5 + 128.0, 70.0, 190.0) / 128.0
    
    art_arr = np.array(resized_art, dtype=np.float32)
    for c in range(3):
        art_arr[:, :, c] = np.clip(art_arr[:, :, c] * shading, 0.0, 255.0)
    
    shaded_art = Image.fromarray(np.uint8(art_arr), mode="RGBA")
    
    comp = bg.copy()
    comp.paste(shaded_art, (pos_x, pos_y), shaded_art)
    
    out_p = f"D:/TaoanhbangAI/output/mockups/{out_name}.jpg"
    comp.convert("RGB").save(out_p, quality=92)
    print(f"Saved {out_name} to {out_p}")

render_test("garment_black.png", "clean_flatlay_black_test", v_offset=0.38, scale=0.36)
render_test("lifestyle_texas_ranch.png", "clean_model_ranch_test", v_offset=0.42, scale=0.34)

