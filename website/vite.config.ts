import { defineConfig } from "vite";

// Apex custom domain (moonpod.space) serves from root, so base = "/".
export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
