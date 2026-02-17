import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  outDir: "dist",
  target: "es2020",
  external: [
    "supertest",
    "light-my-request",
    "fastify",
    "express"
  ],
  shims: true,
});
