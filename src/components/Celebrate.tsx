import { useEffect, useId } from 'react'
import { Store, useStore } from '@tanstack/react-store'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import type { QueryClient } from '@tanstack/react-query'
import { qk } from '#/lib/api'
import type { Task } from '#/lib/api'
import { sound } from '#/lib/feedback'
import { SPRING_POP } from '#/lib/motion'
import { toast } from '#/lib/store'
import { CELLS, DROP_PATH, HEX_PATH, STUB_PATH } from '#/ui/logo-data'

/*
 * The two big moments from design board 13, built from the logo itself:
 * - First task ever: a honey drop falls onto the new row's tick circle, splashes, comb cells burst.
 * - All done for today: the check's five cells fill one by one, the comb seals into the logo and
 *   the drop tears away from the hexagon's bottom tip.
 * Both are non blocking (pointer-events: none) and a tap or key press anywhere skips them.
 */

const FIRST_KEY = 'honeylist-first-task'
const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------- First task ever ----------

function firstSeen() {
  try {
    return localStorage.getItem(FIRST_KEY) === '1'
  } catch {
    return false
  }
}
function markFirstSeen() {
  try {
    localStorage.setItem(FIRST_KEY, '1')
  } catch {
    // Private mode: the task count check still keeps it to the first task.
  }
}

/**
 * Call before creating a task: true when this person has no tasks yet (the server's list is loaded
 * and empty) and hasn't had the celebration on this device.
 */
export function isFirstTask(qc: QueryClient) {
  const tasks = qc.getQueryData<Task[]>(qk.tasks)
  return !!tasks && tasks.length === 0 && !firstSeen()
}

const firstToast = () =>
  toast({
    tone: 'success',
    silent: true,
    badge: 'logo',
    message: 'Your first task is in',
    detail: "Nice start. Tick it when it's done.",
  })

/** Finds the new task's tick circle on screen, then drops honey on it. The circle stays unticked. */
export function celebrateFirstTask(taskId: string) {
  markFirstSeen()
  if (typeof window === 'undefined' || reducedMotion()) {
    firstToast()
    return
  }
  const started = performance.now()
  const find = () => {
    for (const el of document.querySelectorAll<HTMLElement>(
      `[data-task-check="${CSS.escape(taskId)}"]`,
    )) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.bottom > 0 && r.top < window.innerHeight) return el
    }
    return null
  }
  const wait = () => {
    const el = find()
    // Let the row land from the quick add first.
    if (el) setTimeout(() => dropOn(el), 220)
    else if (performance.now() - started < 1500) requestAnimationFrame(wait)
    else firstToast()
  }
  requestAnimationFrame(wait)
}

// Drop shape from the design, tip up, 18 wide; (0, 11.5) is its bottom.
const DROP_D = 'M0 -14c0 0-9 11-9 16.5a9 9 0 0 0 18 0C9 -3 0 -14 0 -14z'
const DROP_BOTTOM = 11.5
// Burst targets from the prototype: [dx, peak dy, colour, size].
const BURST: [number, number, string, number][] = [
  [-60, -70, 'accent', 11],
  [-20, -92, 'butter', 9],
  [24, -84, 'accent', 12],
  [62, -60, 'peach', 8],
  [-86, -34, 'mint', 8],
  [90, -30, 'accent', 10],
  [-40, -40, 'lavender', 7],
  [44, -36, 'sky', 7],
  [4, -110, 'accent', 8],
  [110, -64, 'butter', 7],
]
const T_FORM = 220
const T_HANG = 320
const T_HIT = 820
const T_TOAST = 1100
const T_END = 1700
const GRAVITY = 1500 // px/s²

function hexPath(c: CanvasRenderingContext2D, size: number) {
  c.beginPath()
  for (let k = 0; k < 6; k++) {
    const a = ((-90 + 60 * k) * Math.PI) / 180
    const x = (Math.cos(a) * size) / 2
    const y = (Math.sin(a) * size) / 2
    if (k === 0) c.moveTo(x, y)
    else c.lineTo(x, y)
  }
  c.closePath()
}

function dropOn(target: HTMLElement) {
  const W = window.innerWidth
  const H = window.innerHeight
  const dpr = window.devicePixelRatio || 1
  const cv = document.createElement('canvas')
  cv.width = W * dpr
  cv.height = H * dpr
  cv.setAttribute('aria-hidden', 'true')
  cv.className = 'celebrate-canvas'
  cv.style.width = `${W}px`
  cv.style.height = `${H}px`
  document.body.appendChild(cv)
  const c = cv.getContext('2d')
  if (!c) {
    cv.remove()
    firstToast()
    return
  }
  c.scale(dpr, dpr)
  // Built here, not at import: Path2D doesn't exist during server rendering.
  const DROP = new Path2D(DROP_D)
  const cs = getComputedStyle(document.documentElement)
  const color = (name: string) => cs.getPropertyValue(`--${name}`).trim()
  const ink = color('on-pastel')
  const circle = () => {
    const r = target.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 }
  }
  let hit = circle()
  const k = Math.max(0.8, Math.min(1.3, (hit.r * 2) / 22)) * 0.85
  const startY = Math.max(24, hit.y - 240)
  const cells = BURST.map(([dx, dy, col, size]) => {
    const vy = -Math.sqrt(2 * GRAVITY * Math.abs(dy))
    const tPeak = -vy / GRAVITY
    return {
      vx: (dx * 1.1) / (tPeak * 1.6),
      vy,
      size,
      fill: color(col),
      spin: (dx / 40) * Math.PI,
    }
  })

  let toasted = false
  let done = false
  const start = performance.now()
  const finish = () => {
    if (done) return
    done = true
    cv.remove()
    window.removeEventListener('pointerdown', finish, true)
    window.removeEventListener('keydown', finish, true)
    if (!toasted) firstToast()
  }
  window.addEventListener('pointerdown', finish, true)
  window.addEventListener('keydown', finish, true)

  const drawDrop = (x: number, y: number, sx: number, sy: number, a = 1) => {
    c.save()
    c.globalAlpha = a
    c.translate(x, y)
    c.scale(sx * k, sy * k)
    c.translate(0, -DROP_BOTTOM)
    c.fillStyle = color('accent')
    c.fill(DROP)
    c.lineWidth = 1.5 / k
    c.strokeStyle = ink
    c.stroke(DROP)
    c.globalAlpha = a * 0.35
    c.fillStyle = color('bg')
    c.beginPath()
    c.ellipse(-3, 1, 2, 3.4, 0, 0, Math.PI * 2)
    c.fill()
    c.restore()
  }

  const frame = (now: number) => {
    if (done) return
    const t = now - start
    c.clearRect(0, 0, W, H)
    if (t < T_HIT) hit = circle()
    // The drop's bottom lands just inside the top of the circle.
    const landY = hit.y - hit.r * 0.25
    if (t < T_FORM) {
      const e = 1 - (1 - t / T_FORM) ** 2
      drawDrop(hit.x, startY, 0.2 + 0.8 * e, 0.2 + 0.8 * e, e)
    } else if (t < T_HANG) {
      drawDrop(hit.x, startY, 1, 1)
    } else if (t < T_HIT) {
      const e = ((t - T_HANG) / (T_HIT - T_HANG)) ** 2
      drawDrop(hit.x, startY + (landY - startY) * e, 1 - 0.2 * e, 1 + 0.35 * e)
    } else {
      const s = (t - T_HIT) / 1000
      // Squash and fade on impact.
      if (s < 0.12) {
        const q = s / 0.12
        drawDrop(hit.x, landY, 1.7 + 0.5 * q, 0.45 - 0.25 * q, 1 - q)
      }
      // A ring spreading from the circle.
      if (s < 0.4) {
        const q = s / 0.4
        c.save()
        c.globalAlpha = 1 - q
        c.strokeStyle = color('accent')
        c.lineWidth = 2
        c.beginPath()
        c.arc(
          hit.x,
          hit.y,
          hit.r * (1 + 2.2 * (1 - (1 - q) ** 2)),
          0,
          Math.PI * 2,
        )
        c.stroke()
        c.restore()
      }
      // Comb cells burst out of the circle and fall.
      const life = (T_END - T_HIT) / 1000
      for (const p of cells) {
        const x = hit.x + p.vx * s
        const y = hit.y + p.vy * s + 0.5 * GRAVITY * s * s
        const grow = Math.min(1, s / 0.08)
        const fade = s > life * 0.55 ? 1 - (s - life * 0.55) / (life * 0.45) : 1
        c.save()
        c.globalAlpha = Math.max(0, fade)
        c.translate(x, y)
        c.rotate(p.spin * s)
        c.scale(grow, grow)
        hexPath(c, p.size)
        c.fillStyle = p.fill
        c.fill()
        c.lineWidth = 1.3
        c.lineJoin = 'round'
        c.strokeStyle = ink
        c.stroke()
        c.restore()
      }
    }
    if (!toasted && t >= T_TOAST) {
      toasted = true
      firstToast()
    }
    if (t < T_END) requestAnimationFrame(frame)
    else finish()
  }
  requestAnimationFrame(frame)
}

// ---------- All done for today ----------

const celebration = new Store({ run: 0, open: false })

/** The last task due today is done: seal the comb. */
export function celebrateAllDone() {
  celebration.setState((s) => ({ run: s.run + 1, open: true }))
}

/** Mounted once (in the Toaster) so any screen can play the all done seal. */
export function CelebrateHost() {
  const run = useStore(celebration, (s) => s.run)
  const open = useStore(celebration, (s) => s.open)
  // Only this run may close itself, so a late timer never ends a newer celebration.
  const close = () =>
    celebration.setState((s) => (s.run === run ? { ...s, open: false } : s))
  return (
    <AnimatePresence>
      {open && <AllDoneSeal key={run} onDone={close} />}
    </AnimatePresence>
  )
}

// Seconds, from design board 13.
const CELL_START = 0.12
const CELL_STEP = 0.17
const SEAL = 1.05
const TEAR = 1.3
const TEAR_LEN = 0.55
const CLOSE = 2.05
const DETACH = 0.75
// Fill order of the check's cells: the short stroke first, then up the long one.
const ON = CELLS.filter((c) => c.on).map((c) => c.p)
const CHECK_ORDER = [ON[2], ON[4], ON[3], ON[1], ON[0]]
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Honey stretching out of the hexagon's bottom tip (32, 50) until it pinches off.
 * Before DETACH it is one shape (tip, thinning neck, growing drop); after, only the stub remains.
 */
function tearPath(p: number) {
  if (p >= DETACH) return STUB_PATH
  const q = p / DETACH
  const w0 = 4
  const m = lerp(50.5, 56.5, q)
  const cy = lerp(52.5, 64.5, q)
  const R = lerp(1.5, 5, q)
  const n = lerp(3.2, 0.3, q ** 1.3)
  const f = (v: number) => v.toFixed(2)
  const mid = m + (cy - R - m) * 0.6
  const top = 49 + (m - 49) * 0.5
  return [
    `M${f(32 - w0)} 49`,
    `C${f(32 - w0 * 0.4)} ${f(top)} ${f(32 - n)} ${f(m - 0.8)} ${f(32 - n)} ${f(m)}`,
    `C${f(32 - n)} ${f(mid)} ${f(32 - R)} ${f(cy - R * 0.9)} ${f(32 - R)} ${f(cy)}`,
    `A${f(R)} ${f(R)} 0 0 0 ${f(32 + R)} ${f(cy)}`,
    `C${f(32 + R)} ${f(cy - R * 0.9)} ${f(32 + n)} ${f(mid)} ${f(32 + n)} ${f(m)}`,
    `C${f(32 + n)} ${f(m - 0.8)} ${f(32 + w0 * 0.4)} ${f(top)} ${f(32 + w0)} 49Z`,
  ].join('')
}

function AllDoneSeal({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion() ?? false
  const clipId = `seal-${useId().replace(/:/g, '')}`
  const tear = useMotionValue(reduce ? 1 : 0)
  const neck = useTransform(() => tearPath(tear.get()))
  const dropShown = useTransform(() => (tear.get() >= DETACH ? 1 : 0))
  // The detached drop starts where the neck let go (centre 64.5) and settles into the logo (68.1).
  const dropY = useTransform(tear, [DETACH, 1], [-3.6, 0])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const later = (s: number, fn: () => void) =>
      timers.push(setTimeout(fn, s * 1000))
    if (reduce) {
      sound('celebrate')
      later(1.6, onDone)
    } else {
      later(SEAL, () => sound('celebrate'))
      later(CLOSE, onDone)
    }
    const run = reduce
      ? undefined
      : animate(tear, 1, {
          delay: TEAR,
          duration: TEAR_LEN,
          ease: [0.45, 0, 0.7, 1],
        })
    const skip = () => onDone()
    window.addEventListener('pointerdown', skip, true)
    window.addEventListener('keydown', skip, true)
    return () => {
      timers.forEach(clearTimeout)
      run?.stop()
      window.removeEventListener('pointerdown', skip, true)
      window.removeEventListener('keydown', skip, true)
    }
    // Runs once per celebration (each run is a fresh mount keyed by its number).
  }, [])

  const at = (s: number) => (reduce ? 0 : s)
  return (
    <motion.div
      className="celebrate-seal"
      initial={{ opacity: reduce ? 0 : 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
    >
      <motion.div
        className="celebrate-seal-glow"
        aria-hidden="true"
        initial={reduce ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: at(SEAL - 0.1), duration: 0.5 }}
      />
      <svg
        className="celebrate-seal-mark"
        viewBox="-6 -1 76 76"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={HEX_PATH} />
          </clipPath>
        </defs>
        {/* The comb blooms behind the filled cells at the seal. */}
        <motion.path
          d={HEX_PATH}
          fill="var(--accent)"
          stroke="var(--accent)"
          strokeWidth={10}
          strokeLinejoin="round"
          initial={reduce ? false : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            scale: {
              type: 'spring',
              visualDuration: 0.4,
              bounce: 0.45,
              delay: at(SEAL),
            },
            opacity: { duration: 0.15, delay: at(SEAL) },
          }}
        />
        <motion.g
          clipPath={`url(#${clipId})`}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: at(SEAL + 0.12), duration: 0.35 }}
        >
          {CELLS.filter((c) => !c.on).map((c) => (
            <polygon
              key={c.p}
              points={c.p}
              fill="none"
              stroke="var(--on-accent)"
              strokeWidth={1.2}
              opacity={0.22}
            />
          ))}
        </motion.g>
        {/* Honey from the tip: stretches, pinches off, leaves the stub. */}
        <motion.path
          d={neck}
          fill="var(--accent)"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: at(TEAR - 0.1), duration: 0.1 }}
        />
        <motion.path
          d={DROP_PATH}
          fill="var(--accent)"
          style={{ opacity: dropShown, y: dropY }}
        />
        {CHECK_ORDER.map((p, i) => (
          <g key={p}>
            {!reduce && (
              <motion.polygon
                points={p}
                fill="none"
                stroke="var(--line-strong)"
                strokeWidth={1}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: SEAL - 0.05, duration: 0.2 }}
              />
            )}
            <motion.g
              style={{ originY: 1 }}
              initial={reduce ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ ...SPRING_POP, delay: CELL_START + i * CELL_STEP }}
            >
              <polygon
                points={p}
                fill="var(--accent)"
                stroke="var(--accent)"
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
              {/* As the comb shows, the check cells turn dark: it becomes the logo. */}
              <motion.polygon
                points={p}
                fill="var(--on-accent)"
                stroke="var(--on-accent)"
                strokeWidth={1.6}
                strokeLinejoin="round"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: at(SEAL + 0.08), duration: 0.3 }}
              />
            </motion.g>
          </g>
        ))}
      </svg>
      <motion.p
        className="celebrate-seal-text"
        role="status"
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: at(SEAL + 0.15), duration: 0.35 }}
      >
        All done for today
      </motion.p>
    </motion.div>
  )
}
