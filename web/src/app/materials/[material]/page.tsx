import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { content } from "@/lib/content";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export async function generateStaticParams() {
  const materials = await content.listMaterials();
  return materials.map((m) => ({ material: m.slug }));
}

export async function generateMetadata(
  { params }: PageProps<"/materials/[material]">,
): Promise<Metadata> {
  const { material: slug } = await params;
  const material = await content.getMaterial(slug);
  if (!material) return {};

  return {
    title: material.name,
    description:
      `Every piece available in ${material.name} — ${material.count} ` +
      `${material.count === 1 ? "piece" : "pieces"} across the Saddle & Hide range, ` +
      `on solid hardwood frames.`,
  };
}

/**
 * A material landing page shows the specific variants in that material rather
 * than a model's default photo, so what you see is genuinely the thing you
 * searched for.
 */
export default async function MaterialPage(
  { params }: PageProps<"/materials/[material]">,
) {
  const { material: slug } = await params;
  const material = await content.getMaterial(slug);
  if (!material) notFound();

  const groups = await content.listModelsByMaterial(slug);
  if (groups.length === 0) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 lg:py-16">
        <nav className="mb-8 text-sm text-bark">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/materials" className="hover:text-ink">Materials</Link>
          <span className="mx-2">/</span>
          <span>{material.name}</span>
        </nav>

        <header className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl">{material.name}</h1>
          <p className="mt-4 text-bark">
            {material.count} {material.count === 1 ? "piece" : "pieces"} across{" "}
            {groups.length} {groups.length === 1 ? "model" : "models"}. Each is a
            natural material — no two pieces carry the same grain or marking.
          </p>
        </header>

        <div className="mt-12 space-y-16">
          {groups.map(({ model, variants }) => (
            <section key={model.slug}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-2xl">
                  <Link href={`/${model.slug}`} className="hover:text-brass">
                    {model.name}
                  </Link>
                </h2>
                <Link
                  href={`/${model.slug}`}
                  className="text-sm text-bark transition hover:text-ink"
                >
                  All {model.published.length} finishes →
                </Link>
              </div>

              <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
                {variants.map((v) => (
                  <li key={v.sku}>
                    <Link href={`/${model.slug}`} className="group block">
                      <div className="overflow-hidden rounded-sm bg-studio">
                        <img
                          src={v.images[0]?.src}
                          srcSet={v.images
                            .map((i) => `${i.src} ${i.width}w`).join(", ")}
                          sizes="(min-width: 1024px) 22vw, 45vw"
                          alt={`${model.name} in ${v.hideLabel}`}
                          width={800}
                          height={800}
                          loading="lazy"
                          className="aspect-square w-full object-cover transition
                                     duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                      <p className="mt-3 text-sm">{v.hideLabel}</p>
                      <p className="text-sm text-bark">
                        {v.price.toLocaleString("en-US", {
                          style: "currency", currency: "USD",
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
