# Decisions and backlog (raw recovery, 29 Sep 2026)

Sources: PRD (`prd.md`), DS (`design-system.md`), transcripts (`/root/.claude/projects/-home-claude-amberlist/7777ea7f-...jsonl`, `/root/.claude/projects/-home-claude/7777ea7f-...jsonl`), repo git log.

## Decisions made
- **Name:** Amberlist (working name) → **Honeylist** (18:49 WAT, AskUserQuestion "Honeylist (Recommended)"; amberlist.vercel.app was taken).
- **URLs:** live https://honeylist.vercel.app (old https://amberlist-one.vercel.app still works). Repo https://github.com/Emmanuel-Xs/honeylist (renamed from amberlist, redirects). Vercel project "honeylist", auto deploy on push to main.
- **Logo:** hex honeycomb cell, soft corners, inner comb lattice, check made of 5 filled comb cells, drop "Just let go" (detached, small stub). Rejected directions: dripping checkbox, honey dipper check, bee trail, honey h, comb list; drip variants A to D; check styles 1b/2/3/4. Used in sidebar, rail, phone Home header, profile footer, 404 ("That page has let go"), favicon, apple icon, manifest 192/512, OG image, README, splash.
- **Splash:** logo drop forms and falls, min 900ms, finishes current cycle before fading, reduced motion safe.
- **Stack:** TanStack Start v1 (React 19, Vite 8, Nitro, Vercel), Router, Query (optimistic), Store, Form, Hotkeys, Pacer; Tailwind v4 + Zen tokens (`src/tokens.css`, `src/zen.css`); lucide-react; react-markdown + remark-gfm + rehype-sanitize; Zod v4 strict; Vitest (40 tests at last run); Drizzle on node-postgres `pg` Pool (Neon via Vercel Storage) in prod, PGlite locally/tests. shadcn/ui was in PRD/DS but NOT actually used; user now wants shadcn components where they exist ("before creating a component check if shadcn has it").
- **Auth:** Better Auth anonymous guest per browser (Stage 1). Google sign in = Phase 2 (provider wired only if env vars set). Env: BETTER_AUTH_SECRET, DATABASE_URL (BETTER_AUTH_URL optional; trustedOrigins from VERCEL_* vars).
- **Nudge rule:** "after 2 tasks then after 3 days of use"; dismissible card on Home only, max one per session, stops after sign in. Google link upgrades guest in place; merge prompt if Google account already has data (Merge default / Discard).
- **Phases (PRD):** Stage 1 (shipped, submitted on Zedu) → Phase 2: habits, repeating tasks, Google sign in + nudges + merge, reminders, welcome screen, just in time tips, shortcut sheet → Phase 3: AI break down task, AI note to tasks, polish, PWA install/offline.
- **AI provider:** free tier first, Groq (fast, no card), Gemini Flash backup, via Vercel AI SDK; 20 calls/user/day; user taps to run; only selected item sent.
- **Categories:** shown as desktop style folder cards; defaults Personal, Work, Study; 5 pastels; one level only; delete moves contents to Inbox.
- **Tasks model:** start date (plan) vs due date (deadline); in progress set automatically on first subtask tick or Start button; long running tasks show every day until done.
- **Product principles:** simple surface, Home grows with user, never interrupt flow, capture in seconds, desktop first class; don't make it complex or overwhelming.
- **Design gate:** user must approve designs before code; any change contrary to the design needs his approval (restated 22:38). Workflow: keep md context files updated as we go; user will test with Playwright in Claude Code; "always grill-me when my choices doesn't make sense".
- **Writing style:** casual, concise, no dashes.

## Built in Stage 1 + fixes (for reference)
Guest session; tasks CRUD with quick add parser (#folder, !priority, dates, times); groups Overdue/Today/Tomorrow/This week/Later/Inbox/Completed; subtasks; task detail pane on desktop; create form; notes list + editor (markdown, checklists, autosave, pin, color, link task, duplicate, delete+Undo); scratchpad (N) with Make task / Make note; folders; progressive Home with DateStrip, Today cards, overdue banner; profile (name, theme, sounds switch, export JSON, delete all with typed DELETE); shortcuts Q, C, N, ?, G H/T/N; toasts with Undo; sounds; confetti when day done; skeletons; SEO meta/OG/JSON-LD; CSP/HSTS; rate limit 120/min; 404 page; splash; bottom nav hides on scroll; honeycomb nav icons + logo illustrations (b78d366, to be reverted).

## Not built yet (planned in PRD or chat)
### Phase 2 (PRD)
- Google sign in (Better Auth Google provider, Google Cloud OAuth client, env vars), "Guest" badge + "Save your data with Google" in profile, nudge cards (2nd task, 3 days), link guest in place, merge prompt dialog, `mergeGuestData`.
- Habits: `/habits`, `/habits/$id`, fields (name, icon, category, frequency daily/weekdays/X per week, goal days or ongoing, reminder time), one tap check in, streaks (current, best, total), "Day 19 of 21", heatmap, Home Habits row, habit goal confetti, habit tables `habit`, `habitCheckin`. Phone bottom bar was meant to include Habits.
- Repeating tasks (none/daily/weekdays/weekly/monthly; completing creates next; `repeatRule`).
- Reminders/notifications: "Remind me" switch exists and saves `remind` but NOTHING notifies; ask notification permission only when first switched on. User asked "is our notification working" → no.
- Onboarding welcome screen: "What should we call you?" + dark/light pick, skippable, no tour. User 22:38: Home greeting without name looks weird → needs name onboarding.
- Just in time tips (quick add syntax, `- [ ]` first note, streak rules, shortcuts after a few desktop sessions); `seenTips`, `nudgeState` prefs.
- Keyboard shortcut sheet exists (?); `/` search and `G F` folders and `Esc` shortcuts from PRD: verify.
- Guest cleanup job (90 days inactive).
- Privacy note in settings.
### Phase 3
- AI break down task, AI turn note/scratchpad into tasks, PWA (offline read, "You're offline" banner), polish.
### Other PRD items not done / unverified
- "Day 4 of 21" progress label for long running tasks (not found in code).
- "+ Add a habit" / "+ New folder" links at foot of Home.
- View Transitions page crossfade; sitemap.xml; Playwright e2e + axe scans; Lighthouse ≥90; CI e2e; `npm audit` in CI; drizzle-kit migrations (app uses DDL string); TanStack Devtools; Tooltips on icon buttons.
- Route `/settings` in PRD shipped as `/profile`.

## User's 22:38 list (all NOT DONE)
1. Name onboarding (greeting without name looks weird).
2. PRD gap review: add everything discussed; keep `context/` md files updated as we go.
3. Revert the icon changes (honeycomb nav icons). Revisit icons: new from scratch or current, must not look alike.
4. Go back to the design, especially illustrations; show designs and get approval before changes.
5. Confirmation for destructive actions (incl. deleting a task, even completing?); "DELETE" text bold and red. Folder delete flow?
6. Ugly "three dots at the edge" (overflow menu placement, see screenshots).
7. Subtle micro interactions; app lively and fun: first task → confetti + bee animation; Duolingo style toasts for create, complete, overdue; tell user what's happening on completion.
8. Toast placement rules: when modal vs top/left/right.
9. Splash must transition smoothly into the app.
10. Animations janky on mobile and too fast; stretch durations; decide on a motion library (e.g. Motion) vs CSS.
11. Calendar/DateStrip ugly on desktop: less rounded pills; smooth, speed sensitive (momentum) scroll bounded to last task date + ~3 days.
12. shadcn components on mobile and desktop where available.
13. Double outline on inputs/icons (focus); notes textarea double outline too glaring, make subtle.
14. Hover titles/tooltips on icons, styled to DS.
15. Note/folder color picker: easier on the eyes, good contrast, allow custom colors.
16. Bug: keyboard repeatedly pops up on mobile (auto focus on task/notes when a page opens). Question: is auto focus good UX? (Likely: don't auto focus on touch.)
17. Priority: why only high shows a flag (PRD: default medium hidden; show high and low).
18. Verify notifications and sounds work.
19. Browser autofill colors on inputs: match DS or remove.
20. Home: "See all" for notes and others should link to their pages; max 6 items per section.
21. Habits: where are they (Phase 2).
22. Desktop UI broken; how to add task via keyboard (Q) is hard to discover; quick add on desktop looks like search because + is on the left; add focus styling / move +.
23. Button below empty state illustrations, reflected in design first.
24. Scrollbar "floating off" bug.
25. Task list vs grid view toggle.
26. Google OAuth sign in (Phase 2) options to be looked into.

## Open questions
- "Sidebar should not be affecting the bottom nav" interpretation never confirmed.
- Completion confirmation vs Undo toast conflicts with DS principle "Undo instead of confirmations"; needs a grilled decision.
- Motion library choice; toast position system; icon direction; calendar pill radius value.
- Bee animation style (fit with honey brand).
- Custom colors vs token only rule (contrast checks for user colors).
- Does Home Habits tab replace Folders in phone bar (PRD says Home, Tasks, +, Notes, Habits; app has Home, Tasks, Notes, Folders + profile).
- HNG team repo structure/branch requirement (PRD open question).

## Known bugs / rough edges
- Plain bullet mixed into a checklist shows no bullet marker (noted, left).
- Home nav icon stays amber (noted, left).
- Mobile keyboard auto popping; double outlines; scrollbar floating; janky mobile animations; desktop UI broken (per user, screenshots in `/root/.claude/uploads/7777ea7f-77ff-5569-bbc7-a1ca89aa92f8/`).
- Checklist tick and note delete not verified on live site (only locally).
- Remind switch is a no-op.
- Fixed earlier: notes editor stub, subtask PATCH 400 (extra taskId in body), G N opening scratchpad, profile unreachable on phones.
