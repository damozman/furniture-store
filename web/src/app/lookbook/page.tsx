import type { Metadata } from "next";
import { content } from "@/lib/content";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SubscribeForm } from "@/components/SubscribeForm";

export const metadata: Metadata = {
  title: "Lookbook",
  description:
    "Rooms built around handcrafted leather furniture. See the full Saddle & Hide " +
    "lookbook and materials guide.",
};

/**
 * The capture offer.
 *
 * Furniture has a long consideration cycle -- someone who likes a $1,700 chair
 * today may buy in three months -- so the job here is to earn an email, not a
 * sale. The editorial photography is the only thing worth trading for one, so
 * this page shows enough of it to prove the rest is worth having.
 */
export default async function LookbookPage() {
  const editorial = await content.listEditorial();

  // Widest images first: the room shots carry the brand, the tighter crops don't.
  const gallery = [...editorial]
    .sort((a, b) => b.aspect - a.aspect)
    .slice(0, 12);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">Lookbook</p>
            <h1 className="mt-2 text-4xl sm:text-6xl">Rooms it belongs in</h1>
            <p className="mt-5 text-lg text-bark">
              Photographs from homes, ranches and bars built around the range —
              plus a materials guide covering every leather and hide we work in.
            </p>
            <div className="mt-8 max-w-xl">
              <SubscribeForm />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-20">
          <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>li]:mb-5">
            {gallery.map((e) => (
              <li key={e.id} className="break-inside-avoid overflow-hidden rounded-sm">
                <img
                  src={e.sources[0]?.src}
                  srcSet={e.sources.map((s) => `${s.src} ${s.width}w`).join(", ")}
                  sizes="(min-width: 1024px) 32vw, (min-width: 640px) 48vw, 100vw"
                  alt=""
                  loading="lazy"
                  className="w-full"
                />
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
