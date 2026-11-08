from PIL import Image
import numpy as np

im = Image.open('backend/templates/downloads/man_posing_tee.jpg')
w, h = im.size
print("Size:", w, h)

# Sample 9 regions across the image
grid_colors = []
for y_frac in [0.2, 0.4, 0.6, 0.8]:
    row = []
    for x_frac in [0.2, 0.5, 0.8]:
        px = im.getpixel((int(w * x_frac), int(h * y_frac)))
        row.append(px)
    grid_colors.append(row)

print("Grid colors (Y rows, X cols):")
for r in grid_colors:
    print(r)

