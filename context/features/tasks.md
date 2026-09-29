# Tasks

## Purpose
The core to do list: capture, plan by start and due date, and finish tasks, grouped so today is obvious.

## Status
Built (Stage 1). Gaps listed under Planned.

## How it works now
- Routes: `/tasks` and `/tasks/$id` (`src/routes/tasks/*.tsx`) both render `TasksPage` (`src/components/TasksPage.tsx`). `$id` selects a task: desktop (1024+) shows `TaskDetail` in the right pane; below 1024 the list hides and the detail shows full screen.
- Row: `src/components/TaskRow.tsx`. Checkbox (`role="checkbox"`, name "Mark done: {title}"), link to detail, meta (In progress, time range, due label, folder tag, priority, "2 of 5" subtasks, Note), then row actions: an "Open {title}" chevron link (out of the tab order, same target as the row) and the menu "More actions for {title}" with Open, Start (todo only), Duplicate, Delete task. Both are 36px, radius 12, inset 12px, with tooltips. With a fine pointer they fade in on row hover or `:focus-within` (opacity, never hidden from the tab order); on touch they always show.
- Priority (`Priority` in `TaskRow.tsx`): High = flag + "High" in `--danger`, Low = chevron down + "Low" in `--ink-muted`, Medium shows nothing. Also on grid cards and the Home TodayCard (as a surface pill for contrast on pastel).
- List or grid: segmented control "Task view" (List, Grid, `aria-pressed`) beside the title, saved in `localStorage` `honeylist-task-view` (read after mount). Grid keeps the same groups; each group is a `.task-grid` of `TaskGridCard` (8px folder colour band, check and More on top, 15px semibold title, meta: folder, time or due, subtasks, priority). 1 column on phones, 2 on tablet, 3 from 1024. The whole card opens the task.
- Actions: `src/components/useTaskActions.ts`.
  - Complete: optimistic PATCH `status: done`, sound, toast "Task completed" with Undo. If it was the last open task in Today or Overdue: celebrate sound, confetti, toast "All done for today. Well played." (no Undo).
  - Delete: removed from cache at once, toast "Task deleted" with Undo; the real `DELETE /api/tasks/:id` fires after 4.2s unless undone.
  - Duplicate: creates "{title} (copy)" with subtasks. Start: sets `in_progress`.
- Grouping and sort: `src/lib/dates.ts` `groupOf` (Overdue, Today, Tomorrow, This week, Later, Inbox, Completed) and `sortTasks` (priority, start time, date). A task started on or before today stays in Today until done.
- Page: header with "N open", `SearchBar` "Search tasks" (local title filter), `QuickAdd`, filter chips (All, each folder, High priority) in group "Filter tasks", group sections `h2#g-{group}`, collapsed "Completed N" toggle.
- API: `GET/POST /api/tasks` (filters `status`, `categoryId`, `q`), `GET/PATCH/DELETE /api/tasks/:id`; services `listTasks`, `createTask`, `updateTask`, `deleteTask` in `src/server/services.ts`. Deleting a task deletes its subtasks and unlinks its notes. Query hooks `useTasks`, `useTaskMutations` in `src/lib/api.ts` (optimistic with rollback).
- States: skeleton rows while loading; alert with Retry on error; empty states for no tasks, no search results, empty folder.

## Planned per PRD
- Move to folder from the row menu; reorder; repeat rule (see [repeating-tasks](repeating-tasks.md)); remind (see [reminders](reminders-notifications.md)).
- "Day 4 of 21" with a progress bar for long running tasks.
- Completed rows slide into Completed (motion, pending O3).

## Known issues
- Empty states have no action button (L23).
- Undo window: reloading within 4.2s after delete brings the task back.
- Task detail is rendered twice in the DOM at `/tasks/$id` (duplicate ids).
- Confirmation for delete and complete requested by Emmanuel (O2).

## How to test
1. `open(page, '/tasks')`. Fill `#quick-add` with `Buy milk tomorrow`, press Enter. Expect toast `Added "Buy milk"` and a row under `#g-tomorrow`.
2. Click `getByRole('checkbox', { name: 'Mark done: Buy milk' })`. Expect toast "Task completed"; click `Undo`; the row is back and unchecked.
3. Open `getByRole('button', { name: 'More actions for Buy milk' })`, click menuitem `Delete task`. Expect "Task deleted"; click `Undo`; row returns. Delete again and wait 5s; `api(page, '/tasks')` no longer has it.
4. Menu, `Duplicate`: a row "Buy milk (copy)" appears. Menu `Start`: meta shows "In progress".
5. Seed via API tasks in each group (past `dueDate`, today, tomorrow, +3 days, +20 days, no dates). Expect headings Overdue, Today, Tomorrow, This week, Later, Inbox in that order.
6. Filters: click chip `High priority`; only high tasks show. Type in `getByRole('searchbox', { name: 'Search tasks' })` a missing word: empty state `No results for "..."`.
7. Complete a task, then click `getByRole('button', { name: /Completed/ })`: `aria-expanded="true"` and the done row shows.
8. Confetti: with one task due today, complete it: toast "All done for today. Well played." and a `canvas` appears then goes (skipped with reduced motion).
9. Desktop (1440): hover a row; `.task-row-actions` goes to opacity 1 and after 400ms a `role=tooltip` "More actions" shows above the button, wired by `aria-describedby`. Tab to the More button: tooltip shows at once; Esc hides it. At 390 with touch the actions are always visible and no tooltip appears.
10. Click `Grid` in group "Task view", reload: Grid is still pressed and `.task-card`s render (3, 2, 1 columns at 1440, 820, 390). Click a card: it opens the task; its checkbox completes with the Undo toast.
