import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { qk, useTaskMutations } from '#/lib/api'
import type { Task } from '#/lib/api'
import { groupOf, toISODate } from '#/lib/dates'
import { sound } from '#/lib/feedback'
import { TICK_HOLD_MS } from '#/lib/motion'
import { doneMessage, repeatDoneMessage } from '#/lib/messages'
import { nextLabel } from '#/lib/repeat'
import {
  askSnooze as openSnooze,
  askStopRepeat as openStopRepeat,
  toast,
} from '#/lib/store'
import { celebrateAllDone } from './Celebrate'
import { tickSound } from './TickFill'

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
    // A repeating task makes its next one on the server; Undo removes it again.
    let nextId: Promise<string | null> | null = null
    const timer = setTimeout(() => {
      pending = false
      if (t.repeatRule)
        nextId = m.update
          .mutateAsync({ id: t.id, status: 'done' })
          .then((r) => r.next?.id ?? null)
          .catch(() => null)
      else m.update.mutate({ id: t.id, status: 'done' })
    }, TICK_HOLD_MS)
    let seal: ReturnType<typeof setTimeout> | undefined
    const undo = () => {
      sound('undo')
      clearTimeout(seal)
      if (pending) {
        pending = false
        clearTimeout(timer)
        window.dispatchEvent(new CustomEvent('task-untick', { detail: t.id }))
      } else {
        m.update.mutate({ id: t.id, status: t.status })
        void nextId?.then((id) => id && m.remove.mutate(id))
      }
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
    tickSound()
    if (wasToday && leftToday.length === 0) {
      // Let the tick land, then seal the comb (it says "All done for today" and plays celebrate).
      seal = setTimeout(celebrateAllDone, TICK_HOLD_MS)
      toast({
        tone: 'success',
        silent: true,
        badge: 'logo',
        message: 'Nice work',
        detail: t.repeatRule
          ? repeatDoneMessage(t, today).message.replace('Done. ', '') + '.'
          : 'Rest, or pull something forward.',
        actionLabel: 'Undo',
        onAction: undo,
      })
      return
    }
    toast({
      tone: 'success',
      silent: true,
      badge: 'check',
      ...(t.repeatRule ? repeatDoneMessage(t, today) : doneMessage(t, all)),
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
      detail: t.repeatRule
        ? 'It will not repeat again.'
        : t.subtasks.length
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
        repeatRule: t.repeatRule,
        repeatEnd: t.repeatEnd,
        remindOffset: t.remindOffset,
        subtasks: t.subtasks.map((s) => s.title),
      },
      { onSuccess: () => toast({ icon: 'copy', message: 'Task duplicated' }) },
    )

  const start = (t: Task) =>
    m.update.mutate({ id: t.id, status: 'in_progress' })

  /** Skip this one: the task moves to its next day and nothing lands in Completed. */
  const skip = (t: Task) =>
    m.skip.mutate(t.id, {
      onSuccess: (moved) =>
        toast({
          icon: 'skip',
          message: `Skipped. Next one is ${nextLabel(moved.startDate ?? '', toISODate(new Date()))}`,
          detail: 'Nothing was added to Completed.',
          actionLabel: 'Undo',
          onAction: () => {
            sound('undo')
            m.update.mutate({
              id: t.id,
              startDate: t.startDate,
              dueDate: t.dueDate,
              repeatEnd: t.repeatEnd,
            })
          },
        }),
      onError: (e) =>
        toast({
          tone: 'error',
          icon: 'alert',
          message: e.message,
          duration: 0,
        }),
    })

  /** After the confirm: the task stays, but no new ones are made. */
  const stopRepeating = (t: Task) => {
    m.update.mutate({ id: t.id, repeatRule: null, repeatEnd: null })
    toast({
      icon: 'repeat',
      message: 'Stopped repeating',
      detail: `${t.title} stays as a single task.`,
      actionLabel: 'Undo',
      onAction: () => {
        sound('undo')
        m.update.mutate({
          id: t.id,
          repeatRule: t.repeatRule,
          repeatEnd: t.repeatEnd,
        })
      },
    })
  }

  /** Push the reminder back. Undo restores the time it had. */
  const snooze = (t: Task, minutes: number) =>
    m.snooze.mutate(
      { id: t.id, minutes },
      {
        onSuccess: (r) =>
          toast({
            icon: 'bell',
            message: 'Snoozed',
            detail: r.remindAt
              ? `We will remind you again at ${new Date(r.remindAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`
              : undefined,
          }),
      },
    )

  return {
    toggle,
    remove,
    duplicate,
    start,
    skip,
    stopRepeating,
    snooze,
    askStopRepeat: openStopRepeat,
    askSnooze: openSnooze,
    mutations: m,
  }
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
