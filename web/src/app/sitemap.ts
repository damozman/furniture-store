import type { MetadataRoute } from "next";
import { content } from "@/lib/content";
import { absolute } from "@/lib/site";

/**
 * Generated from the same content source the pages render from, so a model or
 * material can never be live but missing from the sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [models, categories, materials] = await Promise.all([
    content.listModels(),
    content.listCategories(),
    content.listMaterials(),
  ]);

  const now = new Date();

  return [
    { url: absolute("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absolute("/materials"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absolute("/trade"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absolute("/lookbook"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...["/about", "/shipping", "/care", "/faq"].map((p) => ({
      url: absolute(p),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...categories.map((c) => ({
      url: absolute(`/collections/${c.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...models.map((m) => ({
      url: absolute(`/${m.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...materials.map((m) => ({
      url: absolute(`/materials/${m.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
