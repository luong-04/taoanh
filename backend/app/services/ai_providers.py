"""
AI Providers Router for POD Design Studio.
Integrates Fal.ai, Replicate, Google Imagen 3, OpenAI DALL-E 3,
and a High-Fidelity Local Procedural Badge/Decal Generator for instant offline testing.
"""
import io
import time
import httpx
import base64
import random
import asyncio
import numpy as np
from typing import Dict, Any, Optional
from PIL import Image, ImageDraw, ImageFont, ImageFilter

async def verify_provider_key(provider: str, api_key: str) -> Dict[str, Any]:
    """
    Validates API key health for the requested provider.
    """
    if not api_key or not api_key.strip():
        return {"valid": False, "message": "API key cannot be empty"}
    
    clean_key = api_key.strip()
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            if provider == "openai":
                resp = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {clean_key}"}
                )
                if resp.status_code == 200:
                    return {"valid": True, "message": "OpenAI API Key verified successfully!"}
                return {"valid": False, "message": f"OpenAI auth failed ({resp.status_code}): {resp.text}"}
                
            elif provider == "gemini":
                resp = await client.get(
                    f"https://generativelanguage.googleapis.com/v1beta/models?key={clean_key}"
                )
                if resp.status_code == 200:
                    return {"valid": True, "message": "Google Gemini/Imagen API Key verified successfully!"}
                return {"valid": False, "message": f"Google Gemini auth failed ({resp.status_code}): {resp.text}"}
                
            elif provider == "replicate":
                resp = await client.get(
                    "https://api.replicate.com/v1/account",
                    headers={"Authorization": f"Bearer {clean_key}"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    username = data.get("username", "user")
                    return {"valid": True, "message": f"Replicate API Key verified for user: {username}"}
                return {"valid": False, "message": f"Replicate auth failed ({resp.status_code}): {resp.text}"}
                
            elif provider == "fal":
                # Fal keys are formatted as key_id:key_secret or single token
                resp = await client.get(
                    "https://rest.alpha.fal.ai/tokens",
                    headers={"Authorization": f"Key {clean_key}"}
                )
                if resp.status_code in [200, 404]: # 404 on tokens endpoint still confirms key authentication
                    return {"valid": True, "message": "Fal.ai API Key verified successfully!"}
                return {"valid": False, "message": f"Fal.ai auth failed ({resp.status_code}): {resp.text}"}
                
            elif provider == "fashn":
                resp = await client.get(
                    "https://api.fashn.ai/v1/status",
                    headers={"Authorization": f"Bearer {clean_key}"}
                )
                if resp.status_code in [200, 401]:
                    if resp.status_code == 200:
                        return {"valid": True, "message": "FASHN.ai API Key verified successfully!"}
                    return {"valid": False, "message": f"FASHN.ai auth failed: {resp.text}"}
                return {"valid": True, "message": "FASHN.ai endpoint reachable"}
                
            else:
                return {"valid": False, "message": f"Unknown provider: {provider}"}
        except Exception as e:
            return {"valid": False, "message": f"Connection check failed: {str(e)}"}

# Local Procedural Badge Generator for instant offline testing and fallback
def generate_procedural_artwork(
    state_code: str,
    theme: str,
    design_style: str,
    slogan: str,
    product_color: str
) -> Image.Image:
    """
    Renders an authentic, high-resolution vintage military / state emblem
    using PIL drawing primitives, distressed masks, stars, and bold typography.
    """
    width, height = 2048, 2048
    img = Image.new("RGBA", (width, height), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Palette configuration based on theme
    navy_blue = (24, 43, 73, 255)
    crimson = (180, 32, 42, 255)
    warm_gold = (212, 160, 23, 255)
    charcoal = (35, 39, 42, 255)
    olive = (55, 65, 45, 255)
    
    primary_color = crimson if theme in ["Marines", "Patriotic", "4th of July"] else (olive if theme == "Army" else navy_blue)
    secondary_color = warm_gold
    
    center_x, center_y = width // 2, height // 2
    radius = 750
    
    # Outer decorative ring
    draw.ellipse(
        [center_x - radius, center_y - radius, center_x + radius, center_y + radius],
        outline=primary_color,
        width=24
    )
    
    # Inner circular border
    inner_radius = radius - 45
    draw.ellipse(
        [center_x - inner_radius, center_y - inner_radius, center_x + inner_radius, center_y + inner_radius],
        outline=secondary_color,
        width=12
    )
    
    # Second inner border
    inner2_radius = inner_radius - 80
    draw.ellipse(
        [center_x - inner2_radius, center_y - inner2_radius, center_x + inner2_radius, center_y + inner2_radius],
        outline=primary_color,
        width=8
    )
    
    # Star coordinates helper
    def draw_star(cx, cy, r_outer, r_inner, fill_color, num_points=5):
        import math
        points = []
        angle = -math.pi / 2
        step = math.pi / num_points
        for i in range(num_points * 2):
            r = r_outer if i % 2 == 0 else r_inner
            x = cx + r * math.cos(angle)
            y = cy + r * math.sin(angle)
            points.append((x, y))
            angle += step
        draw.polygon(points, fill=fill_color)
    
    # Draw ring of decorative stars
    import math
    num_stars = 13
    star_orbit = inner_radius - 40
    for i in range(num_stars):
        a = (i / num_stars) * 2 * math.pi - math.pi / 2
        sx = center_x + star_orbit * math.cos(a)
        sy = center_y + star_orbit * math.sin(a)
        draw_star(sx, sy, 22, 10, secondary_color)

    # Central Shield
    shield_w = 420
    shield_h = 500
    shield_top = center_y - 280
    shield_pts = [
        (center_x - shield_w // 2, shield_top),
        (center_x + shield_w // 2, shield_top),
        (center_x + shield_w // 2, shield_top + shield_h * 0.6),
        (center_x, shield_top + shield_h),
        (center_x - shield_w // 2, shield_top + shield_h * 0.6),
    ]
    draw.polygon(shield_pts, fill=primary_color, outline=secondary_color)
    
    # Central large star on shield
    draw_star(center_x, center_y - 80, 140, 60, secondary_color)
    
    # Inner star on central star
    draw_star(center_x, center_y - 80, 60, 25, (255, 255, 255, 255))
    
    # Ribbon Banners (Top and Bottom)
    top_ribbon_pts = [
        (center_x - 650, center_y - 520),
        (center_x + 650, center_y - 520),
        (center_x + 580, center_y - 390),
        (center_x - 580, center_y - 390),
    ]
    draw.polygon(top_ribbon_pts, fill=primary_color, outline=secondary_color)
    
    bot_ribbon_pts = [
        (center_x - 680, center_y + 360),
        (center_x + 680, center_y + 360),
        (center_x + 610, center_y + 510),
        (center_x - 610, center_y + 510),
    ]
    draw.polygon(bot_ribbon_pts, fill=primary_color, outline=secondary_color)
    
    # Text Rendering
    # Using built-in default font with scaling or simulated bold block lettering
    font_large = ImageFont.load_default()
    
    # Helper to draw centered bold text
    def draw_bold_text(text, cy, font_scale=4, color=(255, 255, 255, 255)):
        # Simulate bold and large font using temporary canvas
        t_img = Image.new("RGBA", (1400, 150), (0, 0, 0, 0))
        t_draw = ImageDraw.Draw(t_img)
        t_draw.text((20, 20), text, font=font_large, fill=color)
        # Scaled up
        tw, th = 700, 80
        scaled_t = t_img.crop((18, 18, 200, 45)).resize((tw, th), Image.Resampling.NEAREST)
        img.paste(scaled_t, (center_x - tw // 2, cy - th // 2), scaled_t)

    # Draw Top Text: State Code + Theme
    state_title = f"{state_code} • {theme.upper()}"
    draw_bold_text(state_title, center_y - 455, font_scale=3, color=(255, 255, 255, 255))
    
    # Draw Center Text: Slogan abbreviation or keyword
    slogan_clean = slogan if len(slogan) <= 32 else (slogan[:30] + "...")
    draw_bold_text(slogan_clean, center_y + 435, font_scale=3, color=secondary_color)

    # Distressed Vintage Texture (if requested)
    if "Distressed" in design_style or "Vintage" in design_style or "Tactical" in design_style:
        # Create subtle grain / scratch mask
        noise = Image.effect_noise((width, height), 25)
        noise = noise.point(lambda p: 255 if p > 220 else 0)
        img_arr = np.array(img)
        noise_arr = np.array(noise)
        # Apply distressing to non-white pixels
        mask = (noise_arr == 255) & (img_arr[:, :, 0] < 240)
        img_arr[mask] = [255, 255, 255, 255]
        img = Image.fromarray(img_arr)
        
    return img

async def generate_artwork_image(
    provider: str,
    prompt: str,
    negative_prompt: str,
    api_key: Optional[str] = None,
    state_code: str = "TX",
    theme: str = "Veteran",
    design_style: str = "Vintage Distressed",
    slogan: str = "Land of the Free",
    product_color: str = "Black"
) -> Image.Image:
    """
    Routes the prompt to the selected AI provider or falls back to procedural generator.
    """
    clean_key = (api_key or "").strip()
    
    # 0. Check ShopAPI (Official integration via youtube-main)
    # If explicitly requested or as default AI generator when available
    if provider in ["shopapi", "ai_shopapi", "auto"] or (provider == "local_demo" and not clean_key):
        try:
            from app.services.shopapi_client import get_shopapi_client, generate_artwork_with_shopapi
            if get_shopapi_client() is not None:
                print(f"[ShopAPI] Generating real AI artwork for {state_code} / {theme} with prompt: {prompt[:80]}...")
                ai_img = await asyncio.to_thread(generate_artwork_with_shopapi, prompt)
                if ai_img:
                    print(f"[ShopAPI] Generation successful! Size: {ai_img.size}")
                    return ai_img
                print("[ShopAPI] returned None, continuing to other providers or fallback...")
        except Exception as e:
            print(f"[ShopAPI] error: {e}. Falling back...")

    # If provider is explicitly local procedural or no AI key provided
    if provider in ["local_demo", "local_procedural"] or not clean_key:
        print(f"Generating procedural high-res artwork for {state_code} / {theme}...")
        return generate_procedural_artwork(state_code, theme, design_style, slogan, product_color)
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        # 1. Fal.ai (Flux.1 Schnell / Dev)
        if provider == "fal":
            try:
                endpoint = "https://queue.fal.run/fal-ai/flux/schnell"
                payload = {
                    "prompt": prompt,
                    "image_size": "square_hd",
                    "num_inference_steps": 4,
                    "enable_safety_checker": False
                }
                # Submit queue request
                resp = await client.post(
                    endpoint,
                    json=payload,
                    headers={"Authorization": f"Key {clean_key}", "Content-Type": "application/json"}
                )
                if resp.status_code != 200:
                    raise Exception(f"Fal.ai returned {resp.status_code}: {resp.text}")
                data = resp.json()
                
                # Check if result is immediate or requires polling
                image_url = None
                if "images" in data and len(data["images"]) > 0:
                    image_url = data["images"][0]["url"]
                elif "status_url" in data:
                    status_url = data["status_url"]
                    for _ in range(30):
                        time.sleep(2)
                        poll_resp = await client.get(status_url, headers={"Authorization": f"Key {clean_key}"})
                        p_data = poll_resp.json()
                        if p_data.get("status") == "COMPLETED":
                            resp_url = p_data.get("response_url")
                            r_resp = await client.get(resp_url, headers={"Authorization": f"Key {clean_key}"})
                            image_url = r_resp.json()["images"][0]["url"]
                            break
                        elif p_data.get("status") in ["FAILED", "ERROR"]:
                            raise Exception(f"Fal.ai generation failed: {p_data}")
                
                if image_url:
                    img_resp = await client.get(image_url)
                    return Image.open(io.BytesIO(img_resp.content)).convert("RGBA")
            except Exception as e:
                print(f"Fal.ai error: {e}. Falling back to procedural engine.")
                return generate_procedural_artwork(state_code, theme, design_style, slogan, product_color)

        # 2. OpenAI DALL-E 3
        elif provider == "openai":
            try:
                resp = await client.post(
                    "https://api.openai.com/v1/images/generations",
                    json={
                        "model": "dall-e-3",
                        "prompt": prompt,
                        "n": 1,
                        "size": "1024x1024",
                        "response_format": "b64_json"
                    },
                    headers={"Authorization": f"Bearer {clean_key}", "Content-Type": "application/json"}
                )
                if resp.status_code != 200:
                    raise Exception(f"OpenAI error ({resp.status_code}): {resp.text}")
                b64_data = resp.json()["data"][0]["b64_json"]
                img_bytes = base64.b64decode(b64_data)
                return Image.open(io.BytesIO(img_bytes)).convert("RGBA")
            except Exception as e:
                print(f"OpenAI error: {e}. Falling back to procedural engine.")
                return generate_procedural_artwork(state_code, theme, design_style, slogan, product_color)

        # 3. Replicate (Flux / SDXL)
        elif provider == "replicate":
            try:
                resp = await client.post(
                    "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
                    json={"input": {"prompt": prompt, "aspect_ratio": "1:1"}},
                    headers={"Authorization": f"Bearer {clean_key}", "Content-Type": "application/json"}
                )
                if resp.status_code not in [200, 201]:
                    raise Exception(f"Replicate error ({resp.status_code}): {resp.text}")
                pred = resp.json()
                poll_url = pred["urls"]["get"]
                
                # Poll for completion
                for _ in range(30):
                    time.sleep(2)
                    poll_resp = await client.get(poll_url, headers={"Authorization": f"Bearer {clean_key}"})
                    res = poll_resp.json()
                    if res["status"] == "succeeded":
                        out_url = res["output"][0] if isinstance(res["output"], list) else res["output"]
                        img_resp = await client.get(out_url)
                        return Image.open(io.BytesIO(img_resp.content)).convert("RGBA")
                    elif res["status"] in ["failed", "canceled"]:
                        raise Exception(f"Replicate generation failed: {res.get('error')}")
            except Exception as e:
                print(f"Replicate error: {e}. Falling back to procedural engine.")
                return generate_procedural_artwork(state_code, theme, design_style, slogan, product_color)

        # 4. Google Gemini / Imagen 3
        elif provider == "gemini":
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={clean_key}"
                payload = {
                    "instances": [{"prompt": prompt}],
                    "parameters": {"sampleCount": 1, "aspectRatio": "1:1"}
                }
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    b64_img = data["predictions"][0]["bytesBase64Encoded"]
                    img_bytes = base64.b64decode(b64_img)
                    return Image.open(io.BytesIO(img_bytes)).convert("RGBA")
                else:
                    raise Exception(f"Gemini/Imagen error ({resp.status_code}): {resp.text}")
            except Exception as e:
                print(f"Gemini error: {e}. Falling back to procedural engine.")
                return generate_procedural_artwork(state_code, theme, design_style, slogan, product_color)

    # Default fallback
    return generate_procedural_artwork(state_code, theme, design_style, slogan, product_color)
