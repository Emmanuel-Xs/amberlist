import { z } from 'zod'
import { isAllowedCustomColor } from '../lib/colors'

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM')
export const COLORS = ['lavender', 'butter', 'mint', 'peach', 'sky'] as const
export const NOTE_COLORS = ['surface', ...COLORS] as const
const CUSTOM_COLOR_ERROR =
  'Pick one of the colours, or a soft light shade (#rrggbb, 70% to 90% lightness).'
/** A preset token name, or a soft custom hex that keeps on-pastel text readable. */
const colorOf = <T extends readonly [string, ...string[]]>(presets: T) =>
  z
    .string()
    .max(7)
    .refine(
      (c) =>
        (presets as readonly string[]).includes(c) || isAllowedCustomColor(c),
      CUSTOM_COLOR_ERROR,
    )

export const ICONS = [
  'folder',
  'pen',
  'book',
  'home',
  'target',
  'droplet',
  'sun',
  'cart',
  'flame',
  'note',
] as const

export const taskCreate = z
  .object({
    title: z.string().trim().min(1, 'Give the task a title.').max(200),
    categoryId: z.string().max(64).nullable().optional(),
    startDate: date.nullable().optional(),
    startTime: time.nullable().optional(),
    endTime: time.nullable().optional(),
    dueDate: date.nullable().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    status: z.enum(['todo', 'in_progress', 'done']).optional(),
    remind: z.boolean().optional(),
    subtasks: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
  })
  .strict()

export const taskUpdate = taskCreate.omit({ subtasks: true }).partial().strict()

export const subtaskCreate = z
  .object({ title: z.string().trim().min(1).max(200) })
  .strict()
export const subtaskUpdate = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    done: z.boolean().optional(),
  })
  .strict()

export const noteCreate = z
  .object({
    title: z.string().max(200).optional(),
    body: z.string().max(50_000).optional(),
    color: colorOf(NOTE_COLORS).optional(),
    pinned: z.boolean().optional(),
    taskId: z.string().max(64).nullable().optional(),
  })
  .strict()
export const noteUpdate = noteCreate.partial().strict()
export const scratchpadUpdate = z
  .object({ body: z.string().max(50_000) })
  .strict()

export const categoryCreate = z
  .object({
    name: z.string().trim().min(1, 'Name the folder.').max(40),
    color: colorOf(COLORS).optional(),
    icon: z.enum(ICONS).optional(),
  })
  .strict()
export const categoryUpdate = categoryCreate.partial().strict()

export const prefsUpdate = z
  .object({
    displayName: z.string().trim().max(40).nullable().optional(),
    theme: z.enum(['dark', 'light', 'system']).optional(),
    sounds: z.boolean().optional(),
    // Marks the welcome screen as done (finished or skipped). It can't be undone.
    onboarded: z.literal(true).optional(),
    // Hides one save nudge for good (the day is recorded on the server).
    nudgeDismissed: z.enum(['task', 'days']).optional(),
  })
  .strict()

export const taskFilters = z.object({
  categoryId: z.string().max(64).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  q: z.string().max(200).optional(),
})

// ---- AI (Phase 3) ----
export const aiBreakdownInput = z
  .object({ taskId: z.string().min(1).max(64) })
  .strict()
export const aiExtractInput = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, 'Write something first.')
      .max(4000, 'Keep it under 4000 characters.'),
    // The browser's local date, so "tomorrow" resolves in the user's day.
    today: date.optional(),
  })
  .strict()

/** The answer to the merge prompt after a Google sign in. */
export const mergeChoice = z
  .object({ choice: z.enum(['merge', 'discard']) })
  .strict()

// ---------- Habits (Phase 2) ----------
export const HABIT_FREQUENCIES = ['daily', 'weekdays', 'x_per_week'] as const
const realDate = date.refine((d) => {
  const [y, m, day] = d.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, day))
  return t.getUTCMonth() === m - 1 && t.getUTCDate() === day
}, 'Not a real date.')

const habitFields = z
  .object({
    name: z.string().trim().min(1, 'Name the habit.').max(80),
    icon: z.enum(ICONS).optional(),
    categoryId: z.string().max(64).nullable().optional(),
    color: colorOf(COLORS).optional(),
    frequency: z.enum(HABIT_FREQUENCIES).optional(),
    daysOfWeek: z
      .array(z.number().int().min(1).max(7))
      .min(1, 'Pick at least one day.')
      .max(7)
      .nullable()
      .optional(),
    timesPerWeek: z.number().int().min(1).max(7).nullable().optional(),
    goalDays: z.number().int().min(1).max(365).nullable().optional(),
    reminderTime: time.nullable().optional(),
    archived: z.boolean().optional(),
  })
  .strict()

export const habitCreate = habitFields.omit({ archived: true }).strict()
export const habitUpdate = habitFields.partial().strict()

/** Check in (or undo) one day. Without `done` it toggles. */
export const habitCheckinToggle = z
  .object({
    // Local dates run up to 14 hours ahead of UTC, so allow a day and a half of slack.
    date: realDate.refine(
      (d) =>
        d <= new Date(Date.now() + 36 * 3_600_000).toISOString().slice(0, 10),
      "You can't check in for a day that hasn't happened yet.",
    ),
    done: z.boolean().optional(),
  })
  .strict()
