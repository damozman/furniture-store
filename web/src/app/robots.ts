import type { MetadataRoute } from "next";
import { absolute, site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Until a real domain is configured, keep the site out of the index entirely
  // rather than letting a staging URL get crawled and cached.
  const configured = !site.url.includes("example.invalid");

  return {
    rules: configured
      ? { userAgent: "*", allow: "/", disallow: ["/cart"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: configured ? absolute("/sitemap.xml") : undefined,
  };
}
