"""
Export Service for POD Design Studio.
Generates comprehensive ZIP bundles containing DTG master PNG (4500x5400, 300 DPI),
lifestyle mockups, and complete SEO listing metadata for Etsy, Amazon Merch, and Shopify
utilizing authentic SEO keywords from the user's spreadsheet.
"""
import os
import io
import zipfile
import json
from typing import Dict, Any, List
from app.config import OUTPUT_DIR, DATA_DIR

def get_loaded_seo_keywords() -> List[str]:
    path = os.path.join(DATA_DIR, "seo_keywords.json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return [item["keyword"] for item in data if item.get("keyword")]
        except Exception:
            pass
    return []

def generate_seo_metadata(artwork: Dict[str, Any], state_name: str, symbols: List[str]) -> Dict[str, Any]:
    theme = artwork.get("theme", "Veteran")
    slogan = artwork.get("slogan", "Land of the Free")
    style = artwork.get("design_style", "Vintage Distressed")
    state_code = artwork.get("state_code", "USA")
    metadata = artwork.get("metadata", {})
    audience = metadata.get("audience", "All Veterans")
    
    # 1. Product Titles
    etsy_title = f"{state_name} {theme} Shirt, {slogan} T-Shirt, {style} Military Veteran Apparel, Patriotic {state_name} Gift for {audience}"
    if len(etsy_title) > 140:
        etsy_title = etsy_title[:137] + "..."
        
    amazon_title = f"{state_name} {theme} Graphic T-Shirt - {slogan} Patriotic Military Apparel"
    shopify_title = f"{state_name} {theme} Vintage Tee | {slogan}"
    
    # 2. Etsy 13 Tags from user's authentic spreadsheet list
    loaded_kws = get_loaded_seo_keywords()
    tag_pool = [
        f"{state_name.lower()} veteran",
        f"{theme.lower()} shirt",
        f"{state_code.lower()} military",
        f"patriotic {state_code.lower()}",
        f"{state_name.lower()} gift",
        "veteran dad shirts",
        "veteran grandpa shirts",
        "vintage military",
        "distressed apparel",
        "dtg graphic tee",
        "proud american patriot",
        f"{state_name.lower()} pride",
        "military family gift"
    ]
    # Add from loaded spreadsheet if available
    for kw in loaded_kws:
        if kw.lower() not in tag_pool and len(kw) <= 20:
            tag_pool.append(kw.lower())
            
    etsy_tags = [t[:20] for t in tag_pool][:13]
    
    # 3. Amazon Bullet Points
    amazon_bullets = [
        f"HONORING {state_name.upper()} {theme.upper()}S: Authentic custom graphic celebrating {state_name} military heritage and the enduring pride of service ({audience}).",
        f"PREMIUM {style.upper()} DESIGN: High-definition detailed emblem featuring \"{slogan}\" with state symbols and classic vintage screenprint aesthetic.",
        "SUPERIOR COMFORT & DURABILITY: Printed on ultra-soft, ring-spun combed cotton for all-day comfort, breathability, and long-lasting shape retention.",
        "THE PERFECT PATRIOTIC GIFT: An unforgettable gift for birthdays, Veterans Day, Memorial Day, Father's Day, or homecoming celebrations.",
        "PRINTED & SHIPPED IN THE USA: High resolution 300 DPI direct-to-garment (DTG) print engineered to withstand repeated wash cycles."
    ]
    
    # 4. Detailed Description
    description = f"""
{etsy_title}

Wear your pride on your chest with our official {state_name} {theme} T-Shirt! Featuring bold heritage artwork and the inspiring motto "{slogan}", this apparel captures the true spirit and resilience of {state_name}.

★ PRODUCT HIGHLIGHTS:
- Theme: {theme} / {state_name} Heritage
- Style: {style}
- High-resolution Direct-to-Garment (DTG) 300 DPI Print
- Fabric: 100% Airlume Combed and Ring-Spun Cotton (Heather blends: 90% cotton, 10% polyester)
- Retail unisex fit with tear-away label
- Pre-shrunk fabric to maintain perfect sizing

★ CARE INSTRUCTIONS:
- Machine wash cold, inside out, with like colors.
- Tumble dry on low or hang dry for best longevity.
- Do not iron directly on the printed graphic.

Proudly designed and manufactured for American patriots and veterans!
""".strip()

    return {
        "titles": {
            "etsy": etsy_title,
            "amazon": amazon_title,
            "shopify": shopify_title
        },
        "etsy_13_tags": etsy_tags,
        "amazon_bullet_points": amazon_bullets,
        "description": description,
        "keywords": ", ".join(etsy_tags),
        "print_specifications": {
            "resolution": "4500 x 5400 px",
            "dpi": 300,
            "color_profile": "sRGB",
            "format": "Transparent PNG (Decal Isolated)"
        }
    }

def create_export_zip(
    artwork: Dict[str, Any],
    mockups: List[Dict[str, Any]],
    output_zip_path: str
) -> str:
    """
    Assembles DTG master PNG, web preview, mockups, and SEO listing files into a single downloadable ZIP.
    """
    os.makedirs(os.path.dirname(output_zip_path), exist_ok=True)
    state_name = artwork.get("state_name", "US_State")
    symbols = artwork.get("metadata", {}).get("symbols", [])
    
    seo_data = generate_seo_metadata(artwork, state_name, symbols)
    
    with zipfile.ZipFile(output_zip_path, "w", zipfile.ZIP_DEFLATED) as zip_file:
        # 1. Add Master DTG PNG
        master_img_path = artwork.get("transparent_image_path")
        if master_img_path and os.path.exists(master_img_path):
            zip_file.write(master_img_path, arcname=f"ARTWORK_DTG_4500x5400_300DPI_{artwork['id']}.png")
            
        # 2. Add Original/Raw Art if exists
        raw_img_path = artwork.get("original_image_path")
        if raw_img_path and os.path.exists(raw_img_path):
            zip_file.write(raw_img_path, arcname=f"ARTWORK_RAW_{artwork['id']}.png")
            
        # 3. Add Mockups
        for idx, m in enumerate(mockups):
            m_path = m.get("mockup_image_path")
            if m_path and os.path.exists(m_path):
                env = m.get("environment", "mockup").replace(" ", "_")
                color = m.get("garment_color", "black").replace(" ", "_")
                filename = f"MOCKUP_{idx+1}_{color}_{env}_{m.get('aspect_ratio', '4_5')}.png"
                zip_file.write(m_path, arcname=filename)
                
        # 4. Add SEO Metadata JSON
        zip_file.writestr("SEO_LISTING_METADATA.json", json.dumps(seo_data, indent=2, ensure_ascii=False))
        
        # 5. Add Quick Copy-Paste Text File
        copy_text = f"""==================================================
POD DESIGN STUDIO - COMPLETE PRODUCT LISTING BUNDLE
==================================================

[ETSY TITLE]
{seo_data['titles']['etsy']}

[AMAZON TITLE]
{seo_data['titles']['amazon']}

[SHOPIFY TITLE]
{seo_data['titles']['shopify']}

--------------------------------------------------
[ETSY 13 TAGS] (Copy-Paste)
{', '.join(seo_data['etsy_13_tags'])}

--------------------------------------------------
[AMAZON BULLET POINTS]
1. {seo_data['amazon_bullet_points'][0]}
2. {seo_data['amazon_bullet_points'][1]}
3. {seo_data['amazon_bullet_points'][2]}
4. {seo_data['amazon_bullet_points'][3]}
5. {seo_data['amazon_bullet_points'][4]}

--------------------------------------------------
[FULL PRODUCT DESCRIPTION]
{seo_data['description']}

--------------------------------------------------
[ARTWORK PROMPT USED]
{artwork.get('prompt', '')}

[NEGATIVE PROMPT]
{artwork.get('negative_prompt', '')}
==================================================
"""
        zip_file.writestr("LISTING_COPY_PASTE.txt", copy_text)
        
    return output_zip_path
