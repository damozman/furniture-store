import type { Metadata } from "next";
import Link from "next/link";
import { content } from "@/lib/content";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TradeForm } from "@/components/TradeForm";

export const metadata: Metadata = {
  title: "Trade program",
  description:
    "Trade pricing, material samples and project support for interior designers, " +
    "architects and hospitality specifiers working with Saddle & Hide.",
};

/**
 * The trade funnel.
 *
 * Designers and architects place repeat, multi-unit, high-value orders, which
 * makes this the highest-leverage channel in the category -- and the one a
 * consumer-shaped homepage serves worst. It gets its own page, its own proof
 * points, and its own form.
 */
export default async function TradePage() {
  const [models, materials, editorial] = await Promise.all([
    content.listModels(),
    content.listMaterials(),
    content.listEditorial(),
  ]);

  const hero = editorial.find((e) => e.page === 47) ?? editorial[0];
  const finishes = models.reduce((n, m) => n + m.published.length, 0);

  const points = [
    {
      title: "Trade pricing",
      body: "Tiered pricing on every frame, with project rates on multi-unit orders.",
    },
    {
      title: "Any hide, any frame",
      body: `${materials.length} materials across ${models.length} frames — ${finishes} ` +
        "combinations, and we will quote a hide you supply.",
    },
    {
      title: "Specification support",
      body: "Full dimensions, COM guidance and material samples before you specify.",
    },
    {
      title: "Contract-ready",
      body: "Solid hardwood frames and full-grain leather built for hospitality wear.",
    },
  ];

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {hero && (
          <section className="relative">
            <img
              src={hero.sources.at(-1)?.src}
              srcSet={hero.sources.map((s) => `${s.src} ${s.width}w`).join(", ")}
              sizes="100vw"
              alt=""
              className="h-[45vh] min-h-72 w-full object-cover"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-linear-to-t from-ink/80 to-ink/20" />
            <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-7xl px-6 pb-10">
              <p className="eyebrow text-paper/70">For the trade</p>
              <h1 className="mt-2 max-w-3xl text-4xl text-paper sm:text-5xl">
                Designers, architects and specifiers
              </h1>
            </div>
          </section>
        )}

        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
          <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div>
              <p className="max-w-lg text-lg text-bark">
                We work directly with studios on residential, ranch and hospitality
                projects — from a pair of counter stools to a full dining room in a
                hide we cut for the job.
              </p>

              <dl className="mt-10 space-y-8">
                {points.map((p) => (
                  <div key={p.title} className="border-t border-bone pt-5">
                    <dt className="font-display text-xl">{p.title}</dt>
                    <dd className="mt-2 text-sm text-bark">{p.body}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-10 text-sm text-bark">
                Already working with us?{" "}
                <Link href="/materials" className="text-ink underline underline-offset-4">
                  Browse the material library
                </Link>
                .
              </p>
            </div>

            <div className="lg:pl-4">
              <h2 className="text-2xl">Apply for trade access</h2>
              <p className="mt-2 mb-8 text-sm text-bark">
                Tell us about your studio and we&rsquo;ll send pricing and a
                materials package.
              </p>
              <TradeForm />
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
