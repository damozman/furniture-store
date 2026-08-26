"use client";

import { useActionState } from "react";
import { subscribe } from "@/app/lead-actions";
import type { LeadResult } from "@/lib/leads/types";

export function SubscribeForm() {
  const [state, action, pending] = useActionState<LeadResult | null, FormData>(
    subscribe, null);

  if (state?.ok) {
    return (
      <div role="status" className="rounded-sm border border-brass/40 bg-bone/40 p-6">
        <p className="font-display text-xl">Check your inbox</p>
        <p className="mt-2 text-sm text-bark">
          The lookbook is on its way, along with a materials guide.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <div aria-hidden className="absolute left-[-9999px]">
        <label htmlFor="scwc">Do not fill this in</label>
        <input id="scwc" name="company_website_confirm" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="sub-email" className="sr-only">Email address</label>
          <input
            id="sub-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="h-12 w-full rounded-sm border border-bone bg-studio px-3
                       text-sm placeholder:text-bark/60"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-12 shrink-0 bg-ink px-8 text-sm uppercase tracking-wide-caps
                     text-paper transition hover:bg-espresso disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send the lookbook"}
        </button>
      </div>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-red-800">{state.error}</p>
      )}

      <p className="text-xs text-bark">
        One email with the lookbook, then occasional new pieces. Unsubscribe anytime.
      </p>
    </form>
  );
}
