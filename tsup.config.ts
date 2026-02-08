import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli/index.ts"],
  format: ["cjs", "esm"], // Output both CommonJS (.cjs) and ESM (.js)
  dts: true, // Generate type definitions
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false, // Don't minify for library usage (better debugging)
  outDir: "dist",
  target: "es2020",
  external: ["fastify", "express"], // Don't bundle peer dependencies
  // No need for onSuccess trick because we use .cjs extension
});
