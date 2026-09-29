# Honeylist

Tasks, notes and a scratchpad in one calm place. Built with AI for **HNG Internship 15, Stage 1**.

**Live:** https://honeylist.vercel.app

Open it and start typing: there's no sign up. Every browser gets a private guest account.

## Features

- **Tasks:** create, view, edit, complete and delete, each with Undo. Tasks have start and due dates, a time range, priority, status (todo, in progress, done) and subtasks. Ticking the first subtask starts the task.
- **Quick add:** type `Call mum tomorrow 5pm #personal !high` and press Enter. Dates, times, folders and priority turn into chips you can remove.
- **Notes:** a markdown editor with live checklists, autosave, pin, colors, search, and links to tasks. A task's notes show in its detail.
- **Scratchpad:** one always-there note (press `N`), where any line becomes a task or a note with one click.
- **Folders:** categories styled as pastel folder cards. Deleting a folder moves its tasks to Inbox.
- **Smart Home:** a greeting, a week date strip, bold Today cards, an overdue banner, folders and recent notes. Sections only appear once you have something in them.
- **Responsive:** a bottom bar on phones, a rail on tablets, and a sidebar plus task detail pane on desktop. Dark and light themes.
- **Feel:** toasts with Undo, quiet synthesized sounds (can be turned off), confetti when the day is done, skeleton loading, empty-state illustrations and keyboard shortcuts (`?`).
- **Profile:** name, theme, sounds, export as JSON, and delete all data.

## API

Every endpoint needs a session and only touches the caller's own data.

| Method             | Path                      | What                                                  |
| ------------------ | ------------------------- | ----------------------------------------------------- |
| GET, POST          | `/api/tasks`              | List (filters: `status`, `categoryId`, `q`) or create |
| GET, PATCH, DELETE | `/api/tasks/:id`          | Read, update, delete                                  |
| POST               | `/api/tasks/:id/subtasks` | Add a subtask                                         |
| PATCH, DELETE      | `/api/subtasks/:id`       | Tick, rename, delete a subtask                        |
| GET, POST          | `/api/notes`              | List (`q`, `taskId`) or create                        |
| GET, PATCH, DELETE | `/api/notes/:id`          | Read, update, delete                                  |
| GET, PUT           | `/api/scratchpad`         | Read or save the scratchpad                           |
| GET, POST          | `/api/categories`         | List (seeds Personal, Work, Study) or create          |
| PATCH, DELETE      | `/api/categories/:id`     | Rename, recolor, delete (tasks move to Inbox)         |
| GET, PATCH         | `/api/me`                 | Preferences                                           |
| GET, DELETE        | `/api/me/data`            | Export or delete all data                             |
| GET                | `/api/search?q=`          | Search tasks and notes                                |
| GET, POST          | `/api/auth/*`             | Better Auth (guest sessions)                          |

## Tests

```
npm test
```

There are 30 tests. Every endpoint is checked for the success path, invalid input (400), a missing session (401) and another user's data (404). The quick-add parser and the date grouping are unit tested too. The tests run against an in-memory Postgres (PGlite), so no setup is needed.

## Run locally

```
npm install
npm run dev
```

With no `DATABASE_URL`, the app uses an in-process Postgres (PGlite), so it runs with zero setup.

## Deploy (Vercel + Neon)

1. Push to GitHub and import the repo in Vercel. The framework is detected as TanStack Start.
2. In the Vercel project, open **Storage → Create → Neon (Postgres)** and connect it. This sets `DATABASE_URL`.
3. Add the environment variables `BETTER_AUTH_SECRET` (any random 32+ characters) and `BETTER_AUTH_URL` (your production URL).
4. Deploy. The tables are created automatically on the first request.

## Stack

TanStack Start, Router, Query, Store, Form, Hotkeys and Pacer; Tailwind CSS v4 with the Zen Todo design system; Drizzle ORM on Neon Postgres; Better Auth; Zod; Vitest; lucide-react.

See `AGENTS.md` for the rules AI agents follow in this repo.
