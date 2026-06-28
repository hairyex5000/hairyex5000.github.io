import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [tailwindcss(), cloudflare()],
  build: {
    target: "es2020",
    cssMinify: true,
    assetsInlineLimit: 4096,
    reportCompressedSize: false,
  },
});