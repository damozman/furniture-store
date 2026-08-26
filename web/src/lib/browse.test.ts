import { describe, expect, it } from "vitest";
import { filterAndSort, materialFacets } from "./browse";
import { localContent as content } from "./content/local";
import type { Model, Variant } from "./content/types";

function variant(sku: string, price: number, hides: string[]): Variant {
  return {
    sku, name: sku, hideLabel: hides[0] ?? "Plain", hides, price,
    specs: null, images: [{ width: 800, src: `/img/${sku}.webp` }],
    published: true, tier: "standard",
  };
}

function model(name: string, prices: number[], hides: string[][]): Model {
  const variants = prices.map((p, i) => variant(`${name}-${i}`, p, hides[i] ?? []));
  return {
    slug: name.toLowerCase(), name, category: "bar-stools",
    priceMin: Math.min(...prices), priceMax: Math.max(...prices),
    tier: "standard", variants, published: variants, heights: [],
  };
}

describe("materialFacets", () => {
  const models = [
    model("Alpha", [100], [["Croc", "Hide"]]),
    model("Bravo", [200], [["Croc"]]),
    model("Charlie", [300], [["Hide"]]),
    model("Delta", [400], [["Suede"]]),
  ];

  it("counts models per material, not variants", () => {
    const dup = model("Echo", [10, 20], [["Croc"], ["Croc"]]);
    // Echo carries Croc twice but is still one model.
    const facets = materialFacets([...models, dup]);
    expect(Object.fromEntries(facets).Croc).toBe(3);
  });

  it("drops materials that appear on only one model", () => {
    // Suede is a dead end -- filtering to it hides the whole rest of the range.
    expect(materialFacets(models).map(([n]) => n)).not.toContain("Suede");
  });

  it("drops a material shared by every model, which narrows nothing", () => {
    const all = [
      model("A", [1], [["Leather"]]),
      model("B", [2], [["Leather"]]),
      model("C", [3], [["Leather"]]),
    ];
    expect(materialFacets(all)).toEqual([]);
  });

  it("orders by model count, then name for stability", () => {
    expect(materialFacets(models)).toEqual([["Croc", 2], ["Hide", 2]]);
  });

  it("respects the limit", () => {
    expect(materialFacets(models, 1)).toHaveLength(1);
  });
});

describe("filterAndSort", () => {
  const models = [
    model("Alpha", [300, 900], [["Croc"], ["Hide"]]),
    model("Bravo", [100, 200], [["Croc"]]),
    model("Charlie", [500], [["Hide"]]),
  ];

  it("returns everything when no material is selected", () => {
    expect(filterAndSort(models, null, "featured")).toHaveLength(3);
  });

  it("keeps only models with a published variant in that material", () => {
    expect(filterAndSort(models, "Hide", "featured").map((m) => m.name))
      .toEqual(["Alpha", "Charlie"]);
  });

  it("returns empty rather than everything for an unknown material", () => {
    expect(filterAndSort(models, "Nonexistent", "featured")).toEqual([]);
  });

  it("sorts ascending by a model's lowest price", () => {
    expect(filterAndSort(models, null, "price-asc").map((m) => m.name))
      .toEqual(["Bravo", "Alpha", "Charlie"]);
  });

  it("sorts descending by a model's highest price", () => {
    // Alpha tops out at 900, so it leads despite starting at 300.
    expect(filterAndSort(models, null, "price-desc").map((m) => m.name))
      .toEqual(["Alpha", "Charlie", "Bravo"]);
  });

  it("sorts by name", () => {
    expect(filterAndSort(models, null, "name").map((m) => m.name))
      .toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  it("preserves input order for featured", () => {
    expect(filterAndSort(models, null, "featured").map((m) => m.name))
      .toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  it("does not mutate the input array", () => {
    const order = models.map((m) => m.name);
    filterAndSort(models, null, "price-desc");
    expect(models.map((m) => m.name)).toEqual(order);
  });
});

describe("against the real catalogue", () => {
  it("offers facets that always return at least one model", async () => {
    const models = await content.listModels({ category: "bar-stools" });
    const facets = materialFacets(models);
    expect(facets.length).toBeGreaterThan(0);

    for (const [name, count] of facets) {
      const shown = filterAndSort(models, name, "featured");
      // A chip promising N models must actually produce N.
      expect(shown.length, `facet ${name}`).toBe(count);
      expect(shown.length).toBeGreaterThan(0);
    }
  });

  it("never drops or duplicates models when only sorting", async () => {
    const models = await content.listModels({ category: "bar-stools" });
    for (const sort of ["featured", "price-asc", "price-desc", "name"] as const) {
      const out = filterAndSort(models, null, sort);
      expect(out).toHaveLength(models.length);
      expect(new Set(out.map((m) => m.slug)).size).toBe(models.length);
    }
  });
});
