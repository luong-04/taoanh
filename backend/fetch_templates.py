import urllib.request
import re
import os
import json
from PIL import Image

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def get_photo_ids(query):
    url = f"https://unsplash.com/s/photos/{query}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode('utf-8', errors='ignore')
            matches = re.findall(r'images\.unsplash\.com/photo-([0-9a-zA-Z_-]+)\?', html)
            unique = list(dict.fromkeys(matches))
            print(f"Query '{query}' yielded {len(unique)} photos: {unique[:5]}")
            return unique
    except Exception as e:
        print(f"Query '{query}' error: {e}")
        return []

mockup_ids = get_photo_ids("t-shirt-mockup")
black_tee_ids = get_photo_ids("black-t-shirt-mockup")
man_tee_ids = get_photo_ids("man-wearing-black-t-shirt")
outdoor_man_ids = get_photo_ids("man-t-shirt-outdoor")
woman_tee_ids = get_photo_ids("woman-wearing-t-shirt")

output_data = {
    "mockups": mockup_ids,
    "black_tees": black_tee_ids,
    "man_tees": man_tee_ids,
    "outdoor_man": outdoor_man_ids,
    "woman_tees": woman_tee_ids
}

with open("backend/unsplash_ids.json", "w", encoding="utf-8") as f:
    json.dump(output_data, f, indent=2)

print("Saved unsplash_ids.json successfully")

