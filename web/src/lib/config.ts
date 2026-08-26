/**
 * Launch-time switches.
 *
 * Photo coverage is 128 of 183 SKUs today and is expected to reach full coverage
 * as the client works through inventory. Nothing is therefore deleted or
 * permanently excluded -- unphotographed variants are authored, carry their
 * specs, and are one flag away from being live.
 */
export const config = {
  /**
   * Show variants that have no photograph yet. Off for launch so every page
   * reads as complete; flip to true (or set SHOW_UNPHOTOGRAPHED=1) once
   * coverage is good enough that gaps look like range rather than omission.
   */
  showUnphotographed:
    process.env.SHOW_UNPHOTOGRAPHED === "1" ||
    process.env.SHOW_UNPHOTOGRAPHED === "true",
} as const;
