import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Prepare a local image for embedding in an ImageResponse.
 *
 * Satori (the renderer behind ImageResponse) decodes some of our WebP
 * derivatives and throws an opaque "u2 is not iterable" on others -- the
 * editorial crops fail where the square product shots succeed, despite identical
 * colour space and channel count. Rather than depend on which files it happens to
 * tolerate, every OG source goes through here and comes out as JPEG at exactly
 * the panel size, which also keeps the inlined base64 payload small.
 *
 * Runs at build time, when there is no server to fetch `/img/...` from, so the
 * file is read straight off disk.
 */
export async function ogPanel(
  publicPath: string,
  width: number,
  height: number,
): Promise<string | null> {
  try {
    const file = path.join(process.cwd(), "public", publicPath);
    const buf = await sharp(await readFile(file))
      .resize(width, height, { fit: "cover", position: "attention" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    // A missing or undecodable source must not fail the whole build -- the card
    // still renders, just without its photograph.
    return null;
  }
}
