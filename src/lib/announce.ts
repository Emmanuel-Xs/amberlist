import type { QueryClient } from '@tanstack/react-query'
import { qk } from '#/lib/api'
import type { Task } from '#/lib/api'
import { addedMessage } from '#/lib/messages'
import { toast } from '#/lib/store'

/** Friendly "added" toast for a newly created task (caller plays the sound). */
export function announceAdded(qc: QueryClient, created: Task) {
  const all = qc.getQueryData<Task[]>(qk.tasks) ?? []
  const list = all.some((t) => t.id === created.id) ? all : [created, ...all]
  toast({
    tone: 'success',
    silent: true,
    badge: 'logo',
    ...addedMessage(created, list),
  })
}
