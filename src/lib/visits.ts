import { daysBetween, toISODate } from './dates'

// Per browser visit memory for the greeting ("Welcome back") and the shortcuts tip (3rd visit).
// Browser storage can be missing or throw (private mode), so everything falls back to "unknown".

const KEY = 'honeylist-visits'
const SESSION = 'honeylist-session'

export interface VisitInfo {
  /** The last day seen before today, or null when this is the first day we know of. */
  previousDay: string | null
  /** Browser sessions so far, including this one. */
  count: number
}

interface Stored {
  day: string
  prev: string | null
  count: number
}

/** Pure step: the stored record after a visit on `today`, counting a new session when asked. */
export function nextVisit(
  stored: Stored | null,
  today: string,
  newSession: boolean,
): Stored {
  if (!stored) return { day: today, prev: null, count: 1 }
  const count = stored.count + (newSession ? 1 : 0)
  if (stored.day === today) return { ...stored, count }
  return { day: today, prev: stored.day, count }
}

let cached: VisitInfo | null = null

/** Reads and records this visit once per page load. */
export function visitInfo(): VisitInfo {
  if (cached) return cached
  const today = toISODate(new Date())
  try {
    const raw = localStorage.getItem(KEY)
    const stored = raw ? (JSON.parse(raw) as Stored) : null
    const newSession = !sessionStorage.getItem(SESSION)
    sessionStorage.setItem(SESSION, '1')
    const next = nextVisit(stored, today, newSession)
    localStorage.setItem(KEY, JSON.stringify(next))
    cached = { previousDay: next.prev, count: next.count }
  } catch {
    cached = { previousDay: null, count: 1 }
  }
  return cached
}

/** Whole days since the previous visit, or null when unknown. */
export function daysAway(info: VisitInfo, today: string): number | null {
  return info.previousDay ? daysBetween(info.previousDay, today) : null
}
