"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { Model } from "@/lib/content/types";
import { SORTS, filterAndSort, materialFacets, type Sort } from "@/lib/browse";

/**
 * Filtering and sorting for a category.
 *
 * Runs entirely in the client so the category pages stay statically prerendered
 * -- pushing this to search params would make every category server-rendered on
 * demand for a set small enough to fit in the page anyway (bar stools, the
 * largest, is ten models).
 */

export function CategoryBrowser({ models }: { models: Model[] }) {
  const [material, setMaterial] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("featured");

  const materials = useMemo(() => materialFacets(models), [models]);
  const shown = useMemo(
    () => filterAndSort(models, material, sort),
    [models, material, sort],
  );

  return (
    <>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4
                      border-y border-bone py-4">
        {materials.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow mr-1">Material</span>
            <button
              type="button"
              onClick={() => setMaterial(null)}
              aria-pressed={material === null}
              className={`min-h-9 rounded-full border px-3 text-sm transition ${
                material === null
                  ? "border-brass bg-bone/60"
                  : "border-bone hover:border-tan"
              }`}
            >
              All
            </button>
            {materials.map(([name, count]) => (
              <button
                key={name}
                type="button"
                onClick={() => setMaterial(material === name ? null : name)}
                aria-pressed={material === name}
                className={`min-h-9 rounded-full border px-3 text-sm transition ${
                  material === name
                    ? "border-brass bg-bone/60"
                    : "border-bone hover:border-tan"
                }`}
              >
                {name} <span className="text-bark">{count}</span>
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="eyebrow">Sort</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-10 rounded-sm border border-bone bg-studio px-2 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <p aria-live="polite" className="mt-4 text-sm text-bark">
        {shown.length} {shown.length === 1 ? "model" : "models"}
        {material && ` in ${material}`}
      </p>

      {shown.length === 0 ? (
        <p className="mt-12 text-bark">
          Nothing in that material here yet.{" "}
          <button
            type="button"
            onClick={() => setMaterial(null)}
            className="text-ink underline underline-offset-4"
          >
            Show everything
          </button>
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {shown.map((m, i) => (
            <li key={m.slug}>
              <ProductCard model={m} priority={i < 4} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
