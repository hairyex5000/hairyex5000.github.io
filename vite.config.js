import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { execSync } from "node:child_process";

// Injects the date of the latest git commit into the build as {{LAST_UPDATED}}.
// Keeps the site fully static — no runtime GitHub API call, no rate limits.
function gitLastUpdated() {
  return {
    name: "git-last-updated",
    transformIndexHtml(html) {
      let date = "";
      try {
        // ISO 8601 commit date, e.g. 2026-06-28T14:03:00-07:00
        const iso = execSync("git log -1 --format=%cI").toString().trim();
        date = new Date(iso).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        date = "";
      }
      return html.replaceAll("{{LAST_UPDATED}}", date);
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), gitLastUpdated()],
  build: {
    target: "es2020",
    cssMinify: true,
    assetsInlineLimit: 4096,
    reportCompressedSize: false,
  },
});
