# Home

## Purpose
Show what matters today and capture fast. Home grows with the user: sections appear only once used.

## Status
Built. Onboarding name, habits row, nudges not built.

## How it works now
- Route `/` (`src/routes/index.tsx`).
- Phone header (under 768, `.phone-header`): logo plus a link "Profile".
- Greeting: "Good morning / afternoon / evening" plus ", {name}" when a display name is set; h1 "Let's plan your day." (no tasks), "Nothing due today.", or "You have **N tasks** today." (count in accent-ink).
- `QuickAdd` always.
- First visit (no tasks): empty state "Add your first task" with a parser hint (no button).
- `DateStrip` (see [date-strip](date-strip.md)) once any task has a start or due date. Picking a day shows that day's tasks.
- Overdue banner (only on today): link "{n} overdue: {first title} and N more" with "Review", goes to `/tasks`.
- Today section: heading "Today" (or the picked date) with "All tasks" link. Up to 4 bold `TodayCard`s (first is amber, others use the folder pastel), then up to 2 `TaskRow`s, then "See all N tasks" when over 6. Empty: "All done for today" (done illustration) if something was completed today, else "Nothing planned".
- `TodayCard` (`src/components/Cards.tsx`): folder pill, badge (In progress or due label), title link, time, subtask progressbar, round checkbox "Mark done: {title}", folder icon.
- Recent notes (aside on desktop): 3 `NoteCard`s with "All notes".
- Folders row (once a folder has tasks): all folders with "All folders".
- Foot links: "Full task form" (opens the create dialog) and "New folder" (to `/folders`).
- Loading: skeletons.

## Planned per PRD
- Onboarding name screen so the greeting has a name (L1, design).
- Habits row after the first habit; save your data nudge card; just in time tips; "+ Add a habit" foot link.
- Desktop: Today cards in 2 columns, Habits and Recent notes side by side, folders 4 to 6 columns.
- Duolingo style messages and first task bee (L7, design).

## Known issues
- Greeting without a name reads oddly (L1).
- Folders row is not capped at 6 (L20).
- First visit and "Nothing planned" empty states have no button (L23).
- Home nav item staying amber: verify.

## How to test
1. New context, `open(page, '/')`: heading "Let's plan your day.", empty state "Add your first task", no DateStrip, no notes or folders sections.
2. Phone: `getByRole('link', { name: 'Profile' })` is visible and goes to `/profile`. Desktop: `.phone-header` is hidden.
3. Quick add `Read 20 pages`: heading becomes "Nothing due today." (no date) and the first visit state goes.
4. Seed 8 tasks with `startDate` today: heading "You have 8 tasks today.", 4 cards plus 2 rows, link "See all 8 tasks" to `/tasks`.
5. Seed a task with a past `dueDate`: banner text contains "1 overdue:"; click it lands on `/tasks`.
6. Click `getByRole('listbox', { name: 'Pick a day' }).getByRole('option').nth(6)`: the section heading shows that date and its tasks.
7. Complete every today task via their "Mark done: ..." checkboxes: "All done for today" state and the celebration toast.
8. Set name via `api(page, '/me', 'PATCH', { displayName: 'Emmanuel' })`, reload: greeting ends ", Emmanuel".
9. Create a note: "Recent notes" appears with "All notes" linking to `/notes`.
