import { addDays, daysBetween, parseISO, toISODate } from './dates'

/**
 * Repeating tasks. `days` uses JS weekdays: 0 is Sunday, 6 is Saturday.
 * One open task per series: finishing (or skipping) one makes the next.
 */
export type RepeatRule =
  | { kind: 'daily' }
  | { kind: 'weekdays' }
  | { kind: 'weekly'; days: number[]; interval?: number }
  | { kind: 'monthly'; day?: number }
  | { kind: 'every'; unit: 'day' | 'week'; interval: number; days?: number[] }

/** `count` is how many are left, this one included. */
export type RepeatEnd =
  | { kind: 'never' }
  | { kind: 'on'; date: string }
  | { kind: 'after'; count: number }

export interface Occurrence {
  date: string
  /** The end rule the next task carries (its count drops by one). */
  end: RepeatEnd | null
}

const SEARCH_DAYS = 800

const dow = (iso: string) => parseISO(iso).getDay()
const lastOfMonth = (y: number, m: number) => new Date(y, m, 0).getDate()

/** Monday on or before a date, so "every 2 weeks" counts whole Monday to Sunday weeks. */
function weekStart(iso: string) {
  return addDays(iso, -((dow(iso) + 6) % 7))
}

/** The day of the month a monthly rule aims for. */
export function monthlyDay(
  rule: RepeatRule & { kind: 'monthly' },
  from: string,
) {
  return rule.day ?? Number(from.slice(8, 10))
}

function weeklyMatch(
  days: number[] | undefined,
  interval: number,
  from: string,
  d: string,
) {
  if (!(days?.length ? days : [dow(from)]).includes(dow(d))) return false
  return (daysBetween(weekStart(from), weekStart(d)) / 7) % interval === 0
}

function matches(rule: RepeatRule, from: string, d: string): boolean {
  switch (rule.kind) {
    case 'daily':
      return true
    case 'weekdays':
      return dow(d) >= 1 && dow(d) <= 5
    case 'weekly':
      return weeklyMatch(rule.days, rule.interval ?? 1, from, d)
    case 'every':
      return rule.unit === 'day'
        ? daysBetween(from, d) % rule.interval === 0
        : weeklyMatch(rule.days, rule.interval, from, d)
    case 'monthly': {
      const [y, m, day] = d.split('-').map(Number)
      const want = Math.min(monthlyDay(rule, from), lastOfMonth(y, m))
      return day === want
    }
  }
}

/** Cheap checks so a bad rule can't send the search off for ever. */
export function isValidRule(rule: RepeatRule): boolean {
  if (rule.kind === 'weekly')
    return (
      rule.days.length > 0 &&
      rule.days.every((n) => Number.isInteger(n) && n >= 0 && n <= 6) &&
      (rule.interval === undefined ||
        (rule.interval >= 1 && rule.interval <= 52))
    )
  if (rule.kind === 'every')
    return (
      Number.isInteger(rule.interval) &&
      rule.interval >= 1 &&
      rule.interval <= 365 &&
      (rule.days?.every((n) => Number.isInteger(n) && n >= 0 && n <= 6) ?? true)
    )
  if (rule.kind === 'monthly')
    return rule.day === undefined || (rule.day >= 1 && rule.day <= 31)
  return true
}

/**
 * The next date after `from` (the open task's start) that is also after `today`, so a task left
 * overdue for days jumps to the first matching day ahead and never arrives already overdue.
 * Returns null when the end rule says the series is over.
 */
export function nextOccurrence(
  rule: RepeatRule,
  end: RepeatEnd | null,
  from: string,
  today: string,
): Occurrence | null {
  if (!isValidRule(rule)) return null
  if (end?.kind === 'after' && end.count <= 1) return null
  const base = from > today ? from : today
  let date: string | null = null
  for (let i = 1; i <= SEARCH_DAYS; i++) {
    const d = addDays(base, i)
    if (matches(rule, from, d)) {
      date = d
      break
    }
  }
  if (!date) return null
  if (end?.kind === 'on' && date > end.date) return null
  return {
    date,
    end: end?.kind === 'after' ? { kind: 'after', count: end.count - 1 } : end,
  }
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** "Wed 30 Sep", or "30 Sep 2026" with `year`. Fixed month names so every browser agrees. */
export function shortDate(iso: string, year = false): string {
  const d = parseISO(iso)
  const day = `${d.getDate()} ${MONTHS[d.getMonth()]}`
  return year
    ? `${day} ${d.getFullYear()}`
    : `${WEEKDAY_NAMES[d.getDay()]} ${day}`
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const LONG_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

/** Monday first, the order the day picker shows. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]
export const dayLetter = (n: number) => 'SMTWTFS'[n]
export const dayShort = (n: number) => WEEKDAY_NAMES[n]
export const dayLong = (n: number) => LONG_NAMES[n]

/** The short label on the row chip: Daily, Weekdays, Weekly, Monthly, Every 3 days, Every 2 weeks. */
export function repeatLabel(rule: RepeatRule): string {
  switch (rule.kind) {
    case 'daily':
      return 'Daily'
    case 'weekdays':
      return 'Weekdays'
    case 'weekly':
      return rule.interval && rule.interval > 1
        ? `Every ${rule.interval} weeks`
        : 'Weekly'
    case 'monthly':
      return 'Monthly'
    case 'every':
      if (rule.interval === 1) return rule.unit === 'day' ? 'Daily' : 'Weekly'
      return `Every ${rule.interval} ${rule.unit}s`
  }
}

const joinDays = (days: number[]) => {
  const names = WEEK_ORDER.filter((n) => days.includes(n)).map(dayLong)
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

const ordinal = (n: number) => {
  const v = n % 100
  if (v >= 11 && v <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

/** The sentence under the picker: "Every Monday and Wednesday. Never ends." */
export function describeRepeat(
  rule: RepeatRule,
  end: RepeatEnd | null,
  from: string | null,
): string {
  let text: string
  switch (rule.kind) {
    case 'daily':
      text = 'Every day.'
      break
    case 'weekdays':
      text = 'Every weekday.'
      break
    case 'weekly':
    case 'every': {
      const weeks = rule.kind === 'weekly' || rule.unit === 'week'
      const interval = rule.interval ?? 1
      const days = rule.days?.length ? rule.days : from ? [dow(from)] : []
      if (!weeks) text = `Every ${interval === 1 ? 'day' : `${interval} days`}.`
      else if (interval === 1) text = `Every ${joinDays(days)}.`
      else text = `Every ${interval} weeks on ${joinDays(days)}.`
      break
    }
    case 'monthly':
      text = `On the ${ordinal(monthlyDay(rule, from ?? todayISO()))} of every month.`
      break
  }
  return `${text} ${describeEnd(end)}`
}

export function describeEnd(end: RepeatEnd | null): string {
  if (end?.kind === 'on') return `Ends on ${shortDate(end.date, true)}.`
  if (end?.kind === 'after')
    return `Ends after ${end.count} time${end.count === 1 ? '' : 's'}.`
  return 'Never ends.'
}

/** "Thursday" within the week, "tomorrow" the next day, otherwise "Thu 1 Oct". */
export function nextLabel(date: string, today: string): string {
  const d = daysBetween(today, date)
  if (d === 1) return 'tomorrow'
  if (d >= 2 && d <= 6) return LONG_NAMES[dow(date)]
  return shortDate(date)
}

/** "4 left" or "Last one", shown on chips only when an "after N times" end applies. */
export function leftLabel(end: RepeatEnd | null): string | null {
  if (end?.kind !== 'after') return null
  return end.count <= 1 ? 'Last one' : `${end.count} left`
}

/** True when the rule needs something the user hasn't given yet. */
export const ruleIncomplete = (rule: RepeatRule) =>
  rule.kind === 'weekly' && rule.days.length === 0

export const todayISO = () => toISODate(new Date())
