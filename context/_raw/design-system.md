# Zen Todo design system (raw recovery)

## Where the originals live
- Design system artifact "Zen Todo": https://claude.ai/artifact/3XQD4Ko6NbjtsMWkJLpC3d (first version 2026-09-29 13:42Z, note "First version from the Zen List Dribbble inspiration"; last update ~16:34Z)
- Screens canvas "Amberlist Screens" (approved designs): https://claude.ai/artifact/Q59DbcQdiSXB7p3KTYsmYn (uses Zen Todo version 1790699639-ac64)
- Copied into repo: `context/_raw/source/zen-todo-ds/` and `context/_raw/source/screens-canvas/`
- Local copies (session scratchpad, may vanish): `/tmp/claude-0/-home-claude/7777ea7f-77ff-5569-bbc7-a1ca89aa92f8/scratchpad/`
  - `zen-ds/project/README.md` (full DS guide), `tokens.json`, `design-system.json`, `components/<Name>/README.md|preview.html`, `components/bundle.js|bundle.css` (reference React impl incl. illustrations, sound, confetti)
  - `amber-canvas/project/*.dc.html` (43 boards), `canvas.json`, `ds/zen/tokens.css`
  - `rt/*.png` component renders dark/light
- In repo: `src/tokens.css` (tokens, copied from DS), `src/zen.css` (component CSS), `src/ui/zen.tsx` (React ports), `src/ui/icons.tsx`, `src/ui/illustrations.tsx` (logo based, added in b78d366), `src/lib/feedback.ts` (sound + confetti)
- Inspiration: Dribbble "Zen List" shot (link sent by user early on) plus a second reference screenshot for bold Today cards. User chose: shadcn based, both themes.

## Principles
- Calm, dark first; charcoal surfaces, ONE amber accent, pastel category tiles, pill shapes everywhere, Poppins.
- Mobile first; same screens on phone, tablet, laptop. Desktop is first class.
- Copy: "you", warm, short, sentence case, buttons are verbs, no emoji. Times "10:00 to 10:30", dates "10 July 2025". Greeting "Good morning, Emmanuel!" / "You have **4 tasks** today" (count in accent-ink).

## Color tokens (dark / light)
| token | dark | light | use |
| --- | --- | --- | --- |
| bg | #1c1d21 | #f4f3ef | page |
| surface | #2a2b30 | #ffffff | cards, rows, nav |
| surface-raised | #34353b | #eceae4 | filled inputs, search, hovers, unselected date pills |
| line | #3a3b42 | #e2e0d9 | quiet dividers |
| line-strong | #80818a | #7f7e79 | control borders (input underline, chip outline, empty checkbox, switch track) |
| ink | #f5f5f4 | #1c1d21 | text |
| ink-muted | #a1a1aa | #5e5f66 | meta text |
| accent | #fdb833 | #fdb833 | FILL ONLY (primary btn, selected chip/date, progress, switch on) |
| on-accent | #1c1d21 | #1c1d21 | text on amber |
| accent-ink | #fdb833 | #8a5c00 | amber as text/icon (See all, counts, active nav) |
| accent-soft | #3a3020 | #fcebc4 | quiet accent ground (active sidebar item, today marker) |
| accent-edge | #fdb833 | #8a5c00 | 1.5px edge on amber state fills (contrast fix) |
| ring | #fdb833 | #8a5c00 | focus ring 2px solid, 2px offset |
| lavender / butter / mint / peach / sky | #d9b8f7 #fae3a0 #bdefc5 #ffc6ae #b7dafa | #e2c8fb #fce7a6 #c4f1cb #ffd2bd #c3e1fb | category tiles ONLY |
| on-pastel | #1c1d21 | #1c1d21 | text on pastels (muted = 74% opacity) |
| success | #6fd08c | #1b7035 | done, always with icon/word |
| danger | #ff8a7a | #b42318 | overdue/destructive, always with icon/word |
| danger-soft | #3a2323 | #fde8e6 | error alert ground |
| on-danger | #1c1d21 | #ffffff | text on danger-solid |
| scrim | rgba(0,0,0,.6) | rgba(28,29,33,.45) | overlay |
- accent-edge, danger-soft, on-danger, scrim were contrast additions; line-strong darkened, light success darkened. "All 36 pairs pass WCAG 2.2 AA in both themes."
- Theme: dark default, `.dark`/`data-theme` on html, respect prefers-color-scheme first load.
- shadcn mapping: bg→background, surface→card/popover, surface-raised→muted/secondary, accent→primary, on-accent→primary-foreground, accent-soft→accent, accent-ink→brand-ink, line→border, line-strong→input, ring→ring, danger→destructive. `--radius: 1.25rem`.
- Rule: tokens only, never raw hex or Tailwind palette colors in components.

## Type (Poppins 400/500/600/700)
- display-lg 34/40 600 -0.01em (greeting at lg+); display 26/32 600 (greeting phone/tablet); title 20/28 600 (screen/dialog titles)
- heading 17/24 600 (sections); body 15/22 400; body-strong 15/22 500 (task titles); body-sm 13/18 (meta)
- label 13/16 500 (fields, chips); button 15/20 600; caption 11/14 500 (nav labels, weekday)
- Never below 11px; inputs ≥15px (PRD says 16px) so iOS doesn't zoom.

## Space, radius, depth, layout
- Space 4px base: 4, 8, 12 (between rows), 16 (phone gutter/card pad), 20, 24 (sections, tablet gutter), 32 (laptop gutter), 48.
- Radius: sm 10 (checkbox, small icon btn, tooltip), md 14 (filled inputs, phone dialogs, dropdowns), lg 20 (task rows, habit cards, panels), xl 28 (category tiles, dialogs md+), full (buttons, chips, search, DATE PILLS, switches, progress).
- Shadows: shadow-card (dark: 1px white 3% ring; light soft lift), shadow-float (bottom nav, sheets, dialogs, FAB).
- Layout: nav-bar 72px (+safe area), nav-rail 88px, sidebar 256px, detail pane 380px, content max 1280px, tap 44px.
- Breakpoints (Tailwind v4): sm 640, md 768, lg 1024, xl 1280. Test 360, 390, 768, 1024, 1440.

## Nav layouts
| Screen | Nav | Content | Detail |
| --- | --- | --- | --- |
| Phone <768 | Bottom bar, 5 items, Add (+) in middle, fixed, safe area | one column, folders and filter chips scroll sideways | own route full screen, back arrow |
| Tablet 768 to 1023 | Left rail 88px, icon over label | wider column, folders 3 to 4 across, week fits in date strip | own route or right Sheet |
| Laptop 1024+ | Sidebar 256px, brand on top, folder tree, Scratchpad pinned bottom | middle list | always visible right pane 380px, click row selects |
| Wide 1280+ | sidebar | shell max 1280, centered | right pane |
- AppNav layout="auto" switches via CSS only. PRD phone bar: Home, Tasks, +, Notes, Habits; profile = avatar in header.
- Create task: full screen/bottom sheet on phones, Dialog (max 560, radius-xl) from md. Filters: bottom Sheet phones, Popover md+.

## Components (Zen namespace)
Alert, AppNav, AppShell, Button, CategoryCard, Celebrate (sound+confetti), Chip, ConfirmDialog, Cover, DateStrip, Dialog, EmptyState, Icon, Input, Menu, Popover, ProgressCard, SearchBar, Sheet, Skeleton, Switch, TaskItem, Textarea, Toast, Tooltip. Canvas added: TodayCard, FolderCard, QuickAdd, NoteCard, HabitRow, Sidebar, TaskForm, ProfileContent.
- Folder cards (PRD change): tab on top, pastel ground, big line icon, name, task count, "3 of 8 done".
- Bold Today cards on Home: larger, colored half, title in display type, time, progress. Compact rows stay for Tasks page and folders.
- Interaction states (States board): hover lifts surface, press shrinks 2%, focus 2px amber ring, loading spinner blocks clicks, disabled 45% opacity. Chips/switches/task rows/inputs shown in Default, Hover, Selected, Focus, Disabled, Error, Done. Feedback "Saving / Saved".

## DateStrip (calendar)
- Horizontal row of day PILLS (radius-full); selected day grows taller and fills amber (180ms). Today when not selected gets accent-ink ring.
- Phones scroll with snap; from md a full week fits.
- Props days[{key, day, weekday, today}], value, onChange.
- User feedback (22:38): pills look ugly on desktop, wants LESS rounded edges; smooth, speed sensitive scroll limited to last task date + ~3 days. Pending approval.

## Illustrations (original DS, pastel shapes with on-pastel 2px round outlines, 200x150 viewBox, ground ellipse in surface-raised, decorative aria-hidden)
- tasks: lavender clipboard with butter clip, three check circles (first amber with tick, others paper) with lines, amber sun circle top right. "Nothing planned today" / "Add a task above, or press Q anywhere." CTA Add a task.
- done: big amber circle with thick check, pastel confetti bits (mint, lavender, sky pills, peach dot). "All done for today" / "Nice work. Tomorrow has 2 tasks waiting." CTA See tomorrow.
- notes: two stacked tilted notes (butter, lavender) with lines, peach pencil. "No notes yet" / "Capture ideas, meeting notes and checklists. Markdown works." CTA New note.
- folder: butter folder back, dashed paper sheet, amber folder front. "This folder is empty" / "Move tasks here from their menu, or type #work when you add one." CTA Add a task.
- habits: sprout, ink stem with two mint leaves in a peach pot, amber sun. "Build your first habit" / "Pick something small you want to do most days. We'll track the streak." CTA Add a habit.
- search: dashed empty box, sky magnifier lens with question mark, ink handle. "No results for "invoce"" / "Check the spelling, or try a word from the note instead." CTA Clear search.
- offline: sky cloud with danger slash. Offline banner "You're offline. You can keep working. Changes are saved on this device and sync when you're back online." Retry now.
- Every empty list: illustration + one line of help + next action BUTTON (user 22:38 wants the button below illustrations reflected in design).
- Later change (commit b78d366, user asked 20:01): illustrations rebuilt around the logo with floating pastel cells (`src/ui/illustrations.tsx`). At 22:38 user said go back to the design, especially illustrations, and approve first. Original code in `git show c314e6b:src/ui/zen.tsx` and DS bundle.js lines 63 to 110.

## Icons
- lucide-react, 24 grid, stroke 1.75 (1.25 at 44+), round caps. Sizes: 16 chips/toasts, 18 menus/fields, 20 rows/buttons, 22 nav, 24 to 56 cards.
- Map: home House, tasks ListTodo, note NotebookPen, flame Flame (habits), folder Folder, plus CirclePlus, search, sliders SlidersHorizontal, more EllipsisVertical, x, calendar, clock, flag (due/priority), bell (reminders), inbox, check, play (start), pin, link, scratch PencilLine, trash Trash2, alert TriangleAlert, refresh RotateCw, undo Undo2, download, copy, logout, arrowLeft, chevronRight/Down, user, moon, sun, book BookOpen, pen PenTool, droplet, target, cart ShoppingCart, menu.
- Icon-only buttons need aria-label + Tooltip (with shortcut). User wants a styled title/tooltip on hover matching the DS.
- Honeycomb nav icon set (b78d366) is to be REVERTED per user (22:38); user says icons need revisiting (new from scratch or current), and must not look alike.

## Motion (DS + PRD)
- 150 to 200ms ease out hovers, switch thumb, date pill growth; press scale 0.98; complete: circle fills amber + check draw 200ms, row slides into Completed 250ms; sheets 250ms slide+fade; dialogs 200ms fade+scale from 0.96; toasts slide up 200ms; page View Transitions crossfade 200ms; habit check in pop 250ms. Nothing > 300ms, no loops, no parallax. prefers-reduced-motion: instant or plain fade.
- User (22:38): animations feel janky on mobile and too fast, "should be stretched for users to see them"; asked whether we use a motion library. Needs decision.

## Toasts, sounds, confetti
- Toast: one line, Undo when undoable, neutral/success/error tones, 3px countdown bar, 4s, pauses on hover/focus, max 3 stacked, bottom center above nav on phones, bottom left beside sidebar on desktop, errors stay until dismissed, polite live region. (Component README says one at a time, new replaces old.)
- Sounds (Zen.sound, synthesized, 6% volume, only after user action, never on load, Profile switch): complete (task/subtask/habit), undo, delete, error, celebrate (all today done, habit goal), tap.
- Confetti: rare. Last task due today, long running task complete, habit goal (21/21). Never single ordinary task. Skipped under reduced motion.
- User (22:38) wants MORE: confetti + bee animation on FIRST task, Duolingo style encouraging toasts for create, complete, overdue; asked when a toast should be modal vs top/left/right.

## Destructive actions and errors (DS)
- Reversible (complete, delete task/subtask/note): act, toast Undo 4s, no dialog.
- Big but safe (delete folder, discard guest data on merge): ConfirmDialog stating exactly what happens, danger-solid confirm.
- Irreversible (delete all my data): ConfirmDialog with typed "DELETE".
- Delete last in every Menu after separator, danger + trash icon. Cancel focused first, Esc cancels.
- Errors: inline Alert danger with Retry; background failures Toast "Couldn't save your note" Retry; field errors under field.
- User (22:38) now wants confirmation for destructive actions incl. task completion/deletion, and "DELETE" bold and red.

## Modals and overlays
- One overlay at a time, scrim, focus trap, Esc, focus returns. Dialog max 520 (edit folder, shortcuts, guest merge "Keep this device's tasks?"). Sheet bottom on phones with grip/swipe; right sheet tablet for scratchpad. Popover desktop filters (no scrim). Tooltip on icon buttons only.

## Scrollbars
- Pill thumb 6px in 12px gutter, line-strong at rest, amber on hover/drag, transparent track, `.zn-scroll` reserves gutter; sideways rows `.zn-scroll-x-hidden` with snap + peek. Never hide main list vertical scrollbar. (Phone scrollbar hidden at <768 in 14b0815 as fix for "sidebar vs bottom nav".) User (22:38): "scroll bar floating off" bug.

## Screens designed (Amberlist Screens canvas, same 10 per size)
Desktop 1440 / Tablet 820 / Phone 390: 1 Home, 2 Home first visit, 3 Home light, 4 Tasks, 5 Task detail, 6 Create task, 7 Notes and scratchpad, 8 Profile, 9 Loading (skeleton), 10 Tasks empty with Undo toast.
Component boards: TodayCard, FolderCard, QuickAdd, NoteCard, HabitRow, Sidebar, TaskForm, ProfileContent.
State boards: Interaction states and scrollbars; Empty and offline; Icons, destructive actions and errors (incl. "You're a guest" notice, "Delete the Work folder?", "Delete all your data?"); Modals, overlays and contrast (Edit folder dialog with color+icon, merge prompt, shortcuts, filters sheet/popover, scratchpad right sheet, contrast table); Toasts, sounds and confetti (interactive).
- Not designed yet: onboarding/name screen, habits pages, Google sign in flow screens, logo/splash (done ad hoc), list vs grid toggle, color picker with custom colors.

## Brand / logo (post design, decided in chat)
- Name Honeylist. Mark: hex honeycomb cell, soft corners, inner honeycomb lattice, check built from 5 filled comb cells, honey drop "Just let go" (detached drop, tiny stub). viewBox -6 -1 76 76, comb lines hidden below 28px. Files `src/ui/logo.tsx`, `src/ui/logo-data.ts`. Splash `src/components/Splash.tsx` animates the drop forming and falling (min 900ms, finishes current cycle before fading, reduced motion off).
