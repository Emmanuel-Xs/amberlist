import type { RepeatEnd, RepeatRule } from '#/lib/repeat'
import type { HexColor, NotePresetColor, PresetColor } from '#/lib/colors'
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

export interface Subtask {
  id: string
  taskId: string
  title: string
  done: boolean
  position: number
}
export interface Task {
  id: string
  title: string
  categoryId: string | null
  startDate: string | null
  startTime: string | null
  endTime: string | null
  dueDate: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  completedAt: string | null
  remind: boolean
  /** Repeating: one open task per series; finishing it makes the next. */
  repeatRule: RepeatRule | null
  repeatEnd: RepeatEnd | null
  /** Minutes before the start (null off) and the moment it will fire (null once sent). */
  remindOffset: number | null
  remindAt: string | null
  createdAt: string
  subtasks: Subtask[]
  noteCount: number
}
export interface Note {
  id: string
  title: string
  body: string
  /** A preset token name or a soft custom `#rrggbb`. */
  color: NotePresetColor | HexColor
  pinned: boolean
  taskId: string | null
  updatedAt: string
}
export interface Category {
  id: string
  name: string
  /** A preset token name or a soft custom `#rrggbb`. */
  color: PresetColor | HexColor
  icon: string
  taskCount: number
  doneCount: number
}
export interface Prefs {
  displayName: string | null
  theme: 'dark' | 'light' | 'system'
  sounds: boolean
  /** True once the welcome screen is done, or for guests who already had tasks, notes or a name. */
  onboarded: boolean
  onboardedAt: string | null
  /** When the account was made (ISO), used for the "Welcome" greeting on day one. */
  joinedAt: string | null
  /** True for an anonymous guest; false once signed in with Google. */
  isGuest: boolean
  isAnonymous: boolean
  /** Google account details, null for guests. */
  email: string | null
  image: string | null
  accountName: string | null
  /** False when the Google keys are missing on the server: hide the sign in button. */
  googleEnabled: boolean
  /** Set after a Google sign in when this device and the account both had data. */
  pendingMerge: { tasks: number; notes: number } | null
  /** The day (ISO) each save nudge was dismissed. */
  nudgeState: { task?: string; days?: string; notify?: string } | null
  /** IANA zone the reminders count in. */
  timezone: string | null
}
export type PrefsUpdate = Partial<
  Pick<Prefs, 'displayName' | 'theme' | 'sounds'>
> & {
  onboarded?: true
  nudgeDismissed?: 'task' | 'days' | 'notify'
  timezone?: string
}
export type TaskInput = Partial<
  Omit<
    Task,
    | 'id'
    | 'subtasks'
    | 'noteCount'
    | 'createdAt'
    | 'completedAt'
    | 'remind'
    | 'remindAt'
  >
> & { subtasks?: string[] }
/** What finishing a task returns: the task, plus the next one when it repeats. */
export type TaskResult = Task & { next?: Task | null }

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export async function api<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok)
    throw new ApiError(
      res.status,
      (data as { error?: string } | null)?.error ?? 'Something went wrong.',
    )
  return data as T
}

export const qk = {
  tasks: ['tasks'] as const,
  categories: ['categories'] as const,
  notes: ['notes'] as const,
  scratchpad: ['scratchpad'] as const,
  me: ['me'] as const,
}

export const tasksQuery = queryOptions({
  queryKey: qk.tasks,
  queryFn: () => api<Task[]>('/tasks'),
})
export const categoriesQuery = queryOptions({
  queryKey: qk.categories,
  queryFn: () => api<Category[]>('/categories'),
})
export const notesQuery = queryOptions({
  queryKey: qk.notes,
  queryFn: () => api<Note[]>('/notes'),
})
export const scratchpadQuery = queryOptions({
  queryKey: qk.scratchpad,
  queryFn: () => api<Note>('/scratchpad'),
})
export const meQuery = queryOptions({
  queryKey: qk.me,
  queryFn: () => api<Prefs>('/me'),
})

/** Saves prefs (name, theme, sounds, onboarded) and updates every screen that reads the me query. */
export function useUpdateMe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: PrefsUpdate) =>
      api<Prefs>('/me', { method: 'PATCH', json: p }),
    onSuccess: (p) => qc.setQueryData(qk.me, p),
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.me }),
  })
}

export const useTasks = () => useQuery(tasksQuery)
export const useCategories = () => useQuery(categoriesQuery)
export const useNotes = () => useQuery(notesQuery)

/** Task mutations update the cache first so ticks feel instant, then roll back on error. */
export function useTaskMutations() {
  const qc = useQueryClient()
  const patchCache = (id: string, fn: (t: Task) => Task) => {
    const prev = qc.getQueryData<Task[]>(qk.tasks)
    if (prev)
      qc.setQueryData<Task[]>(
        qk.tasks,
        prev.map((t) => (t.id === id ? fn(t) : t)),
      )
    return prev
  }
  const settle = () => {
    void qc.invalidateQueries({ queryKey: qk.tasks })
    void qc.invalidateQueries({ queryKey: qk.categories })
  }
  const replace = (t: Task) =>
    qc.setQueryData<Task[]>(qk.tasks, (old) =>
      old ? old.map((x) => (x.id === t.id ? t : x)) : old,
    )

  const create = useMutation({
    mutationFn: (input: TaskInput) =>
      api<Task>('/tasks', { method: 'POST', json: input }),
    onSuccess: (t) =>
      qc.setQueryData<Task[]>(qk.tasks, (old) => [t, ...(old ?? [])]),
    onSettled: settle,
  })
  const update = useMutation({
    mutationFn: ({ id, ...input }: TaskInput & { id: string }) =>
      api<TaskResult>(`/tasks/${id}`, { method: 'PATCH', json: input }),
    onMutate: ({ id, ...input }) => ({
      prev: patchCache(id, (t) => ({ ...t, ...input }) as Task),
    }),
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.tasks, ctx.prev),
    onSuccess: ({ next, ...t }) => {
      replace(t)
      // Finishing a repeating task made the next one on the server: show it at once.
      if (next)
        qc.setQueryData<Task[]>(qk.tasks, (old) =>
          old && !old.some((x) => x.id === next.id) ? [next, ...old] : old,
        )
    },
    onSettled: settle,
  })
  /** Skip this one: the open repeating task moves to its next day. */
  const skip = useMutation({
    mutationFn: (id: string) =>
      api<Task>(`/tasks/${id}/skip`, { method: 'POST' }),
    onSuccess: replace,
    onSettled: settle,
  })
  const snooze = useMutation({
    mutationFn: ({ id, minutes }: { id: string; minutes: number }) =>
      api<Task>(`/tasks/${id}/snooze`, { method: 'POST', json: { minutes } }),
    onSuccess: replace,
    onSettled: settle,
  })
  const remove = useMutation({
    mutationFn: (id: string) =>
      api<{ ok: true }>(`/tasks/${id}`, { method: 'DELETE' }),
    onMutate: (id) => {
      const prev = qc.getQueryData<Task[]>(qk.tasks)
      if (prev)
        qc.setQueryData<Task[]>(
          qk.tasks,
          prev.filter((t) => t.id !== id),
        )
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.tasks, ctx.prev),
    onSettled: settle,
  })
  const addSubtask = useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      api<Task>(`/tasks/${taskId}/subtasks`, {
        method: 'POST',
        json: { title },
      }),
    onSuccess: replace,
  })
  const updateSubtask = useMutation({
    mutationFn: ({
      id,
      done,
      title,
    }: {
      id: string
      taskId: string
      done?: boolean
      title?: string
    }) =>
      api<Task>(`/subtasks/${id}`, { method: 'PATCH', json: { done, title } }),
    onMutate: ({ id, taskId, ...input }) => ({
      prev: patchCache(taskId, (t) => ({
        ...t,
        subtasks: t.subtasks.map((s) => (s.id === id ? { ...s, ...input } : s)),
      })),
    }),
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.tasks, ctx.prev),
    onSuccess: replace,
  })
  const deleteSubtask = useMutation({
    mutationFn: ({ id }: { id: string; taskId: string }) =>
      api<Task>(`/subtasks/${id}`, { method: 'DELETE' }),
    onSuccess: replace,
  })
  return {
    create,
    update,
    skip,
    snooze,
    remove,
    addSubtask,
    updateSubtask,
    deleteSubtask,
  }
}

export function useNoteMutations() {
  const qc = useQueryClient()
  const settle = () => {
    void qc.invalidateQueries({ queryKey: qk.notes })
    void qc.invalidateQueries({ queryKey: qk.tasks })
  }
  const create = useMutation({
    mutationFn: (input: Partial<Note>) =>
      api<Note>('/notes', { method: 'POST', json: input }),
    onSuccess: (n) =>
      qc.setQueryData<Note[]>(qk.notes, (old) => [n, ...(old ?? [])]),
    onSettled: settle,
  })
  const update = useMutation({
    mutationFn: ({ id, ...input }: Partial<Note> & { id: string }) =>
      api<Note>(`/notes/${id}`, { method: 'PATCH', json: input }),
    onMutate: ({ id, ...input }) => {
      const prev = qc.getQueryData<Note[]>(qk.notes)
      if (prev)
        qc.setQueryData<Note[]>(
          qk.notes,
          prev.map((n) => (n.id === id ? { ...n, ...input } : n)),
        )
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.notes, ctx.prev),
  })
  const remove = useMutation({
    mutationFn: (id: string) => api(`/notes/${id}`, { method: 'DELETE' }),
    onMutate: (id) => {
      const prev = qc.getQueryData<Note[]>(qk.notes)
      if (prev)
        qc.setQueryData<Note[]>(
          qk.notes,
          prev.filter((n) => n.id !== id),
        )
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.notes, ctx.prev),
    onSettled: settle,
  })
  return { create, update, remove }
}

export function useCategoryMutations() {
  const qc = useQueryClient()
  const settle = () => {
    void qc.invalidateQueries({ queryKey: qk.categories })
    void qc.invalidateQueries({ queryKey: qk.tasks })
  }
  return {
    create: useMutation({
      mutationFn: (input: Partial<Category>) =>
        api<Category>('/categories', { method: 'POST', json: input }),
      onSettled: settle,
    }),
    update: useMutation({
      mutationFn: ({ id, ...input }: Partial<Category> & { id: string }) =>
        api<Category>(`/categories/${id}`, { method: 'PATCH', json: input }),
      onSettled: settle,
    }),
    remove: useMutation({
      mutationFn: (id: string) =>
        api(`/categories/${id}`, { method: 'DELETE' }),
      onSettled: settle,
    }),
  }
}

// ---------- Habits (Phase 2) ----------
export type HabitFrequency = 'daily' | 'weekdays' | 'x_per_week'
export interface Habit {
  id: string
  name: string
  icon: string
  categoryId: string | null
  /** A preset token name or a soft custom `#rrggbb`. */
  color: PresetColor | HexColor
  frequency: HabitFrequency
  /** ISO weekdays, 1 Mon to 7 Sun, for 'weekdays'. */
  daysOfWeek: number[] | null
  timesPerWeek: number | null
  goalDays: number | null
  reminderTime: string | null
  archived: boolean
  createdAt: string
  /** Every check in, local YYYY-MM-DD, ascending. */
  checkins: string[]
}
export type HabitInput = Partial<Omit<Habit, 'id' | 'createdAt' | 'checkins'>>

export const habitKeys = {
  all: ['habits'] as const,
  archived: ['habits', 'archived'] as const,
}
export const habitsQuery = queryOptions({
  queryKey: habitKeys.all,
  queryFn: () => api<Habit[]>('/habits'),
})
/** Every habit, archived ones included (the Habits page lists them at the bottom). */
export const allHabitsQuery = queryOptions({
  queryKey: habitKeys.archived,
  queryFn: () => api<Habit[]>('/habits?archived=1'),
})
export const useHabits = () => useQuery(habitsQuery)

/** Habit mutations. Check ins patch the cache first so the tick feels instant. */
export function useHabitMutations() {
  const qc = useQueryClient()
  const settle = () => void qc.invalidateQueries({ queryKey: habitKeys.all })
  const patchAll = (id: string, fn: (h: Habit) => Habit) => {
    const prev = {
      active: qc.getQueryData<Habit[]>(habitKeys.all),
      all: qc.getQueryData<Habit[]>(habitKeys.archived),
    }
    const map = (list?: Habit[]) => list?.map((h) => (h.id === id ? fn(h) : h))
    if (prev.active) qc.setQueryData(habitKeys.all, map(prev.active))
    if (prev.all) qc.setQueryData(habitKeys.archived, map(prev.all))
    return prev
  }
  const restore = (prev?: { active?: Habit[]; all?: Habit[] }) => {
    if (prev?.active) qc.setQueryData(habitKeys.all, prev.active)
    if (prev?.all) qc.setQueryData(habitKeys.archived, prev.all)
  }
  const replace = (h: Habit) => patchAll(h.id, () => h)

  const create = useMutation({
    mutationFn: (input: HabitInput & { name: string }) =>
      api<Habit>('/habits', { method: 'POST', json: input }),
    onSuccess: (h) =>
      qc.setQueryData<Habit[]>(habitKeys.all, (old) => [...(old ?? []), h]),
    onSettled: settle,
  })
  const update = useMutation({
    mutationFn: ({ id, ...input }: HabitInput & { id: string }) =>
      api<Habit>(`/habits/${id}`, { method: 'PATCH', json: input }),
    onMutate: ({ id, ...input }) => ({
      prev: patchAll(id, (h) => ({ ...h, ...input })),
    }),
    onError: (_e, _v, ctx) => restore(ctx?.prev),
    onSuccess: replace,
    onSettled: settle,
  })
  const remove = useMutation({
    mutationFn: (id: string) => api(`/habits/${id}`, { method: 'DELETE' }),
    onSettled: settle,
  })
  const checkin = useMutation({
    mutationFn: ({
      id,
      date,
      done,
    }: {
      id: string
      date: string
      done: boolean
    }) =>
      api<Habit>(`/habits/${id}/checkins`, {
        method: 'POST',
        json: { date, done },
      }),
    onMutate: ({ id, date, done }) => ({
      prev: patchAll(id, (h) => ({
        ...h,
        checkins: done
          ? [...new Set([...h.checkins, date])].sort()
          : h.checkins.filter((d) => d !== date),
      })),
    }),
    onError: (_e, _v, ctx) => restore(ctx?.prev),
    onSuccess: replace,
  })
  return { create, update, remove, checkin }
}
