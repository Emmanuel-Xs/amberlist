# Search

## Purpose
Find tasks and notes by words in their titles and bodies.

## Status
Partly built: per page local filters work; the shared search endpoint has no UI.

## How it works now
- Tasks page: `SearchBar` "Search tasks" (`src/ui/zen.tsx`, `role="search"`, `type="search"`) filters the loaded tasks by title on the client (`src/components/TasksPage.tsx`). Empty state `No results for "{q}"`.
- Notes page: `SearchBar` "Search notes" filters loaded notes by title and body on the client (`src/routes/notes/index.tsx`). Empty state `No results for "{q}"`.
- API: `GET /api/search?q=` (`searchAll` in `src/server/handlers.ts`, `search()` in `src/server/services.ts`) returns `{ tasks, notes }` using `ILIKE` on task titles and note titles and bodies; `q` is required, 1 to 200 chars (400 otherwise). `GET /api/tasks?q=` and `GET /api/notes?q=` also filter. Covered by `tests/api.test.ts`.
- The SearchBar filter button ("Filters") exists in the component but is not used.

## Planned per PRD
- One search shared by tasks and notes, opened with `/` on desktop.
- Filters: bottom sheet on phones, popover on desktop (designed in the canvas).
- Debounce with TanStack Pacer.
- Needs a design for the global search surface (results list mixing tasks and notes).

## Known issues
- Tasks search matches titles only; notes linked to a task are not found from the Tasks page.
- `/` shortcut missing.

## How to test
1. Seed tasks "Buy milk" and "Call mum", `open(page, '/tasks')`, fill `getByRole('searchbox', { name: 'Search tasks' })` "milk": only "Buy milk" shows.
2. Fill "zzz": `No results for "zzz"` with the search illustration.
3. `/notes`: seed a note whose body contains "invoice", search "invoice": the card shows.
4. `api(page, '/search?q=milk')` returns the task in `tasks`; `api(page, '/search?q=')` is 400.
