# Date strip (calendar)

## Purpose
Pick a day on Home and see that day's tasks; today is marked.

## Status
Built as a fixed week. Redesign pending approval (L11, O6).

## How it works now
- `DateStrip` in `src/components/Cards.tsx`, styles `.zn-dates`, `.zn-date` in `src/zen.css` (48x64 pills, radius full, snap).
- Days come from `weekAround(today)` in `src/lib/dates.ts`: Sunday to Saturday of the current week only. Each option has a count of open tasks on that day (`isOnDay`: today counts everything started on or before today; other days only tasks starting that day).
- Markup: `role="listbox"` "Pick a day", options `role="option"` with `aria-selected` and names like "Wed 1, 2 tasks". Selected pill fills amber; today (not selected) gets an accent-ink ring.
- Shown on Home only when any task has a start or due date (`src/routes/index.tsx`). Picking a day swaps the Today section heading to the full date and lists that day's tasks; the overdue banner shows only on today.

## Planned per PRD and Emmanuel
- Phones scroll with snap; from md a full week fits (PRD).
- Emmanuel (L11): pills look too rounded on desktop, reduce the radius; smooth, speed sensitive (momentum) scrolling bounded from today to the last task date plus about 3 days. Needs a design (O6).
- Selection motion: pill grows taller and fills amber in 180 ms.

## Known issues
- Cannot go beyond the current week; days before today in the week are shown but mostly empty.
- No arrow key navigation inside the listbox.

## How to test
1. Seed a task with `startDate` today, `open(page, '/')`: `getByRole('listbox', { name: 'Pick a day' })` has 7 options; today's option has class `is-today is-selected`.
2. Seed a task for tomorrow (if in this week), click that option: `aria-selected="true"`, heading shows the long date, the task card shows.
3. Click today again: heading "Today".
4. Check pill radius and spacing at 1440 against the canvas; screenshot both themes.
