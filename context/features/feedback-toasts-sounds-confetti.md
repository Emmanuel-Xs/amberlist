# Feedback: toasts, sounds, confetti

## Purpose
Confirm what happened, offer Undo, and celebrate rarely, without interrupting.

## Status
Built (DS level). The livelier Duolingo style set, first task bee, and placement rules are pending design (L7, L8).

## How it works now
- Store: `src/lib/store.ts` `toast({ message, tone, icon, actionLabel, onAction, duration, silent })`; max 3 kept (oldest dropped); auto dismiss after 4 s unless `duration: 0` (errors use 0 and stay).
- UI: `Toaster` in `src/components/AppShell.tsx`: `.zn-toaster` with `aria-live="polite"`; each `.zn-toast zn-toast--{tone}` has role `status` (or `alert` for errors), icon, message, action button, "Dismiss", and a countdown bar `.zn-toast-timer`. Position (`src/styles.css`): bottom center above the phone bar; bottom left beside the rail (768+) or sidebar (1024+).
- Messages in use: `Added "{title}"`, "Task created", "Task completed" (Undo), "All done for today. Well played.", "Task deleted" (Undo), "Task duplicated", "Note deleted" (Undo), "Note duplicated", "Turned into a task", "Turned into a note", "Folder created", "Folder updated", "{name} deleted. Tasks moved to Inbox.", "Name saved", "All your data was deleted", error messages from the API.
- Sounds: `src/lib/feedback.ts` `sound(name)`: complete, undo, delete, error, celebrate, success (two soft rising notes at about 3.5% gain).
- Success toasts: `toast()` in `src/lib/store.ts` plays `success` for `tone: 'success'` unless `silent: true` or another sound started in the last 400 ms (`playedRecently()`), so "complete" plus "Task completed" never doubles up. Web Audio sine tones at about 6% gain, only after user actions, off when prefs `sounds` is false (`setSoundsEnabled`, applied in `useTheme`).
- Confetti: `confetti()` draws 90 pastel and amber bits on a fixed canvas for about 1.8 s, then removes it. Skipped under reduced motion. Called only when completing the last open Today or Overdue task (`useTaskActions`).

## Planned per PRD and Emmanuel
- Toast pauses on hover or focus (DS), not implemented.
- Confetti also for a long running task finished and a habit goal.
- First task: confetti plus a bee animation (O7).
- Encouraging, Duolingo style messages for create, complete, overdue, and a clear message of what happened on completion (L7).
- Placement rules: when a message is a modal vs top vs left vs right (O4).
- Retry action on background save errors ("Couldn't save your note" with Retry).

## Known issues
- No hover pause. Undo toasts rely on a 4.2 s deferred delete.

## How to test
1. Complete a task: `.zn-toast` with role status "Task completed", a `.zn-toast-timer`, an `Undo` button. It disappears after about 4 s.
2. Trigger 4 toasts quickly (duplicate a task 4 times): at most 3 `.zn-toast` exist.
3. Error toast: `page.route('**/api/tasks', r => r.fulfill({ status: 500, body: '{"error":"Boom"}' }))` then quick add: a toast with role `alert` "Boom" that stays until "Dismiss".
4. Sounds: `addInitScript` wraps `AudioContext.prototype.createOscillator` to count calls; completing a task creates oscillators; with Sounds off in Profile, none.
5. Confetti: without reduced motion, complete the only today task: a `canvas[aria-hidden="true"]` is attached then removed within 3 s. With `reducedMotion: 'reduce'`: no canvas.
6. Phone: toasts sit above the bottom nav and do not cover it; desktop: bottom left beside the sidebar.
