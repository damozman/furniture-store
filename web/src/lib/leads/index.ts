import type { LeadSource } from "./types";
import { localLeads } from "./local";

/** The single place the lead backend is chosen. See ./types for why. */
export const leads: LeadSource = localLeads;

export * from "./types";
