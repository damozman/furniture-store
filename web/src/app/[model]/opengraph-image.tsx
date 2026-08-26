import { ImageResponse } from "next/og";
import { content } from "@/lib/content";
import { ogPanel } from "@/lib/og-image";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Saddle & Hide";

/**
 * Per-model social card.
 *
 * Pinterest and Instagram do disproportionate work in this category, and a shared
 * link with no card is a wasted impression. The product photograph carries the
 * card; type stays out of its way.
 *
 * The image is read off disk and inlined as a data URI because this runs at build
 * time, when there is no server to fetch `/img/...` from.
 */
const PANEL = { width: 630, height: 630 };

export default async function Image(
  { params }: { params: Promise<{ model: string }> },
) {
  const { model: slug } = await params;
  const model = await content.getModel(slug);

  const lead = model?.published[0];
  const src = lead?.images.find((i) => i.width === 800)?.src
    ?? lead?.images[0]?.src;
  const img = src ? await ogPanel(src, PANEL.width, PANEL.height) : null;

  const hides = model?.published.length ?? 0;
  const from = model
    ? model.priceMin.toLocaleString("en-US", {
        style: "currency", currency: "USD", maximumFractionDigits: 0,
      })
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex",
          background: "#f7f4f0", color: "#17100c",
        }}
      >
        <div
          style={{
            flex: "1", display: "flex", flexDirection: "column",
            justifyContent: "center", padding: "64px 56px",
          }}
        >
          <div
            style={{
              fontSize: 22, letterSpacing: 4, textTransform: "uppercase",
              color: "#4a3527",
            }}
          >
            Saddle &amp; Hide
          </div>
          <div style={{ fontSize: 84, marginTop: 20, lineHeight: 1.05 }}>
            {model?.name ?? "Saddle & Hide"}
          </div>
          {model && (
            // One interpolated string, not several children: Satori requires an
            // explicit `display: flex` on any div holding more than one child
            // node, and JSX text mixed with expressions counts as several.
            <div style={{ fontSize: 30, marginTop: 24, color: "#4a3527" }}>
              {`${hides} ${hides === 1 ? "hide" : "hides"} · from ${from}`}
            </div>
          )}
          <div
            style={{
              marginTop: 32, width: 96, height: 3, background: "#a8823f",
              display: "flex",
            }}
          />
        </div>

        <div
          style={{
            width: 630, height: 630, display: "flex",
            alignItems: "center", justifyContent: "center", background: "#ffffff",
          }}
        >
          {img && (
            <img
              src={img}
              alt=""
              width={PANEL.width}
              height={PANEL.height}
              style={{ objectFit: "cover" }}
            />
          )}
        </div>
      </div>
    ),
    size,
  );
}
