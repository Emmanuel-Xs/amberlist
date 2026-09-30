import type { Transition } from 'motion/react'

/**
 * Honeylist motion tokens (see .claude/skills/honeylist-motion/SKILL.md).
 * Springs use visualDuration so timings read like durations; bounce stays low: calm, not cartoony.
 */
export const SPRING_SOFT: Transition = {
  type: 'spring',
  visualDuration: 0.32,
  bounce: 0.18,
}
export const SPRING_POP: Transition = {
  type: 'spring',
  visualDuration: 0.35,
  bounce: 0.4,
}
export const SPRING_GLIDE: Transition = {
  type: 'spring',
  visualDuration: 0.45,
  bounce: 0.1,
}
/** Hold after a tick before the row moves away, so the check is seen (Things 3 does ~500 ms). */
export const TICK_HOLD_MS = 450
/** When the check lands inside a tick (honey rises first); the complete sound plays here. */
export const TICK_CHECK_MS = 200
