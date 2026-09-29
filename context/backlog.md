# Backlog

Every open item in one table. Status: **Done**, **Partly**, **Not built**, **Open** (bug or question), **Verify** (believed done, needs a test). "Design" = needs Emmanuel's design approval before code (see README rule 1). Update the row in the same commit as the change.

Sources: PRD = [prd.md](prd.md); L# = item # of Emmanuel's 22:38 list (2026-09-29); Bug = known bug; Review = found while writing these docs from the code.

| Item | Source | Status | Design | Notes |
| --- | --- | --- | --- | --- |
| **Phase 2 (PRD)** | | | | |
| Google sign in (Better Auth Google provider, OAuth client, env vars) | PRD, L26 | Not built | yes | Provider is wired in `src/server/auth.ts` only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set; no UI. Options still to be looked into. See [features/guest-auth-and-google.md](features/guest-auth-and-google.md). |
| Guest badge plus "Save your data with Google" action | PRD | Partly | no | Profile shows a Guest pill and a static "coming next" card. No action. |
| Save nudges (after 2nd task, after 3 days) | PRD, D3 | Not built | yes | Home only, one per session, stops after sign in. Needs `nudgeState` pref. |
| Link guest in place plus merge prompt (`mergeGuestData`) | PRD | Not built | no | Merge dialog is on the Overlays board. |
| Habits (`/habits`, `/habits/$id`, check in, streaks, heatmap, Home row, goal confetti, tables) | PRD, L21 | Not built | yes | Only the HabitRow board and the habits illustration exist in design. |
| Repeating tasks (none, daily, weekdays, weekly, monthly) | PRD | Not built | yes | No `repeatRule` column yet. |
| Reminders and notifications | PRD, L18 | Not built | yes | "Remind me" switch saves `task.remind`; nothing notifies. Ask permission only on first switch on. |
| Welcome screen with name (and theme pick) | PRD, L1 | Not built | yes | Name can be set in Profile today. |
| Just in time tips (quick add syntax, `- [ ]`, streaks, shortcuts) | PRD | Not built | yes | Needs `seenTips` pref. |
| Keyboard shortcut sheet | PRD | Partly | no | `?` sheet exists. `/` search and `G F` are missing. |
| Guest cleanup job (90 days inactive) | PRD | Not built | no | |
| Privacy note in settings | PRD | Partly | no | "Your data" section explains delete; no note on what is stored. |
| **Phase 3 (PRD)** | | | | |
| AI break down task | PRD | Not built | yes | Groq free tier, Gemini Flash backup, Vercel AI SDK, 20 calls a day (D9). |
| AI turn note or scratchpad into tasks | PRD | Not built | yes | Same review step. |
| PWA install and offline read with "You're offline" banner | PRD | Partly | no | Manifest and icons exist; no service worker. Offline banner is designed. |
| Polish pass | PRD | Not built | no | |
| **Other PRD gaps** | | | | |
| "Day 4 of 21" progress for long running tasks | PRD, D4 | Not built | no | Needs both dates. |
| Move to folder from the task menu | PRD | Not built | no | Possible from task detail folder chips only. |
| Quick add `#newfolder` confirm chip | PRD | Partly | no | Creates the folder silently on submit. |
| Shared search across tasks and notes | PRD | Partly | yes | `GET /api/search` exists and is tested, but no UI uses it; Tasks and Notes filter locally. |
| Folder page shows habits and notes | PRD | Partly | no | Tasks only; notes have no folder. |
| Reorder tasks (`reorderTasks`) | PRD | Not built | no | `position` column exists. |
| Priority: show Low too, not only High | PRD, L17 | Open | yes | O11. |
| "+ Add a habit" link at the foot of Home | PRD | Not built | no | Foot has "Full task form" and "New folder". |
| View Transitions page crossfade | PRD | Not built | no | |
| Tooltips on icon buttons | PRD, L14 | Not built | yes | Only `title` on the quick add +. |
| sitemap.xml | PRD | Not built | no | robots.txt exists. |
| Playwright e2e plus axe on every route | PRD | Not built | no | Plan in [testing.md](testing.md). |
| Lighthouse 90+ on all four | PRD | Verify | no | |
| CI: lint, e2e, `npm audit` | PRD | Partly | no | CI runs typecheck, test, build only. |
| drizzle-kit migrations | PRD | Not built | no | Tables come from a DDL string in `src/server/db.ts`. |
| TanStack Devtools in dev | PRD | Verify | no | Packages installed. |
| **Emmanuel's 22:38 list** | | | | |
| L1 Name onboarding | L1 | Not built | yes | See Welcome screen above. |
| L2 PRD gap review and keep `context/` updated | L2 | Done | no | This folder. Keep it current. |
| L3 Revert honeycomb nav icons | L3 | Done | no | 1315e68. Revisiting icons is still open (O5). |
| L3b Revisit icons (new or current, not alike) | L3 | Open | yes | O5. |
| L4 Back to the design illustrations | L4 | Done | no | 1315e68 restored DS art in `src/ui/zen.tsx`. |
| L4b Show designs and get approval before changes | L4 | Ongoing | yes | README rule 1. |
| L5 DELETE bold and red | L5 | Done | no | 1315e68, `.confirm-word`. |
| L5b Confirmations for destructive actions (task delete, completion?) and folder delete flow | L5 | Open | yes | O2. Folder delete already confirms. |
| L6 Overflow menu (three dots at the edge) | L6 | Partly | yes | 1315e68: menus portal to body and flip up near the bottom. Trigger placement still ugly per Emmanuel. |
| L7 Lively micro interactions, first task confetti plus bee, Duolingo style toasts for create, complete, overdue | L7 | Not built | yes | O7. Toasts today: "Added ...", "Task completed", "All done for today. Well played." |
| L8 Toast placement rules | L8 | Open | yes | O4. |
| L9 Splash transitions smoothly into the app | L9 | Not built | yes | Drop cycle finishes (b78d366); hand off still a plain fade. |
| L10 Janky, too fast animations; motion library decision | L10 | Partly | yes | Row and page motion removed in 1315e68. O3. |
| L11 DateStrip less rounded on desktop, bounded momentum scroll | L11 | Not built | yes | O6. Today it is a fixed Sun to Sat week. |
| L12 shadcn components where available | L12 | Open | no | O1 (approach decision, then per component). |
| L13 Double outline on inputs and icons; glaring notes textarea outline | L13 | Partly | no | Note editor now has one quiet frame (1315e68). Recheck other inputs and icon buttons. |
| L14 Styled tooltips on icon hover | L14 | Not built | yes | |
| L15 Color picker easier on the eyes, custom colors | L15 | Not built | yes | O8. |
| L16 Keyboard keeps popping up on mobile | L16 | Done | no | 1315e68: dialogs no longer refocus every render; on touch only `data-autofocus` fields focus (D18). |
| L17 Why only High shows a flag | L17 | Open | yes | O11. |
| L18 Do notifications and sounds work | L18 | Partly | no | Sounds work (Web Audio, Profile switch). Notifications do not exist. |
| L19 Browser autofill colors | L19 | Done | no | 1315e68, `input:-webkit-autofill` rules in `src/styles.css`. |
| L20 Home "See all" links and max 6 per section | L20 | Partly | no | 1315e68: tasks capped at 6 with "See all N tasks"; notes show 3 with "All notes". Folders row is not capped. |
| L21 Habits | L21 | Not built | yes | See Habits above. |
| L22 Desktop UI broken; Q hard to discover; quick add looks like search | L22 | Open | yes | O12. Get screenshots of what is broken. |
| L23 Button below empty state illustrations | L23 | Partly | yes | Notes and Folders empty states have buttons; Home, Tasks, folder page and detail pane do not. Reflect in design first. |
| L24 Scrollbar floating off | L24 | Done | no | 1315e68: task detail pane scrollbar sits inside the rounded card. Verify on other panels. |
| L25 Task list vs grid toggle | L25 | Not built | yes | |
| L26 Google OAuth options | L26 | Open | yes | See Google sign in above. |
| **Known bugs** | | | | |
| Plain bullet mixed into a checklist shows no bullet marker | Bug | Open | no | Note preview CSS. |
| Home nav item stays amber | Bug | Verify | no | Seen before the icon revert. |
| Task detail renders twice at `/tasks/$id` (pane and mobile copy, one hidden by CSS), so ids like `title-{taskId}` are duplicated | Review | Open | no | `src/components/TasksPage.tsx`. Playwright must filter to visible elements. |
| Rail (768 to 1023): Profile link and Scratchpad button have no accessible name (their text uses `.app-sidebar-extra`, display none) | Review | Open | no | Add `aria-label`. Verify with axe. |
| Deleted task or note comes back if the page reloads within the 4.2s Undo window | Review | Open | no | Server delete is deferred until the toast ends. |
| Checklist tick and note delete not verified on the live site | Bug | Verify | no | Worked locally. |
| "Remind me" switch is a no op | Bug | Open | no | See Reminders. |
| Home icon, splash, desktop layout issues from Emmanuel's 7 screenshots | Bug | Verify | no | Screenshots in `/root/.claude/uploads/7777ea7f-77ff-5569-bbc7-a1ca89aa92f8/` (may be gone). |
| "Sidebar should not affect the bottom nav" | Bug | Open | no | O10, never confirmed. |
| Note editor was a stub | Bug | Done | no | c314e6b. |
| Subtask tick returned 400 (extra `taskId` in body) | Bug | Done | no | c314e6b. |
| `G N` opened the scratchpad | Bug | Done | no | c314e6b. |
| Profile unreachable on phones | Bug | Done | no | b78d366, profile link in the phone Home header. |
| Task menus rendered under later rows | Bug | Done | no | 1315e68, portal. |
