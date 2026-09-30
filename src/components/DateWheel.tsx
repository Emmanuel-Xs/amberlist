import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react'
import { createPortal } from 'react-dom'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import type { MotionValue } from 'motion/react'
import { useTasks } from '#/lib/api'
import {
  addDays,
  daysBetween,
  formatDay,
  parseISO,
  toISODate,
} from '#/lib/dates'
import { SPRING_GLIDE, SPRING_SOFT } from '#/lib/motion'
import { Icon } from '#/ui/icons'
import { Button, IconButton } from '#/ui/zen'

/*
 * Date wheel (round 3 board 16, approved 2026-09-30).
 * Days sit on a 3D cylinder. One motion value `rot` (in days, 0 = today) drives every card's
 * transform through useTransform, so spinning never re-renders React per frame; React only
 * re-renders when the centred day changes or the rendered window of cards shifts.
 */

const cx = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(' ')

interface Geometry {
  cw: number
  step: number
  theta: number
  R: number
}

function geometry(phone: boolean): Geometry {
  const cw = phone ? 54 : 64
  const step = cw + (phone ? 8 : 12)
  const theta = phone ? 13 : 9.5
  const R = step / 2 / Math.tan(((theta / 2) * Math.PI) / 180)
  return { cw, step, theta, R }
}

const PHONE_MQ = '(max-width: 767px)'
function usePhone() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(PHONE_MQ)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(PHONE_MQ).matches,
    () => false,
  )
}

const longDate = (iso: string) =>
  parseISO(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
const tasksWord = (n: number) => (n === 1 ? '1 task' : `${n} tasks`)
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v))

/** Where the "Nothing planned" card sits, in days after the last day (a bit further: it is wider). */
const END_OFFSET = 1.7

export function DateWheel({
  value,
  onChange,
}: {
  value: string
  onChange: (iso: string) => void
}) {
  const { data: tasks = [] } = useTasks()
  const today = useMemo(() => toISODate(new Date()), [])
  const phone = usePhone()
  const flat = useReducedMotion() === true
  const g = useMemo(() => geometry(phone), [phone])

  // Open tasks per day, same rule as Home (isOnDay): today holds everything started on or before today.
  const { counts, oldest, last } = useMemo(() => {
    const map = new Map<string, number>()
    let low = 0
    let end: string | null = null
    for (const t of tasks) {
      if (t.status === 'done') continue
      const start = t.startDate ?? t.dueDate
      if (start) {
        const k = start <= today ? today : start
        map.set(k, (map.get(k) ?? 0) + 1)
      }
      if (t.dueDate && t.dueDate < today)
        low = Math.min(low, daysBetween(today, t.dueDate))
      for (const d of [t.startDate, t.dueDate])
        if (d && (!end || d > end)) end = d
    }
    return { counts: map, oldest: low, last: end }
  }, [tasks, today])

  // The picker (or a value set from outside) can jump past the range; the wheel then stretches to it.
  const valueIdx = daysBetween(today, value)
  const [ext, setExt] = useState({ min: valueIdx, max: valueIdx })
  if (valueIdx < ext.min || valueIdx > ext.max)
    setExt({
      min: Math.min(ext.min, valueIdx),
      max: Math.max(ext.max, valueIdx),
    })
  const lastIdx = last ? daysBetween(today, last) : 0
  const minI = Math.min(-7, oldest, ext.min)
  const maxI = Math.max(3, lastIdx + 3, ext.max)
  const bounds = useRef({ minI, maxI })
  bounds.current = { minI, maxI }

  const rot = useMotionValue(valueIdx)
  const [hi, setHi] = useState(valueIdx)
  const [win, setWin] = useState(valueIdx)
  const winRef = useRef(valueIdx)
  const anim = useRef<ReturnType<typeof animate> | null>(null)
  const target = useRef<number | null>(valueIdx)
  const committed = useRef(valueIdx)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const clampSoft = useCallback((r: number) => {
    const { minI: lo, maxI: hiI } = bounds.current
    if (r < lo) return lo - (lo - r) * 0.3
    if (r > hiI) return hiI + (r - hiI) * 0.3
    return r
  }, [])

  // Follow the wheel: centred day while dragging, re-centre the rendered window every few days.
  useMotionValueEvent(rot, 'change', (r) => {
    const c = Math.round(r)
    if (Math.abs(c - winRef.current) >= 3) {
      winRef.current = c
      setWin(c)
    }
    if (target.current === null) {
      const { minI: lo, maxI: hiI } = bounds.current
      setHi(clamp(c, lo, hiI))
    }
  })

  const commit = useCallback(
    (i: number) => {
      committed.current = i
      const iso = addDays(today, i)
      onChangeRef.current(iso)
    },
    [today],
  )

  const stop = () => {
    anim.current?.stop()
    anim.current = null
  }

  /** Spin to a whole day with the glide spring (or jump there under reduced motion). */
  const goTo = useCallback(
    (i: number, opts: { commit?: boolean; velocity?: number } = {}) => {
      stop()
      target.current = i
      setHi(i)
      if (opts.commit !== false) commit(i)
      if (flat) {
        rot.set(i)
        return
      }
      // Far jumps (picker, Today from weeks away): start a couple of weeks out so it still reads as a spin.
      const from = rot.get()
      if (Math.abs(i - from) > 14) rot.jump(i - Math.sign(i - from) * 14)
      anim.current = animate(rot, i, {
        ...SPRING_GLIDE,
        velocity: opts.velocity ?? 0,
      })
    },
    [commit, flat, rot],
  )

  // A value changed from outside (not by the wheel) spins the wheel to it without calling back.
  useEffect(() => {
    if (valueIdx !== committed.current) {
      committed.current = valueIdx
      goTo(valueIdx, { commit: false })
    }
  }, [valueIdx, goTo])

  useEffect(() => () => anim.current?.stop(), [])

  // ---------- pointer: drag follows the finger, a flick keeps spinning with its speed ----------
  const stageRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{
    id: number
    x0: number
    r0: number
    moving: boolean
    samples: { x: number; t: number }[]
  } | null>(null)
  const dragged = useRef(false)

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    stop()
    dragged.current = false
    drag.current = {
      id: e.pointerId,
      x0: e.clientX,
      r0: rot.get(),
      moving: false,
      samples: [{ x: e.clientX, t: e.timeStamp }],
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x0
    if (!d.moving) {
      if (Math.abs(dx) < 6) return
      d.moving = true
      dragged.current = true
      target.current = null
      try {
        stageRef.current?.setPointerCapture(e.pointerId)
      } catch {
        /* pointer already gone */
      }
    }
    d.samples.push({ x: e.clientX, t: e.timeStamp })
    if (d.samples.length > 6) d.samples.shift()
    rot.set(clampSoft(d.r0 - dx / g.step))
  }
  const release = (e: React.PointerEvent, cancelled: boolean) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (!d.moving) return
    // Velocity from the last ~100 ms of movement, in days per second (0 if the finger rested).
    const now = e.timeStamp
    const recent = d.samples.filter((s) => now - s.t < 100)
    let v = 0
    if (!cancelled && recent.length > 1) {
      const a = recent[0]
      const b = recent[recent.length - 1]
      const dt = Math.max(1, b.t - a.t) / 1000
      v = clamp(-(b.x - a.x) / g.step / dt, -60, 60)
    }
    const { minI: lo, maxI: hiI } = bounds.current
    const from = rot.get()
    const to = clamp(Math.round(from + v * 0.3), lo, hiI)
    target.current = to
    setHi(to)
    if (to !== committed.current) commit(to)
    if (flat) {
      rot.set(to)
      return
    }
    stop()
    anim.current =
      from < lo || from > hiI
        ? animate(rot, to, { ...SPRING_GLIDE, velocity: v })
        : animate(rot, to, {
            type: 'inertia',
            velocity: v,
            power: 0.3,
            timeConstant: 200,
            modifyTarget: () => to,
            min: lo,
            max: hiI,
            restDelta: 0.001,
          })
  }

  // ---------- wheel and trackpad (non passive so the page doesn't scroll under it) ----------
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (!d) return
      e.preventDefault()
      const px = e.deltaMode === 1 ? d * 16 : e.deltaMode === 2 ? d * 400 : d
      stop()
      target.current = null
      rot.set(clampSoft(rot.get() + px / 90))
      clearTimeout(wheelTimer.current)
      wheelTimer.current = setTimeout(() => {
        const { minI: lo, maxI: hiI } = bounds.current
        const to = clamp(Math.round(rot.get()), lo, hiI)
        goTo(to, { commit: to !== committed.current })
      }, 120)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      clearTimeout(wheelTimer.current)
    }
  }, [clampSoft, commit, goTo, rot])

  // ---------- keyboard: roving focus on the centred day ----------
  const listRef = useRef<HTMLDivElement>(null)
  const keyNav = useRef(false)
  const onKeyDown = (e: ReactKeyboardEvent) => {
    const base = target.current ?? hi
    const step: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      PageUp: -7,
      PageDown: 7,
    }
    let to: number | null = null
    if (e.key in step) to = base + step[e.key]
    else if (e.key === 'Home') to = 0
    else if (e.key === 'End') to = maxI
    if (to === null) return
    e.preventDefault()
    keyNav.current = true
    goTo(clamp(to, minI, maxI))
  }
  useEffect(() => {
    if (!keyNav.current) return
    keyNav.current = false
    listRef.current
      ?.querySelector<HTMLElement>(`[data-i="${hi}"]`)
      ?.focus({ preventScroll: true })
  }, [hi])

  const pick = useCallback(
    (i: number) => {
      if (dragged.current) return
      goTo(i)
    },
    [goTo],
  )

  // Announce the chosen day, but not on first paint.
  const [said, setSaid] = useState('')
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const n = counts.get(value) ?? 0
    setSaid(
      `${value === today ? 'Today, ' : ''}${longDate(value)}${n ? `, ${tasksWord(n)}` : ', nothing planned'}`,
    )
  }, [value])

  // ---------- picker ----------
  const [pickerOpen, setPickerOpen] = useState(false)
  const dateBtn = useRef<HTMLButtonElement>(null)
  const closePicker = useCallback(() => {
    setPickerOpen(false)
    dateBtn.current?.focus()
  }, [])
  const pickDay = useCallback(
    (iso: string) => {
      closePicker()
      const i = daysBetween(today, iso)
      setExt((x) => ({ min: Math.min(x.min, i), max: Math.max(x.max, i) }))
      bounds.current = {
        minI: Math.min(bounds.current.minI, i),
        maxI: Math.max(bounds.current.maxI, i),
      }
      goTo(i)
    },
    [closePicker, goTo, today],
  )

  // ---------- render ----------
  const radius = Math.ceil(90 / g.theta) + 4
  const cards: number[] = []
  for (
    let i = Math.max(minI, win - radius);
    i <= Math.min(maxI, win + radius);
    i++
  )
    cards.push(i)
  const showEnd = maxI + END_OFFSET - win <= radius
  const label = value === today ? `Today, ${formatDay(value)}` : longDate(value)
  const endText = `Nothing planned after ${last && last > today ? formatDay(last) : 'today'}`
  const labelId = useId()

  return (
    <section className="dw" aria-labelledby={labelId}>
      <h2 id={labelId} className="sr-only">
        Pick a day
      </h2>
      <div className="dw-head">
        <button
          ref={dateBtn}
          type="button"
          className="dw-date-btn"
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          onClick={() => (pickerOpen ? closePicker() : setPickerOpen(true))}
        >
          <Icon name="calendar" size={18} />
          <span>{label}</span>
          <Icon name="chevronDown" size={16} />
        </button>
        <div className="dw-head-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(0)}
            aria-pressed={value === today}
          >
            Today
          </Button>
          <IconButton
            label="Previous week"
            icon="chevronRight"
            iconSize={18}
            className="dw-arrow dw-arrow--prev"
            onClick={() => goTo(clamp((target.current ?? hi) - 7, minI, maxI))}
          />
          <IconButton
            label="Next week"
            icon="chevronRight"
            iconSize={18}
            className="dw-arrow"
            onClick={() => goTo(clamp((target.current ?? hi) + 7, minI, maxI))}
          />
        </div>
        <AnimatePresence>
          {pickerOpen && (
            <MonthPicker
              key="picker"
              phone={phone}
              value={value}
              today={today}
              counts={counts}
              anchor={dateBtn}
              onClose={closePicker}
              onPick={pickDay}
            />
          )}
        </AnimatePresence>
      </div>

      <div
        ref={stageRef}
        className={cx('dw-stage', flat && 'dw-stage--flat')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => release(e, false)}
        onPointerCancel={(e) => release(e, true)}
        onScroll={(e) => {
          // Focus can scroll an overflow:hidden box; keep it pinned.
          e.currentTarget.scrollLeft = 0
        }}
      >
        <div
          ref={listRef}
          className="dw-cyl"
          role="listbox"
          aria-label="Pick a day"
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
          style={flat ? undefined : { transform: `translateZ(${-g.R}px)` }}
        >
          {cards.map((i) => {
            const iso = addDays(today, i)
            const n = counts.get(iso) ?? 0
            return (
              <WheelCard
                key={`${i}-${phone}-${flat}`}
                i={i}
                rot={rot}
                g={g}
                flat={flat}
                iso={iso}
                count={n}
                isToday={i === 0}
                centred={i === hi}
                selected={i === valueIdx}
                onPick={pick}
              />
            )
          })}
          {showEnd && (
            <EndCard pos={maxI + END_OFFSET} rot={rot} g={g} flat={flat}>
              {endText}
            </EndCard>
          )}
        </div>
        <div className="dw-fade" aria-hidden="true" />
      </div>
      <p className="sr-only" aria-live="polite">
        {said}
      </p>
    </section>
  )
}

function useCardStyle(
  pos: number,
  rot: MotionValue<number>,
  g: Geometry,
  flat: boolean,
) {
  const transform = useTransform(() => {
    const d = pos - rot.get()
    return flat
      ? `translateX(${d * g.step}px)`
      : `rotateY(${d * g.theta}deg) translateZ(${g.R}px)`
  })
  const opacity = useTransform(() => {
    if (flat) return 1
    const a = Math.abs((pos - rot.get()) * g.theta)
    return a > 88 ? 0 : Math.max(0.15, Math.cos((a * Math.PI) / 180))
  })
  return { transform, opacity }
}

const WheelCard = memo(function WheelCard({
  i,
  rot,
  g,
  flat,
  iso,
  count,
  isToday,
  centred,
  selected,
  onPick,
}: {
  i: number
  rot: MotionValue<number>
  g: Geometry
  flat: boolean
  iso: string
  count: number
  isToday: boolean
  centred: boolean
  selected: boolean
  onPick: (i: number) => void
}) {
  const style = useCardStyle(i, rot, g, flat)
  const dt = parseISO(iso)
  const weekday = dt.toLocaleDateString('en-GB', { weekday: 'short' })
  return (
    <motion.div
      role="option"
      data-i={i}
      aria-selected={selected}
      aria-label={`${isToday ? 'Today, ' : ''}${longDate(iso)}${count ? `, ${tasksWord(count)}` : ''}`}
      tabIndex={centred ? 0 : -1}
      className={cx(
        'dw-card',
        centred && 'is-selected',
        isToday && 'is-today',
        count > 0 && 'has-tasks',
      )}
      style={{ ...style, width: g.cw, marginLeft: -g.cw / 2 }}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onPick(i)}
    >
      <span className="dw-face" aria-hidden="true" />
      <span className="dw-day">{dt.getDate()}</span>
      <span className="dw-wd">{isToday ? 'Today' : weekday}</span>
      <span className="dw-dot" aria-hidden="true" />
    </motion.div>
  )
})

function EndCard({
  pos,
  rot,
  g,
  flat,
  children,
}: {
  pos: number
  rot: MotionValue<number>
  g: Geometry
  flat: boolean
  children: string
}) {
  const style = useCardStyle(pos, rot, g, flat)
  const w = g.cw * 2
  return (
    <motion.div
      className="dw-end"
      aria-hidden="true"
      style={{ ...style, width: w, marginLeft: -w / 2 }}
    >
      {children}
    </motion.div>
  )
}

// ---------- month picker: bottom sheet on phones, popover from 768 ----------

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

function monthStart(iso: string) {
  return `${iso.slice(0, 7)}-01`
}

function MonthPicker({
  phone,
  value,
  today,
  counts,
  anchor,
  onClose,
  onPick,
}: {
  phone: boolean
  value: string
  today: string
  counts: Map<string, number>
  anchor: RefObject<HTMLButtonElement | null>
  onClose: () => void
  onPick: (iso: string) => void
}) {
  const [focusDay, setFocusDay] = useState(value)
  const month = monthStart(focusDay)
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  const first = parseISO(month)
  const lead = (first.getDay() + 6) % 7
  const len = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const title = first.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  // Focus the chosen day on open and whenever arrow keys move it.
  const moved = useRef(true)
  useEffect(() => {
    if (!moved.current) return
    moved.current = false
    panel.current
      ?.querySelector<HTMLElement>(`[data-day="${focusDay}"]`)
      ?.focus()
  }, [focusDay])

  // Esc, focus trap, click outside (popover), scroll lock (sheet).
  useEffect(() => {
    const el = panel.current
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
      }
      if (e.key === 'Tab' && el) {
        const els = Array.from(
          el.querySelectorAll<HTMLElement>('button:not([disabled])'),
        ).filter((b) => b.tabIndex >= 0)
        if (!els.length) return
        const a = els[0]
        const z = els[els.length - 1]
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault()
          z.focus()
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault()
          a.focus()
        } else if (!el.contains(document.activeElement)) {
          e.preventDefault()
          a.focus()
        }
      }
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (el?.contains(t) || anchor.current?.contains(t)) return
      closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    if (!phone) document.addEventListener('pointerdown', onDown)
    const overflow = document.body.style.overflow
    if (phone) document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
      document.body.style.overflow = overflow
    }
  }, [phone, anchor])

  const move = (iso: string) => {
    moved.current = true
    setFocusDay(iso)
  }
  const shiftMonth = (n: number) => {
    const d = parseISO(focusDay)
    const target = new Date(d.getFullYear(), d.getMonth() + n, 1)
    const last = new Date(target.getFullYear(), target.getMonth() + 1, 0)
    const day = Math.min(d.getDate(), last.getDate())
    const iso = addDays(
      `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-01`,
      day - 1,
    )
    setFocusDay(iso)
  }
  const onGridKey = (e: ReactKeyboardEvent) => {
    const step: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    }
    if (e.key in step) {
      e.preventDefault()
      move(addDays(focusDay, step[e.key]))
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault()
      moved.current = true
      shiftMonth(e.key === 'PageUp' ? -1 : 1)
    }
  }

  const cells = []
  for (let k = 0; k < lead; k++)
    cells.push(<span key={`b${k}`} aria-hidden="true" />)
  for (let n = 1; n <= len; n++) {
    const iso = addDays(month, n - 1)
    const c = counts.get(iso) ?? 0
    const dow = WEEKDAY_NAMES[(lead + n - 1) % 7]
    cells.push(
      <button
        key={iso}
        type="button"
        data-day={iso}
        tabIndex={iso === focusDay ? 0 : -1}
        aria-pressed={iso === value}
        aria-current={iso === today ? 'date' : undefined}
        aria-label={`${iso === today ? 'Today, ' : ''}${dow} ${formatDay(iso)}${c ? `, ${tasksWord(c)}` : ''}`}
        className={cx(
          'dw-cal-day',
          iso === value && 'is-selected',
          iso === today && 'is-today',
          c > 0 && 'has-tasks',
        )}
        onClick={() => onPick(iso)}
      >
        <span>{n}</span>
        <span className="dw-cal-dot" aria-hidden="true" />
      </button>,
    )
  }

  const body = (
    <motion.div
      ref={panel}
      role="dialog"
      aria-modal={phone ? 'true' : undefined}
      aria-labelledby={titleId}
      className={cx('dw-cal', phone ? 'dw-cal--sheet' : 'dw-cal--pop')}
      initial={phone ? { y: 48, opacity: 0 } : { scale: 0.96, opacity: 0 }}
      animate={phone ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1 }}
      exit={phone ? { y: 48, opacity: 0 } : { scale: 0.96, opacity: 0 }}
      transition={SPRING_SOFT}
    >
      {phone && <span className="zn-sheet-grip" aria-hidden="true" />}
      <div className="dw-cal-head">
        <h2 id={titleId} className="dw-cal-title" aria-live="polite">
          {title}
        </h2>
        <div className="dw-cal-nav">
          <IconButton
            label="Previous month"
            icon="chevronRight"
            iconSize={18}
            className="dw-arrow dw-arrow--prev"
            onClick={() => shiftMonth(-1)}
          />
          <IconButton
            label="Next month"
            icon="chevronRight"
            iconSize={18}
            className="dw-arrow"
            onClick={() => shiftMonth(1)}
          />
        </div>
      </div>
      <div className="dw-cal-grid dw-cal-wd" aria-hidden="true">
        {WEEKDAYS.map((w, k) => (
          <span key={k}>{w}</span>
        ))}
      </div>
      <div
        className="dw-cal-grid"
        role="group"
        aria-label={title}
        onKeyDown={onGridKey}
      >
        {cells}
      </div>
      <div className="dw-cal-foot">
        <span>
          <span className="dw-cal-dot is-legend" aria-hidden="true" /> Days with
          tasks
        </span>
        <Button variant="ghost" size="sm" onClick={() => onPick(today)}>
          Go to today
        </Button>
      </div>
    </motion.div>
  )

  if (!phone) return body
  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="dw-cal-layer">
      <motion.div
        className="zn-scrim"
        style={{ position: 'fixed' }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      {body}
    </div>,
    document.body,
  )
}
