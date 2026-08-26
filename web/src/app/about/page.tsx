import type { Metadata } from "next";
import Link from "next/link";
import { content } from "@/lib/content";
import { ContentPage, NeedsConfirmation, Section } from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "About",
  description:
    "Saddle & Hide builds seating on solid hardwood frames, wrapped in full-grain " +
    "leather, embossed croc and natural hide.",
};

/**
 * Kept to what the catalogue and price list actually evidence. Founding story,
 * workshop location and people are the parts that make an about page worth
 * reading, and they have to come from the client rather than be invented here.
 */
export default async function AboutPage() {
  const [models, materials] = await Promise.all([
    content.listModels(),
    content.listMaterials(),
  ]);
  const finishes = models.reduce((n, m) => n + m.published.length, 0);

  return (
    <ContentPage
      title="About"
      intro="One frame, many hides — a range built around the material rather than around a silhouette."
    >
      <Section heading="What we make">
        <p>
          Bar and counter stools, dining chairs, accent chairs, office chairs,
          ottomans and sofas. {models.length} frames, offered across{" "}
          {materials.length} materials, for {finishes} finished combinations.
        </p>
        <p>
          The frames are <strong>solid hardwood</strong>. The upholstery is
          full-grain leather, embossed croc, and hair-on hide, finished with
          hand-set nailhead trim and hand-tufting where the design calls for it.
        </p>
      </Section>

      <Section heading="Why nothing matches exactly">
        <p>
          Because we work in real hide, no two pieces are identical. Grain,
          marking and colour depth shift from one animal to the next. A range
          built on printed vinyl can promise perfect consistency; this one
          promises the opposite, and that is the point.
        </p>
        <p>
          You can see it directly — browse a{" "}
          <Link href="/materials" className="text-ink underline underline-offset-4">
            single material
          </Link>{" "}
          across every frame it appears on.
        </p>
      </Section>

      <Section heading="Working with us">
        <p>
          Designers and architects specify our frames in their own leathers on
          residential, ranch and hospitality projects. If that is you, the{" "}
          <Link href="/trade" className="text-ink underline underline-offset-4">
            trade program
          </Link>{" "}
          covers pricing, samples and specification support.
        </p>
      </Section>

      <Section heading="Our story">
        <NeedsConfirmation>
          The parts that make this page worth reading — when the business
          started, who runs it, where the workshop is, how the pieces are built
          and by whom. This is the highest-value copy on the site for a
          considered purchase, and it has to come from you rather than be
          written around the gaps.
        </NeedsConfirmation>
      </Section>
    </ContentPage>
  );
}
