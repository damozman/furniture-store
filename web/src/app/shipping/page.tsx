import type { Metadata } from "next";
import { ContentPage, NeedsConfirmation, Section } from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "Shipping & delivery",
  description:
    "How Saddle & Hide furniture ships, what freight delivery involves, and what " +
    "to check when it arrives.",
};

/**
 * Shipping is the most-read page on a furniture site and the one most likely to
 * lose a sale, because freight is unfamiliar and expensive.
 *
 * The general logistics explanation below is true of the industry and safe to
 * state. Anything that is a commitment by this business -- lead times, who pays
 * what, how long a damage claim stays open -- is deliberately left as a marked
 * placeholder rather than invented. See the plan's open questions.
 */
export default function ShippingPage() {
  return (
    <ContentPage
      title="Shipping & delivery"
      intro="Furniture does not ship like a parcel. Here is what actually happens between your order and your room."
    >
      <Section heading="How it ships">
        <p>
          Smaller accessories go by standard parcel carrier. Everything else —
          stools, chairs, ottomans, sofas — moves by <strong>freight</strong>,
          on a pallet, on a truck with a lift gate.
        </p>
        <p>
          Freight carriers deliver on a scheduled appointment rather than a
          surprise doorstep drop. They will call to arrange a window, and someone
          over 18 needs to be there to receive and sign.
        </p>
      </Section>

      <Section heading="Levels of delivery">
        <p>
          <strong>Curbside</strong> puts the pallet at the end of your driveway.
          Getting it inside is yours.
        </p>
        <p>
          <strong>Threshold</strong> brings it through the first doorway — inside
          a garage or entryway, not up stairs.
        </p>
        <p>
          <strong>White glove</strong> brings it to the room you want, unpacks it,
          and takes the packaging away. For anything large or anything going above
          a ground floor, this is usually worth the difference.
        </p>
        <NeedsConfirmation>
          Which levels are offered, and how each is priced by item and destination.
        </NeedsConfirmation>
      </Section>

      <Section heading="Lead times">
        <p>
          Pieces are made in specific hides rather than pulled from a wall of
          identical stock, so availability varies by material as well as by frame.
        </p>
        <NeedsConfirmation>
          Typical lead time for in-stock pieces versus a made-to-order hide, and
          whether that changes for multi-unit and trade orders.
        </NeedsConfirmation>
      </Section>

      <Section heading="When it arrives — do this before you sign">
        <p>
          Inspect the carton before the driver leaves. If there is any damage to
          the packaging, <strong>write it on the delivery receipt before you
          sign</strong>. Signing a clean receipt makes a freight damage claim
          much harder to win, and that is true of every carrier, not just ours.
        </p>
        <p>
          Photograph the packaging and the piece before you break anything down,
          and keep the carton until you are satisfied.
        </p>
        <NeedsConfirmation>
          How long after delivery a damage claim can be opened, and how
          replacements are handled.
        </NeedsConfirmation>
      </Section>

      <Section heading="Returns">
        <NeedsConfirmation>
          Return window, restocking policy, who pays return freight, and whether
          made-to-order hides are final sale. These are the answers that decide
          whether someone buys a $1,699 chair online, so they are worth getting
          right rather than fast.
        </NeedsConfirmation>
      </Section>
    </ContentPage>
  );
}
