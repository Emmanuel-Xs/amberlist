# Handoff to Claude Code: what is left

Written 2026-09-30. Read [README.md](README.md) first, then this file. Rules that apply to every task: AGENTS.md, no dashes in copy, tokens only, design approval for anything off design (see below), update `context/` in the same commit, and run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` before pushing. Work on a branch; `main` deploys to https://honeylist.vercel.app.

## State of the app
Live and verified: guest accounts, Google sign in (published, any Google account), tasks, subtasks, notes, scratchpad, folders, habits, AI (Groq, Gemini backup), PWA, privacy and terms pages, round 2 and 3 designs. Local dev needs no env vars (PGlite).

## Build next (designed, on the "Honeylist Screens" canvas, page Round 4, boards 17 to 21)
Design is approved to build as drawn. Open the canvas: https://claude.ai/artifact/Q59DbcQdiSXB7p3KTYsmYn

1. **Repeating tasks** (boards 17, 18): none, daily, weekdays, weekly on chosen days, monthly, custom every N days or weeks; optional end (never, date, after N). Adds `task.repeatRule` (json) and `task.repeatEnd`. Completing a repeat creates the next occurrence (server side, in one transaction with the completion), toast "Done. Next one is Thursday" with Undo that removes the new occurrence. Menu: Skip this one, Stop repeating (ConfirmDialog). Repeat chip on rows and grid cards (lucide `Repeat`, add to `src/ui/icons.tsx`). Pure date maths in `src/lib/repeat.ts` with tests (month ends, DST, weekdays).
2. **Reminders and notifications** (boards 19, 20, 21): offsets at due time, 10 min, 1 hour, 1 day, custom. Friendly pre prompt before the browser permission prompt, denied state help, Done and Snooze actions, in app banner fallback, Profile row.
   - Delivery: Web Push using `public/sw.js` (add `push` and `notificationclick`), VAPID keys as env vars, a `push_subscription` table, and a scheduled job that sends due reminders.
   - **Caveat 1:** tasks have a date but no due time. Decide the rule (for example remind at 09:00 local on the due date when no time is set) and record it as a decision.
   - **Caveat 2:** Vercel Hobby cron runs at most once a day. Every minute cron needs Pro. Options: an external scheduler (cron-job.org or GitHub Actions calling a secured `/api/cron/reminders`), or check on app open plus daily cron. Pick one with Emmanuel.
   - iOS only allows web push for installed PWAs (16.4+). Show that in the permission help.

## Remaining backlog (build; small unless noted)
Reconcile `backlog.md` first: several rows there say Not built or Open for things that already shipped (habits, L9 splash, L10, L12 shadcn, L21). Fix the statuses as you go.
- Guest cleanup job, 90 days inactive (cron, same scheduler as reminders).
- Reorder tasks by drag (`position` column exists; needs design, keep it simple).
- "Move to folder" in the task menu.
- Shared search UI over `GET /api/search` (and `/` shortcut), plus `G F` shortcut.
- Folder page: show habits and notes (notes have no folder yet, decide).
- "Day 4 of 21" progress on long running tasks (needs start and due dates).
- Quick add `#newfolder` confirm chip.
- Just in time tips (`seenTips` pref).
- Empty state buttons on Home, Tasks, folder page and detail pane (board 15 art is built, buttons missing).
- First note celebration (designed board 13, not built).
- L5b: confirmation before deleting a task; decide about completion (currently Undo toast).
- Rail accessible names (Profile link, Scratchpad button, 768 to 1023).
- Task detail renders twice at `/tasks/$id`; fix so ids are unique.
- Bug: deleted task or note returns if reloaded within the 4.2 s Undo window (delete server side immediately and make Undo re create, or use `navigator.sendBeacon` on unload).
- Bug: plain bullet in a checklist has no marker (note preview CSS).
- Recheck double outlines on inputs and icon buttons (L13).
- Keep `/privacy` and `/terms` in step with any new data you collect (push subscriptions, reminders).

## Quality and infra
- Playwright e2e plus axe on every route (plan in testing.md), Lighthouse 90+ on all four, CI: add lint, e2e and `npm audit`.
- drizzle-kit migrations instead of the DDL string in `src/server/db.ts` (do this before adding the new tables).
- Fix the Google consent screen logo only if Emmanuel accepts Google's verification wait.
- Polish pass at the end: motion review with the `motion-reviewer` agent, mobile jank check, font weight check.

## Env vars (Vercel, already set unless noted)
`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GROQ_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`. New for reminders: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`. Claude cannot enter secrets in Vercel; Emmanuel adds them.
