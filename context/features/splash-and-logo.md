# Splash, logo and 404

## Purpose
Brand the app and cover the guest session start with a calm loading screen instead of a spinner.

## Status
Built. A smoother splash to app hand off is pending design (L9).

## How it works now
- Logo: `src/ui/logo.tsx` (`Logo`, `LogoMark`, `animated` prop) with paths in `src/ui/logo-data.ts`; static `public/logo.svg`, `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og.png`, `manifest.webmanifest`. Used in the sidebar and rail brand link ("Honeylist home"), phone Home header, profile footer, 404, splash.
- Splash: `src/components/Splash.tsx`, rendered by `AppShell` from the first server byte. `.splash` (role `status`, name "Loading Honeylist") with the animated mark and "Honeylist". It leaves when the session is ready **and** a honey drop cycle has finished (`animationiteration` of `honey-drop`), or after a 6 s safety net (900 ms with reduced motion). Then `.is-leaving` fades for 450 ms and it unmounts. On session failure it leaves at once. `<noscript>` hides it.
- Under the splash the shell shows skeletons until the session is ready.
- 404: `NotFound` in `src/routes/__root.tsx`: large mark, "That page has let go", "We couldn't find what you were looking for.", link "Back home".
- Head: title "Honeylist: tasks, notes and a scratchpad in one calm place", description, theme-color for both schemes, OG and Twitter tags, JSON-LD `WebApplication`, per route titles like "Tasks · Honeylist".

## Planned per PRD and Emmanuel
- Smooth transition from splash into the app (L9, design).
- Honeycomb nav icons and logo based illustrations were tried and reverted (1315e68); do not bring them back without approval.
- sitemap.xml listing `/`.

## Known issues
- None known after 1315e68. Verify the Home nav item colors.

## How to test
1. `page.goto('/')`: `.splash` is visible with role status "Loading Honeylist"; then `expect(page.locator('.splash')).toHaveCount(0, { timeout: 10_000 })`.
2. With `reducedMotion: 'reduce'` it is gone within about 2 s.
3. `open(page, '/does-not-exist')`: heading "That page has let go", `getByRole('link', { name: 'Back home' })` goes to `/`.
4. `page.title()` on `/tasks` is "Tasks · Honeylist"; `meta[property="og:image"]` points to `/og.png`.
5. Link `getByRole('link', { name: 'Honeylist home' })` visible at 820 and 1440.
