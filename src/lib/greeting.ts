// The small line above the Home heading. Warm, short, no emoji and no dashes.
// It depends on the time of day, the weekday, and whether the person is new or back after a break.
// The pick is stable for a whole day (same slot, same line) so it never flickers between renders.

type Line = (name: string | null) => string

/** "Good morning" becomes "Good morning, Emmanuel" when there is a name. */
const n =
  (base: string): Line =>
  (name) =>
    name ? `${base}, ${name}` : base
/** A line that needs different words when there is no name. */
const pair =
  (withName: (name: string) => string, plain: string): Line =>
  (name) =>
    name ? withName(name) : plain

export type Slot = 'morning' | 'afternoon' | 'evening' | 'night'

export function slotOf(hour: number): Slot {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'night'
}

const TIME: Record<Slot, Line[]> = {
  morning: [
    n('Good morning'),
    n('Morning'),
    n('Hope you slept well'),
    n('Rise and shine'),
  ],
  afternoon: [
    n('Good afternoon'),
    n('Hope your day is going well'),
    n('Hello again'),
  ],
  evening: [
    n('Good evening'),
    n('Hope today was kind to you'),
    n('Nice to see you this evening'),
  ],
  night: [
    n('Still up'),
    n('Late one tonight'),
    pair((x) => `Hello, ${x}`, 'Hello, night owl'),
  ],
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

/** Day specific lines. They take over the slot when they exist, so the weekday is noticeable. */
function dayLines(day: number, slot: Slot): Line[] | null {
  const dayName = WEEKDAYS[day]
  if (slot === 'night') return null
  if (day === 1 && slot === 'morning')
    return [
      n('Happy Monday'),
      n('Fresh week ahead'),
      n('Good morning and happy Monday'),
    ]
  if (day === 5)
    return slot === 'evening'
      ? [
          n('Happy Friday'),
          n('The weekend is here'),
          n('Good evening and happy Friday'),
        ]
      : [n('Happy Friday'), n('Friday at last'), n('Nearly the weekend')]
  if (day === 6 || day === 0) {
    if (slot === 'morning')
      return [
        n(`Happy ${dayName}`),
        n(`Easy ${dayName} morning`),
        n('Good morning'),
      ]
    if (slot === 'afternoon')
      return [
        n(`Happy ${dayName}`),
        n('Hope your weekend is restful'),
        n('Good afternoon'),
      ]
    return day === 0
      ? [
          n('Good evening'),
          n('Ready for the week ahead'),
          n('Hope your Sunday was restful'),
        ]
      : [
          n('Good evening'),
          n('Enjoy your Saturday evening'),
          n('Happy Saturday'),
        ]
  }
  return null
}

const NEW: Line[] = [pair((x) => `Welcome, ${x}`, 'Welcome to Honeylist')]
const BACK: Line[] = [
  n('Welcome back'),
  n('Good to see you again'),
  n('Nice to have you back'),
]

/** Small stable hash so a given day and slot always picks the same line. */
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export interface GreetingInput {
  now: Date
  name?: string | null
  /** True when the account was created today (a brand new person). */
  isNew?: boolean
  /** Whole days since the previous visit on another day, or null when unknown. */
  daysAway?: number | null
}

export function greetingLine({
  now,
  name,
  isNew,
  daysAway,
}: GreetingInput): string {
  const clean = name?.trim() || null
  const slot = slotOf(now.getHours())
  const day = now.getDay()
  const [kind, pool] = isNew
    ? ['new', NEW]
    : daysAway != null && daysAway >= 2
      ? ['back', BACK]
      : [`${day}-${slot}`, dayLines(day, slot) ?? TIME[slot]]
  const key = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}:${kind}`
  return pool[hash(key) % pool.length](clean)
}
