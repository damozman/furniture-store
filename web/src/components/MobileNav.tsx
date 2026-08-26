"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/content/types";

/**
 * Mobile navigation.
 *
 * Without this the header collapses to a logo and a cart link on phones, leaving
 * no way to browse -- which matters more here than usual, because this buyer
 * skews toward phone and tablet.
 */
export function MobileNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation, so tapping a link doesn't leave the menu covering the
  // page. Adjusted during render rather than in an effect: React re-runs this
  // component immediately without committing the stale open panel, where an
  // effect would paint it first and then close it.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="-m-1.5 flex h-11 w-11 items-center justify-center"
      >
        <span aria-hidden className="relative block h-3.5 w-5">
          <span
            className={`absolute left-0 block h-px w-5 bg-ink transition-transform
                        ${open ? "top-1.5 rotate-45" : "top-0"}`}
          />
          <span
            className={`absolute left-0 top-1.5 block h-px w-5 bg-ink transition-opacity
                        ${open ? "opacity-0" : "opacity-100"}`}
          />
          <span
            className={`absolute left-0 block h-px w-5 bg-ink transition-transform
                        ${open ? "top-1.5 -rotate-45" : "top-3"}`}
          />
        </span>
      </button>

      {open && (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-full z-50 border-b border-bone bg-paper
                     shadow-sm"
        >
          <nav aria-label="Main" className="mx-auto w-full max-w-7xl px-6 py-4">
            <ul className="divide-y divide-bone/70">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/collections/${c.slug}`}
                    className="flex items-center justify-between py-3.5 text-base"
                  >
                    {c.name}
                    <span className="text-sm text-bark">{c.modelCount}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/materials" className="block py-3.5 text-base">
                  Materials
                </Link>
              </li>
              <li>
                <Link href="/lookbook" className="block py-3.5 text-base">
                  Lookbook
                </Link>
              </li>
              <li>
                <Link href="/trade" className="block py-3.5 text-base text-brass">
                  Trade program
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
