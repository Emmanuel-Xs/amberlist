# Zen Todo design system (as used by Honeylist)

The approved look. Anything here that the app does not match is a bug; anything you want to change is a **proposal** that needs Emmanuel's approval (see Pending proposals at the end).

## Sources

- DS artifact "Zen Todo": https://claude.ai/artifact/3XQD4Ko6NbjtsMWkJLpC3d (local copy `_raw/source/zen-todo-ds/`: README, tokens.json, design-system.json, component readmes, reference bundle with illustrations, sound and confetti)
- Screens canvas "Amberlist Screens" (approved): https://claude.ai/artifact/Q59DbcQdiSXB7p3KTYsmYn (local copy `_raw/source/screens-canvas/*.dc.html`)
- In code: `src/tokens.css` (tokens), `src/zen.css` (component CSS), `src/styles.css` (app layout), `src/ui/zen.tsx` (React ports incl. illustrations), `src/ui/icons.tsx` (lucide map), `src/ui/logo.tsx`, `src/lib/feedback.ts` (sound, confetti)
- Inspiration: Dribbble "Zen List" plus a second reference for bold Today cards. Emmanuel chose shadcn based, both themes.

## Principles

- Calm, dark first: charcoal surfaces, ONE amber accent, pastel folders, pill shapes, Poppins.
- Mobile first; the same screens on phone, tablet and laptop. Desktop is first class.
- Copy: "you", warm, short, sentence case, buttons are verbs, no emoji. Times "10:00 to 10:30", dates "10 July 2025". Greeting "Good morning, Emmanuel!" then "You have **4 tasks** today" (count in accent-ink).

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
| accent | #fdb833 | #fdb833 | FILL ONLY (primary button, selected chip or date, progress, switch on) |
| on-accent | #1c1d21 | #1c1d21 | text on amber |
| accent-ink | #fdb833 | #8a5c00 | amber as text or icon (See all, counts, active nav) |
| accent-soft | #3a3020 | #fcebc4 | quiet accent ground (active sidebar item, today marker) |
| accent-edge | #fdb833 | #8a5c00 | 1.5px edge on amber state fills |
| ring | #fdb833 | #8a5c00 | focus ring, 2px solid, 2px offset |
| lavender, butter, mint, peach, sky | #d9b8f7 #fae3a0 #bdefc5 #ffc6ae #b7dafa | #e2c8fb #fce7a6 #c4f1cb #ffd2bd #c3e1fb | category and note grounds ONLY |
| on-pastel | #1c1d21 | #1c1d21 | text on pastels (muted = 74% opacity) |
| success | #6fd08c | #1b7035 | done, always with an icon or word |
| danger | #ff8a7a | #b42318 | overdue and destructive, always with an icon or word |
| danger-soft | #3a2323 | #fde8e6 | error alert ground |
| on-danger | #1c1d21 | #ffffff | text on danger solid |
| scrim | rgba(0,0,0,.6) | rgba(28,29,33,.45) | overlay |

- accent-edge, danger-soft, on-danger and scrim were contrast additions; line-strong was darkened and light success darkened. All 36 pairs pass WCAG 2.2 AA in both themes.
- Theme: dark default, `data-theme` on `<html>` (`dark` or `light`); "Match device" follows `prefers-color-scheme`. Saved in prefs and `localStorage['honeylist-theme']`, applied before first paint.
- **Tokens only.** Never raw hex or Tailwind palette colors in components.
- shadcn mapping (for O1): bg to background, surface to card and popover, surface-raised to muted and secondary, accent to primary, on-accent to primary-foreground, accent-soft to accent, accent-ink to brand-ink, line to border, line-strong to input, ring to ring, danger to destructive. `--radius: 1.25rem`.

## Type (Poppins 400, 500, 600, 700)

- display-lg 34/40 600 -0.01em (greeting at lg+); display 26/32 600 (greeting phone and tablet); title 20/28 600 (screen and dialog titles)
- heading 17/24 600 (sections); body 15/22 400; body-strong 15/22 500 (task titles); body-sm 13/18 (meta)
- label 13/16 500 (fields, chips); button 15/20 600; caption 11/14 500 (nav labels, weekday)
- Never below 11px. Inputs at least 16px so iOS doesn't zoom.

## Space, radius, depth, layout

- Space, 4px base: 4, 8, 12 (between rows), 16 (phone gutter, card padding), 20, 24 (sections, tablet gutter), 32 (laptop gutter), 48.
- Radius: sm 10 (checkbox, small icon button, tooltip), md 14 (filled inputs, phone dialogs, dropdowns), lg 20 (task rows, habit cards, panels), xl 28 (category tiles, dialogs md+), full (buttons, chips, search, date pills, switches, progress).
- Shadows: shadow-card (dark: 1px white 3% ring; light: soft lift), shadow-float (bottom nav, sheets, dialogs, FAB).
- Layout: nav bar 72px plus safe area, nav rail 88px, sidebar 256px, detail pane 380px, content max 1280px, tap target 44px.
- Breakpoints: sm 640, md 768, lg 1024, xl 1280. Test at 390, 820 and 1440 (PRD also lists 360, 768, 1024, 1280).

## Navigation layouts

| Screen | Nav | Content | Detail |
| --- | --- | --- | --- |
| Phone under 768 | Bottom bar, 5 items, Add (+) in the middle, fixed, safe area aware | One column; folders and filter chips scroll sideways | Own route, full screen, back arrow |
| Tablet 768 to 1023 | Left rail 88px, icon over label | Wider column, folders 3 to 4 across, the week fits in the date strip | Own route or right sheet |
| Laptop 1024+ | Sidebar 256px, brand on top, folder tree, Scratchpad pinned at the bottom | Middle list | Right pane 380px always visible, clicking a row selects |
| Wide 1280+ | Sidebar | Shell max 1280, centered | Right pane |

- PRD phone bar: Home, Tasks, +, Notes, Habits, with profile as the avatar in the header. App today: Home, Tasks, +, Notes, Folders (O9).
- Create task: bottom sheet on phones, dialog (max 560, radius xl) from md. Filters: bottom sheet on phones, popover md+.

## Components

Zen namespace: Alert, AppNav, AppShell, Button, CategoryCard, Celebrate (sound plus confetti), Chip, ConfirmDialog, Cover, DateStrip, Dialog, EmptyState, Icon, Input, Menu, Popover, ProgressCard, SearchBar, Sheet, Skeleton, Switch, TaskItem, Textarea, Toast, Tooltip. Canvas added: TodayCard, FolderCard, QuickAdd, NoteCard, HabitRow, Sidebar, TaskForm, ProfileContent.

- **Folder cards:** tab on top, pastel ground, big line icon, name, task count, "3 of 8 done" with a bar.
- **Bold Today cards** on Home: larger, colored half, title in display type, time, progress. Compact rows stay for the Tasks page and folders.
- **Interaction states** (States board): hover lifts the surface, press shrinks 2%, focus is a 2px amber ring, loading spinner blocks clicks, disabled at 45% opacity. Chips, switches, task rows and inputs are shown in Default, Hover, Selected, Focus, Disabled, Error, Done. Save feedback reads "Saving" then "Saved".

## DateStrip

- A horizontal row of day pills (radius full). The selected day grows taller and fills amber (180ms). Today, when not selected, gets an accent-ink ring.
- Phones scroll with snap; from md a full week fits. Props: `days[{key, day, weekday, today}]`, `value`, `onChange`.
- See Pending proposals for the radius and scroll change.

## Illustrations

Original DS art: pastel shapes with 2px round on-pastel outlines, 200x150 viewBox, ground ellipse in surface-raised, decorative (`aria-hidden`). Implemented in `src/ui/zen.tsx` (`Illustration`, `EmptyState`) after the 1315e68 revert.

- **tasks:** lavender clipboard with a butter clip, three rows: the first ticked box is a mini LogoMark (board 15, built 2026-09-30), the others paper circles, with lines; amber sun top right. "Nothing planned today" / "Add a task above, or press Q anywhere." CTA Add a task.
- **done:** (board 15, built 2026-09-30) the big logo without its falling drop, the drop landed as a small honey puddle on the ground, mint and lavender pills plus sky and peach comb cells (`LogoMark drop={false}`). "All done for today" / "Nice work. Tomorrow has 2 tasks waiting." CTA See tomorrow.
- **notes:** two stacked tilted notes (butter, lavender) with lines, a peach pencil. "No notes yet" / "Capture ideas, meeting notes and checklists. Markdown works." CTA New note.
- **folder:** butter folder back, dashed paper sheet, amber folder front. "This folder is empty" / "Move tasks here from their menu, or type #work when you add one." CTA Add a task.
- **habits:** a sprout, ink stem with two mint leaves in a peach pot, amber sun. "Build your first habit" / "Pick something small you want to do most days. We'll track the streak." CTA Add a habit. (Not in the app yet.)
- **search:** dashed empty box, sky magnifier with a question mark, ink handle. "No results for "invoce"" / "Check the spelling, or try a word from the note instead." CTA Clear search.
- **offline:** sky cloud with a danger slash. Banner "You're offline. You can keep working. Changes are saved on this device and sync when you're back online." Retry now.
- Rule: every empty list shows illustration, one line of help, and a next action **button**. Several app empty states are missing the button today (see backlog).

## Icons

- lucide-react, 24 grid, stroke 1.75 (1.25 at 44+), round caps. Sizes: 16 chips and toasts, 18 menus and fields, 20 rows and buttons, 22 nav, 24 to 56 cards.
- **Nav icons (board 14 option B, built 2026-09-30):** `NavIcon` in `src/ui/icons.tsx`, used by the sidebar, rail and phone bar. Home is a soft rounded house; Tasks is two comb cell boxes (the top one holds the check) with lines 8 and 5 units long; Notes, Folders and Profile are lucide NotebookPen, Folder, User. Inactive: outline in ink-muted. Active: the shape fills with accent, edges accent-ink, inner marks on-accent (the Notes pen is outlined on-accent so it reads in dark where accent-ink equals accent), label ink 600. Icons without a drawn glyph (Habits flame) fall back to lucide. The phone Add button is a 48px accent square, radius 16, plain Plus.
- Map (Icon): home House, tasks ListTodo, note NotebookPen, flame Flame (habits), folder Folder, plus CirclePlus, search, sliders SlidersHorizontal, more EllipsisVertical, x, calendar, clock, flag (due and priority), bell (reminders), inbox, check, play (start), pin, link, scratch PencilLine, trash Trash2, alert TriangleAlert, refresh RotateCw, undo Undo2, download, copy, logout, arrowLeft, chevronRight and Down, user, moon, sun, book BookOpen, pen PenTool, droplet, target, cart ShoppingCart, menu.
- Icon only buttons need an `aria-label` and a Tooltip (with its shortcut when there is one).

## Motion

- 150 to 200ms ease out for hovers, switch thumb, date pill growth; press scale 0.98.
- Completing: see Celebrations below (honey fill, check pop, comb sparks), then the 450 ms hold and the row glides into Completed.
- Sheets 250ms slide plus fade; dialogs 200ms fade plus scale from 0.96; toasts slide up 200ms; page View Transitions crossfade 200ms; habit check in pop 250ms.
- Nothing over 300ms, no loops, no parallax, no autoplay. `prefers-reduced-motion`: instant or a plain fade.
- State now: row and page animations were removed in 1315e68 (janky on phones). Emmanuel wants motion that is slower and visible (O3).

## Toasts, sounds, confetti

- **Toast:** one line, Undo when undoable, neutral, success and error tones, 3px countdown bar, 4s, pauses on hover or focus, max 3 stacked, bottom center above the nav on phones, bottom left beside the sidebar on desktop, errors stay until dismissed, polite live region. (The component readme says one at a time, new replaces old; the app stacks up to 3.)
- **Sounds** (synthesized, about 6% volume, only after a user action, never on load, Profile switch): complete (task, subtask, habit), undo, delete, error, celebrate (all of today done, habit goal), tap.
- **Celebrations (board 13, built 2026-09-30, replace confetti; no bee):** `src/components/TickFill.tsx`, `src/components/Celebrate.tsx`. Particles are comb cells in amber plus pastels with on-pastel outlines. Non blocking, tap or key skips.
  - Every tick (0.6 s): honey rises in the circle with a wave, check draws and pops at 200 ms with `complete`, six comb sparks flick out and fade. Reduced motion: filled at once.
  - First task ever (once: empty task list plus a localStorage flag): honey drop falls onto the new row's circle, squash, ring, comb cells burst with gravity, toast "Your first task is in" (1.7 s). Circle stays unticked. Reduced motion: toast only.
  - All done for today (last open Today or Overdue task): centred seal, the check's five cells fill one by one, the hexagon blooms and the cells turn on-accent (the logo), `celebrate` plays, honey tears from the hex bottom tip and drops (2.3 s), live region "All done for today". Reduced motion: the final logo and the toast.
  - `confetti()` is gone (no callers).

## Destructive actions and errors

- Reversible (complete; delete task, subtask, note): act, toast with Undo for 4s, no dialog.
- Big but safe (delete folder, discard guest data on merge): ConfirmDialog stating exactly what happens, danger solid confirm button.
- Irreversible (delete all my data): ConfirmDialog with typed "DELETE" (the word is bold and red).
- Delete is last in every menu, after a separator, danger colored with a trash icon. Cancel is focused first; Esc cancels.
- Errors: inline Alert (danger) with Retry; background failures as a Toast ("Couldn't save your note", Retry); field errors under the field.
- Open: Emmanuel wants confirmations for more destructive actions (O2).

## Modals and overlays

- One overlay at a time, scrim, focus trap, Esc closes, focus returns to the trigger.
- Dialog max 520 (edit folder, shortcuts, guest merge "Keep this device's tasks?"). Bottom sheet on phones with a grip. Right sheet on tablet and desktop for the scratchpad. Popover for desktop filters (no scrim). Tooltip on icon buttons only.

## Tooltip

- `Tooltip` and `IconButton` in `src/ui/zen.tsx` (approved on round 2 board 7). Every icon-only button gets one, with its shortcut when there is one.
- Look: inverted (`--ink` ground, `--bg` text), radius 10, 12px medium, optional kbd chip. Portaled, fixed, 8px above the trigger, flips below when there is no room, clamped to the viewport.
- Behaviour: shows after 400ms of mouse hover or at once on keyboard focus (`:focus-visible`); hides on leave, blur, press, scroll and Esc. Never on touch (`pointer: coarse`). `media` prop limits it, e.g. rail only items whose label is hidden.
- A11y: the trigger keeps its `aria-label`; `aria-describedby` points at the tooltip only when it adds something (a different label or a shortcut).

## Scrollbars

- Pill thumb 6px in a 12px gutter, line-strong at rest, amber on hover and drag, transparent track. `.zn-scroll` reserves the gutter; sideways rows use `.zn-scroll-x-hidden` with snap and peek. Never hide the main list's vertical scrollbar on desktop.
- App: page scrollbar hidden under 768 px (14b0815). Task detail pane scrollbar sits inside the rounded card (1315e68).

## Screens designed (canvas)

- Desktop 1440, Tablet 820, Phone 390, the same 10 each: Home, Home first visit, Home light, Tasks, Task detail, Create task, Notes and scratchpad, Profile, Loading (skeleton), Tasks empty with Undo toast.
- Component boards: TodayCard, FolderCard, QuickAdd, NoteCard, HabitRow, Sidebar, TaskForm, ProfileContent.
- State boards: interaction states and scrollbars; empty and offline; icons, destructive actions and errors (incl. "You're a guest", "Delete the Work folder?", "Delete all your data?"); modals, overlays and contrast (edit folder, merge prompt, shortcuts, filters sheet and popover, scratchpad right sheet, contrast table); toasts, sounds and confetti (interactive).
- **Not designed yet:** onboarding name screen, habits pages, Google sign in screens, color picker with custom colors. Logo and splash were designed ad hoc in chat.

## Brand

- Name Honeylist. Mark: hex honeycomb cell, soft corners, inner lattice, check made of 5 comb cells, detached honey drop ("Just let go"). viewBox `-6 -1 76 76`; comb lines hidden below 28px. Files `src/ui/logo.tsx`, `src/ui/logo-data.ts`, `public/logo.svg`.

## Pending proposals (need Emmanuel's approval, shown as a design)

From his 22:38 list on 2026-09-29. Nothing here may be coded before a design is approved.

| Proposal | What he asked | Notes |
| --- | --- | --- |
| Onboarding name screen | Greeting without a name looks weird; ask "What should we call you?" | PRD: one welcome screen, name plus theme pick, skippable, no tour. |
| Quick add redesign | Desktop quick add looks like search because the + is on the left; Q is hard to discover | Move or restyle the +, clear focus state, visible shortcut hint. |
| Toast system and Duolingo style messages | Encouraging toasts for create, complete, overdue; tell the user what happened on completion; rules for modal vs top vs left vs right | Decide placement rules (O4) and a copy set. |
| First task celebration with a bee | Confetti plus a bee animation on the very first task | Superseded: board 13 honey drop approved and built 2026-09-30, no bee. |
| DateStrip radius and bounded momentum scroll | Less rounded pills on desktop; smooth, speed sensitive scroll limited to the last task date plus about 3 days | O6. |
| Confirmations | Confirm destructive actions, maybe task delete and complete; folder delete flow | Conflicts with "Undo instead of confirmations" (O2). |
| Note and folder color picker with custom colors | Easier on the eyes, good contrast, let people add their own colors | O8. |
| Icon set | New icons from scratch or keep lucide; nav icons must not look alike | Done: board 14 option B built 2026-09-30 (see Icons). |
| Splash to app transition | The splash must hand off smoothly into the app | Today it fades out after the drop finishes. |
| Motion library | Slower, visible, non janky motion; Motion library vs CSS | O3. |
| Button below empty state illustrations | Reflect it in the design first | DS rule already says every empty state has a button; check the canvas. |

### Round 3 proposals (2026-09-30, canvas page "Round 3"; 13, 14 B and 15 approved and built 2026-09-30)
- 13 Celebrations: every tick = honey fills the circle, check pops, six comb cell sparks (0.6 s); first task ever = honey drop falls and splashes into comb cells, then toast (1.6 s); all done today = the check's five cells fill one by one and seal into the logo, drop lets go (2.2 s). No bee.
- 14 Icons v2: plain plus (no circle), Tasks list with a comb cell check, soft Home, open folder with files; active state A soft pill or B honey fill (recommended B).
- 15 Empty states: logo as the ticked box in "Add your first task"; "All done" is the big logo with the drop landed as a honey puddle.
- 16 Date wheel: days on a 3D cylinder, speed sensitive spin with spring settle, today centred, range oldest overdue (or 7 days back) to last task + 3 days, month date picker above.

### Round 4 proposals (2026-09-30, canvas page "Round 4", boards 17 to 21; status: designed, awaiting build)
- Repeating tasks (boards 17, 18): a Repeat field in Create task and Task detail opens a popover (desktop) or bottom sheet (phone) with none, daily, weekdays, weekly on chosen days, monthly, custom every N days or weeks, plus an optional end (never, on date, after N times). Rows and grid cards get an outline chip with the lucide Repeat icon and a short label ("Weekly", "3 left"). Completing runs the normal tick and glide, the server creates the next task, and the toast says "Done. Next one is Thursday" with Undo, which also removes the new task. Menu adds "Skip this one" and "Stop repeating" (ConfirmDialog). Only one open task per series, so overdue never piles up. Needs Repeat, SkipForward and BellOff added to `src/ui/icons.tsx`.
- Reminders (boards 19, 20): Remind me becomes a field with none, when it starts, 10 minutes, 1 hour, 1 day before or custom time. First use shows a friendly in app pre prompt before the browser prompt, then a toast; a blocked state shows an inline warning and a how to fix dialog (with the iPhone Home Screen note). Notifications carry the task title, a timing line, the logo and Done and Snooze actions; when a tab is focused or notifications are off, an in app banner replaces them. Snooze is 10 minutes, 1 hour or tomorrow 09:00. Bell chip on rows, and a Notifications row with status in Profile settings. Board 21 lists the data model (repeat_rule, repeat_end, remind_offset, remind_at, prefs.timezone, push_subscription) and delivery (Web Push in `public/sw.js`, VAPID keys, Vercel cron every minute, which needs Vercel Pro).

## Round 4 additions (2026-09-30)
- `Popover` (Radix) with `.zn-popover`, `PickerField` (an Input that opens a picker), `Modal iconTone="accent"`, `Alert actionIcon`, `ConfirmDialog confirmIcon`. Picker parts use the `pk-` classes in `src/styles.css`.
- Icons added: `repeat`, `skip`, `bellOff`.
- Nav: hover previews the honey fill; the active background is the sliding `zn-nav-pill`. The pill is in the sidebar, the rail and the phone bar, and every one of those items is `position: relative; isolation: isolate` so it can sit behind the label. The two bars each use their own `layoutId` (`nav-pill-side`, `nav-pill-bottom`): both are in the DOM at phone widths, and one shared id made Motion animate the bar's pill into the hidden sidebar.
