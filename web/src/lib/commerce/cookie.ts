import "server-only";
import { content } from "@/lib/content";
import type {
  AddLineInput, Cart, CartLine, CartToken, CheckoutSession, CommerceSource,
} from "./types";

/**
 * Cart stored in the token itself.
 *
 * The previous in-memory implementation lost every cart on restart and could not
 * survive more than one server instance -- fine for a scratch build, broken the
 * moment this deploys anywhere real. Keeping the cart in the token means no
 * database, no session store, and correct behaviour on serverless.
 *
 * The token holds only `[sku, quantity]` pairs. Prices, names and images are
 * resolved from the catalogue on every read, which means:
 *   - a tampered token can change what is in the cart, but never what it costs;
 *   - a price change is reflected in existing carts immediately;
 *   - an unpublished or deleted SKU silently drops out rather than 500ing.
 *
 * Because it carries no secrets and grants no authority, the token needs no
 * signing. It is capped so a crafted cookie can't be used to blow up rendering.
 */

const MAX_LINES = 40;
const MAX_QTY = 99;

type Packed = [string, number][];

function decode(token?: CartToken): Packed {
  if (!token) return [];
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    const clean: Packed = [];
    for (const entry of parsed) {
      if (!Array.isArray(entry)) continue;
      const [sku, qty] = entry as [unknown, unknown];
      if (typeof sku !== "string" || typeof qty !== "number") continue;
      const n = Math.min(Math.max(Math.trunc(qty), 1), MAX_QTY);
      if (!Number.isFinite(n)) continue;
      clean.push([sku, n]);
      if (clean.length >= MAX_LINES) break;
    }
    return clean;
  } catch {
    return [];
  }
}

function encode(packed: Packed): CartToken {
  return Buffer.from(JSON.stringify(packed), "utf8").toString("base64url");
}

async function hydrate(packed: Packed): Promise<Cart> {
  const lines: CartLine[] = [];

  for (const [sku, quantity] of packed) {
    const found = await content.findVariant(sku);
    if (!found) continue; // discontinued or unpublished — drop it quietly
    const { model, variant } = found;
    lines.push({
      sku,
      modelSlug: model.slug,
      name: model.name,
      hideLabel: variant.hideLabel,
      heightClass: variant.specs?.heightClass ?? null,
      unitPrice: variant.price,
      quantity,
      image: variant.images[0]?.src ?? null,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  return {
    lines,
    subtotal,
    // Unknown until a destination is known. Total therefore means goods only,
    // and the UI has to say so.
    tax: null,
    freight: null,
    total: subtotal,
    currency: "USD",
  };
}

async function commit(packed: Packed) {
  const trimmed = packed.filter(([, q]) => q > 0).slice(0, MAX_LINES);
  return { cart: await hydrate(trimmed), token: encode(trimmed) };
}

export const cookieCommerce: CommerceSource = {
  async getCart(token) {
    return hydrate(decode(token));
  },

  async addLine(token, { sku, quantity = 1 }: AddLineInput) {
    // Reject unknown or unpublished SKUs at the door rather than storing junk.
    if (!(await content.findVariant(sku))) {
      return { cart: await hydrate(decode(token)), token: token ?? encode([]) };
    }

    const packed = decode(token);
    const qty = Math.min(Math.max(Math.trunc(quantity), 1), MAX_QTY);
    const existing = packed.find(([s]) => s === sku);
    if (existing) {
      existing[1] = Math.min(existing[1] + qty, MAX_QTY);
    } else {
      packed.push([sku, qty]);
    }
    return commit(packed);
  },

  async setQuantity(token, sku, quantity) {
    const packed = decode(token).filter(([s]) => s !== sku);
    const qty = Math.min(Math.trunc(quantity), MAX_QTY);
    if (qty > 0) packed.push([sku, qty]);
    return commit(packed);
  },

  async removeLine(token, sku) {
    return commit(decode(token).filter(([s]) => s !== sku));
  },

  async createCheckout(): Promise<CheckoutSession> {
    throw new Error(
      "No payment backend configured. Implement CommerceSource against Stripe " +
      "(and a tax/freight provider) in src/lib/commerce before taking orders.",
    );
  },
};
