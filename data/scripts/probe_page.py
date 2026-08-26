"""Diagnostic: dump text blocks and image bboxes for one catalog page."""
import sys
import pymupdf

path = sys.argv[1]
doc = pymupdf.open(path)
page = doc[0]

print("PAGE RECT:", page.rect)
print("\n--- TEXT BLOCKS ---")
for b in page.get_text("blocks"):
    x0, y0, x1, y1, text, bno, btype = b
    if btype != 0:
        continue
    flat = text.strip().replace("\n", " | ")
    print("  [%6.1f %6.1f %6.1f %6.1f]  %s" % (x0, y0, x1, y1, flat[:90]))

print("\n--- IMAGES ---")
for i, info in enumerate(page.get_images(full=True)):
    xref = info[0]
    try:
        rects = page.get_image_rects(xref)
    except Exception:
        rects = []
    pix = pymupdf.Pixmap(doc, xref)
    for r in rects or [None]:
        print("  xref=%-5d %dx%d  cs=%s  bbox=%s" % (
            xref, pix.width, pix.height, pix.colorspace.name if pix.colorspace else "none", r))
    pix = None
