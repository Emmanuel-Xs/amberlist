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
}
export type PrefsUpdate = Partial<
  Pick<Prefs, 'displayName' | 'theme' | 'sounds'>
> & { onboarded?: true }
export type TaskInput = Partial<
  Omit<Task, 'id' | 'subtasks' | 'noteCount' | 'createdAt' | 'completedAt'>
> & { subtasks?: string[] }

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
      api<Task>(`/tasks/${id}`, { method: 'PATCH', json: input }),
    onMutate: ({ id, ...input }) => ({
      prev: patchCache(id, (t) => ({ ...t, ...input }) as Task),
    }),
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.tasks, ctx.prev),
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
  return { create, update, remove, addSubtask, updateSubtask, deleteSubtask }
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
