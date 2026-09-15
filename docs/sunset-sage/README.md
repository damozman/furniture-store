# Sunset Sage inventory

Do **not** commit the original `.xlsx`. GitHub rejects files over 100 MB, and
that workbook is large because the photos live inside the cells.

## Extract (on your machine)

Put `Sunset Sage current inventory 8_15_2026.xlsx` in `docs/`, then from the
repo root:

```powershell
python data/scripts/extract_xlsx_images.py "docs/Sunset Sage current inventory 8_15_2026.xlsx"
```

If you use the project venv:

```powershell
data\.venv\Scripts\python.exe data/scripts/extract_xlsx_images.py "docs/Sunset Sage current inventory 8_15_2026.xlsx"
```

That writes:

- `images/` — one photo per item, named after the Item cell
- `inventory.csv` — item, quantity, price, photo path

Then:

```powershell
git add docs/sunset-sage data/scripts/extract_xlsx_images.py
git commit -m "Add Sunset Sage inventory photos tagged by item"
git push
```
