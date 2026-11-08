"""
Generates standard POD Garment Templates (Black, Navy Heather, Military Green, Sport Grey)
and Lifestyle Model Base Templates in backend/templates/.
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")
os.makedirs(TEMPLATES_DIR, exist_ok=True)

GARMENT_COLORS = {
    "Black": (24, 24, 27),
    "Navy Heather": (30, 41, 59),
    "Military Green": (61, 75, 60),
    "Sport Grey": (156, 163, 175)
}

def create_garment_blank(color_name: str, rgb: tuple, width: int = 2400, height: int = 3000):
    """
    Renders an authentic, commercial-grade flat-lay t-shirt with natural collar,
    shoulders, sleeves, hem, and realistic lighting folds.
    """
    canvas = Image.new("RGBA", (width, height), (245, 247, 250, 255))
    shirt_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shirt_layer)
    
    # Coordinates of realistic t-shirt outline
    center_x = width // 2
    collar_y = 480
    shoulder_w = 780
    sleeve_drop_x = 1050
    sleeve_drop_y = 950
    armpit_x = 650
    armpit_y = 1100
    waist_x = 620
    hem_x = 640
    hem_y = 2650
    
    # Polygon for torso and sleeves
    shirt_pts = [
        # Left neck
        (center_x - 220, collar_y + 40),
        # Left shoulder
        (center_x - shoulder_w, collar_y + 160),
        # Left sleeve outer
        (center_x - sleeve_drop_x, sleeve_drop_y),
        # Left sleeve cuff
        (center_x - sleeve_drop_x + 180, sleeve_drop_y + 120),
        # Left armpit
        (center_x - armpit_x, armpit_y),
        # Left waist
        (center_x - waist_x, 1800),
        # Left hem
        (center_x - hem_x, hem_y),
        # Hem center curve
        (center_x, hem_y + 40),
        # Right hem
        (center_x + hem_x, hem_y),
        # Right waist
        (center_x + waist_x, 1800),
        # Right armpit
        (center_x + armpit_x, armpit_y),
        # Right sleeve cuff
        (center_x + sleeve_drop_x - 180, sleeve_drop_y + 120),
        # Right sleeve outer
        (center_x + sleeve_drop_x, sleeve_drop_y),
        # Right shoulder
        (center_x + shoulder_w, collar_y + 160),
        # Right neck
        (center_x + 220, collar_y + 40),
        # Collar back curve
        (center_x, collar_y - 20)
    ]
    
    # Base shirt fill
    fill_rgba = (rgb[0], rgb[1], rgb[2], 255)
    draw.polygon(shirt_pts, fill=fill_rgba)
    
    # Collar ribbing
    collar_pts = [
        (center_x - 220, collar_y + 40),
        (center_x - 120, collar_y + 160),
        (center_x, collar_y + 190),
        (center_x + 120, collar_y + 160),
        (center_x + 220, collar_y + 40),
        (center_x + 180, collar_y + 20),
        (center_x, collar_y + 90),
        (center_x - 180, collar_y + 20),
    ]
    collar_color = tuple(max(0, c - 20) for c in rgb) + (255,)
    draw.polygon(collar_pts, fill=collar_color)
    
    # Inner neck opening (dark interior)
    inner_neck = [
        (center_x - 180, collar_y + 30),
        (center_x, collar_y + 90),
        (center_x + 180, collar_y + 30),
        (center_x, collar_y - 15)
    ]
    draw.polygon(inner_neck, fill=(20, 20, 22, 255))
    
    # Natural fabric soft shadow & highlights
    shadow_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    
    # Soft wrinkles along waist and armpits
    s_draw.arc([center_x - 550, 1150, center_x - 200, 1600], 30, 140, fill=(0, 0, 0, 60), width=18)
    s_draw.arc([center_x + 200, 1150, center_x + 550, 1600], 40, 150, fill=(0, 0, 0, 60), width=18)
    s_draw.arc([center_x - 400, 1650, center_x + 400, 2100], 190, 350, fill=(0, 0, 0, 45), width=24)
    
    # Highlights across chest and shoulders
    s_draw.arc([center_x - 500, collar_y + 180, center_x + 500, collar_y + 800], 200, 340, fill=(255, 255, 255, 35), width=35)
    
    # Blur shadows for realistic fabric softness
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(16))
    
    # Combine
    canvas.paste(shirt_layer, (0, 0), shirt_layer)
    canvas.paste(shadow_layer, (0, 0), shirt_layer)
    
    # Outer drop shadow for flat-lay depth
    drop_shadow = shirt_layer.split()[3].filter(ImageFilter.GaussianBlur(25))
    shadow_img = Image.new("RGBA", (width, height), (0, 0, 0, 70))
    final_canvas = Image.new("RGBA", (width, height), (245, 246, 248, 255))
    final_canvas.paste(shadow_img, (15, 30), drop_shadow)
    final_canvas.paste(canvas, (0, 0), shirt_layer)
    
    out_file = os.path.join(TEMPLATES_DIR, f"garment_{color_name.lower().replace(' ', '_')}.png")
    final_canvas.save(out_file, format="PNG")
    print(f"Created garment template: {out_file}")

def create_lifestyle_template(scene_name: str, bg_color_top: tuple, bg_color_bot: tuple, shirt_rgb: tuple):
    """
    Renders a lifestyle commercial model scene (4:5 aspect ratio: 2000x2500 px)
    featuring an athletic male/female torso wearing the shirt in authentic regional environments.
    """
    w, h = 2000, 2500
    scene = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    draw = ImageDraw.Draw(scene)
    
    # Vertical gradient background simulating lifestyle setting
    for y in range(h):
        factor = y / float(h)
        r = int(bg_color_top[0] * (1 - factor) + bg_color_bot[0] * factor)
        g = int(bg_color_top[1] * (1 - factor) + bg_color_bot[1] * factor)
        b = int(bg_color_top[2] * (1 - factor) + bg_color_bot[2] * factor)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
        
    # Add ambient lighting texture / bokeh
    bokeh_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(bokeh_layer)
    np.random.seed(42)
    for _ in range(35):
        bx = int(np.random.uniform(0, w))
        by = int(np.random.uniform(0, h * 0.6))
        br = int(np.random.uniform(40, 180))
        alpha = int(np.random.uniform(15, 45))
        b_draw.ellipse([bx - br, by - br, bx + br, by + br], fill=(255, 255, 240, alpha))
    bokeh_layer = bokeh_layer.filter(ImageFilter.GaussianBlur(30))
    scene.paste(bokeh_layer, (0, 0), bokeh_layer)
    
    # Model torso & arms
    cx = w // 2
    model_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    m_draw = ImageDraw.Draw(model_layer)
    
    # Skin tone (healthy warm sun-kissed tone)
    skin_tone = (225, 185, 160, 255)
    neck_pts = [(cx - 150, 400), (cx + 150, 400), (cx + 130, 800), (cx - 130, 800)]
    m_draw.polygon(neck_pts, fill=skin_tone)
    # Jawline silhouette hint
    m_draw.arc([cx - 160, 320, cx + 160, 500], 0, 180, fill=(190, 150, 125, 255), width=8)
    
    # Arms / Forearms (wearing tactical watch on left wrist)
    left_arm = [(cx - 550, 950), (cx - 720, 1600), (cx - 620, 1650), (cx - 460, 1100)]
    right_arm = [(cx + 550, 950), (cx + 720, 1600), (cx + 620, 1650), (cx + 460, 1100)]
    m_draw.polygon(left_arm, fill=skin_tone)
    m_draw.polygon(right_arm, fill=skin_tone)
    
    # Tactical watch on left wrist
    m_draw.rectangle([cx - 700, 1530, cx - 640, 1570], fill=(30, 30, 32, 255))
    
    # Shirt Polygon on model
    shirt_pts = [
        # Neck
        (cx - 150, 680),
        # Left shoulder
        (cx - 520, 800),
        # Left sleeve outer
        (cx - 680, 1150),
        # Left sleeve hem
        (cx - 540, 1220),
        # Left armpit
        (cx - 450, 1150),
        # Left torso
        (cx - 410, 2200),
        # Bottom hem
        (cx + 410, 2200),
        # Right torso
        (cx + 450, 1150),
        # Right sleeve hem
        (cx + 540, 1220),
        # Right sleeve outer
        (cx + 680, 1150),
        # Right shoulder
        (cx + 520, 800),
        # Right neck
        (cx + 150, 680),
        # Collar dip
        (cx, 750)
    ]
    shirt_color = (shirt_rgb[0], shirt_rgb[1], shirt_rgb[2], 255)
    m_draw.polygon(shirt_pts, fill=shirt_color)
    
    # Denim jeans hint at bottom
    m_draw.rectangle([cx - 400, 2180, cx + 400, h], fill=(42, 60, 85, 255))
    # Leather belt
    m_draw.rectangle([cx - 400, 2170, cx + 400, 2210], fill=(70, 45, 30, 255))
    m_draw.rectangle([cx - 40, 2165, cx + 40, 2215], outline=(200, 180, 110, 255), width=6)
    
    # Realistic shadows & natural fold shading
    folds = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    f_draw = ImageDraw.Draw(folds)
    f_draw.line([(cx - 300, 1200), (cx - 100, 1500)], fill=(0, 0, 0, 50), width=22)
    f_draw.line([(cx + 300, 1200), (cx + 100, 1500)], fill=(0, 0, 0, 50), width=22)
    f_draw.line([(cx - 200, 1600), (cx + 150, 1800)], fill=(0, 0, 0, 40), width=20)
    # Muscle definition chest highlights
    f_draw.ellipse([cx - 320, 920, cx - 80, 1180], fill=(255, 255, 255, 22))
    f_draw.ellipse([cx + 80, 920, cx + 320, 1180], fill=(255, 255, 255, 22))
    folds = folds.filter(ImageFilter.GaussianBlur(22))
    
    scene.paste(model_layer, (0, 0), model_layer)
    scene.paste(folds, (0, 0), model_layer)
    
    out_file = os.path.join(TEMPLATES_DIR, f"lifestyle_{scene_name}.png")
    scene.save(out_file, format="PNG")
    print(f"Created lifestyle template: {out_file}")

def main():
    print("Generating POD Garment and Lifestyle Templates...")
    for name, rgb in GARMENT_COLORS.items():
        create_garment_blank(name, rgb)
        
    # Lifestyle environments
    # 1. Texas Ranch (Warm Golden Sunset, Wooden Barn bokeh)
    create_lifestyle_template("texas_ranch", (180, 140, 90), (70, 50, 30), GARMENT_COLORS["Black"])
    create_lifestyle_template("midwest_porch", (90, 130, 160), (45, 65, 45), GARMENT_COLORS["Navy Heather"])
    create_lifestyle_template("rocky_mountain", (120, 160, 190), (50, 70, 60), GARMENT_COLORS["Military Green"])
    create_lifestyle_template("coastal_patriot", (140, 180, 210), (210, 195, 170), GARMENT_COLORS["Sport Grey"])
    print("All templates successfully generated!")

if __name__ == "__main__":
    main()

