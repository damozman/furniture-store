/**
 * The commerce contract.
 *
 * Deliberately thin, and deliberately the only place payments are named. Stripe
 * handles cards well but solves neither furniture freight nor sales-tax nexus,
 * both of which get real at a $6,000 sectional shipping interstate. Keeping the
 * surface this small means adding Avalara, or swapping to Shopify's Storefront
 * API wholesale, touches this folder and nothing else.
 *
 * Note what `AddLineInput` does *not* carry: a price. The caller names a SKU and
 * a quantity; everything else is resolved from the catalogue server-side. A cart
 * that accepts a price from the client is a cart that can be bought from at a
 * price the client chose.
 */

export interface CartLine {
  sku: string;
  modelSlug: string;
  /** Resolved from the catalogue for display; never supplied by the caller. */
  name: string;
  hideLabel: string;
  heightClass: string | null;
  unitPrice: number;
  quantity: number;
  image: string | null;
}

export interface Cart {
  lines: CartLine[];
  subtotal: number;
  /** Null until an address is known -- never guess tax or freight. */
  tax: number | null;
  freight: number | null;
  total: number;
  currency: "USD";
}

export interface AddLineInput {
  sku: string;
  quantity?: number;
}

export interface CheckoutSession {
  url: string;
  id: string;
}

/** The opaque, storable representation of a cart. */
export type CartToken = string;

export interface CommerceSource {
  /** Read a cart from its token. An absent or unreadable token yields an empty cart. */
  getCart(token?: CartToken): Promise<Cart>;
  /** Each mutation returns the new cart and the token to persist. */
  addLine(token: CartToken | undefined, line: AddLineInput):
    Promise<{ cart: Cart; token: CartToken }>;
  setQuantity(token: CartToken | undefined, sku: string, quantity: number):
    Promise<{ cart: Cart; token: CartToken }>;
  removeLine(token: CartToken | undefined, sku: string):
    Promise<{ cart: Cart; token: CartToken }>;
  /** Throws until a real payment backend is configured. */
  createCheckout(token: CartToken): Promise<CheckoutSession>;
}
