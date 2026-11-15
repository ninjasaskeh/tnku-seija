import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const root = import.meta.dirname;
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

/**
 * Build PREVIEW satu file HTML (semua JS, CSS, font di-inline) dari komponen yang sama
 * dengan app Next.js. Hasilnya: preview-dist/index.html. Jalanin: npm run preview:single
 */
export default defineConfig({
  root: "preview",
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      "next/dynamic": path.resolve(root, "preview/next-dynamic.tsx"),
    },
  },
  build: {
    outDir: "../preview-dist",
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 5000,
  },
});
