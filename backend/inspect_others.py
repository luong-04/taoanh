from PIL import Image

for name in ['black_tee_flatlay.jpg', 'white_tee_flatlay.jpg', 'woman_model_tee.jpg', 'folded_black_tee.jpg']:
    p = f'backend/templates/downloads/{name}'
    im = Image.open(p)
    w, h = im.size
    print(f"=== {name} ({w}x{h}) ===")
    for y_frac in [0.2, 0.4, 0.6]:
        row = [im.getpixel((int(w * xf), int(h * y_frac))) for xf in [0.3, 0.5, 0.7]]
        print(f"Y={y_frac}:", row)

