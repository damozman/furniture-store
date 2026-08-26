/**
 * Site-level constants.
 *
 * The domain is not chosen yet, so it lives in one place behind an env var
 * rather than being scattered through sitemap, metadata and structured data.
 * Set NEXT_PUBLIC_SITE_URL at deploy time; everything downstream follows.
 */
export const site = {
  name: "Saddle & Hide",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.invalid")
    .replace(/\/$/, ""),
  description:
    "Handcrafted leather furniture on solid hardwood frames — bar stools, " +
    "dining and accent chairs in full-grain leather, embossed croc and natural hide.",
  telephone: "+1-714-423-5988",
} as const;

export function absolute(path: string) {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
