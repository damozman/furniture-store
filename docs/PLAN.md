# Saddle & Hide — Strategy & Build Plan

Working plan for the storefront. `CLAUDE.md` covers how to run the code; this document
covers why it is shaped the way it is and what is still open.

## Context

Chris is partnering with a friend who owns a luxury western/traditional furniture business,
on a **60/40 cost split**. The owner's existing store, `texasbarstool.com`, is a
**deactivated Shopify site**. It returns HTTP 402, and when it was live it listed only 42 of 183 SKUs.

Decisions locked with Chris:

- **New domain, new brand.** Not reviving texasbarstool.com. Working name: **Saddle & Hide**
  (preliminary; name and domain availability still being checked).
- **Full e-commerce.** At a $600 median price the range transacts online.
- **Fully custom Next.js + headless CMS.** Chris declined a Shopify-backed build.
- **Hybrid launch scope.** Every model gets a real page; the best-photographed models carry the
  deepest treatment.
- **Finish this site first, then productize it** as a resellable template. The market is left open.

The design requirement: *over and above a basic scrolling website* — something that commands
attention and keeps eyes on the product.

## Source material

- **Catalogue:** 48 print-resolution pages, about 151 MB. Clean studio-on-white product shots,
  plus strong editorial photography (p3 moody dining scene, p10 saloon, p47 bar and living
  room, p48 golden-hour prairie).
- **Price list:** 183 SKUs resolving to **40 models**. Prices run **$25–$6,000**, median **$600**,
  mean $774: 50 under $500, 85 at $500–999, 47 at $1,000–1,999, and 1 at $6,000.

Both live in `data/source/` (gitignored). Only the per-page PDFs feed the pipeline; the merged
`Catalog.pdf` is the original as received.

## Findings that shape the build

1. **The catalogue is about 4× what the web ever showed.** Most of the line has never had a URL.
2. **It is a variant-matrix business.** Frames × hides = SKUs. So the build is one strong page
   per model with a material picker, not 183 orphan product pages.
3. **Each SKU is already a photographed frame + hide.** The signature interaction needs no 3D
   and no new photography.
4. **Photo coverage is 70%.** 128 of 183 SKUs have a usable studio shot. Better photography is
   coming on the owner's inventory schedule, so every component has to look complete with one
   photo and improve with more.

## The hide configurator

The business already *is* "one frame, many hides", so the configurator is the centerpiece.
Selecting a hide swaps to that SKU's own photograph and updates price, SKU and specs. Every
hide is natural, so **no two pieces are identical** — the site presents that as the luxury
story, not a disclaimer.

**Built:** swatch picker on every model page, measured specs, seat-height fit guidance,
add to cart. Product shots are trimmed and re-framed on uniform square canvases, so swaps
never shift the piece (CLS 0).

**Not built:** macro hide-texture tiles, a height visualizer, AR "view in your room", and
multi-angle/360 views. The 360 views wait on photography; AR waits on 3D models.

**Design guardrail:** at this price tier, over-produced tech cheapens the brand. The formula
is restraint, the existing photography, and one signature moment.

## Architecture

```
Next.js 16 (App Router, TypeScript)
  ├── content  ── ContentSource  ── local: data/out/products.json   (later: CMS)
  ├── commerce ── CommerceSource ── cookie cart                      (later: Stripe + tax/freight)
  └── leads    ── LeadSource     ── local: data/out/leads.jsonl      (later: CRM / email)
```

Pages depend only on the three interfaces, so each backend swap touches one module.
Commerce is deliberately thin: Stripe handles cards, but not furniture **freight** or
**sales-tax nexus**. Both matter for a $6,000 sectional shipping interstate.

**CMS:** not wired yet. The original plan named Sanity. Given the resale goal, **Payload CMS
v3** is now recommended: it runs inside the Next.js app at `/admin`, is self-hosted, and has
no per-seat SaaS cost.

### Cart security

`AddLineInput` carries a SKU and a quantity, and **no price**. An earlier revision accepted
`unitPrice` from the client, which would have let a crafted request buy a $1,699 chair for a
dollar. The cookie now holds `[[sku, qty], …]`, and prices, names and images are resolved from
the catalogue on every read. A tampered cookie can change *what* is in the cart but never
*what it costs*. Price changes propagate to existing carts, and a discontinued SKU drops out
silently. No database is needed, which also keeps the cart correct on serverless.

Verified: the cart survives a server restart, and a forged cookie with a fake SKU rendered
catalogue prices with the fake line dropped.

## Data model

- **Model** — name, slug, category, price range, variants
- **Variant** — SKU, hide label, material facets, price, specs, images[], published flag, tier
- **Specs** — overall height/width/depth, seat height/width/depth, arm height/width, plus
  bar/counter class. All optional and rendered where present.
- **Material** — a facet spanning true hides ("Brown Croc", "Brindle") and construction terms
  ("Tufted", "Diamond"). Routes use `/materials`, not `/hides`, for that reason.
- **Category** — bar stools, dining, accent, office, sofas, ottomans, pet & accessories.

**Launch gating:** a variant without a photograph is authored but unpublished.
`SHOW_UNPHOTOGRAPHED=1` publishes it. Nothing is deleted. Today **37 of 40 models** publish.
Levi, Santa Fe (the $6,000 sectional) and Spring Buck Ottoman have no photos at all.

**Best-covered models:** Saddle (17 of 23 variants photographed), Trophy (14 of 24), Grace (11 of 13), Kennedy (8 of 9),
Wilson (7 of 8). Antoinette has 11 variants but only 4 photos. At $1,699 it is the line
most damaged by looking thin, so it waits for photography before being featured.

**Height:** a required bar/counter selector isn't buildable yet. Only 38 of 128 sellable
variants name a height class, and 28 of 37 published models have none. Where the data does
exist it is per variant (Trophy's Brown Hide Yolk is bar; Turquoise Croc Yolk is counter).

## What's built

| Route | Notes |
|---|---|
| `/` | editorial hero, the range, material facets |
| `/collections/[category]` | 6 pages; client-side material filter and sort, so pages stay static |
| `/[model]` | 37 pages; hide configurator, specs, JSON-LD `ProductGroup` |
| `/materials`, `/materials/[material]` | library plus 21 landing pages for long-tail search |
| `/trade` | designer/architect application funnel |
| `/lookbook` | editorial gallery plus email capture |
| `/cart` | cookie cart; dynamic, as are the per-model OG cards. Checkout is disabled |
| `/shipping`, `/care`, `/faq`, `/about` | policy specifics marked "To confirm" |
| `/sitemap.xml`, `/robots.txt`, OG cards | robots blocks indexing until a domain is set |

**Measured** (Lighthouse, desktop, dev server): performance 98, accessibility 100, best
practices 100, SEO 66. The one SEO failure is the intentional robots block. FCP 0.2 s,
LCP 1.1 s, CLS 0, TBT 0 ms. A production build should score better, since dev ships
unminified JS.

**Automated tests** (`npm test`): invariants over the *real* catalogue, so they keep holding as
data changes. They check that no published variant lacks an image; SKUs and slugs are unique; prices are positive;
published SKUs resolve and unpublished ones don't; seat height is never parsed as overall
height; and category and material counts match their contents. Pure unit tests cover filter
and sort. The invariants have already caught a pipeline bug that would have rendered
`<img>` without `src`.

**Still to verify manually:** Stripe test transactions from $25 to $6,000; mobile Lighthouse on
home, category and model pages; real iPad/iPhone testing (the buyer skews there).

## Queued work

1. Scrollable homepage hero with three editorial images, without regressing CLS or LCP.
2. Spreadsheet import template: a field reference plus an `.xlsx` for models, variants, specs,
   pricing, inventory, images (with roles), video, categories, materials and SEO.
3. A deployed, shareable link. Chris authenticates; confirm first, because it publishes the client's photography.

## Blocked on decisions

- Brand name and domain.
- Payment provider, freight quoting, sales-tax nexus. These gate checkout.
- Lead backend (CRM or email). Until then, trade applications only reach a local dev file.

## Questions for the owner

**Catalog data** lives in `docs/Furniture Information Sheet.xlsx`, tab **To complete**.
Sunset Sage inventory is already mapped onto that sheet (on-hand, photos, new rows).
Do not re-import the Sage workbook.

Remaining data work, in order:

1. Confirm **medium** matches (hide is close, not exact).
2. Assign real SKUs to **NEW-*** rows (Scott, Chelsea, Arc, Texas King Bed, etc.).
3. Confirm Smith white croc SKU `30190002`.
4. Price policy where Sunset Sage and the master disagree.
5. Replace placeholder SKUs: `11111` (Brooke), Levi `000001`/`00002`/`00003`, Murphy `123456`, `SANTA-FE`.
6. Smith cost (four rows). Legacy “OLD” Marlo / Bethany rows still need a clearance decision.

**Policy** (currently "To confirm" on the site)
- Delivery levels offered and how each is priced; typical lead times, in-stock vs made-to-order.
- Damage claim window and replacement process; return window, restocking, return freight,
  and whether made-to-order hides are final sale.
- Warranty term and coverage; any commercial/contract rating.
- The founding story, people and workshop, for `/about`.

## Productization

Build this site to completion first; it becomes the reference install. The domain model —
*one product × an option matrix with a photo per combination* — fits tile, stone, flooring,
cabinetry, rugs, doors, jewelry and paint, not just furniture. The catalogue-PDF +
spreadsheet pipeline is the differentiator: those businesses usually have exactly those two
files and nothing else.

To extract before reselling: theme tokens (`globals.css`), hide/leather-specific copy, the
category taxonomy, and site config. **The template must ship without the client's assets.**
Everything in `data/source/`, `data/out/`, and `web/public/img/` belongs to the owner.

## Repo notes

- Source catalogues and extracted PNGs are untracked. Older commits still contain the extracted
  PNGs and a Python virtualenv, so clones stay larger than the working tree. Rewriting pushed
  history to reclaim that space isn't worth the disruption yet.

## Business-hygiene flag

The owner holds the existing brand and all of the product data and photography, while this is a
60/40 split on a *new* brand. Before there is an asset worth arguing over, put in writing who
owns the new domain, brand, site and data, and what happens if the partnership ends.
