import Link from "next/link";
import { content } from "@/lib/content";
import { ProductCard } from "@/components/ProductCard";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OrganizationJsonLd } from "@/components/JsonLd";

/**
 * The homepage leans on the catalogue's editorial photography, which is the
 * strongest asset the business owns. Product grids come after the room shots,
 * because the rooms are what make a $1,700 chair look like $1,700.
 */
export default async function HomePage() {
  const [models, editorial, materials] = await Promise.all([
    content.listModels(),
    content.listEditorial(),
    content.listMaterials(),
  ]);

  const hero = editorial.find((e) => e.page === 3) ?? editorial[0];
  const finishes = models.reduce((n, m) => n + m.published.length, 0);

  return (
    <>
      <OrganizationJsonLd />
      <SiteHeader />

      <main className="flex-1">
        {hero && (
          <section className="relative">
            <img
              src={hero.sources.at(-1)?.src}
              srcSet={hero.sources.map((s) => `${s.src} ${s.width}w`).join(", ")}
              sizes="100vw"
              alt=""
              className="h-[70vh] min-h-100 w-full object-cover"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-linear-to-t from-ink/75 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-7xl px-6 pb-12">
              <h1 className="max-w-2xl text-4xl text-paper sm:text-6xl">
                Built on hardwood. Wrapped in hide.
              </h1>
              <p className="mt-4 max-w-xl text-paper/85">
                Bar stools, dining and accent chairs in full-grain leather,
                embossed croc, and natural hide — no two pieces alike.
              </p>
            </div>
          </section>
        )}

        <section className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-3xl">The range</h2>
            <p className="text-sm text-bark">
              {models.length} models · {finishes} finishes
            </p>
          </div>

          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {models.slice(0, 8).map((m, i) => (
              <li key={m.slug}>
                <ProductCard model={m} priority={i < 4} />
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-bone bg-bone/40">
          <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
            <h2 className="text-3xl">The materials</h2>
            <p className="mt-3 max-w-xl text-bark">
              Each frame is offered across the full range. Because every hide is
              a natural material, grain and colour shift from piece to piece —
              no two are identical.
            </p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {materials.slice(0, 10).map((m) => (
                <li key={m.slug}>
                  <Link
                    href={`/materials/${m.slug}`}
                    className="block rounded-full border border-tan/60 px-4 py-2
                               text-sm transition hover:border-brass hover:bg-paper"
                  >
                    {m.name} <span className="text-bark">{m.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
