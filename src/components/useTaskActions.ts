import { useQueryClient } from '@tanstack/react-query'
import { qk, useTaskMutations } from '#/lib/api'
import type { Task } from '#/lib/api'
import { groupOf, toISODate } from '#/lib/dates'
import { confetti, sound } from '#/lib/feedback'
import { toast } from '#/lib/store'

/** Complete and delete with Undo instead of confirm dialogs, plus the rare celebration. */
export function useTaskActions() {
  const qc = useQueryClient()
  const m = useTaskMutations()

  const toggle = (t: Task) => {
    const done = t.status !== 'done'
    m.update.mutate({ id: t.id, status: done ? 'done' : 'todo' })
    if (!done) return
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
        icon: 'check',
        message: 'All done for today. Well played.',
      })
      return
    }
    sound('complete')
    toast({
      tone: 'success',
      icon: 'check',
      message: 'Task completed',
      actionLabel: 'Undo',
      onAction: () => {
        sound('undo')
        m.update.mutate({ id: t.id, status: t.status })
      },
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
      icon: 'trash',
      message: 'Task deleted',
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
