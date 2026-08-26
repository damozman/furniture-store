import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "@/lib/config";
import type {
  Category, CategorySlug, ContentSource, EditorialImage,
  HeightClass, ImageSource, Material, Model, ModelInMaterial, Specs, Tier, Variant,
} from "./types";

/**
 * Local implementation of ContentSource, reading the catalogue extraction output.
 *
 * This exists so the site runs on real products and real photography before any
 * CMS account exists. Sanity will implement the same interface.
 */

const DATA = path.resolve(process.cwd(), "..", "data", "out", "products.json");
const MANIFEST = path.resolve(process.cwd(), "public", "img", "manifest.json");

interface RawVariant {
  sku: string; name: string; price: number; hides: string[];
  dimensions: string | null; catalog_variant: string | null;
  image: { file: string } | null; published: boolean; tier: Tier;
  category: CategorySlug | null;
}
interface RawModel {
  model: string; slug: string; category: CategorySlug | null;
  price_min: number; price_max: number; tier: Tier; variants: RawVariant[];
}
interface Manifest {
  product: Record<string, ImageSource[]>;
  editorial: EditorialImage[];
}

const CATEGORY_NAMES: Record<CategorySlug, string> = {
  "bar-stools": "Bar & counter stools",
  "dining-chairs": "Dining chairs",
  "accent-chairs": "Accent chairs",
  "office-chairs": "Office chairs",
  sofas: "Sofas & sectionals",
  ottomans: "Ottomans",
  "pet-and-accessories": "Pet & accessories",
};

let cache: { models: Model[]; editorial: EditorialImage[] } | null = null;

/**
 * Parse the catalogue's dimension shorthand into the full spec superset.
 *
 * Real examples this has to survive:
 *   "Bar: H39 W20 D21 SH29 SD 16"          labelled height class, spaced value
 *   "H48 W30 D28, SH19 SD26, AH32"         comma groups
 *   "Bar: H40 W27 D27. / SH26 SW 20 SD20, AH36 AW27"   full arm + seat spec
 *   "Counter: H43.5 W20 24, SH 26"         decimals, and a value missing its label
 *
 * Longest keys are matched first so SH/SD/SW/AH/AW are never mistaken for a bare
 * H/W/D. Anything unlabelled is dropped rather than guessed.
 */
function num(raw: string, key: string): number | null {
  const m = raw.match(new RegExp(`\\b${key}\\s*([0-9]+(?:\\.[0-9]+)?)`, "i"));
  return m ? Number(m[1]) : null;
}

function parseSpecs(raw: string | null): Specs | null {
  if (!raw) return null;

  // Strip the two-letter keys before reading the one-letter ones, so "SH29"
  // cannot be read as an H of 29.
  const seatHeight = num(raw, "SH");
  const seatWidth = num(raw, "SW");
  const seatDepth = num(raw, "SD");
  const armHeight = num(raw, "AH");
  const armWidth = num(raw, "AW");
  const rest = raw.replace(/\b(SH|SW|SD|AH|AW)\s*[0-9]+(?:\.[0-9]+)?/gi, "");

  let heightClass: HeightClass | null = null;
  if (/\bbar\b/i.test(raw)) heightClass = "bar";
  else if (/\bcounter\b/i.test(raw)) heightClass = "counter";

  return {
    raw,
    heightClass,
    height: num(rest, "H"),
    width: num(rest, "W"),
    depth: num(rest, "D"),
    seatHeight,
    seatWidth,
    seatDepth,
    armHeight,
    armWidth,
  };
}

/**
 * The swatch label is the variant name minus the model name -- "Trophy 3 Brown
 * Croc" under model "Trophy" becomes "Brown Croc". Falls back to the catalogue's
 * own caption, which is usually cleaner than the price-list name.
 */
function hideLabel(v: RawVariant, modelName: string): string {
  if (v.catalog_variant) return v.catalog_variant;
  let s = v.name;
  if (s.toLowerCase().startsWith(modelName.toLowerCase())) {
    s = s.slice(modelName.length);
  }
  s = s.replace(/^\s*\d+\s*/, "").replace(/^[\s,\-]+/, "").trim();
  return s || v.name;
}

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function load() {
  if (cache) return cache;

  const [rawData, rawManifest] = await Promise.all([
    readFile(DATA, "utf8"),
    readFile(MANIFEST, "utf8").catch(() => '{"product":{},"editorial":[]}'),
  ]);
  const parsed = JSON.parse(rawData) as { models: RawModel[] };
  const manifest = JSON.parse(rawManifest) as Manifest;

  const models: Model[] = parsed.models.map((m) => {
    const variants: Variant[] = m.variants.map((v) => {
      const images = manifest.product[v.sku] ?? [];
      return {
        sku: v.sku,
        name: v.name,
        hideLabel: hideLabel(v, m.model),
        hides: v.hides,
        price: v.price,
        specs: parseSpecs(v.dimensions),
        images,
        // Nothing is excluded permanently: a variant without a photograph is
        // still authored and still carries its specs. `showUnphotographed`
        // decides whether it is on the site yet.
        published: images.length > 0 || config.showUnphotographed,
        tier: v.tier,
      };
    });

    const published = variants.filter((v) => v.published);
    const heights = [...new Set(
      variants.map((v) => v.specs?.heightClass).filter(Boolean),
    )] as HeightClass[];

    return {
      slug: m.slug,
      name: m.model,
      category: m.category,
      priceMin: m.price_min,
      priceMax: m.price_max,
      tier: m.tier,
      variants,
      published,
      heights: heights.sort(),
    };
  });

  cache = { models, editorial: manifest.editorial ?? [] };
  return cache;
}

export const localContent: ContentSource = {
  async listModels(opts) {
    const { models } = await load();
    return models
      .filter((m) => m.published.length > 0)
      .filter((m) => (opts?.category ? m.category === opts.category : true))
      .sort((a, b) => b.published.length - a.published.length);
  },

  async getModel(slug) {
    const { models } = await load();
    return models.find((m) => m.slug === slug) ?? null;
  },

  async findVariant(sku) {
    const { models } = await load();
    for (const model of models) {
      // Only published variants are purchasable, so an unpublished SKU must not
      // resolve even if someone knows the number.
      const variant = model.published.find((v) => v.sku === sku);
      if (variant) return { model, variant };
    }
    return null;
  },

  async listCategories() {
    const { models } = await load();
    const counts = new Map<CategorySlug, number>();
    for (const m of models) {
      if (!m.category || m.published.length === 0) continue;
      counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([slug, modelCount]) => ({
        slug, name: CATEGORY_NAMES[slug], modelCount,
      }))
      .sort((a, b) => b.modelCount - a.modelCount) satisfies Category[];
  },

  async listMaterials() {
    const { models } = await load();
    const counts = new Map<string, number>();
    for (const m of models) {
      for (const v of m.published) {
        for (const h of v.hides) counts.set(h, (counts.get(h) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ slug: toSlug(name), name, count }))
      .sort((a, b) => b.count - a.count) satisfies Material[];
  },

  async getMaterial(slug) {
    const all = await localContent.listMaterials();
    return all.find((m) => m.slug === slug) ?? null;
  },

  async listModelsByMaterial(slug) {
    const { models } = await load();
    const out: ModelInMaterial[] = [];
    for (const model of models) {
      const variants = model.published.filter(
        (v) => v.hides.some((h) => toSlug(h) === slug),
      );
      if (variants.length > 0) out.push({ model, variants });
    }
    return out.sort((a, b) => b.variants.length - a.variants.length);
  },

  async listEditorial() {
    const { editorial } = await load();
    return editorial;
  },
};
