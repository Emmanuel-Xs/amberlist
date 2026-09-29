# Onboarding

## Purpose
A single, skippable welcome that asks "What should we call you?" and lets people pick dark or light, then gets out of the way. Plus just in time tips.

## Status
Welcome screen built (2026-09-30, approved by Emmanuel). Just in time tips: only the shortcuts tip (see [keyboard-shortcuts](keyboard-shortcuts.md)).

## How it works now
- `src/components/Welcome.tsx`, mounted in `AppShell` once the guest session is ready. Shows when `GET /api/me` returns `onboarded: false`.
- Phone (under 768): full page over the app. Tablet and desktop: dialog with scrim (`.welcome*` classes in `src/styles.css`).
- Content: `LogoMark` 64, h1 "Welcome to Honeylist", line "A calm place for your tasks, notes and quick thoughts. Two quick things and you're in.", `Input` "What should we call you?" (placeholder "Your first name", max 40), theme chips Dark / Light / Match device (radiogroup "Theme"), primary "Let's go" (full width on phones), ghost "Skip for now", caption "You can change both any time in Profile."
- Focus: name field is focused only with a fine pointer (desktop); on touch the panel gets focus so the keyboard stays down. Tab is trapped, Escape skips.
- Theme chips apply at once (cache updated, then `PATCH /api/me { theme }`), reusing `useTheme` in `AppShell`.
- "Let's go" sends `PATCH /api/me { onboarded: true, displayName? }`; "Skip for now" and Escape send `{ onboarded: true }`. Both use `useUpdateMe()` in `src/lib/api.ts`, which updates the me query so the Home greeting changes live.
- Server: `prefs.onboarded_at` (nullable timestamp, added with `alter table "prefs" add column if not exists` in the DDL so old databases upgrade). `onboarded` is computed in `getMe` (`src/server/services.ts`): true when `onboarded_at` is set, or the user has a name, any task, or any note that is not the scratchpad. So existing guests never see it.
- `onboarded` in the PATCH body is `z.literal(true)` (strict schema); it can't be unset. Setting it again keeps the first time.
- Delete all data removes the prefs row, so the welcome shows again after a wipe (fresh start).

## Planned per PRD
- Remaining just in time tips, each once, inline and dismissible, on Home only, one per session: quick add syntax on first use, `- [ ]` on the first note, streak rules on the first check in. Needs `seenTips` in prefs.
- Respect don't disturb rules: nothing while typing.

## Known issues
- None known.

## How to test
1. New context at 1440, `open(page, '/')`: dialog "Welcome to Honeylist", the name field is focused. At 390 with touch: full page, nothing focused.
2. Type a name, click the "Light" radio, click "Let's go": `html[data-theme="light"]`, Home greeting ends with the name, `GET /api/me` has `onboarded: true` and the name.
3. New context, click "Skip for now" (or press Escape): Home shows; reload does not show the welcome again.
4. New context, create a task through the API before onboarding, reload: no welcome.
5. API tests: `tests/api.test.ts` "profile, search and data" (success, skip, old guests, 400s, 401).
