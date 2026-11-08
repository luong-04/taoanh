import os, sys
sys.path.insert(0, 'backend')
from app.services.shopapi_client import get_shopapi_client, generate_model_mockup_with_shopapi

client = get_shopapi_client()
ref_path = r'D:\TaoanhbangAI\output\artworks\art_4f42c4de1d_dtg_master.png'
prompt = (
    'Commercial front-facing fashion photoshoot of a beautiful Caucasian American woman (20-30 years old), '
    'facing camera directly, front view waist-up portrait, standing outdoors in scenic Tennessee Great Smoky Mountains at golden hour. '
    'Wearing a solid military green cotton crewneck t-shirt. On the center of the t-shirt chest is the graphic emblem from the reference image: '
    'a circular military crest featuring a female jet pilot in helmet, fighter aircraft, and text DEFENDING FREEDOM TEXAS AIR FORCE. '
    'The print is crisply embedded into the cloth fabric, authentic apparel catalog photoshoot, Canon EOS R5, photorealistic.'
)
print('Calling ShopAPI with reference image and full design description...')
img = generate_model_mockup_with_shopapi(prompt, reference_image_path=ref_path, aspect_ratio='3:4')
if img:
    out_path = r'C:\Users\ADMIN\.gemini\antigravity\brain\b7526178-df35-4ea1-9d91-fe9585e5cd58\test_flux_with_design.png'
    img.save(out_path)
    print('SUCCESS: Saved to', out_path)
else:
    print('Failed!')
