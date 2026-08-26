import type { ContentSource } from "./types";
import { localContent } from "./local";

/**
 * The single place the content backend is chosen. Components import `content`
 * and nothing else, so moving to Sanity is a change here plus a new module that
 * satisfies ContentSource.
 */
export const content: ContentSource = localContent;

export * from "./types";
