"""
Extracts 'Y tuong thiet ke' and 'Tu khoa SEO' from user_veteran_sheet.xlsx
"""
import openpyxl
import json

wb = openpyxl.load_workbook("backend/app/data/user_veteran_sheet.xlsx", data_only=True)

# 1. Extract 'Y tuong thiet ke'
ws_ideas = wb["Y tuong thiet ke"]
ideas = []
for row in ws_ideas.iter_rows(values_only=True):
    if row and len(row) >= 4 and row[0]:
        idea = str(row[0]).strip()
        if idea in ["10 hướng thiết kế áo", "Ý tưởng"]:
            continue
        if "Ý tưởng sáng tạo chưa kiểm chứng" in idea or "Nguồn:" in idea:
            continue
        style_desc = str(row[1]).strip() if row[1] else ""
        keyword = str(row[2]).strip() if row[2] else ""
        note = str(row[3]).strip() if row[3] else ""
        ideas.append({
            "title": idea,
            "visual_style": style_desc,
            "keyword": keyword,
            "note": note
        })

with open("backend/app/data/design_ideas.json", "w", encoding="utf-8") as f:
    json.dump(ideas, f, ensure_ascii=False, indent=2)

# 2. Extract 'Tu khoa SEO'
ws_seo = wb["Tu khoa SEO"]
seo_keywords = []
for row in ws_seo.iter_rows(values_only=True):
    if row and len(row) >= 5 and row[0]:
        kw = str(row[0]).strip()
        if "từ khóa" in kw.lower() or "nguồn:" in kw.lower() or kw.startswith("Từ khóa đề xuất"):
            continue
        if kw == "Từ khóa tiếng Anh":
            continue
        meaning_vn = str(row[1]).strip() if row[1] else ""
        category = str(row[2]).strip() if row[2] else ""
        page_type = str(row[3]).strip() if row[3] else ""
        note = str(row[4]).strip() if row[4] else ""
        seo_keywords.append({
            "keyword": kw,
            "vietnamese": meaning_vn,
            "category": category,
            "page_type": page_type,
            "note": note
        })

with open("backend/app/data/seo_keywords.json", "w", encoding="utf-8") as f:
    json.dump(seo_keywords, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(ideas)} Design Ideas and {len(seo_keywords)} SEO Keywords!")

