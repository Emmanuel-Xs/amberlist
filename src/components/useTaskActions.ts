import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { qk, useTaskMutations } from '#/lib/api'
import type { Task } from '#/lib/api'
import { groupOf, toISODate } from '#/lib/dates'
import { confetti, sound } from '#/lib/feedback'
import { TICK_HOLD_MS } from '#/lib/motion'
import { doneMessage } from '#/lib/messages'
import { toast } from '#/lib/store'

/** Complete and delete with Undo instead of confirm dialogs, plus the rare celebration. */
export function useTaskActions() {
  const qc = useQueryClient()
  const m = useTaskMutations()

  const toggle = (t: Task) => {
    const done = t.status !== 'done'
    if (!done) {
      m.update.mutate({ id: t.id, status: 'todo' })
      return
    }
    // Hold briefly so the tick is seen before the row glides to Completed; Undo cancels the hold.
    let pending = true
    const timer = setTimeout(() => {
      pending = false
      m.update.mutate({ id: t.id, status: 'done' })
    }, TICK_HOLD_MS)
    const undo = () => {
      sound('undo')
      if (pending) {
        pending = false
        clearTimeout(timer)
        window.dispatchEvent(new CustomEvent('task-untick', { detail: t.id }))
      } else m.update.mutate({ id: t.id, status: t.status })
    }
    const today = toISODate(new Date())
    const all = qc.getQueryData<Task[]>(qk.tasks) ?? []
    const wasToday =
      groupOf(t, today) === 'today' || groupOf(t, today) === 'overdue'
    const leftToday = all.filter(
      (x) =>
        x.id !== t.id &&
        x.status !== 'done' &&
        ['today', 'overdue'].includes(groupOf(x, today)),
    )
    if (wasToday && leftToday.length === 0) {
      sound('celebrate')
      confetti()
      toast({
        tone: 'success',
        silent: true,
        badge: 'logo',
        message: 'All done for today',
        detail: 'Nice work. Rest, or pull something forward.',
      })
      return
    }
    sound('complete')
    toast({
      tone: 'success',
      silent: true,
      badge: 'check',
      ...doneMessage(t, all),
      actionLabel: 'Undo',
      onAction: undo,
    })
  }

  const remove = (t: Task, after?: () => void) => {
    // Deleting is delayed by the Undo window, so Undo simply cancels it.
    const prev = qc.getQueryData<Task[]>(qk.tasks)
    qc.setQueryData<Task[]>(qk.tasks, (old) =>
      old?.filter((x) => x.id !== t.id),
    )
    sound('delete')
    let undone = false
    const timer = setTimeout(() => {
      if (!undone) m.remove.mutate(t.id)
    }, 4200)
    toast({
      badge: 'trash',
      message: 'Task deleted',
      detail: t.subtasks.length
        ? `Its ${t.subtasks.length} subtask${t.subtasks.length === 1 ? '' : 's'} went with it.`
        : undefined,
      actionLabel: 'Undo',
      onAction: () => {
        undone = true
        clearTimeout(timer)
        sound('undo')
        if (prev) qc.setQueryData(qk.tasks, prev)
      },
    })
    after?.()
  }

  const duplicate = (t: Task) =>
    m.create.mutate(
      {
        title: `${t.title} (copy)`,
        categoryId: t.categoryId,
        startDate: t.startDate,
        startTime: t.startTime,
        endTime: t.endTime,
        dueDate: t.dueDate,
        priority: t.priority,
        subtasks: t.subtasks.map((s) => s.title),
      },
      { onSuccess: () => toast({ icon: 'copy', message: 'Task duplicated' }) },
    )

  const start = (t: Task) =>
    m.update.mutate({ id: t.id, status: 'in_progress' })

  return { toggle, remove, duplicate, start, mutations: m }
}

/**
 * Shows a task as ticked the moment it's clicked, during the short hold before the real update.
 * Clears when the task's status changes or when Undo cancels the hold.
 */
export function useTicked(task: Task) {
  const [ticked, setTicked] = useState(false)
  useEffect(() => setTicked(false), [task.status])
  useEffect(() => {
    const off = (e: Event) => {
      if ((e as CustomEvent<string>).detail === task.id) setTicked(false)
    }
    window.addEventListener('task-untick', off)
    return () => window.removeEventListener('task-untick', off)
  }, [task.id])
  return [ticked, setTicked] as const
}
