import type { Model } from "@/lib/content/types";
import { absolute, site } from "@/lib/site";

/**
 * Structured data.
 *
 * Note what is deliberately absent: `offers.availability`. There is no inventory
 * feed, so claiming InStock would be asserting a fact we do not have -- which
 * misleads customers and is exactly what gets a Merchant Center account
 * penalised. Price and currency are real, so those are declared. Add availability
 * the day a stock source exists, not before.
 */
function Script({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function inches(value: number | null | undefined) {
  return typeof value === "number"
    ? { "@type": "QuantitativeValue", value, unitCode: "INH" }
    : undefined;
}

/**
 * A model is one frame offered in many hides, which is precisely what
 * ProductGroup/hasVariant describes -- so search engines understand these as one
 * product in several materials rather than N unrelated listings competing with
 * each other.
 */
export function ModelJsonLd({ model }: { model: Model }) {
  const url = absolute(`/${model.slug}`);

  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "ProductGroup",
        "@id": url,
        name: model.name,
        url,
        description:
          `The ${model.name} on a solid hardwood frame, offered in ` +
          `${model.published.length} materials.`,
        brand: { "@type": "Brand", name: site.name },
        productGroupID: model.slug,
        variesBy: ["https://schema.org/material"],
        hasVariant: model.published.map((v) => ({
          "@type": "Product",
          sku: v.sku,
          name: `${model.name} in ${v.hideLabel}`,
          material: v.hideLabel,
          image: v.images.map((i) => absolute(i.src)),
          height: inches(v.specs?.height),
          width: inches(v.specs?.width),
          depth: inches(v.specs?.depth),
          offers: {
            "@type": "Offer",
            price: v.price,
            priceCurrency: "USD",
            url,
          },
        })),
      }}
    />
  );
}

export function BreadcrumbJsonLd(
  { trail }: { trail: Array<{ name: string; path: string }> },
) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: trail.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.name,
          item: absolute(t.path),
        })),
      }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: site.name,
        url: site.url,
        description: site.description,
        telephone: site.telephone,
      }}
    />
  );
}
