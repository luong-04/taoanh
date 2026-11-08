import os
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageOps

def realistic_dtg_embed(
    garment_img: Image.Image,
    artwork_transparent: Image.Image,
    x_pct: float = 0.5,
    y_pct: float = 0.5,
    scale: float = 0.25,
    rotation: float = 0.0,
    opacity: float = 0.95,
    blend_mode: str = "natural_dtg", # "natural_dtg", "multiply", "vintage_wash", "vibrant"
    fabric_texture_depth: float = 0.55,
    color_harmonization: float = 0.15 # match ambient lighting
) -> Image.Image:
    """
    State-of-the-art Direct-To-Garment (DTG) apparel embedding:
    - Freeform position (x_pct, y_pct), scale, and rotation
    - True fabric crease & wrinkle luminance modulation
    - Cotton weave micro-texture overlay
    - Ambient lighting & white-balance color harmonization
    - Sub-pixel optical edge feathering
    """
    gw, gh = garment_img.size
    
    # 1. Scale & rotate artwork
    aw, ah = artwork_transparent.size
    target_w = max(10, int(gw * scale))
    scale_factor = target_w / float(aw)
    target_h = max(10, int(ah * scale_factor))
    
    resized_art = artwork_transparent.resize((target_w, target_h), Image.Resampling.LANCZOS)
    if abs(rotation) > 0.1:
        # Rotate with expansion so nothing is clipped
        resized_art = resized_art.rotate(rotation, resample=Image.Resampling.BICUBIC, expand=True)
        target_w, target_h = resized_art.size
        
    # Calculate top-left placement
    pos_x = int(gw * x_pct - target_w // 2)
    pos_y = int(gh * y_pct - target_h // 2)
    
    # Clamp bounding box inside garment canvas
    crop_x1 = max(0, pos_x)
    crop_y1 = max(0, pos_y)
    crop_x2 = min(gw, pos_x + target_w)
    crop_y2 = min(gh, pos_y + target_h)
    
    if crop_x2 <= crop_x1 or crop_y2 <= crop_y1:
        return garment_img # Off canvas
        
    # Sub-crop the artwork if it overflows boundaries
    art_crop_x1 = crop_x1 - pos_x
    art_crop_y1 = crop_y1 - pos_y
    art_crop_x2 = art_crop_x1 + (crop_x2 - crop_x1)
    art_crop_y2 = art_crop_y1 + (crop_y2 - crop_y1)
    
    art_cropped = resized_art.crop((art_crop_x1, art_crop_y1, art_crop_x2, art_crop_y2))
    cur_w, cur_h = crop_x2 - crop_x1, crop_y2 - crop_y1
    
    # 2. Extract underlying garment patch
    garment_patch = garment_img.crop((crop_x1, crop_y1, crop_x2, crop_y2)).convert("RGBA")
    garment_rgb = np.array(garment_patch.convert("RGB"), dtype=np.float32)
    garment_gray = np.array(garment_patch.convert("L"), dtype=np.float32)
    
    art_arr = np.array(art_cropped, dtype=np.float32) # (H, W, 4)
    art_alpha = art_arr[:, :, 3] / 255.0
    
    # 3. Analyze ambient lighting color for tone harmonization
    # Calculate the average color of the garment in this region
    mean_garment_color = np.mean(garment_rgb, axis=(0, 1)) # [R, G, B]
    # Normalize color tint
    norm_tint = mean_garment_color / (np.linalg.norm(mean_garment_color) + 1e-5) * 1.732 # normalize to length ~ sqrt(3)
    
    # 4. Extract Fabric Folds & Micro-Wrinkles
    # We use a high-pass filter: garment_gray minus low-frequency blurred version
    patch_gray_img = Image.fromarray(np.uint8(garment_gray))
    base_lighting = np.array(patch_gray_img.filter(ImageFilter.GaussianBlur(radius=8.0)), dtype=np.float32)
    fold_creases = np.array(patch_gray_img.filter(ImageFilter.GaussianBlur(radius=1.5)), dtype=np.float32)
    
    # Fold shading factor: relative deviation from local lighting
    # Creases become < 1.0 (shadows), folds catch light > 1.0
    fold_ratio = fold_creases / (base_lighting + 10.0)
    # Scale intensity by fabric_texture_depth
    fold_multiplier = 1.0 + (fold_ratio - 1.0) * (fabric_texture_depth * 1.8)
    fold_multiplier = np.clip(fold_multiplier, 0.45, 1.45)
    
    # Also capture overall shadow gradient across the torso
    global_mean = np.mean(garment_gray)
    global_shade = (garment_gray / (global_mean + 1e-5)) ** 0.5
    global_shade = np.clip(global_shade, 0.65, 1.25)
    
    shading_map = fold_multiplier * global_shade
    
    # 5. Composite according to blend mode
    out_patch = garment_rgb.copy()
    
    # Harmonize artwork RGB with ambient lighting
    art_rgb = art_arr[:, :, :3].copy()
    if color_harmonization > 0.01:
        for c in range(3):
            art_rgb[:, :, c] = art_rgb[:, :, c] * (1.0 - color_harmonization) + (art_rgb[:, :, c] * norm_tint[c]) * color_harmonization
            
    # Apply fabric fold shading onto artwork colors
    for c in range(3):
        art_rgb[:, :, c] = np.clip(art_rgb[:, :, c] * shading_map, 0.0, 255.0)
        
    # Micro-texture weave: slightly embed into fabric fibers
    # Extract cotton grain
    micro_grain = (fold_creases - np.array(patch_gray_img.filter(ImageFilter.GaussianBlur(radius=0.8)), dtype=np.float32))
    micro_grain_factor = np.clip(1.0 + (micro_grain / 128.0) * 0.25, 0.85, 1.15)
    for c in range(3):
        art_rgb[:, :, c] = np.clip(art_rgb[:, :, c] * micro_grain_factor, 0.0, 255.0)
        
    # Effective alpha with user opacity & edge absorption
    effective_alpha = art_alpha * opacity
    
    # Sub-pixel edge feathering (prevent razor-sharp computer cutout look)
    alpha_img = Image.fromarray(np.uint8(np.clip(effective_alpha * 255.0, 0, 255)))
    alpha_soft = np.array(alpha_img.filter(ImageFilter.GaussianBlur(radius=0.6)), dtype=np.float32) / 255.0
    
    if blend_mode == "multiply":
        # Pure multiply for light garments
        for c in range(3):
            mult = (garment_rgb[:, :, c] * art_rgb[:, :, c]) / 255.0
            out_patch[:, :, c] = garment_rgb[:, :, c] * (1.0 - alpha_soft) + mult * alpha_soft
    elif blend_mode == "vintage_wash":
        # Slightly faded, weathered look
        for c in range(3):
            blended = garment_rgb[:, :, c] * (1.0 - alpha_soft * 0.85) + art_rgb[:, :, c] * (alpha_soft * 0.85)
            # Add subtle desaturation
            gray_comp = 0.299 * blended[:, :, 0] + 0.587 * blended[:, :, 1] + 0.114 * blended[:, :, 2]
            out_patch[:, :, c] = np.clip(blended * 0.9 + gray_comp * 0.1, 0, 255)
    elif blend_mode == "vibrant":
        # Crisp vivid colors but still deeply shaded by fabric folds
        for c in range(3):
            out_patch[:, :, c] = garment_rgb[:, :, c] * (1.0 - alpha_soft) + art_rgb[:, :, c] * alpha_soft
    else: # "natural_dtg" (default)
        # DTG print: Opaque ink on dark garment with fiber show-through & fold shading
        for c in range(3):
            # 92% art ink, 8% garment fiber luminance show-through in midtones
            fiber_tint = garment_rgb[:, :, c] * 0.12
            ink_color = np.clip(art_rgb[:, :, c] * 0.92 + fiber_tint, 0, 255)
            out_patch[:, :, c] = garment_rgb[:, :, c] * (1.0 - alpha_soft) + ink_color * alpha_soft
            
    # Reassemble composite onto garment image
    result = garment_img.copy()
    blended_patch_img = Image.fromarray(np.uint8(out_patch), mode="RGB")
    result.paste(blended_patch_img, (crop_x1, crop_y1))
    return result

if __name__ == "__main__":
    print("Testing realistic_dtg_embed...")
    # Load woman image and logo
    user_p = r"C:/Users/ADMIN/.gemini/antigravity/brain/2456841a-d5ba-44ac-bd4f-a6e0f92c6176/.user_uploaded/media_1793671966634_573b69f6.png"
    logo_p = r"D:/TaoanhbangAI/output/artworks/art_4f42c4de1d_dtg_master.png"
    
    if os.path.exists(user_p) and os.path.exists(logo_p):
        u_img = Image.open(user_p).convert("RGB")
        l_img = Image.open(logo_p).convert("RGBA")
        
        # Test on the real chest coordinates of this woman:
        # Chest is at X=0.30, Y=0.82, scale=0.22, slight rotation=-6 degrees (matching shoulder tilt)
        res = realistic_dtg_embed(
            u_img,
            l_img,
            x_pct=0.30,
            y_pct=0.82,
            scale=0.22,
            rotation=-6.0,
            opacity=0.96,
            blend_mode="natural_dtg",
            fabric_texture_depth=0.6,
            color_harmonization=0.18
        )
        out_test = r"backend/test_realistic_blend_chest.png"
        res.save(out_test)
        print("Successfully saved test image to", out_test)

