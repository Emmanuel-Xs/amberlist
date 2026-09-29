# PRD (raw, verbatim export)

Source: Claude Doc "Amberlist PRD" (rev 19), exported as markdown on 2026-09-29.
- Artifact URL: https://claude.ai/artifact/BM7ZxCREPS5oyh8zQJb7hK
- Claude Docs id: 53ca4f4c-1deb-4856-9be2-f8a7c7e08e7a (tab 306cb970-1ff6), also https://claude.ai/code/artifact/53ca4f4c-1deb-4856-9be2-f8a7c7e08e7a
- Written 2026-09-29 ~16:45 WAT from the "grill me" session. Product was later renamed Honeylist.
- Export notes: date chip and @mention kept as text; one embedded diagram ("guest to Google account flow") was dropped by the exporter (placeholder below).
- Deviations since: see decisions-and-backlog.md (e.g. `/settings` shipped as `/profile`; phone bottom bar has no Habits tab; Undo toasts instead of confirms was later reversed by the user, who now wants confirmations for destructive actions).

---

# Amberlist PRD

Sep 29, 2026 · @Emmanuel

## Overview

Amberlist is a calm task, notes and habits app for students and young professionals who juggle study, work and personal life. It keeps tasks, the notes behind them and daily habits in one place, and it works equally well on a phone, a tablet and a laptop.

**The one job:** help people see what matters today and capture thoughts fast, without the app itself becoming another thing to manage.

**Product principles**

1. **Simple on the surface, power underneath.** Every screen works with zero setup. Advanced options hide behind "More options".
2. **Home grows with the user.** Sections appear only once the user has something to put in them.
3. **Never interrupt the flow.** No pop ups while typing, one nudge per session at most, Undo instead of confirmations.
4. **Capture in seconds.** Quick add and the scratchpad are one tap or one key away, everywhere.
5. **Desktop is first class,** not a stretched phone layout.

**Success for Stage 1:** a live URL where a grader can add, edit, complete and delete tasks, write notes, use categories, and see it hold up on phone and desktop, backed by tested endpoints and an AGENTS.md.

*Amberlist is a working name.*

## Scope and phasing

Stage 1 ships tonight (29 Sep, 11:59pm WAT); everything else is specced here so the coding agent builds in the right order.

| Phase | Ships | Contents |
| --- | --- | --- |
| Stage 1 | Tonight | Guest ID, tasks (quick add with parsing, start and due dates, status, priority, subtasks), notes and scratchpad, categories as folders, progressive Home, responsive shell on all screens, both themes, endpoint tests, AGENTS.md, deployed on Vercel |
| Phase 2 | After Stage 1 | Habits, repeating tasks, Google sign in with the save nudges and merge prompt, reminders, welcome screen, just in time tips, keyboard shortcut sheet |
| Phase 3 | Later | AI task breakdown, AI turn note into tasks, polish, PWA install |

**Out of scope for now:** collaboration and sharing, attachments and images, note version history, nested folders, tags, assignees, native mobile apps.

**If time runs short tonight,** cut in this order: subtasks, priority, the DateStrip (keep Today and Tomorrow groups), note checklists. Never cut: task CRUD, notes, one extra feature (categories), tests, deploy.

## Identity and saving data

Everyone starts as a guest with no sign up; Google sign in is offered later to save their data across devices.

- **Guest (Stage 1):** on first visit Better Auth's anonymous plugin creates a guest user and a session cookie. Every row in the database belongs to that user ID, so each browser's data is private.
- **Profile button (Phase 2):** the avatar in the top right always shows a Guest badge and a "Save your data with Google" action.
- **Nudges (Phase 2):** a dismissible card on Home only, never mid task.
  - First nudge: after the user creates their 2nd task.
  - Second nudge: after 3 separate days of use.
  - Stops for good once they sign in.
- **Linking:** signing in with Google upgrades the guest user in place, keeping all their data.
- **Merge prompt:** if that Google account already has data (for example from another device), ask: "This device has 4 tasks and 2 notes. Keep them in your account?" with **Merge** (default) and **Discard**. Merge moves every guest row to the account, then deletes the guest user.
- **Clearing cookies as a guest loses data.** The nudge copy says so plainly.

&#91;embedded content: guest to Google account flow\]

A guest only meets a choice when the Google account already holds data from another device.

## Tasks

A task needs only a title; every other field is optional and hidden until asked for.

| Field | Type | Notes |
| --- | --- | --- |
| Title | text, 1 to 200 chars | Required |
| Category | one category or none | None means it lives in Inbox |
| Start date | date, optional | When you plan to work on it. Drives Today, Tomorrow and the DateStrip |
| Time range | start and end time, optional | Shown as "10:00 to 10:30" |
| Due date | date, optional | The hard deadline. Drives "Due tomorrow" and "Overdue" labels |
| Priority | low, medium, high | Default medium, shown only when high or low |
| Status | todo, in progress, done | In progress is set automatically when the first subtask is ticked, or by a Start button |
| Subtasks | ordered checklist | Progress shows on the card as "2 of 5" and a bar |
| Completed at | timestamp | Set when done, cleared when undone |
| Remind me | on or off | Phase 2 |
| Repeat | none, daily, weekdays, weekly, monthly | Phase 2. Completing creates the next one |
| Notes | linked notes | See Notes |

**Grouping** on the Tasks page and Home: Overdue, Today, Tomorrow, This week, Later, Inbox (no dates), Completed (collapsed). A task shows on a day when that day is on or after its start date and it is not done, so long running tasks stay visible every day until finished, with a progress bar and "Day 4 of 21" when both dates exist.

**Quick add:** one input. Type a title and press Enter to create. Light parsing turns parts of the text into chips the user can tap to remove:

- `today`, `tomorrow`, weekday names, `next week`, `12 Oct` set the start date
- `5pm`, `17:00`, `10-10:30` set the time
- `due fri` sets the due date
- `#study` sets the category (creates it if new, after a confirm chip)
- `!high`, `!low` set the priority

The full Create task form (sheet on phones, dialog from 768px) holds every field for people who want it.

**Actions:** complete (tap the circle), open, edit, duplicate, move to category, delete. Complete and delete show a toast with Undo for 4 seconds instead of a confirm dialog. Completed tasks slide into the Completed group.

## Notes and scratchpad

Notes are one feature in two places: a note can stand alone on the Notes page or be attached to a task, where it shows in the task's detail.

- **Title and markdown body,** with an Edit and Preview toggle. Supports headings, bold, italic, lists, links and code. No raw HTML.
- **Checklists:** `- [ ]` lines render as tickable boxes, and ticking one updates the markdown.
- **Autosave** while typing (debounced 600ms) with a quiet "Saving" then "Saved" label. No save button.
- **Pin** to the top of the Notes page.
- **Color** from the five pastels, shown as the card's ground.
- **Attach** to a task, detach, or create a note from inside a task.
- **Search** across titles and bodies, shared with task search.
- **Scratchpad:** one permanent quick note per user, opened from the sidebar, the phone header, or the `N` key on desktop. It opens as a side panel on desktop and a bottom sheet on phones. Hovering a line (or long pressing on touch) shows **Make task** and **Make note**; the line moves out of the scratchpad when converted.

**Out for now:** images and attachments, sharing, version history, note folders.

## Categories as folders

Categories group tasks, habits and notes, and they look like desktop folders so their purpose is obvious.

- New users get three defaults: **Personal, Work, Study.** They stay quiet in the sidebar until used, and can be renamed or deleted.
- Creating one takes a **name, a pastel color and an icon.** Nothing else.
- The **folder card** has a tab on top, the pastel ground, the icon, the name, a task count and a small "3 of 8 done" line.
- Opening a folder shows its tasks (grouped as on the Tasks page), then its habits and notes.
- **Deleting** asks once, then moves its tasks, habits and notes to Inbox. Nothing is deleted with it.
- **One level only,** no folders in folders.
- Layout: a horizontal scroll row on phones, a 3 to 4 column grid on tablets, a 4 to 6 column grid on desktop. On desktop the sidebar also lists folders like a file tree.

## Habits (Phase 2)

A habit is a routine you repeat and track over time; unlike a task it is never "done", it builds a streak.

- **Fields:** name, icon, optional category, frequency, goal, optional reminder time.
- **Frequency:** daily, specific weekdays (Mon, Wed, Fri), or X times a week.
- **Goal:** a set length ("21 days") or ongoing.
- **Check in:** one tap per scheduled day, from Home's Habits row or the Habits page. Tapping again the same day undoes it.
- **Stats:** current streak, best streak, total check ins, "Day 19 of 21" with a progress bar, and a small calendar heatmap on the detail page.
- **Missing a day** breaks the current streak but keeps the total and best streak. The copy never scolds.
- **Habits vs repeating tasks:** habits build routines and have streaks; repeating tasks ("Pay rent, monthly") are obligations that simply come back when completed.

## Pages, navigation and onboarding

Five sections, one quick add everywhere, and a Home that only shows what the user has started using.

**Routes**

| Route | Page |
| --- | --- |
| `/` | Home dashboard |
| `/tasks` and `/tasks/$id` | All tasks, and task detail (a full page below 1024px, the right pane above) |
| `/notes` and `/notes/$id` | Notes grid, and note editor |
| `/habits` and `/habits/$id` | Habits (Phase 2) |
| `/folders` and `/folders/$id` | Folder grid, and one folder's contents |
| `/settings` | Profile, theme, save data, shortcuts |

**Navigation**

- **Phone:** bottom bar with Home, Tasks, a center + (quick add), Notes, Habits. Folders are reached from Home and the Tasks filters. Profile is the avatar in the header.
- **Tablet (768px up):** left rail with all five sections.
- **Desktop (1024px up):** sidebar with the five sections, the folder tree, and the Scratchpad pinned at the bottom. Profile avatar top right.

**Progressive Home**

| Section | Shows when |
| --- | --- |
| Greeting and quick add | Always |
| Hint: "Add your first task. Try 'Read 20 pages tomorrow'" | Until the first task exists |
| DateStrip and big Today cards | Once any task has a date |
| Overdue banner | Only when something is overdue |
| Habits row | After the first habit |
| Folders grid | Once a task is in a category, or a folder is created |
| Recent notes | After the first note |
| Save your data nudge | Per the nudge rules (Phase 2) |

Small "+ Add a habit" and "+ New folder" links at the foot of Home let people discover features without clutter.

**Onboarding (Phase 2)**

- One welcome screen on first visit: "What should we call you?" plus a dark or light preview to pick. Skippable. Then straight to Home. No tour, no carousel.
- Just in time tips, each shown once, inline and dismissible: quick add syntax on first use, `- [ ]` on the first note, streak rules on the first check in, keyboard shortcuts after a few desktop sessions.

**Don't disturb rules**

- Nothing appears while the user is typing or editing.
- Nudges and tips appear on Home only, at most one per session.
- No modals except destructive confirms (delete folder, merge prompt).
- Toasts auto dismiss after 4 seconds and offer Undo.
- Notification permission is asked only when "Remind me" is first switched on.

**Keyboard shortcuts (desktop, TanStack Hotkeys):** `Q` quick add, `N` scratchpad, `/` search, `G` then `H`, `T`, `N`, `F` to jump to a section, `Esc` closes panels, `?` shows the list. Ignored while typing in a field.

## Design and responsive layout

The look follows the Zen Todo design system (charcoal surfaces, one amber accent, pastel folders, Poppins, pill shapes), dark by default with a matching light theme.

**Changes to the design system from this PRD** (to be made in the design pass before code):

- **Folder cards** replace the square category tiles: a tab on top, pastel ground, icon, name, count and progress.
- **Bold Today cards** on Home, inspired by the second reference: larger cards with a colored half, the task title in display type, time and progress. The compact task rows stay for the Tasks page and folder views.
- **Quick add bar** with parsed chips, **Scratchpad panel**, **Note card** and **Note editor**, **Habit row** with one tap check in, **Overdue banner**, **Nudge card**, **Toast with Undo**, **Empty state hint**.

**Layout by screen**

| Width | Nav | Main | Detail |
| --- | --- | --- | --- |
| Phone, under 768px | Bottom bar, fixed, safe area aware | One column. Folders and filter chips scroll sideways | Own route, full screen |
| Tablet, 768 to 1023px | Left rail | One wider column. Folder grid 3 to 4 across. Week fits in the DateStrip | Own route, or a right sheet |
| Desktop, 1024px up | Sidebar with folder tree and Scratchpad | Middle column: list or dashboard | Right pane always visible (380px) for task detail and its notes |
| Wide, 1280px up | Sidebar | Content stops growing at 1280px and centers | Right pane |

Desktop Home uses the width: Today cards in a 2 column grid, the Habits row and Recent notes side by side, folders in a 4 to 6 column grid.

**Test widths:** 360, 390, 768, 1024, 1280 and 1440px, in both themes.

## Accessibility

The target is WCAG 2.2 AA on every screen, in both themes.

- **Contrast:** text 4.5:1 (3:1 at 24px or bold 19px), and control borders, icons and focus rings 3:1. The design system's token pairs are already checked; no raw colors in code.
- **Keyboard:** every action works without a mouse, in a logical tab order. A "Skip to content" link comes first. Dialogs and sheets trap focus and return it on close. `Esc` closes them.
- **Focus:** a visible 2px `ring` outline with 2px offset on `:focus-visible`, never removed.
- **Semantics:** real buttons and links, one `h1` per page, landmarks (`nav`, `main`, `aside`), labelled inputs. The task checkbox is `role="checkbox"` with `aria-checked` and a label naming the task. Progress bars use `role="progressbar"` with values.
- **Announcements:** toasts and "Saved" use a polite live region, so a screen reader hears "Task completed. Undo available".
- **Status never by color alone:** overdue, priority and done all carry text or an icon.
- **Touch:** targets at least 44 by 44px, with spacing between them.
- **Zoom and text:** layouts hold at 200% zoom and 320px width. Inputs are at least 16px so iOS doesn't zoom on focus.
- **Forms:** errors sit under the field in text, linked with `aria-describedby`.
- **Language:** `lang="en"` on the html element; dates and times formatted with `Intl`.
- **Checks:** axe in Playwright on every page, plus a manual keyboard and VoiceOver pass before submitting.

## Motion

Motion confirms what happened and never slows the user down; nothing runs longer than 300ms.

| Moment | Motion | Duration |
| --- | --- | --- |
| Hover and press | Background shift, press scales to 0.98 | 150ms |
| Completing a task | Circle fills amber with a check draw, then the row slides into Completed | 200ms then 250ms |
| Selecting a date | Pill grows taller and fills amber | 180ms |
| Sheets and panels | Slide in from their edge with a fade | 250ms |
| Dialogs | Fade and scale from 0.96 | 200ms |
| Toasts | Slide up from the bottom, fade out | 200ms |
| Page changes | View Transitions API crossfade where supported | 200ms |
| Habit check in | Small pop on the icon, streak number ticks up | 250ms |

Easing is ease out for entering and ease in for leaving. With `prefers-reduced-motion: reduce`, all movement becomes an instant change or a plain fade. Nothing loops, and there is no parallax or autoplay.

## Security and privacy

Every request is tied to a user, and no user can ever read or change another user's data.

- **Authorization in every server function:** read the session first. No session means a 401. Every query filters by `userId` from the session, never from the client. Fetching someone else's ID returns 404, not 403, so IDs don't leak.
- **Validation:** every server function input goes through a Zod schema with length limits (title 200, note body 50,000, category name 40). Unknown fields are rejected.
- **Markdown:** render with a sanitizer (no raw HTML, no `javascript:` links; external links get `rel="noopener noreferrer"`).
- **Sessions:** Better Auth cookies are `HttpOnly`, `Secure`, `SameSite=Lax`. Mutations use POST server functions with Better Auth's CSRF protection and origin checks.
- **Headers:** a Content Security Policy (self, Google Fonts, Google OAuth), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'`, HSTS.
- **Rate limits:** Better Auth's built in limiter on auth routes, plus a simple per user limit on writes (for example 60 a minute) so a script can't flood the database.
- **Secrets:** `DATABASE_URL`, `BETTER_AUTH_SECRET` and the Google keys live in Vercel env vars only. `.env` is gitignored, with a committed `.env.example`.
- **Guest cleanup:** guest users with no activity for 90 days are deleted by a scheduled job (Phase 2).
- **Privacy:** no analytics or trackers in Stage 1. A short privacy note in Settings says what is stored and offers **Delete all my data**.
- **Dependencies:** lockfile committed, `npm audit` in CI.

## SEO, performance and PWA

The app itself is private per user, so SEO is about the public shell: the landing experience, the share preview and correct indexing rules.

**SEO**

- A real title and description per route through TanStack Start's `head()`: "Amberlist: tasks, notes and habits in one calm place".
- Open Graph and Twitter card tags with a 1200 by 630 image, so the live URL looks good when shared on Telegram and X.
- Favicon set, `apple-touch-icon`, `theme-color` for both themes.
- `robots.txt` allows `/` and disallows app data routes. `sitemap.xml` lists `/` only.
- Server rendering so the first paint has real content, not a blank shell. JSON-LD `WebApplication` on `/`.

**Performance budgets**

| Metric | Target |
| --- | --- |
| Largest Contentful Paint | under 2.5s on a mid range phone over 4G |
| Interaction to Next Paint | under 200ms |
| Cumulative Layout Shift | under 0.1 |
| JavaScript on first load | under 200KB gzipped |
| Lighthouse (performance, accessibility, best practices, SEO) | 90 or more each |

How: route based code splitting, fonts with `display=swap` and preconnect, optimistic updates so ticks feel instant, Query caching, skeletons instead of spinners, and no layout shift from late content.

**PWA (Phase 3):** web app manifest, installable, offline read of cached data with a clear "You're offline" banner.

## Tech stack and architecture

One TanStack Start app on Vercel: server functions are the API, Postgres on Neon is the store, and Better Auth handles guests and Google.

| Layer | Choice | Job |
| --- | --- | --- |
| Framework | TanStack Start + Router | SSR, file routes, server functions, type safe links |
| Server state | TanStack Query | Caching, optimistic updates, Undo |
| Client state | TanStack Store | Scratchpad open, quick add draft, sidebar, seen tips |
| Forms | TanStack Form + Zod | Task, note, category, habit forms; same schemas on the server |
| Shortcuts | TanStack Hotkeys | Keyboard shortcuts, off while typing |
| Timing | TanStack Pacer | Debounced autosave and search |
| Devtools | TanStack Devtools | Query, Router, Hotkeys panels in development |
| UI | Tailwind v4 + shadcn/ui + lucide-react | Zen Todo tokens mapped to shadcn variables |
| Auth | Better Auth, anonymous plugin, Google provider | Guest sessions, linking to Google |
| Database | Neon Postgres + Drizzle ORM + drizzle-kit migrations | Storage |
| Markdown | react-markdown + remark-gfm + rehype-sanitize | Notes rendering and checklists |
| Tests | Vitest, Playwright, axe | Unit, endpoint, end to end, accessibility |
| Hosting | Vercel | Deploys from GitHub, preview per PR |

**Data model** (every table has `id` uuid, `userId`, `createdAt`, `updatedAt`; Better Auth owns `user`, `session`, `account`)

| Table | Key fields |
| --- | --- |
| `category` | name, color (lavender, butter, mint, peach, sky), icon, position |
| `task` | title, categoryId, startDate, startTime, endTime, dueDate, priority, status, completedAt, remind, repeatRule, position |
| `subtask` | taskId, title, done, position |
| `note` | title, body (markdown), color, pinned, taskId (nullable), isScratchpad |
| `habit` (Phase 2) | name, icon, categoryId, frequency, daysOfWeek, timesPerWeek, goalDays, reminderTime, archivedAt |
| `habitCheckin` (Phase 2) | habitId, date (unique per habit and date) |
| `userPrefs` | displayName, theme, seenTips, nudgeState |

**Server functions** (grouped as the API the tests cover)

- Tasks: `listTasks(filters)`, `getTask(id)`, `createTask`, `updateTask`, `setTaskStatus`, `deleteTask`, `reorderTasks`
- Subtasks: `addSubtask`, `updateSubtask`, `deleteSubtask`
- Notes: `listNotes(query)`, `getNote`, `createNote`, `updateNote`, `deleteNote`, `getScratchpad`, `convertScratchpadLine(to: task or note)`
- Categories: `listCategories`, `createCategory`, `updateCategory`, `deleteCategory` (moves contents to Inbox)
- Search: `search(q)` across tasks and notes
- Habits (Phase 2): `listHabits`, `createHabit`, `updateHabit`, `deleteHabit`, `toggleCheckin(habitId, date)`
- Account (Phase 2): `mergeGuestData(choice)`, `deleteAllMyData`

For the grader's "API endpoints", also expose thin REST server routes under `/api/tasks`, `/api/notes` and `/api/categories` that call the same functions, so they can be hit with curl and tested directly.

## Testing and AGENTS.md

Every endpoint gets tests before it counts as done, and AGENTS.md makes the coding agent enforce that on itself.

**Tests**

- **Endpoint tests (Vitest):** for every server function and `/api` route, test the happy path, validation failure (400), no session (401), and another user's record (404). Run against a test Postgres (a Neon branch or local Docker).
- **Unit tests:** quick add parser, date grouping (Overdue, Today, Tomorrow and so on), streak maths, markdown checklist toggling.
- **End to end (Playwright):** create, complete with Undo, edit, delete a task; write a note and attach it; create a folder and move a task into it. Run at 390px and 1280px widths.
- **Accessibility:** axe scan on every route in Playwright; zero serious violations.
- **CI:** GitHub Actions runs typecheck, lint, unit, endpoint and e2e tests on every push. Vercel only promotes a green build.

**AGENTS.md must include**

1. The stack and folder structure, and "use only these libraries".
2. "Write tests for every endpoint you create and run them. A task is not done until tests pass."
3. "Every server function checks the session and filters by userId from the session. Validate all input with Zod."
4. "Use only theme tokens (`bg-background`, `bg-primary`, `text-brand-ink` and so on). No raw hex, no Tailwind palette colors."
5. "Mobile first. Check 360, 768 and 1280px widths and both themes."
6. "Accessibility: labelled controls, visible focus, 44px targets, no color only status."
7. "TypeScript strict, no `any`, no unused code. Small components, one per file."
8. "Follow the don't disturb rules: no modals except destructive confirms, Undo toasts."
9. "Commit small with clear messages. Never commit secrets."
10. "Before finishing: run typecheck, lint and all tests, and report the results."

## AI features (Phase 3)

AI waits until the core app is live; when added it runs only when the user taps a button.

- **Break down task:** suggests 3 to 7 subtasks for a task. The user reviews them and taps to add; nothing is added automatically.
- **Turn note into tasks:** reads a note or the scratchpad and proposes tasks with dates and categories, using the same review step.
- **Provider:** a free tier first (Groq is fast and needs no card; Gemini Flash is the backup), through the Vercel AI SDK so switching or removing it is a one line change.
- **Limits:** 20 AI calls per user per day, throttled with TanStack Pacer, and a clear message when the limit is reached.
- **Privacy:** only the selected task or note is sent, never the whole account.

## Stage 1 checklist and open questions

Stage 1 is done when every box below is ticked on the live URL.

- [ ] Guest session created on first visit; data private per browser
- [ ] Tasks: quick add with parsing, create form, view, edit, complete with Undo, delete with Undo
- [ ] Start date, due date, status, priority, subtasks
- [ ] Grouping: Overdue, Today, Tomorrow, This week, Later, Inbox, Completed
- [ ] Notes: markdown, autosave, pin, color, checklists, attach to task, search
- [ ] Scratchpad with Make task and Make note
- [ ] Categories as folders with defaults, create, rename, delete to Inbox
- [ ] Progressive Home with the empty state hint
- [ ] Responsive at 360, 768, 1024 and 1440px; both themes
- [ ] Accessibility: keyboard pass, axe clean, focus visible
- [ ] Security: session check and Zod on every function, CSP headers
- [ ] SEO: titles, descriptions, OG image, robots.txt
- [ ] Endpoint tests passing in CI
- [ ] AGENTS.md committed
- [ ] Deployed on Vercel and tested on the live URL
- [ ] Submitted on Zedu before 11:59pm

**Open questions**

- Final product name: Amberlist is a working name.
- Does the HNG team repo need a specific structure or branch before submission?
- Neon or Turso: Neon assumed for its Vercel integration.
