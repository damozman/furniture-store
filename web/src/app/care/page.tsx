import type { Metadata } from "next";
import { ContentPage, Section } from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "Care",
  description:
    "How to care for full-grain leather, embossed croc, and natural hair-on hide " +
    "furniture so it ages well.",
};

export default function CarePage() {
  return (
    <ContentPage
      title="Care"
      intro="Leather and hide are skins. Treated well they improve for decades; treated badly they dry, crack and fade faster than any fabric."
    >
      <Section heading="Where you put it">
        <p>
          <strong>Keep it out of direct sun.</strong> Ultraviolet light is the
          single biggest cause of premature ageing in leather — it fades pigment
          and dries the fibres underneath. A piece in a south-facing window will
          age years faster than the same piece across the room.
        </p>
        <p>
          <strong>Keep it away from heat.</strong> Radiators, vents and fireplaces
          drive moisture out of the hide. Aim for roughly an arm&rsquo;s length of
          clearance.
        </p>
      </Section>

      <Section heading="Routine cleaning">
        <p>
          Dust weekly with a dry, soft cloth. For hair-on hide, brush in the
          direction of the hair rather than against it.
        </p>
        <p>
          For marks, use a barely damp cloth with clean water and blot — never
          scrub, and never soak. Let it dry away from heat.
        </p>
        <p>
          <strong>Avoid</strong> household cleaners, solvents, alcohol wipes,
          saddle soap and &ldquo;all purpose&rdquo; leather sprays. Most strip
          the finish. If you want to condition, use a product made for finished
          upholstery leather and test it somewhere hidden first.
        </p>
      </Section>

      <Section heading="Spills">
        <p>
          Blot immediately with a dry cloth, working from the outside of the spill
          inward so you don&rsquo;t spread it. Water-based spills usually lift
          cleanly. Oil and grease are different — they darken the hide and are
          best handled by a professional leather cleaner rather than a home remedy.
        </p>
      </Section>

      <Section heading="What is normal, and not a fault">
        <p>
          <strong>Colour and grain vary between pieces.</strong> Every hide comes
          from a different animal. Two stools ordered in the same leather will not
          match exactly, and a pair photographed together will differ in the
          light.
        </p>
        <p>
          <strong>Natural markings.</strong> Scars, insect bites, brand marks and
          growth lines are characteristic of genuine full-grain leather. They are
          evidence it was never sanded and reprinted to look uniform.
        </p>
        <p>
          <strong>Patina.</strong> Leather softens, darkens slightly and takes on
          sheen where it is used. That is the material working as intended.
        </p>
      </Section>
    </ContentPage>
  );
}
