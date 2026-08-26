import { ImageResponse } from "next/og";
import { content } from "@/lib/content";
import { ogPanel } from "@/lib/og-image";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Saddle & Hide — handcrafted leather furniture";

/** The brand card, used for every route that doesn't generate its own. */
const PANEL = { width: 640, height: 630 };

export default async function Image() {
  const editorial = await content.listEditorial();
  const hero = editorial.find((e) => e.page === 3) ?? editorial[0];
  const src = hero?.sources.find((s) => s.width >= 1600)?.src
    ?? hero?.sources.at(-1)?.src;
  const img = src ? await ogPanel(src, PANEL.width, PANEL.height) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex",
          background: "#17100c", color: "#f7f4f0",
        }}
      >
        <div
          style={{
            width: 560, height: 630, display: "flex", flexDirection: "column",
            justifyContent: "center", padding: 56,
          }}
        >
          <div style={{ fontSize: 22, letterSpacing: 5, color: "#c4a175" }}>
            SADDLE &amp; HIDE
          </div>
          <div style={{ fontSize: 62, marginTop: 22, lineHeight: 1.08 }}>
            Built on hardwood. Wrapped in hide.
          </div>
          <div style={{ fontSize: 26, marginTop: 26, color: "#c4a175" }}>
            Handcrafted leather furniture
          </div>
        </div>

        <div style={{ width: PANEL.width, height: PANEL.height, display: "flex" }}>
          {img && <img src={img} alt="" width={PANEL.width} height={PANEL.height} />}
        </div>
      </div>
    ),
    size,
  );
}
