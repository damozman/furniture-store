#!/usr/bin/env python3
"""Build a simple 3-tab workbook a non-technical person can finish."""

from __future__ import annotations

import json
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.page import PageMargins

SRC = Path("/workspace/public/catalog.xlsx")
MANIFEST = Path("/workspace/src/data/manifest.json")
OUTS = [
    Path("/workspace/public/catalog.xlsx"),
    Path("/tmp/furniture-store-docs/docs/Furniture Information Sheet.xlsx"),
]

INK = "2C2416"
PAPER = "F6F1EA"
SADDLE = "8C4A2F"
WALNUT = "6B5B4F"
BONE = "E8E0D4"

FILL_INK = PatternFill("solid", fgColor=INK)
FILL_PAPER = PatternFill("solid", fgColor=PAPER)
FILL_YELLOW = PatternFill("solid", fgColor="F8E6A0")
FILL_GREEN = PatternFill("solid", fgColor="D9E8D3")
FILL_ORANGE = PatternFill("solid", fgColor="F7D7B5")
FILL_BLUE = PatternFill("solid", fgColor="D6E3F0")
FILL_CREAM = PatternFill("solid", fgColor="F3EBE0")
FILL_PINK = PatternFill("solid", fgColor="F4C7C3")
FILL_WHITE = PatternFill("solid", fgColor="FFFFFF")

FONT_H1 = Font(name="Calibri", size=22, bold=True, color=INK)
FONT_H2 = Font(name="Calibri", size=14, bold=True, color=INK)
FONT_BODY = Font(name="Calibri", size=12, color=INK)
FONT_SMALL = Font(name="Calibri", size=11, color=WALNUT)
FONT_HEAD = Font(name="Calibri", size=11, bold=True, color="F4EFE6")
FONT_YELLOW = Font(name="Calibri", size=12, color=INK)

THIN = Border(
    left=Side(style="thin", color=BONE),
    right=Side(style="thin", color=BONE),
    top=Side(style="thin", color=BONE),
    bottom=Side(style="thin", color=BONE),
)
WRAP = Alignment(wrap_text=True, vertical="center")
WRAP_TOP = Alignment(wrap_text=True, vertical="top")


def sku_text(v) -> str:
    if v is None:
        return ""
    if isinstance(v, float) and v == int(v):
        return str(int(v))
    return str(v).strip()


def money(v):
    try:
        if v in ("", None):
            return None
        return float(v)
    except Exception:
        return None


def load_catalog():
    wb = load_workbook(SRC, data_only=True)
    ws = wb["Catalog"]
    headers = [c.value for c in next(ws.iter_rows(min_row=1, max_row=1))]
    rows = []
    for vals in ws.iter_rows(min_row=2, values_only=True):
        d = {headers[i]: vals[i] for i in range(len(headers))}
        d["sku"] = sku_text(d.get("sku"))
        if d["sku"]:
            rows.append(d)
    return rows


def has_photo(sku: str, photographed: set[str]) -> bool:
    return sku in photographed and sku != "99999999"


def style_header(ws, n, row=1):
    ws.row_dimensions[row].height = 28
    for c in range(1, n + 1):
        cell = ws.cell(row, c)
        cell.fill = FILL_INK
        cell.font = FONT_HEAD
        cell.alignment = Alignment(wrap_text=True, vertical="center", horizontal="left")
    ws.freeze_panes = f"A{row + 1}"
    ws.auto_filter.ref = f"A{row}:{get_column_letter(n)}{ws.max_row}"
    ws.sheet_view.showGridLines = False
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.page_margins = PageMargins(left=0.4, right=0.4, top=0.5, bottom=0.4)
    ws.sheet_properties.pageSetUpPr.fitToPage = True


def paint(cell, fill=None, font=None, align=None):
    if fill:
        cell.fill = fill
    if font:
        cell.font = font
    cell.alignment = align or WRAP
    cell.border = THIN


def build_work_rows(catalog, photographed: set[str]) -> list[dict]:
    out = []

    def add(task, do, row, fill):
        sku = row["sku"]
        out.append(
            {
                "status": "To do",
                "task": task,
                "sku": sku,
                "product": row.get("name") or "",
                "finish": row.get("hide") or "",
                "do": do,
                "our_price": money(row.get("price")),
                "floor_price": money(row.get("ss_price")),
                "on_hand": money(row.get("on_hand")),
                "has_photo": "Yes" if has_photo(sku, photographed) else "No",
                "your_answer": "",
                "fill": fill,
            }
        )

    by_sku = {r["sku"]: r for r in catalog}

    for r in catalog:
        if r.get("match") == "medium":
            floor = r.get("ss_item") or "the floor item"
            add(
                "Confirm match",
                f'We matched the floor item “{floor}” to this SKU. Look at the finish. Type YES if it is the right hide, or type the correct SKU.',
                r,
                "orange",
            )

    for r in catalog:
        if r.get("match") == "review":
            add(
                "Confirm SKU",
                "Smith tufted white croc. We used SKU 30190002 from an old photo. Type YES if that number is right, or type the correct SKU.",
                r,
                "yellow",
            )

    for r in catalog:
        if str(r.get("match")) == "new" or str(r["sku"]).startswith("NEW-"):
            qty = r.get("on_hand")
            qty_s = f"{int(qty)} on the floor. " if qty else ""
            add(
                "Give it a SKU",
                f"{qty_s}This was on the floor and not on our old list. If you know the real SKU, type it here. If not, type KEEP TEMP.",
                r,
                "blue",
            )

    bad = {
        "11111": "Brooke brown barstool is using a fake SKU (11111). Type the real SKU from the manufacturer.",
        "123456": "Murphy springbok ottoman is using a fake SKU (123456). Type the real SKU.",
        "SANTA-FE": "The 3-piece sectional is using SANTA-FE as a SKU. Type the real SKU.",
        "1": "Levi Black is using SKU 1 (it used to be 000001). Type the real SKU.",
        "2": "Levi Brown is using SKU 2. Type the real SKU.",
        "3": "Levi Taupe is using SKU 3. Type the real SKU.",
    }
    for sku, msg in bad.items():
        r = by_sku.get(sku)
        if r:
            add("Fix fake SKU", msg, r, "pink")

    smith = [r for r in catalog if r.get("name") == "Smith" and money(r.get("cost")) is None and not str(r["sku"]).startswith("NEW-")]
    if smith:
        # one instruction row plus the four SKUs to fill
        for r in smith:
            add(
                "Fill in cost",
                f"What we pay (cost) is blank. Other items are about half of the selling price. This sells for ${money(r.get('price')):.0f}. Type the cost (example: 75).",
                r,
                "yellow",
            )

    for r in catalog:
        sku = r["sku"]
        if sku == "99999999":
            continue
        if not has_photo(sku, photographed):
            add(
                "Need a photo",
                "The website shows a blank square for this finish. If you have a picture, type the file name or “I will send one”. If we should hide this finish until there is a photo, type HIDE.",
                r,
                "yellow",
            )

    return out


def write_start(ws, n_work: int):
    ws.sheet_view.showGridLines = False
    ws.sheet_properties.tabColor = SADDLE
    ws.page_setup.orientation = "portrait"
    ws.page_setup.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 1
    ws.page_margins = PageMargins(left=0.6, right=0.6, top=0.6, bottom=0.5)
    ws.column_dimensions["A"].width = 22
    ws.column_dimensions["B"].width = 28
    ws.column_dimensions["C"].width = 28
    ws.column_dimensions["D"].width = 28
    ws.column_dimensions["E"].width = 28
    for r in range(1, 48):
        for c in range(1, 6):
            ws.cell(r, c).fill = FILL_PAPER

    ws.merge_cells("A1:E1")
    ws["A1"] = "Saddle & Hide  ·  product sheet"
    ws["A1"].font = FONT_H1
    ws["A1"].fill = FILL_PAPER
    ws.row_dimensions[1].height = 36

    ws.merge_cells("A2:E2")
    ws["A2"] = (
        "This file is the only one to edit. You do not need the old Sunset Sage workbook. "
        "Work the yellow boxes, then send this same file back."
    )
    ws["A2"].font = FONT_BODY
    ws["A2"].alignment = WRAP
    ws["A2"].fill = FILL_PAPER
    ws.row_dimensions[2].height = 40

    ws.merge_cells("A4:E4")
    ws["A4"] = "How to use this file"
    ws["A4"].font = FONT_H2
    ws["A4"].fill = FILL_PAPER

    steps = [
        "1. Open the tab at the bottom named  Your work.",
        "2. Read the column  Do this  for that row. That sentence is the whole task.",
        "3. Type your answer in the yellow  Your answer  column. One row at a time is fine.",
        "4. When a row is finished, change Status to  Done. If you want to skip it, choose  Skip.",
        "5. You can filter the Task column to do one kind of job at a time (photos, SKUs, and so on).",
        "6. File → Save. Email the saved file back. That is all.",
    ]
    for i, line in enumerate(steps, 5):
        ws.merge_cells(start_row=i, start_column=1, end_row=i, end_column=5)
        ws.cell(i, 1, line).font = FONT_BODY
        ws.cell(i, 1).fill = FILL_PAPER
        ws.row_dimensions[i].height = 22

    ws.merge_cells("A12:E12")
    ws["A12"] = "There are three tabs. You only need the first two."
    ws["A12"].font = FONT_SMALL
    ws["A12"].fill = FILL_PAPER

    ws.merge_cells("A14:E14")
    ws["A14"] = "Color legend"
    ws["A14"].font = FONT_H2
    ws["A14"].fill = FILL_PAPER

    legend = [
        (15, FILL_YELLOW, "Yellow", "Please type something here. This is your work."),
        (16, FILL_ORANGE, "Orange", "Please check. We are close, but not sure."),
        (17, FILL_BLUE, "Blue", "New item from the floor that was not on the old list."),
        (18, FILL_PINK, "Pink", "Fake / placeholder SKU. Needs the real number."),
        (19, FILL_GREEN, "Green", "Done (after you set Status to Done)."),
    ]
    ws["A15"].fill = FILL_PAPER
    for r, fill, name, meaning in legend:
        ws.cell(r, 1, "").fill = FILL_PAPER
        paint(ws.cell(r, 2, name), fill, FONT_BODY)
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=5)
        ws.cell(r, 3, meaning).font = FONT_BODY
        ws.cell(r, 3).fill = FILL_PAPER
        ws.row_dimensions[r].height = 22

    ws.merge_cells("A21:E21")
    ws["A21"] = "Two rules to decide once (type in the yellow boxes)"
    ws["A21"].font = FONT_H2
    ws["A21"].fill = FILL_PAPER

    ws.merge_cells("A22:E22")
    ws["A22"] = (
        "Floor prices and our list often disagree. Example: Saddle stools are $300 on our list "
        "and $350 on the floor. Trophy is $650 on our list and $550 on the floor. "
        "Pick one rule for the whole line. You do not have to edit 67 rows."
    )
    ws["A22"].font = FONT_BODY
    ws["A22"].alignment = WRAP
    ws["A22"].fill = FILL_PAPER
    ws.row_dimensions[22].height = 48

    ws["A24"] = "Price rule"
    ws["A24"].font = FONT_BODY
    ws["A24"].fill = FILL_PAPER
    ws.merge_cells("B24:E24")
    paint(ws["B24"], FILL_YELLOW, FONT_YELLOW)
    ws["B24"] = ""
    ws["A25"] = "Hint"
    ws["A25"].font = FONT_SMALL
    ws["A25"].fill = FILL_PAPER
    ws.merge_cells("B25:E25")
    ws["B25"] = "Type: KEEP OUR LIST    or    USE FLOOR PRICES    or    MIX (and add a note)"
    ws["B25"].font = FONT_SMALL
    ws["B25"].fill = FILL_PAPER

    ws["A27"] = "Smith cost"
    ws["A27"].font = FONT_BODY
    ws["A27"].fill = FILL_PAPER
    ws.merge_cells("B27:E27")
    paint(ws["B27"], FILL_YELLOW, FONT_YELLOW)
    ws.merge_cells("A28:E28")
    ws["A28"] = (
        "Four Smith stools have no cost (what we pay). Everything else is about half of the selling price. "
        "If that is right, type  HALF  here and we will fill $75 on the $150 Smiths. "
        "If not, type the real cost on those rows in Your work."
    )
    ws["A28"].font = FONT_BODY
    ws["A28"].alignment = WRAP
    ws["A28"].fill = FILL_PAPER
    ws.row_dimensions[28].height = 48

    ws.merge_cells("A30:E30")
    ws["A30"] = "Please do not"
    ws["A30"].font = FONT_H2
    ws["A30"].fill = FILL_PAPER
    dont = [
        "Do not edit the All products tab unless you are looking something up.",
        "Do not change photo file names unless you are replacing a picture.",
        "Do not worry about the Custom Saddle row (SKU 99999999). That is not a real hide — skip it.",
        "Do not open or send the old inventory workbook with pictures inside. Those photos are already mapped.",
    ]
    for i, line in enumerate(dont, 31):
        ws.merge_cells(start_row=i, start_column=1, end_row=i, end_column=5)
        ws.cell(i, 1, line).font = FONT_BODY
        ws.cell(i, 1).fill = FILL_PAPER

    ws.merge_cells("A36:E36")
    ws["A36"] = "Progress  (this counts itself as you work)"
    ws["A36"].font = FONT_H2
    ws["A36"].fill = FILL_PAPER
    ws["A37"] = "Still to do"
    ws["A37"].font = FONT_BODY
    ws["A37"].fill = FILL_PAPER
    ws["B37"] = '=COUNTIF(\'Your work\'!A:A,"To do")'
    paint(ws["B37"], FILL_YELLOW, FONT_H2, Alignment(vertical="center", horizontal="center"))
    ws["C37"] = "Done"
    ws["C37"].font = FONT_BODY
    ws["C37"].fill = FILL_PAPER
    ws["D37"] = '=COUNTIF(\'Your work\'!A:A,"Done")'
    paint(ws["D37"], FILL_GREEN, FONT_H2, Alignment(vertical="center", horizontal="center"))
    ws["A38"] = f"There are {n_work} rows on Your work. Filter Task if that feels like a lot."
    ws["A38"].font = FONT_SMALL
    ws["A38"].fill = FILL_PAPER
    ws.merge_cells("A38:E38")

    ws.merge_cells("A40:E40")
    ws["A40"] = "Example"
    ws["A40"].font = FONT_H2
    ws["A40"].fill = FILL_PAPER
    ws.merge_cells("A41:E41")
    ws["A41"] = (
        "Row says: “We matched Saddle Brown Hide to SKU 30400123. Type YES if that is the right hide.” "
        "You look at the finish name, it is right, so in Your answer you type YES and set Status to Done."
    )
    ws["A41"].font = FONT_BODY
    ws["A41"].alignment = WRAP
    ws["A41"].fill = FILL_PAPER
    ws.row_dimensions[41].height = 48

    ws.merge_cells("A43:E43")
    ws["A43"] = "Questions? Ask Chris before guessing on a SKU number. Skip is always allowed."
    ws["A43"].font = FONT_SMALL
    ws["A43"].fill = FILL_PAPER

    ws.row_dimensions[24].height = 28
    ws.row_dimensions[27].height = 28
    ws.row_dimensions[37].height = 28
    ws.print_title_rows = "1:1"
    ws.sheet_view.view = "pageBreakPreview"
    ws.sheet_view.view = "normal"
    ws.oddHeader.left.text = "Saddle & Hide"
    ws.oddFooter.left.text = "Start here  ·  type only in the yellow boxes"


def write_work(ws, rows: list[dict]):
    ws.sheet_properties.tabColor = "C4A35A"
    headers = [
        "Status",
        "Task",
        "SKU",
        "Product",
        "Finish",
        "Do this",
        "Our price",
        "Floor price",
        "On hand",
        "Has photo",
        "Your answer",
    ]
    for c, h in enumerate(headers, 1):
        ws.cell(1, c, h)
    fills = {
        "orange": FILL_ORANGE,
        "yellow": FILL_YELLOW,
        "blue": FILL_BLUE,
        "pink": FILL_PINK,
    }
    for i, r in enumerate(rows, 2):
        vals = [
            r["status"],
            r["task"],
            r["sku"],
            r["product"],
            r["finish"],
            r["do"],
            r["our_price"],
            r["floor_price"],
            r["on_hand"],
            r["has_photo"],
            r["your_answer"],
        ]
        row_fill = fills.get(r["fill"], FILL_YELLOW)
        for c, v in enumerate(vals, 1):
            cell = ws.cell(i, c, v)
            fill = FILL_YELLOW if c == 11 else (FILL_CREAM if c == 1 else row_fill)
            font = FONT_BODY if c != 6 else FONT_SMALL
            paint(cell, fill, font)
        ws.row_dimensions[i].height = 48
        ws.cell(i, 3).number_format = "@"
        ws.cell(i, 7).number_format = '"$"#,##0'
        ws.cell(i, 8).number_format = '"$"#,##0'
        ws.cell(i, 9).number_format = "#,##0"

    style_header(ws, len(headers))
    widths = [12, 16, 22, 16, 28, 62, 12, 13, 11, 12, 28]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w

    status = DataValidation(type="list", formula1='"To do,Done,Skip,Ask Chris"', allow_blank=False)
    status.add("A2:A500")
    ws.add_data_validation(status)
    task = DataValidation(
        type="list",
        formula1='"Confirm match,Confirm SKU,Give it a SKU,Fix fake SKU,Fill in cost,Need a photo"',
        allow_blank=True,
    )
    # don't force task edits; skip adding restrictive validation on task

    # Done rows turn green
    green_rule = FormulaRule(formula=['$A2="Done"'], fill=FILL_GREEN)
    ws.conditional_formatting.add(f"A2:K{len(rows)+1}", green_rule)
    skip_rule = FormulaRule(formula=['$A2="Skip"'], fill=PatternFill("solid", fgColor="E5E1DB"))
    ws.conditional_formatting.add(f"A2:K{len(rows)+1}", skip_rule)

    ws.auto_filter.ref = f"A1:K{len(rows)+1}"
    ws.freeze_panes = "A2"
    ws.auto_filter.add_sort_condition("B2:B500")
    ws.oddFooter.left.text = "Your work  ·  type in the yellow Your answer column"
    ws.sheet_view.showGridLines = False


def write_all(ws, catalog, photographed: set[str]):
    ws.sheet_properties.tabColor = "8A7A6A"
    headers = [
        "SKU",
        "Product",
        "Type",
        "Finish",
        "Our price",
        "Cost",
        "On hand",
        "Width",
        "Depth",
        "Height",
        "Bar",
        "Counter",
        "Weight",
        "Has photo",
        "Notes",
    ]
    keys = [
        "sku",
        "name",
        "category",
        "hide",
        "price",
        "cost",
        "on_hand",
        "width_in",
        "depth_in",
        "height_in",
        "bar_height",
        "counter_height",
        "weight_lb",
    ]
    for c, h in enumerate(headers, 1):
        ws.cell(1, c, h)
    for i, r in enumerate(catalog, 2):
        sku = r["sku"]
        vals = [r.get(k) for k in keys]
        # friendlier type names
        cat = {
            "bar-stools": "Bar stool",
            "dining-chairs": "Dining chair",
            "accent-chairs": "Accent chair",
            "office-chairs": "Office chair",
            "sofas": "Sofa / bed",
            "ottomans": "Ottoman",
            "pet-and-accessories": "Pet / accessory",
        }.get(str(vals[2] or ""), vals[2] or "")
        vals[2] = cat
        vals.append("Yes" if has_photo(sku, photographed) else "No")
        vals.append(r.get("notes") or "")
        for c, v in enumerate(vals, 1):
            cell = ws.cell(i, c, v)
            paint(cell, FILL_WHITE, FONT_SMALL)
            if c in (5, 6) and v not in ("", None):
                cell.number_format = '"$"#,##0.00'
        ws.cell(i, 1).number_format = "@"
        if vals[-2] == "No" and sku != "99999999":
            ws.cell(i, 14).fill = FILL_YELLOW
        if money(r.get("cost")) is None and not str(sku).startswith("NEW-") and r.get("name") == "Smith":
            ws.cell(i, 6).fill = FILL_YELLOW
        ws.row_dimensions[i].height = 20

    style_header(ws, len(headers))
    widths = [16, 16, 16, 32, 12, 10, 10, 10, 10, 10, 10, 11, 10, 12, 40]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.auto_filter.ref = f"A1:O{len(catalog)+1}"
    ws.oddFooter.left.text = "All products  ·  lookup only"


def main() -> None:
    catalog = load_catalog()
    photographed = set()
    if MANIFEST.exists():
        photographed = set(json.loads(MANIFEST.read_text()).get("product", {}).keys())
    work = build_work_rows(catalog, photographed)

    wb = Workbook()
    start = wb.active
    start.title = "Start here"
    write_start(start, len(work))

    your = wb.create_sheet("Your work")
    write_work(your, work)

    allp = wb.create_sheet("All products")
    write_all(allp, catalog, photographed)

    wb.views[0].activeTab = 0
    for path in OUTS:
        path.parent.mkdir(parents=True, exist_ok=True)
        wb.save(path)
        print("wrote", path, "work rows", len(work), "catalog", len(catalog))


if __name__ == "__main__":
    main()
