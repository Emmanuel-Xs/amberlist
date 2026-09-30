import { describe, expect, it } from 'vitest'
import {
  customToOffset,
  isTimeZone,
  offsetToCustom,
  offsetLabel,
  reminderBody,
  remindAtFor,
  utcToZoned,
  zonedToUtc,
} from '../src/lib/reminders'

describe('time zones', () => {
  it('knows real zones', () => {
    expect(isTimeZone('Africa/Lagos')).toBe(true)
    expect(isTimeZone('Mars/Base')).toBe(false)
  })

  it('converts a Lagos wall clock (UTC+1, no DST) to UTC and back', () => {
    const at = zonedToUtc('2026-09-30', '18:00', 'Africa/Lagos')
    expect(at.toISOString()).toBe('2026-09-30T17:00:00.000Z')
    expect(utcToZoned(at, 'Africa/Lagos')).toEqual({
      date: '2026-09-30',
      time: '18:00',
    })
  })

  it('handles zones ahead and behind, and a day boundary', () => {
    expect(zonedToUtc('2026-09-30', '01:00', 'Asia/Tokyo').toISOString()).toBe(
      '2026-09-29T16:00:00.000Z',
    )
    expect(
      zonedToUtc('2026-01-15', '09:00', 'America/New_York').toISOString(),
    ).toBe('2026-01-15T14:00:00.000Z')
  })

  it('follows daylight saving', () => {
    expect(
      zonedToUtc('2026-07-01', '09:00', 'America/New_York').toISOString(),
    ).toBe('2026-07-01T13:00:00.000Z')
    // Day after the US spring change (2026-03-08): offset is already -4.
    expect(
      zonedToUtc('2026-03-09', '09:00', 'America/New_York').toISOString(),
    ).toBe('2026-03-09T13:00:00.000Z')
  })
})

describe('remindAtFor', () => {
  const task = { startDate: '2026-09-30', startTime: '10:00', dueDate: null }
  it('counts back from the start time', () => {
    expect(remindAtFor(task, 10, 'Africa/Lagos')?.toISOString()).toBe(
      '2026-09-30T08:50:00.000Z',
    )
    expect(remindAtFor(task, 1440, 'Africa/Lagos')?.toISOString()).toBe(
      '2026-09-29T09:00:00.000Z',
    )
  })
  it('uses 09:00 when the task has no time', () =>
    expect(
      remindAtFor(
        { ...task, startTime: null },
        0,
        'Africa/Lagos',
      )?.toISOString(),
    ).toBe('2026-09-30T08:00:00.000Z'))
  it('falls back to the due date, and is null with no date or no offset', () => {
    expect(
      remindAtFor(
        { startDate: null, startTime: null, dueDate: '2026-10-02' },
        0,
        'UTC',
      )?.toISOString(),
    ).toBe('2026-10-02T09:00:00.000Z')
    expect(
      remindAtFor(
        { startDate: null, startTime: null, dueDate: null },
        0,
        'UTC',
      ),
    ).toBeNull()
    expect(remindAtFor(task, null, 'UTC')).toBeNull()
  })
})

describe('words', () => {
  it('labels offsets', () => {
    expect(offsetLabel(null)).toBe('No reminder')
    expect(offsetLabel(0)).toBe('When it starts')
    expect(offsetLabel(10)).toBe('10 minutes before')
    expect(offsetLabel(180)).toBe('3 hours before')
    expect(offsetLabel(2880)).toBe('2 days before')
    expect(offsetLabel(45)).toBe('45 minutes before')
  })
  it('writes the notification body', () => {
    expect(reminderBody(10, '18:00')).toBe('Starts in 10 minutes, at 18:00.')
    expect(reminderBody(0, '09:30')).toBe('Starts now, at 09:30.')
    expect(reminderBody(1440, '10:00', true)).toBe(
      'Due tomorrow. Starts at 10:00.',
    )
  })
})

describe('custom time', () => {
  it('turns "day before at 08:00" into minutes before the start', () => {
    expect(customToOffset(1, '08:00', '10:00')).toBe(1560)
    expect(customToOffset(0, '09:50', '10:00')).toBe(10)
    expect(customToOffset(0, '09:00', null)).toBe(0)
  })
  it('refuses a time after the start', () =>
    expect(customToOffset(0, '11:00', '10:00')).toBeNull())
  it('reads a saved offset back', () => {
    expect(offsetToCustom(1560, '10:00')).toEqual({
      daysBefore: 1,
      time: '08:00',
    })
    expect(offsetToCustom(10, '10:00')).toEqual({
      daysBefore: 0,
      time: '09:50',
    })
    expect(offsetToCustom(2880, '09:00')).toEqual({
      daysBefore: 2,
      time: '09:00',
    })
  })
})
