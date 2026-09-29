# Reminders and notifications

## Purpose
Remind people when a task starts (and later at a habit's reminder time).

## Status
Not built. The switch exists but does nothing beyond saving (L18: "is our notification working": no).

## How it works now
- `task.remind` boolean (`src/server/schema.ts`), set by the Switch "Remind me when it starts" in the create form (`src/components/CreateTask.tsx`) and task detail (`src/components/TaskDetail.tsx`).
- No Notification API, no service worker, no push, no scheduler anywhere in `src/`.

## Planned per PRD
- Ask notification permission only when "Remind me" is first switched on; explain first, handle "denied" gracefully (inline note, never nag).
- Needs a design for the permission explainer and the denied state.
- Options to decide: in tab only (setTimeout while open), Web Push with a service worker plus a scheduled sender (Vercel cron), or email. Grill Emmanuel on scope.
- Habit reminder times use the same system.

## Known issues
- The switch implies a feature that does not exist. Consider hiding it until built (needs Emmanuel's call).

## How to test (once built)
1. `context.grantPermissions(['notifications'])`, create a task starting in 1 minute with Remind on, assert a notification (stub `window.Notification` in `addInitScript` to record calls).
2. Deny permission: turning the switch on shows the explainer and the denied note; no repeated prompts.
