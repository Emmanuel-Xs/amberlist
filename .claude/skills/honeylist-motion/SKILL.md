---
name: honeylist-motion
description: Honeylist's motion rules. Use with the motion skill whenever you animate anything in this repo (page transitions, lists, toasts, celebrations, the splash, the date wheel).
---

# Honeylist motion

Calm app, lively moments. Motion explains what happened; it never decorates.

## Tools

- **Motion for React** (`motion/react`) for anything inside a page: springs, `AnimatePresence`, `layout`/`layoutId`, drag with inertia, motion values. Never import `framer-motion`.
- **Native View Transitions** for page changes, set on the router (`defaultViewTransition` in `src/router.tsx`). Only the content (`.app-content`, `view-transition-name: page`) animates; the nav never moves. Picking a task inside the same section does not animate the page.
- **Plain CSS** for hovers, focus and tiny state changes (150 to 200 ms).
- The general Motion skill lives in `.claude/skills/motion` (from `npx motion-ai`); the Motion MCP server is in `.mcp.json`.

## Tokens (`src/lib/motion.ts`)

| Token | Value | Use |
|---|---|---|
| `SPRING_SOFT` | visualDuration 0.32, bounce 0.18 | toasts, sheets, small moves |
| `SPRING_POP` | visualDuration 0.35, bounce 0.4 | check pop, badges |
| `SPRING_GLIDE` | visualDuration 0.45, bounce 0.1 | rows moving between groups, date wheel settle |
| `TICK_HOLD_MS` | 450 | hold after a tick before the row moves |

Approved timings (design board 11, 2026-09-30): tick 350 ms, row glide 400 ms, page crossfade 250 to 300 ms, sheet 320 ms, dialog 260 ms, toast in 280 ms, celebrations 1.8 s (tap to skip), bottom bar hide 300 ms. These are longer than the design system's old 300 ms cap on purpose; Emmanuel approved it.

## Rules

1. `<MotionConfig reducedMotion="user">` wraps the app (`src/routes/__root.tsx`). With reduced motion: no movement, no particles, keep colour/opacity changes and sounds.
2. Animate `transform` and `opacity` only. Never animate height on long lists; use `layout="position"`.
3. `initial={false}` on lists and `AnimatePresence` so hydration and first paint don't replay animations.
4. Never read a motion value during render; drive styles with `useTransform`.
5. Everything is interruptible: springs, not fixed tweens, for anything the user can trigger again.
6. Restraint: small feedback on every action, big celebrations only for firsts and "all done today". Never confetti for an ordinary tick.
7. Sound fires at the moment of impact (the check landing), from `src/lib/feedback.ts`, only after a user action.
8. Test on a phone viewport (390, touch). If it stutters there, cut it.
9. Any new motion that changes the approved design needs Emmanuel's approval first (see `context/README.md`).

## Celebrations (design board 13, built)

Built from the logo: honey, comb cells, the drop. Particles are comb cells (amber plus pastels, on-pastel outline). All are non blocking (`pointer-events: none`) and a tap or key press skips the big two.

| Moment | Where | Spec |
|---|---|---|
| Every tick | `TickFill` in `src/components/TickFill.tsx`, inside every `.zn-check` (rows, grid cards, subtasks, Today cards) | Honey (svg wave, 200% wide) rises 0 to 300 ms clipped to the circle; check `pathLength` 0 to 1 plus scale 0.55 to 1 with `SPRING_POP` at `TICK_CHECK_MS` (200); six comb sparks at -90, -30, 30, 90, 150, 210 deg fly out ~1.15x the circle size from 230 ms and fade by ~600 ms. `tickSound()` plays `complete` at 200 ms. Then `TICK_HOLD_MS` and the glide. |
| First task ever | `celebrateFirstTask(id)` in `src/components/Celebrate.tsx`, from `QuickAdd` and `CreateTask` when `isFirstTask(qc)` | Canvas. Waits for `[data-task-check=id]` on screen, +220 ms. Drop forms 240 px above the circle (0 to 220 ms), hangs, falls ease-in (320 to 820 ms) stretching, tracking the circle live; lands just inside the circle top: squash 120 ms, ring to 3.2r in 400 ms, 10 cells burst (gravity 1500 px/s², fade over the last 45%). Toast at 1.1 s, end 1.7 s. Circle stays unticked. |
| All done today | `celebrateAllDone()` then `CelebrateHost` (in `Toaster`) | Seconds: cells fill 0.12 + i x 0.17 (order: short stroke, then up the long one, `SPRING_POP` scaleY from the bottom); seal 1.05: hex scale 0.4 to 1 (spring bounce 0.45), comb lattice fades in, cells cross fade to on-accent, `sound('celebrate')`; tear 1.3 to 1.85: one path from the hex bottom tip (32, 50) grows a neck and drop, pinches off at 75% leaving `STUB_PATH`, the detached drop settles 3.6 units into `DROP_PATH`; close 2.05, fade 0.25. `role="status"` "All done for today". |

- Reduced motion: tick fills at once, no sparks; first task shows only the toast; all done shows the final logo still, then closes. Sounds stay.
- Gotcha: `<AnimatePresence initial={false}>` passes `initial: false` down through PresenceContext for as long as the child lives, so a motion element mounted later inside a list row skips its `initial`. Wrap such late mounts in `<PresenceContext.Provider value={null}>` (see `TickFill`).
- Never generic confetti for tasks; `confetti()` was removed.

## Where things live

- Splash hand off: `src/components/Splash.tsx` (logo flies to `.app-brand .logo-mark` or `.phone-header .logo-mark`).
- Toasts: `src/components/Toaster.tsx`.
- Tick and glide: `TickFill` (`src/components/TickFill.tsx`), `useTicked` in `src/components/useTaskActions.ts`, `layoutId` wrappers in `src/components/TasksPage.tsx`.
- Celebrations: `src/components/Celebrate.tsx` (first task canvas, all done seal and its host).
- Page transitions: `src/router.tsx` plus the `::view-transition-*` rules at the end of `src/styles.css`.
