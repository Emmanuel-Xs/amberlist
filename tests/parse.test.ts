import { describe, expect, it } from 'vitest'
import { parseQuickAdd } from '../src/lib/parse'

const today = '2026-09-29' // a Tuesday

describe('quick add parser', () => {
  it('keeps plain titles untouched', () => {
    expect(parseQuickAdd('Buy bread', today)).toMatchObject({
      title: 'Buy bread',
      chips: [],
    })
  })
  it('reads tomorrow, a time, a folder and a priority', () => {
    const p = parseQuickAdd('Call mum tomorrow 5pm #personal !high', today)
    expect(p).toMatchObject({
      title: 'Call mum',
      startDate: '2026-09-30',
      startTime: '17:00',
      category: 'personal',
      priority: 'high',
    })
    expect(p.chips).toHaveLength(4)
  })
  it('reads a due weekday separately from the start date', () => {
    expect(parseQuickAdd('Submit report due fri', today)).toMatchObject({
      title: 'Submit report',
      dueDate: '2026-10-02',
    })
  })
  it('reads time ranges and assumes today', () => {
    expect(parseQuickAdd('Standup 10-10:30', today)).toMatchObject({
      title: 'Standup',
      startTime: '10:00',
      endTime: '10:30',
      startDate: today,
    })
  })
  it('reads 24h times', () => {
    expect(parseQuickAdd('Gym 18:30 thursday', today)).toMatchObject({
      title: 'Gym',
      startTime: '18:30',
      startDate: '2026-10-01',
    })
  })
  it('moves a same weekday to next week', () => {
    expect(parseQuickAdd('Plan tuesday', today).startDate).toBe('2026-10-06')
  })
  it('ignores invalid times', () => {
    expect(parseQuickAdd('Room 25:99 booking', today).startTime).toBeUndefined()
  })
})
