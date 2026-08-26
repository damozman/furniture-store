import type { Metadata } from "next";
import Link from "next/link";
import { content } from "@/lib/content";
import { ContentPage, NeedsConfirmation, Section } from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Sizing, materials, custom hides, trade pricing and delivery — answers to the " +
    "questions we get most.",
};

export default async function FaqPage() {
  const [models, materials] = await Promise.all([
    content.listModels(),
    content.listMaterials(),
  ]);
  const finishes = models.reduce((n, m) => n + m.published.length, 0);

  return (
    <ContentPage
      title="Frequently asked"
      intro="The questions worth answering before you order."
    >
      <Section heading="How do I choose between bar and counter height?">
        <p>
          Measure your surface, not the stool. A standard{" "}
          <strong>kitchen counter is about 36″</strong> and wants a seat around
          24–26″. A <strong>bar is about 42″</strong> and wants a seat around
          29–31″. You are aiming for roughly 10–12″ between seat and underside of
          the counter.
        </p>
        <p>
          Every product page lists the measured seat height for the piece you are
          looking at, so you can check it against your own tape rather than trust
          a category label.
        </p>
      </Section>

      <Section heading="Will two pieces match?">
        <p>
          Not exactly, and that is the nature of the material. Every hide comes
          from a different animal, so colour depth, grain and markings shift from
          piece to piece — including between two stools ordered together in the
          same leather.
        </p>
        <p>
          If you need the closest possible match across a set, say so when you
          order and pieces can be pulled from the same hide where the size allows.
        </p>
      </Section>

      <Section heading="How many materials are there?">
        <p>
          {materials.length} across the range, giving {finishes} finished
          combinations over {models.length} frames. You can browse by material in
          the{" "}
          <Link href="/materials" className="text-ink underline underline-offset-4">
            material library
          </Link>
          .
        </p>
      </Section>

      <Section heading="Can I supply my own hide?">
        <p>
          Yes — this is common on trade projects, where a designer has a specific
          leather specified for a room. Start with the{" "}
          <Link href="/trade" className="text-ink underline underline-offset-4">
            trade program
          </Link>{" "}
          and we will quote the frame in your material.
        </p>
      </Section>

      <Section heading="Do you offer trade pricing?">
        <p>
          Yes, for interior designers, architects, and hospitality specifiers.
          Designers place repeat and multi-unit orders, and the pricing reflects
          that.{" "}
          <Link href="/trade" className="text-ink underline underline-offset-4">
            Apply for trade access
          </Link>
          .
        </p>
      </Section>

      <Section heading="Is it built for commercial use?">
        <p>
          The frames are solid hardwood and the leathers are full-grain, which is
          the specification that matters for hospitality wear.
        </p>
        <NeedsConfirmation>
          Whether any of the range carries a commercial or contract-grade rating,
          and any weight limits worth publishing.
        </NeedsConfirmation>
      </Section>

      <Section heading="What is the warranty?">
        <NeedsConfirmation>
          Warranty term and what it covers — frame versus upholstery, residential
          versus commercial use.
        </NeedsConfirmation>
      </Section>
    </ContentPage>
  );
}
