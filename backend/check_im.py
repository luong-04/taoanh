import os
from PIL import Image

OUT_DIR = "backend/templates/downloads"
for f in os.listdir(OUT_DIR):
    if f.endswith(".jpg"):
        p = os.path.join(OUT_DIR, f)
        im = Image.open(p)
        print(f, im.size)

