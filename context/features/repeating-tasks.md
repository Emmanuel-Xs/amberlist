# Repeating tasks

## Purpose
Obligations that come back when completed ("Pay rent, monthly"). Different from habits: no streaks.

## Status
Not built (Phase 2). Needs a design for the repeat picker and row indicator.

## How it works now
- No `repeatRule` column in `task` (`src/server/schema.ts`), no field in `taskCreate` (`src/server/validation.ts`), nothing in the form.

## Planned per PRD
- Repeat: none, daily, weekdays, weekly, monthly. Set in the full task form and task detail.
- Completing a repeating task creates the next one (next start and due dates shifted by the rule), keeping title, folder, priority, subtasks (unticked) and time.
- Undo on completion must also remove the created next task.
- Quick add parsing like `every monday` could come later (not in the PRD).

## Known issues
- None (not built).

## How to test (once built)
1. Create "Pay rent" monthly with due date the 1st. Complete it: the done task stays in Completed and a new one exists with the next month's date.
2. Undo: the new one is removed and the original is open again.
3. Weekdays rule completed on Friday: next task is Monday.
4. Endpoint tests cover invalid rules (400).
