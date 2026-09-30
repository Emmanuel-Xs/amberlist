import { describe, expect, it } from 'vitest'
import {
  frequencyLabel,
  habitStats,
  isScheduled,
  isoWeekday,
  milestoneReached,
  streakLabel,
  weekDots,
  weekStart,
} from '../src/lib/streaks'
import type { HabitRule } from '../src/lib/streaks'
import { addDays } from '../src/lib/dates'

// 2026-09-30 is a Wednesday; its ISO week starts Monday 2026-09-28.
const TODAY = '2026-09-30'
const daily: HabitRule = { frequency: 'daily' }
const weekdays: HabitRule = { frequency: 'weekdays' }
const back = (n: number) => addDays(TODAY, -n)
/** The last `n` days ending `from` days ago. */
const run = (n: number, from = 0) =>
  Array.from({ length: n }, (_, i) => back(from + i))

describe('week helpers', () => {
  it('numbers weekdays Monday 1 to Sunday 7 and finds the Monday', () => {
    expect(isoWeekday(TODAY)).toBe(3)
    expect(isoWeekday('2026-10-04')).toBe(7)
    expect(isoWeekday('2026-09-28')).toBe(1)
    expect(weekStart(TODAY)).toBe('2026-09-28')
    expect(weekStart('2026-10-04')).toBe('2026-09-28')
    expect(weekStart('2026-10-05')).toBe('2026-10-05')
    // Across a month and year boundary.
    expect(weekStart('2027-01-01')).toBe('2026-12-28')
  })

  it('knows which days are scheduled', () => {
    expect(isScheduled(daily, '2026-10-03')).toBe(true)
    expect(isScheduled(weekdays, '2026-10-02')).toBe(true)
    expect(isScheduled(weekdays, '2026-10-03')).toBe(false)
    expect(isScheduled(weekdays, '2026-10-04')).toBe(false)
    const mwf: HabitRule = { frequency: 'weekdays', daysOfWeek: [1, 3, 5] }
    expect(isScheduled(mwf, TODAY)).toBe(true)
    expect(isScheduled(mwf, '2026-09-29')).toBe(false)
    expect(isScheduled({ frequency: 'x_per_week' }, '2026-10-04')).toBe(true)
  })
})

describe('daily streaks', () => {
  it('starts at zero with no check ins', () => {
    expect(habitStats(daily, [], TODAY)).toMatchObject({
      current: 0,
      best: 0,
      total: 0,
      unit: 'day',
      doneToday: false,
      goal: null,
    })
  })

  it('counts today as day one', () => {
    const s = habitStats({ ...daily, goalDays: 21 }, [TODAY], TODAY)
    expect(s).toMatchObject({ current: 1, best: 1, total: 1, doneToday: true })
    expect(s.goal).toEqual({ day: 1, of: 21, reached: false })
  })

  it('keeps yesterday’s streak while today is still open', () => {
    const s = habitStats(daily, run(3, 1), TODAY)
    expect(s.current).toBe(3)
    expect(s.doneToday).toBe(false)
  })

  it('breaks the current streak after a missed day but keeps best and total', () => {
    // Five days in a row, a gap two days ago, then yesterday and today.
    const dates = [...run(2), ...run(5, 3)]
    const s = habitStats(daily, dates, TODAY)
    expect(s.current).toBe(2)
    expect(s.best).toBe(5)
    expect(s.total).toBe(7)
  })

  it('is zero when the last check in was two days ago', () => {
    expect(habitStats(daily, run(4, 2), TODAY).current).toBe(0)
    expect(habitStats(daily, run(4, 2), TODAY).best).toBe(4)
  })

  it('ignores duplicates and future dates', () => {
    const s = habitStats(
      daily,
      [TODAY, TODAY, back(1), addDays(TODAY, 1)],
      TODAY,
    )
    expect(s.total).toBe(2)
    expect(s.current).toBe(2)
  })

  it('handles runs across month ends', () => {
    const dates = ['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02']
    expect(habitStats(daily, dates, '2026-09-02').current).toBe(4)
  })

  it('reaches and caps the goal', () => {
    const s = habitStats({ ...daily, goalDays: 21 }, run(25), TODAY)
    expect(s.goal).toEqual({ day: 21, of: 21, reached: true })
    expect(s.current).toBe(25)
  })

  it('counts check ins towards the goal even after a break', () => {
    const s = habitStats(
      { ...daily, goalDays: 21 },
      [...run(10), ...run(9, 12)],
      TODAY,
    )
    expect(s.goal).toEqual({ day: 19, of: 21, reached: false })
    expect(s.current).toBe(10)
  })
})

describe('weekday streaks', () => {
  it('skips weekends without breaking the streak', () => {
    // Thu 24, Fri 25, (weekend), Mon 28, Tue 29, Wed 30.
    const dates = [
      '2026-09-24',
      '2026-09-25',
      '2026-09-28',
      '2026-09-29',
      TODAY,
    ]
    expect(habitStats(weekdays, dates, TODAY).current).toBe(5)
    expect(habitStats(daily, dates, TODAY).current).toBe(3)
  })

  it('keeps Friday’s streak through the weekend', () => {
    const dates = ['2026-10-01', '2026-10-02']
    expect(habitStats(weekdays, dates, '2026-10-03').current).toBe(2)
    expect(habitStats(weekdays, dates, '2026-10-04').current).toBe(2)
    // Monday is still open.
    expect(habitStats(weekdays, dates, '2026-10-05').current).toBe(2)
    // Missing Monday breaks it on Tuesday.
    expect(habitStats(weekdays, dates, '2026-10-06').current).toBe(0)
  })

  it('counts a weekend check in towards the total only', () => {
    const s = habitStats(
      weekdays,
      ['2026-09-25', '2026-09-26', '2026-09-28'],
      '2026-09-28',
    )
    expect(s.total).toBe(3)
    expect(s.current).toBe(2)
  })

  it('breaks on a missed Friday', () => {
    expect(habitStats(weekdays, ['2026-10-01'], '2026-10-04').current).toBe(0)
  })

  it('follows specific days', () => {
    const mwf: HabitRule = { frequency: 'weekdays', daysOfWeek: [1, 3, 5] }
    const dates = [
      '2026-09-21',
      '2026-09-23',
      '2026-09-25',
      '2026-09-28',
      TODAY,
    ]
    expect(habitStats(mwf, dates, TODAY).current).toBe(5)
    // Missing Monday the 28th breaks the run.
    expect(
      habitStats(
        mwf,
        dates.filter((d) => d !== '2026-09-28'),
        TODAY,
      ),
    ).toMatchObject({
      current: 1,
      best: 3,
    })
  })
})

describe('times a week streaks', () => {
  const thrice: HabitRule = { frequency: 'x_per_week', timesPerWeek: 3 }

  it('counts weeks that met the target', () => {
    const dates = [
      // Week of 14 Sep: 3
      '2026-09-14',
      '2026-09-16',
      '2026-09-18',
      // Week of 21 Sep: 3
      '2026-09-21',
      '2026-09-22',
      '2026-09-27',
    ]
    const s = habitStats(thrice, dates, TODAY)
    expect(s).toMatchObject({
      current: 2,
      best: 2,
      unit: 'week',
      total: 6,
      thisWeek: 0,
    })
  })

  it('adds this week once it is met, and never breaks on an unfinished week', () => {
    const dates = [
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-28',
      '2026-09-29',
    ]
    expect(habitStats(thrice, dates, TODAY)).toMatchObject({
      current: 1,
      thisWeek: 2,
    })
    expect(habitStats(thrice, [...dates, TODAY], TODAY)).toMatchObject({
      current: 2,
      thisWeek: 3,
    })
  })

  it('breaks after a week that fell short', () => {
    const dates = [
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-21',
    ]
    expect(habitStats(thrice, dates, TODAY)).toMatchObject({
      current: 0,
      best: 2,
    })
  })

  it('defaults to three a week', () => {
    const s = habitStats(
      { frequency: 'x_per_week' },
      ['2026-09-21', '2026-09-22'],
      TODAY,
    )
    expect(s.current).toBe(0)
  })
})

describe('milestones, dots and labels', () => {
  it('fires only when the streak lands on 3, 7 or 21', () => {
    expect(milestoneReached(2, 3)).toBe(3)
    expect(milestoneReached(6, 7)).toBe(7)
    expect(milestoneReached(20, 21)).toBe(21)
    expect(milestoneReached(3, 4)).toBeNull()
    // Undoing back down to a milestone is not a new one.
    expect(milestoneReached(4, 3)).toBeNull()
    expect(milestoneReached(3, 3)).toBeNull()
  })

  it('builds Monday to Sunday dots for the current week', () => {
    const dots = weekDots(weekdays, ['2026-09-28', TODAY], TODAY)
    expect(dots.map((d) => d.letter).join('')).toBe('MTWTFSS')
    expect(dots[0]).toMatchObject({
      date: '2026-09-28',
      done: true,
      scheduled: true,
    })
    expect(dots[1]).toMatchObject({ done: false, future: false })
    expect(dots[2]).toMatchObject({ isToday: true, done: true })
    expect(dots[3].future).toBe(true)
    expect(dots[5].scheduled).toBe(false)
  })

  it('describes the frequency in words', () => {
    expect(frequencyLabel(daily)).toBe('Every day')
    expect(frequencyLabel(weekdays)).toBe('Weekdays')
    expect(
      frequencyLabel({ frequency: 'weekdays', daysOfWeek: [5, 1, 3] }),
    ).toBe('Mon, Wed, Fri')
    expect(frequencyLabel({ frequency: 'weekdays', daysOfWeek: [6, 7] })).toBe(
      'Weekends',
    )
    expect(frequencyLabel({ frequency: 'x_per_week', timesPerWeek: 1 })).toBe(
      'Once a week',
    )
    expect(frequencyLabel({ frequency: 'x_per_week', timesPerWeek: 4 })).toBe(
      '4 times a week',
    )
  })

  it('pluralises streaks', () => {
    expect(streakLabel(1, 'day')).toBe('1 day')
    expect(streakLabel(12, 'day')).toBe('12 days')
    expect(streakLabel(2, 'week')).toBe('2 weeks')
  })
})
