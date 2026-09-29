# Habits

## Purpose
Routines you repeat and track over time. Unlike a task, a habit is never done: it builds a streak.

## Status
Not built (Phase 2). Needs design approval for the pages (only the HabitRow board and the habits illustration exist).

## How it works now
- Nothing in the app. The `flame` icon and a "habits" illustration exist in the DS; `src/ui/zen.tsx` does not include the habits illustration.
- The phone bar has Folders where the PRD put Habits (O9).

## Planned per PRD
- Routes `/habits` and `/habits/$id`.
- Fields: name, icon, optional folder, frequency (daily, specific weekdays, X times a week), goal (e.g. 21 days, or ongoing), optional reminder time.
- Check in: one tap per scheduled day from Home's Habits row or the Habits page; tapping again the same day undoes.
- Stats: current streak, best streak, total check ins, "Day 19 of 21" with a bar, calendar heatmap on the detail page. Missing a day breaks the current streak, keeps best and total. Copy never scolds.
- Home Habits row after the first habit; confetti on reaching the goal; check in pop 250 ms.
- Tables `habit` (name, icon, categoryId, frequency, daysOfWeek, timesPerWeek, goalDays, reminderTime, archivedAt) and `habitCheckin` (habitId, date, unique per habit and date).
- Server: `listHabits`, `createHabit`, `updateHabit`, `deleteHabit`, `toggleCheckin(habitId, date)` with endpoint tests (success, 400, 401, 404) and unit tests for streak maths.
- Folder page lists the folder's habits.

## Known issues
- Emmanuel asked "what about habits" (L21): answer is Phase 2, design first.

## How to test (once built)
1. Create a habit "Read" daily, goal 21. Check in today: streak 1, "Day 1 of 21".
2. Tap again: undone, streak 0.
3. Seed check ins for the last 3 days via API: current streak 3; skip one day in the middle: current streak restarts, best keeps the max.
4. Home shows the Habits row after the first habit; empty `/habits` shows the habits illustration with "Add a habit".
