import { PresenceContext, motion, useReducedMotion } from 'motion/react'
import { sound } from '#/lib/feedback'
import { SPRING_POP, TICK_CHECK_MS } from '#/lib/motion'

// A comb cell on the 24 grid, shared by the sparks.
const CELL = 'M12 2.4 20.31 7.2v9.6L12 21.6 3.69 16.8V7.2Z'
const SPARKS = [
  [-90, 'accent'],
  [-30, 'butter'],
  [30, 'accent'],
  [90, 'peach'],
  [150, 'accent'],
  [210, 'mint'],
] as const

/** Plays "complete" when the check lands, not on the click (instant under reduced motion). */
export function tickSound() {
  if (typeof window === 'undefined') return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) sound('complete')
  else setTimeout(() => sound('complete'), TICK_CHECK_MS)
}

/**
 * The inside of a tick circle (design board 13): honey rises with a little wave, the check draws
 * and pops, six comb cell sparks flick out and fade (~0.6 s). `animate` is true only for the tick
 * the user just made; otherwise a done circle is simply full. Render inside a `position: relative`
 * round button. Reduced motion: the circle fills at once, no sparks.
 */
export function TickFill({
  done,
  animate,
  size = 22,
  checkSize = 14,
  fill = 'var(--accent)',
  ink = 'var(--on-accent)',
}: {
  done: boolean
  animate: boolean
  size?: number
  checkSize?: number
  fill?: string
  ink?: string
}) {
  const reduce = useReducedMotion() ?? false
  if (!done) return null
  const play = animate && !reduce
  const spread = size * 1.15
  const spark = Math.max(7, size * 0.36)
  return (
    // Rows live in <AnimatePresence initial={false}>, whose context would also skip the initial
    // state of anything mounted inside them later. The tick is always a fresh mount, so reset it.
    <PresenceContext.Provider value={null}>
      <span className="tick-honey" aria-hidden="true">
        {play ? (
          <motion.svg
            className="tick-honey-wave"
            viewBox="0 0 48 36"
            preserveAspectRatio="none"
            initial={{ x: '0%', y: '100%' }}
            animate={{ x: '-25%', y: '0%' }}
            transition={{ duration: 0.3, ease: [0.3, 0.7, 0.35, 1] }}
          >
            <path
              d="M0 5q3-3 6 0t6 0 6 0 6 0 6 0 6 0 6 0 6 0V36H0Z"
              fill={fill}
            />
          </motion.svg>
        ) : (
          <span className="tick-honey-full" style={{ background: fill }} />
        )}
      </span>
      <motion.svg
        aria-hidden="true"
        width={checkSize}
        height={checkSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={ink}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="tick-check"
        initial={play ? { scale: 0.55 } : false}
        animate={{ scale: 1 }}
        transition={{ ...SPRING_POP, delay: TICK_CHECK_MS / 1000 }}
      >
        <motion.path
          d="M20 6 9 17l-5-5"
          initial={play ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 0.16,
            ease: 'easeOut',
            delay: TICK_CHECK_MS / 1000,
          }}
        />
      </motion.svg>
      {play && (
        <span className="tick-sparks" aria-hidden="true">
          {SPARKS.map(([angle, color], i) => (
            <span
              key={angle}
              className="tick-spark-arm"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <motion.svg
                width={spark}
                height={spark}
                viewBox="0 0 24 24"
                style={{ marginLeft: -spark / 2, marginTop: -spark / 2 }}
                initial={{ x: 0, scale: 0, opacity: 0 }}
                animate={{
                  x: [0, spread * 0.85, spread],
                  scale: [0, 1, 0.2],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 0.36,
                  times: [0, 0.45, 1],
                  ease: [0.15, 0.8, 0.3, 1],
                  delay: 0.23 + i * 0.012,
                }}
              >
                <path
                  d={CELL}
                  fill={`var(--${color})`}
                  stroke="var(--on-pastel)"
                  strokeWidth={2.6}
                  strokeLinejoin="round"
                />
              </motion.svg>
            </span>
          ))}
        </span>
      )}
    </PresenceContext.Provider>
  )
}
