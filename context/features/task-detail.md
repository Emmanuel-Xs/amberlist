# Task detail and create task form

## Purpose
See and edit every field of a task (detail), or create one with all fields (form).

## Status
Built.

## How it works now
- Detail: `src/components/TaskDetail.tsx`, shown by `TasksPage` at `/tasks/$id`: right pane (380 px, sticky, own scroll `.tasks-pane-scroll`) at 1024+, full screen with a "Tasks" back link below. Pane empty state "Pick a task".
  - Header: "Delete" (danger, Undo toast, navigates to /tasks) and "Close details" (pane only).
  - Title textarea (sr-only label "Task title"), saves on blur or Enter.
  - Status radiogroup "Status": Todo, In progress, Done (Done runs the complete action with toast and maybe confetti).
  - Dates: Start, Due, From, To (To disabled until From is set; clearing From clears To). Every change PATCHes at once.
  - Folder radiogroup: Inbox plus each folder. Priority radiogroup: Low, Medium, High.
  - Repeat and Ends fields (popover or sheet, see [repeating-tasks.md](repeating-tasks.md)) and the Remind me field (see [reminders-notifications.md](reminders-notifications.md)), with a line saying what happens when it is done.
  - Subtasks: progressbar "Subtasks done", "2 of 5", checkbox per subtask (name = subtask title), "Delete subtask {title}", input "Add a subtask" (Enter adds). Ticking the first subtask sets the task to In progress (server side in `updateSubtask`).
  - Notes: linked notes as `NoteCard`s, "New note" creates "{title} notes" linked to the task and opens the editor.
  - "Saving" / "Saved" live label.
- Create form: `src/components/CreateTask.tsx`, a `Modal` titled "New task" (bottom sheet on phones, dialog from md), TanStack Form. Fields Title (autofocus), Start (defaults to today), Due, From, To, Folder, Priority (default Medium), Subtasks (Enter adds), Repeat, Remind me, Ends. Buttons Cancel and "Create task". Opens prefilled from quick add text (`openCreate(draft)`). Toast "Task created".
- API: `PATCH /api/tasks/:id`, `POST /api/tasks/:id/subtasks`, `PATCH/DELETE /api/subtasks/:id`.

## Planned per PRD
- "Day X of Y" progress; move and duplicate from detail; AI break down (Phase 3).

## Known issues
- Rendered twice at `/tasks/$id` (pane plus hidden mobile copy); ids `title-{id}`, `st-{id}`, `nt-{id}` are duplicated.
- The Delete button deletes with Undo, no confirm (O2).

## How to test
1. Seed a task via API, `open(page, '/tasks/' + id)`. Scope to visible: `const d = page.locator('.tasks-pane, .tasks-detail-mobile').filter({ visible: true })`.
2. Edit title: fill `d.getByLabel('Task title')`, press Enter; `GET /api/tasks/:id` has the new title; "Saved" shows.
3. `d.getByRole('radio', { name: 'In progress' })` click: row meta shows "In progress".
4. Fill `d.getByLabel('Due')` with a past date: the task moves to Overdue with a flag.
5. Add subtasks via `d.getByLabel('Add a subtask')` + Enter twice. Tick the first `d.getByRole('checkbox', { name: '<subtask>' })`: status becomes in_progress, progressbar value 50. Reload: still ticked (regression for the old 400).
6. `d.getByRole('button', { name: 'New note' })`: lands on `/notes/<id>` with `#note-title` "<task> notes"; back on the task the note card shows.
7. Create form: click `getByRole('button', { name: 'Add a task' })` (phone) or press `c` (desktop). In dialog "New task" fill `Title`, pick radio `Work`, click "Create task": toast "Task created", dialog closes.
8. Phone: opening the form focuses Title (typing dialog); opening a task detail does not pop the keyboard.
