import Link from "next/link";
import type { Model } from "@/lib/content/types";

/**
 * One card, used by the homepage, category pages, hide pages and the related
 * rail. Product photography is the whole pitch, so the card is mostly image.
 */
export function ProductCard({
  model,
  sizes = "(min-width: 1024px) 22vw, 45vw",
  priority = false,
}: {
  model: Model;
  sizes?: string;
  priority?: boolean;
}) {
  const lead = model.published[0];
  if (!lead) return null;

  const from = model.priceMin.toLocaleString("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  });

  return (
    <Link href={`/${model.slug}`} className="group block">
      <div className="overflow-hidden rounded-sm bg-studio">
        <img
          src={lead.images[0]?.src}
          srcSet={lead.images.map((i) => `${i.src} ${i.width}w`).join(", ")}
          sizes={sizes}
          alt={model.name}
          width={800}
          height={800}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          className="aspect-square w-full object-cover transition duration-500
                     group-hover:scale-[1.03]"
        />
      </div>
      <p className="mt-3 font-display text-lg">{model.name}</p>
      <p className="text-sm text-bark">
        {model.published.length}{" "}
        {model.published.length === 1 ? "hide" : "hides"} · from {from}
      </p>
    </Link>
  );
}
