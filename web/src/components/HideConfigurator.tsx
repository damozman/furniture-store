"use client";

import { useMemo, useState, useTransition } from "react";
import { SPEC_FIELDS, type Model, type Variant } from "@/lib/content/types";
import { addToCart } from "@/app/actions";

/**
 * The signature interaction.
 *
 * Every SKU in this catalogue is already a photographed frame-plus-hide pair, so
 * choosing a hide is just choosing which existing photograph to show. No 3D, no
 * new photography. When multi-angle shots arrive this component gains a gallery
 * without changing shape.
 *
 * Note there is no bar/counter selector: the source data names a height class for
 * only 38 of 128 sellable variants, so offering the choice would be inventing
 * availability. Seat height is shown as a measured fact instead, with fit
 * guidance, which serves the same purpose -- stopping people ordering the wrong
 * height -- without promising a configuration that may not exist.
 */

function currency(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  });
}

function srcSet(v: Variant) {
  return v.images.map((i) => `${i.src} ${i.width}w`).join(", ");
}

function largest(v: Variant) {
  return v.images.reduce(
    (a, b) => (b.width > a.width ? b : a), v.images[0]).src;
}

/** Trade rule of thumb, from the measured seat height rather than a claim. */
function fitAdvice(seatHeight: number | null): string | null {
  if (seatHeight == null) return null;
  if (seatHeight >= 28) return "Suits a 41–43″ bar";
  if (seatHeight >= 23) return "Suits a 35–37″ counter";
  return "Suits a 28–30″ table";
}

export function HideConfigurator({ model }: { model: Model }) {
  const variants = model.published;
  const [sku, setSku] = useState(variants[0]?.sku ?? "");
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const selected = useMemo(
    () => variants.find((v) => v.sku === sku) ?? variants[0],
    [variants, sku],
  );

  if (!selected) return null;

  const advice = fitAdvice(selected.specs?.seatHeight ?? null);
  const presentSpecs = selected.specs
    ? SPEC_FIELDS.flatMap(({ key, label }) => {
        const value = selected.specs![key];
        return typeof value === "number" ? [{ label, value }] : [];
      })
    : [];

  function onAdd() {
    setAdded(false);
    startTransition(async () => {
      // Only the SKU and quantity cross the wire; price and description are
      // resolved from the catalogue server-side.
      await addToCart(selected.sku, qty);
      setAdded(true);
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
      <div>
        <div className="bg-studio rounded-sm overflow-hidden">
          {/* Fixed aspect box: every derivative is square and uniformly framed,
              so swapping hides never shifts the piece on the page. */}
          <img
            key={selected.sku}
            src={largest(selected)}
            srcSet={srcSet(selected)}
            sizes="(min-width: 1024px) 55vw, 100vw"
            alt={`${model.name} in ${selected.hideLabel}`}
            width={1600}
            height={1600}
            className="w-full aspect-square object-cover"
            fetchPriority="high"
          />
        </div>

        {variants.length > 1 && (
          <p className="mt-4 text-sm text-bark">
            Every hide is a natural material — grain, marking, and colour shift
            from piece to piece. No two are identical.
          </p>
        )}
      </div>

      <div className="lg:pt-6">
        <p className="eyebrow">{model.category?.replace(/-/g, " ")}</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">{model.name}</h1>

        <p className="mt-4 text-2xl font-display">{currency(selected.price)}</p>

        <div className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-sans font-medium tracking-wide-caps uppercase text-bark">
              Hide
            </h2>
            <span className="text-sm text-bark">{selected.hideLabel}</span>
          </div>

          <ul className="mt-3 flex flex-wrap gap-2">
            {variants.map((v) => {
              const active = v.sku === selected.sku;
              return (
                <li key={v.sku}>
                  <button
                    type="button"
                    onClick={() => setSku(v.sku)}
                    onMouseEnter={() => {
                      // Warm the full-size image so the swap is instant.
                      const img = new Image();
                      img.src = largest(v);
                    }}
                    aria-pressed={active}
                    aria-label={v.hideLabel}
                    title={v.hideLabel}
                    className={[
                      "block h-16 w-16 overflow-hidden rounded-sm bg-studio",
                      "ring-offset-2 ring-offset-paper transition",
                      active
                        ? "ring-2 ring-brass"
                        : "ring-1 ring-bone hover:ring-tan",
                    ].join(" ")}
                  >
                    <img
                      src={v.images[0]?.src}
                      alt=""
                      width={400}
                      height={400}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-bark">
            {variants.length} {variants.length === 1 ? "hide" : "hides"} available
          </p>
        </div>

{/* The full spec set is modelled for every product; each row appears only
            where the data exists, so a product gains detail by gaining data. */}
        {presentSpecs.length > 0 && (
          <div className="mt-8 border-t border-bone pt-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-medium tracking-wide-caps uppercase text-bark">
                Specifications
              </h2>
              {selected.specs?.heightClass && (
                <span className="rounded-full border border-tan/60 px-3 py-1 text-xs capitalize">
                  {selected.specs.heightClass} height
                </span>
              )}
            </div>

            <dl className="mt-3 divide-y divide-bone/70">
              {presentSpecs.map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 text-sm">
                  <dt className="text-bark">{label}</dt>
                  <dd className="font-mono">{value}″</dd>
                </div>
              ))}
            </dl>

            {advice && (
              <p className="mt-3 text-sm text-bark">
                {advice}. Measure your surface before ordering — seat height is
                the most common cause of a return.
              </p>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-bone pt-6">
          <label htmlFor="qty" className="sr-only">Quantity</label>
          <select
            id="qty"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="h-12 rounded-sm border border-bone bg-studio px-3 text-sm"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={onAdd}
            disabled={pending}
            className="h-12 flex-1 min-w-48 bg-ink px-8 text-sm uppercase tracking-wide-caps
                       text-paper transition hover:bg-espresso disabled:opacity-60"
          >
            {pending ? "Adding…" : "Add to cart"}
          </button>
        </div>

        {added && (
          <p role="status" className="mt-3 text-sm text-bark">
            Added — {model.name} in {selected.hideLabel}.
          </p>
        )}

        <p className="mt-4 text-xs text-bark">
          SKU {selected.sku} · Shipping and tax calculated at checkout.
        </p>
      </div>
    </div>
  );
}
