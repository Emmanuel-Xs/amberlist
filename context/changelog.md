# Changelog

Notable commits, newest first (2026-09-29, times WAT). Add an entry with every commit that changes behavior or looks.

## 2026-09-30: round 3 fixes and shadcn
- Splash: name hangs below the centred logo; page enter is fade only, so the logo no longer jumps a notch when it lands.
- Mobile text weight flicker: Poppins 400 to 700 preloaded, `font-synthesis: none`, text size adjust.
- Page transitions on phones are a short opacity fade (no movement) for smoothness.
- Delete all my data no longer shows Welcome until the next page load.
- `html` paints the app colour (overscroll, notch, status bar), theme-color follows the theme.
- shadcn adopted (D28): `MenuButton` on Radix DropdownMenu, `cn` helper, `components.json`.

## Uncommitted, 2026-09-30: Habits (Phase 2)
- Tables `habit` and `habit_checkin` (unique per habit and date), added with `create table if not exists` so Neon and PGlite upgrade in place.
- `GET/POST /api/habits` (`?archived=1` for all), `GET/PATCH/DELETE /api/habits/$id`, `POST /api/habits/$id/checkins` (toggle or set a day). Deleting a folder clears habit folders; export and delete all include habits.
- `src/lib/streaks.ts`: current and best streaks, total, "Day X of Y", weekday and x a week rules, milestones.
- `/habits` (today's habits, week dots, archived list) and `/habits/$id` (stats, goal bar, 12 week heatmap, edit, archive, delete with Undo). Home Habits row and "+ Add a habit". Habits in the sidebar, rail and phone bar (replaces Folders there, O9). `G B` shortcut.

## Uncommitted, 2026-09-30: AI helpers, PWA and SEO (Phase 3)
- AI via the Vercel AI SDK (Groq, Gemini fallback, optional xAI Grok): `GET /api/ai/status`, `POST /api/ai/breakdown`, `POST /api/ai/extract`, 20 calls a day in `ai_usage`. "Break it down" in task detail; "Turn into tasks" in notes and the scratchpad. See features/ai.md.
- PWA: full manifest with maskable icons, shortcuts and screenshots; `public/sw.js` (prod only, never caches `/api`); offline banner; safe area padding; `?new=task` shortcut; theme-color follows the app theme.
- SEO: richer head and JSON-LD SoftwareApplication, per route descriptions, sitemap.xml; CSP gains `worker-src` and `manifest-src`.

## Uncommitted, 2026-09-30: Google sign in, save nudges, merge prompt
- Better Auth Google provider (only with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`); guest data carries over through the anonymous plugin's `onLinkAccount`.
- `mergeGuestData` and `linkGuestAccount` in `services.ts`; merge prompt "Keep this device's tasks?" with `POST /api/me/merge` when both sides had data.
- `GET /api/me` adds `isGuest`, `isAnonymous`, `email`, `image`, `accountName`, `googleEnabled`, `pendingMerge`, `nudgeState`; `PATCH /api/me` takes `nudgeDismissed`.
- Profile: Continue with Google card, signed in avatar, email and Sign out. Home: "You're a guest" save nudge.
- Delete all my data keeps a Google account; guests get a fresh guest session.

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
