import { describe, expect, it } from 'vitest'
import { pickNudge } from '../src/lib/nudge'
import type { NudgeInput } from '../src/lib/nudge'

const base: NudgeInput = {
  isGuest: true,
  taskCount: 0,
  daysUsed: 1,
  dismissed: null,
  shownThisSession: null,
  today: '2026-09-30',
}

describe('pickNudge', () => {
  it('waits for the 2nd task', () => {
    expect(pickNudge({ ...base, taskCount: 1 })).toBeNull()
    expect(pickNudge({ ...base, taskCount: 2 })).toBe('task')
  })

  it('never nudges a signed in user', () => {
    expect(
      pickNudge({ ...base, isGuest: false, taskCount: 5, daysUsed: 3 }),
    ).toBeNull()
  })

  it('shows the 3 day nudge after the first was dismissed on an earlier day', () => {
    const dismissed = { task: '2026-09-28T10:00:00.000Z' }
    expect(
      pickNudge({ ...base, taskCount: 4, daysUsed: 2, dismissed }),
    ).toBeNull()
    expect(pickNudge({ ...base, taskCount: 4, daysUsed: 3, dismissed })).toBe(
      'days',
    )
  })

  it('does not show the second nudge on the day the first was dismissed', () => {
    const dismissed = { task: '2026-09-30T08:00:00.000Z' }
    expect(
      pickNudge({ ...base, taskCount: 4, daysUsed: 3, dismissed }),
    ).toBeNull()
  })

  it('shows the 3 day nudge even with fewer than 2 tasks', () => {
    expect(pickNudge({ ...base, taskCount: 0, daysUsed: 3 })).toBe('days')
  })

  it('stops after both are dismissed', () => {
    const dismissed = {
      task: '2026-09-20T00:00:00.000Z',
      days: '2026-09-25T00:00:00.000Z',
    }
    expect(
      pickNudge({ ...base, taskCount: 9, daysUsed: 3, dismissed }),
    ).toBeNull()
  })

  it('allows only one nudge per session', () => {
    expect(pickNudge({ ...base, taskCount: 2, shownThisSession: 'task' })).toBe(
      'task',
    )
    const dismissed = { task: '2026-09-20T00:00:00.000Z' }
    expect(
      pickNudge({ ...base, daysUsed: 3, dismissed, shownThisSession: 'task' }),
    ).toBeNull()
  })
})
