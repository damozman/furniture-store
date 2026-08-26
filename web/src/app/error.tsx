"use client";

import Link from "next/link";

/**
 * Last line of defence. A stack trace on a luxury furniture site does more damage
 * than the bug that caused it, so this stays calm and offers a way back in.
 */
export default function Error({
  error, reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center
                    px-6 py-24">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-2 font-display text-4xl">
        We couldn&rsquo;t load that
      </h1>
      <p className="mt-4 text-bark">
        The problem is on our side, not yours. Try again — and if it keeps
        happening, call us on{" "}
        <a href="tel:+17144235988" className="text-ink underline underline-offset-4">
          (714) 423-5988
        </a>
        .
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-ink px-8 py-3 text-sm uppercase tracking-wide-caps
                     text-paper transition hover:bg-espresso"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-bone px-8 py-3 text-sm uppercase
                     tracking-wide-caps transition hover:border-brass"
        >
          Back to the range
        </Link>
      </div>

      {error.digest && (
        // The digest is the only handle support has for finding this in the logs.
        <p className="mt-10 font-mono text-xs text-bark">
          Reference: {error.digest}
        </p>
      )}
    </div>
  );
}
