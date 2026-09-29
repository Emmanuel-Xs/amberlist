# Notes

## Purpose
Markdown notes that stand alone or sit beside a task, with live checklists and autosave.

## Status
Built (editor added in c314e6b, card delete in b78d366, quiet focus frame in 1315e68).

## How it works now
- List: `/notes` (`src/routes/notes/index.tsx`). Header "New note" (creates an empty note and opens it), `SearchBar` "Search notes" (local filter on title and body), Scratchpad entry card, "Pinned" and "All notes N" sections in `.notes-grid`, skeletons, empty states ("No notes yet" with a New note button; search empty state).
- Card: `NoteCard` in `src/components/Cards.tsx`. Pastel ground, title or "Untitled note", preview, pinned icon, linked task title or "Edited 29 Sep". Trash button "Delete note {title}" (top right) uses `deleteNoteWithUndo` (`src/lib/noteActions.ts`): removed at once, toast "Note deleted" with Undo, server delete after 4.2s.
- Editor: `/notes/$id` renders `NoteEditor` (`src/components/NoteEditor.tsx`).
  - Header: "Back to notes", live "Saving" / "Saved" / error, "Pin note" or "Unpin note" (`aria-pressed`), "Duplicate note", "Delete note".
  - Card: `#note-title` input and `#note-body` textarea (grows with content). Opens in Preview when the note has text, Write when empty.
  - Mode group "Editor mode": Write, Preview. In Write: toolbar Checklist, Bullets, Heading (toggle a line prefix).
  - Enter continues lists (`- [ ] `, `- `, `1. `); Enter on an empty item ends the list (`continueList` in `src/lib/markdown.ts`).
  - Preview: react-markdown + remark-gfm + rehype-sanitize. Checkboxes are real buttons ("Mark done" / "Mark not done") that flip the matching line (`toggleChecklist`) and save at once. Links open in a new tab with `noopener noreferrer nofollow`. "N of M done" counter.
  - Autosave: debounced 600 ms (TanStack Pacer); unsaved text is flushed on leave.
  - Below: `ColorPicker` (exported from `NoteEditor.tsx`, shared with folders): radiogroup "Note color" (Plain, lavender, butter, mint, peach, sky, then up to 6 custom swatches "Custom colour #rrggbb"; arrow keys move and select), then an "Add your own colour" button (lucide Palette). It opens a small panel (role dialog) under the swatches: hue slider 0 to 359 with a hue gradient track, an "Aa" preview, "Text stays readable: X to 1", Cancel and "Add colour". Esc or a click outside closes it and focus returns to the button. Then Linked task select `#note-task`, "Delete note" outline button.
  - Colours: stored as a token name or a custom `#rrggbb`. Custom shades are HSL(h, 70%, 80%) (`customShade` in `src/lib/colors.ts`); the lowest on-pastel contrast over all hues is 7.6:1 (4.5:1 at 74% muted). Render with `colorVar(c)` (token to `var(--x)`, hex as is). Custom colours use on-pastel text.
  - Remembered custom colours: derived from the colours already on the user's notes (newest first) and folders, plus any added while the picker is open; max 6. No extra table or column. A custom colour that no note or folder uses any more drops off after a reload.
  - Focus: one quiet frame on the card (`.note-card-editor:has(...)`) instead of rings on each field.
- API: `GET/POST /api/notes` (`q`, `taskId`), `GET/PATCH/DELETE /api/notes/:id`. Body max 50,000, title max 200. Scratchpad notes are excluded.

## Planned per PRD
- Shared search with tasks; `- [ ]` tip on the first note; AI turn note into tasks (Phase 3).

## Known issues
- A plain bullet mixed into a checklist shows no bullet marker.
- Checklist tick and delete not yet verified on the live site.
- Two buttons named "Delete note" in the editor.

## How to test
1. `open(page, '/notes')`, click `getByRole('button', { name: 'New note' }).first()`. URL matches `/notes/<id>`.
2. Fill `#note-title` "Groceries"; fill `#note-body` "- [ ] eggs"; press End then Enter: the body now ends with `- [ ] ` on a new line. Type "milk". Wait for "Saved". `GET /api/notes/<id>` has both lines.
3. Click `getByRole('button', { name: 'Preview' })`, then the first `getByRole('checkbox', { name: 'Mark done' })`: it becomes "Mark not done" and "1 of 2 done" shows; the API body has `- [x] eggs`.
4. `getByRole('button', { name: 'Pin note' })`: pressed; `/notes` shows it under "Pinned".
5. `getByRole('radio', { name: 'butter' })`: the card ground changes; API color is butter.
5b. Custom colour: click `getByRole('button', { name: 'Add your own colour' })`; the Hue slider is focused; Esc closes and focus returns to the button. Reopen, `getByLabel('Hue').fill('270')`, "Text stays readable" shows, click "Add colour": radio "Custom colour #cca8f0" is checked, card ground is rgb(204, 168, 240). Reload: still checked.
6. Link: `#note-task` select a seeded task; the task detail lists the note.
7. Duplicate: toast "Note duplicated", URL changes, title ends "(copy)".
8. Delete from the card: on `/notes` click `getByRole('button', { name: 'Delete note Groceries' })`, toast "Note deleted", Undo restores it. Delete from the editor: `getByRole('button', { name: 'Delete note' }).first()` returns to `/notes`.
9. Search "zzz": empty state `No results for "zzz"`.
10. Security: a markdown `<script>` or `javascript:` link does not render as active HTML.
