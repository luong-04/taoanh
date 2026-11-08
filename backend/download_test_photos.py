import urllib.request
import os
from PIL import Image

OUT_DIR = "backend/templates/downloads"
os.makedirs(OUT_DIR, exist_ok=True)

test_photos = [
    ("white_tee_flatlay", "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1600&auto=format&fit=crop&q=85"),
    ("black_tee_flatlay", "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1600&auto=format&fit=crop&q=85"),
    ("man_model_black", "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1600&auto=format&fit=crop&q=85"),
    ("man_portrait_brown", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1600&auto=format&fit=crop&q=85"),
    ("man_casual_outdoor", "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1600&auto=format&fit=crop&q=85"),
    ("woman_model_tee", "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=1600&auto=format&fit=crop&q=85"),
    ("man_street_porch", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1600&auto=format&fit=crop&q=85"),
    ("folded_black_tee", "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1600&auto=format&fit=crop&q=85")
]

HEADERS = {'User-Agent': 'Mozilla/5.0'}

for name, url in test_photos:
    target_path = os.path.join(OUT_DIR, f"{name}.jpg")
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as resp:
            with open(target_path, "wb") as f:
                f.write(resp.read())
        im = Image.open(target_path)
        print(f"{name}: saved {im.size}, mode={im.mode}")
    except Exception as e:
        print(f"{name}: error {e}")

