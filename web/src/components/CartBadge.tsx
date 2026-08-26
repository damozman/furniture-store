"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCartSummary } from "@/app/actions";

/**
 * The cart count is read on the client on purpose.
 *
 * Reading `cookies()` in the server-rendered header would opt every page that
 * renders the header -- which is every page -- into dynamic rendering, turning a
 * fully static catalogue into on-demand SSR. The count is non-critical chrome, so
 * it hydrates after paint and the catalogue stays static and CDN-cacheable.
 */
export function CartBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    getCartSummary()
      .then((s) => { if (active) setCount(s.lineCount); })
      .catch(() => { if (active) setCount(0); });
    return () => { active = false; };
  }, []);

  return (
    <Link
      href="/cart"
      className="shrink-0 text-sm text-bark transition hover:text-ink"
    >
      Cart
      {count != null && count > 0 && (
        <span className="ml-1.5 rounded-full bg-ink px-2 py-0.5 text-xs text-paper">
          {count}
        </span>
      )}
    </Link>
  );
}
