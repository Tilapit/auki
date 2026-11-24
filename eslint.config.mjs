import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Copied from node_modules by scripts/copy-map-worker.mjs:
    "public/maplibre/**",
    // The pipeline's output and saved Overpass answers (npm run data):
    ".data/**",
    // Worktrees of parallel Claude Code sessions: each is linted in its own checkout.
    ".claude/**",
  ]),
]);

export default eslintConfig;
