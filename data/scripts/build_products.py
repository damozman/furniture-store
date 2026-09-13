"""Join the price list with extracted catalog data into the canonical product set.

The price list is authoritative for what is sellable and what it costs. The catalog
is authoritative for imagery and dimensions. Joining them on SKU both builds the
product data and validates the PDF extraction: a caption SKU that matches a price
list SKU is strong evidence the caption parsed correctly.

Outputs:
  out/products.json     models -> variants, with imagery and price
  out/review.md         everything a human needs to decide on before import
"""
import difflib
import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from collections import defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent
OUT = DATA / "out"
# The price list lives in data/source/ beside the catalog (gitignored).
# Usage: build_products.py [price_list.xlsx]
PRICE_XLSX = (Path(sys.argv[1]) if len(sys.argv) > 1
              else DATA / "source" / "TBS Price List by Product.xlsx")
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

HIDES = [
    "Brown Croc", "White Croc", "Black Croc", "Croc", "Cowhide", "Brindle",
    "Springbok", "Springbuck", "Spring Buck", "Loredo", "Diamond Weave",
    "Diamond", "Weave", "Tufted", "Hide", "Taupe", "Ivory", "Turquoise",
    "Yolk", "Copper", "Tawny", "Valentina", "Axis", "Toffee",
]

CATEGORY_BY_PAGE = [
    (2, 26, "bar-stools"),
    (26, 34, "dining-chairs"),
    (34, 41, "accent-chairs"),
    (41, 43, "office-chairs"),
    (43, 44, "sofas"),
    (44, 45, "pet-and-accessories"),
    (45, 47, "ottomans"),
]

CATEGORY_BY_NAME = [
    (r"bar\s*stool|barstool|\bstool\b", "bar-stools"),
    (r"dining", "dining-chairs"),
    (r"accent", "accent-chairs"),
    (r"office", "office-chairs"),
    (r"sofa|sectional|throne|settee", "sofas"),
    (r"dog bed|bootjack|pet", "pet-and-accessories"),
    (r"ottoman|cube", "ottomans"),
]


def read_price_list():
    z = zipfile.ZipFile(PRICE_XLSX)
    shared = [
        "".join(t.text or "" for t in si.iter(
            "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"))
        for si in ET.fromstring(z.read("xl/sharedStrings.xml"))
    ]
    sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows = []
    for row in sheet.find("m:sheetData", NS):
        cells = {}
        for c in row:
            col = re.match(r"([A-Z]+)", c.get("r")).group(1)
            v = c.find("m:v", NS)
            if v is None:
                continue
            cells[col] = shared[int(v.text)] if c.get("t") == "s" else v.text
        rows.append(cells)
    out = []
    for r in rows[1:]:
        name = (r.get("A") or "").strip()
        if not name:
            continue
        out.append({
            "name": re.sub(r"\s+", " ", name),
            "sku": str(r.get("B", "")).strip(),
            "price": float(r.get("C") or 0),
        })
    return out


def category_for(name, page):
    low = name.lower()
    for pat, cat in CATEGORY_BY_NAME:
        if re.search(pat, low):
            return cat
    if page:
        for lo, hi, cat in CATEGORY_BY_PAGE:
            if lo <= page < hi:
                return cat
    return None


STOP_WORDS = set()
for _h in HIDES:
    STOP_WORDS.update(w.lower() for w in _h.split())
STOP_WORDS.update("""
bar barstool stool stools chair chairs dining accent office sofa sectional
ottoman cube dog bed pet bootjack throne settee leather front back arms
no top custom short tall piece brown white black red blue green tan
old all dark light grey gray legs armless floral round
""".split())


def model_of(name):
    """The frame name is the leading run of tokens before any material or
    category word. 'Smith Bar Stool Tufted Brown' -> 'Smith'."""
    tokens = re.sub(r"[,/]", " ", re.sub(r"\s+", " ", name)).strip().split()
    kept = []
    for t in tokens:
        bare = re.sub(r"[^A-Za-z]", "", t).lower()
        if not bare or bare in STOP_WORDS or re.fullmatch(r"\d+", t):
            break
        kept.append(t.strip(",/"))
    if not kept:
        kept = tokens[:2]  # e.g. 'Dog Bed ...', 'Spring Buck Ottoman'
    return " ".join(kept)


def hides_in(text):
    if not text:
        return []
    found, low = [], text.lower()
    for h in HIDES:
        if h.lower() in low and not any(h.lower() in f.lower() for f in found):
            found.append(h)
    return found


def main():
    price = read_price_list()
    pages = json.load(open(OUT / "catalog.json", encoding="utf8"))

    cat_by_sku, cat_no_sku = {}, []
    for pg in pages:
        for p in pg["products"]:
            if p["sku"]:
                cat_by_sku.setdefault(p["sku"], p)
            else:
                cat_no_sku.append(p)

    price_skus = {p["sku"] for p in price}
    matched, unmatched_price, orphan_catalog = [], [], []

    for row in price:
        cat = cat_by_sku.get(row["sku"])
        rec = dict(row)
        rec["page"] = cat["page"] if cat else None
        rec["image"] = cat["image"] if cat else None
        rec["dimensions"] = cat["dimensions"] if cat else None
        rec["catalog_name"] = cat["name"] if cat else None
        rec["catalog_variant"] = cat["variant"] if cat else None
        rec["model"] = model_of(cat["name"] if cat else row["name"])
        rec["category"] = category_for(
            (cat["name"] + " " + (cat["variant"] or "")) if cat else row["name"],
            rec["page"])
        rec["hides"] = hides_in(
            (cat["variant"] if cat else None) or row["name"])

        # Launch gating. Photography arrives on the client's inventory schedule,
        # so a variant without an image is authored but not published -- that keeps
        # every launch page looking complete. Legacy rows sell as a clearance tier
        # once they have photos; today only one of them does.
        rec["tier"] = ("clearance" if re.search(r"\bold\b", row["name"], re.I)
                       else "standard")
        rec["published"] = bool(rec["image"])
        if not rec["image"]:
            rec["hold_reason"] = "awaiting-photography"
        (matched if cat else unmatched_price).append(rec)

    for sku, p in cat_by_sku.items():
        if sku not in price_skus:
            orphan_catalog.append(p)

    models = defaultdict(list)
    for r in matched + unmatched_price:
        models[r["model"]].append(r)

    products = []
    for name, variants in sorted(models.items()):
        cats = [v["category"] for v in variants if v["category"]]
        live = [v for v in variants if v["published"]]
        products.append({
            "model": name,
            "slug": re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"),
            "category": max(set(cats), key=cats.count) if cats else None,
            "price_min": min(v["price"] for v in variants),
            "price_max": max(v["price"] for v in variants),
            "variant_count": len(variants),
            "with_image": len(live),
            "published": bool(live),
            "tier": ("clearance"
                     if variants and all(v["tier"] == "clearance" for v in variants)
                     else "standard"),
            "variants": sorted(variants, key=lambda v: v["name"]),
        })

    (OUT / "products.json").write_text(
        json.dumps({"models": products}, indent=2), encoding="utf8")

    # ---- review report ----
    L = ["# Product data review", "",
         f"- Price list SKUs: **{len(price)}**",
         f"- Models derived: **{len(products)}**",
         f"- Matched to a catalog photo: **{len(matched)}**",
         f"- Priced but **no catalog photo**: **{len(unmatched_price)}**",
         f"- Photographed but **not in price list**: **{len(orphan_catalog)}**", ""]

    L += ["## Decisions needed", ""]
    bad = [r for r in price if not re.fullmatch(r"\d{8}", r["sku"])]
    L += ["### Invalid SKUs", "", "| SKU | Product | Price |", "|---|---|---|"]
    L += [f"| `{r['sku']}` | {r['name']} | ${r['price']:,.0f} |" for r in bad] + [""]

    legacy = [r for r in price if re.search(r"\bold\b", r["name"], re.I)]
    if legacy:
        L += ["### Legacy rows", "",
              "| SKU | Product | Price |", "|---|---|---|"]
        L += [f"| `{r['sku']}` | {r['name']} | ${r['price']:,.0f} |"
              for r in legacy] + [""]

    if unmatched_price:
        L += [f"### Priced with no photo ({len(unmatched_price)})", "",
              "These cannot get a usable product page until photography exists.", "",
              "| SKU | Product | Price |", "|---|---|---|"]
        L += [f"| `{r['sku']}` | {r['name']} | ${r['price']:,.0f} |"
              for r in sorted(unmatched_price, key=lambda r: -r["price"])] + [""]

    if orphan_catalog:
        # A catalog SKU with no price-list match is either a typo of a real SKU or a
        # product that was photographed but never priced. Those need opposite fixes,
        # so separate them: a near-identical SKU *and* a near-identical name means typo.
        typos, unpriced = [], []
        for p in sorted(orphan_catalog, key=lambda p: p["page"]):
            near = difflib.get_close_matches(p["sku"], list(price_skus), n=1, cutoff=0.6)
            cand = near[0] if near else None
            cand_name = next((r["name"] for r in price if r["sku"] == cand), "")
            name_sim = (difflib.SequenceMatcher(
                None, p["name"].lower(), cand_name.lower()).ratio() if cand else 0)
            if cand and name_sim >= 0.55:
                typos.append((p, cand, cand_name))
            else:
                unpriced.append((p, cand, cand_name))

        if typos:
            L += [f"### Likely SKU typos ({len(typos)})", "",
                  "Catalog SKU differs from the price list by a digit while naming the "
                  "same product. **Confirm before merging** -- SKUs tie to inventory.", "",
                  "| Catalog SKU | Catalog product | Price list SKU | Price list product |",
                  "|---|---|---|---|"]
            L += [f"| `{p['sku']}` | {p['name']} {p['variant'] or ''} | `{c}` | {cn} |"
                  for p, c, cn in typos] + [""]

        if unpriced:
            L += [f"### Photographed but never priced ({len(unpriced)})", "",
                  "These exist as product photography with no price list entry. They "
                  "cannot be sold until someone prices them.", "",
                  "| SKU | Product | Variant | Page |", "|---|---|---|---|"]
            L += [f"| `{p['sku']}` | {p['name']} | {p['variant'] or '-'} | {p['page']} |"
                  for p, _, _ in unpriced] + [""]

    L += ["## Coverage by model", "",
          "| Model | Category | Variants | With photo | Price |",
          "|---|---|---|---|---|"]
    for m in sorted(products, key=lambda m: -m["variant_count"]):
        pr = (f"${m['price_min']:,.0f}" if m["price_min"] == m["price_max"]
              else f"${m['price_min']:,.0f}-${m['price_max']:,.0f}")
        gap = "" if m["with_image"] == m["variant_count"] else " ⚠"
        L.append(f"| {m['model']} | {m['category'] or '?'} | {m['variant_count']} "
                 f"| {m['with_image']}{gap} | {pr} |")

    (OUT / "review.md").write_text("\n".join(L), encoding="utf8")

    live_models = [m for m in products if m["published"]]
    live_variants = sum(m["with_image"] for m in products)
    clearance = [v for m in products for v in m["variants"]
                 if v["tier"] == "clearance"]

    print(f"{len(price)} priced SKUs -> {len(products)} models")
    print(f"  matched to photo : {len(matched)}")
    print(f"  no photo         : {len(unmatched_price)}")
    print(f"  orphan in catalog: {len(orphan_catalog)}")
    print(f"  invalid SKUs     : {len(bad)}")
    print(f"\nLAUNCH SET")
    print(f"  published models : {len(live_models)} of {len(products)}")
    print(f"  published SKUs   : {live_variants} of {len(price)}")
    print(f"  held for photos  : {len(price) - live_variants}")
    print(f"  clearance tier   : {len(clearance)} SKUs "
          f"({sum(1 for v in clearance if v['published'])} publishable)")


if __name__ == "__main__":
    main()
