# PWA and SEO (Phase 3)

## Purpose
Install Honeylist as an app, open it offline, keep the phone status bar in the app colour, and describe the app well to search and link previews.

## Status
Built 2026-09-30. Service worker verified on a local production build (registers, precaches, offline reload serves the shell, `/api` never cached). Verify install on a real phone and desktop after deploy.

## How it works now
- Manifest `public/manifest.webmanifest`: id `/` (kept so existing installs stay the same app), start_url `/?source=pwa`, scope `/`, display standalone with `display_override` [window-controls-overlay, standalone], background and theme `#1c1d21`, orientation any, category productivity. Icons: svg, 192, 512, maskable 192 and 512 (`icon-maskable-*.png`, the icon at 72% on the dark ground, made with PIL), apple touch. Shortcuts: Add task (`/?new=task`), Notes, Habits. Screenshots `public/screenshots/wide.png` (1440x900) and `narrow.png` (390x844), taken with Playwright from a seeded account.
- Head (`src/routes/__root.tsx`): viewport-fit=cover, theme-color for dark and light schemes, apple-mobile-web-app-capable, status bar black-translucent, app name. `useThemeColorSync` (`src/lib/pwa.ts`) sets theme-color to the `--bg` of the theme on screen, since the app theme can differ from the system one.
- Safe areas (`src/styles.css`, PWA block at the end): `.app-main` pads with `env(safe-area-inset-*)` on every size, the rail/sidebar pads top and bottom, toasts sit above the home bar. The bottom bar already padded itself (`zen.css`). With the desktop title bar hidden (window controls overlay) a drag strip `.pwa-titlebar` covers the title bar area and content moves below it.
- Service worker `public/sw.js`, registered by `useServiceWorker` only when `import.meta.env.PROD`, after load. Install: precaches `/`, `/tasks`, `/notes`, `/folders`, `/habits`, `/profile` and every `/assets/*` they reference, plus icons and the manifest. Navigations: network first, fallback to the cached page, then `/`, then a tiny offline page. `/assets/*`: cache first. Icons and manifest: stale while revalidate. `/api/*` and other origins (Google Fonts) are never touched. Bump `VERSION` to drop old caches.
- Offline banner `src/components/OfflineBanner.tsx` (in `PwaSupport`, mounted in `__root.tsx`): shows while `navigator.onLine` is false, top of the screen, offline illustration, "You're offline." plus "You can still read what's on screen. Changes need a connection, so they won't save until you're back online." (D26), Retry now refetches active queries.
- `?new=task` (the Add task shortcut): `useNewTaskShortcut` calls `openCreate()` and removes the param.
- SEO: title, description, keywords, canonical, og (url, site name, image size and alt), twitter card, JSON-LD `SoftwareApplication`/`WebApplication` with `featureList` (tasks, notes, scratchpad, folders, habits, Google sign in, AI breakdown, offline PWA). Per route descriptions on Tasks, Notes, Folders, Habits, Profile. `robots.txt` also disallows `/habits` and links `sitemap.xml` (only `/`, the other pages are private per guest).
- `vercel.json`: CSP adds `worker-src 'self'` and `manifest-src 'self'`; `/sw.js` served with `max-age=0, must-revalidate`; manifest with `application/manifest+json`.

## Known issues
- Reloading while offline loads the shell, then AppShell shows "We couldn't start your session" because the session and data come from `/api` (never cached by design). Reading offline works for what is already on screen. A cached read model (for example persisting the Query cache) would fix it; needs a decision.
- The SW precaches pages as HTML for the current guest; that stays on this device only.
- Local `node .output/server/index.mjs` without `DATABASE_URL` needs PGlite's `pglite.data` and wasm copied into `.output/server/_libs/` (not an issue on Vercel with Neon).

## How to test
1. `npm run build`, then `PORT=3313 node .output/server/index.mjs`. Open `/`, click "Skip for now". `navigator.serviceWorker.ready` resolves with scope `/`; caches `honeylist-shell-v1` and `honeylist-static-v1` exist and hold no `/api/` URL.
2. `context.setOffline(true)`, reload: the page loads from cache and "You're offline." shows; set online again: the banner goes.
3. Open `/?new=task`: the New task sheet opens and the URL becomes `/`.
4. Lighthouse PWA/installability in Chrome devtools on the live URL; check the maskable icon in the manifest pane.
