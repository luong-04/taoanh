import urllib.request
import os

OUT_DIR = "backend/templates/downloads"
os.makedirs(OUT_DIR, exist_ok=True)

files = [
    ("ironed_black_tee.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/d7/Ironed_black_T-shirt_%28001%29.JPG"),
    ("man_posing_tee.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/76/Man_in_t-shirt_posing_%28Unsplash%29.jpg"),
    ("man_sunglasses_tee.png", "https://upload.wikimedia.org/wikipedia/commons/9/95/T-shirt-mockup-of-a-man-with-sunglasses-against-a-blue-tiling-30449.png"),
    ("tshirt_mockup_clean.png", "https://upload.wikimedia.org/wikipedia/commons/3/3b/T-shirt_mockup.png"),
    ("ringflash_blank_tee.jpg", "https://upload.wikimedia.org/wikipedia/commons/9/9c/Ringflash_Tshirt_Blank_Template_%283214240974%29.jpg")
]

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

for fname, url in files:
    out_path = os.path.join(OUT_DIR, fname)
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            with open(out_path, "wb") as f:
                f.write(data)
            print(f"Downloaded {fname}: {len(data)} bytes")
    except Exception as e:
        print(f"Error {fname}: {e}")

