// Habit streak maths. Pure: pass the rule, the check-in dates (local YYYY-MM-DD) and today.
import { addDays, parseISO } from './dates'

export type HabitFrequency = 'daily' | 'weekdays' | 'x_per_week'

export interface HabitRule {
  frequency: HabitFrequency
  /** ISO weekdays (1 Mon to 7 Sun) for 'weekdays'. Empty or missing means Monday to Friday. */
  daysOfWeek?: number[] | null
  /** Check ins a week for 'x_per_week'. Missing means 3. */
  timesPerWeek?: number | null
  /** Check ins needed to reach the goal, or null for ongoing. */
  goalDays?: number | null
}

export interface HabitStats {
  /** Current streak: scheduled days in a row, or weeks in a row for 'x_per_week'. */
  current: number
  best: number
  /** Every check in up to today, scheduled or not. */
  total: number
  unit: 'day' | 'week'
  doneToday: boolean
  /** Check ins so far this ISO week (Monday to Sunday). */
  thisWeek: number
  /** "Day 19 of 21": check ins so far, capped at the goal. */
  goal: { day: number; of: number; reached: boolean } | null
}

export const WEEKDAYS = [1, 2, 3, 4, 5]
export const MILESTONES = [3, 7, 21]
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** 1 for Monday through 7 for Sunday. */
export function isoWeekday(iso: string): number {
  const d = parseISO(iso).getDay()
  return d === 0 ? 7 : d
}

/** The Monday that starts the ISO week containing `iso`. */
export function weekStart(iso: string): string {
  return addDays(iso, 1 - isoWeekday(iso))
}

function daysOf(rule: HabitRule): number[] {
  return rule.daysOfWeek?.length ? rule.daysOfWeek : WEEKDAYS
}

/** True when the habit expects a check in on this day. 'x_per_week' habits can be done any day. */
export function isScheduled(rule: HabitRule, iso: string): boolean {
  if (rule.frequency !== 'weekdays') return true
  return daysOf(rule).includes(isoWeekday(iso))
}

/** The last scheduled day before `iso`. */
function prevScheduled(rule: HabitRule, iso: string): string {
  let d = addDays(iso, -1)
  for (let i = 0; i < 7 && !isScheduled(rule, d); i++) d = addDays(d, -1)
  return d
}

export function habitStats(
  rule: HabitRule,
  checkins: Iterable<string>,
  today: string,
): HabitStats {
  const done = new Set<string>()
  for (const d of checkins) if (d <= today) done.add(d)
  const sorted = [...done].sort()
  const weekOf = weekStart(today)
  const thisWeek = sorted.filter((d) => d >= weekOf).length
  const total = done.size
  const goal = rule.goalDays
    ? {
        day: Math.min(total, rule.goalDays),
        of: rule.goalDays,
        reached: total >= rule.goalDays,
      }
    : null

  if (rule.frequency === 'x_per_week') {
    const need = rule.timesPerWeek ?? 3
    const perWeek = new Map<string, number>()
    for (const d of sorted) {
      const w = weekStart(d)
      perWeek.set(w, (perWeek.get(w) ?? 0) + 1)
    }
    const met = [...perWeek.entries()]
      .filter(([, n]) => n >= need)
      .map(([w]) => w)
      .sort()
    const runAt = new Map<string, number>()
    let best = 0
    for (const w of met) {
      const run = (runAt.get(addDays(w, -7)) ?? 0) + 1
      runAt.set(w, run)
      best = Math.max(best, run)
    }
    // This week still counts as open until Sunday, so an unfinished week never breaks the streak.
    const current = runAt.get(weekOf) ?? runAt.get(addDays(weekOf, -7)) ?? 0
    return {
      current,
      best,
      total,
      unit: 'week',
      doneToday: done.has(today),
      thisWeek,
      goal,
    }
  }

  const runAt = new Map<string, number>()
  let best = 0
  for (const d of sorted) {
    if (!isScheduled(rule, d)) continue
    const run = (runAt.get(prevScheduled(rule, d)) ?? 0) + 1
    runAt.set(d, run)
    best = Math.max(best, run)
  }
  // Today is still open: not checking in yet keeps yesterday's streak alive.
  const anchor = isScheduled(rule, today) ? today : prevScheduled(rule, today)
  const current =
    runAt.get(anchor) ??
    (anchor === today ? (runAt.get(prevScheduled(rule, today)) ?? 0) : 0)
  return {
    current,
    best,
    total,
    unit: 'day',
    doneToday: done.has(today),
    thisWeek,
    goal,
  }
}

/** The milestone just reached (3, 7 or 21), when a check in moved the streak onto one. */
export function milestoneReached(before: number, after: number): number | null {
  return after > before && MILESTONES.includes(after) ? after : null
}

export interface WeekDot {
  date: string
  /** One letter: M T W T F S S. */
  letter: string
  label: string
  done: boolean
  scheduled: boolean
  isToday: boolean
  future: boolean
}

/** Monday to Sunday of the current week, for the dots under each habit. */
export function weekDots(
  rule: HabitRule,
  checkins: Iterable<string>,
  today: string,
): WeekDot[] {
  const done = new Set(checkins)
  const start = weekStart(today)
  return DAY_SHORT.map((label, i) => {
    const date = addDays(start, i)
    return {
      date,
      letter: label[0],
      label,
      done: done.has(date),
      scheduled: isScheduled(rule, date),
      isToday: date === today,
      future: date > today,
    }
  })
}

/** "Every day", "Weekdays", "Mon, Wed, Fri" or "3 times a week". */
export function frequencyLabel(rule: HabitRule): string {
  if (rule.frequency === 'daily') return 'Every day'
  if (rule.frequency === 'x_per_week') {
    const n = rule.timesPerWeek ?? 3
    return n === 1 ? 'Once a week' : `${n} times a week`
  }
  const days = [...daysOf(rule)].sort((a, b) => a - b)
  if (days.join() === WEEKDAYS.join()) return 'Weekdays'
  if (days.join() === '6,7') return 'Weekends'
  if (days.length === 7) return 'Every day'
  return days.map((d) => DAY_SHORT[d - 1]).join(', ')
}

/** "12 days", "1 day", "3 weeks". */
export function streakLabel(n: number, unit: 'day' | 'week'): string {
  return `${n} ${unit}${n === 1 ? '' : 's'}`
}
