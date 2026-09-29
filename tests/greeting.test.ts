import { describe, expect, it } from 'vitest'
import { greetingLine, slotOf } from '../src/lib/greeting'
import { nextVisit } from '../src/lib/visits'

// 2026-09-28 is a Monday, 2026-10-02 a Friday, 2026-10-03 a Saturday, 2026-09-30 a Wednesday.
const at = (iso: string, hour: number) =>
  new Date(
    Number(iso.slice(0, 4)),
    Number(iso.slice(5, 7)) - 1,
    Number(iso.slice(8)),
    hour,
    15,
  )

describe('slotOf', () => {
  it('splits the day into four slots', () => {
    expect(slotOf(6)).toBe('morning')
    expect(slotOf(11)).toBe('morning')
    expect(slotOf(12)).toBe('afternoon')
    expect(slotOf(17)).toBe('evening')
    expect(slotOf(22)).toBe('night')
    expect(slotOf(3)).toBe('night')
  })
})

describe('greetingLine', () => {
  it('welcomes a new person, with or without a name', () => {
    expect(
      greetingLine({ now: at('2026-09-30', 9), name: 'Emmanuel', isNew: true }),
    ).toBe('Welcome, Emmanuel')
    expect(greetingLine({ now: at('2026-09-30', 9), isNew: true })).toBe(
      'Welcome to Honeylist',
    )
  })

  it('says welcome back after two or more days away', () => {
    const line = greetingLine({
      now: at('2026-09-30', 9),
      name: 'Ada',
      daysAway: 3,
    })
    expect(line).toMatch(/back|again/)
    expect(line.endsWith(', Ada')).toBe(true)
    // One day away is a normal day.
    expect(greetingLine({ now: at('2026-09-30', 9), daysAway: 1 })).not.toMatch(
      /back|again/,
    )
  })

  it('uses weekday lines on Monday morning, Friday and the weekend', () => {
    expect(greetingLine({ now: at('2026-09-28', 8) })).toMatch(/Monday|week/)
    expect(greetingLine({ now: at('2026-10-02', 14) })).toMatch(
      /Friday|weekend/,
    )
    const sat = greetingLine({ now: at('2026-10-03', 9) })
    expect([
      'Happy Saturday',
      'Easy Saturday morning',
      'Good morning',
    ]).toContain(sat)
  })

  it('uses time of day lines on an ordinary weekday', () => {
    const morning = greetingLine({ now: at('2026-09-30', 8) })
    expect([
      'Good morning',
      'Morning',
      'Hope you slept well',
      'Rise and shine',
    ]).toContain(morning)
    expect(['Still up', 'Late one tonight', 'Hello, night owl']).toContain(
      greetingLine({ now: at('2026-09-30', 23) }),
    )
  })

  it('is stable within a day and slot', () => {
    const a = greetingLine({ now: at('2026-09-30', 13), name: 'Emmanuel' })
    const b = greetingLine({ now: at('2026-09-30', 16), name: 'Emmanuel' })
    expect(a).toBe(b)
  })

  it('appends the name and reads naturally without one', () => {
    for (let h = 0; h < 24; h++) {
      for (const d of [
        '2026-09-27',
        '2026-09-28',
        '2026-09-30',
        '2026-10-02',
        '2026-10-03',
      ]) {
        const plain = greetingLine({ now: at(d, h) })
        const named = greetingLine({ now: at(d, h), name: '  Emmanuel ' })
        expect(named).toMatch(/Emmanuel$/)
        expect(plain).not.toMatch(/,$|\s$|undefined|null/)
        expect(plain + named).not.toMatch(/[–—-]/)
      }
    }
  })
})

describe('nextVisit', () => {
  it('starts, counts sessions and remembers the previous day', () => {
    const first = nextVisit(null, '2026-09-28', true)
    expect(first).toEqual({ day: '2026-09-28', prev: null, count: 1 })
    const sameDay = nextVisit(first, '2026-09-28', true)
    expect(sameDay).toEqual({ day: '2026-09-28', prev: null, count: 2 })
    const reload = nextVisit(sameDay, '2026-09-28', false)
    expect(reload.count).toBe(2)
    const later = nextVisit(reload, '2026-10-01', true)
    expect(later).toEqual({ day: '2026-10-01', prev: '2026-09-28', count: 3 })
    // A reload later that day keeps the previous day, so "Welcome back" holds all day.
    expect(nextVisit(later, '2026-10-01', false).prev).toBe('2026-09-28')
  })
})
