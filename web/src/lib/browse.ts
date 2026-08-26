import type { Model } from "@/lib/content/types";

/**
 * Pure browse logic for category pages.
 *
 * Kept out of the component so it can be tested directly: the interesting
 * behaviour is which facets are worth offering and how models order, none of
 * which needs a DOM.
 */

export type Sort = "featured" | "price-asc" | "price-desc" | "name";

export const SORTS: { value: Sort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "name", label: "Name" },
];

/**
 * Materials worth showing as filters, with the number of models carrying each.
 *
 * A facet present on every model narrows nothing, and one present on a single
 * model is a dead end that hides the rest of the range — both are dropped.
 */
export function materialFacets(
  models: Model[], limit = 10,
): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const m of models) {
    const seen = new Set<string>();
    for (const v of m.published) {
      for (const h of v.hides) {
        if (seen.has(h)) continue;
        seen.add(h);
        counts.set(h, (counts.get(h) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n > 1 && n < models.length)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

export function filterAndSort(
  models: Model[], material: string | null, sort: Sort,
): Model[] {
  const filtered = material
    ? models.filter((m) => m.published.some((v) => v.hides.includes(material)))
    : models;

  const out = [...filtered];
  switch (sort) {
    case "price-asc":
      out.sort((a, b) => a.priceMin - b.priceMin || a.name.localeCompare(b.name));
      break;
    case "price-desc":
      out.sort((a, b) => b.priceMax - a.priceMax || a.name.localeCompare(b.name));
      break;
    case "name":
      out.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "featured":
      break; // input order: most photographed variants first
  }
  return out;
}
