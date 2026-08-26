/**
 * Stand-in for the `server-only` package under Vitest.
 *
 * `server-only` exists to make a build fail if server code is imported into a
 * client bundle. Tests run in Node, where that guard has nothing to protect and
 * only gets in the way, so the alias in vitest.config.ts points here instead.
 */
export {};
