"""
Detailed extractor for user's 50 states and data sheets
"""
import openpyxl
import json

wb = openpyxl.load_workbook("backend/app/data/user_veteran_sheet.xlsx", data_only=True)
sheets_of_interest = [
    "50 tieu bang",
    "Dan so va tuoi",
    "Chung toc",
    "Ton giao",
    "Y tuong thiet ke",
    "Tu khoa SEO"
]

summary = {}

for s in wb.sheetnames:
    ws = wb[s]
    rows = list(ws.iter_rows(values_only=True))
    non_empty = [r for r in rows if any(c is not None for c in r)]
    header = non_empty[0] if non_empty else []
    sample = non_empty[1:6] if len(non_empty) > 1 else []
    summary[s] = {
        "non_empty_rows": len(non_empty),
        "header": [str(c) if c is not None else "" for c in header],
        "sample": [[str(c) if c is not None else "" for c in r] for r in sample]
    }

with open("backend/app/data/detailed_sheet_summary.json", "w", encoding="utf-8") as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)

print("Saved detailed_sheet_summary.json")

