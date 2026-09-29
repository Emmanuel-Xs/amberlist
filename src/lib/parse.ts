import { addDays, parseISO } from './dates'

export interface Parsed {
  title: string
  startDate?: string
  startTime?: string
  endTime?: string
  dueDate?: string
  category?: string
  priority?: 'low' | 'medium' | 'high'
  chips: {
    kind: 'date' | 'time' | 'due' | 'category' | 'priority'
    label: string
    raw: string
  }[]
}

const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]
const SHORT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function weekday(word: string): number {
  const w = word.toLowerCase()
  let i = WEEKDAYS.indexOf(w)
  if (i < 0) i = SHORT.indexOf(w)
  if (i < 0 && w.length >= 3) i = WEEKDAYS.findIndex((d) => d.startsWith(w))
  return i
}

function nextWeekday(today: string, target: number, forceNext = false): string {
  const cur = parseISO(today).getDay()
  let diff = (target - cur + 7) % 7
  if (diff === 0 || forceNext)
    diff = diff === 0 ? 7 : diff + (forceNext && diff < 7 ? 7 : 0)
  return addDays(today, diff)
}

function dayWord(word: string, today: string): string | null {
  const w = word.toLowerCase()
  if (w === 'today' || w === 'tonight') return today
  if (w === 'yesterday') return addDays(today, -1)
  if (w === 'tomorrow' || w === 'tmr' || w === 'tmrw') return addDays(today, 1)
  const i = weekday(w)
  return i >= 0 ? nextWeekday(today, i) : null
}

function to24(h: number, m: number, mer?: string): string | null {
  if (mer) {
    const pm = mer.toLowerCase() === 'pm'
    if (h < 1 || h > 12) return null
    if (pm && h !== 12) h += 12
    if (!pm && h === 12) h = 0
  }
  if (h > 23 || m > 59) return null
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const label = (iso: string, today: string) => {
  if (iso === today) return 'Today'
  if (iso === addDays(today, 1)) return 'Tomorrow'
  return parseISO(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/**
 * Light quick-add parsing: "Call mum tomorrow 5pm #personal !high", "Submit report due fri",
 * "Standup 10-10:30". Anything it does not understand stays in the title.
 */
export function parseQuickAdd(input: string, today: string): Parsed {
  let text = ` ${input.trim()} `
  const out: Parsed = { title: '', chips: [] }
  const take = (re: RegExp, fn: (m: RegExpMatchArray) => boolean) => {
    const m = text.match(re)
    if (m && fn(m)) text = text.replace(m[0], ' ')
  }

  take(/\s#([\p{L}\d_-]{1,40})(?=\s)/u, (m) => {
    out.category = m[1]
    out.chips.push({
      kind: 'category',
      label: m[1][0].toUpperCase() + m[1].slice(1),
      raw: m[0].trim(),
    })
    return true
  })
  take(/\s!(high|medium|med|low)(?=\s)/i, (m) => {
    const p = m[1].toLowerCase()
    out.priority = p === 'med' ? 'medium' : (p as Parsed['priority'])
    out.chips.push({
      kind: 'priority',
      label: `${out.priority![0].toUpperCase()}${out.priority!.slice(1)} priority`,
      raw: m[0].trim(),
    })
    return true
  })
  take(
    /\sdue\s+(today|tonight|tomorrow|yesterday|tmrw?|[a-z]{3,9})(?=\s)/i,
    (m) => {
      const d = dayWord(m[1], today)
      if (!d) return false
      out.dueDate = d
      out.chips.push({
        kind: 'due',
        label: `Due ${label(d, today).toLowerCase() === 'today' ? 'today' : label(d, today)}`,
        raw: m[0].trim(),
      })
      return true
    },
  )
  take(/\snext week(?=\s)/i, () => {
    out.startDate = nextWeekday(today, 1, true)
    out.chips.push({
      kind: 'date',
      label: label(out.startDate, today),
      raw: 'next week',
    })
    return true
  })
  if (!out.startDate) {
    take(
      /\s(today|tonight|tomorrow|tmrw?|sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?)(?=\s)/i,
      (m) => {
        const d = dayWord(m[1], today)
        if (!d) return false
        out.startDate = d
        out.chips.push({
          kind: 'date',
          label: label(d, today),
          raw: m[0].trim(),
        })
        return true
      },
    )
  }
  // Ranges first: 10-10:30, 10:00-11:00, 9am-10am
  take(
    /\s(?:at\s)?(\d{1,2})(?::(\d{2}))?\s?(am|pm)?\s?(?:-|to)\s?(\d{1,2})(?::(\d{2}))?\s?(am|pm)?(?=\s)/i,
    (m) => {
      const merEnd = m[6]
      const a = to24(Number(m[1]), Number(m[2] ?? 0), m[3] ?? merEnd)
      const b = to24(Number(m[4]), Number(m[5] ?? 0), merEnd)
      if (!a || !b) return false
      out.startTime = a
      out.endTime = b
      out.chips.push({ kind: 'time', label: `${a} to ${b}`, raw: m[0].trim() })
      return true
    },
  )
  if (!out.startTime) {
    take(
      /\s(?:at\s)?(\d{1,2})(?::(\d{2}))?\s?(am|pm)(?=\s)|\s(?:at\s)?([01]?\d|2[0-3]):([0-5]\d)(?=\s)/i,
      (m) => {
        const t = m[3]
          ? to24(Number(m[1]), Number(m[2] ?? 0), m[3])
          : to24(Number(m[4]), Number(m[5]))
        if (!t) return false
        out.startTime = t
        out.chips.push({ kind: 'time', label: t, raw: m[0].trim() })
        return true
      },
    )
  }
  if (out.startTime && !out.startDate && !out.dueDate) out.startDate = today
  out.title = text.replace(/\s+/g, ' ').trim()
  return out
}
