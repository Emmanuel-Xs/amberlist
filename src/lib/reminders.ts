/** Reminder maths shared by the server (when to fire) and the app (what to say). */

export const DEFAULT_START_TIME = '09:00'
export const SNOOZE_MINUTES = 10

export const isTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** Minutes east of UTC for a zone at a given instant. */
function zoneOffsetMinutes(at: number, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(at))
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  )
  return Math.round((asUtc - Math.floor(at / 1000) * 1000) / 60_000)
}

/** The instant a wall clock date and time (YYYY-MM-DD, HH:MM) happens in a time zone. */
export function zonedToUtc(date: string, time: string, tz: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const wall = Date.UTC(y, m - 1, d, hh, mm)
  let at = wall - zoneOffsetMinutes(wall, tz) * 60_000
  // Near a clock change the first guess can be an hour out; one more pass settles it.
  at = wall - zoneOffsetMinutes(at, tz) * 60_000
  return new Date(at)
}

/** The wall clock date and time an instant shows in a time zone. */
export function utcToZoned(at: Date, tz: string) {
  const off = zoneOffsetMinutes(at.getTime(), tz)
  const iso = new Date(at.getTime() + off * 60_000).toISOString()
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) }
}

export interface Startable {
  startDate: string | null
  startTime: string | null
  dueDate: string | null
}

/** The moment a task starts: its start date and time (09:00 when no time), else its due date. */
export function taskStart(t: Startable, tz: string): Date | null {
  const date = t.startDate ?? t.dueDate
  if (!date) return null
  return zonedToUtc(date, t.startTime ?? DEFAULT_START_TIME, tz)
}

/** When to fire a reminder: the start minus the offset. Null when off or the task has no date. */
export function remindAtFor(
  t: Startable,
  offsetMinutes: number | null,
  tz: string,
): Date | null {
  if (offsetMinutes === null) return null
  const start = taskStart(t, tz)
  return start ? new Date(start.getTime() - offsetMinutes * 60_000) : null
}

export const REMIND_PRESETS = [
  { value: null, label: 'No reminder' },
  { value: 0, label: 'When it starts' },
  { value: 10, label: '10 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
] as const

/** "When it starts", "10 minutes before", "1 day before", or a custom "3 hours before". */
export function offsetLabel(minutes: number | null): string {
  if (minutes === null) return 'No reminder'
  if (minutes === 0) return 'When it starts'
  const preset = REMIND_PRESETS.find((p) => p.value === minutes)
  if (preset) return preset.label
  if (minutes % 1440 === 0) {
    const n = minutes / 1440
    return `${n} day${n === 1 ? '' : 's'} before`
  }
  if (minutes % 60 === 0) {
    const n = minutes / 60
    return `${n} hour${n === 1 ? '' : 's'} before`
  }
  return `${minutes} minutes before`
}

/** The notification body: "Starts in 10 minutes, at 18:00", "Starts now", "Due tomorrow". */
export function reminderBody(
  offsetMinutes: number,
  startTime: string,
  startsTomorrow = false,
): string {
  if (offsetMinutes === 0) return `Starts now, at ${startTime}.`
  if (offsetMinutes < 60)
    return `Starts in ${offsetMinutes} minutes, at ${startTime}.`
  if (offsetMinutes < 1440) {
    const h = Math.round(offsetMinutes / 60)
    return `Starts in ${h} hour${h === 1 ? '' : 's'}, at ${startTime}.`
  }
  return startsTomorrow
    ? `Due tomorrow. Starts at ${startTime}.`
    : `Starts in ${Math.round(offsetMinutes / 1440)} days, at ${startTime}.`
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
export const minutesToTime = (mins: number) =>
  `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`

/** "Day before at 08:00" as minutes before the start. Null when that lands after the start. */
export function customToOffset(
  daysBefore: number,
  time: string,
  startTime: string | null,
): number | null {
  const offset =
    daysBefore * 1440 +
    toMinutes(startTime ?? DEFAULT_START_TIME) -
    toMinutes(time)
  return offset >= 0 ? offset : null
}

/** The other way round, to reopen Custom on a saved offset. */
export function offsetToCustom(offset: number, startTime: string | null) {
  const start = toMinutes(startTime ?? DEFAULT_START_TIME)
  const fire = start - offset // minutes from midnight of the start day, may be negative
  const daysBefore = Math.max(0, Math.ceil(-fire / 1440))
  return { daysBefore, time: minutesToTime(fire + daysBefore * 1440) }
}
