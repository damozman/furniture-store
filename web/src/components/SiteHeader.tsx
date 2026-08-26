import Link from "next/link";
import { content } from "@/lib/content";
import { CartBadge } from "@/components/CartBadge";
import { MobileNav } from "@/components/MobileNav";

export async function SiteHeader() {
  const categories = await content.listCategories();

  return (
    <header className="relative border-b border-bone">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between
                      gap-4 px-6 py-5">
        <div className="flex items-center gap-4">
          <MobileNav categories={categories} />
          <Link href="/" className="shrink-0 font-display text-xl tracking-tight">
            Saddle <span className="text-brass">&amp;</span> Hide
          </Link>
        </div>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-6 text-sm">
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
            <li>
              <Link href="/materials" className="text-bark transition hover:text-ink">
                Materials
              </Link>
            </li>
            <li>
              <Link href="/trade" className="text-bark transition hover:text-ink">
                Trade
              </Link>
            </li>
          </ul>
        </nav>

        <CartBadge />
      </div>
    </header>
  );
}
