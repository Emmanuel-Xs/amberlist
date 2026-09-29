// Dates are plain local YYYY-MM-DD strings so a task set for "today" stays today in the user's time zone.

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return toISODate(new Date(y, m - 1, d + n))
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000,
  )
}

export type Group =
  'overdue' | 'today' | 'tomorrow' | 'week' | 'later' | 'inbox' | 'done'

export const GROUP_LABELS: Record<Group, string> = {
  overdue: 'Overdue',
  today: 'Today',
  tomorrow: 'Tomorrow',
  week: 'This week',
  later: 'Later',
  inbox: 'Inbox',
  done: 'Completed',
}

export interface Datable {
  status: string
  startDate: string | null
  dueDate: string | null
}

/** Which list a task belongs in. A started task stays in Today every day until it is done. */
export function groupOf(t: Datable, today: string): Group {
  if (t.status === 'done') return 'done'
  if (t.dueDate && t.dueDate < today) return 'overdue'
  const start = t.startDate ?? t.dueDate
  if (!start) return 'inbox'
  if (start <= today) return 'today'
  if (start === addDays(today, 1)) return 'tomorrow'
  if (daysBetween(today, start) <= 7) return 'week'
  return 'later'
}

/** True when the task should show on a given day in the date strip. */
export function isOnDay(t: Datable, day: string, today: string): boolean {
  if (t.status === 'done') return false
  const start = t.startDate ?? t.dueDate
  if (!start) return false
  if (day === today) return start <= today
  return start === day
}

export function dueLabel(t: Datable, today: string): string | null {
  if (!t.dueDate || t.status === 'done') return null
  const d = daysBetween(today, t.dueDate)
  if (d < 0) return d === -1 ? 'Due yesterday' : `Overdue by ${-d} days`
  if (d === 0) return 'Due today'
  if (d === 1) return 'Due tomorrow'
  if (d <= 6)
    return `Due ${parseISO(t.dueDate).toLocaleDateString('en-GB', { weekday: 'long' })}`
  return `Due ${formatDay(t.dueDate)}`
}

export function formatDay(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  })
}

export function formatTimeRange(
  start?: string | null,
  end?: string | null,
): string | null {
  if (!start) return null
  return end ? `${start} to ${end}` : start
}

export function greeting(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function weekAround(
  today: string,
): { key: string; day: number; weekday: string; today: boolean }[] {
  const d = parseISO(today)
  const start = addDays(today, -d.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const iso = addDays(start, i)
    const dt = parseISO(iso)
    return {
      key: iso,
      day: dt.getDate(),
      weekday: dt.toLocaleDateString('en-GB', { weekday: 'short' }),
      today: iso === today,
    }
  })
}

const PRIORITY: Record<string, number> = { high: 0, medium: 1, low: 2 }

/** Overdue first, then high priority, then by start time, then by date. */
export function sortTasks<
  T extends Datable & {
    priority: string
    startTime: string | null
    createdAt?: string
  },
>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ao = a.dueDate && a.startDate === null ? 0 : 1
    const bo = b.dueDate && b.startDate === null ? 0 : 1
    return (
      (PRIORITY[a.priority] ?? 1) - (PRIORITY[b.priority] ?? 1) ||
      (a.startTime ?? '99').localeCompare(b.startTime ?? '99') ||
      (a.startDate ?? a.dueDate ?? '9999').localeCompare(
        b.startDate ?? b.dueDate ?? '9999',
      ) ||
      ao - bo
    )
  })
}
