import { describe, expect, it } from "vitest";
import { localContent as content } from "./local";
import { SPEC_FIELDS } from "./types";

/**
 * Invariants over the catalogue data.
 *
 * The site is entirely data-driven and the data is regenerated from the client's
 * spreadsheet and catalogue PDFs every time new photography lands. These tests
 * are the thing standing between "a fresh import ran" and "a product page ships
 * with an empty image frame". They assert properties, not fixtures, so they stay
 * true as the numbers change.
 */

describe("catalogue invariants", () => {
  it("publishes at least one model", async () => {
    const models = await content.listModels();
    expect(models.length).toBeGreaterThan(0);
  });

  it("never publishes a variant without an image", async () => {
    const models = await content.listModels();
    const broken = models.flatMap((m) =>
      m.published.filter((v) => v.images.length === 0)
        .map((v) => `${m.slug}/${v.sku}`));
    // An empty frame on a product page is worse than an absent variant.
    expect(broken).toEqual([]);
  });

  it("gives every published model a usable lead image", async () => {
    const models = await content.listModels();
    const broken = models
      .filter((m) => !m.published[0]?.images[0]?.src)
      .map((m) => m.slug);
    expect(broken).toEqual([]);
  });

  it("has unique model slugs", async () => {
    const models = await content.listModels();
    const slugs = models.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has unique SKUs across the whole range", async () => {
    const models = await content.listModels();
    const skus = models.flatMap((m) => m.published.map((v) => v.sku));
    const dupes = skus.filter((s, i) => skus.indexOf(s) !== i);
    expect(dupes).toEqual([]);
  });

  it("prices every published variant above zero", async () => {
    const models = await content.listModels();
    const free = models.flatMap((m) =>
      m.published.filter((v) => !(v.price > 0)).map((v) => v.sku));
    expect(free).toEqual([]);
  });

  it("keeps model price range consistent with its variants", async () => {
    const models = await content.listModels();
    for (const m of models) {
      const prices = m.variants.map((v) => v.price);
      expect(m.priceMin).toBe(Math.min(...prices));
      expect(m.priceMax).toBe(Math.max(...prices));
    }
  });

  it("gives every published variant a non-empty hide label", async () => {
    const models = await content.listModels();
    const blank = models.flatMap((m) =>
      m.published.filter((v) => !v.hideLabel.trim()).map((v) => v.sku));
    expect(blank).toEqual([]);
  });

  it("resolves every model returned by listModels", async () => {
    const models = await content.listModels();
    for (const m of models) {
      await expect(content.getModel(m.slug)).resolves.toMatchObject({
        slug: m.slug,
      });
    }
  });

  it("resolves every published SKU through findVariant", async () => {
    const models = await content.listModels();
    for (const m of models) {
      for (const v of m.published) {
        const found = await content.findVariant(v.sku);
        expect(found, `sku ${v.sku} did not resolve`).not.toBeNull();
        expect(found!.variant.price).toBe(v.price);
        expect(found!.model.slug).toBe(m.slug);
      }
    }
  });

  it("does not resolve unpublished SKUs", async () => {
    const all = await content.listModels();
    const unpublished = all
      .flatMap((m) => m.variants.filter((v) => !v.published))
      .slice(0, 5);
    for (const v of unpublished) {
      // Knowing a SKU must not be enough to buy something we can't show.
      await expect(content.findVariant(v.sku)).resolves.toBeNull();
    }
  });

  it("parses specs without confusing seat/arm keys for overall ones", async () => {
    const models = await content.listModels();
    const withSpecs = models.flatMap((m) => m.published)
      .filter((v) => v.specs);
    expect(withSpecs.length).toBeGreaterThan(0);

    for (const v of withSpecs) {
      const s = v.specs!;
      // "SH26" must never be read as a height of 26 while H40 is present.
      if (s.seatHeight != null && s.height != null) {
        expect(s.seatHeight).toBeLessThan(s.height);
      }
      for (const { key } of SPEC_FIELDS) {
        const value = s[key];
        if (typeof value === "number") {
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThan(0);
        }
      }
    }
  });

  it("assigns every published model a category", async () => {
    const models = await content.listModels();
    const uncategorised = models.filter((m) => !m.category).map((m) => m.slug);
    expect(uncategorised).toEqual([]);
  });

  it("counts categories consistently with the models in them", async () => {
    const categories = await content.listCategories();
    for (const c of categories) {
      const inCategory = await content.listModels({ category: c.slug });
      expect(inCategory.length).toBe(c.modelCount);
    }
  });

  it("returns models for every listed material", async () => {
    const materials = await content.listMaterials();
    expect(materials.length).toBeGreaterThan(0);
    for (const mat of materials) {
      const groups = await content.listModelsByMaterial(mat.slug);
      expect(groups.length, `${mat.slug} had no models`).toBeGreaterThan(0);
      const variants = groups.reduce((n, g) => n + g.variants.length, 0);
      expect(variants).toBe(mat.count);
    }
  });

  it("points every editorial image at real sources", async () => {
    const editorial = await content.listEditorial();
    for (const e of editorial) {
      expect(e.sources.length).toBeGreaterThan(0);
      expect(e.aspect).toBeGreaterThan(0);
    }
  });
});
