import { toISODate } from './dates'

// Save your data nudges (PRD, decision D3): after the 2nd task, then after 3 days of use.
// Home only, one per session, gone once signed in. Dismissals live on the server (prefs.nudgeState);
// the days of use and the "shown this session" mark live in browser storage, with safe fallbacks.

export type NudgeKind = 'task' | 'days'

export interface NudgeInput {
  isGuest: boolean
  taskCount: number
  /** Separate days this browser has used the app, today included. */
  daysUsed: number
  /** The ISO time each nudge was dismissed. */
  dismissed: { task?: string; days?: string } | null
  /** The nudge already shown this session, if any. */
  shownThisSession: NudgeKind | null
  today: string
}

/** Which nudge (if any) Home should show. Pure, so it is unit tested. */
export function pickNudge(i: NudgeInput): NudgeKind | null {
  if (!i.isGuest) return null
  const d = i.dismissed ?? {}
  const due: NudgeKind | null =
    !d.task && !d.days && i.taskCount >= 2
      ? 'task'
      : !d.days &&
          i.daysUsed >= 3 &&
          // Never twice on the same day: the second waits for another day.
          (!d.task || d.task.slice(0, 10) !== i.today)
        ? 'days'
        : null
  // One nudge per session: once one was shown, only that one may come back.
  if (i.shownThisSession && due !== i.shownThisSession) return null
  return due
}

const DAYS_KEY = 'honeylist-days-used'
const SHOWN_KEY = 'honeylist-nudge-shown'

/** Records today and returns how many separate days this browser has used the app (capped at 3). */
export function daysUsed(today = toISODate(new Date())): number {
  try {
    const raw = localStorage.getItem(DAYS_KEY)
    const days: string[] = raw ? (JSON.parse(raw) as string[]) : []
    if (!days.includes(today)) {
      days.push(today)
      localStorage.setItem(DAYS_KEY, JSON.stringify(days.slice(-3)))
    }
    return Math.min(days.length, 3)
  } catch {
    return 1
  }
}

export function shownThisSession(): NudgeKind | null {
  try {
    const v = sessionStorage.getItem(SHOWN_KEY)
    return v === 'task' || v === 'days' ? v : null
  } catch {
    return null
  }
}

export function markShown(kind: NudgeKind) {
  try {
    sessionStorage.setItem(SHOWN_KEY, kind)
  } catch {
    // Without storage the nudge may show again on the next load; the server dismissal still holds.
  }
}
