import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["bin/**/*.test.ts"],
  },
  resolve: {
    extensions: [".ts", ".js", ".mjs", ".cjs", ".json"],
  },
});
