import type { CommerceSource } from "./types";
import { cookieCommerce } from "./cookie";

/** The single place the commerce backend is chosen. See ./types for why. */
export const commerce: CommerceSource = cookieCommerce;

export * from "./types";
