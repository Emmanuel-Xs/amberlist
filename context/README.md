# Context folder

What we planned, what is built, and what is still open for **Honeylist** (tasks, notes, scratchpad, folders; HNG 15). Read this before touching code. It exists because earlier sessions lost track of decisions; keep it true.

## Reading order

1. [README.md](README.md): this file, the working rules.
2. [backlog.md](backlog.md): every open item and its status. Start here to pick work.
3. [decisions.md](decisions.md): what was decided, what is still open. Beats the PRD when they disagree.
4. [design-system.md](design-system.md): tokens, rules, illustrations, motion, toasts, destructive actions, and **Pending proposals** (things that need Emmanuel's approval).
5. `features/*.md`: one file per feature with status, files, known issues and Playwright steps.
6. [testing.md](testing.md): run locally, Vitest suites, Playwright plan.
7. [prd.md](prd.md): the full approved PRD (verbatim). Reference, not a status report.
8. [changelog.md](changelog.md): notable commits.
9. `_raw/`: the recovery notes and source exports these files came from. Read only, never edit.

## Working rules

1. **Design approval first.** Any UI change that departs from the approved design (the Zen Todo design system plus the Amberlist Screens canvas) needs Emmanuel's approval **before** it is coded. Show it as a design (an artifact, a canvas board or screenshots), not a description. If a feature has no approved design yet, design it and get a yes first. Small fixes that bring the app back in line with the approved design do not need approval.
2. **shadcn check before building a component.** Before writing a new UI component, check whether shadcn/ui has one (Dialog, Sheet, Tooltip, Popover, DropdownMenu, AlertDialog, Toast/Sonner, Calendar and so on). If it does, use it styled with our tokens. This is a **pending decision** (the app today uses hand written ports in `src/ui/zen.tsx` and AGENTS.md forbids new UI kits); see [decisions.md](decisions.md) O1 and confirm the approach with Emmanuel before the first shadcn install.
3. **Docs in the same commit.** Update the md files here (feature file status, backlog row, decisions, changelog) in the same commit as the code change.
4. **Grill Emmanuel.** When a request or choice doesn't make sense (conflicts with the PRD, the design, accessibility, or an earlier decision), say so and ask before building. He asked for this explicitly.
5. **Checks before done.** Run and report `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. For UI work also run the Playwright flows in [testing.md](testing.md) at 390, 820 and 1440 px in both themes.

Also follow `AGENTS.md` at the repo root (stack, security, tokens only, accessibility, tests for every endpoint).

## Original artifacts

- PRD (Claude Doc "Amberlist PRD", rev 19): https://claude.ai/artifact/BM7ZxCREPS5oyh8zQJb7hK
- Design system "Zen Todo": https://claude.ai/artifact/3XQD4Ko6NbjtsMWkJLpC3d
- Screens canvas "Amberlist Screens" (approved designs, 10 screens per size plus component and state boards): https://claude.ai/artifact/Q59DbcQdiSXB7p3KTYsmYn
- Round 2 proposals canvas (awaiting Emmanuel's picks, 2026-09-29): https://claude.ai/artifact/QU7Aoqa4rk5YCFSN34xtHa . Boards 1 to 12: onboarding, quick add, message placement, friendly messages, first task bee, date strip, rows/priority/tooltips/grid, confirmations, note colours, icons, splash and motion, empty states. Source in `_raw/source/round2/`.
- Local copies: `_raw/source/zen-todo-ds/` (DS README, tokens, component readmes and bundle) and `_raw/source/screens-canvas/*.dc.html` (canvas boards).
- Live app: https://honeylist.vercel.app. Repo: https://github.com/Emmanuel-Xs/honeylist.

## Writing style for these files

Concise, bullets, casual. No dashes as punctuation in prose: use commas or colons. Dates as `2026-09-29`, times in WAT.
