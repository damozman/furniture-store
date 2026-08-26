import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      // Mirrors the tsconfig path alias so tests import the same modules the app does.
      "@": path.resolve(__dirname, "src"),
      // The content adapter guards itself with `server-only`, which throws outside
      // a React Server Component. Tests exercise it directly, so it is stubbed.
      "server-only": path.resolve(__dirname, "src/test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
