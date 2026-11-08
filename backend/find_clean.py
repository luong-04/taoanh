import re
import urllib.request
from PIL import Image
import io
import numpy as np

user_img = Image.open('C:/Users/ADMIN/.gemini/antigravity/brain/2456841a-d5ba-44ac-bd4f-a6e0f92c6176/.user_uploaded/media_1793671966634_573b69f6.png').convert('RGB')
user_face = np.array(user_img.crop((350, 300, 450, 450)))

with open('C:/Users/ADMIN/.gemini/antigravity/brain/b7526178-df35-4ea1-9d91-fe9585e5cd58/.system_generated/logs/transcript_full.jsonl', 'r', encoding='utf-8') as f:
    text = f.read()

matches = set(re.findall(r'https://cdn\.shopapi\.vn/shopapi/[^"\']+', text))
print('Found URL matches:', len(matches))

found_clean = None
for i, url in enumerate(matches):
    url = url.split('\\r')[0].split('\\n')[0].split('"')[0].split("'")[0].replace('\\u0026', '&').strip()
    if not ('.jpg' in url or '.png' in url):
        continue
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            im = Image.open(io.BytesIO(data)).convert('RGB')
            print(f'Match {i}: {im.size} - {url[:60]}...')
            if im.size[0] == 768:
                face = np.array(im.crop((350, 300, 450, 450)))
                d = np.mean(np.abs(face - user_face))
                print('  Face diff:', d)
                if d < 1.0:
                    print('  FOUND CLEAN ORIGINAL MODEL!')
                    im.save('backend/original_clean_woman_model.png')
                    found_clean = im
                    break
    except Exception as e:
        print('  Download error:', e)
