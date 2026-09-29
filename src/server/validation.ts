import { z } from 'zod'

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM')
export const COLORS = ['lavender', 'butter', 'mint', 'peach', 'sky'] as const
export const NOTE_COLORS = ['surface', ...COLORS] as const
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
    color: z.enum(NOTE_COLORS).optional(),
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
    color: z.enum(COLORS).optional(),
    icon: z.enum(ICONS).optional(),
  })
  .strict()
export const categoryUpdate = categoryCreate.partial().strict()

export const prefsUpdate = z
  .object({
    displayName: z.string().trim().max(40).nullable().optional(),
    theme: z.enum(['dark', 'light', 'system']).optional(),
    sounds: z.boolean().optional(),
  })
  .strict()

export const taskFilters = z.object({
  categoryId: z.string().max(64).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  q: z.string().max(200).optional(),
})
