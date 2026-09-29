# Guest auth and Google sign in

## Purpose
No sign up: every browser gets a private guest account. Later, Google sign in saves the data across devices.

## Status
Guest: Built. Google sign in, nudges, merge: Not built (Phase 2, needs design).

## How it works now
- Server: `src/server/auth.ts`, Better Auth with the `anonymous` plugin, Drizzle adapter, `tanstackStartCookies`. Session lasts a year. Better Auth rate limit 60 per minute on auth routes. `trustedOrigins` from `VERCEL_URL`, `VERCEL_BRANCH_URL`, `VERCEL_PROJECT_PRODUCTION_URL` and `TRUSTED_ORIGINS`.
- Google provider is added only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` exist. No UI calls it.
- Client: `src/lib/auth-client.ts` `ensureGuest()` gets the session or signs in anonymously. `AppShell` calls it on mount; the splash stays until it resolves; on failure the shell shows "We couldn't start your session" with "Try again".
- Route `/api/auth/*` (`src/routes/api/auth/$.ts`) hands off to Better Auth.
- Every API handler goes through `route()` in `src/server/http.ts`: session required (401), user id from the session only, 404 for other users' ids, Zod errors 400, 120 writes a minute per user (429).
- Tables: `user` (with `isAnonymous`), `session`, `account`, `verification` in `src/server/schema.ts`.

## Planned per PRD
- Profile: Guest badge plus "Save your data with Google".
- Nudges (D3): after the 2nd task, then after 3 days of use; Home only; one per session; stop after sign in. Copy says clearing cookies as a guest loses data.
- Linking upgrades the guest in place (Better Auth anonymous `onLinkAccount`). If the Google account already has data: dialog "This device has 4 tasks and 2 notes. Keep them in your account?" with Merge (default) and Discard. `mergeGuestData(choice)`.
- CSP must allow Google OAuth; Google Cloud OAuth client and env vars in Vercel.
- Guest cleanup: delete guests inactive for 90 days (scheduled job).
- Emmanuel asked for the Google OAuth options to be looked into (L26): present options before building.

## Known issues
- None known for guests. Clearing site data loses everything (by design until Google ships).

## How to test
1. New context, `open(page, '/')`: `api(page, '/me')` returns 200. Cookies include a Better Auth session cookie.
2. Second context: create a task, read its id; in the first context `api(page, '/tasks/<id>')` is 404 and PATCH is 404.
3. `page.request.get('/api/tasks')` without the page's cookies (fresh `request.newContext()`) is 401.
4. POST `/api/tasks` with `{ title: 'x', userId: 'someone' }` is 400 (strict schema).
5. Block `/api/auth/**` with `page.route` then load: "We couldn't start your session" and a "Try again" button.
