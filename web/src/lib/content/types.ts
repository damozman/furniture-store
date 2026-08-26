/**
 * The content contract.
 *
 * Components depend on these types and on `ContentSource` -- never on where the
 * data physically lives. Today it is the JSON produced by the catalogue
 * extraction pipeline; later it is Sanity. Swapping the implementation must not
 * require touching a component, because better photography (and therefore a
 * steady trickle of content edits) arrives on the client's inventory schedule.
 */

export type CategorySlug =
  | "bar-stools"
  | "dining-chairs"
  | "accent-chairs"
  | "office-chairs"
  | "sofas"
  | "ottomans"
  | "pet-and-accessories";

export type Tier = "standard" | "clearance";

/** Seat height class. Getting this wrong is the single biggest cause of returns. */
export type HeightClass = "bar" | "counter";

export interface ImageSource {
  width: number;
  src: string;
}

/**
 * The full spec superset the catalogue uses. Every field is optional because
 * coverage is uneven today -- but the shape is complete, so a product gains a
 * spec by gaining data, never by needing a code change. Render conditionally.
 */
export interface Specs {
  raw: string;
  heightClass: HeightClass | null;
  /** Overall. */
  height: number | null;
  width: number | null;
  depth: number | null;
  /** Seat. */
  seatHeight: number | null;
  seatWidth: number | null;
  seatDepth: number | null;
  /** Arm. */
  armHeight: number | null;
  armWidth: number | null;
}

/** Ordered for display; label plus the key it reads. */
export const SPEC_FIELDS: ReadonlyArray<{ key: keyof Specs; label: string }> = [
  { key: "height", label: "Overall height" },
  { key: "width", label: "Overall width" },
  { key: "depth", label: "Overall depth" },
  { key: "seatHeight", label: "Seat height" },
  { key: "seatWidth", label: "Seat width" },
  { key: "seatDepth", label: "Seat depth" },
  { key: "armHeight", label: "Arm height" },
  { key: "armWidth", label: "Arm width" },
] as const;

export interface Variant {
  sku: string;
  /** Full price-list name, e.g. "Trophy 3 Brown Croc". */
  name: string;
  /** Just the material part, e.g. "Brown Croc" -- the swatch label. */
  hideLabel: string;
  hides: string[];
  price: number;
  specs: Specs | null;
  images: ImageSource[];
  /** False when no photograph exists yet; authored but not shown. */
  published: boolean;
  tier: Tier;
}

export interface Model {
  slug: string;
  name: string;
  category: CategorySlug | null;
  priceMin: number;
  priceMax: number;
  tier: Tier;
  /** Every variant, including unpublished ones. */
  variants: Variant[];
  /** Only the variants that can be shown and sold today. */
  published: Variant[];
  /** Height classes this model is offered in, derived from catalogue dimensions. */
  heights: HeightClass[];
}

export interface Category {
  slug: CategorySlug;
  name: string;
  modelCount: number;
}

/**
 * A material facet. Covers true hides ("Brown Croc", "Brindle") and the
 * construction and pattern terms the catalogue uses alongside them ("Tufted",
 * "Diamond") -- both are how customers actually search.
 */
export interface Material {
  slug: string;
  name: string;
  /** How many published variants across the whole range use this material. */
  count: number;
}

/** A model together with just the variants matching some material. */
export interface ModelInMaterial {
  model: Model;
  variants: Variant[];
}

export interface EditorialImage {
  id: string;
  page: number;
  aspect: number;
  sources: ImageSource[];
}

export interface ContentSource {
  listModels(opts?: { category?: CategorySlug }): Promise<Model[]>;
  getModel(slug: string): Promise<Model | null>;
  /**
   * Resolve a SKU to its variant and owning model. The cart depends on this:
   * price and description must come from the catalogue, never from the client.
   */
  findVariant(sku: string): Promise<{ model: Model; variant: Variant } | null>;
  listCategories(): Promise<Category[]>;
  listMaterials(): Promise<Material[]>;
  getMaterial(slug: string): Promise<Material | null>;
  listModelsByMaterial(slug: string): Promise<ModelInMaterial[]>;
  listEditorial(): Promise<EditorialImage[]>;
}
