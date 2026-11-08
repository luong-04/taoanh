from PIL import Image
import numpy as np

im = Image.open('backend/templates/downloads/ironed_black_tee.jpg')
w, h = im.size
print("Size:", w, h)

for y_frac in [0.1, 0.3, 0.5, 0.7, 0.9]:
    row = []
    for x_frac in [0.2, 0.5, 0.8]:
        px = im.getpixel((int(w * x_frac), int(h * y_frac)))
        row.append(px)
    print(f"Y={y_frac:.1f}:", row)

