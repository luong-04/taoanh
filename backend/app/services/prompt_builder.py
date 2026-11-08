"""
Prompt Builder Service for POD Design Studio.
Constructs State-Aware, Military & Veteran Niche Prompts with strict negative prompts,
generates 3-4 independent creative concepts with English slogans based on State + Theme + Audience,
and provides dynamic, AI-powered state-specific slogans (100% US English).
"""
import os
import json
import re
import unicodedata
from typing import Dict, Any, List, Optional
from app.config import STATES_FILE, DESIGN_STYLES, MILITARY_THEMES, DATA_DIR

_STATES_CACHE: Dict[str, Dict[str, Any]] = {}
_DESIGN_IDEAS_CACHE: List[Dict[str, Any]] = []
_SEO_KEYWORDS_CACHE: List[Dict[str, Any]] = []

def get_states_dict(force_reload: bool = False) -> Dict[str, Dict[str, Any]]:
    global _STATES_CACHE
    if not _STATES_CACHE or force_reload:
        _STATES_CACHE = {}
        try:
            with open(STATES_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    _STATES_CACHE[item["code"]] = item
        except Exception as e:
            print(f"Error loading states file: {e}")
    return _STATES_CACHE

def get_state_by_code(code: str) -> Optional[Dict[str, Any]]:
    states = get_states_dict()
    return states.get(code.upper())

def get_design_ideas() -> List[Dict[str, Any]]:
    global _DESIGN_IDEAS_CACHE
    if not _DESIGN_IDEAS_CACHE:
        ideas_path = os.path.join(DATA_DIR, "design_ideas.json")
        if os.path.exists(ideas_path):
            with open(ideas_path, "r", encoding="utf-8") as f:
                _DESIGN_IDEAS_CACHE = json.load(f)
    return _DESIGN_IDEAS_CACHE

def get_seo_keywords() -> List[Dict[str, Any]]:
    global _SEO_KEYWORDS_CACHE
    if not _SEO_KEYWORDS_CACHE:
        seo_path = os.path.join(DATA_DIR, "seo_keywords.json")
        if os.path.exists(seo_path):
            with open(seo_path, "r", encoding="utf-8") as f:
                _SEO_KEYWORDS_CACHE = json.load(f)
    return _SEO_KEYWORDS_CACHE

def remove_vietnamese_accents(text: str) -> str:
    """Strips Vietnamese diacritics to normalized ASCII."""
    if not text:
        return ""
    text = re.sub(r'[àáạảãâầấậẩẫăằắặẳẵ]', 'a', text)
    text = re.sub(r'[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]', 'A', text)
    text = re.sub(r'[èéẹẻẽêềếệểễ]', 'e', text)
    text = re.sub(r'[ÈÉẸẺẼÊỀẾỆỂỄ]', 'E', text)
    text = re.sub(r'[ìíịỉĩ]', 'i', text)
    text = re.sub(r'[ÌÍỊỈĨ]', 'I', text)
    text = re.sub(r'[òóọỏõôồốộổỗơờớợởỡ]', 'o', text)
    text = re.sub(r'[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]', 'O', text)
    text = re.sub(r'[ùúụủũưừứựửữ]', 'u', text)
    text = re.sub(r'[ÙÚỤỦŨƯỪỨỰỬỮ]', 'U', text)
    text = re.sub(r'[ỳýỵỷỹ]', 'y', text)
    text = re.sub(r'[ỲÝỴỶỸ]', 'Y', text)
    text = re.sub(r'[đ]', 'd', text)
    text = re.sub(r'[Đ]', 'D', text)
    return text

def clean_audience_en(raw_audience: Optional[str]) -> str:
    """
    Standardizes audience input into 100% natural, accent-free US English.
    Prevents any Vietnamese characters from leaking into AI prompts.
    """
    if not raw_audience:
        return "All Veterans"
    norm = remove_vietnamese_accents(raw_audience).lower().strip()
    
    if any(k in norm for k in ["nu", "women", "female", "lady", "girl"]):
        return "Women"
    if any(k in norm for k in ["nam", "men", "male", "guy"]):
        return "Men"
    if any(k in norm for k in ["dad", "bo", "cha", "father"]):
        return "Military Dad"
    if any(k in norm for k in ["grandpa", "ong", "grandfather"]):
        return "Military Grandpa"
    if any(k in norm for k in ["family", "gia dinh", "kids", "tre em"]):
        return "Military Families & Supporters"
    if any(k in norm for k in ["all", "tat ca", "everyone"]):
        return "All Veterans"
        
    clean = re.sub(r'[^a-zA-Z0-9\s]', '', remove_vietnamese_accents(raw_audience)).strip().title()
    return clean or "All Veterans"

def clean_theme_en(raw_theme: Optional[str]) -> str:
    """
    Translates Vietnamese theme keywords into clean US English concepts,
    specifically recognizing the 7 war/era veteran niches and military branches.
    """
    if not raw_theme:
        return "Veteran"
    norm = remove_vietnamese_accents(raw_theme).lower().strip()
    
    # 1. Check exact 7 historical veteran niches first
    if any(k in norm for k in ["vietnam era", "thoi ky viet nam", "thoi ky vn"]):
        return "Vietnam Era Veteran"
    if any(k in norm for k in ["vietnam", "viet nam", "vn veteran", "cuu binh vn"]):
        return "Vietnam Veteran"
    if any(k in norm for k in ["desert storm", "bao sa mac", "vung vinh", "persian gulf", "chien dich bao sa mac"]):
        return "Desert Storm Veteran"
    if any(k in norm for k in ["iraq", "iraqi freedom", "oif"]):
        return "Iraq War Veteran"
    if any(k in norm for k in ["afghanistan", "afghan", "enduring freedom", "oef"]):
        return "Afghanistan Veteran"
    if any(k in norm for k in ["korean war", "korea", "trieu tien", "chosin"]):
        return "Korean War Veteran"
    if any(k in norm for k in ["wwii", "ww2", "world war ii", "world war 2", "the chien 2", "the chien ii"]):
        return "WWII Veteran"

    theme_trans = {
        "tet": "Lunar New Year",
        "xuan": "Lunar New Year",
        "giang sinh": "Christmas",
        "noel": "Christmas",
        "cau ca": "Fishing",
        "co khi": "Mechanic",
        "tho may": "Mechanic",
        "tho sua xe": "Mechanic",
        "tho moc": "Woodworker",
        "y ta": "Nurse",
        "dieu duong": "Nurse",
        "canh sat": "Police",
        "cuu hoa": "Firefighter",
        "san ban": "Hunting",
        "quoc khanh": "4th of July",
        "yeu nuoc": "Patriotic",
        "khong quan": "Air Force",
        "hai quan": "Navy",
        "luc quan": "Army",
        "thuy quan luc chien": "Marines",
        "tuan duyen": "Coast Guard"
    }
    for vn, en in theme_trans.items():
        if vn in norm:
            return en
            
    clean = re.sub(r'[^a-zA-Z0-9\s]', '', remove_vietnamese_accents(raw_theme)).strip().title()
    return clean or "Veteran"

def resolve_theme_context(raw_theme: str, state_name: str) -> Dict[str, Any]:
    """
    Intelligently maps ANY user-inputted theme (Vietnamese or English) into rich
    English design context, symbols, and slogans. 100% US English.
    """
    clean = (raw_theme or "Veteran").strip()
    norm = remove_vietnamese_accents(clean).lower()
    
    # ── 7 HISTORICAL WAR & SERVICE ERA VETERAN NICHES ──
    # A. Vietnam Era Veteran
    if any(k in norm for k in ["vietnam era", "thoi ky vn", "thoi ky viet nam"]):
        return {
            "canonical_english": "U.S. Vietnam Era Veteran Heritage",
            "theme_name_en": "Vietnam Era Veteran",
            "motto": "Proudly Served During the Vietnam Era · Honor & Respect",
            "symbols": [
                "Vietnam Era service medal crest",
                "National Defense Service ribbon",
                "military base eagle shield",
                "distressed American flag backdrop",
                "vintage crossed rifles and stars",
                "veteran era scroll banner"
            ],
            "adjectives": ["era of service", "homefront and abroad", "unwavering duty", "honorable service"],
            "palette": "Service Khaki Tan, Deep Navy Blue, Antique Gold, Tactical Olive",
            "slogans": [
                f"{state_name.upper()} VIETNAM ERA VETERAN · PROUDLY SERVED",
                f"DUTY, HONOR & RESPECT · {state_name.upper()} VIETNAM ERA VET",
                f"STAND FOR THE FLAG · PROUD {state_name.upper()} VIETNAM ERA PATRIOT",
                f"HOMEFRONT & OVERSEAS · {state_name.upper()} VIETNAM ERA DEFENDER",
                f"{state_name.upper()} ROOTS · TIMELESS SERVICE DURING THE VIETNAM ERA"
            ]
        }

    # B. Vietnam Veteran
    if any(k in norm for k in ["vietnam", "viet nam", "vn veteran", "cuu binh vn"]):
        return {
            "canonical_english": "U.S. Vietnam War Combat Veteran",
            "theme_name_en": "Vietnam Veteran",
            "motto": "All Gave Some, Some Gave All · Welcome Home Brother",
            "symbols": [
                "Huey UH-1 Iroquois helicopter silhouette",
                "Vietnam Service Medal ribbon bar",
                "jungle combat boots",
                "tiger stripe camouflage banner",
                "fallen soldier battlefield cross",
                "weathered American shield"
            ],
            "adjectives": ["welcome home valor", "jungle patrol grit", "unbroken brotherhood", "timeless sacrifice"],
            "palette": "Jungle OD Green, Service Ribbon Yellow, Crimson Stripe, Weathered Khaki",
            "slogans": [
                f"{state_name.upper()} BUILT · VIETNAM VETERAN PROUD · WELCOME HOME",
                f"ALL GAVE SOME, SOME GAVE ALL · {state_name.upper()} VIETNAM VET",
                f"{state_name.upper()} BROTHERHOOD · VIETNAM VETERAN · HONOR NEVER FADES",
                f"FORGED IN THE JUNGLE · PROUD {state_name.upper()} VIETNAM VETERAN",
                f"LONE TIGER IN THE ASHES · {state_name.upper()} VIETNAM WAR HERO"
            ]
        }

    # C. Desert Storm Veteran
    if any(k in norm for k in ["desert storm", "bao sa mac", "vung vinh", "persian gulf", "chien dich bao sa mac"]):
        return {
            "canonical_english": "Operation Desert Storm Ground Combat Hero",
            "theme_name_en": "Desert Storm Veteran",
            "motto": "100 Hours of Valor · Desert Shield & Desert Storm",
            "symbols": [
                "Desert Storm campaign ribbon bar",
                "M1A1 Abrams tank in desert sands",
                "F-15 Strike Eagle combat silhouette",
                "chocolate chip desert camo shield",
                "Kuwait liberation victory star",
                "crossed combat scuds and lightning bolts"
            ],
            "adjectives": ["100 hours of valor", "desert storm warrior", "thunder in the sand", "persian gulf courage"],
            "palette": "Desert Chocolate Chip Tan, Khaki Dune, Camo Brown, Burnished Gold",
            "slogans": [
                f"{state_name.upper()} DESERT STORM VETERAN · 100 HOURS OF VALOR",
                f"THUNDER IN THE SANDS · PROUD {state_name.upper()} DESERT STORM VET",
                f"OPERATION DESERT STORM · FORGED IN THE HEAT · {state_name.upper()} PRIDE",
                f"LIBERATION & COURAGE · PROUD {state_name.upper()} GULF WAR VETERAN",
                f"DEFENDING THE SULTANATE · {state_name.upper()} DESERT STORM HERO"
            ]
        }

    # D. Iraq War Veteran
    if any(k in norm for k in ["iraq", "iraqi freedom", "oif"]):
        return {
            "canonical_english": "Operation Iraqi Freedom Combat Veteran",
            "theme_name_en": "Iraq War Veteran",
            "motto": "Operation Iraqi Freedom · Courage Under Fire",
            "symbols": [
                "Iraq Campaign Medal ribbon",
                "Stryker combat vehicle silhouette",
                "up-armored Humvee turret",
                "desert digital camo crest",
                "battlefield cross with dog tags",
                "urban patrol silhouette"
            ],
            "adjectives": ["OIF combat veteran", "urban patrol grit", "forged in desert heat", "unbroken brotherhood"],
            "palette": "Desert Sand Tan, Gunmetal Charcoal, Blood Crimson, Tactical Olive",
            "slogans": [
                f"{state_name.upper()} IRAQ WAR VETERAN · OPERATION IRAQI FREEDOM",
                f"BATTLE TESTED & TRUE · PROUD {state_name.upper()} IRAQ VET",
                f"BROTHERS THROUGH THE FIRE · {state_name.upper()} IRAQ WAR VETERAN",
                f"DEFENDING FREEDOM · PROUD {state_name.upper()} OIF WARRIOR",
                f"FROM BAGHDAD TO {state_name.upper()} · UNBROKEN COURAGE"
            ]
        }

    # E. Afghanistan Veteran
    if any(k in norm for k in ["afghanistan", "afghan", "enduring freedom", "oef"]):
        return {
            "canonical_english": "Operation Enduring Freedom High-Valley Veteran",
            "theme_name_en": "Afghanistan Veteran",
            "motto": "Operation Enduring Freedom · Guardians of the Ridgeline",
            "symbols": [
                "Afghanistan Campaign Medal ribbon",
                "CH-47 Chinook helicopter in mountain pass",
                "Hindu Kush mountain ridge silhouette",
                "tactical sniper crest",
                "crossed combat rifles and dog tags",
                "alpine sentinel pine wreath"
            ],
            "adjectives": ["mountain sentinel", "high-altitude endurance", "enduring freedom", "resolute vigil"],
            "palette": "Mountain Granite Grey, Tactical Coyote Tan, Alpine Pine, Bone White",
            "slogans": [
                f"{state_name.upper()} AFGHANISTAN VETERAN · ENDURING FREEDOM",
                f"GUARDIANS OF THE RIDGELINE · PROUD {state_name.upper()} OEF VET",
                f"RUGGED & UNBROKEN · {state_name.upper()} AFGHANISTAN VETERAN",
                f"VALOR IN THE HIGH PASSES · PROUD {state_name.upper()} OEF WARRIOR",
                f"FROM THE HINDU KUSH TO {state_name.upper()} · FREEDOM ENDURES"
            ]
        }

    # F. Korean War Veteran
    if any(k in norm for k in ["korean war", "korea", "trieu tien", "chosin"]):
        return {
            "canonical_english": "U.S. Korean War Veteran Hero",
            "theme_name_en": "Korean War Veteran",
            "motto": "Freedom Is Not Free · The Forgotten War Remembered",
            "symbols": [
                "Korean Service Medal ribbon",
                "F-86 Sabre jet swept wing",
                "Chosin Reservoir frosted star",
                "38th Parallel boundary crest",
                "vintage frozen ridge terrain contour",
                "winter frost combat helmet"
            ],
            "adjectives": ["the forgotten war remembered", "chosin reservoir valor", "frozen ridge courage", "freedom is not free"],
            "palette": "Ice Frost White, Steel Grey, Cobalt Blue, Crimson Ribbon",
            "slogans": [
                f"{state_name.upper()} KOREAN WAR VETERAN · FREEDOM IS NOT FREE",
                f"THE FORGOTTEN WAR REMEMBERED · PROUD {state_name.upper()} KOREAN VET",
                f"CHOSIN RESERVOIR VALOR · {state_name.upper()} KOREAN WAR VETERAN",
                f"DEFENDING FREEDOM 1950-1953 · PROUD {state_name.upper()} KOREAN VET",
                f"FROZEN CHOSIN SURVIVOR · {state_name.upper()} TIMELESS HERO"
            ]
        }

    # G. WWII Veteran
    if any(k in norm for k in ["wwii", "ww2", "world war ii", "world war 2", "the chien 2", "the chien ii"]):
        return {
            "canonical_english": "World War II Greatest Generation Veteran",
            "theme_name_en": "WWII Veteran",
            "motto": "The Greatest Generation · Defending Freedom Across the Globe",
            "symbols": [
                "WWII Victory Medal ribbon",
                "B-17 Flying Fortress bomber silhouette",
                "M4 Sherman tank emblem",
                "Normandy invasion star",
                "1941-1945 crossed rifles",
                "vintage liberty eagle crest"
            ],
            "adjectives": ["the greatest generation", "liberty defender", "normandy to the pacific", "timeless valor"],
            "palette": "Vintage Khaki Tan, Military Drab, Aged Parchment Cream, Victory Gold",
            "slogans": [
                f"{state_name.upper()} WWII VETERAN · THE GREATEST GENERATION",
                f"DEFEATED TYRANNY 1941-1945 · PROUD {state_name.upper()} WWII HERO",
                f"FROM NORMANDY TO THE PACIFIC · {state_name.upper()} WWII VETERAN",
                f"DEFENDER OF LIBERTY · PROUD {state_name.upper()} WORLD WAR II VET",
                f"{state_name.upper()} GREATEST GENERATION · VICTORY THROUGH VALOR"
            ]
        }

    # 1. Lunar New Year
    if any(k in norm for k in ["tet", "xuan", "lunar new year", "nguyen dan", "nam moi"]):
        return {
            "canonical_english": "Lunar New Year Spring Festival",
            "theme_name_en": "Lunar New Year",
            "motto": "Prosperity, Health & Cultural Heritage",
            "symbols": [
                "golden apricot blossom branches",
                "flowering peach blossom buds",
                "traditional oriental lion dance mask",
                "ornate golden imperial dragon crest",
                "lucky celebration red envelope banner",
                "vintage oriental scroll border"
            ],
            "adjectives": ["festive celebration", "spring prosperity", "cultural heritage", "auspicious blessings"],
            "palette": "Festive Crimson Red, Imperial Gold, Jade Green, Off-white",
            "slogans": [
                f"{state_name.upper()} TET FESTIVAL · PROUD HERITAGE & PROSPERITY",
                f"CELEBRATE LUNAR NEW YEAR IN {state_name.upper()} · GOOD FORTUNE",
                f"{state_name.upper()} ROOTS · PROUD CULTURAL HERITAGE",
                f"BLESSINGS & PROSPERITY · SPRING CELEBRATION",
                f"HAPPY NEW YEAR · {state_name.upper()} PRIDE"
            ]
        }

    # 2. Christmas
    if any(k in norm for k in ["giang sinh", "noel", "christmas", "xmas"]):
        return {
            "canonical_english": "Christmas Holiday Cheer",
            "theme_name_en": "Christmas",
            "motto": "Peace on Earth & Good Will",
            "symbols": ["vintage pine tree", "festive ribbon banner", "distressed snowflakes", "rustic cabin", "holiday wreath"],
            "adjectives": ["holiday cheer", "warm winter", "festive celebration"],
            "palette": "Holiday Crimson, Forest Pine Green, Snowy White, Warm Gold",
            "slogans": [
                f"MERRY CHRISTMAS FROM {state_name.upper()}",
                f"{state_name.upper()} CHRISTMAS · HOME FOR THE HOLIDAYS",
                f"PEACE, LOVE & {state_name.upper()} CHRISTMAS",
                f"HOLIDAY CHEER · PROUD {state_name.upper()} TRADITION"
            ]
        }

    # 3. Halloween
    if any(k in norm for k in ["halloween", "ma quy", "bi ngo", "spooky"]):
        return {
            "canonical_english": "Halloween Spooky Vintage",
            "theme_name_en": "Halloween",
            "motto": "Spooky Nights & Autumn Spirit",
            "symbols": ["carved jack-o'-lantern pumpkin", "flying bat silhouettes", "vintage spooky banner", "gnarled oak tree"],
            "adjectives": ["autumn harvest", "vintage spooky", "mystic glow"],
            "palette": "Pumpkin Orange, Charcoal Black, Pale Bone White, Toxic Green",
            "slogans": [
                f"SPOOKY IN {state_name.upper()} · HALLOWEEN NIGHTS",
                f"TRICK OR TREAT · {state_name.upper()} FALL SPIRIT",
                f"SOMETHING WICKED IN {state_name.upper()}"
            ]
        }

    # 4. Fishing
    if any(k in norm for k in ["cau ca", "fishing", "ngu dan", "angler", "bass"]):
        return {
            "canonical_english": "Freshwater Angler & Lake Fishing",
            "theme_name_en": "Fishing & Outdoors",
            "motto": "Born to Fish, Forced to Work",
            "symbols": ["largemouth bass jumping", "vintage fishing lure", "crossed fishing rods", "distressed lake outline"],
            "adjectives": ["backwater angler", "lake life", "wild outdoors"],
            "palette": "River Teal, Pine Green, Weathered Tan, Sunburst Gold",
            "slogans": [
                f"{state_name.upper()} ANGLER · BORN TO FISH",
                f"HOOKED ON FREEDOM · {state_name.upper()} WATERS",
                f"CASTING LINES IN {state_name.upper()} LAKE COUNTRY",
                f"BORN TO SERVE · BORN TO FISH"
            ]
        }

    # 5. Mechanic
    if any(k in norm for k in ["co khi", "tho may", "tho sua xe", "mechanic", "garage", "dong co"]):
        return {
            "canonical_english": "Automotive Mechanic & Garage Master",
            "theme_name_en": "Mechanic & Garage",
            "motto": "Built with Pride, Fixed with Grit",
            "symbols": ["crossed socket wrenches", "piston skull emblem", "vintage spark plugs", "industrial garage signage"],
            "adjectives": ["horsepower craftsman", "grease and grit", "garage warrior"],
            "palette": "Industrial Steel Grey, Engine Red, Cast Iron Black, Oil Gold",
            "slogans": [
                f"{state_name.upper()} BUILT · HORSEPOWER & PRIDE",
                f"GARAGE MASTER · PROUD {state_name.upper()} CRAFTSMAN",
                f"BUILT ON {state_name.upper()} GRIT · TOUGH AS STEEL",
                f"MEASURE TWICE, FIX IT RIGHT · {state_name.upper()} GARAGE"
            ]
        }

    # 6. Woodworker
    if any(k in norm for k in ["tho moc", "woodworker", "carpenter", "lam moc"]):
        return {
            "canonical_english": "Handcrafted Woodworking & Carpentry",
            "theme_name_en": "Woodworker",
            "motto": "Measure Twice, Cut Once",
            "symbols": ["crossed vintage hand saws", "carpenter hammer and chisel", "wood grain texture", "timber oak tree"],
            "adjectives": ["handcrafted legacy", "sawdust and soul", "master artisan"],
            "palette": "Warm Cedar, Rustic Walnut, Bone White, Vintage Denim",
            "slogans": [
                f"{state_name.upper()} WOODWORKER · CRAFTED WITH PRIDE",
                f"SAWDUST & SOUL · {state_name.upper()} CARPENTRY",
                f"HANDMADE IN {state_name.upper()} · BUILT TO LAST"
            ]
        }

    # 7. Nurse
    if any(k in norm for k in ["y ta", "dieu duong", "nurse", "bac si", "medical", "y te"]):
        return {
            "canonical_english": "Healthcare Hero & Nursing Pride",
            "theme_name_en": "Healthcare Nurse",
            "motto": "Compassion, Courage & Care",
            "symbols": ["stethoscope heart emblem", "nurse caduceus wings", "heartbeat lifeline pulse", "medical cross crest"],
            "adjectives": ["lifesaving hero", "frontline caregiver", "nursing dedication"],
            "palette": "Medical Teal, Clean White, Vibrant Crimson, Soft Navy",
            "slogans": [
                f"{state_name.upper()} NURSE · HEART OF HEALTHCARE",
                f"COMPASSION & COURAGE · PROUD {state_name.upper()} CAREGIVER",
                f"HEALING HANDS OF {state_name.upper()}",
                f"FRONTLINE HERO · {state_name.upper()} NURSING PRIDE"
            ]
        }

    # 8. Trucker
    if any(k in norm for k in ["tai xe", "lai xe", "trucker", "truck", "xe tai"]):
        return {
            "canonical_english": "Big Rig Trucking & Highway Legend",
            "theme_name_en": "Trucker",
            "motto": "King of the Interstate Highway",
            "symbols": ["vintage semi-truck", "highway 66 road shield", "diesel twin smokestacks", "steering wheel crest"],
            "adjectives": ["interstate hauler", "diesel horsepower", "highway legend"],
            "palette": "Chrome Silver, Midnight Navy, Highway Amber, Distressed White",
            "slogans": [
                f"{state_name.upper()} TRUCKER · MILES OF FREEDOM",
                f"KEEP ON TRUCKIN' · {state_name.upper()} HIGHWAY KING",
                f"DIESEL POWERED · {state_name.upper()} PROUD"
            ]
        }

    # 9. Predefined Military Niches
    military_map = {
        "army": {
            "canonical_english": "U.S. Army Defender",
            "theme_name_en": "Army",
            "motto": "This We'll Defend",
            "symbols": ["crossed muskets", "armored combat vehicle", "M1A2 Abrams", "military star emblem", "olive drab crest"],
            "adjectives": ["battle-tested", "ground force", "resolute", "honor-bound"],
            "palette": "Tactical Olive Drab, Bone White, Gunmetal Charcoal, Gold"
        },
        "navy": {
            "canonical_english": "U.S. Navy Maritime Warrior",
            "theme_name_en": "Navy",
            "motto": "Semper Fortis (Always Strong)",
            "symbols": ["fouled anchor", "naval tridents", "aircraft carrier silhouette", "eagle and anchor shield", "compass rose"],
            "adjectives": ["maritime guardian", "silent service", "blue-water warrior"],
            "palette": "Deep Navy Blue, Ocean Gold, Crisp White, Gunmetal"
        },
        "air force": {
            "canonical_english": "U.S. Air Force Dominance",
            "theme_name_en": "Air Force",
            "motto": "Fly, Fight, Win",
            "symbols": ["supersonic fighter jet", "Hap Arnold wings emblem", "radar crosshair", "afterburner thrust", "silver eagle wings"],
            "adjectives": ["aerial superiority", "sky dominator", "precision"],
            "palette": "Air Force Blue, Sterling Silver, Steel Grey, White"
        },
        "marines": {
            "canonical_english": "U.S. Marines Leatherneck",
            "theme_name_en": "Marines",
            "motto": "Semper Fidelis (Always Faithful)",
            "symbols": ["Eagle Globe and Anchor (EGA)", "combat bulldog", "scarlet and gold banner", "dress blues chevron", "Ka-Bar blade"],
            "adjectives": ["leatherneck", "crucible-forged", "fierce", "unbreakable"],
            "palette": "Scarlet Red, Marine Gold, Midnight Blue, Distressed White"
        },
        "coast guard": {
            "canonical_english": "U.S. Coast Guard Rescuer",
            "theme_name_en": "Coast Guard",
            "motto": "Semper Paratus (Always Ready)",
            "symbols": ["crossed anchors", "racing stripe emblem", "heavy surf rescue boat", "nautical compass"],
            "adjectives": ["coastal sentinel", "heavy seas rescuer", "vigilant"],
            "palette": "Coast Guard Blue, Rescue Orange, Pure White, Silver"
        },
        "police": {
            "canonical_english": "Law Enforcement & Police",
            "theme_name_en": "Police",
            "motto": "To Protect and to Serve",
            "symbols": ["Thin Blue Line flag", "police shield badge", "guardian angel wings", "silver star crest"],
            "adjectives": ["thin blue line courage", "community protector", "unshakable duty"],
            "palette": "Thin Blue Line Cobalt, Matte Black, Police Silver, White"
        },
        "firefighter": {
            "canonical_english": "Firefighter & Thin Red Line",
            "theme_name_en": "Firefighter",
            "motto": "First In, Last Out",
            "symbols": ["Maltese cross emblem", "crossed fire axes", "Thin Red Line flag", "firefighter helmet shield", "raging flames"],
            "adjectives": ["bravery in heat", "rescue brother", "selfless protector"],
            "palette": "Fire Engine Red, Charcoal Black, High-vis Yellow, Off-white"
        },
        "hunting": {
            "canonical_english": "Hunting & Wild Outdoors",
            "theme_name_en": "Hunting",
            "motto": "Born to Roam, Master of the Wild",
            "symbols": ["whitetail deer antler rack", "crossed bolt-action rifles", "mountain pine silhouette", "camo tactical crest"],
            "adjectives": ["backwoods outdoorsman", "timber marksman", "rugged tracker"],
            "palette": "Forest Hunter Camo, Antler Bone, Dark Bark Brown, Brass"
        },
        "4th of july": {
            "canonical_english": "4th of July Independence",
            "theme_name_en": "4th of July",
            "motto": "Celebrate Freedom & Independence",
            "symbols": ["vintage starburst fireworks", "1776 typography", "revolutionary drum and musket", "bald eagle banner"],
            "adjectives": ["jubilant freedom", "historic independence", "summer fireworks"],
            "palette": "Patriotic Red, Vintage White, Liberty Navy, Sparkler Gold"
        },
        "military dad": {
            "canonical_english": "Veteran Dad Heritage",
            "theme_name_en": "Military Dad",
            "motto": "Some Heroes Wear Dog Tags",
            "symbols": ["veteran dad vintage crest", "crossed wrenches and rifle", "American flag shield", "distressed banner ribbon"],
            "adjectives": ["protective patriarch", "legacy of service", "tested and true"],
            "palette": "Muted Navy, Vintage Cream, Deep Crimson, Antique Gold"
        }
    }
    
    for key, spec in military_map.items():
        if key in norm:
            spec_copy = dict(spec)
            spec_copy["slogans"] = [
                f"{state_name.upper()} BUILT · {spec['theme_name_en'].upper()} PROUD",
                f"DON'T MESS WITH {state_name.upper()} {spec['theme_name_en'].upper()}S",
                f"DEFENDING FREEDOM · PROUD {state_name.upper()} {spec['theme_name_en'].upper()}",
                f"GOD, COUNTRY & {state_name.upper()} {spec['theme_name_en'].upper()}"
            ]
            return spec_copy

    # 10. General / Custom Fallback (Cleaned into English)
    clean_en_words = re.sub(r'[^a-zA-Z0-9\s]', '', remove_vietnamese_accents(clean)).title()
    if not clean_en_words:
        clean_en_words = "American Patriot"
        
    return {
        "canonical_english": f"{clean_en_words} Heritage",
        "theme_name_en": clean_en_words,
        "motto": f"Honor, Pride & Dedication to {clean_en_words}",
        "symbols": [
            f"{clean_en_words} emblem",
            "weathered American shield",
            "heritage stars",
            "distressed ribbon banner",
            "vintage state outline"
        ],
        "adjectives": ["authentic pride", "timeless heritage", "distressed vintage", "bold American spirit"],
        "palette": "Vintage Cream, Deep Crimson, Muted Navy, Antique Gold",
        "slogans": [
            f"{state_name.upper()} BUILT · {clean_en_words.upper()} PROUD",
            f"FAITH, FAMILY & {clean_en_words.upper()} · {state_name.upper()} PRIDE",
            f"PROUD {state_name.upper()} {clean_en_words.upper()} · ESTABLISHED & TRUE",
            f"BORN IN {state_name.upper()} · {clean_en_words.upper()} FOR LIFE"
        ]
    }

BRANCH_SPECIFICS = {}

STYLE_PROMPT_MODIFIERS = {
    "Vintage Distressed": (
        "vintage distressed vector t-shirt graphic, authentic cracked screenprint texture, "
        "weathered heritage patina, retro 1970s military aesthetic, bold hand-drawn linework, "
        "muted vintage color palette with warm off-white and deep tones, isolated on pure white background, no gradients"
    ),
    "Bold Screen-Print": (
        "bold screen-print vector illustration for apparel, vibrant silkscreen ink aesthetic, "
        "sharp high-contrast contours, clean 4-color limited print palette, powerful graphic iconography, "
        "classic heavy-ink poster style, isolated on pure white background"
    ),
    "Modern Minimalist": (
        "clean minimalist modern apparel graphic, sophisticated geometric vector lines, "
        "sleek tactical insignia, subtle understated military elements, contemporary monochrome typography, "
        "sharp precision edges, isolated on pure white background"
    ),
    "Retro Tactical": (
        "retro tactical military morale patch design, 1980s combat division emblem, "
        "rugged embroidered border aesthetic, stenciled military typography, distressed combat patina, "
        "authentic service badge details, isolated on pure white background"
    ),
    "Typography Focus": (
        "bold hand-lettered custom typography t-shirt design, dynamic typographic hierarchy, "
        "distressed collegiate and stencil lettering, patriotic ribbon banners wrapping text, "
        "vintage American signage aesthetic, strong silhouette, isolated on pure white background"
    )
}

LAYOUT_PROMPT_MODIFIERS = {
    "open_silhouette": (
        "open silhouette layout, dynamic organic vector composition without any enclosing border, "
        "no circular frame, no round coin background, floating apparel graphic with natural expanding contours, "
        "arched balanced vintage typography wrapping around central artwork"
    ),
    "tactical_shield": (
        "tactical heraldic shield crest layout, pointed military armor shield silhouette, "
        "bold angular border contour, protective division insignia shape, sharp corners with ribbon banners wrapping the shield"
    ),
    "arched_chest": (
        "wide horizontal chest graphic layout, collegiate arched lettering stretching across upper chest, "
        "stacked balanced composition, central emblem flanked by stars, no enclosing circular frame"
    ),
    "circular_badge": (
        "circular emblem badge layout, authentic round seal aesthetic, concentric circular borders with perimeter typography, "
        "classic vintage military medallion silhouette"
    ),
    "diamond_polygon": (
        "angular diamond geometric patch layout, sharp rhombus polygon insignia, clean modern tactical silhouette, "
        "crisp angled border contours"
    ),
    "hexagon_patch": (
        "tactical hexagon combat patch layout, 6-sided geometric honeycomb insignia border, "
        "modern high-tech military division crest silhouette"
    ),
    "vintage_oval": (
        "vintage oval crest layout, elegant elongated oval border frame, classic 19th-century Americana heritage seal, "
        "ribbon banners curved along top and bottom"
    ),
    "minimalist_decal": (
        "minimalist vector decal layout, clean negative space, razor-sharp contour outline, "
        "contemporary flat apparel sticker silhouette, zero heavy background borders"
    )
}

STANDARD_NEGATIVE_PROMPT = (
    "Vietnamese text, Vietnamese words, accented letters, diacritics, Asian characters, foreign alphabet, "
    "human, person, face, man, woman, model wearing t-shirt, realistic 3d t-shirt mockup, "
    "creased fabric, wrinkled cloth, clothes hanger, mannequin, fashion photography, studio photo of shirt, "
    "blurry text, misspelled typography, gibberish lettering, watermarks, signature, border frames, "
    "low resolution, photo background, complex noisy background, shadows around cut edges"
)

def generate_creative_concepts(
    state_code: str,
    theme: str,
    audience: str = "All Veterans",
    design_layout: str = "open_silhouette",
    variation: int = 0,
    slogan_pool_override: Optional[List[str]] = None,
    niche: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Synthesizes 4 rich, independent creative concepts strictly grounded in the State's genuine
    data (state bird, flower, tree, symbols, military bases, nickname, motto, regional lore),
    adapted to the chosen Design Layout, Target Audience, Main Theme, and Specific Niche.
    Supports dynamic variation shuffle on demand and AI slogan pool overrides. 100% US English.
    """
    state = get_state_by_code(state_code)
    state_name = state["name"] if state else "Texas"
    nickname = state.get("nickname", "The Free State") if state else "The Free State"
    motto = state.get("motto", "") if state else ""
    cultural = state.get("cultural_heritage", {}) if state else {}
    symbols = cultural.get("symbols", ["Bald Eagle", "American Flag"])
    state_bird = cultural.get("state_bird", symbols[0] if symbols else "Heritage Eagle")
    state_flower = cultural.get("state_flower", symbols[1] if len(symbols) > 1 else "State Flower")
    state_tree = cultural.get("state_tree", "American Oak")
    military_ties = cultural.get("military_ties", [])
    primary_base = military_ties[0] if military_ties else f"{state_name} Defenders"
    secondary_base = military_ties[1] if len(military_ties) > 1 else f"{nickname} Outpost"
    regional_vibe = cultural.get("regional_vibe", "Freedom and heritage")

    clean_aud = clean_audience_en(audience)
    clean_thm = clean_theme_en(theme)
    theme_ctx = resolve_theme_context(clean_thm, state_name)
    theme_name_en = theme_ctx.get("theme_name_en", "Veteran")
    theme_symbols = theme_ctx.get("symbols", ["Heritage Shield", "Stars"])

    # If niche is provided and not none, combine niche context
    norm_niche = (niche or "").strip()
    if norm_niche.lower() in ["none", "all", "tat ca", "mac dinh"]:
        norm_niche = ""
    if norm_niche:
        clean_nch = clean_theme_en(norm_niche)
        niche_ctx = resolve_theme_context(clean_nch, state_name)
        niche_symbols = niche_ctx.get("symbols", [])
        primary_theme_symbol = niche_symbols[0] if niche_symbols else theme_symbols[0]
        secondary_theme_symbol = theme_symbols[0] if len(theme_symbols) > 0 else (niche_symbols[1] if len(niche_symbols) > 1 else "Insignia Crest")
        display_theme_name = f"{theme_name_en} ({niche_ctx.get('theme_name_en', clean_nch)})"
    else:
        primary_theme_symbol = theme_symbols[0]
        secondary_theme_symbol = theme_symbols[1] if len(theme_symbols) > 1 else "Insignia Crest"
        display_theme_name = theme_name_en
    
    # Layout descriptor for concept visual elements
    layout_notes = {
        "open_silhouette": "open silhouette composition, arched balanced typography, free-flowing contours without circular frame",
        "tactical_shield": "tactical heraldic shield crest, pointed military armor silhouette, angular protective border",
        "arched_chest": "horizontal chest varsity layout, wide arched collegiate lettering, stacked balanced hero center",
        "circular_badge": "circular medallion seal layout, concentric vintage rings with perimeter text",
        "diamond_polygon": "angular diamond patch silhouette, sharp 4-point rhombus border",
        "hexagon_patch": "tactical hexagon combat patch, 6-sided honeycomb geometric border",
        "vintage_oval": "vintage elongated oval crest, curved ribbon banners top and bottom",
        "minimalist_decal": "minimalist vector decal, razor-sharp clean negative space outline"
    }
    layout_phrase = layout_notes.get(design_layout, layout_notes["open_silhouette"])

    layout_vi_map = {
        "open_silhouette": "bố cục mở phóng khoáng không khung viền tròn, nét chữ uốn lượn cân đối",
        "tactical_shield": "khung khiên chiến thuật quân đội góc cạnh mạnh mẽ",
        "arched_chest": "chữ uốn cong lớn ngang ngực phong cách áo nỉ thể thao Varsity",
        "circular_badge": "huy hiệu tròn đồng tâm phong cách quân sự cổ điển",
        "diamond_polygon": "khung hình thoi kim cương 4 góc sắc nét",
        "hexagon_patch": "phù hiệu lục giác tổ ong chiến thuật",
        "vintage_oval": "khung bầu dục cổ điển kẹp dải ruy băng cuộn",
        "minimalist_decal": "decal vector sắc nét tối giản hiện đại"
    }
    layout_phrase_vi = layout_vi_map.get(design_layout, "bố cục mở phóng khoáng không khung viền tròn")

    aud_vi_map = {
        "Women": "nữ cựu binh",
        "Men": "nam cựu binh",
        "Military Dad": "người bố quân nhân",
        "Military Grandpa": "người ông cựu binh",
        "Military Families & Supporters": "gia đình quân nhân & hậu phương",
        "All Veterans": "mọi thế hệ cựu chiến binh"
    }
    aud_phrase_vi = aud_vi_map.get(clean_aud, f"người lính & cựu binh ({clean_aud})")

    theme_vi_map = {
        "Vietnam Veteran": "Cựu binh chiến trường Việt Nam",
        "Vietnam Era Veteran": "Cựu binh thời kỳ chiến tranh Việt Nam",
        "Desert Storm Veteran": "Cựu binh Chiến dịch Bão táp Sa mạc",
        "Iraq War Veteran": "Cựu binh chiến tranh Iraq (OIF)",
        "Afghanistan Veteran": "Cựu binh chiến trường Afghanistan (OEF)",
        "Korean War Veteran": "Cựu binh chiến tranh Triều Tiên",
        "WWII Veteran": "Cựu binh Thế chiến thứ hai",
        "Veteran": "Cựu chiến binh",
        "Army": "Lục quân Hoa Kỳ",
        "Navy": "Hải quân Hoa Kỳ",
        "Air Force": "Không quân Hoa Kỳ",
        "Marines": "Thủy quân lục chiến Hoa Kỳ",
        "Coast Guard": "Tuần duyên Hoa Kỳ",
        "Patriotic": "Lòng yêu nước & Tự hào Mỹ",
        "4th of July": "Ngày Quốc khánh Mỹ 4/7",
        "Military Dad/Grandpa": "Người cha & người ông cựu binh"
    }
    theme_phrase_vi = theme_vi_map.get(norm_niche, theme_vi_map.get(clean_thm, clean_thm))
    base_1_name = primary_base.split('(')[0].strip()
    base_2_name = secondary_base.split('(')[0].strip()
    sym_0_name = symbols[0] if symbols else "ngôi sao danh dự"
    sym_1_name = symbols[1] if len(symbols) > 1 else "ngôi sao chiến binh"

    # Fetch pool of authentic slogans (using AI override if provided)
    if slogan_pool_override and len(slogan_pool_override) > 0:
        slogan_pool = slogan_pool_override
    else:
        slogan_pool = suggest_slogans_for_state(state_code, clean_thm, clean_aud, variation, niche=norm_niche)
        
    if not slogan_pool:
        slogan_pool = [f"{state_name.upper()} BUILT · {theme_name_en.upper()} PROUD"]

    # 8 Authentic Concept Archetypes strictly grounded in this state's data
    archetypes = [
        # 1. State Wildlife & Flora Heritage
        {
            "name": f"{state_name} Flora & Wildlife Vanguard",
            "slogan_idx": 0,
            "description_vi": f"Kiểu thiên nhiên & linh vật: Chim {state_bird}, vòng hoa {state_flower}, biểu tượng {theme_phrase_vi}, {layout_phrase_vi}.",
            "elements": f"{state_bird}, {state_flower} wreath, {primary_theme_symbol}, {layout_phrase}",
            "palette": "Forest Pine Green, Golden Wheat, Off-White, Antique Bronze",
            "vibe": f"Deep natural state roots honoring {clean_aud} in {state_name}"
        },
        # 2. Military Landmark & Base Heritage
        {
            "name": f"{base_1_name} Division Honor",
            "slogan_idx": 1,
            "description_vi": f"Kiểu quân đoàn & căn cứ chiến lược: Phù hiệu căn cứ {base_1_name}, biểu tượng {theme_phrase_vi}, chữ dập stencil quân đội dũng mãnh và {layout_phrase_vi}.",
            "elements": f"{base_1_name} insignia, {secondary_theme_symbol}, stenciled state initials, {layout_phrase}",
            "palette": "Tactical Olive Drab, Bone White, Gunmetal Grey, Burnished Gold",
            "vibe": f"Frontline readiness & base heritage tied to {primary_base}"
        },
        # 3. State Nickname & Frontier Swagger
        {
            "name": f"{nickname} Swagger: {theme_name_en}",
            "slogan_idx": 2,
            "description_vi": f"Kiểu thể thao Varsity & bản đồ bang: Bản đồ bang {state_name}, biểu trưng {sym_0_name}, chữ in hoa to bản nứt rạn cổ điển mang niềm tự hào bang {nickname}.",
            "elements": f"{state_name} state outline silhouette, {symbols[0] if symbols else 'State Star'}, bold distressed varsity lettering, {layout_phrase}",
            "palette": "Vintage Cream, Deep Crimson, Midnight Navy, Warm Brass",
            "vibe": f"Unapologetic local pride rooted in {regional_vibe.split(',')[0]}"
        },
        # 4. Heartland Legacy & Family Roots
        {
            "name": f"Heartland Legacy: {state_name} ({clean_aud})",
            "slogan_idx": 3,
            "description_vi": f"Kiểu di sản quê hương & cội nguồn: Hình bóng cội cây {state_tree} cổ thụ, tia nắng hoàng hôn cổ điển, dải ruy băng cuộn tôn vinh {aud_phrase_vi} và {layout_phrase_vi}.",
            "elements": f"Silhouette artwork with {primary_theme_symbol} and {state_tree}, vintage sunset rays, distressed ribbon banner, {layout_phrase}",
            "palette": "Desert Tan, Khaki, Rusty Auburn, Weathered White",
            "vibe": f"Generational tribute celebrating {clean_aud} raised on {state_name} soil"
        },
        # 5. Battle-Tested Patina & State Motto
        {
            "name": f"{state_name} Valor: {motto[:25] if motto else 'Honor & Freedom'}",
            "slogan_idx": 4,
            "description_vi": f"Kiểu phong sương trận mạc (Distressed): Bề mặt in lụa nứt rạn patina, biểu tượng {sym_1_name}, thể hiện ý chí kiên cường theo châm ngôn bang và {layout_phrase_vi}.",
            "elements": f"Cracked screen-print texture, {symbols[1] if len(symbols) > 1 else 'Honor Star'}, {secondary_theme_symbol}, {layout_phrase}",
            "palette": "Cast Iron Charcoal, Weathered Gold, Off-White, Blood Crimson",
            "vibe": f"Unbreakable resilience reflecting state motto: {motto}"
        },
        # 6. Secondary Base & Regional Sentinel
        {
            "name": f"{base_2_name} Regional Sentinel",
            "slogan_idx": 5,
            "description_vi": f"Kiểu phù hiệu tuần tra & tiền đồn: Huy hiệu {base_2_name}, chim biểu tượng bang {state_bird}, kiểu chữ đại học Mỹ (Collegiate) viền đôi dày dặn và {layout_phrase_vi}.",
            "elements": f"{base_2_name} crest, {state_bird}, bold collegiate typography, {layout_phrase}",
            "palette": "Navy Blue Heather, Sterling Silver, Steel Grey, White",
            "vibe": f"Vigilant defense across {state_name} territory"
        },
        # 7. Modern State Insignia & Decal
        {
            "name": f"{state_name} Modern Vector Insignia",
            "slogan_idx": 6,
            "description_vi": f"Kiểu decal vector hiện đại: Đường nét bản đồ hình học sắc cạnh, không gian âm tối giản tinh tế, phong cách logo quân sự hiện đại cao cấp.",
            "elements": f"Crisp geometric state outline, negative space {primary_theme_symbol}, minimalist typography, {layout_phrase}",
            "palette": "High-contrast Black, Silver Grey, Deep Navy, Crisp White",
            "vibe": f"Contemporary tactical precision for modern American patriots"
        },
        # 8. Americana 1776 Roots & Cultural Symbol
        {
            "name": f"{state_name} Heritage: 1776 Spirit",
            "slogan_idx": 7,
            "description_vi": f"Kiểu tự do cổ điển 1776: Đại bàng đầu trắng tung cánh, chùm sao 1776 lịch sử, dải ruy băng cuộn giấy da cổ đậm chất tinh thần nước Mỹ.",
            "elements": f"Heritage bald eagle, {symbols[2] if len(symbols) > 2 else state_flower}, 1776 stars, distressed ribbon scroll, {layout_phrase}",
            "palette": "Patriotic Navy, Aged Parchment Cream, Vintage Scarlet, Gold",
            "vibe": f"Timeless American constitutional liberty forged in {state_name}"
        }
    ]

    # Select 4 distinct archetypes using variation shift/shuffle
    if variation != 0:
        import random
        rng = random.Random(variation)
        selected_archetypes = rng.sample(archetypes, 4)
    else:
        selected_archetypes = archetypes[:4]

    concepts: List[Dict[str, Any]] = []
    for idx, arch in enumerate(selected_archetypes):
        s_idx = arch["slogan_idx"] % len(slogan_pool)
        chosen_slogan = slogan_pool[s_idx]
        concepts.append({
            "id": f"concept_{idx + 1}",
            "name": arch["name"],
            "slogan": chosen_slogan,
            "description_vi": arch.get("description_vi", ""),
            "elements": arch["elements"],
            "palette": arch["palette"],
            "vibe": arch["vibe"]
        })

    return concepts

def suggest_slogans_for_state(
    state_code: str,
    theme: str,
    audience: Optional[str] = None,
    variation: int = 0,
    niche: Optional[str] = None
) -> List[str]:
    """
    Intelligently generates resonant, state-aware slogans based on 50 US State cultural data,
    state nicknames, mottos, landmarks, military ties, audience niches, and specific war niches.
    100% US English. No fixed sheets. Supports dynamic variation shuffle.
    """
    state = get_state_by_code(state_code)
    state_name = state["name"] if state else "America"
    nickname = state.get("nickname", "The Free State") if state else "The Free State"
    motto = state.get("motto", "") if state else ""
    cultural = state.get("cultural_heritage", {}) if state else {}
    symbols = cultural.get("symbols", [])
    military_ties = cultural.get("military_ties", [])
    predefined = cultural.get("popular_slogans", [])
    
    clean_aud = clean_audience_en(audience)
    clean_thm = clean_theme_en(theme)
    theme_ctx = resolve_theme_context(clean_thm, state_name)
    theme_name_en = theme_ctx.get("theme_name_en", "Veteran")
    theme_slogans = theme_ctx.get("slogans", [])

    candidates: List[str] = []

    # If specific niche is passed, incorporate niche slogans and combinations
    norm_nch = (niche or "").strip()
    if norm_nch.lower() in ["none", "all", "tat ca", "mac dinh"]:
        norm_nch = ""
    if norm_nch:
        clean_nch = clean_theme_en(norm_nch)
        nch_ctx = resolve_theme_context(clean_nch, state_name)
        nch_name = nch_ctx.get("theme_name_en", clean_nch)
        candidates.append(f"{state_name.upper()} {theme_name_en.upper()} · {nch_name.upper()} PROUD")
        candidates.append(f"DEFENDING FREEDOM · {state_name.upper()} {theme_name_en.upper()} · {nch_name.upper()}")
        candidates.append(f"{state_name.upper()} BUILT · {nch_name.upper()} · UNBROKEN VALOR")
        candidates.extend(nch_ctx.get("slogans", []))

    # 1. State Identity & Nickname High-Impact Slogans
    candidates.append(f"{state_name.upper()} BUILT · {theme_name_en.upper()} PROUD")
    candidates.append(f"DEFENDING FREEDOM · PROUD {state_name.upper()} {theme_name_en.upper()}")
    candidates.append(f"DON'T MESS WITH {state_name.upper()} {theme_name_en.upper()}S")
    candidates.append(f"{nickname.upper()} PRIDE · LAND OF THE FREE")
    candidates.append(f"BORN IN {state_name.upper()} · RAISED ON FREEDOM")
    candidates.append(f"FROM {state_name.upper()} SOIL · HONOR NEVER DIES")
    candidates.append(f"GOD, COUNTRY & {state_name.upper()} · TIMELESS VALOR")
    candidates.append(f"PROUD {state_name.upper()} ROOTS · UNBROKEN SPIRIT")
    candidates.append(f"DEFENDERS OF {state_name.upper()} · UNITED WE STAND")
    candidates.append(f"{state_name.upper()} PATRIOT · FREEDOM RUNS DEEP")

    # 2. State Specific Landmark & Lore Intelligence
    code_upper = (state_code or "").upper()
    if code_upper == "TX":
        candidates.append("LONE STAR VALOR · BORN IN TEXAS · HOME OF THE BRAVE")
        candidates.append("REMEMBER THE ALAMO · TEXAS SPIRIT UNBROKEN")
        candidates.append("TEXAS BORN · FREEDOM BOUND · LONE STAR PRIDE")
        candidates.append("STAND FOR THE FLAG · HELL OR HIGH WATER")
        candidates.append("LONE STAR SWAGGER · TEXAS AIRPOWER & GRIT")
        candidates.append("DON'T TREAD ON TEXAS · HOME OF LEGENDS")
    elif code_upper == "WA":
        candidates.append("EVERGREEN DEFENDERS · RAIN OR SHINE")
        candidates.append("PACIFIC NORTHWEST VALOR · WASHINGTON PROUD")
        candidates.append("GUARDIANS OF PUGET SOUND · STANDING TALL")
        candidates.append("JOINT BASE LEWIS-MCCHORD · PACIFIC SENTINELS")
        candidates.append("CASCADE VALOR · WASHINGTON STRONG")
    elif code_upper == "FL":
        candidates.append("SUNSHINE & FREEDOM · FLORIDA COASTAL GUARDIANS")
        candidates.append("IN GOD WE TRUST · PROUD FLORIDIAN DEFENDER")
        candidates.append("FEARLESS & FREE · THE SUNSHINE STATE")
        candidates.append("PENSACOLA ROOTS · CRADLE OF NAVAL AVIATION")
    elif code_upper == "CA":
        candidates.append("GOLDEN STATE DEFENDERS · PACIFIC FREEDOM")
        candidates.append("EUREKA! VALOR & LIBERTY IN CALIFORNIA")
        candidates.append("CAMP PENDLETON PRIDE · PACIFIC MARINES")
    elif code_upper == "AK":
        candidates.append("NORTH TO THE FUTURE · LAST FRONTIER WARRIORS")
        candidates.append("DEFENDING THE LAST FRONTIER · ALASKA TOUGH")
        candidates.append("TOP OF THE WORLD · ARCTIC SENTINELS")
    elif code_upper == "PA":
        candidates.append("KEYSTONE OF LIBERTY · 1776 ROOTS")
        candidates.append("LET FREEDOM RING · PENNSYLVANIA PROUD")
        candidates.append("VALLEY FORGE SPIRIT · ENDURING FREEDOM")
    elif code_upper == "VA":
        candidates.append("SIC SEMPER TYRANNIS · VIRGINIA VALOR")
        candidates.append("CRADLE OF HEROES · VIRGINIA PROUD")
        candidates.append("NORFOLK NAVAL POWER · GUARDIANS OF THE ATLANTIC")
    elif code_upper == "NC":
        candidates.append("FIRST IN FLIGHT · TAR HEEL STATE DEFENDERS")
        candidates.append("TO BE RATHER THAN TO SEEM · CAROLINA VALOR")
        candidates.append("FORT LIBERTY PRIDE · AIRBORNE ALL THE WAY")
    elif code_upper == "OH":
        candidates.append("BIRTHPLACE OF AVIATION · OHIO SKY WARRIORS")
        candidates.append("WITH GOD ALL THINGS ARE POSSIBLE · BUCKEYE PRIDE")
        candidates.append("WRIGHT-PATTERSON HEROES · OHIO PROUD")
    elif code_upper == "AL":
        candidates.append("WE DARE DEFEND OUR RIGHTS · SWEET HOME ALABAMA")
        candidates.append("HEART OF DIXIE DEFENDER · CRIMSON & GOLD")
        candidates.append("REDSTONE ARSENAL PRIDE · ROCKET CITY VALOR")
    elif code_upper == "NY":
        candidates.append("EMPIRE OF VALOR · NEW YORK RESILIENCE")
        candidates.append("EXCELSIOR · EVER UPWARD · DEFENDING FREEDOM")
        candidates.append("FORT DRUM 10TH MOUNTAIN · CLIMB TO GLORY")
    elif code_upper == "TN":
        candidates.append("THE VOLUNTEER STATE · FIRST TO ANSWER THE CALL")
        candidates.append("VOLUNTEER SPIRIT · TENNESSEE VALOR")
    elif code_upper == "KY":
        candidates.append("UNITED WE STAND, DIVIDED WE FALL · BLUEGRASS PRIDE")
    elif code_upper == "NH":
        candidates.append("LIVE FREE OR DIE · NEW HAMPSHIRE HERITAGE")
    elif code_upper == "AZ":
        candidates.append("GRAND CANYON STATE · DESERT VALOR & PRIDE")
    elif code_upper == "CO":
        candidates.append("MILE HIGH VALOR · ROCKY MOUNTAIN DEFENDERS")
    elif code_upper == "GA":
        candidates.append("WISDOM, JUSTICE & MODERATION · PEACH STATE HEROES")
    elif code_upper == "IL":
        candidates.append("LAND OF LINCOLN · FREEDOM & INTEGRITY")

    # 3. Audience Nuances (English Only)
    if clean_aud == "Women":
        candidates.insert(0, f"SHE SERVED WITH HONOR · PROUD {state_name.upper()} WOMAN")
        candidates.insert(1, f"{nickname.upper()} WOMAN · COURAGE, GRACE & GRIT")
        candidates.insert(2, f"PROUD {state_name.upper()} DAUGHTER · DEFENDER OF FREEDOM")
        candidates.insert(3, f"FEARLESS & TRUE · {state_name.upper()} WOMAN VETERAN")
        candidates.insert(4, f"BRAVE & BEAUTIFUL · {state_name.upper()} PATRIOT")
        candidates.append(f"MAMA, PATRIOT, {state_name.upper()} PROUD")
    elif clean_aud == "Military Dad":
        candidates.insert(0, f"PROUD {state_name.upper()} DAD · RAISING FREEDOM")
        candidates.insert(1, f"SOME HEROES WEAR DOG TAGS · PROUD {state_name.upper()} FATHER")
        candidates.insert(2, f"{nickname.upper()} DAD · DEFENDING THE HOMEFRONT")
        candidates.insert(3, f"BEHIND EVERY STRONG {state_name.upper()} FAMILY IS A HERO")
        candidates.append(f"RAISED ON {state_name.upper()} SOIL · PROUD VETERAN DAD")
    elif clean_aud == "Military Grandpa":
        candidates.insert(0, f"LEGENDARY {state_name.upper()} GRANDPA · VINTAGE PATRIOT")
        candidates.insert(1, f"OLD SCHOOL {state_name.upper()} VALOR · SERVED WITH HONOR")
        candidates.insert(2, f"VINTAGE {state_name.upper()} SOUL · A LIFETIME OF PRIDE")
        candidates.append(f"{state_name.upper()} HERITAGE · GRANDPA'S LEGACY OF HONOR")
    elif clean_aud == "Military Families & Supporters":
        candidates.insert(0, f"MY HERO DEFENDS {state_name.upper()} · PROUD MILITARY FAMILY")
        candidates.insert(1, f"UNITED UNDER ONE FLAG · {state_name.upper()} FAMILY PRIDE")
        candidates.insert(2, f"HOME OF THE BRAVE · {nickname.upper()} SUPPORTER")
        candidates.append(f"STANDING STRONG BEHIND OUR {state_name.upper()} TROOPS")
    elif clean_aud == "Men":
        candidates.insert(0, f"PROUD {state_name.upper()} BROTHERHOOD · STAND TALL")
        candidates.insert(1, f"FORGED IN {state_name.upper()} · TOUGH AS STEEL")
        candidates.append(f"HEARTLAND BROTHERHOOD · {state_name.upper()} WARRIORS")

    # 4. Integrate Theme Slogans & Predefined English Slogans
    candidates.extend(theme_slogans)
    for p in predefined:
        p_clean = remove_vietnamese_accents(p).strip()
        if p_clean and p_clean not in candidates:
            candidates.append(p_clean)

    # 5. Clean, Deduplicate & Return with Variation Shuffle
    seen = set()
    cleaned_pool: List[str] = []
    for s in candidates:
        s_clean = remove_vietnamese_accents(s).strip()
        if s_clean and s_clean.lower() not in seen:
            seen.add(s_clean.lower())
            cleaned_pool.append(s_clean)

    if variation != 0 and len(cleaned_pool) > 12:
        import random
        rng = random.Random(variation)
        shuffled = list(cleaned_pool)
        rng.shuffle(shuffled)
        return shuffled[:12]
    elif variation != 0:
        shift = variation % max(1, len(cleaned_pool))
        rotated = cleaned_pool[shift:] + cleaned_pool[:shift]
        return rotated[:12]

    return cleaned_pool[:12]

def build_artwork_prompt(
    state_code: str,
    theme: str,
    design_style: str,
    slogan: str,
    product_color: str,
    audience: str = "All Veterans",
    design_layout: str = "open_silhouette",
    custom_notes: Optional[str] = None,
    niche: Optional[str] = None
) -> Dict[str, Any]:
    """
    Assemble the complete prompt tailored for the chosen image gen provider and DTG printing.
    100% in English for optimal image generation with ShopAPI / FLUX / Midjourney.
    Zero Vietnamese characters or diacritics. Fully supports multi-shape layout templates.
    """
    state = get_state_by_code(state_code)
    state_name = state["name"] if state else "United States"
    nickname = state.get("nickname", "") if state else ""
    cultural = state.get("cultural_heritage", {}) if state else {}
    symbols = cultural.get("symbols", ["Bald Eagle", "American Flag", "Stars"])
    regional_vibe = cultural.get("regional_vibe", "Patriotic freedom and courage")
    
    clean_aud = clean_audience_en(audience)
    clean_thm = clean_theme_en(theme)
    theme_ctx = resolve_theme_context(clean_thm, state_name)
    theme_canonical = theme_ctx.get("canonical_english", clean_thm)
    theme_symbols = theme_ctx.get("symbols", ["Emblem Shield", "Stars"])
    style_desc = STYLE_PROMPT_MODIFIERS.get(design_style, STYLE_PROMPT_MODIFIERS["Vintage Distressed"])
    layout_desc = LAYOUT_PROMPT_MODIFIERS.get(design_layout, LAYOUT_PROMPT_MODIFIERS["open_silhouette"])
    
    highlight_symbols = ", ".join(symbols[:3])

    # If specific niche is passed, weave both theme and niche symbols
    norm_nch = (niche or "").strip()
    if norm_nch.lower() in ["none", "all", "tat ca", "mac dinh"]:
        norm_nch = ""
    if norm_nch:
        clean_nch = clean_theme_en(norm_nch)
        nch_ctx = resolve_theme_context(clean_nch, state_name)
        nch_canonical = nch_ctx.get("canonical_english", clean_nch)
        nch_symbols_list = nch_ctx.get("symbols", [])
        combined_theme_desc = f"{theme_canonical} and {nch_canonical}"
        all_theme_symbols = ", ".join((theme_symbols[:2] + nch_symbols_list[:2])[:3])
    else:
        combined_theme_desc = theme_canonical
        all_theme_symbols = ", ".join(theme_symbols[:3])
    
    color_guidance = ""
    if product_color in ["Black", "Navy Heather"]:
        color_guidance = "designed for print on dark garments with bold cream white, warm gold, and vibrant contrast ink; avoid dark muddy fills; "
    elif product_color == "Military Green":
        color_guidance = "designed for print on tactical olive drab garment, featuring sharp khaki tan, gold, and bone-white screenprint colors; "
    elif product_color == "Sport Grey":
        color_guidance = "designed for print on athletic sport grey heather, bold high-contrast deep charcoal, crimson red, and navy accents; "

    slogan_clean = remove_vietnamese_accents(slogan).strip() if slogan else "Land of the Free"

    # Adapt opening phrase based on chosen layout shape
    if design_layout == "open_silhouette":
        opening = "Masterpiece open silhouette t-shirt graphic design for direct-to-garment apparel print"
    elif design_layout == "tactical_shield":
        opening = "Masterpiece tactical shield crest t-shirt design for direct-to-garment apparel print"
    elif design_layout == "arched_chest":
        opening = "Masterpiece wide horizontal arched chest t-shirt design for direct-to-garment apparel print"
    elif design_layout == "circular_badge":
        opening = "Masterpiece circular emblem badge t-shirt design for direct-to-garment apparel print"
    elif design_layout == "diamond_polygon":
        opening = "Masterpiece angular diamond patch t-shirt design for direct-to-garment apparel print"
    elif design_layout == "hexagon_patch":
        opening = "Masterpiece hexagonal combat patch t-shirt design for direct-to-garment apparel print"
    elif design_layout == "vintage_oval":
        opening = "Masterpiece vintage oval crest t-shirt design for direct-to-garment apparel print"
    elif design_layout == "minimalist_decal":
        opening = "Masterpiece minimalist vector decal t-shirt design for direct-to-garment apparel print"
    else:
        opening = "Masterpiece apparel graphic t-shirt design for direct-to-garment print"

    subject_core = (
        f"{opening}, "
        f"celebrating {state_name} ({nickname}) and {combined_theme_desc} ({clean_aud}). "
        f"Visual elements include state symbols ({highlight_symbols}), combined with theme iconography ({all_theme_symbols}). "
        f"Prominently featuring clean, legible, bold vintage typography displaying the text: \"{slogan_clean}\". "
        f"{regional_vibe}. "
        f"{color_guidance}"
        f"{layout_desc}. "
        f"{style_desc}. "
        f"Perfect centered composition, crisp isolated edges on pure white backdrop. "
        f"STRICT REQUIREMENT: 100% proper English text and typography only. Zero Vietnamese characters, zero diacritics, zero foreign accents."
    )
    
    if custom_notes:
        clean_notes = remove_vietnamese_accents(custom_notes).strip()
        subject_core += f" Additional artistic detail: {clean_notes}."

    concepts = generate_creative_concepts(state_code, clean_thm, clean_aud, design_layout, niche=norm_nch)

    # Dynamic negative prompt: penalize round borders when open silhouette is selected
    neg_prompt = STANDARD_NEGATIVE_PROMPT
    if design_layout == "open_silhouette":
        neg_prompt += ", circular border, round badge frame, enclosing circle, coin shape, circular seal, round border"
    elif design_layout == "tactical_shield":
        neg_prompt += ", circular border, round circle, coin badge"

    suggested_title = f"{state_name} {theme_ctx['theme_name_en']}"
    if norm_nch:
        suggested_title += f" ({norm_nch})"
    suggested_title += f" - {design_style}"

    return {
        "prompt": subject_core,
        "negative_prompt": neg_prompt,
        "suggested_title": suggested_title,
        "concepts": concepts,
        "state_context": {
            "name": state_name,
            "code": state_code,
            "symbols": symbols,
            "flag_url": state.get("flag_url", "") if state else "",
            "region": state.get("region", "USA") if state else "USA",
            "population": state.get("demographics", {}).get("population", 0) if state else 0,
            "veteran_population": state.get("demographics", {}).get("veteran_population", 0) if state else 0,
            "veteran_percentage": state.get("demographics", {}).get("veteran_percentage", 0) if state else 0,
            "race_ethnicity": state.get("demographics", {}).get("race_ethnicity", {}) if state else {},
            "religion": state.get("religion_values", {}) if state else {}
        }
    }
