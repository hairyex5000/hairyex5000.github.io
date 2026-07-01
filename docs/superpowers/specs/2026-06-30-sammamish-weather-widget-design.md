# Sammamish Weather Widget — Design

**Date:** 2026-06-30
**Status:** Approved (pending plan)
**Owner:** Spencer M.

## Goal

Add a small, right-justified weather indicator next to the name/location block in the page header. It calls `wttr.in` on each page load (with local caching to be polite) and shows the current condition as an icon plus temperature. On any failure it falls back to a discreet "Sammamish" label, so the page never breaks.

## Non-goals

- No geolocation, no city switcher, no forecast, no historical data.
- No new files, no dependencies, no build-time fetching.
- No analytics or error reporting.

## Architecture

- **Single inline `<script>`** appended to the existing inline scripts in `index.html`. Consistent with the `usa250` and dark-mode blocks already in the file.
- **Endpoint:** `https://wttr.in/Sammamish?format=j1`. CORS verified — `Access-Control-Allow-Origin: *` on response.
- **Cache:** `localStorage` key `sammamish-weather-v1` with a 30-minute TTL. Stored payload: `{ fetchedAt, tempF, weatherCode }`.
- **Refresh:** on `DOMContentLoaded`, and on `visibilitychange` if the cached entry is >30 min old. No `setInterval` (battery-friendly).
- **Timeout:** `AbortSignal.timeout(10000)` (10 s) on the fetch.

## Markup

- Wrap the existing `<h1>Spencer M.</h1>` and the subsequent `<h2>`/`<h3>` block in a `<div class="flex justify-between items-start gap-4">` so the widget can sit on the right of the name without disturbing the social-icon flow.
- Widget element: `<aside id="weather" class="min-w-[7rem] text-right text-sm text-gray-600 dark:text-gray-300" aria-live="polite" aria-label="Sammamish weather">`. The `min-w-[7rem]` reserves space so the h1 doesn't reflow when the widget hydrates.
- Initial content (SSR-safe, no-JS fallback): `<span class="font-medium">Sammamish</span>`.

## Styling

- Tailwind utilities only.
- Matches the rest of the page's `text-black dark:text-white` family but at `text-sm`.
- Icon: Bootstrap Icons class (e.g. `bi-sun`, `bi-cloud-sun`, `bi-cloud-rain`) — already loaded from jsdelivr CDN in `<head>`.
- No background pill (keeps visual weight low next to the h1).

## JavaScript behavior

1. Read `localStorage` for `sammamish-weather-v1`. If `Date.now() - stored.fetchedAt < 30 * 60 * 1000`, render the stored payload and exit.
2. Otherwise, `fetch(url, { signal: AbortSignal.timeout(10000) })`. Parse the JSON.
3. Read `current_condition[0].temp_F` and `weatherCode`. Use `temp_F` for display; round to nearest integer.
4. Map `weatherCode` → Bootstrap Icons class via a lookup table covering the realistic Sammamish range (codes 113, 116, 119, 122, 143, 176, 179, 182, 185, 200, 227, 230, 248, 260, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 311, 314, 317, 320, 323, 326, 329, 332, 335, 338, 350, 353, 356, 359, 362, 365, 368, 371, 374, 377, 386, 389, 392, 395).
5. Replace the contents of `#weather` with `<i class="bi {iconClass}"></i> <span>{temp}°F</span>`. Cache the payload.
6. On any throw (network, abort, parse, missing fields) — log `console.warn` and leave the discreet "Sammamish" label in place. Never throw to the user.
7. `visibilitychange` listener: if the document becomes visible and the cache is >30 min old (or absent), re-fetch.

## Error handling & accessibility

- `aria-live="polite"` on the `<aside>` — announces updates without interrupting.
- `aria-label` always present, populated dynamically:
  - Success: "Currently 68 degrees Fahrenheit in Sammamish"
  - Fallback: "Sammamish, weather unavailable"
- `prefers-reduced-motion`: no transitions on icon swap (apply `transition-none` to the icon for safety).
- Widget is purely additive — failures never break the page.

## Weather code → icon map (canonical)

The implementation uses a single JavaScript object literal `WEATHER_CODE_TO_ICON`. Lookup precedence is the order of entries below; the first match wins. Concrete values:

```js
const WEATHER_CODE_TO_ICON = {
  113: "bi-sun",                  // Clear/Sunny
  116: "bi-cloud-sun",            // Partly cloudy
  119: "bi-cloud",                // Cloudy
  122: "bi-cloud",                // Overcast
  143: "bi-cloud-fog",            // Mist
  176: "bi-cloud-rain",           // Patchy rain possible
  179: "bi-snow",                 // Patchy snow possible (snow wins over rain)
  182: "bi-snow",                 // Patchy sleet possible
  185: "bi-cloud-fog",            // Patchy freezing drizzle
  200: "bi-cloud-lightning-rain", // Thundery outbreaks (lightning wins over rain)
  227: "bi-snow",                 // Blowing snow
  230: "bi-snow",                 // Blizzard
  248: "bi-cloud-fog",            // Fog
  260: "bi-cloud-fog",            // Freezing fog
  263: "bi-cloud-rain",           // Patchy light drizzle
  266: "bi-cloud-rain",           // Light drizzle
  281: "bi-cloud-rain",           // Freezing drizzle
  284: "bi-cloud-rain",           // Heavy freezing drizzle
  293: "bi-cloud-rain",           // Patchy light rain
  296: "bi-cloud-rain",           // Light rain
  299: "bi-cloud-rain",           // Moderate rain at times
  302: "bi-cloud-rain",           // Moderate rain
  305: "bi-cloud-rain",           // Heavy rain at times
  308: "bi-cloud-rain",           // Heavy rain
  311: "bi-cloud-rain",           // Light freezing rain
  314: "bi-cloud-rain",           // Moderate/Heavy freezing rain
  317: "bi-cloud-rain",           // Light sleet
  320: "bi-snow",                 // Moderate/heavy sleet (snow wins)
  323: "bi-snow",                 // Patchy light snow
  326: "bi-snow",                 // Light snow
  329: "bi-snow",                 // Patchy moderate snow
  332: "bi-snow",                 // Moderate snow
  335: "bi-snow",                 // Patchy heavy snow
  338: "bi-snow",                 // Heavy snow
  350: "bi-snow",                 // Ice pellets (snow wins)
  353: "bi-cloud-rain",           // Light rain shower
  356: "bi-cloud-rain",           // Moderate/heavy rain shower
  359: "bi-cloud-rain",           // Torrential rain shower
  362: "bi-cloud-rain",           // Light sleet showers
  365: "bi-snow",                 // Moderate/heavy sleet showers
  368: "bi-snow",                 // Light snow showers
  371: "bi-snow",                 // Moderate/heavy snow showers
  374: "bi-cloud-rain",           // Light ice pellet showers
  377: "bi-snow",                 // Moderate/heavy ice pellet showers
  386: "bi-cloud-lightning-rain", // Patchy light rain with thunder
  389: "bi-cloud-lightning-rain", // Moderate/heavy rain with thunder
  392: "bi-cloud-lightning-rain", // Patchy light snow with thunder
  395: "bi-snow",                 // Moderate/heavy snow with thunder
};

// Default when the code is missing or unmapped:
const DEFAULT_ICON = "bi-cloud";
```

Implementation note: `WEATHER_CODE_TO_ICON[code] ?? DEFAULT_ICON`. Since the keys are strings in the response, the implementation must coerce: `WEATHER_CODE_TO_ICON[String(code)] ?? DEFAULT_ICON`.

## Verification

- `bun run build && bunx wrangler deploy --dry-run` to confirm Vite and Cloudflare pipeline still pass.
- Manual: load page → see icon + temp within ~1 s. Throttle to Offline → reload → see "Sammamish" label only, no errors. Toggle dark mode → text remains readable.

## Risks

- **wttr.in outage:** graceful fallback handles it. The "Sammamish" label was explicitly chosen as the failure state.
- **CORS regression upstream:** same as outage. Acceptable.
- **Layout shift:** the flex row is set up so the right column reserves the same width whether the widget has loaded or not. The `<aside>` is given a `min-w-[7rem]` Tailwind utility so the right column reserves ~7 rem of horizontal space both at first paint (when it shows "Sammamish") and after hydration (when it shows the icon + temp). This prevents the h1 from re-wrapping as the widget populates.
- **Build pipeline:** confirmed `index.html` is the Vite entry as-is; an extra inline script is consistent with existing patterns and won't break wrangler's static-asset deploy.
