# Scratchpad

## Purpose
One always there quick note for dumping thoughts; any line can become a task or a note.

## Status
Built.

## How it works now
- Component: `src/components/Scratchpad.tsx`, a `Modal` with `variant="right"` (right sheet) titled "Scratchpad", description "Dump anything here. Turn any line into a task or a note."
- Open from: sidebar "Scratchpad" button (with N hint) at 1024+, the rail icon at tablet, the Scratchpad card on `/notes`, and the `N` key (not right after `G`). State `ui.scratchOpen` in `src/lib/store.ts`.
- Textarea `#scratch-body` (sr-only label "Scratchpad", `data-autofocus`, so it focuses even on touch). Autosave `PUT /api/scratchpad` debounced 600 ms with "Saving" / "Saved" / error.
- "Lines" list: each non empty line with "Make task" (runs the quick add parser, creates the task, removes the line, toast "Turned into a task") and "Make note" (creates a note titled with the line, removes it, toast "Turned into a note").
- API: `GET /api/scratchpad` (creates it on first read), `PUT /api/scratchpad` `{ body }`. Stored as a note with `isScratchpad = true`, hidden from notes endpoints.

## Planned per PRD
- Bottom sheet on phones (today the right sheet is used at all sizes; check against the canvas).
- Hover a line (long press on touch) to show Make task / Make note inline, instead of a separate Lines list.
- AI turn scratchpad into tasks (Phase 3).

## Known issues
- Lines UI differs from the PRD interaction (separate list). Confirm with the design before changing.

## How to test
1. Desktop: `open(page, '/')`, click the body, press `n`. Expect `getByRole('dialog', { name: 'Scratchpad' })` and `#scratch-body` focused.
2. Fill `#scratch-body` with "Email tutor tomorrow 9am\nBook ideas". Wait for "Saved". `GET /api/scratchpad` body matches.
3. Click the first `getByRole('button', { name: 'Make task' })`: toast "Turned into a task"; `GET /api/tasks` has "Email tutor" with startDate tomorrow and 09:00; the line is gone from the textarea.
4. Click `Make note` on "Book ideas": toast "Turned into a note"; `/notes` shows it.
5. Press `Escape`: dialog closes, focus returns to the page.
6. Phone: open from `/notes` via `getByRole('button', { name: /Scratchpad/ })`.
7. Press `g` then `n` quickly: goes to `/notes` and the scratchpad does **not** open.
