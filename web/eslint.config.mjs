import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      /*
       * Product and editorial imagery is pre-derived by scripts/build-images.mjs
       * into WebP at 400/800/1600 (and 800/1600/2400 for editorial), and each
       * `<img>` carries an explicit srcSet and sizes. Routing that through
       * `next/image` would re-optimise already-optimised files -- no quality or
       * bandwidth gain, extra transform cost per image on Vercel, and it breaks
       * the SKU-keyed manifest that makes images swappable as data.
       *
       * Revisit only if we move to a source of un-derived, arbitrary-size images.
       */
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
