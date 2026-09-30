# Guest auth and Google sign in

## Purpose
No sign up: every browser gets a private guest account. Google sign in saves the data across devices.

## Status
Guest: Built. Google sign in, save nudges, merge prompt: Built 2026-09-30 (Emmanuel approved building now). Needs the owner setup below before the button shows in production. The full Google round trip can't run in the sandbox; everything around it is tested.

## How it works now
- Server: `src/server/auth.ts`, Better Auth with the `anonymous` plugin, Drizzle adapter, `tanstackStartCookies`. Session lasts a year. Better Auth rate limit 60 per minute on auth routes. `trustedOrigins` from `VERCEL_URL`, `VERCEL_BRANCH_URL`, `VERCEL_PROJECT_PRODUCTION_URL` and `TRUSTED_ORIGINS`.
- Google provider is added only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` exist. `GET /api/me` returns `googleEnabled`; without it the Profile button and the Home nudge stay hidden and Profile shows a calm "export a copy" note.
- Client: `src/lib/auth-client.ts`. `ensureGuest()` gets the session or signs in anonymously (AppShell, splash stays until it resolves; on failure "We couldn't start your session" with "Try again"). `signInWithGoogle()` calls `signIn.social({ provider: 'google', callbackURL: current path })`, so Google returns you to the page you left. `signOutToGuest()` signs out, then starts a fresh guest.
- Route `/api/auth/*` (`src/routes/api/auth/$.ts`) hands off to Better Auth. Google callback: `/api/auth/callback/google`.
- Every API handler goes through `route()` in `src/server/http.ts`: session required (401), user id from the session only, 404 for other users' ids, Zod errors 400, 120 writes a minute per user (429).
- Tables: `user` (with `isAnonymous`), `session`, `account`, `verification` in `src/server/schema.ts`. `prefs.nudge_state` (jsonb, day each nudge was dismissed) and `prefs.pending_merge` (jsonb, guest ids waiting for the prompt), added with `alter table ... add column if not exists`.

### Linking (guest to Google)
- Better Auth makes a new user for the Google account and then deletes the guest user. Before that, the anonymous plugin's `onLinkAccount` calls `linkGuestAccount(db, guestId, accountId)` in `src/server/services.ts`. App rows have no foreign key to `user`, so nothing cascades.
- Account has no data (a new Google user): `mergeGuestData` right away, the guest's prefs (name, theme, onboarded) come along. Feels like an in place upgrade.
- Guest has no data (no task, note, habit or scratchpad text): the guest's leftovers are removed, no prompt.
- Both have data: the guest id goes into the account's `prefs.pending_merge` (server side only, the client can't set it). Nothing is lost while it waits.
- `mergeGuestData(db, fromUserId, toUserId)`: one transaction. Folders with the same name (case and spaces ignored) become one and the guest's tasks and habits point at the account's folder; other folders go after the account's. Tasks, subtasks, notes, habits and habit check ins move. Scratchpad: the guest's text is appended under the account's. Prefs: the account keeps its own (the guest's are used only when it has none). `seeded` is set so default folders aren't added again. `ai_usage` rows are not moved (daily quota only).

### Merge prompt
- `src/components/MergePrompt.tsx`, mounted in AppShell. Shows when `GET /api/me` has `pendingMerge: { tasks, notes }`. Overlays board: "Keep this device's tasks?", "This device has 4 tasks and 2 notes. Your Google account already has data from another device.", buttons "Discard them" (ghost) and "Merge into account" (primary, focused).
- It's an alertdialog with no close button; Esc and the scrim do nothing, so it can't be skipped by accident.
- "Discard them" swaps to a `ConfirmDialog` "Discard this device's data?" (design system: discard on merge is big but safe). Cancel goes back to the prompt.
- `POST /api/me/merge { choice: 'merge' | 'discard' }` (Zod `mergeChoice`, strict). 200 returns the new `/api/me`; 404 when nothing is waiting; 400 bad input; 401 no session. Toasts: "Merged. Your data is saved to your Google account." or "Done. You're seeing your account's data."

### Profile
- Guest: "Guest" pill, "Everything is saved in this browser only.", and the "Save your data" card from the Profile board (folder illustration, copy, "Continue with Google" block button). Without Google keys: the same card with an export note and no button.
- Signed in: Google photo as the avatar (initial fallback), "Google" pill with the email, "Sign out" ghost button (no confirm; toast "Signed out. You're a guest on this device now."), and the success Alert "Your data is saved to your Google account." in place of the card.
- `src/components/Account.tsx` (`Avatar`, `AccountStatus`, `SaveDataCard`).

### Save nudges (D3)
- `src/components/SaveNudge.tsx` on Home under quick add. Warning Alert style from the Icons and destructive board: "You're a guest", copy says clearing browser data removes your tasks, "Save with Google" button, "Dismiss" (x).
- Rules in `pickNudge` (`src/lib/nudge.ts`, unit tested): guests only, only when Google is configured and no merge is waiting. First nudge after the 2nd task. Second after 3 separate days of use (days tracked in `localStorage['honeylist-days-used']`), never on the day the first was dismissed. One per session (`sessionStorage['honeylist-nudge-shown']`). It waits while focus is in a field and appears once focus leaves.
- Dismissing calls `PATCH /api/me { nudgeDismissed: 'task' | 'days' }`, stored in `prefs.nudge_state`, so it follows the account.

### Delete all my data
- Signed in: every row goes, the Google account stays (prefs recreated with onboarding done). Guests: every row goes, the guest user is deleted too and the browser starts a fresh guest. `DELETE /api/me/data` returns `{ ok, reset }`.

## Owner setup (Emmanuel): turn on Google sign in
1. Google Cloud console (console.cloud.google.com): pick or create a project, for example "Honeylist".
2. APIs & Services > OAuth consent screen: User type **External**. App name "Honeylist", support email, app logo optional, app domain `https://honeylist.vercel.app`, developer contact email. Scopes: the defaults `openid`, `email`, `profile` are enough. Publish the app (Testing mode only lets listed test users sign in).
3. APIs & Services > Credentials > Create credentials > **OAuth client ID** > Application type **Web application**, name "Honeylist web".
4. Authorised JavaScript origins: `https://honeylist.vercel.app` and `http://localhost:3000`.
5. Authorised redirect URIs: `https://honeylist.vercel.app/api/auth/callback/google` and `http://localhost:3000/api/auth/callback/google`.
6. Create, then copy the Client ID and Client secret.
7. Vercel > honeylist > Settings > Environment Variables: add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (Production, plus Preview if you want it there; preview URLs also need their own redirect URI in step 5). Make sure `BETTER_AUTH_URL=https://honeylist.vercel.app` and `BETTER_AUTH_SECRET` are set too.
8. Redeploy (Deployments > latest > Redeploy) so the new env vars load.
9. Locally: put the same two values in `.env`, run `npm run dev` on port 3000.
10. Check: Profile shows "Continue with Google"; signing in returns you to Profile with your photo and email.
- CSP in `vercel.json` already allows `https://accounts.google.com` (form-action) and `https://lh3.googleusercontent.com` (avatars).

## Planned per PRD
- Guest cleanup: delete guests inactive for 90 days (scheduled job).

## Known issues
- The Google round trip itself is untested here (no real OAuth client in the sandbox). Verified: button hidden without env, visible with dummy env, the redirect goes to `accounts.google.com` with `redirect_uri=<origin>/api/auth/callback/google`.
- Days of use are counted per browser (localStorage), so the 3 day nudge counts this device only.
- Sign out drops you on a fresh guest, which shows the Welcome screen again.

## How to test
1. New context, `open(page, '/')`: `api(page, '/me')` returns 200 with `isGuest: true`, `email: null`. Cookies include a Better Auth session cookie.
2. Second context: create a task, read its id; in the first context `api(page, '/tasks/<id>')` is 404 and PATCH is 404.
3. `page.request.get('/api/tasks')` without the page's cookies (fresh `request.newContext()`) is 401.
4. POST `/api/tasks` with `{ title: 'x', userId: 'someone' }` is 400 (strict schema).
5. Block `/api/auth/**` with `page.route` then load: "We couldn't start your session" and a "Try again" button.
6. Without Google env: Profile has no "Continue with Google" and shows the export note; Home shows no nudge.
7. With dummy env (`GOOGLE_CLIENT_ID=dummy GOOGLE_CLIENT_SECRET=dummy`): Profile shows "Continue with Google"; clicking it navigates to `https://accounts.google.com/...` with `redirect_uri=<origin>/api/auth/callback/google` (intercept with `page.route('https://accounts.google.com/**')`).
8. Nudge: add 2 tasks through quick add; no card while the field has focus; blur: "You're a guest" appears; Dismiss hides it, `GET /api/me` has `nudgeState.task`, reload keeps it hidden.
9. Merge prompt: `page.route('**/api/me')` and add `pendingMerge: { tasks: 4, notes: 2 }` to the JSON: "Keep this device's tasks?" with "This device has 4 tasks and 2 notes."; Esc does nothing; "Discard them" asks to confirm; Cancel returns.
10. Vitest `tests/api.test.ts` "google sign in: linking and merging a guest" (merge, dedupe, habits, scratchpad, prefs, fresh account, empty guest, pending then merge or discard, 400, 401, 404, nudge dismissal) and `tests/nudge.test.ts`.
