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

## Where things live

- Splash hand off: `src/components/Splash.tsx` (logo flies to `.app-brand .logo-mark` or `.phone-header .logo-mark`).
- Toasts: `src/components/Toaster.tsx`.
- Tick and glide: `useTicked` in `src/components/useTaskActions.ts`, `layoutId` wrappers in `src/components/TasksPage.tsx`.
- Page transitions: `src/router.tsx` plus the `::view-transition-*` rules at the end of `src/styles.css`.
