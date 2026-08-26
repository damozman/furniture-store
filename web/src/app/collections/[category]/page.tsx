import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { content } from "@/lib/content";
import type { CategorySlug } from "@/lib/content/types";
import { CategoryBrowser } from "@/components/CategoryBrowser";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export async function generateStaticParams() {
  const categories = await content.listCategories();
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata(
  { params }: PageProps<"/collections/[category]">,
): Promise<Metadata> {
  const { category } = await params;
  const all = await content.listCategories();
  const match = all.find((c) => c.slug === category);
  if (!match) return {};

  return {
    title: match.name,
    description:
      `${match.name} from Saddle & Hide — ${match.modelCount} models on solid ` +
      `hardwood frames, in full-grain leather, embossed croc and natural hide.`,
  };
}

export default async function CategoryPage(
  { params }: PageProps<"/collections/[category]">,
) {
  const { category } = await params;
  const categories = await content.listCategories();
  const match = categories.find((c) => c.slug === category);
  if (!match) notFound();

  const models = await content.listModels({
    category: category as CategorySlug,
  });
  const finishes = models.reduce((n, m) => n + m.published.length, 0);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 lg:py-16">
        <nav className="mb-8 text-sm text-bark">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span className="mx-2">/</span>
          <span>{match.name}</span>
        </nav>

        <header className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl">{match.name}</h1>
          <p className="mt-4 text-bark">
            {models.length} {models.length === 1 ? "model" : "models"} ·{" "}
            {finishes} {finishes === 1 ? "finish" : "finishes"}. Every frame is
            offered across the material range, and because each hide is natural,
            no two pieces are identical.
          </p>
        </header>

        <CategoryBrowser models={models} />
      </main>
      <SiteFooter />
    </>
  );
}
