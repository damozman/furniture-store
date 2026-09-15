#!/usr/bin/env python3
"""Pull pictures out of an .xlsx and tag them with the Item name on that row.

GitHub rejects files over 100 MB. Workbooks with embedded photos often blow that
limit. Run this on the workbook, then commit the folder it writes — not the xlsx.

Usage (from the repo root):

    python data/scripts/extract_xlsx_images.py "docs/Sunset Sage current inventory 8_15_2026.xlsx"

Writes:

    docs/sunset-sage/inventory.csv
    docs/sunset-sage/images/<item-slug>.jpg
"""

from __future__ import annotations

import argparse
import csv
import re
import zipfile
from collections import defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "xdr": "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing",
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "pr": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def slug(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "item"


def col_letters_to_idx(letters: str) -> int:
    n = 0
    for ch in letters.upper():
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def load_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    name = "xl/sharedStrings.xml"
    if name not in zf.namelist():
        return []
    root = ET.fromstring(zf.read(name))
    out: list[str] = []
    for si in root.findall("main:si", NS):
        text = "".join(t.text or "" for t in si.findall(".//main:t", NS))
        out.append(text)
    return out


def sheet_cells(zf: zipfile.ZipFile, shared: list[str]) -> dict[tuple[int, int], str]:
    sheet_name = next(
        (n for n in zf.namelist() if re.match(r"xl/worksheets/sheet\d+\.xml$", n)),
        None,
    )
    if not sheet_name:
        return {}
    root = ET.fromstring(zf.read(sheet_name))
    cells: dict[tuple[int, int], str] = {}
    for c in root.findall(".//main:c", NS):
        ref = c.get("r") or ""
        m = re.match(r"([A-Z]+)(\d+)$", ref)
        if not m:
            continue
        col = col_letters_to_idx(m.group(1))
        row = int(m.group(2)) - 1
        v = c.find("main:v", NS)
        is_ = c.find("main:is", NS)
        if c.get("t") == "s" and v is not None and v.text:
            val = shared[int(v.text)]
        elif c.get("t") == "inlineStr" and is_ is not None:
            val = "".join(t.text or "" for t in is_.findall(".//main:t", NS))
        elif v is not None and v.text:
            val = v.text
        else:
            val = ""
        cells[(row, col)] = val.strip()
    return cells


def rels_map(zf: zipfile.ZipFile, rels_path: str) -> dict[str, str]:
    if rels_path not in zf.namelist():
        return {}
    root = ET.fromstring(zf.read(rels_path))
    out: dict[str, str] = {}
    base = str(Path(rels_path).parent.parent).as_posix()
    if base == ".":
        base = "xl"
    for rel in root:
        rid = rel.get("Id")
        target = rel.get("Target")
        if not rid or not target:
            continue
        if target.startswith("/"):
            out[rid] = target.lstrip("/")
        else:
            joined = (Path(base) / target).as_posix()
            while "/../" in joined:
                joined = re.sub(r"[^/]+/\.\./", "", joined)
            if not joined.startswith("xl/"):
                joined = "xl/" + joined.lstrip("/")
            out[rid] = joined
    return out


def drawing_anchors(zf: zipfile.ZipFile) -> list[tuple[int, str]]:
    hits: list[tuple[int, str]] = []
    drawings = [
        n for n in zf.namelist() if n.startswith("xl/drawings/drawing") and n.endswith(".xml")
    ]
    for drawing in drawings:
        rels = rels_map(
            zf, str(Path(drawing).parent / "_rels" / (Path(drawing).name + ".rels"))
        )
        root = ET.fromstring(zf.read(drawing))
        for anchor in list(root):
            frm = anchor.find("xdr:from", NS)
            if frm is None:
                continue
            row_el = frm.find("xdr:row", NS)
            if row_el is None or row_el.text is None:
                continue
            row = int(row_el.text)
            blip = anchor.find(".//a:blip", NS)
            if blip is None:
                continue
            rid = blip.get(
                "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed"
            )
            media = rels.get(rid or "")
            if media:
                hits.append((row, media))
    return hits


def header_map(cells: dict[tuple[int, int], str]) -> dict[str, int]:
    cols: dict[str, int] = {}
    for (row, col), val in cells.items():
        if row != 0:
            continue
        key = re.sub(r"[^a-z0-9]+", "", val.lower())
        if key:
            cols[key] = col
    return cols


def pick_col(headers: dict[str, int], *names: str, fallback: int) -> int:
    for n in names:
        if n in headers:
            return headers[n]
    return fallback


def unique_name(dest: Path, base: str, ext: str) -> Path:
    candidate = dest / f"{base}{ext}"
    i = 2
    while candidate.exists():
        candidate = dest / f"{base}-{i}{ext}"
        i += 1
    return candidate


def extract(src: Path, out_dir: Path) -> Path:
    out_images = out_dir / "images"
    out_images.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(src) as zf:
        shared = load_shared_strings(zf)
        cells = sheet_cells(zf, shared)
        anchors = drawing_anchors(zf)
        headers = header_map(cells)
        item_c = pick_col(headers, "item", "name", "product", "description", fallback=0)
        qty_c = pick_col(headers, "quantity", "qty", "onhand", "stock", fallback=2)
        price_c = pick_col(headers, "price", "retail", fallback=3)

        photos_by_row: dict[int, list[str]] = defaultdict(list)
        used_media: set[str] = set()
        for row, media in anchors:
            if media not in zf.namelist():
                alt = "xl/media/" + Path(media).name
                media = alt if alt in zf.namelist() else media
            if media not in zf.namelist():
                print(f"missing media {media} (row {row + 1})")
                continue
            item = cells.get((row, item_c), "") or f"row-{row + 1}"
            ext = Path(media).suffix.lower() or ".bin"
            dest = unique_name(out_images, slug(item), ext)
            dest.write_bytes(zf.read(media))
            rel = dest.relative_to(out_dir).as_posix()
            photos_by_row[row].append(rel)
            used_media.add(media)
            print(f"row {row + 1:>4}  {item:40}  {rel}")

        leftover = [
            n for n in zf.namelist() if n.startswith("xl/media/") and n not in used_media
        ]
        for media in leftover:
            dest = unique_name(out_images, "untagged", Path(media).suffix.lower() or ".bin")
            dest.write_bytes(zf.read(media))
            print(f"untagged media -> {dest.name}")

    max_row = max((r for r, _ in cells), default=0)
    csv_path = out_dir / "inventory.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["row", "item", "quantity", "price", "photo", "photo_2", "photo_3"],
        )
        w.writeheader()
        for row in range(1, max_row + 1):
            item = cells.get((row, item_c), "")
            photos = photos_by_row.get(row, [])
            if not item and not photos:
                continue
            w.writerow(
                {
                    "row": row + 1,
                    "item": item,
                    "quantity": cells.get((row, qty_c), ""),
                    "price": cells.get((row, price_c), ""),
                    "photo": photos[0] if photos else "",
                    "photo_2": photos[1] if len(photos) > 1 else "",
                    "photo_3": photos[2] if len(photos) > 2 else "",
                }
            )
    return csv_path


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("xlsx", type=Path, help="Workbook with embedded pictures")
    p.add_argument("-o", "--out", type=Path, default=None, help="Output folder")
    args = p.parse_args()
    src = args.xlsx.expanduser().resolve()
    if not src.exists():
        raise SystemExit(f"not found: {src}")
    out = (args.out or src.parent / "sunset-sage").resolve()
    csv_path = extract(src, out)
    print(f"\nWrote {csv_path}")
    print("Commit docs/sunset-sage/ — do not commit the original .xlsx.")


if __name__ == "__main__":
    main()
