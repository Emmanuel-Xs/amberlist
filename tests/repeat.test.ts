import { describe, expect, it } from 'vitest'
import {
  describeRepeat,
  isValidRule,
  leftLabel,
  nextLabel,
  nextOccurrence,
  repeatLabel,
} from '../src/lib/repeat'
import type { RepeatRule } from '../src/lib/repeat'

const next = (
  rule: RepeatRule,
  from: string,
  today = from,
  end: Parameters<typeof nextOccurrence>[1] = null,
) => nextOccurrence(rule, end, from, today)?.date ?? null

describe('nextOccurrence', () => {
  it('daily goes to tomorrow', () =>
    expect(next({ kind: 'daily' }, '2026-09-30')).toBe('2026-10-01'))

  it('weekdays skip the weekend (Friday to Monday)', () => {
    expect(next({ kind: 'weekdays' }, '2026-10-02')).toBe('2026-10-05')
    expect(next({ kind: 'weekdays' }, '2026-09-30')).toBe('2026-10-01')
  })

  it('weekly picks the next chosen day, wrapping into next week', () => {
    const rule: RepeatRule = { kind: 'weekly', days: [1, 3] } // Mon, Wed
    expect(next(rule, '2026-09-30')).toBe('2026-10-05') // Wed -> Mon
    expect(next(rule, '2026-09-28')).toBe('2026-09-30') // Mon -> Wed
  })

  it('every 2 weeks skips the off week', () => {
    const rule: RepeatRule = {
      kind: 'every',
      unit: 'week',
      interval: 2,
      days: [3],
    }
    expect(next(rule, '2026-09-30')).toBe('2026-10-14')
  })

  it('every 3 days counts from the start date', () => {
    const rule: RepeatRule = { kind: 'every', unit: 'day', interval: 3 }
    expect(next(rule, '2026-09-30')).toBe('2026-10-03')
  })

  it('monthly on the 31st lands on the last day of shorter months and comes back', () => {
    const rule: RepeatRule = { kind: 'monthly', day: 31 }
    expect(next(rule, '2026-08-31')).toBe('2026-09-30')
    expect(next(rule, '2026-09-30')).toBe('2026-10-31')
    expect(next(rule, '2026-10-31')).toBe('2026-11-30')
    expect(next(rule, '2027-01-31')).toBe('2027-02-28')
    expect(next(rule, '2028-01-31')).toBe('2028-02-29')
  })

  it('monthly rolls over the year end', () =>
    expect(next({ kind: 'monthly' }, '2026-12-15')).toBe('2027-01-15'))

  it('jumps past today when the task was left overdue', () => {
    expect(next({ kind: 'daily' }, '2026-09-27', '2026-09-30')).toBe(
      '2026-10-01',
    )
    expect(
      next({ kind: 'weekly', days: [1] }, '2026-09-07', '2026-09-30'),
    ).toBe('2026-10-05')
  })

  it('completing early still moves ahead of the start date', () =>
    expect(next({ kind: 'daily' }, '2026-10-10', '2026-10-01')).toBe(
      '2026-10-11',
    ))

  it('handles the clock change weeks (DST) without drifting', () => {
    // Europe/US clocks change on these dates; plain dates must not slip.
    expect(next({ kind: 'daily' }, '2026-03-28')).toBe('2026-03-29')
    expect(next({ kind: 'daily' }, '2026-10-24')).toBe('2026-10-25')
    expect(
      next({ kind: 'every', unit: 'day', interval: 7 }, '2026-10-25'),
    ).toBe('2026-11-01')
  })

  describe('end rules', () => {
    it('stops after a date', () => {
      const end = { kind: 'on', date: '2026-10-01' } as const
      expect(next({ kind: 'daily' }, '2026-09-30', '2026-09-30', end)).toBe(
        '2026-10-01',
      )
      expect(
        next({ kind: 'daily' }, '2026-10-01', '2026-10-01', end),
      ).toBeNull()
    })

    it('counts down and makes no task after the last one', () => {
      const r = nextOccurrence(
        { kind: 'daily' },
        { kind: 'after', count: 3 },
        '2026-09-30',
        '2026-09-30',
      )
      expect(r?.end).toEqual({ kind: 'after', count: 2 })
      expect(
        nextOccurrence(
          { kind: 'daily' },
          { kind: 'after', count: 1 },
          '2026-09-30',
          '2026-09-30',
        ),
      ).toBeNull()
    })

    it('never ends keeps the end rule', () => {
      const r = nextOccurrence(
        { kind: 'daily' },
        { kind: 'never' },
        '2026-09-30',
        '2026-09-30',
      )
      expect(r?.end).toEqual({ kind: 'never' })
    })
  })
})

describe('validation and labels', () => {
  it('rejects weekly with no days and bad intervals', () => {
    expect(isValidRule({ kind: 'weekly', days: [] })).toBe(false)
    expect(isValidRule({ kind: 'weekly', days: [7] })).toBe(false)
    expect(isValidRule({ kind: 'every', unit: 'day', interval: 0 })).toBe(false)
    expect(next({ kind: 'weekly', days: [] }, '2026-09-30')).toBeNull()
  })

  it('labels the chip', () => {
    expect(repeatLabel({ kind: 'weekdays' })).toBe('Weekdays')
    expect(repeatLabel({ kind: 'every', unit: 'day', interval: 3 })).toBe(
      'Every 3 days',
    )
    expect(repeatLabel({ kind: 'every', unit: 'week', interval: 2 })).toBe(
      'Every 2 weeks',
    )
  })

  it('describes the rule in a sentence', () => {
    expect(
      describeRepeat({ kind: 'weekly', days: [1, 3] }, null, '2026-09-30'),
    ).toBe('Every Monday and Wednesday. Never ends.')
    expect(
      describeRepeat(
        { kind: 'monthly', day: 1 },
        { kind: 'after', count: 6 },
        '2026-10-01',
      ),
    ).toBe('On the 1st of every month. Ends after 6 times.')
  })

  it('says when the next one comes', () => {
    expect(nextLabel('2026-10-01', '2026-09-30')).toBe('tomorrow')
    expect(nextLabel('2026-10-02', '2026-09-30')).toBe('Friday')
    expect(nextLabel('2026-10-20', '2026-09-30')).toBe('Tue 20 Oct')
  })

  it('shows what is left only for "after N times"', () => {
    expect(leftLabel(null)).toBeNull()
    expect(leftLabel({ kind: 'after', count: 4 })).toBe('4 left')
    expect(leftLabel({ kind: 'after', count: 1 })).toBe('Last one')
  })
})
