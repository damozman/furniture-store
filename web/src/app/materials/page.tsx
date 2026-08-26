import type { Metadata } from "next";
import Link from "next/link";
import { content } from "@/lib/content";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Materials",
  description:
    "Every leather, hide, and finish in the Saddle & Hide range — embossed croc, " +
    "brindle cowhide, springbok, tufted full-grain and more.",
};

/**
 * The material library. Each entry is its own landing page, which is the part of
 * this site competitors don't have: people search "brown croc bar stool" far more
 * often than they search a model name they've never heard of.
 */
export default async function MaterialsPage() {
  const materials = await content.listMaterials();
  const byMaterial = await Promise.all(
    materials.map(async (m) => ({
      material: m,
      models: await content.listModelsByMaterial(m.slug),
    })),
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 lg:py-16">
        <nav className="mb-8 text-sm text-bark">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span className="mx-2">/</span>
          <span>Materials</span>
        </nav>

        <header className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl">Materials</h1>
          <p className="mt-4 text-bark">
            {materials.length} leathers, hides and finishes across the range.
            Every one is a natural material, so grain, marking and colour shift
            from piece to piece.
          </p>
        </header>

        <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {byMaterial.map(({ material, models }) => {
            const lead = models[0]?.variants[0];
            return (
              <li key={material.slug}>
                <Link href={`/materials/${material.slug}`} className="group block">
                  <div className="overflow-hidden rounded-sm bg-studio">
                    {lead && (
                      <img
                        src={lead.images[0]?.src}
                        srcSet={lead.images
                          .map((i) => `${i.src} ${i.width}w`).join(", ")}
                        sizes="(min-width: 1024px) 30vw, 45vw"
                        alt={material.name}
                        width={800}
                        height={800}
                        loading="lazy"
                        className="aspect-4/3 w-full object-cover transition
                                   duration-500 group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                  <p className="mt-3 font-display text-xl">{material.name}</p>
                  <p className="text-sm text-bark">
                    {material.count} {material.count === 1 ? "piece" : "pieces"}{" "}
                    across {models.length}{" "}
                    {models.length === 1 ? "model" : "models"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
