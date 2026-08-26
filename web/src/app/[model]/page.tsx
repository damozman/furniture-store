import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { content } from "@/lib/content";
import { HideConfigurator } from "@/components/HideConfigurator";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BreadcrumbJsonLd, ModelJsonLd } from "@/components/JsonLd";

export async function generateStaticParams() {
  const models = await content.listModels();
  return models.map((m) => ({ model: m.slug }));
}

export async function generateMetadata(
  { params }: PageProps<"/[model]">,
): Promise<Metadata> {
  const { model: slug } = await params;
  const model = await content.getModel(slug);
  if (!model) return {};

  const hides = model.published.length;
  return {
    title: model.name,
    description:
      `The ${model.name} on a solid hardwood frame, offered in ${hides} ` +
      `${hides === 1 ? "hide" : "hides"}. Handcrafted leather furniture from Saddle & Hide.`,
  };
}

export default async function ModelPage({ params }: PageProps<"/[model]">) {
  const { model: slug } = await params;
  const model = await content.getModel(slug);

  // A model with no photographed variant is authored but not sellable, so it
  // must 404 rather than render an empty frame.
  if (!model || model.published.length === 0) notFound();

  const related = (await content.listModels({
    category: model.category ?? undefined,
  })).filter((m) => m.slug !== model.slug).slice(0, 4);

  return (
    <>
      <ModelJsonLd model={model} />
      <BreadcrumbJsonLd
        trail={[
          { name: "Home", path: "/" },
          ...(model.category
            ? [{
                name: model.category.replace(/-/g, " "),
                path: `/collections/${model.category}`,
              }]
            : []),
          { name: model.name, path: `/${model.slug}` },
        ]}
      />
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-6 py-10 lg:py-16">
        <nav className="mb-8 text-sm text-bark">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span className="mx-2">/</span>
          <span>{model.name}</span>
        </nav>

        <HideConfigurator model={model} />

        {related.length > 0 && (
          <section className="mt-24 border-t border-bone pt-12">
            <h2 className="text-2xl">More in this range</h2>
            <ul className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
              {related.map((m) => (
                <li key={m.slug}>
                  <Link href={`/${m.slug}`} className="group block">
                    <div className="overflow-hidden rounded-sm bg-studio">
                      <img
                        src={m.published[0].images[0]?.src}
                        srcSet={m.published[0].images
                          .map((i) => `${i.src} ${i.width}w`).join(", ")}
                        sizes="(min-width: 1024px) 22vw, 45vw"
                        alt={m.name}
                        width={800}
                        height={800}
                        loading="lazy"
                        className="aspect-square w-full object-cover transition
                                   duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <p className="mt-3 font-display text-lg">{m.name}</p>
                    <p className="text-sm text-bark">
                      {m.published.length}{" "}
                      {m.published.length === 1 ? "hide" : "hides"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
