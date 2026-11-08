"""
Inspect contents of user_veteran_sheet.xlsx
"""
import openpyxl
import json

wb = openpyxl.load_workbook("backend/app/data/user_veteran_sheet.xlsx", data_only=True)
report = {}

for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    rows = list(ws.iter_rows(values_only=True))
    sample_rows = rows[:15] if len(rows) > 15 else rows
    report[sheet_name] = {
        "total_rows": len(rows),
        "total_cols": ws.max_column,
        "sample_rows": sample_rows
    }

with open("backend/app/data/sheet_analysis.json", "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=2, default=str)

print("Saved sheet_analysis.json successfully!")

