# Saddle & Hide — furniture storefront

Custom e-commerce site for a luxury western furniture business, built by Chris with the
owner on a 60/40 split. The catalogue carries the owner's existing brand (Texas Bar Stool);
the new site's brand, **Saddle & Hide**, is preliminary. Full context, decisions and open
questions: [docs/PLAN.md](docs/PLAN.md).

## Layout

```
web/          Next.js 16 storefront — the app
data/scripts/ pipeline: catalogue PDFs + price list → product data
data/out/     pipeline output; products.json is what the site builds from
data/source/  client source material — gitignored, not in the repo (see below)
docs/PLAN.md  strategy, decisions, data findings, open questions
```

## Running it

```bash
cd web
npm install
npm run dev      # http://localhost:3000
npm test         # data invariants + browse logic
npm run lint
npm run build    # production build; `npm start` serves it
```

**Next.js 16 differs from older versions** — read `web/AGENTS.md`. Check
`web/node_modules/next/dist/docs/` before writing Next code. `params` is a Promise, and
`PageProps` / `LayoutProps` are generated globals that exist only after a first `dev` or `build`.

## Data pipeline

Only needed when the catalogue or price list changes. The site builds from committed
output, so a fresh clone runs without it.

```bash
python -m venv data/.venv
data/.venv/Scripts/python -m pip install -r data/requirements.txt
data/.venv/Scripts/python data/scripts/extract_catalog.py  # source/Catalog/page*.pdf → out/catalog.json + out/images/
data/.venv/Scripts/python data/scripts/build_products.py   # + price list → out/products.json, out/review.md
cd web && node scripts/build-images.mjs                     # out/images → public/img/ + manifest.json
npm test                                                    # invariants catch a bad import
```

`data/source/` must hold `Catalog/page1.pdf`…`page48.pdf` and
`TBS Price List by Product.xlsx`, and usually `Catalog.pdf` too, the merged original.
Chris has these files. They stay out of git: the merged PDF is over GitHub's 100 MB limit,
and the material belongs to the client. Both scripts take paths as arguments if the files are elsewhere.

## Rules that aren't obvious from the code

- **Three adapters.** Components import `content`, `commerce` and `leads` from
  `web/src/lib/*/index.ts`, never an implementation. Current implementations are local:
  content reads `data/out/products.json`, the cart lives in a cookie, and leads append to
  `data/out/leads.jsonl`. That lead file is a dev-only sink holding PII, and it's gitignored.
- **The cart never accepts a price.** The cookie holds `[[sku, qty]]`; every price is resolved
  through `content.findVariant`, which only resolves *published* variants. Don't add price to
  `AddLineInput` — an earlier version did, and a crafted request could set its own price.
- **Nothing is permanently hidden.** Unphotographed variants are authored with full specs and
  gated by `SHOW_UNPHOTOGRAPHED=1` (`web/src/lib/config.ts`). Photo coverage is 128 of 183 SKUs.
- **Specs are an 8-field superset** (overall/seat H·W·D, arm H·W) rendered only where present.
- **No bar/counter selector** — only 38 of 128 sellable variants name a height class. Offering
  the choice would invent availability. Seat height plus fit guidance is shown instead.
- **Images are pre-derived WebP keyed by SKU**, rendered with `<img srcSet>` rather than
  `next/image`; the lint rule is off with the reason in `web/eslint.config.mjs`. Product
  shots are trimmed onto uniform square canvases, which is why swapping hides gives CLS 0.
- **Keep catalogue routes static.** Reading `cookies()` in anything shared makes every page
  dynamic; that is why `CartBadge` is a client component. After `npm run build`, only `/cart`
  and the on-demand `/[model]/opengraph-image` should show as `ƒ`.
- **OG images render through Satori.** Every `div` with more than one child needs
  `display: flex`, and images must go through `lib/og-image.ts`, because some WebP files break
  Satori. `/[model]/opengraph-image` renders on demand, so a passing build doesn't prove it
  works — fetch `/trophy/opengraph-image`.
- **`robots.ts` blocks all indexing** until `NEXT_PUBLIC_SITE_URL` is set.
- **Never invent business policy.** `<NeedsConfirmation>` blocks on `/shipping`, `/faq` and
  `/about` mark answers only the owner can give.

## Where things stand

**Built:** home; 6 category pages with material filter and sort; 37 model pages with the hide
configurator; 21 material landing pages plus library; trade application funnel; lookbook email
capture; cart; shipping/care/FAQ/about; 404, error and loading states; sitemap, robots,
JSON-LD, OG cards; mobile nav.

**Queued, not started** — Chris asked for these; pick up here:
1. **Scrollable homepage hero with three editorial images.** Preserve CLS 0 and LCP: only the
   first image eager, CSS scroll-snap, keyboard-operable, respects reduced motion.
2. **Spreadsheet import template.** A field reference plus an `.xlsx` template covering models,
   variants, specs, pricing, inventory, images (with roles), video, categories, materials
   and SEO. This is also the foundation for reselling the build.
3. **Shareable link for a colleague.** Deploy (Vercel is the natural fit). Chris has to
   authenticate, and deploying publishes the client's photography — confirm before doing it.

**Blocked on Chris or the owner:** payment provider, freight and sales-tax nexus, a real lead
backend, brand name and domain, and the client data requests in `docs/PLAN.md`.

**Later:** package the codebase as a resellable template once this site is finished — Payload
CMS v3 recommended for the admin. See `docs/PLAN.md`.
