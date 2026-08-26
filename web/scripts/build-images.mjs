/**
 * Turn the extracted catalog PNGs into responsive web derivatives.
 *
 * Product shots are trimmed to their content and re-framed on a uniform square
 * canvas. The catalog laid every product out with different padding, so without
 * this a configurator swap makes the piece visibly jump and resize -- which is
 * exactly the cheap-feeling detail the whole design is trying to avoid.
 *
 * Output is keyed by SKU so images stay addressable as data, not as file paths.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const SRC = path.join(ROOT, "data", "out", "images");
const DEST = path.join(HERE, "..", "public", "img");

const PRODUCT_WIDTHS = [400, 800, 1600];
const EDITORIAL_WIDTHS = [800, 1600, 2400];
const CANVAS = "#ffffff"; // matches the studio backdrop; residual untrimmed
                          // background stays invisible, which matters because
                          // ivory and white-croc pieces cannot be trimmed hard
const PAD = 0.06;

async function productDerivatives(srcFile, sku) {
  const input = sharp(srcFile).flatten({ background: "#ffffff" });
  let trimmed;
  try {
    trimmed = await input.trim({ background: "#ffffff", threshold: 25 }).toBuffer();
  } catch {
    trimmed = await sharp(srcFile).flatten({ background: "#ffffff" }).toBuffer();
  }

  const meta = await sharp(trimmed).metadata();
  const side = Math.max(meta.width, meta.height);
  const box = Math.round(side * (1 + PAD * 2));

  const square = await sharp({
    create: {
      width: box, height: box, channels: 3,
      background: CANVAS,
    },
  })
    .composite([{
      input: trimmed,
      left: Math.round((box - meta.width) / 2),
      top: Math.round((box - meta.height) / 2),
    }])
    .png()
    .toBuffer();

  const out = [];
  for (const w of PRODUCT_WIDTHS) {
    const file = `${sku}-${w}.webp`;
    await sharp(square)
      .resize(w, w, { fit: "cover" })
      .webp({ quality: 82 })
      .toFile(path.join(DEST, "product", file));
    out.push({ width: w, src: `/img/product/${file}` });
  }
  return out;
}

async function editorialDerivatives(srcFile, name) {
  const meta = await sharp(srcFile).metadata();

  // Don't upscale past the source, but always emit at least one derivative:
  // an entry with no sources renders an <img> with no src.
  const widths = EDITORIAL_WIDTHS.filter((w) => w <= meta.width * 1.2);
  if (widths.length === 0) widths.push(meta.width);

  const out = [];
  for (const w of widths) {
    const file = `${name}-${w}.webp`;
    await sharp(srcFile)
      .resize(w, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(DEST, "editorial", file));
    out.push({ width: w, src: `/img/editorial/${file}` });
  }
  return { sources: out, aspect: +(meta.width / meta.height).toFixed(4) };
}

async function main() {
  await mkdir(path.join(DEST, "product"), { recursive: true });
  await mkdir(path.join(DEST, "editorial"), { recursive: true });

  const products = JSON.parse(
    await readFile(path.join(ROOT, "data", "out", "products.json"), "utf8"));
  const catalog = JSON.parse(
    await readFile(path.join(ROOT, "data", "out", "catalog.json"), "utf8"));

  const manifest = { product: {}, editorial: [] };
  let done = 0, skipped = 0;

  for (const model of products.models) {
    for (const v of model.variants) {
      if (!v.image) { skipped++; continue; }
      const srcFile = path.join(SRC, v.image.file);
      if (!existsSync(srcFile)) { skipped++; continue; }
      manifest.product[v.sku] = await productDerivatives(srcFile, v.sku);
      done++;
      if (done % 25 === 0) console.log(`  ${done} product images...`);
    }
  }

  for (const page of catalog) {
    for (const e of page.editorial) {
      const srcFile = path.join(SRC, e.file);
      if (!existsSync(srcFile)) continue;
      const name = path.basename(e.file, ".png");
      const { sources, aspect } = await editorialDerivatives(srcFile, name);
      manifest.editorial.push({ id: name, page: page.page, aspect, sources });
    }
  }

  await writeFile(path.join(DEST, "manifest.json"),
    JSON.stringify(manifest, null, 2), "utf8");

  console.log(`\nproduct : ${done} SKUs (${skipped} without usable source)`);
  console.log(`editorial: ${manifest.editorial.length} images`);
  console.log(`manifest : public/img/manifest.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
