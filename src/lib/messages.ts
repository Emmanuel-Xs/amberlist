import { nextLabel, nextOccurrence } from './repeat'
import type { Task } from '#/lib/api'
import { groupOf, toISODate } from '#/lib/dates'

/**
 * Friendly copy for toasts (design board 4): say what happened first, then a warm line.
 * Short, no emoji, rotates so it doesn't repeat back to back.
 */
const last = new Map<string, number>()
export function pick(key: string, lines: string[], rand = Math.random): string {
  if (lines.length === 1) return lines[0]
  let i = Math.floor(rand() * lines.length)
  if (i === last.get(key)) i = (i + 1) % lines.length
  last.set(key, i)
  return lines[i]
}

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`

function whereLabel(t: Pick<Task, 'startDate' | 'dueDate'>, today: string) {
  const d = t.startDate ?? t.dueDate
  if (!d) return 'Inbox'
  if (d === today) return 'Today'
  const tmr = new Date(today + 'T00:00')
  tmr.setDate(tmr.getDate() + 1)
  if (d === toISODate(tmr)) return 'Tomorrow'
  const date = new Date(d + 'T00:00')
  const days = (date.getTime() - new Date(today + 'T00:00').getTime()) / 864e5
  if (days > 0 && days < 7)
    return date.toLocaleDateString('en-GB', { weekday: 'long' })
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export interface Msg {
  message: string
  detail?: string
}

/** After a task is created. `all` is the task list including the new task. */
export function addedMessage(
  t: Pick<Task, 'startDate' | 'dueDate'>,
  all: Task[],
  now = new Date(),
): Msg {
  const today = toISODate(now)
  const where = whereLabel(t, today)
  const todayOpen = all.filter(
    (x) =>
      x.status !== 'done' && ['today', 'overdue'].includes(groupOf(x, today)),
  ).length
  if (where === 'Today') {
    if (todayOpen <= 1)
      return {
        message: 'Added to Today',
        detail: pick('add-first', [
          'First one today. Nice.',
          'Small steps count.',
        ]),
      }
    return {
      message: 'Added to Today',
      detail: pick('add-today', [
        `You've got ${plural(todayOpen, 'thing')} on today.`,
        `${plural(todayOpen, 'task')} today. You've got this.`,
      ]),
    }
  }
  if (where === 'Inbox')
    return {
      message: 'Added to Inbox',
      detail: pick('add-inbox', [
        'Give it a day when you know.',
        'Safe here until you plan it.',
      ]),
    }
  return { message: `On the list for ${where}` }
}

/** After a task is ticked. `all` is the list before the change. */
export function doneMessage(t: Task, all: Task[], now = new Date()): Msg {
  const today = toISODate(now)
  const left = all.filter(
    (x) =>
      x.id !== t.id &&
      x.status !== 'done' &&
      ['today', 'overdue'].includes(groupOf(x, today)),
  ).length
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 6)
  const week = toISODate(weekAgo)
  const doneWeek =
    all.filter(
      (x) =>
        x.id !== t.id &&
        x.status === 'done' &&
        (x.completedAt ?? '').slice(0, 10) >= week,
    ).length + 1
  const head = left
    ? pick('done-head', [
        `Done. ${left} left today`,
        `Ticked off. ${left} to go`,
      ])
    : pick('done-head-none', ['Done', 'Ticked off'])
  const detail =
    doneWeek >= 3 && Math.random() < 0.5
      ? `${plural(doneWeek, 'task')} done this week.`
      : 'Moved to Completed.'
  return { message: head, detail }
}

/** After finishing a repeating task: what happens next. */
export function repeatDoneMessage(t: Task, today: string): Msg {
  const occ =
    t.repeatRule && t.startDate
      ? nextOccurrence(t.repeatRule, t.repeatEnd, t.startDate, today)
      : null
  if (!occ)
    return {
      message: 'Done. That was the last one',
      detail: 'It will not come back.',
    }
  const caughtUp = !!t.dueDate && t.dueDate < today
  return {
    message: caughtUp
      ? `Done. You are caught up. Next one is ${nextLabel(occ.date, today)}`
      : `Done. Next one is ${nextLabel(occ.date, today)}`,
    detail: 'Moved to Completed.',
  }
}
