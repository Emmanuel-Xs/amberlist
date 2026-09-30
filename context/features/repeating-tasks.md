# Repeating tasks

## Purpose
Obligations that come back when finished ("Pay rent, monthly"). Different from habits: no streaks. Designed on the Round 4 canvas, boards 17 and 18.

## Status
Built 2026-09-30. Endpoint tests, unit tests for the date maths, checked in the browser at 1280 and 390 px (dark).

## How it works
- **Data:** `task.repeat_rule` (jsonb) and `task.repeat_end` (jsonb) in `src/server/schema.ts`. Rule kinds: `daily`, `weekdays`, `weekly` (days 0 Sunday to 6 Saturday), `monthly` (remembers `day` so the 31st comes back after a short month), `every` (N days or N weeks). End: `never`, `on` a date, `after` N times (`count` is how many are left, this one included).
- **One open task per series.** Finishing (or skipping) one makes the next; missing days never pile up as overdue rows.
- **Date maths:** `src/lib/repeat.ts` (`nextOccurrence`). The next date is the first matching day after the start and after today, so it is never overdue on arrival. Same code runs on the server and in the toast text. Tests in `tests/repeat.test.ts` (month ends, leap years, Friday to Monday, DST weeks, overdue jumps, end rules).
- **Complete:** `PATCH /api/tasks/:id` with `status: done` creates the next task in the same transaction (`updateTask` and `spawnNext` in `src/server/services.ts`): same title, folder, priority, times, reminder, unticked subtasks, due date shifted by the same gap. The response is the task plus `next` (null when the series ended). Undo reopens the task and deletes `next`.
- **Skip:** `POST /api/tasks/:id/skip` moves the open task to its next day (count drops), nothing goes to Completed. 400 for a plain task or the last one.
- **Stop repeating:** `PATCH` with `repeatRule: null` (menu item asks first with `ConfirmDialog`). Delete already ends the series, since only one task is open.
- **Rules of the API:** a rule needs a start date (400 otherwise); `weekly` needs at least one day; schemas are strict.
- **UI:** `src/components/RepeatPicker.tsx` (Repeat and Ends fields; popover from 768 px, bottom sheet on phones; Cancel and Done; the sentence under it), fields in Create task and Task detail, `RepeatChip` (`TaskChips.tsx`) on rows and grid cards ("4 left", "Last one"), menu items Skip this one and Stop repeating (`useTaskMenu`), toasts in `useTaskActions.ts` and `repeatDoneMessage` in `src/lib/messages.ts`.

## Known issues
- Picking a repeat on a task with no start date starts it today (the picker says so); the start field in the form updates when Done is pressed.
- No quick add parsing like "every monday" (not in the PRD).
- The Completed list shows the repeat chip but not the time of completion.

## How to test
1. Create "Pay rent", Monthly, start on the 31st: complete it, the next one is the last day of the next month.
2. Weekly Mon and Wed done on Wednesday: toast says "Next one is Monday"; Undo removes the new task and reopens the old one.
3. "After 2 times": chip says "2 left", then "Last one"; finishing the last makes no new task.
4. Menu: Skip this one moves the date, Stop repeating asks first and keeps the task as a single one.
5. `npm test` (unit and endpoint suites).
