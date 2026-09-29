# Quick add

## Purpose
Capture a task in seconds from one input, with light parsing of dates, times, folders and priority.

## Status
Built. Redesign pending approval (desktop looks like search, O12).

## How it works now
- Component: `src/components/QuickAdd.tsx`, used on Home, Tasks and folder pages. Input `#quick-add` (sr-only label "Add a task"), placeholder "Add a task. Try "Read 20 pages tomorrow #study"" (shorter under 520 px). Round amber + on the left opens the full form ("Open the full task form"). Right side: `Q` hint from tablet up, or an "Add" button once there is text.
- Parser: `src/lib/parse.ts` `parseQuickAdd(input, today)`:
  - `#name` folder; `!high`, `!med`, `!medium`, `!low` priority.
  - `due fri`, `due tomorrow` due date.
  - `today`, `tonight`, `tomorrow`, `tmr`, weekday names, `next week` (next Monday) start date.
  - Time ranges `10-10:30`, `9am-10am`, `10 to 11`; single times `5pm`, `17:00`, `at 9am`. A time alone sets the start date to today.
  - Anything else stays in the title.
- Chips (`aria-live="polite"`) show each parsed part with a remove button "Remove {label}"; removing a chip puts the words back into the title (invisible markers stop re-parsing).
- Submit: finds the folder by name (case insensitive) or creates it with the next pastel; `POST /api/tasks`; sound; toast `Added "{title}"`; input clears and keeps focus. Errors: error toast that stays.
- `Q` focuses `#quick-add` when on screen, otherwise opens the full form. See [keyboard-shortcuts](keyboard-shortcuts.md).

## Planned per PRD
- New `#folder` should show a confirm chip before creating it.
- Quick add syntax tip on first use (just in time tips).
- Redesign: move the +, clear focus state, discoverable Q (pending proposal).

## Known issues
- On desktop it reads like a search bar (L22).
- A new folder is created silently.

## How to test
1. `open(page, '/')`. Type `Call mum tomorrow 5pm #personal !high` into `#quick-add`. Expect chips "Tomorrow", "17:00", "Personal", "High priority".
2. Click `getByRole('button', { name: 'Remove 17:00' })`: the chip goes; press Enter. `api(page, '/tasks')` shows title "Call mum 5pm", startDate tomorrow, priority high, category Personal.
3. Type `Standup 10-10:30` and Enter: task with startTime 10:00, endTime 10:30, startDate today.
4. Type `Revise #exams` and Enter: `GET /api/categories` now has "Exams".
5. Type `Plan trip` then click `getByRole('button', { name: 'Open the full task form' })`: dialog "New task" opens with Title "Plan trip".
6. Desktop: press `Escape`, click elsewhere, press `q`: `#quick-add` is focused.
7. Phone (390): placeholder is the short one and not cut off.
