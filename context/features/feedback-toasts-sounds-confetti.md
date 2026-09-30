# Feedback: toasts, sounds, celebrations

## Purpose
Confirm what happened, offer Undo, and celebrate rarely, without interrupting.

## Status
Built. Round 3 board 13 celebrations built 2026-09-30 (tick, first task ever, all done for today); generic confetti removed, no bee. Placement rules still open (O4).

## How it works now
- Store: `src/lib/store.ts` `toast({ message, tone, icon, actionLabel, onAction, duration, silent })`; max 3 kept (oldest dropped); auto dismiss after 4 s unless `duration: 0` (errors use 0 and stay).
- UI: `Toaster` in `src/components/AppShell.tsx`: `.zn-toaster` with `aria-live="polite"`; each `.zn-toast zn-toast--{tone}` has role `status` (or `alert` for errors), icon, message, action button, "Dismiss", and a countdown bar `.zn-toast-timer`. Position (`src/styles.css`): bottom center above the phone bar; bottom left beside the rail (768+) or sidebar (1024+).
- Messages in use: `Added "{title}"`, "Task created", "Task completed" (Undo), "All done for today. Well played.", "Task deleted" (Undo), "Task duplicated", "Note deleted" (Undo), "Note duplicated", "Turned into a task", "Turned into a note", "Folder created", "Folder updated", "{name} deleted. Tasks moved to Inbox.", "Name saved", "All your data was deleted", error messages from the API.
- Sounds: `src/lib/feedback.ts` `sound(name)`: complete, undo, delete, error, celebrate, success (two soft rising notes at about 3.5% gain).
- Success toasts: `toast()` in `src/lib/store.ts` plays `success` for `tone: 'success'` unless `silent: true` or another sound started in the last 400 ms (`playedRecently()`), so "complete" plus "Task completed" never doubles up. Web Audio sine tones at about 6% gain, only after user actions, off when prefs `sounds` is false (`setSoundsEnabled`, applied in `useTheme`).
- Celebrations (design board 13, all built from the logo, `src/components/Celebrate.tsx` and `src/components/TickFill.tsx`):
  - **Every tick** (`TickFill` inside `.zn-check` in `TaskRow`, `TaskGridCard`, subtasks in `TaskDetail`, Today cards in `Cards.tsx`): honey rises in the circle with a small wave (300 ms, clipped to the circle), the check draws and pops (`SPRING_POP`) at 200 ms (`TICK_CHECK_MS`), six comb cell sparks flick out and fade (230 to 600 ms). `tickSound()` plays `complete` at the check moment. Then the existing 450 ms hold and glide (`useTicked`). Reduced motion: full circle at once, no sparks, sound at once. Today cards: on the amber card the fill is on-pastel with an amber check.
  - **First task ever**: `isFirstTask(qc)` (tasks list loaded and empty, and `localStorage['honeylist-first-task']` not set) is read before create in `QuickAdd` and `CreateTask`; on success `celebrateFirstTask(id)` finds the new `[data-task-check="id"]` circle on screen, then a canvas overlay (`.celebrate-canvas`, pointer-events none) drops honey that tracks the circle, squashes on it, rings, and bursts 10 comb cells with gravity (1.7 s). Toast "Your first task is in" / "Nice start. Tick it when it's done." (badge logo) at 1.1 s. The circle stays unticked. No circle on screen (a future date) or reduced motion: toast only. Tap or any key skips.
  - **All done for today** (last open Today or Overdue task ticked in `useTaskActions`): after the 450 ms hold, `celebrateAllDone()` shows `CelebrateHost` (mounted inside `Toaster`): centered, non blocking `.celebrate-seal`. The check's five cells fill one by one (0.12 s + 0.17 s each), the hexagon blooms at 1.05 s and the cells cross fade to on-accent (the logo), `sound('celebrate')`; at 1.3 s honey stretches out of the hex bottom tip (32, 50), pinches off (the stub remains) and the drop settles; closes at 2.05 s (fade 0.25). Text "All done for today" is a `role="status"` live region. Tap or key skips. Reduced motion: the final logo and text, then close at 1.6 s. The toast says "Nice work" / "Rest, or pull something forward." with Undo (Undo also cancels a pending seal).
- `confetti()` was removed from `feedback.ts` (no users left; habits use sound plus toast).
- Motion gotcha: rows live in `<AnimatePresence initial={false}>` (TasksPage) whose PresenceContext keeps `initial: false`, so anything mounted inside a row later skipped its `initial`. `TickFill` resets it with `<PresenceContext.Provider value={null}>`.

## Planned per PRD and Emmanuel
- Toast pauses on hover or focus (DS), not implemented.
- Confetti also for a long running task finished and a habit goal.
- Same first time treatment for the first note (board 13 note), not built.
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
5. Tick: sample `.tick-honey-wave` transform per frame after a click: y goes from about 26px to 0 over ~300 ms; `.tick-spark-arm svg` count 6, gone after ~700 ms. With `reducedMotion: 'reduce'`: no `.tick-sparks`.
6. Phone: toasts sit above the bottom nav and do not cover it; desktop: bottom left beside the sidebar.
7. First task: fresh guest, quick add "Call mum today": `.celebrate-canvas` exists for ~1.7 s, the drop lands on the Today card's circle, then the "Your first task is in" toast. Reduced motion: no canvas, toast only. A second task: no canvas.
8. All done: tick the last today task: `.celebrate-seal` with "All done for today" appears after ~0.45 s and is gone by ~2.6 s; tapping skips it. Reduced motion: seal shown static, then gone. Frame script: `scratchpad/cel.py` (390 touch and 1440, both themes).
