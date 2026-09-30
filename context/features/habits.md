# Habits

## Purpose
Routines you repeat and track over time. Unlike a task, a habit is never done: it builds a streak.

## Status
Built 2026-09-30 (PRD Phase 2, Emmanuel approved building it). The row follows the approved HabitRow board; the list and detail pages are built from DS parts (no approved page design yet), so they need Emmanuel's sign off from the screenshots.

## Files
- Server: `habit` and `habit_checkin` tables plus DDL in `src/server/schema.ts`; Zod `habitCreate`, `habitUpdate`, `habitCheckinToggle` in `validation.ts`; `listHabits`, `getHabit`, `createHabit`, `updateHabit`, `deleteHabit`, `toggleCheckin` in `services.ts`; `habits`, `habitById`, `habitCheckins` in `handlers.ts`.
- Routes: `src/routes/api/habits/index.ts`, `$id.ts`, `$id.checkins.ts`; pages `src/routes/habits/index.tsx`, `src/routes/habits/$id.tsx`.
- Logic: `src/lib/streaks.ts` (pure). Hooks: `useHabits`, `useHabitMutations`, `habitsQuery`, `allHabitsQuery` in `src/lib/api.ts`.
- UI: `src/components/HabitRow.tsx` (board row plus week dots), `HabitDialog.tsx` (create and edit), `HomeHabits.tsx` (Home row and "+ Add a habit"), `useHabitActions.ts` (check in, archive, delete). Habits illustration in `src/ui/zen.tsx`. CSS at the end of `src/styles.css` (Habits section).

## How it works
- Fields: name, icon (flame, book, pen, droplet, target, cart, sun, home, note, folder), optional folder, frequency, goal (Ongoing, 7, 21, 30, 66 or your own 1 to 365), `reminderTime` (stored, no UI yet), archived.
- Frequency: `daily`; `weekdays` with `daysOfWeek` (ISO 1 Mon to 7 Sun, default Mon to Fri; the dialog calls it "Some days"); `x_per_week` with `timesPerWeek` (default 3). The server stores only the field that matches the frequency.
- API: `GET /api/habits` (active; `?archived=1` for all), `POST /api/habits`, `GET/PATCH/DELETE /api/habits/$id`, `POST /api/habits/$id/checkins {date, done?}`. Without `done` it toggles. Dates are the client's local `YYYY-MM-DD`; a date more than 36 hours ahead of the server's UTC day is a 400. Each habit comes back with `checkins: string[]`; stats are worked out on the client.
- Streaks (`habitStats`): today stays open, so not checking in yet keeps yesterday's streak. Daily counts days in a row. Weekday habits skip unscheduled days (a Friday streak survives the weekend); a check in on a rest day counts for the total only. x a week counts ISO weeks (Mon to Sun) that met the target; the current week never breaks the streak until it is over. Missing a day breaks the current streak, keeps best and total.
- "Day X of Y" = total check ins, capped at the goal (kinder than streak based). Goal reached when total hits the goal.
- Check in: one tap on the circle (Habits page, Home row, or the big button on the detail page). The circle fills amber with a pop (250 ms scale, check springs in with `SPRING_POP`), the streak number ticks, `sound('complete')`, a friendly toast with Undo. Milestones 3, 7, 21 get the `flame` badge toast. Reaching the goal plays `sound('celebrate')` with a bigger toast. Tapping again the same day undoes (`sound('undo')`, no toast).
- Archive keeps the history and hides the habit; "Archived habits" at the foot of `/habits` lists them with Restore. Delete acts at once with an Undo toast (the request waits 4.2 s), like tasks.
- Home: a Habits section (today's scheduled habits, not yet done first, max 6, "All habits" link) shows once a habit exists; sideways scroll on phones, grid from 768. "+ Add a habit" sits beside "Full task form" and "New folder".
- Nav: Habits (flame) in the sidebar, rail and phone bar (Home, Tasks, +, Notes, Habits). `G B` goes to Habits; listed in the shortcuts sheet.
- Heatmap: 12 weeks, Monday to Sunday down each column, month labels on top. Checked = amber with a tick, no check in = surface raised, rest day = dashed outline, before the habit existed = quiet outline, today = ring. `role="img"` with a count label; each cell has a title.
- Folder delete clears `habit.categoryId`. Export includes habits (archived too); delete all wipes habits and check ins.

## Known issues and open questions
- `confetti()` was removed from `src/lib/feedback.ts` by the round 3 celebrations work, so the goal moment is sound plus toast only. A habit goal celebration needs a design (maybe the comb seal from board 13).
- `mergeGuestData` (Google sign in) does not move habits or check ins yet, and `pendingMergeCounts` ignores them. Discarding still wipes them (`wipeRows` includes habits).
- The folder page does not list habits yet (PRD: "Opening a folder shows its tasks, then its habits and notes").
- Reminder time is stored but has no field in the dialog, since nothing notifies yet (see reminders).
- Habit `color` is stored (default butter) but not picked or shown; the board has no colour.
- PRD desktop Home puts the Habits row beside Recent notes; it is full width above Folders for now.
- Past days can be back filled through the API only; the heatmap cells are too small for 44 px targets.

## How to test
1. Empty `/habits`: habits illustration, "Build your first habit", "Add a habit" button.
2. Create "Read" daily, goal 21: row shows "Day 1 of 21" after a check in, flame "1 day". Tap again: undone, "0 days".
3. Seed the last 2 days via `POST /api/habits/$id/checkins {date, done: true}`, check in today: "3 day streak" flame toast; detail shows current 3, best 3, total 3.
4. Seed a gap: current restarts, best keeps the max (unit tests cover this).
5. Detail: Edit (change to Some days, Mon Wed Fri), Archive then Restore from "Archived habits", Delete with Undo.
6. Home shows the Habits row after the first habit and "+ Add a habit" at the foot. Phone bar shows Habits.
7. 390 touch and 1440, dark and light (set the theme with `PATCH /api/me`, the app re-applies it on load).
