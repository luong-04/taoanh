"""
Configuration and constants for POD Design Studio.
"""
import os
from pathlib import Path

# Paths
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

OUTPUT_DIR = PROJECT_ROOT / "output"
ARTWORKS_DIR = OUTPUT_DIR / "artworks"
MOCKUPS_DIR = OUTPUT_DIR / "mockups"
TEMPLATES_DIR = BACKEND_DIR / "templates"
DATA_DIR = APP_DIR / "data"
STATES_FILE = DATA_DIR / "us_states.json"

# Ensure directories exist
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
ARTWORKS_DIR.mkdir(parents=True, exist_ok=True)
MOCKUPS_DIR.mkdir(parents=True, exist_ok=True)
TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Product Colors
PRODUCT_COLORS = {
    "Black": {
        "hex": "#141416",
        "label": "Black",
        "description": "Premium Heavyweight Black Cotton"
    },
    "Navy Heather": {
        "hex": "#1e293b",
        "label": "Navy Heather",
        "description": "Vintage Deep Navy Heather Cotton/Poly Blend"
    },
    "Military Green": {
        "hex": "#3d4b3c",
        "label": "Military Green",
        "description": "Tactical OD Military Green Cotton"
    },
    "Sport Grey": {
        "hex": "#9ca3af",
        "label": "Sport Grey",
        "description": "Athletic 90/10 Sport Heather Grey"
    }
}

# POD Print Specifications
DTG_TARGET_WIDTH = 4500
DTG_TARGET_HEIGHT = 5400
DTG_TARGET_DPI = 300

# Themes
MILITARY_THEMES = [
    "Veteran",
    "Army",
    "Navy",
    "Air Force",
    "Marines",
    "Coast Guard",
    "Patriotic",
    "4th of July",
    "Military Dad/Grandpa"
]

# 7 Dedicated Historical War & Service Era Veteran Niches (Used under Slogan to combine with Theme)
VETERAN_NICHES = [
    "Vietnam Veteran",
    "Vietnam Era Veteran",
    "Desert Storm Veteran",
    "Iraq War Veteran",
    "Afghanistan Veteran",
    "Korean War Veteran",
    "WWII Veteran"
]

# Design Styles
DESIGN_STYLES = [
    "Vintage Distressed",
    "Bold Screen-Print",
    "Modern Minimalist",
    "Retro Tactical",
    "Typography Focus"
]

# Model Presets
MODEL_GENDERS = ["Male", "Female", "Couple"]
MODEL_AGE_BRACKETS = ["20-30", "30-45", "45-60+"]
MODEL_VIBES = ["Proud & Determined", "Rugged Outdoors", "Casual Heartland", "Athletic Veteran", "Warm & Approachable"]

# Supported External Providers
IMAGE_PROVIDERS = ["fal", "replicate", "gemini", "openai", "local_demo"]
MOCKUP_PROVIDERS = ["local_compositor", "fashn", "fal_vton", "replicate_inpaint"]

