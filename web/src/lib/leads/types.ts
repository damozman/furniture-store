/**
 * Lead capture contract.
 *
 * Same reasoning as content and commerce: the trade funnel and the lookbook are
 * the two things on this site with real commercial value, and they must not be
 * wired directly to whatever CRM or email provider gets picked. One interface,
 * swap the implementation.
 */

export interface TradeApplication {
  name: string;
  email: string;
  firm: string;
  role?: string;
  phone?: string;
  website?: string;
  projectTypes?: string[];
  message?: string;
}

export interface Subscription {
  email: string;
  name?: string;
  source: "lookbook" | "footer";
}

export type LeadResult =
  | { ok: true }
  | { ok: false; error: string };

export interface LeadSource {
  submitTradeApplication(input: TradeApplication): Promise<LeadResult>;
  subscribe(input: Subscription): Promise<LeadResult>;
}
