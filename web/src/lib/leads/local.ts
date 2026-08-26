import "server-only";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type {
  LeadResult, LeadSource, Subscription, TradeApplication,
} from "./types";

/**
 * Development lead sink: appends newline-delimited JSON to data/out/leads.jsonl.
 *
 * This exists so the forms are genuinely functional while building -- a lead is
 * captured and recoverable rather than dropped. It is explicitly not production:
 * there is no delivery, no notification, and no durability guarantee beyond the
 * local disk. Wire a real CRM or email provider behind LeadSource before launch,
 * or the trade applications this funnel is designed to win will land nowhere.
 */

const FILE = path.resolve(process.cwd(), "..", "data", "out", "leads.jsonl");

async function record(kind: string, payload: unknown): Promise<LeadResult> {
  try {
    await mkdir(path.dirname(FILE), { recursive: true });
    await appendFile(
      FILE,
      JSON.stringify({ kind, at: new Date().toISOString(), payload }) + "\n",
      "utf8",
    );
    return { ok: true };
  } catch (e) {
    console.error("[leads] failed to record", kind, e);
    return { ok: false, error: "We could not record that. Please try again." };
  }
}

export const localLeads: LeadSource = {
  async submitTradeApplication(input: TradeApplication) {
    return record("trade-application", input);
  },
  async subscribe(input: Subscription) {
    return record("subscription", input);
  },
};
