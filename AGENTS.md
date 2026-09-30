# AGENTS.md

Rules for any AI coding agent working in this repository. Read this file fully before changing code, and follow it on every task.

## What this is

Honeylist is a calm task, notes and scratchpad app (HNG Internship 15, Stage 1). Guests use it without signing up; each browser gets an anonymous account. The product spec lives in the PRD; the look lives in the Zen Todo design system.

## Context folder (read first)

Start every task with [`context/README.md`](context/README.md): it gives the reading order for the backlog, decisions, design system, per feature notes and the Playwright test plan.

- **Design approval:** any UI change that departs from the approved design (Zen Todo DS plus the Amberlist Screens canvas) needs Emmanuel's approval first, shown as a design. Pending proposals are listed in `context/design-system.md`.
- **shadcn check:** before creating a UI component, check whether shadcn/ui has one and use it styled with our tokens. Adopted 2026-09-30 (D28): Radix based shadcn primitives styled with our own `zn-` classes and tokens, so nothing changes visually. `MenuButton` is on `DropdownMenu`; `cn` lives in `src/lib/utils.ts`; `components.json` is set for `npx shadcn add`. Never let a shadcn default style override the Zen design.
- **Keep docs updated:** update the relevant files in `context/` (feature status, backlog, decisions, changelog) in the same commit as the change. Never edit `context/_raw/`.

## Stack (use only these)

- **TanStack Start** (React 19, TypeScript, Vite) with file routes in `src/routes`.
- **TanStack Query** for all server data, **TanStack Store** for UI state (`src/lib/store.ts`), **TanStack Form** for forms, **TanStack Hotkeys** for shortcuts, **TanStack Pacer** for debounced autosave.
- **Tailwind CSS v4** plus the design system CSS in `src/tokens.css` and `src/zen.css`.
- **Drizzle ORM** on **Postgres**: Neon in production (`DATABASE_URL`), PGlite in-process when it is unset (local dev and tests).
- **Better Auth** with the anonymous plugin (guest sessions); Google sign in is Phase 2.
- **Zod** for every input. **Vitest** for tests. **lucide-react** for icons.

Do not add another UI kit, state library, ORM or CSS framework. Ask first if something truly needs a new dependency.

## Folder structure

```
src/
  routes/            pages (index, tasks, notes, folders, profile) and api/* server routes
  server/            schema.ts, db.ts, auth.ts, validation.ts (Zod), services.ts (queries), handlers.ts, http.ts
  components/        app pieces: AppShell, TasksPage, TaskDetail, QuickAdd, CreateTask, Scratchpad, Cards
  ui/                design system components (zen.tsx) and icons.tsx
  lib/               api.ts (fetch + Query hooks), dates.ts, parse.ts, store.ts, feedback.ts, auth-client.ts
tests/               Vitest: api.test.ts (every endpoint), parse.test.ts, dates.test.ts
```

Business logic goes in `src/server/services.ts`. Route files stay thin: they only wire a handler from `src/server/handlers.ts`.

## Testing rules (required)

1. **Write tests for every API endpoint you create or change, and run them.** A task is not done until `npm test` passes.
2. Each endpoint test covers: the success path, invalid input (400), no session (401), and another user's record (404).
3. Pure logic (parsing, dates, grouping) gets unit tests in `tests/`.
4. Before you finish any task, run and report the result of: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
5. Never delete or weaken a test to make it pass. Fix the code.

## Security rules (required)

- Every API handler is wrapped in `route()` from `src/server/http.ts`, which requires a session. Never read the user id from the request body or query; use `ctx.userId`.
- Every query filters by `userId`. Another user's record returns **404**, never 403, so ids don't leak.
- Validate every body and query with a Zod schema in `src/server/validation.ts`. Schemas are `.strict()` with length limits.
- Markdown is rendered with `rehype-sanitize`; never use `dangerouslySetInnerHTML`.
- Secrets live in environment variables only. Never commit `.env`. Update `.env.example` when adding a variable.
- Keep the security headers in `vercel.json` (CSP, HSTS, nosniff, frame-ancestors).

## Design rules

- Use only design tokens: `var(--bg)`, `var(--surface)`, `var(--accent)`, `var(--accent-ink)` and so on, or the Tailwind names mapped in `src/styles.css` (`bg-surface`, `text-ink-muted`). **No raw hex colors and no Tailwind palette colors** like `amber-400`.
- Amber (`--accent`) is a fill only. Amber text or icons use `--accent-ink`.
- Reuse components from `src/ui/zen.tsx` (Button, Chip, Input, Switch, Modal, ConfirmDialog, EmptyState, Skeleton, MenuButton) before writing new markup.
- Mobile first. Check every screen at **390, 820 and 1440 px** wide and in **both themes**. Phones use the bottom bar, tablets the rail, desktops the sidebar with the task detail pane.
- Every list that can be empty shows an `EmptyState`; every first load shows a `Skeleton`, never a spinner.

## Accessibility rules

- Real `<button>`, `<a>`, `<input>` with labels. Icon-only buttons need `aria-label`.
- Visible focus ring on everything (`--ring`); never remove outlines without a replacement.
- Touch targets at least 44 px. Status is never shown by color alone: add an icon or words.
- Text contrast 4.5:1 and controls 3:1 in both themes (the tokens already pass; don't invent colors).
- Respect `prefers-reduced-motion`.

## Behavior rules

- Don't interrupt the user: no pop-ups while typing, at most one nudge per session, no modals except destructive confirms.
- Completing or deleting a task or note acts at once and shows an **Undo** toast. Deleting a folder or all data uses `ConfirmDialog`; deleting all data requires typing DELETE.
- Sounds and confetti come from `src/lib/feedback.ts`, only after a user action. Confetti only when the last task due today is done.

## Code style

- TypeScript strict. No `any`, no `@ts-ignore`, no unused code.
- Small components, one main component per file. Name things for what they do.
- Commit small, with clear messages. Never commit secrets or `node_modules`.

## Useful commands

```
npm run dev         # http://localhost:3000, uses PGlite when DATABASE_URL is empty
npm test            # Vitest: endpoints, parser, dates
npm run typecheck
npm run lint
npm run build
```
