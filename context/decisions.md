# Decisions

Made decisions are numbered D1, D2...; open ones O1, O2... Add new entries with a date. When an open decision is settled, move it up to Made with the date and who decided. All times WAT.

## Made

| # | Date | Decision | Notes |
| --- | --- | --- | --- |
| D1 | 2026-09-29 | **Stack:** TanStack Start v1 (React 19, Vite, Nitro on Vercel), Router, Query (optimistic), Store, Form, Hotkeys, Pacer; Tailwind v4 plus Zen tokens (`src/tokens.css`, `src/zen.css`); lucide-react; react-markdown + remark-gfm + rehype-sanitize; Zod v4 strict; Vitest; Drizzle on Postgres (Neon via Vercel Storage in prod, PGlite locally and in tests); Better Auth. | Emmanuel asked for TanStack Start and "any other of their package necessary". shadcn/ui was named in the PRD and DS but was **not** used; see O1. |
| D2 | 2026-09-29 | **Guest first auth:** Better Auth anonymous user per browser, no sign up. Google sign in is Phase 2 (provider only wired when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set). | Env: `BETTER_AUTH_SECRET`, `DATABASE_URL`, optional `BETTER_AUTH_URL`, `TRUSTED_ORIGINS`. |
| D3 | 2026-09-29 | **Save nudge timing:** after the 2nd task, then after 3 days of use. Dismissible card on Home only, max one per session, stops after sign in. Google link upgrades the guest in place; if the Google account already has data, ask Merge (default) or Discard. | Emmanuel: "after 2 tasks then after 3 days of use". Not built. |
| D4 | 2026-09-29 | **Tasks model:** start date (plan) vs due date (deadline). In progress is set on the first subtask tick or by Start. Long running tasks show every day until done. | "Day 4 of 21" label planned, not built. |
| D5 | 2026-09-29 | **Categories are folders:** desktop style folder cards, defaults Personal, Work, Study, 5 pastels, one level, deleting moves contents to Inbox. | |
| D6 | 2026-09-29 | **Progressive Home:** sections appear only once used. Principle: never make the app complex or overwhelming. | |
| D7 | 2026-09-29 | **Product principles:** simple surface, Home grows with the user, never interrupt flow, capture in seconds, desktop first class. | |
| D8 | 2026-09-29 | **Phasing:** Stage 1 (shipped and submitted on Zedu), Phase 2 (habits, repeating tasks, Google sign in with nudges and merge, reminders, welcome screen, tips, shortcut sheet), Phase 3 (AI breakdown, AI note to tasks, polish, PWA). | |
| D9 | 2026-09-29 | **AI provider (Phase 3):** free tier first, Groq (fast, no card), Gemini Flash backup, via Vercel AI SDK. 20 calls per user per day, user taps to run, only the selected item is sent. | |
| D10 | 2026-09-29 18:49 | **Name:** Amberlist (working name) renamed to **Honeylist** (amberlist.vercel.app was taken). Live https://honeylist.vercel.app, old https://amberlist-one.vercel.app still works. Repo renamed to Emmanuel-Xs/honeylist. | Chosen via "Honeylist (Recommended)". |
| D11 | 2026-09-29 19:24 | **Logo:** hex honeycomb cell with soft corners, inner comb lattice, a check made of 5 filled comb cells, and the "Just let go" detached honey drop. Used in sidebar, rail, phone Home header, profile footer, 404, favicon, app icons, OG image, README, splash. | Rejected: dripping checkbox, honey dipper, bee trail, honey h, comb list, drip variants A to D, check styles 1b/2/3/4. |
| D12 | 2026-09-29 19:24 | **Splash:** the logo drop forms and falls; always finishes the current drop before fading; reduced motion safe. | Emmanuel wants a smoother hand off into the app (pending, see design-system.md). |
| D13 | 2026-09-29 | `/settings` from the PRD shipped as **`/profile`**. | |
| D14 | 2026-09-29 22:38 | **Design gate:** Emmanuel approves designs before code; any change contrary to the approved design needs his approval, shown as a design. | Restated after b78d366 shipped honeycomb icons and logo illustrations without approval. |
| D15 | 2026-09-29 22:38 | **Revert** the honeycomb nav icons (back to lucide) and the logo based empty state illustrations (back to the DS originals). Remove row and page animations (janky on phones). | Done in 1315e68. Icons still to be revisited (O5). |
| D16 | 2026-09-29 22:38 | **Workflow:** keep these md files updated as we go; Emmanuel tests with Playwright in Claude Code; "always grill me when my choices don't make sense". | |
| D17 | 2026-09-29 22:38 | **"DELETE" in the typed confirm is bold and red.** | Done in 1315e68 (`.confirm-word`). |
| D18 | 2026-09-29 | **No auto focus on touch** except in dialogs whose point is typing (fields marked `data-autofocus`). | Fixes the phone keyboard popping up. Done in 1315e68. Answer to Emmanuel's "is auto focus good UX": no, not on touch. |
| D19 | 2026-09-29 | **Home caps tasks at 6** (4 Today cards plus 2 rows) with a "See all N tasks" link. | Done in 1315e68. Notes show 3 with "All notes". |
| D20 | 2026-09-29 | **Writing style:** casual, concise, no dashes. | Applies to UI copy and docs. |

## Open

| # | Raised | Question | Current state / leaning |
| --- | --- | --- | --- |
| O1 | 2026-09-29 22:38 | **shadcn/ui:** Emmanuel wants shadcn components "on mobile and desktop where necessary" and "before creating a component check if shadcn has it". AGENTS.md currently says no other UI kit and the app uses hand written ports in `src/ui/zen.tsx`. | Proposal: adopt shadcn (Radix based) for behavior heavy pieces (Dialog, AlertDialog, Sheet, DropdownMenu, Popover, Tooltip, Sonner toasts, Calendar), restyled with Zen tokens via the shadcn variable mapping in design-system.md. Confirm scope and update AGENTS.md before the first install. |
| O2 | 2026-09-29 22:38 | **Confirmations vs Undo:** Emmanuel wants confirmation for destructive actions, including deleting a task and maybe completing one. The PRD and DS say "Undo instead of confirmations". | Leaning: confirm delete folder and delete all (already), keep Undo for complete, ask whether single task delete gets a confirm or a longer Undo. Needs a grilled decision. |
| O3 | 2026-09-29 22:38 | **Motion library:** Motion (framer) vs CSS only. Animations felt janky on phones and too fast; he wants them stretched so people see them. | Row and page motion removed in 1315e68. Decide library and new durations with a design demo. |
| O4 | 2026-09-29 22:38 | **Toast placement:** when a message should be a modal vs top vs left vs right. | Today: bottom center above the phone bar, bottom left beside rail/sidebar. Propose rules with the Duolingo style toast design. |
| O5 | 2026-09-29 22:38 | **Icon direction:** new set from scratch or keep lucide; nav icons must not look alike. | Lucide restored. Needs design options. |
| O6 | 2026-09-29 22:38 | **DateStrip radius:** less rounded pills on desktop, and how bounded momentum scroll should work (last task date plus about 3 days). | Needs a design. |
| O7 | 2026-09-29 22:38 | **Bee animation** for the first task: style that fits the honey brand. | Needs a design. |
| O8 | 2026-09-29 22:38 | **Custom colors** for notes and folders vs the tokens only rule (contrast of user colors). | Proposal: a curated extended palette with checked on-color, plus custom hex with auto ink (dark or light) chosen by contrast. |
| O9 | 2026-09-29 | **Phone bottom bar:** PRD says Home, Tasks, +, Notes, Habits; app has Home, Tasks, +, Notes, Folders (profile in the Home header). Does Habits replace Folders when habits ship? | Undecided. |
| O10 | 2026-09-29 18:49 | "The side bar should not be affecting the bottom nav": interpreted as the page scrollbar beside the phone bar (hidden under 768 px in 14b0815). | Never confirmed by Emmanuel. Ask. |
| O11 | 2026-09-29 22:38 | **Priority display:** only High shows a flag. PRD says default medium is hidden, show high and low. | Leaning: show Low with a quiet icon and word. Needs design. |
| O12 | 2026-09-29 22:38 | **Quick add on desktop looks like search** (the + sits on the left). Move the +, add a clear focus state, and make Q discoverable. | Needs a design. |
| O13 | 2026-09-29 | Does the HNG team repo need a specific structure or branch? | PRD open question, unanswered. |
