"""Build a visual contact sheet to verify caption -> image assignments by eye.

Geometry-based matching can't be trusted blind on an irregularly laid-out catalog,
so this renders every extracted product with the image it was assigned, grouped by
page, alongside the editorial shots that were left over.
"""
import base64
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "out"
IMG = OUT / "images"
THUMB_W = 190


def thumb_uri(rel, cache={}):
    if rel in cache:
        return cache[rel]
    import pymupdf
    p = IMG / rel
    if not p.exists():
        return ""
    pix = pymupdf.Pixmap(str(p))
    while pix.width > THUMB_W * 2:
        pix.shrink(1)  # halves each call
    data = base64.b64encode(pix.tobytes("jpeg", jpg_quality=70)).decode()
    cache[rel] = f"data:image/jpeg;base64,{data}"
    return cache[rel]


def main():
    pages = json.load(open(OUT / "catalog.json", encoding="utf8"))
    parts = ["""<meta charset="utf-8"><title>Saddle &amp; Hide - catalog extraction contact sheet</title>
<style>
body{font-family:system-ui,sans-serif;margin:24px;background:#faf8f6;color:#241a14}
h1{font-size:20px;font-weight:500}
h2{font-size:14px;font-weight:500;margin:28px 0 8px;color:#6b5546;border-bottom:1px solid #ddd0c4;padding-bottom:4px}
.grid{display:flex;flex-wrap:wrap;gap:14px}
.card{width:200px;background:#fff;border:1px solid #e3d9cf;border-radius:6px;padding:8px}
.card img{width:100%;border-radius:3px;background:#f2ece6}
.n{font-size:12px;font-weight:500;margin-top:6px}
.v{font-size:11px;color:#6b5546}
.s{font-size:11px;color:#8a7666;font-family:ui-monospace,monospace}
.flag{font-size:10px;color:#a33;margin-top:3px}
.ed{border-color:#c9b9a6;background:#f6f1eb}
.miss{background:#fff4f4;border-color:#e0b4b4}
</style>
<h1>Catalog extraction contact sheet</h1>"""]

    for pg in pages:
        if not pg["products"] and not pg["editorial"]:
            continue
        parts.append(f"<h2>Page {pg['page']}</h2><div class='grid'>")
        for p in pg["products"]:
            cls = "card" + (" miss" if not p["image"] else "")
            img = (f"<img src='{thumb_uri(p['image']['file'])}'>"
                   if p["image"] else "<div style='height:120px'></div>")
            flags = ("<div class='flag'>" + " · ".join(p["flags"]) + "</div>"
                     if p.get("flags") else "")
            parts.append(
                f"<div class='{cls}'>{img}<div class='n'>{p['name']}</div>"
                f"<div class='v'>{p['variant'] or '&nbsp;'}</div>"
                f"<div class='s'>{p['sku'] or '-'}</div>{flags}</div>")
        for e in pg["editorial"]:
            parts.append(
                f"<div class='card ed'><img src='{thumb_uri(e['file'])}'>"
                f"<div class='v'>editorial {e['w']}x{e['h']}</div></div>")
        parts.append("</div>")

    dest = OUT / "contact-sheet.html"
    dest.write_text("\n".join(parts), encoding="utf8")
    print("wrote", dest)


if __name__ == "__main__":
    main()
