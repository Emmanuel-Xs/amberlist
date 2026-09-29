import { describe, expect, it } from 'vitest'
import { dueLabel, groupOf, isOnDay, weekAround } from '../src/lib/dates'

const today = '2026-09-29'
const t = (
  o: Partial<{
    status: string
    startDate: string | null
    dueDate: string | null
  }>,
) => ({ status: 'todo', startDate: null, dueDate: null, ...o })

describe('grouping', () => {
  it('puts undated tasks in Inbox', () =>
    expect(groupOf(t({}), today)).toBe('inbox'))
  it('puts past due tasks in Overdue', () =>
    expect(groupOf(t({ dueDate: '2026-09-28' }), today)).toBe('overdue'))
  it('keeps a long running task in Today until done', () =>
    expect(
      groupOf(t({ startDate: '2026-09-01', dueDate: '2026-10-20' }), today),
    ).toBe('today'))
  it('splits tomorrow, this week and later', () => {
    expect(groupOf(t({ startDate: '2026-09-30' }), today)).toBe('tomorrow')
    expect(groupOf(t({ startDate: '2026-10-03' }), today)).toBe('week')
    expect(groupOf(t({ startDate: '2026-11-10' }), today)).toBe('later')
  })
  it('sends done tasks to Completed', () =>
    expect(groupOf(t({ status: 'done', dueDate: '2026-01-01' }), today)).toBe(
      'done',
    ))
  it('shows started tasks on today only', () => {
    expect(isOnDay(t({ startDate: '2026-09-20' }), today, today)).toBe(true)
    expect(isOnDay(t({ startDate: '2026-10-01' }), '2026-10-01', today)).toBe(
      true,
    )
    expect(isOnDay(t({ startDate: '2026-10-01' }), today, today)).toBe(false)
  })
  it('labels deadlines', () => {
    expect(dueLabel(t({ dueDate: today }), today)).toBe('Due today')
    expect(dueLabel(t({ dueDate: '2026-09-28' }), today)).toBe('Due yesterday')
    expect(dueLabel(t({ dueDate: '2026-09-30' }), today)).toBe('Due tomorrow')
  })
  it('builds a Sunday to Saturday week', () => {
    const w = weekAround(today)
    expect(w).toHaveLength(7)
    expect(w[0].key).toBe('2026-09-27')
    expect(w.find((d) => d.today)?.key).toBe(today)
  })
})
