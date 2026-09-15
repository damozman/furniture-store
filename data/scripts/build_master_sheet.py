#!/usr/bin/env python3
"""Fold Sunset Sage inventory into the Furniture Information Sheet.

The Sage workbook is retired. Images stay in docs/sunset-sage/images/.
This writes docs/Furniture Information Sheet.xlsx — the only data master.
"""

from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

import xlrd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "docs" / "Furniture Information Sheet.xls"
CROSS = ROOT / "docs" / "sunset-sage" / "crosswalk.csv"
OUT = ROOT / "docs" / "Furniture Information Sheet.xlsx"

# New rows that are not on the master. Temporary SKUs until real numbers exist.
NEW_ROWS = [
    {
        "sku": "NEW-SCOTT-BLACK",
        "name": "Scott",
        "slug": "scott",
        "category": "bar-stools",
        "hide": "Black",
        "price": 400,
        "ss_item": 'Scott Barstool black 25"',
        "ss_row": 25,
        "match": "new",
        "notes": "Not on master. 25\" height. Assign a real SKU.",
    },
    {
        "sku": "NEW-SCOTT-BROWN",
        "name": "Scott",
        "slug": "scott",
        "category": "bar-stools",
        "hide": "Brown",
        "price": 400,
        "ss_item": 'Scott Barstool brown 25"',
        "ss_row": 26,
        "match": "new",
        "notes": "Not on master. 25\" height. Assign a real SKU.",
    },
    {
        "sku": "NEW-SCOTT-CAMEL",
        "name": "Scott",
        "slug": "scott",
        "category": "bar-stools",
        "hide": "Camel",
        "price": 400,
        "ss_item": 'Scott Barstool camel 25"',
        "ss_row": 27,
        "match": "new",
        "notes": "Not on master. 25\" height. Assign a real SKU.",
    },
    {
        "sku": "30190002",
        "name": "Smith",
        "slug": "smith",
        "category": "bar-stools",
        "hide": "Tufted White Croc",
        "price": 200,
        "ss_item": "Smith barstool tufted white croc",
        "ss_row": 28,
        "match": "review",
        "notes": "Photographed catalog SKU 30190002 was missing from the master. Confirm.",
    },
    {
        "sku": "NEW-DAKOTA-BROWN",
        "name": "Dakota",
        "slug": "dakota",
        "category": "dining-chairs",
        "hide": "Brown front, hide back",
        "price": 500,
        "ss_item": "Dakota dining chair Brown front hide back",
        "ss_row": 31,
        "match": "new",
        "notes": "Master only had Dakota Black Hide. Assign a real SKU.",
    },
    {
        "sku": "NEW-SADDLE-BLACK-CROC",
        "name": "Saddle",
        "slug": "saddle",
        "category": "bar-stools",
        "hide": "Black Croc",
        "price": 350,
        "ss_item": "Saddle barstool Black croc",
        "ss_row": 43,
        "match": "new",
        "notes": "Not on master (brown/white/blue/red croc exist). Assign a real SKU.",
    },
    {
        "sku": "NEW-ARC-OLIVA",
        "name": "Arc",
        "slug": "arc",
        "category": "accent-chairs",
        "hide": "Brown, Oliva cowhide back",
        "price": 1500,
        "ss_item": "Arc accent chair brown Oliva cowhide back",
        "ss_row": 45,
        "match": "new",
        "notes": "Model not on master. Assign a real SKU.",
    },
    {
        "sku": "NEW-CHELSEA",
        "name": "Chelsea",
        "slug": "chelsea",
        "category": "bar-stools",
        "hide": "",
        "price": 700,
        "ss_item": "Chelsea barstool",
        "ss_row": 56,
        "match": "new",
        "notes": "Model not on master. Assign a real SKU.",
    },
    {
        "sku": "NEW-HORN-TUFTED-BROWN",
        "name": "Horn",
        "slug": "horn",
        "category": "office-chairs",
        "hide": "Tufted Brown",
        "price": 1500,
        "ss_item": "Horn Office chair Tufted Brown",
        "ss_row": 61,
        "match": "new",
        "notes": "Master Horn is only white/brown croc. Assign a real SKU.",
    },
    {
        "sku": "NEW-BETHANY-ARMS-LOREDO",
        "name": "Bethany",
        "slug": "bethany",
        "category": "bar-stools",
        "hide": "With arms, Loredo tooled",
        "price": 600,
        "ss_item": "Bethany tooled WITH arms LOREDO",
        "ss_row": 65,
        "match": "new",
        "notes": "Master Loredo is no-arms. Assign a real SKU.",
    },
    {
        "sku": "NEW-BROOKE-BAR-BLACK",
        "name": "Brooke",
        "slug": "brooke",
        "category": "bar-stools",
        "hide": "Black",
        "price": 400,
        "ss_item": "Brooke Black Barstool",
        "ss_row": 67,
        "match": "new",
        "notes": "Barstool, not dining. Assign a real SKU.",
    },
    {
        "sku": "NEW-BETHANY-ARMS-SPRINGBUCK",
        "name": "Bethany",
        "slug": "bethany",
        "category": "bar-stools",
        "hide": "With arms, Springbuck",
        "price": 700,
        "ss_item": "Bethany barstool With arms Springbuck",
        "ss_row": 69,
        "match": "new",
        "notes": "Not on master. Assign a real SKU.",
    },
    {
        "sku": "NEW-JACK-TURQ-HIDE",
        "name": "Jack Square",
        "slug": "jack-square",
        "category": "ottomans",
        "hide": "Cowhide, turquoise trim",
        "price": 1200,
        "ss_item": "Jack Ottoman Cowhide turquoise trim",
        "ss_row": 78,
        "match": "new",
        "notes": "Not on master. Assign a real SKU.",
    },
    {
        "sku": "NEW-HALFMOON",
        "name": "Half Moon",
        "slug": "half-moon",
        "category": "ottomans",
        "hide": "Tufted",
        "price": 500,
        "ss_item": "Half moon tufted ottoman",
        "ss_row": 79,
        "match": "new",
        "notes": "Not on master. Assign a real SKU.",
    },
    {
        "sku": "NEW-TEXAS-KING",
        "name": "Texas King",
        "slug": "texas-king",
        "category": "sofas",
        "hide": "",
        "price": 5000,
        "ss_item": "Texas King Bed",
        "ss_row": 81,
        "match": "new",
        "notes": "Bed — not on master. Assign a real SKU and confirm category.",
    },
    {
        "sku": "NEW-DAKOTA-TAUPE",
        "name": "Dakota",
        "slug": "dakota",
        "category": "dining-chairs",
        "hide": "Taupe",
        "price": 500,
        "ss_item": "Dakota dining chair Taupe",
        "ss_row": 99,
        "match": "new",
        "notes": "Not on master. Assign a real SKU.",
    },
]


def sku_key(raw) -> str:
    s = str(raw).strip()
    try:
        if float(s) == int(float(s)):
            return str(int(float(s)))
    except Exception:
        pass
    return s


def num(v):
    if v in ("", None):
        return None
    try:
        return float(v)
    except Exception:
        return None


def qty(v):
    try:
        return float(str(v).split()[0])
    except Exception:
        return 0.0


HEADER_FILL = PatternFill("solid", fgColor="2C2416")
HEADER_FONT = Font(bold=True, color="F4EFE6", name="Calibri")
BODY = Font(name="Calibri", size=11, color="2C2416")
GREEN = PatternFill("solid", fgColor="D9E8D3")
ORANGE = PatternFill("solid", fgColor="F7D7B5")
YELLOW = PatternFill("solid", fgColor="F6E7B2")
BLUE = PatternFill("solid", fgColor="D6E3F0")
GREY = PatternFill("solid", fgColor="EEEAE3")
THIN = Border(
    left=Side(style="thin", color="E8E0D4"),
    right=Side(style="thin", color="E8E0D4"),
    top=Side(style="thin", color="E8E0D4"),
    bottom=Side(style="thin", color="E8E0D4"),
)
MATCH_FILL = {"high": GREEN, "medium": ORANGE, "review": YELLOW, "new": BLUE}


def style_header(ws, n):
    for c in range(1, n + 1):
        cell = ws.cell(1, c)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(vertical="center", wrap_text=True)
    ws.row_dimensions[1].height = 22
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:{get_column_letter(n)}{ws.max_row}"


def write_row(ws, r, vals, fill=None):
    for c, v in enumerate(vals, 1):
        cell = ws.cell(r, c, v)
        cell.font = BODY
        cell.border = THIN
        cell.alignment = Alignment(vertical="center", wrap_text=True)
        if fill:
            cell.fill = fill


def load_xls():
    wb = xlrd.open_workbook(SRC)
    sh = wb.sheet_by_name("Catalog")
    headers = [sh.cell_value(0, c) for c in range(sh.ncols)]
    rows = []
    for r in range(1, sh.nrows):
        d = {headers[c]: sh.cell_value(r, c) for c in range(sh.ncols)}
        d["sku"] = sku_key(d["sku"])
        if str(d.get("category", "")).strip().lower() == "n":
            d["category"] = "dining-chairs"  # Dakota was mistyped
        rows.append(d)
    return rows


def load_crosswalk():
    return list(csv.DictReader(CROSS.open()))


def main() -> None:
    master = load_xls()
    xwalk = load_crosswalk()
    by_row = {int(r["ss_row"]): r for r in xwalk}

    # Aggregate Sunset Sage onto SKU
    agg = defaultdict(lambda: {"qty": 0.0, "photos": [], "ss_items": [], "ss_price": None, "match": "", "notes": []})
    for r in xwalk:
        sku = r["sku"].strip()
        if not sku:
            continue
        a = agg[sku]
        a["qty"] += qty(r["ss_qty"])
        if r["ss_photo"] and r["ss_photo"] not in a["photos"]:
            a["photos"].append(r["ss_photo"])
        a["ss_items"].append(r["ss_item"])
        a["ss_price"] = num(r["ss_price"])
        # worst-to-best match label: keep high if any high
        order = {"new": 0, "review": 1, "medium": 2, "high": 3}
        if order.get(r["match"], -1) >= order.get(a["match"], -1):
            a["match"] = r["match"]
        if r["notes"]:
            a["notes"].append(r["notes"])

    catalog_cols = [
        "sku",
        "name",
        "slug",
        "category",
        "hide",
        "price",
        "cost",
        "width_in",
        "depth_in",
        "bar_height",
        "counter_height",
        "height_in",
        "weight_lb",
        "description",
        "lead_time_days",
        "on_hand",
        "ss_price",
        "photo",
        "photo_2",
        "match",
        "ss_item",
        "notes",
    ]

    def blank_row():
        return {k: "" for k in catalog_cols}

    out = []
    seen = set()
    for m in master:
        row = blank_row()
        row.update(
            {
                "sku": m["sku"],
                "name": m["name"],
                "slug": m["slug"],
                "category": m["category"],
                "hide": m["hide"],
                "price": num(m["price"]),
                "cost": num(m["cost"]),
                "width_in": num(m["width_in"]),
                "depth_in": num(m["depth_in"]),
                "bar_height": m.get("bar height", ""),
                "counter_height": m.get("counter height", ""),
                "height_in": num(m["height_in"]),
                "weight_lb": num(m["weight_lb"]),
                "description": m["description"],
                "lead_time_days": num(m["lead_time_days"]),
            }
        )
        extra = agg.get(m["sku"])
        if extra:
            row["on_hand"] = extra["qty"] or ""
            row["ss_price"] = extra["ss_price"]
            row["photo"] = extra["photos"][0] if extra["photos"] else ""
            row["photo_2"] = extra["photos"][1] if len(extra["photos"]) > 1 else ""
            row["match"] = extra["match"]
            row["ss_item"] = " | ".join(extra["ss_items"])
            row["notes"] = " | ".join(dict.fromkeys(extra["notes"]))
            seen.add(m["sku"])
        out.append(row)

    # Append new / review SKUs not already on master
    by_sku = {r["sku"]: r for r in out}
    for n in NEW_ROWS:
        x = by_row[n["ss_row"]]
        if n["sku"] in by_sku:
            # already on master (shouldn't happen for NEW-*)
            continue
        row = blank_row()
        row.update(
            {
                "sku": n["sku"],
                "name": n["name"],
                "slug": n["slug"],
                "category": n["category"],
                "hide": n["hide"],
                "price": n["price"],
                "ss_price": num(x["ss_price"]),
                "on_hand": qty(x["ss_qty"]),
                "photo": x["ss_photo"],
                "match": n["match"],
                "ss_item": n["ss_item"],
                "notes": n["notes"],
                "description": n["ss_item"],
            }
        )
        out.append(row)

    wb = Workbook()

    # --- To complete (first tab) ---
    tc = wb.active
    tc.title = "To complete"
    tc["A1"] = "What is left"
    tc["A1"].font = Font(name="Calibri", size=20, bold=True, color="2C2416")
    tc.merge_cells("A1:D1")
    tc["A2"] = (
        "Sunset Sage is done — photos are tagged and on-hand is on the Catalog tab. "
        "Do not import the Sage workbook again. Work this list, then the site can take the sheet."
    )
    tc["A2"].alignment = Alignment(wrap_text=True)
    tc.merge_cells("A2:D2")
    tc.row_dimensions[2].height = 36

    leftovers = [
        ("1. Confirm medium matches", "Catalog tab, filter Match = medium", "18 SKUs — hide is close, not exact"),
        ("2. Assign real SKUs to NEW-* rows", "Catalog tab, filter SKU starts with NEW-", "15 items that were only at Sunset Sage"),
        ("3. Confirm Smith white croc SKU 30190002", "Catalog tab, Match = review", "Was photographed, missing from the old master"),
        ("4. Price policy", "Filter Notes for “vs”", "Many Saddle / stool prices differ ($350 vs $300, etc.)"),
        ("5. Brooke barstool SKU 11111", "sku 11111", "Placeholder — needs a real number"),
        ("6. Invalid SKUs still on the master", "000001 / 00002 / 00003 Levi, 123456 Murphy, SANTA-FE", "Need real SKUs"),
        ("7. Smith cost", "Four Smith rows, cost blank", "Only remaining missing costs"),
        ("8. Dakota category", "Fixed n → dining-chairs on this sheet", "Done"),
    ]
    tc["A4"] = "Step"
    tc["B4"] = "Where"
    tc["C4"] = "Detail"
    for c in range(1, 4):
        tc.cell(4, c).fill = HEADER_FILL
        tc.cell(4, c).font = HEADER_FONT
    for i, rec in enumerate(leftovers, 5):
        for c, v in enumerate(rec, 1):
            tc.cell(i, c, v).font = BODY
            tc.cell(i, c).border = THIN
            if rec[0].startswith("8"):
                tc.cell(i, c).fill = GREEN
    for col, w in enumerate([42, 42, 62], 1):
        tc.column_dimensions[get_column_letter(col)].width = w

    tc["A15"] = "Ignore"
    tc["A15"].font = Font(bold=True, size=14)
    tc["A16"] = "The original Sunset Sage .xlsx (too big for Git, already extracted)."
    tc["A17"] = "docs/sunset-sage/images/ — keep; Catalog photo column points here."
    tc["A18"] = "Do not re-run the extract unless a new inventory dump arrives."

    # --- Catalog ---
    cat = wb.create_sheet("Catalog")
    for c, h in enumerate(catalog_cols, 1):
        cat.cell(1, c, h)
    for i, row in enumerate(out, 2):
        vals = [row[k] for k in catalog_cols]
        fill = MATCH_FILL.get(str(row["match"])) if row["match"] else None
        write_row(cat, i, vals, fill=None)
        if row["match"]:
            cat.cell(i, catalog_cols.index("match") + 1).fill = MATCH_FILL[row["match"]]
        # yellow empty cost/weight/photo on original-needed fields
        for col_name in ("cost", "weight_lb", "width_in", "height_in"):
            idx = catalog_cols.index(col_name) + 1
            if row[col_name] in ("", None):
                cat.cell(i, idx).fill = YELLOW
    style_header(cat, len(catalog_cols))
    widths = {
        "sku": 22,
        "name": 14,
        "slug": 14,
        "category": 18,
        "hide": 36,
        "description": 48,
        "ss_item": 42,
        "notes": 55,
        "photo": 42,
        "photo_2": 28,
        "match": 10,
    }
    for c, h in enumerate(catalog_cols, 1):
        cat.column_dimensions[get_column_letter(c)].width = widths.get(h, 12)

    # --- Medium ---
    med = wb.create_sheet("Medium — confirm")
    mh = ["sku", "name", "hide", "ss_item", "on_hand", "photo", "notes"]
    for c, h in enumerate(mh, 1):
        med.cell(1, c, h)
    i = 2
    for row in out:
        if row["match"] == "medium":
            write_row(med, i, [row[k] for k in mh], ORANGE)
            i += 1
    style_header(med, len(mh))
    for c, w in enumerate([14, 14, 36, 42, 12, 42, 55], 1):
        med.column_dimensions[get_column_letter(c)].width = w

    # --- New ---
    nw = wb.create_sheet("New — need SKUs")
    nh = ["sku", "name", "hide", "price", "on_hand", "ss_item", "photo", "notes"]
    for c, h in enumerate(nh, 1):
        nw.cell(1, c, h)
    i = 2
    for row in out:
        if row["match"] in ("new", "review"):
            write_row(nw, i, [row[k] for k in nh], BLUE if row["match"] == "new" else YELLOW)
            i += 1
    style_header(nw, len(nh))
    for c, w in enumerate([24, 14, 28, 10, 12, 42, 42, 55], 1):
        nw.column_dimensions[get_column_letter(c)].width = w

    # --- Price diffs ---
    pd = wb.create_sheet("Price differences")
    ph = ["sku", "name", "hide", "master_price", "ss_price", "on_hand", "ss_item"]
    for c, h in enumerate(ph, 1):
        pd.cell(1, c, h)
    i = 2
    for row in out:
        if row["price"] not in ("", None) and row["ss_price"] not in ("", None):
            if float(row["price"]) != float(row["ss_price"]):
                write_row(
                    pd,
                    i,
                    [row["sku"], row["name"], row["hide"], row["price"], row["ss_price"], row["on_hand"], row["ss_item"]],
                    YELLOW,
                )
                i += 1
    style_header(pd, len(ph))
    for c, w in enumerate([14, 14, 36, 14, 12, 12, 42], 1):
        pd.column_dimensions[get_column_letter(c)].width = w

    wb.save(OUT)
    n_hand = sum(1 for r in out if r["on_hand"] not in ("", None, 0, 0.0))
    n_photo = sum(1 for r in out if r["photo"])
    print(f"wrote {OUT} rows={len(out)} with_on_hand={n_hand} with_photo={n_photo}")


if __name__ == "__main__":
    main()
