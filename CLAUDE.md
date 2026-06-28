# Project: Spencer M. portfolio site

Personal portfolio/resume site for Spencer M. Static site built with Vite +
Tailwind CSS v4, deployed to Cloudflare.

## Stack

- **Build tool:** Vite 7 (`vite build --configLoader runner`)
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite`
- **Package manager:** Bun (`bun install`, `bun.lock`)
- **Icons:** Bootstrap Icons (loaded from jsdelivr CDN in `index.html`)
- Output: single-page static site in `dist/`

## Commands

```bash
bun install          # install deps
bun run dev          # local dev server (Vite)
bun run build        # production build → dist/
bunx wrangler deploy --dry-run   # test the Cloudflare deploy locally (no upload)
```

## Cloudflare deployment — IMPORTANT

This site deploys to **Cloudflare Workers (static assets)** via `wrangler deploy`.
The Cloudflare build runs, in order:

1. `bun install --frozen-lockfile`
2. `bun run build`  →  produces `dist/`
3. `bunx wrangler deploy`  →  uploads `dist/` as static assets

**The build must keep working with the Cloudflare pipeline.** Rules:

- `dist/` must be produced by `bun run build` with no extra args. The deploy step
  reads whatever `vite build` writes to `dist/` — it does NOT run a separate build.
- `wrangler.jsonc` is the source of truth for the deploy. It points at `./dist`
  with SPA (`single-page-application`) fallback. Do not delete it — without an
  explicit config, wrangler runs auto-config detection that tries to statically
  parse `vite.config.js` and fails with `Error parsing file`.
- Any change to `vite.config.js` must not break wrangler's static-asset deploy.
  The Vite config is imported by wrangler's tooling; keep it as a plain ES module
  that exports a Vite config via `defineConfig`. Avoid top-level code with side
  effects that could throw at parse time.
- The `{{LAST_UPDATED}}` token in `index.html` is replaced at build time by the
  `gitLastUpdated` Vite plugin (reads `git log -1 --format=%cI`). If you change
  the token name, update both `index.html` and `vite.config.js`.

### Deploy debugging

- Failing step is almost always `wrangler deploy`, not `vite build`. The build
  log line `✘ [ERROR] Error parsing file: .../vite.config.js` means wrangler is
  auto-detecting instead of using `wrangler.jsonc` — confirm the config exists
  and is valid JSON.
- Reproduce locally: `bun run build && bunx wrangler deploy --dry-run`.
  Dry-run reads `dist/` and exits without uploading.

## Files of note

- `index.html` — the entire site (single-page; Vite entry)
- `vite.config.js` — Tailwind plugin + `gitLastUpdated` build-time token injection
- `wrangler.jsonc` — Cloudflare deploy config (static assets from `dist/`)
- `public/` — static assets served as-is (favicon, sitemap, robots, etc.)
- `vercel.json` — legacy Vercel config; Cloudflare is the active deploy target
