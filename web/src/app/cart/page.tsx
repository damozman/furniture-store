import type { Metadata } from "next";
import Link from "next/link";
import { getCart, removeLine, setLineQuantity } from "@/app/actions";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = { title: "Cart" };

function currency(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  });
}

/**
 * The cart deliberately shows a goods subtotal, not a total. Freight on a stool
 * is not the freight on a sectional, and sales tax depends on where it ships --
 * neither is known here. Showing a confident "total" that later grows is how
 * checkouts lose trust.
 */
export default async function CartPage() {
  const cart = await getCart();
  const lines = cart.lines;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 lg:py-16">
        <h1 className="text-4xl sm:text-5xl">Cart</h1>

        {lines.length === 0 ? (
          <div className="mt-10 border-t border-bone pt-10">
            <p className="text-bark">Your cart is empty.</p>
            <Link
              href="/"
              className="mt-6 inline-block bg-ink px-8 py-3 text-sm uppercase
                         tracking-wide-caps text-paper transition hover:bg-espresso"
            >
              Browse the range
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-10 divide-y divide-bone border-y border-bone">
              {lines.map((line) => (
                <li key={line.sku} className="flex gap-5 py-6">
                  <Link
                    href={`/${line.modelSlug}`}
                    className="shrink-0 overflow-hidden rounded-sm bg-studio"
                  >
                    {line.image && (
                      <img
                        src={line.image}
                        alt={`${line.name} in ${line.hideLabel}`}
                        width={112}
                        height={112}
                        className="h-28 w-28 object-cover"
                      />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-wrap gap-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/${line.modelSlug}`}
                        className="font-display text-lg hover:text-brass"
                      >
                        {line.name}
                      </Link>
                      <p className="text-sm text-bark">{line.hideLabel}</p>
                      {line.heightClass && (
                        <p className="text-sm capitalize text-bark">
                          {line.heightClass} height
                        </p>
                      )}
                      <p className="mt-1 text-xs text-bark">SKU {line.sku}</p>

                      <form action={removeLine.bind(null, line.sku)}>
                        <button
                          type="submit"
                          className="mt-2 text-xs text-bark underline
                                     underline-offset-2 hover:text-ink"
                        >
                          Remove
                        </button>
                      </form>
                    </div>

                    <div className="flex items-start gap-5">
                      <form
                        action={async (formData: FormData) => {
                          "use server";
                          await setLineQuantity(
                            line.sku, Number(formData.get("quantity")));
                        }}
                      >
                        <label
                          htmlFor={`qty-${line.sku}`}
                          className="sr-only"
                        >
                          Quantity for {line.name}
                        </label>
{/* Keyed on the quantity so the select remounts when the cart
                            changes. Without this, `defaultValue` keeps the value
                            it mounted with and the control shows a stale number
                            while the line total shows the real one. */}
                        <select
                          key={`${line.sku}-${line.quantity}`}
                          id={`qty-${line.sku}`}
                          name="quantity"
                          defaultValue={line.quantity}
                          className="h-10 rounded-sm border border-bone bg-studio px-2 text-sm"
                        >
                          {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="ml-2 text-xs text-bark underline
                                     underline-offset-2 hover:text-ink"
                        >
                          Update
                        </button>
                      </form>

                      <p className="w-24 text-right font-display text-lg">
                        {currency(line.unitPrice * line.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex justify-end">
              <div className="w-full max-w-sm">
                <div className="flex justify-between border-b border-bone pb-3">
                  <span className="text-bark">Subtotal</span>
                  <span className="font-display text-xl">
                    {currency(cart.subtotal)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-bark">
                  Shipping and tax are calculated once we know where it is going.
                  Freight on a sectional is not freight on a stool, so we quote it
                  rather than guess.
                </p>
                <button
                  type="button"
                  disabled
                  className="mt-6 w-full bg-ink px-8 py-4 text-sm uppercase
                             tracking-wide-caps text-paper disabled:opacity-50"
                >
                  Checkout
                </button>
                <p className="mt-2 text-center text-xs text-bark">
                  Checkout opens once payment is connected.
                </p>
              </div>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
