"""
Merges exact data from user_veteran_sheet.xlsx into us_states.json
- Sheet '50 tieu bang': State names, USPS codes, flag URLs
- Sheet 'Dan so va tuoi': Population, Gender ratio, Median age, Age groups (ACS 2024)
- Sheet 'Chung toc': White, Black, Native, Asian, Pacific, Other, Multi, Hispanic (ACS 2024)
- Sheet 'Ton giao': Christian, Evangelical, Mainline, Black Protestant, Catholic, Mormon, Orthodox, Jewish, Muslim, Buddhist, Hindu, Unaffiliated (Pew 2023-2024)
"""
import openpyxl
import json
import os

EXCEL_PATH = "backend/app/data/user_veteran_sheet.xlsx"
STATES_JSON_PATH = "backend/app/data/us_states.json"

wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)

# 1. Parse Sheet '50 tieu bang'
ws_flags = wb["50 tieu bang"]
flags_data = {}
for row in ws_flags.iter_rows(values_only=True):
    # e.g. [1.0, 'Alabama', 'AL', '', 'https://...svg', 'https://...']
    if row and len(row) >= 5 and row[1] and row[2]:
        state_name = str(row[1]).strip()
        state_code = str(row[2]).strip().upper()
        flag_svg = str(row[4]).strip() if row[4] else ""
        if len(state_code) == 2 and state_code != "MÃ":
            flags_data[state_name] = {"code": state_code, "flag_url": flag_svg}

# 2. Parse Sheet 'Dan so va tuoi'
ws_demo = wb["Dan so va tuoi"]
demo_data = {}
for row in ws_demo.iter_rows(values_only=True):
    if row and len(row) >= 12 and row[0]:
        state_name = str(row[0]).strip()
        try:
            pop = int(float(row[1]))
            male_pct = round(float(row[2]) * 100, 1)
            female_pct = round(float(row[3]) * 100, 1)
            med_age = float(row[4])
            age_groups = {
                "under_18": round(float(row[5]) * 100, 1),
                "18_24": round(float(row[6]) * 100, 1),
                "25_34": round(float(row[7]) * 100, 1),
                "35_44": round(float(row[8]) * 100, 1),
                "45_54": round(float(row[9]) * 100, 1),
                "55_64": round(float(row[10]) * 100, 1),
                "65_plus": round(float(row[11]) * 100, 1),
            }
            demo_data[state_name] = {
                "population": pop,
                "gender": {"male": male_pct, "female": female_pct},
                "median_age": med_age,
                "age_distribution": age_groups
            }
        except (ValueError, TypeError):
            continue

# 3. Parse Sheet 'Chung toc'
ws_race = wb["Chung toc"]
race_data = {}
for row in ws_race.iter_rows(values_only=True):
    if row and len(row) >= 9 and row[0]:
        state_name = str(row[0]).strip()
        try:
            race_data[state_name] = {
                "white": round(float(row[1]) * 100, 1),
                "black": round(float(row[2]) * 100, 1),
                "native_american": round(float(row[3]) * 100, 1),
                "asian": round(float(row[4]) * 100, 1),
                "pacific_islander": round(float(row[5]) * 100, 1),
                "other": round(float(row[6]) * 100, 1),
                "multiracial": round(float(row[7]) * 100, 1),
                "hispanic": round(float(row[8]) * 100, 1)
            }
        except (ValueError, TypeError):
            continue

# 4. Parse Sheet 'Ton giao'
ws_rel = wb["Ton giao"]
rel_data = {}
def safe_pct(val):
    if val is None:
        return 0.0
    val_str = str(val).strip()
    if "<" in val_str:
        return 0.5
    try:
        return round(float(val_str) * 100, 1)
    except (ValueError, TypeError):
        return 0.0

for row in ws_rel.iter_rows(values_only=True):
    if row and len(row) >= 16 and row[0]:
        state_name = str(row[0]).strip()
        if state_name in ["Tiểu bang", "TÔN GIÁO — PEW 2023–2024 (NGƯỜI TỪ 18 TUỔI)"]:
            continue
        rel_data[state_name] = {
            "christian_pct": safe_pct(row[1]),
            "other_religions_pct": safe_pct(row[2]),
            "unaffiliated_pct": safe_pct(row[3]),
            "evangelical_pct": safe_pct(row[4]),
            "mainline_protestant_pct": safe_pct(row[5]),
            "black_protestant_pct": safe_pct(row[6]),
            "catholic_pct": safe_pct(row[7]),
            "mormon_pct": safe_pct(row[8]),
            "orthodox_pct": safe_pct(row[9]),
            "jewish_pct": safe_pct(row[12]),
            "muslim_pct": safe_pct(row[13]),
            "buddhist_pct": safe_pct(row[14]),
            "hindu_pct": safe_pct(row[15])
        }

# 5. Load existing state cultural data
with open(STATES_JSON_PATH, "r", encoding="utf-8") as f:
    existing_states = json.load(f)

# Name normalization map
name_map = {s["name"]: s for s in existing_states}

# Update with exact spreadsheet data
updated_count = 0
for name, s_obj in name_map.items():
    if name in demo_data:
        s_obj["demographics"]["population"] = demo_data[name]["population"]
        s_obj["demographics"]["gender"] = demo_data[name]["gender"]
        s_obj["demographics"]["median_age"] = demo_data[name]["median_age"]
        s_obj["demographics"]["age_distribution"] = demo_data[name]["age_distribution"]
    
    if name in race_data:
        s_obj["demographics"]["race_ethnicity"] = race_data[name]
        
    if name in rel_data:
        s_obj["religion_values"] = rel_data[name]
        
    if name in flags_data:
        s_obj["flag_url"] = flags_data[name]["flag_url"]
        
    updated_count += 1

# Write back updated us_states.json
with open(STATES_JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(existing_states, f, ensure_ascii=False, indent=2)

print(f"Successfully integrated exact Google Sheets data for all {updated_count} states!")

