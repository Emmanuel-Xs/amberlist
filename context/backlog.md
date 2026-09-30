# Backlog

Every open item in one table. Status: **Done**, **Partly**, **Not built**, **Open** (bug or question), **Verify** (believed done, needs a test). "Design" = needs Emmanuel's design approval before code (see README rule 1). Update the row in the same commit as the change.

Sources: PRD = [prd.md](prd.md); L# = item # of Emmanuel's 22:38 list (2026-09-29); Bug = known bug; Review = found while writing these docs from the code.

| Item | Source | Status | Design | Notes |
| --- | --- | --- | --- | --- |
| **Phase 2 (PRD)** | | | | |
| Google sign in (Better Auth Google provider, OAuth client, env vars) | PRD, L26 | Done | approved | 2026-09-30: built, button shows only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set. **Owner:** create the OAuth client and add the env vars in Vercel (steps in [features/guest-auth-and-google.md](features/guest-auth-and-google.md)). Verified live by Emmanuel 2026-09-30 (project `honeylist` in Google Cloud, consent screen in Testing mode, so add test users until a custom domain allows publishing). |
| Guest badge plus "Save your data with Google" action | PRD | Done | no | 2026-09-30: Profile board card with "Continue with Google"; signed in shows photo, email, Sign out. Calm note when Google isn't configured. |
| Save nudges (after 2nd task, after 3 days) | PRD, D3 | Done | board | 2026-09-30: `SaveNudge` on Home, "You're a guest" warning Alert style. Never while typing, one per session, dismissal in `prefs.nudge_state`, stops after sign in. Days of use counted per browser. |
| Link guest in place plus merge prompt (`mergeGuestData`) | PRD | Done | no | 2026-09-30: `onLinkAccount` + `linkGuestAccount`; prompt only when both sides have data (`prefs.pending_merge`), `POST /api/me/merge`. Discard asks to confirm. |
| Habits (`/habits`, `/habits/$id`, check in, streaks, heatmap, Home row, goal confetti, tables) | PRD, L21 | Done (pages need design sign off) | HabitRow board; pages built from DS parts | 2026-09-30: tables `habit`, `habit_checkin`; `/api/habits`, `/api/habits/$id`, `/api/habits/$id/checkins` (tested); streak maths in `src/lib/streaks.ts` (tested); list, detail with 12 week heatmap, create/edit dialog, archive, delete with Undo, Home row, nav, `G B`. Goal reached plays celebrate plus a toast (no confetti: `confetti()` left feedback.ts in round 3). See [features/habits.md](features/habits.md). |
| Repeating tasks (none, daily, weekdays, weekly, monthly, custom) | PRD | Done (verify live) | approved (Round 4 boards 17, 18) | 2026-09-30: `task.repeat_rule` and `repeat_end`, next task made in the same transaction, skip, stop repeating, chips, picker as popover or sheet. Date maths in `src/lib/repeat.ts` with tests. See [features/repeating-tasks.md](features/repeating-tasks.md). |
| Reminders and notifications | PRD, L18 | Done (test push verified live) | approved (Round 4 boards 19 to 21) | 2026-09-30: Remind me field, pre prompt, blocked help, Web Push with Done and Snooze, in app banners, chips, Profile row, GitHub Actions scheduler. Env vars and GitHub secret set 2026-09-30, Send a test verified live. Still to try: a real due reminder with Done and Snooze on a phone. See [features/reminders-notifications.md](features/reminders-notifications.md). |
| Welcome screen with name (and theme pick) | PRD, L1 | Done | approved | 2026-09-30: `src/components/Welcome.tsx`, full page on phones, dialog from 768. `prefs.onboarded_at`, `onboarded` in `GET/PATCH /api/me`. See [features/onboarding.md](features/onboarding.md). |
| Just in time tips (quick add syntax, `- [ ]`, streaks, shortcuts) | PRD | Partly | yes | Shortcuts tip done (2026-09-30, toast, desktop, once per browser via localStorage). Others need `seenTips` pref. |
| Keyboard shortcut sheet | PRD | Partly | no | `?` sheet exists, plus a one time desktop tip toast pointing to it. `G B` (habits) added 2026-09-30. `/` search and `G F` are missing. |
| Load sample data and clear it (HNG Stage 1 reviewers) | HNG notice | Done | small addition, needs Emmanuel's eye | 2026-09-30: `POST` and `DELETE /api/me/sample`, `prefs.sample_ids`, button on the Home empty state and in Profile, Your data. Clear removes only what it loaded. |
| Guest cleanup job (90 days inactive) | PRD | Not built | no | Can reuse the GitHub Actions scheduler (`.github/workflows/reminders.yml` pattern) and a `cronRoute` endpoint. |
| Privacy note in settings | PRD | Done | no | 2026-09-30: full `/privacy` and `/terms` pages, linked from Profile. |
| **Phase 3 (PRD)** | | | | |
| AI break down task | PRD | Done (verified live 2026-09-30) | yes (built from DS parts, screenshots to approve) | 2026-09-30: "Break it down" under Subtasks in task detail, checkable chips, Add selected. `POST /api/ai/breakdown`. Groq, Gemini, xAI via the AI SDK (D25). See [features/ai.md](features/ai.md). |
| AI turn note or scratchpad into tasks | PRD | Done (verified live 2026-09-30) | yes (screenshots to approve) | 2026-09-30: "Turn into tasks" in the note editor and the scratchpad, review list (edit titles, untick), then creates. `POST /api/ai/extract`. |
| PWA install and offline read with "You're offline" banner | PRD | Done (verify on the live site) | no | 2026-09-30: full manifest (maskable icons, shortcuts, screenshots, window controls overlay), `public/sw.js` (prod only), offline banner, safe area padding, `?new=task` shortcut. Offline reload shows the cached shell but no data (API is never cached). See [features/pwa.md](features/pwa.md). |
| Polish pass | PRD | Not built | no | |
| **Other PRD gaps** | | | | |
| "Day 4 of 21" progress for long running tasks | PRD, D4 | Not built | no | Needs both dates. |
| Move to folder from the task menu | PRD | Not built | no | Possible from task detail folder chips only. |
| Quick add `#newfolder` confirm chip | PRD | Partly | no | Creates the folder silently on submit. |
| Shared search across tasks and notes | PRD | Partly | yes | `GET /api/search` exists and is tested, but no UI uses it; Tasks and Notes filter locally. |
| Folder page shows habits and notes | PRD | Partly | no | Tasks only; notes have no folder. Habits have `categoryId` now, so the folder page can list them (not built yet). |
| Reorder tasks (`reorderTasks`) | PRD | Not built | no | `position` column exists. |
| Priority: show Low too, not only High | PRD, L17 | Done | approved | Board 7: High = flag + "High" in danger, Low = chevron + "Low" muted, Medium nothing. `Priority` in `TaskRow.tsx`, used by rows, grid cards and TodayCard (surface pill). |
| "+ Add a habit" link at the foot of Home | PRD | Done | no | 2026-09-30: opens the habit dialog in place. |
| View Transitions page crossfade | PRD | Not built | no | |
| Tooltips on icon buttons | PRD, L14 | Done | approved | Board 7: `Tooltip` and `IconButton` in `zen.tsx`. On row Open/More, grid More, rail Scratchpad (N) and Profile, note pin/duplicate/delete, dialog Close (Esc). |
| sitemap.xml | PRD | Done | no | 2026-09-30: `public/sitemap.xml` (only `/`, the one public page), linked from robots.txt. SEO head and JSON-LD SoftwareApplication with featureList updated in `__root.tsx`. |
| Playwright e2e plus axe on every route | PRD | Not built | no | Plan in [testing.md](testing.md). |
| Lighthouse 90+ on all four | PRD | Verify | no | |
| CI: lint, e2e, `npm audit` | PRD | Partly | no | CI runs typecheck, test, build only. |
| drizzle-kit migrations | PRD | Not built | no | Tables and columns still come from the idempotent DDL string in `src/server/schema.ts`; round 4 added columns and `push_subscription` there. Switch before the next big schema change. |
| TanStack Devtools in dev | PRD | Verify | no | Packages installed. |
| Rename design canvas to "Honeylist Screens" (round 2 and 3 boards added as pages) and the PRD doc to "Honeylist PRD" | Rename | Done | no | 2026-09-30: canvas https://claude.ai/artifact/Q59DbcQdiSXB7p3KTYsmYn (pages Screens, Round 2, Round 3); PRD https://claude.ai/artifact/BM7ZxCREPS5oyh8zQJb7hK. Product name in both is now Honeylist. |
| **Emmanuel's 22:38 list** | | | | |
| L1 Name onboarding | L1 | Done | approved | Welcome screen plus dynamic Home greeting (`src/lib/greeting.ts`). |
| L2 PRD gap review and keep `context/` updated | L2 | Done | no | This folder. Keep it current. |
| L3 Revert honeycomb nav icons | L3 | Done | no | 1315e68. Revisiting icons is still open (O5). |
| L3b Revisit icons (new or current, not alike) | L3 | Done | approved | 2026-09-30 board 14 option B: `NavIcon` in `src/ui/icons.tsx` (soft Home, Tasks with comb cell boxes and a shorter second line, lucide NotebookPen, Folder, User) fills with honey when active, label in ink; phone Add is a radius 16 square with a plain plus. |
| L4 Back to the design illustrations | L4 | Done | no | 1315e68 restored DS art in `src/ui/zen.tsx`. |
| L4b Show designs and get approval before changes | L4 | Ongoing | yes | README rule 1. |
| L5 DELETE bold and red | L5 | Done | no | 1315e68, `.confirm-word`. |
| L5b Confirmations for destructive actions (task delete, completion?) and folder delete flow | L5 | Open | yes | O2. Folder delete already confirms. Board 8: ConfirmDialog content now centred, buttons stacked full width on phones. |
| L6 Overflow menu (three dots at the edge) | L6 | Done | approved | Board 7: 36px, radius 12 Open and More buttons inset 12px; hover or focus-within on desktop, always on touch. |
| L7 Lively micro interactions, first task confetti plus bee, Duolingo style toasts for create, complete, overdue | L7 | Partly | approved | 2026-09-30 board 13 built, no bee: honey tick with comb sparks, first task honey drop onto the new circle, all done comb seal into the logo (`Celebrate.tsx`, `TickFill.tsx`). See [features/feedback-toasts-sounds-confetti.md](features/feedback-toasts-sounds-confetti.md). First note treatment not built. |
| L8 Toast placement rules | L8 | Open | yes | O4. |
| L9 Splash transitions smoothly into the app | L9 | Done | approved | Splash logo flies into the sidebar or phone header (round 2 and 3, `Splash.tsx`, `SplashToApp` board). |
| L10 Janky, too fast animations; motion library decision | L10 | Done | approved | D21: `motion/react`, tokens in `src/lib/motion.ts`, rules in `.claude/skills/honeylist-motion`. Nav background now slides between items (`NavPill`). |
| L11 Date wheel: 3D cylinder, speed sensitive spin, bounded range, month picker | L11 | Done | no | Round 3 board 16 approved 2026-09-30 with two fixes (spacious phone picker sheet, tap centres the card). `src/components/DateWheel.tsx`, `dw-` styles in `src/styles.css`. See [date-strip.md](features/date-strip.md). |
| L12 shadcn components where available | L12 | Partly | no | D28: `MenuButton` on `DropdownMenu`; `Popover` (Radix) added 2026-09-30 for the Repeat and Remind me pickers. Dialog, AlertDialog and Tooltip still hand written; port them when touched. |
| L13 Double outline on inputs and icons; glaring notes textarea outline | L13 | Partly | no | Note editor now has one quiet frame (1315e68). Recheck other inputs and icon buttons. |
| L14 Styled tooltips on icon hover | L14 | Done | approved | See Tooltips row. |
| L15 Color picker easier on the eyes, custom colors | L15 | Done (verify on live) | approved (9A plus custom) | 2026-09-30: dark pastels about 12% softer (`src/tokens.css`); "Add your own colour" hue slider for notes and folders, HSL(h, 70%, 80%), server accepts presets or `#rrggbb` at 70% to 90% lightness with on-pastel at 4.5:1 or better (`src/lib/colors.ts`, `src/server/validation.ts`). Custom list is derived from colours used by notes and folders, up to 6. |
| L16 Keyboard keeps popping up on mobile | L16 | Done | no | 1315e68: dialogs no longer refocus every render; on touch only `data-autofocus` fields focus (D18). |
| L17 Why only High shows a flag | L17 | Done | approved | Low shows too (board 7). |
| L18 Do notifications and sounds work | L18 | Partly | no | Sounds work (Web Audio, Profile switch); success toasts play a soft `success` sound (2026-09-30). Notifications do not exist. |
| L19 Browser autofill colors | L19 | Done | no | 1315e68, `input:-webkit-autofill` rules in `src/styles.css`. |
| L20 Home "See all" links and max 6 per section | L20 | Partly | no | 1315e68: tasks capped at 6 with "See all N tasks"; notes show 3 with "All notes". Folders row is not capped. |
| L21 Habits | L21 | Done | approved | See Habits above. |
| L22 Desktop UI broken; Q hard to discover; quick add looks like search | L22 | Partly | approved | 2026-09-30: quick add redesigned (amber Add pill on the right, no Q box, desktop hint line), shortcuts tip. Rest of the desktop list still needs screenshots. |
| L23 Button below empty state illustrations | L23 | Partly | yes | Notes and Folders empty states have buttons; Home, Tasks, folder page and detail pane do not. Reflect in design first. 2026-09-30 board 15 art built: 'tasks' art has the logo as the ticked box, 'done' art is the big logo with the drop landed as a puddle and comb cell bits (buttons still to add). |
| L24 Scrollbar floating off | L24 | Done | no | 1315e68: task detail pane scrollbar sits inside the rounded card. Verify on other panels. |
| L25 Task list vs grid toggle | L25 | Done | approved | Board 7: List/Grid segmented control beside the title, `localStorage` `honeylist-task-view`; `TaskGridCard.tsx`, 1/2/3 columns. |
| L26 Google OAuth options | L26 | Done | no | Went with Better Auth's built in Google provider (no extra package). See Google sign in above. |
| **Known bugs** | | | | |
| Plain bullet mixed into a checklist shows no bullet marker | Bug | Open | no | Note preview CSS. |
| Home nav item stays amber | Bug | Verify | no | Seen before the icon revert. 2026-09-30: active state is now the honey filled icon (NavIcon) and only the current route's item gets it. |
| Task detail renders twice at `/tasks/$id` (pane and mobile copy, one hidden by CSS), so ids like `title-{taskId}` are duplicated | Review | Open | no | `src/components/TasksPage.tsx`. Playwright must filter to visible elements. |
| Rail (768 to 1023): Profile link and Scratchpad button have no accessible name (their text uses `.app-sidebar-extra`, display none) | Review | Open | no | Add `aria-label`. Verify with axe. |
| Deleted task or note comes back if the page reloads within the 4.2s Undo window | Review | Open | no | Server delete is deferred until the toast ends. |
| Checklist tick and note delete not verified on the live site | Bug | Verify | no | Worked locally. |
| "Remind me" switch is a no op | Bug | Done | no | Replaced by the Remind me field and real delivery (2026-09-30). |
| Home icon, splash, desktop layout issues from Emmanuel's 7 screenshots | Bug | Verify | no | Screenshots in `/root/.claude/uploads/7777ea7f-77ff-5569-bbc7-a1ca89aa92f8/` (may be gone). |
| "Sidebar should not affect the bottom nav" | Bug | Open | no | O10, never confirmed. |
| Note editor was a stub | Bug | Done | no | c314e6b. |
| Subtask tick returned 400 (extra `taskId` in body) | Bug | Done | no | c314e6b. |
| `G N` opened the scratchpad | Bug | Done | no | c314e6b. |
| Profile unreachable on phones | Bug | Done | no | b78d366, profile link in the phone Home header. |
| Task menus rendered under later rows | Bug | Done | no | 1315e68, portal. |
