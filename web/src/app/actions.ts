"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { commerce } from "@/lib/commerce";
import type { CartToken } from "@/lib/commerce";

const CART_COOKIE = "sh_cart";
const MAX_AGE = 60 * 60 * 24 * 30;

/**
 * The cart lives in the cookie; this file just moves the token in and out of it.
 * Nothing here knows about Stripe, and nothing here trusts a price.
 */
async function readToken(): Promise<CartToken | undefined> {
  return (await cookies()).get(CART_COOKIE)?.value;
}

async function writeToken(token: CartToken) {
  (await cookies()).set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function addToCart(sku: string, quantity = 1) {
  const { cart, token } = await commerce.addLine(await readToken(), {
    sku, quantity,
  });
  await writeToken(token);
  revalidatePath("/cart");
  return {
    lineCount: cart.lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: cart.subtotal,
  };
}

export async function getCart() {
  return commerce.getCart(await readToken());
}

export async function getCartSummary() {
  const cart = await commerce.getCart(await readToken());
  return {
    lineCount: cart.lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: cart.subtotal,
  };
}

export async function setLineQuantity(sku: string, quantity: number) {
  const { token } = await commerce.setQuantity(await readToken(), sku, quantity);
  await writeToken(token);
  revalidatePath("/cart");
}

export async function removeLine(sku: string) {
  const { token } = await commerce.removeLine(await readToken(), sku);
  await writeToken(token);
  revalidatePath("/cart");
}
