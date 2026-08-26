"use client";

import { useActionState } from "react";
import { submitTradeApplication } from "@/app/lead-actions";
import type { LeadResult } from "@/lib/leads/types";

const PROJECT_TYPES = [
  "Residential", "Hospitality", "Restaurant & bar", "Ranch & estate",
  "Commercial", "Multi-unit",
];

const field =
  "h-12 w-full rounded-sm border border-bone bg-studio px-3 text-sm " +
  "placeholder:text-bark/60";

export function TradeForm() {
  const [state, action, pending] = useActionState<LeadResult | null, FormData>(
    submitTradeApplication, null);

  if (state?.ok) {
    return (
      <div role="status" className="rounded-sm border border-brass/40 bg-bone/40 p-8">
        <h2 className="font-display text-2xl">Application received</h2>
        <p className="mt-3 text-bark">
          We&rsquo;ll be in touch within two business days with trade pricing and
          a materials package.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute left-[-9999px]">
        <label htmlFor="cwc">Do not fill this in</label>
        <input id="cwc" name="company_website_confirm" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="eyebrow">Name</label>
          <input id="name" name="name" required autoComplete="name" className={`mt-2 ${field}`} />
        </div>
        <div>
          <label htmlFor="firm" className="eyebrow">Firm or studio</label>
          <input id="firm" name="firm" required autoComplete="organization" className={`mt-2 ${field}`} />
        </div>
        <div>
          <label htmlFor="email" className="eyebrow">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={`mt-2 ${field}`} />
        </div>
        <div>
          <label htmlFor="phone" className="eyebrow">Phone</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className={`mt-2 ${field}`} />
        </div>
        <div>
          <label htmlFor="role" className="eyebrow">Role</label>
          <input id="role" name="role" placeholder="Interior designer, architect…" className={`mt-2 ${field}`} />
        </div>
        <div>
          <label htmlFor="website" className="eyebrow">Website</label>
          <input id="website" name="website" placeholder="studio.com" className={`mt-2 ${field}`} />
        </div>
      </div>

      <fieldset>
        <legend className="eyebrow">Project types</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {PROJECT_TYPES.map((t) => (
            <label
              key={t}
              className="flex min-h-11 cursor-pointer items-center rounded-full
                         border border-bone bg-studio px-4 text-sm transition
                         has-checked:border-brass has-checked:bg-bone/60"
            >
              <input type="checkbox" name="projectTypes" value={t} className="sr-only" />
              {t}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="message" className="eyebrow">Anything else</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="mt-2 w-full rounded-sm border border-bone bg-studio p-3 text-sm"
        />
      </div>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-red-800">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full bg-ink px-8 text-sm uppercase tracking-wide-caps
                   text-paper transition hover:bg-espresso disabled:opacity-60
                   sm:w-auto"
      >
        {pending ? "Sending…" : "Apply for trade access"}
      </button>
    </form>
  );
}
