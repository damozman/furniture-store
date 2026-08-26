import Link from "next/link";
import { content } from "@/lib/content";

export async function SiteFooter() {
  const [categories, hides] = await Promise.all([
    content.listCategories(),
    content.listMaterials(),
  ]);

  return (
    <footer className="border-t border-bone bg-bone/30">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-xl">
            Saddle <span className="text-brass">&amp;</span> Hide
          </p>
          <p className="mt-3 max-w-xs text-sm text-bark">
            Handcrafted leather furniture on solid hardwood frames.
          </p>
        </div>

        <nav aria-labelledby="f-cat">
          <h2 id="f-cat" className="eyebrow">Shop</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/collections/${c.slug}`}
                  className="text-bark transition hover:text-ink"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="f-hide">
          <h2 id="f-hide" className="eyebrow">Materials</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {hides.slice(0, 5).map((h) => (
              <li key={h.slug}>
                <Link
                  href={`/materials/${h.slug}`}
                  className="text-bark transition hover:text-ink"
                >
                  {h.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/materials" className="transition hover:text-brass">
                All materials →
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="f-help">
          <h2 id="f-help" className="eyebrow">Help</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              ["/shipping", "Shipping & delivery"],
              ["/care", "Care"],
              ["/faq", "FAQ"],
              ["/about", "About"],
              ["/trade", "Trade program"],
              ["/lookbook", "Lookbook"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-bark transition hover:text-ink">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
