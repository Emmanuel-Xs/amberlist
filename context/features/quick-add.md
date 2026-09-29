# Quick add

## Purpose
Capture a task in seconds from one input, with light parsing of dates, times, folders and priority.

## Status
Built. Redesigned 2026-09-30 (approved): Add button on the right, no Q box, desktop hint.

## How it works now
- Component: `src/components/QuickAdd.tsx`, used on Home, Tasks and folder pages. Pill field `.quick-add-field` (56 px, 2 px `--ring` focus ring via `:focus-within`). Input `#quick-add` (sr-only label "Add a task"), no leading icon, placeholder `Add a task, like "Call mum tomorrow 5pm"` (`Add a task, like "Gym at 5pm"` under 520 px).
- Right side: amber pill submit button "Add task" (plain plus icon plus the word "Add"); under 768 px an icon only 40 px round button. Clicking it empty just focuses the field.
- Under the field, only with `(hover: hover) and (pointer: fine)`: muted 13 px hint "Press Q anywhere to add a task · Enter saves" (hidden while chips show).
- The old leading "Open the full task form" button is gone; the full form is still on Home ("Full task form"), the phone bar +, and `C`.
- Parser: `src/lib/parse.ts` `parseQuickAdd(input, today)`:
  - `#name` folder; `!high`, `!med`, `!medium`, `!low` priority.
  - `due fri`, `due tomorrow` due date.
  - `today`, `tonight`, `tomorrow`, `tmr`, weekday names, `next week` (next Monday) start date.
  - Time ranges `10-10:30`, `9am-10am`, `10 to 11`; single times `5pm`, `17:00`, `at 9am`. A time alone sets the start date to today.
  - Anything else stays in the title.
- Chips (`aria-live="polite"`) show each parsed part with a remove button "Remove {label}"; removing a chip puts the words back into the title (invisible markers stop re-parsing).
- Submit: finds the folder by name (case insensitive) or creates it with the next pastel; `POST /api/tasks`; `complete` sound; toast `Added "{title}"` with `silent: true` (no second sound); input clears and keeps focus. Errors: error toast that stays.
- `Q` focuses `#quick-add` when on screen, otherwise opens the full form. See [keyboard-shortcuts](keyboard-shortcuts.md).

## Planned per PRD
- New `#folder` should show a confirm chip before creating it.
- Quick add syntax tip on first use (just in time tips).

## Known issues
- A new folder is created silently.

## How to test
1. `open(page, '/')`. Type `Call mum tomorrow 5pm #personal !high` into `#quick-add`. Expect chips "Tomorrow", "17:00", "Personal", "High priority".
2. Click `getByRole('button', { name: 'Remove 17:00' })`: the chip goes; press Enter. `api(page, '/tasks')` shows title "Call mum 5pm", startDate tomorrow, priority high, category Personal.
3. Type `Standup 10-10:30` and Enter: task with startTime 10:00, endTime 10:30, startDate today.
4. Type `Revise #exams` and Enter: `GET /api/categories` now has "Exams".
5. Type `Plan trip` then click `getByRole('button', { name: 'Add task' })`: the task is added. Desktop: `.quick-add-hint` is visible; phone (touch): hidden, and the Add button is 40 by 40 with no label.
6. Desktop: press `Escape`, click elsewhere, press `q`: `#quick-add` is focused.
7. Phone (390): placeholder is the short one and not cut off.
