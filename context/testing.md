# Testing

## Run the app locally

```
npm install
npm run dev          # http://localhost:3000
```

- With `DATABASE_URL` empty the server uses **PGlite** in process (`src/server/db.ts`). It is in memory, so data resets when the dev server restarts. Set `PGLITE_DIR=./.pglite` to keep it on disk.
- Tables are created on the first API request (`ensureSchema()` runs a DDL string; no migrations).
- `BETTER_AUTH_SECRET` falls back to a dev only value locally.
- Every browser (and every Playwright browser context) gets its own guest account on first load (`ensureGuest()` in `src/lib/auth-client.ts`), so tests are isolated by default.
- Writes are rate limited to **120 per minute per user** (`src/server/http.ts`); keep seeding small or spread it across contexts.

## Required checks

```
npm run typecheck
npm run lint
npm test             # Vitest
npm run build
```

CI (`.github/workflows/ci.yml`) runs typecheck, test and build on push. Lint and e2e are not in CI yet.

## Vitest suites (40 tests)

| File | Covers |
| --- | --- |
| `tests/api.test.ts` | Every endpoint without a session is 401; tasks, subtasks, notes and scratchpad, categories, habits and check ins (7 tests), profile, search and data: success, 400 on bad input, 404 for another user's record. Runs handlers directly on a fresh PGlite per test (`resetDbForTests`) with a header based user resolver (`setUserResolver`). |
| `tests/parse.test.ts` (7) | Quick add parser: dates, weekdays, times and ranges, `due`, `#folder`, `!priority`. |
| `tests/dates.test.ts` (8) | Grouping (Overdue, Today, Tomorrow, This week, Later, Inbox, Completed) and date helpers. |
| `tests/markdown.test.ts` (10) | `checklistLines`, `toggleChecklist`, `continueList`, `togglePrefix`. |
| `tests/streaks.test.ts` (24) | Habit streak maths in `src/lib/streaks.ts`: ISO weeks, daily runs, today still open, gaps keep best and total, weekday habits skip weekends, specific days, x per week counts per ISO week, goal "Day X of Y", milestones 3/7/21, week dots, frequency labels. |

Rule (AGENTS.md): every endpoint you add or change gets tests for success, 400, 401 and 404.

## Playwright e2e plan (for Claude Code)

Playwright is **not installed** yet. Suggested setup:

```
npm i -D @playwright/test @axe-core/playwright
npx playwright install chromium webkit
```

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:3000', reducedMotion: 'reduce', trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true },
  projects: [
    { name: 'phone', use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
    { name: 'tablet', use: { viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
})
```

### Boot helper: wait for the splash

The splash (`.splash`, role `status`, name "Loading Honeylist") covers the app until the guest session is ready **and** a honey drop cycle has finished. With `reducedMotion: 'reduce'` it leaves after about 900 ms plus a 450 ms fade; with motion it can take up to 6 s.

```ts
async function open(page, path = '/') {
  await page.goto(path)
  await expect(page.locator('.splash')).toHaveCount(0, { timeout: 10_000 })
}
```

### Themes

The theme lives in prefs and is applied to `<html data-theme="dark|light">`. `useTheme` reapplies the server value after load, so set it through the API, then reload:

```ts
await api(page, '/me', 'PATCH', { theme: 'light' })
await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
```

Run every visual flow in both themes.

### API helper (seed and assert)

The session cookie is same origin, so call the REST API from the page:

```ts
async function api(page, path, method = 'GET', body?) {
  return page.evaluate(async ([path, method, body]) => {
    const r = await fetch('/api' + path, { method, headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body) })
    return { status: r.status, json: r.status === 204 ? null : await r.json() }
  }, [path, method, body] as const)
}
// seed: await api(page, '/tasks', 'POST', { title: 'Read 20 pages', startDate: today })
```

Endpoints: `/tasks`, `/tasks/:id`, `/tasks/:id/subtasks`, `/subtasks/:id`, `/notes`, `/notes/:id`, `/scratchpad` (GET, PUT), `/categories`, `/categories/:id`, `/me`, `/me/data`, `/search?q=`. Bodies are strict (unknown keys are 400). Dates are `YYYY-MM-DD` local, times `HH:MM`.

### Selector notes

- Prefer roles and labels; ids that exist: `#quick-add`, `#note-title`, `#note-body`, `#note-task`, `#scratch-body`, `#main`, `#folders-h`, `#g-today` (and `#g-overdue`, `#g-tomorrow`, `#g-week`, `#g-later`, `#g-inbox`).
- Two navs are both labelled "Main" (sidebar and phone bar; one hidden by CSS). At `/tasks/$id` the task detail renders twice (desktop pane and mobile copy). Always scope to visible: `page.getByRole('link', { name: 'Tasks' }).filter({ visible: true })`.
- `getByLabel('Add a task')` matches both the quick add input and the phone bar + button. Use `#quick-add` for the input and `getByRole('button', { name: 'Add a task' })` for the + button.
- The note editor has two "Delete note" buttons (header icon and footer button). Use `.first()`.
- Toasts: `.zn-toast` (role `status`, or `alert` for errors); action `getByRole('button', { name: 'Undo' })`; close `Dismiss`.
- Dialogs: `getByRole('dialog', { name: 'New task' })`, `getByRole('alertdialog', { name: /Delete/ })`.
- Add `@axe-core/playwright` on every route: zero serious or critical violations.

### Flow checklist

Run each at phone, tablet and desktop, dark and light. Details and exact steps live in each feature file under "How to test".

- [ ] Boot: splash shows then leaves; guest session exists (`GET /api/me` is 200); skeletons, never spinners, on first load.
- [ ] Home: first visit empty state; quick add creates a task; the date wheel appears once a task has a date; overdue banner; max 6 tasks plus "See all"; Recent notes; Folders row; phone header Profile link. ([home](features/home.md))
- [ ] Quick add: parsing chips, remove a chip, `#newfolder` creates a folder, full form button. ([quick-add](features/quick-add.md))
- [ ] Tasks: groups, filters, search, complete with Undo, delete with Undo, duplicate, start, Completed toggle. ([tasks](features/tasks.md))
- [ ] Task detail: title edit, status, dates, folder, priority, subtasks (tick starts the task), notes. ([task-detail](features/task-detail.md))
- [ ] Notes: create, title and body autosave, preview, checklist tick, pin, color, link task, duplicate, delete with Undo from editor and card, search. ([notes](features/notes.md))
- [ ] Scratchpad: N opens, autosave, Make task, Make note. ([scratchpad](features/scratchpad.md))
- [ ] Folders: create, open, edit, delete with confirm (tasks move to Inbox). ([folders](features/folders.md))
- [ ] Habits: empty `/habits` shows the habits illustration and "Add a habit"; create "Read 10 pages" (Book icon, 21 days) in the dialog; check in pops and shows "Day 1 of 21"; tap again undoes; seed 2 past days by API then check in: "3 day streak" flame toast; open detail: stats, "Day X of 21" bar, 12 week heatmap fits at 390; Edit, Archive (then Restore from "Archived habits"), Delete with Undo; Home shows the Habits row and "+ Add a habit"; nav shows Habits (phone bar: Home, Tasks, +, Notes, Habits). Set the theme with `PATCH /api/me {theme}` then reload, since the app re-applies it. ([habits](features/habits.md))
- [ ] Profile: name, theme, sounds, export JSON, delete all with typed DELETE. ([profile-settings](features/profile-settings.md))
- [ ] Shortcuts on desktop: Q, C, N, ?, G H, G T, G N, G B (habits), Esc; ignored while typing. ([keyboard-shortcuts](features/keyboard-shortcuts.md))
- [ ] Feedback: toasts stack max 3, countdown, errors persist; confetti only when the last task of today is done. ([feedback](features/feedback-toasts-sounds-confetti.md))
- [ ] Phone: bottom nav hides on scroll down and returns on scroll up; the keyboard does not pop up when opening pages or non typing dialogs.
- [ ] 404: `/nope` shows "That page has let go" and "Back home". ([splash-and-logo](features/splash-and-logo.md))
- [ ] Security smoke: a second browser context cannot read the first one's task id (404).
