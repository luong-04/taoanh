"""
ShopAPI Integration Service for POD Design Studio.
Leverages the authenticated ShopAPI credentials from youtube-main to generate
real AI artwork (FLUX/Beluga models) and photorealistic model mockups.
"""
import os
import sys
import io
import re
import json
import time
import httpx
import urllib.request
from typing import Optional, Dict, Any, List
from PIL import Image

# Path to youtube-main and its internal SDK
YOUTUBE_MAIN_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "youtube-main"))
SDK_DIR = os.path.join(YOUTUBE_MAIN_DIR, "_sdk")

if YOUTUBE_MAIN_DIR not in sys.path:
    sys.path.insert(0, YOUTUBE_MAIN_DIR)
if SDK_DIR not in sys.path:
    sys.path.insert(0, SDK_DIR)

_cached_client = None

def get_shopapi_client():
    """
    Retrieves or initializes the official ShopAPI client using DPAPI decrypted secrets from youtube-main.
    """
    global _cached_client
    if _cached_client is not None:
        return _cached_client
        
    secrets_path = os.path.join(YOUTUBE_MAIN_DIR, "secrets.json")
    if not os.path.exists(secrets_path):
        return None
        
    try:
        from core.secrets import SecretStore
        from shopapi import ShopAPI
        
        store = SecretStore(secrets_path)
        secrets = store.load()
        api_key = secrets.get("api_key")
        if not api_key:
            return None
            
        client = ShopAPI(api_key=api_key, base_url="https://api.shopapi.vn")
        _cached_client = client
        return _cached_client
    except Exception as e:
        print(f"Error initializing ShopAPI client: {e}")
        return None

def check_shopapi_status() -> Dict[str, Any]:
    """
    Checks if ShopAPI is available and returns wallet balance and estimated images.
    """
    client = get_shopapi_client()
    if not client:
        return {"available": False, "message": "ShopAPI credentials not found in youtube-main"}
        
    try:
        bal = client.balance.retrieve()
        b_dict = bal.to_dict() if hasattr(bal, "to_dict") else bal
        return {
            "available": True,
            "wallet": b_dict.get("wallet", "0"),
            "estimated_images": b_dict.get("estimated", {}).get("images", 0)
        }
    except Exception as e:
        return {"available": False, "message": str(e)}

def generate_artwork_with_shopapi(prompt: str, seed: Optional[int] = None) -> Optional[Image.Image]:
    """
    Generates a 1:1 real AI artwork using ShopAPI.
    """
    client = get_shopapi_client()
    if not client:
        return None
        
    try:
        # Request 1:1 square master
        job = None
        try:
            job = client.images.create_and_wait(
                prompt=prompt,
                n=1,
                aspect_ratio="1:1",
                seed=seed,
                timeout=240.0
            )
        except Exception as wait_err:
            err_str = str(wait_err)
            import re
            job_match = re.search(r'(job_[a-zA-Z0-9]+)', err_str)
            if job_match:
                pending_id = job_match.group(1)
                print(f"[ShopAPI Artwork] Polling running job {pending_id} for completion...")
                for poll_attempt in range(24): # Poll up to 120 additional seconds
                    time.sleep(5.0)
                    try:
                        retrieved = client.jobs.retrieve(pending_id)
                        status = retrieved.get("status")
                        if status == "succeeded":
                            job = retrieved
                            print(f"[ShopAPI Artwork] Job {pending_id} completed successfully during polling!")
                            break
                        elif status in ["failed", "canceled"]:
                            print(f"[ShopAPI Artwork] Job {pending_id} finished with status: {status}")
                            break
                    except Exception as poll_err:
                        print(f"[ShopAPI Artwork] Polling error: {poll_err}")
            if not job:
                raise wait_err
        
        output_obj = job.get("output")
        image_url = None
        if isinstance(output_obj, dict):
            image_url = output_obj.get("url")
        elif hasattr(output_obj, "get"):
            image_url = output_obj.get("url")
        elif hasattr(output_obj, "to_dict"):
            image_url = output_obj.to_dict().get("url")
            
        if not image_url and "outputs" in job and job["outputs"]:
            first_out = job["outputs"][0]
            image_url = first_out.get("url") if isinstance(first_out, dict) else getattr(first_out, "url", None)
            
        if not image_url:
            print(f"No image URL returned from ShopAPI job: {job}")
            return None
            
        req = urllib.request.Request(image_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            img_data = resp.read()
            
        return Image.open(io.BytesIO(img_data)).convert("RGBA")
    except Exception as e:
        print(f"ShopAPI artwork generation error: {e}")
        return None

def generate_model_mockup_with_shopapi(
    model_prompt: str,
    reference_image_path: Optional[Any] = None,
    aspect_ratio: str = "3:4"
) -> Optional[Image.Image]:
    """
    Generates a photorealistic AI photo via ShopAPI using reference images.
    Supports reference_image_path as either a single file path (str) or a list/tuple of file paths.
    """
    client = get_shopapi_client()
    if not client:
        return None
        
    try:
        ref_urls = []
        paths_to_process = []
        if isinstance(reference_image_path, (list, tuple)):
            paths_to_process = [p for p in reference_image_path if p and os.path.exists(p)]
        elif reference_image_path and os.path.exists(str(reference_image_path)):
            paths_to_process = [str(reference_image_path)]

        for p_idx, r_path in enumerate(paths_to_process):
            try:
                upload_target = r_path
                file_size = os.path.getsize(r_path)
                if file_size > 8 * 1024 * 1024:
                    temp_ref = os.path.join(os.path.dirname(r_path), f"_temp_ref_upload_{p_idx}.png")
                    with Image.open(r_path) as rim:
                        rim.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
                        rim.save(temp_ref, format="PNG", optimize=True)
                    upload_target = temp_ref

                ref_url = client.uploads.upload_file(upload_target)
                if ref_url:
                    ref_urls.append(ref_url)
            except Exception as up_err:
                safe_err = str(up_err).encode('ascii', errors='replace').decode('ascii')
                print(f"Error uploading reference image {r_path}: {safe_err}")
                
        # Aspect ratio for fashion portrait: 3:4 or 1:1 or 9:16 or 4:3
        ar = aspect_ratio if aspect_ratio in ["1:1", "3:4", "9:16", "4:3", "16:9"] else "3:4"
        
        job = None
        try:
            job = client.images.create_and_wait(
                prompt=model_prompt,
                n=1,
                aspect_ratio=ar,
                reference_images=ref_urls if ref_urls else None,
                timeout=240.0
            )
        except Exception as wait_err:
            # Check if job is still running on server
            err_str = str(wait_err)
            import re
            job_match = re.search(r'(job_[a-zA-Z0-9]+)', err_str)
            if job_match:
                pending_id = job_match.group(1)
                print(f"[ShopAPI Model Mockup] Polling running job {pending_id} for completion...")
                for poll_attempt in range(24): # Poll up to 120 additional seconds
                    time.sleep(5.0)
                    try:
                        retrieved = client.jobs.retrieve(pending_id)
                        status = retrieved.get("status")
                        if status == "succeeded":
                            job = retrieved
                            print(f"[ShopAPI Model Mockup] Job {pending_id} completed successfully during polling!")
                            break
                        elif status in ["failed", "canceled"]:
                            print(f"[ShopAPI Model Mockup] Job {pending_id} finished with status: {status}")
                            break
                    except Exception as poll_err:
                        print(f"[ShopAPI Model Mockup] Polling error: {poll_err}")
            
            if not job:
                raise wait_err
        
        output_obj = job.get("output") if job else None
        image_url = None
        if isinstance(output_obj, dict):
            image_url = output_obj.get("url")
        elif hasattr(output_obj, "get"):
            image_url = output_obj.get("url")
        elif hasattr(output_obj, "to_dict"):
            image_url = output_obj.to_dict().get("url")
            
        if not image_url and job and "outputs" in job and job["outputs"]:
            first_out = job["outputs"][0]
            image_url = first_out.get("url") if isinstance(first_out, dict) else getattr(first_out, "url", None)

        if not image_url:
            print(f"No image URL returned from ShopAPI model job: {job}")
            return None
            
        req = urllib.request.Request(image_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            img_data = resp.read()
            
        return Image.open(io.BytesIO(img_data)).convert("RGBA")
    except Exception as e:
        safe_msg = str(e).encode('ascii', errors='replace').decode('ascii')
        print(f"ShopAPI model mockup generation error: {safe_msg}")
        return None

_SLOGAN_CACHE: Dict[str, List[str]] = {}

async def generate_slogans_with_shopapi(
    state_code: str,
    state_name: str,
    state_nickname: str,
    theme: str,
    niche: Optional[str] = None,
    audience: str = "All Veterans",
    variation: int = 0
) -> Optional[List[str]]:
    """
    Calls ShopAPI's real AI LLM endpoint (Claude Sonnet 5 via /v1/chat/completions)
    to generate 10-12 authentic, high-impact, deeply meaningful POD apparel slogans.
    Combines State Name + Main Theme + Specific Historical Niche + Audience Role.
    """
    client = get_shopapi_client()
    if not client or not getattr(client, "api_key", None):
        print("[ShopAPI Slogans] ShopAPI client or API key not available")
        return None

    norm_state = (state_code or "").strip().upper()
    norm_theme = (theme or "Veteran").strip()
    norm_niche = (niche or "").strip()
    if norm_niche.lower() in ["none", "all", "tat ca", "mac dinh"]:
        norm_niche = ""
    norm_aud = (audience or "All Veterans").strip().lower()
    cache_key = f"{norm_state}:{norm_theme.lower()}:{norm_niche.lower()}:{norm_aud}:{variation}"

    if cache_key in _SLOGAN_CACHE:
        return _SLOGAN_CACHE[cache_key]

    # Map audience to natural US copywriter role
    aud_role_map = {
        "military dad": "Military Dad / Father",
        "military grandpa": "Military Grandpa / Grandfather",
        "women": "Female Veteran / Mother / Daughter / Proud Sister",
        "men": "Male Veteran / Brother / Son",
        "military family": "Military Family & Proud Supporter",
        "military families & supporters": "Military Family & Proud Supporter",
        "all veterans": "American Veteran / Brother in Arms / Warrior"
    }
    aud_role = aud_role_map.get(norm_aud, "American Veteran / Family Member")

    # Thematic context for specific war & era niches
    niche_lower = norm_niche.lower()
    niche_context = ""
    if "vietnam era" in niche_lower or "thoi ky vn" in niche_lower:
        niche_context = "Honoring U.S. Vietnam Era Veterans (1955-1975) - Proudly Served During the Vietnam Era, Cold War Sentinel, Stateside & Overseas Duty, National Defense Medal, Timeless Respect & Honor."
    elif "vietnam" in niche_lower:
        niche_context = "Honoring U.S. Vietnam Veterans (1955-1975) - Vietnam Service Medal, Huey UH-1 helicopter, Jungle combat, Welcome Home Brother, All Gave Some Some Gave All, Unbroken Brotherhood, Sacrifices Never Forgotten."
    elif "desert storm" in niche_lower or "bao sa mac" in niche_lower or "persian gulf" in niche_lower:
        niche_context = "Honoring Operation Desert Storm Veterans (1991) - 100 Hours of Ground Combat Valor, Persian Gulf, Desert Shield, M1A1 Abrams, Scud Buster, Kuwait Liberation Star, Thunder in the Sand."
    elif "iraq" in niche_lower or "oif" in niche_lower:
        niche_context = "Honoring Operation Iraqi Freedom (OIF) Veterans - Desert Patrol, Stryker, Baghdad to Fallujah, Brothers in the Heat, Battle Tested, Unbroken Spirit, Never Forgotten."
    elif "afghanistan" in niche_lower or "oef" in niche_lower or "afghan" in niche_lower:
        niche_context = "Honoring Operation Enduring Freedom (OEF) Veterans - Hindu Kush Mountain Ridges, Kabul to Kandahar, Chinook flight, High-Altitude Valley Warriors, Defending the Ridgeline, Valor Unto Death."
    elif "korean" in niche_lower or "korea" in niche_lower or "trieu tien" in niche_lower or "chosin" in niche_lower:
        niche_context = "Honoring U.S. Korean War Veterans (1950-1953) - The Forgotten War Remembered, Chosin Reservoir Frozen Valor, 38th Parallel Boundary Defenders, Freedom Is Not Free, In Frost and Fire."
    elif "wwii" in niche_lower or "ww2" in niche_lower or "world war" in niche_lower or "the chien" in niche_lower:
        niche_context = "Honoring World War II Veterans (1941-1945) - The Greatest Generation, Normandy Beaches to the Pacific Islands, Defeating Axis Tyranny, Defending American Liberty for Generations."

    # Build prompt specifying how Theme and Niche combine
    if norm_niche:
        niche_instruction = (
            f"- Main Theme: {norm_theme}\n"
            f"- Specific War/Era Niche: {norm_niche} ({niche_context})\n"
            f"Combine the Main Theme ({norm_theme}) and the Specific Niche ({norm_niche}) naturally into the slogan."
        )
    else:
        niche_instruction = f"- Main Theme: {norm_theme}\nFocus on authentic pride, heritage, and values of {norm_theme}."

    prompt = (
        f"You are a master American apparel copywriter specializing in US military veteran POD merch.\n"
        f"Generate 10 authentic, powerful, punchy t-shirt slogans for direct-to-garment apparel printing.\n\n"
        f"Target details:\n"
        f"- Target US State: {state_name} ({state_nickname})\n"
        f"{niche_instruction}\n"
        f"- Target Audience / Role: {aud_role}\n"
        f"- Variation Index: {variation}\n\n"
        f"Strict Requirements:\n"
        f"1. ALL UPPERCASE only.\n"
        f"2. Structure: Every single slogan MUST incorporate:\n"
        f"   - The US State name or nickname (e.g., {state_name.upper()} or {state_nickname.upper()})\n"
        f"   - The customer role (e.g., {aud_role.split('/')[0].strip().upper()})\n"
        f"   - Deep, heartfelt, evocative meaning combining the Theme and the Niche (e.g. if Theme is Army and Niche is Desert Storm, combine Texas + Army + Desert Storm + Dad into: '{state_name.upper()} ARMY DAD · DESERT STORM VETERAN · 100 HOURS OF THUNDER').\n"
        f"3. Style: Separate 2 to 3 punchy phrases with ' · ' (middle dot).\n"
        f"4. Length: 4 to 12 words per slogan. Suitable for striking apparel typography.\n"
        f"5. 100% US English only. Zero foreign words, zero diacritics.\n"
        f"6. Output format: Return STRICTLY a valid JSON array of 10 strings: [\"SLOGAN 1\", \"SLOGAN 2\", ...]. Nothing else."
    )

    try:
        temp = 0.72 + (0.04 * (variation % 5))
        async with httpx.AsyncClient(timeout=25.0) as http_client:
            resp = await http_client.post(
                "https://api.shopapi.vn/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {client.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "claude-sonnet-5",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": temp
                }
            )

        if resp.status_code != 200:
            print(f"[ShopAPI Slogans] HTTP Error {resp.status_code}: {resp.text[:200]}")
            return None

        data = resp.json()
        choices = data.get("choices", [])
        if not choices:
            return None

        raw_content = choices[0].get("message", {}).get("content", "").strip()
        
        # Clean json code block markdown fences
        clean_json_str = re.sub(r'^```json\s*', '', raw_content, flags=re.IGNORECASE)
        clean_json_str = re.sub(r'^```\s*', '', clean_json_str)
        clean_json_str = re.sub(r'\s*```$', '', clean_json_str)
        clean_json_str = clean_json_str.strip()

        # Extract JSON array
        array_match = re.search(r'\[\s*".*"\s*\]', clean_json_str, re.DOTALL)
        if array_match:
            clean_json_str = array_match.group(0)

        slogans = json.loads(clean_json_str)
        if isinstance(slogans, list):
            results = []
            for s in slogans:
                if isinstance(s, str) and s.strip():
                    # Ensure uppercase and stripped
                    clean_s = s.strip().upper()
                    results.append(clean_s)
            if results:
                _SLOGAN_CACHE[cache_key] = results
                print(f"[ShopAPI Slogans] Successfully generated {len(results)} slogans for {state_name} - {theme} via Claude Sonnet 5")
                return results

    except Exception as e:
        print(f"[ShopAPI Slogans] Error calling ShopAPI chat completion: {e}")

    return None

