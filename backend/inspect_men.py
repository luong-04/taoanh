from PIL import Image
import numpy as np

for name in ['man_casual_outdoor.jpg', 'man_street_porch.jpg', 'man_model_black.jpg', 'black_model_modern.jpg']:
    p = f'backend/templates/downloads/{name}'
    im = Image.open(p)
    w, h = im.size
    print(f"=== {name} ({w}x{h}) ===")
    # Print average RGB of upper 20% (sky/background), middle (face/chest), lower (torso/legs)
    arr = np.array(im)
    top = arr[:int(h*0.2), :, :3].mean(axis=(0,1)).astype(int)
    chest = arr[int(h*0.35):int(h*0.55), int(w*0.35):int(w*0.65), :3].mean(axis=(0,1)).astype(int)
    bottom = arr[int(h*0.7):, :, :3].mean(axis=(0,1)).astype(int)
    print(f"Top: {top}, Chest: {chest}, Bottom: {bottom}")

