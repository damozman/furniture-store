"""Extract product captions and imagery from the Saddle & Hide catalog PDFs.

Layout contract (verified against several pages): each product is an image with a
caption block directly beneath it -- name (large font), variant, SKU, optional
dimensions. Images with no caption beneath them are editorial/lifestyle shots.

Outputs:
  out/catalog.json          per-page products + editorial imagery
  out/images/product/       CMYK->RGB converted product shots
  out/images/editorial/     lifestyle shots
"""
import json
import re
import sys
from pathlib import Path

import pymupdf

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\chris\Downloads\Catalog")
OUT = Path(__file__).resolve().parent.parent / "out"
IMG_PROD = OUT / "images" / "product"
IMG_EDIT = OUT / "images" / "editorial"

SKU_RE = re.compile(r"^[\d]{4,10}$")
DIMS_RE = re.compile(r"\b[HWD]\d|\bSH\d|\bBar:|\bCounter:", re.I)
NAME_SIZE_MIN = 12.0
JUNK_RE = re.compile(r"\.com|@|\(\d{3}\)|^\d[\d\s\-]+$", re.I)
CAPTION_GAP = 220.0


def lines_with_style(page):
    """Flatten the page into lines carrying bbox and max font size."""
    out = []
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            text = "".join(s["text"] for s in line["spans"]).strip()
            if not text:
                continue
            out.append({
                "text": re.sub(r"\s+", " ", text),
                "bbox": line["bbox"],
                "size": max(s["size"] for s in line["spans"]),
                "bold": any("bold" in s["font"].lower() for s in line["spans"]),
            })
    return sorted(out, key=lambda l: (round(l["bbox"][1], 1), l["bbox"][0]))


def _cx(bbox):
    return (bbox[0] + bbox[2]) / 2


def cluster_captions(lines, page_height):
    """Group lines into caption blocks, column-aware.

    The catalog is a two-column grid, so pure reading order steals a left-column
    product's detail lines for the right-column product on the same row. Instead
    each name line is an anchor, and every detail line attaches to the nearest
    anchor above it *in its own column*.
    """
    body = [ln for ln in lines
            if not (ln["bbox"][3] > page_height - 60 and len(ln["text"]) <= 3)]

    names = [ln for ln in body if ln["size"] >= NAME_SIZE_MIN and ln["bold"]]
    name_ids = {id(ln) for ln in names}
    details = [ln for ln in body if id(ln) not in name_ids]

    # Merge wrapped name lines: same column, stacked tight.
    merged = []
    for ln in sorted(names, key=lambda l: (round(_cx(l["bbox"])), l["bbox"][1])):
        if merged:
            prev = merged[-1]
            if (abs(_cx(prev["bbox"]) - _cx(ln["bbox"])) < 40
                    and 0 <= ln["bbox"][1] - prev["bbox"][3] < 8):
                prev["text"] += " " + ln["text"]
                prev["bbox"] = [min(prev["bbox"][0], ln["bbox"][0]),
                                min(prev["bbox"][1], ln["bbox"][1]),
                                max(prev["bbox"][2], ln["bbox"][2]),
                                max(prev["bbox"][3], ln["bbox"][3])]
                continue
        merged.append({"text": ln["text"], "bbox": list(ln["bbox"])})

    groups = [{"name": m["text"], "lines": [], "bbox": list(m["bbox"])}
              for m in merged]

    for ln in details:
        x0, y0, x1, y1 = ln["bbox"]
        best, best_gap = None, None
        for g in groups:
            gap = y0 - g["bbox"][3]
            if gap < -2 or gap > 60:
                continue
            if abs(_cx(g["bbox"]) - _cx(ln["bbox"])) > 160:
                continue
            if best_gap is None or gap < best_gap:
                best, best_gap = g, gap
        if best is None:
            continue
        best["lines"].append(ln["text"])
        best["bbox"][0] = min(best["bbox"][0], x0)
        best["bbox"][1] = min(best["bbox"][1], y0)
        best["bbox"][2] = max(best["bbox"][2], x1)
        best["bbox"][3] = max(best["bbox"][3], y1)

    return sorted(groups, key=lambda g: (round(g["bbox"][1], 1), g["bbox"][0]))


def parse_caption(group):
    sku, dims, variant_parts = None, [], []
    for raw in group["lines"]:
        for part in [p.strip() for p in raw.split("|")]:
            if not part:
                continue
            if SKU_RE.match(part.replace(" ", "")):
                sku = part.replace(" ", "")
            elif DIMS_RE.search(part):
                dims.append(part)
            else:
                variant_parts.append(part)
    return {
        "name": group["name"],
        "variant": ", ".join(variant_parts) or None,
        "sku": sku,
        "dimensions": " / ".join(dims) or None,
        "bbox": group["bbox"],
    }


def page_images(doc, page):
    seen, out = set(), []
    for info in page.get_images(full=True):
        xref = info[0]
        if xref in seen:
            continue
        seen.add(xref)
        rects = page.get_image_rects(xref)
        if not rects:
            continue
        rect = max(rects, key=lambda r: r.width * r.height)
        out.append({"xref": xref, "rect": rect, "w": info[2], "h": info[3]})
    return out


def assign_images(captions, images):
    """Assign at most one image per caption, page-wide.

    Image bboxes carry transparent padding, so an image's box routinely overlaps
    the caption beneath it -- vertical gap alone can't decide. Horizontal centring
    is the reliable signal: a caption sits under its own image's column. Score all
    plausible pairs, then take them greedily so each image is claimed once.
    """
    pairs = []
    for ci, cap in enumerate(captions):
        cx0, cy0, cx1, _ = cap["bbox"]
        ccx = (cx0 + cx1) / 2
        for ii, im in enumerate(images):
            r = im["rect"]
            if not (r.x0 - 15 <= ccx <= r.x1 + 15):
                continue
            if r.y0 >= cy0:
                continue  # image must begin above the caption
            dy = cy0 - r.y1
            if dy > CAPTION_GAP:
                continue
            score = abs(dy) * 0.3 + abs(ccx - (r.x0 + r.x1) / 2)
            pairs.append((score, ci, ii))

    pairs.sort()
    taken_cap, taken_im, out = set(), set(), {}
    for score, ci, ii in pairs:
        if ci in taken_cap or ii in taken_im:
            continue
        taken_cap.add(ci)
        taken_im.add(ii)
        out[ci] = images[ii]
    return out


def save_image(doc, xref, dest):
    pix = pymupdf.Pixmap(doc, xref)
    if pix.colorspace and pix.colorspace.n >= 4:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    if pix.alpha:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    dest.parent.mkdir(parents=True, exist_ok=True)
    pix.save(dest)
    pix = None


def main():
    IMG_PROD.mkdir(parents=True, exist_ok=True)
    IMG_EDIT.mkdir(parents=True, exist_ok=True)
    pages_out = []

    pdfs = sorted(SRC.glob("page*.pdf"),
                  key=lambda p: int(re.search(r"\d+", p.stem).group()))
    for pdf in pdfs:
        num = int(re.search(r"\d+", pdf.stem).group())
        doc = pymupdf.open(pdf)
        page = doc[0]
        images = page_images(doc, page)
        captions = [parse_caption(g)
                    for g in cluster_captions(lines_with_style(page), page.rect.height)]

        captions = [c for c in captions if not JUNK_RE.search(c["name"])]
        assigned = assign_images(captions, images)
        used, products = set(), []
        for ci, cap in enumerate(captions):
            im = assigned.get(ci)
            if not cap["sku"] and im is None:
                continue  # masthead / contact text, not a product
            rec = {k: cap[k] for k in ("name", "variant", "sku", "dimensions")}
            rec["page"] = num
            rec["flags"] = []
            if not cap["sku"]:
                rec["flags"].append("missing-sku")
            elif not re.fullmatch(r"\d{8}", cap["sku"]):
                rec["flags"].append(f"sku-not-8-digits:{cap['sku']}")
            if im:
                used.add(im["xref"])
                fn = f"p{num:02d}-x{im['xref']}.png"
                save_image(doc, im["xref"], IMG_PROD / fn)
                rec["image"] = {"file": f"product/{fn}", "w": im["w"], "h": im["h"]}
            else:
                rec["image"] = None
                rec["flags"].append("no-image")
            products.append(rec)

        editorial = []
        for im in images:
            if im["xref"] in used:
                continue
            if im["w"] < 500 or im["h"] < 500:
                continue
            fn = f"p{num:02d}-x{im['xref']}.png"
            save_image(doc, im["xref"], IMG_EDIT / fn)
            editorial.append({"file": f"editorial/{fn}", "w": im["w"], "h": im["h"]})

        pages_out.append({"page": num, "products": products, "editorial": editorial})
        doc.close()
        print(f"page {num:2d}: {len(products)} products, {len(editorial)} editorial")

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "catalog.json").write_text(
        json.dumps(pages_out, indent=2), encoding="utf8")

    total_p = sum(len(p["products"]) for p in pages_out)
    total_e = sum(len(p["editorial"]) for p in pages_out)
    matched = sum(1 for p in pages_out for x in p["products"] if x["image"])
    with_sku = sum(1 for p in pages_out for x in p["products"] if x["sku"])
    print(f"\n{total_p} captions | {with_sku} with SKU | {matched} image-matched "
          f"| {total_e} editorial images")


if __name__ == "__main__":
    main()
