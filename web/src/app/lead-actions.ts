"use server";

import { leads } from "@/lib/leads";
import type { LeadResult } from "@/lib/leads";

/** Minimal, deliberately permissive — real addresses vary more than regexes expect. */
function validEmail(value: string) {
  return /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(value);
}

function str(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function submitTradeApplication(
  _prev: LeadResult | null, form: FormData,
): Promise<LeadResult> {
  // Honeypot: a field no human sees, so anything filling it is a bot.
  if (str(form, "company_website_confirm")) return { ok: true };

  const name = str(form, "name");
  const email = str(form, "email");
  const firm = str(form, "firm");

  if (!name || !firm) {
    return { ok: false, error: "Please include your name and firm." };
  }
  if (!validEmail(email)) {
    return { ok: false, error: "Please check the email address." };
  }

  return leads.submitTradeApplication({
    name,
    email,
    firm,
    role: str(form, "role") || undefined,
    phone: str(form, "phone") || undefined,
    website: str(form, "website") || undefined,
    projectTypes: form.getAll("projectTypes").filter(
      (v): v is string => typeof v === "string"),
    message: str(form, "message") || undefined,
  });
}

export async function subscribe(
  _prev: LeadResult | null, form: FormData,
): Promise<LeadResult> {
  if (str(form, "company_website_confirm")) return { ok: true };

  const email = str(form, "email");
  if (!validEmail(email)) {
    return { ok: false, error: "Please check the email address." };
  }

  return leads.subscribe({
    email,
    name: str(form, "name") || undefined,
    source: "lookbook",
  });
}
