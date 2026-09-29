# Changelog

Notable commits, newest first (2026-09-29, times WAT). Add an entry with every commit that changes behavior or looks.

## 1315e68, 22:51: Revert honeycomb icons, logo illustrations and row motion; fix menus, phone keyboard, outlines
- Back to lucide nav icons and the DS empty state illustrations (`src/ui/illustrations.tsx` deleted, art back in `src/ui/zen.tsx`).
- Removed page and row animations (janky on phones, also put task menus under later rows).
- Task menus (`MenuButton`) render in a portal and flip up near the bottom of the screen.
- `Modal` no longer refocuses on every render (the phone keyboard kept popping up); on touch only `data-autofocus` fields get focus.
- Note editor: one quiet frame while typing instead of a double outline.
- "DELETE" in the typed confirm is bold and red.
- Browser autofill keeps our colors.
- Task detail pane scrollbar sits inside the rounded card.
- Home shows at most 6 tasks with a "See all" link.

## b78d366, 20:08: Honeycomb icon set, logo empty states, hide bottom nav on scroll, motion, profile on phones, delete notes from list
- Honeycomb nav icons and logo based illustrations (both reverted in 1315e68, shipped without design approval).
- Bottom nav hides while scrolling down, returns on scroll up or near the top.
- Splash always finishes the current drop before leaving.
- Phone Home header links to Profile (was unreachable on phones).
- Delete a note from its card, with Undo (`src/lib/noteActions.ts`).
- Page, row, check and press motion (row and page motion later removed).

## c314e6b, 20:00: Build the note editor, fix subtask ticks and G N shortcut
- `notes/$id` was a scaffold stub; added `NoteEditor` with Write and Preview, live checklists, list continuation, autosave, pin, color, task link, duplicate, delete with Undo.
- Subtask PATCH sent `taskId` and failed strict validation (400).
- `G N` opened the scratchpad because bare `N` also fired.
- `src/lib/markdown.ts` helpers with tests.

## c5f66aa, 19:27: Final Honeylist logo, loading screen, 404 page and app icons
- "Just let go" logo, splash (`src/components/Splash.tsx`), 404 "That page has let go", favicon, manifest icons 192 and 512, OG image.

## 14b0815, 18:58: Rename to Honeylist, add logo, fix button centering, phone scrollbar and quick add hint
- Amberlist renamed to Honeylist everywhere. Optical centering for buttons with a leading icon. Page scrollbar hidden on phones. Shorter quick add placeholder on narrow phones.

## c151e10, 18:40 and 218b8cf, 18:34: Deploy
- Live URL in README; first Vercel deploy.

## 598cca6, 18:03: Amberlist Stage 1
- TanStack Start app with guest accounts (Better Auth anonymous), Drizzle on Postgres, tested REST API, responsive shell (phone bar, tablet rail, desktop sidebar plus detail pane), Zen Todo design system, tasks, quick add parser, notes list, scratchpad, folders, progressive Home, profile, shortcuts, toasts, sounds, confetti.

## 2026-09-30: round 2 approvals built
- Welcome screen with name and theme; dynamic greeting (time, weekday, new or returning), name updates live.
- Quick add: no leading icon, amber Add pill on the right with a plain plus, desktop hint line, one-time shortcuts tip.
- Friendly toasts (board 4): badge, title plus detail, rotating copy (`src/lib/messages.ts`), soft sound on success toasts.
- Softer dark pastels; custom note and folder colours (`src/components/ColorPicker.tsx`, `src/lib/colors.ts`).
- Rows: inset actions on hover, Low priority shown, tooltips, list or grid toggle, centred confirm dialogs.
- Motion library (`motion`) adopted: toasts spring in, ticked rows hold 450 ms then glide to Completed, splash logo flies into the sidebar or phone header, page transitions via native View Transitions.
- Repo skills: `.claude/skills/motion` (from motion-ai, MIT) and `.claude/skills/honeylist-motion`; Motion MCP in `.mcp.json`.
