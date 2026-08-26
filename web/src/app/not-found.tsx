import Link from "next/link";
import { content } from "@/lib/content";
import { ProductCard } from "@/components/ProductCard";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * A 404 on a catalogue site is usually a discontinued piece or a stale link, so
 * it routes people back into the range rather than dead-ending on an apology.
 */
export default async function NotFound() {
  const models = await content.listModels();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-16 lg:py-24">
        <p className="eyebrow">404</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">We can&rsquo;t find that page</h1>
        <p className="mt-4 max-w-lg text-bark">
          It may have moved, or the piece may no longer be in the range. Here is
          what people are looking at instead.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="bg-ink px-8 py-3 text-sm uppercase tracking-wide-caps
                       text-paper transition hover:bg-espresso"
          >
            Browse the range
          </Link>
          <Link
            href="/materials"
            className="border border-bone px-8 py-3 text-sm uppercase
                       tracking-wide-caps transition hover:border-brass"
          >
            Shop by material
          </Link>
        </div>

        <ul className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {models.slice(0, 4).map((m) => (
            <li key={m.slug}>
              <ProductCard model={m} />
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
