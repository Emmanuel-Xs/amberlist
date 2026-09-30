import { useQueryClient } from '@tanstack/react-query'
import { habitKeys, useHabitMutations } from '#/lib/api'
import type { Habit } from '#/lib/api'
import { toISODate } from '#/lib/dates'
import { sound } from '#/lib/feedback'
import { habitStats, milestoneReached, streakLabel } from '#/lib/streaks'
import { toast } from '#/lib/store'

const MILESTONE_COPY: Record<number, string> = {
  3: 'Three in a row. A rhythm is forming.',
  7: 'A whole week. This is becoming yours.',
  21: 'Three weeks strong. That is a real routine.',
}

/**
 * Check ins, archive and delete for habits. One tap checks in, a second tap the same day undoes.
 * Milestones (3, 7, 21) get a flame toast; reaching the goal gets the celebrate sound and a big toast.
 */
export function useHabitActions() {
  const qc = useQueryClient()
  const m = useHabitMutations()

  const setDay = (h: Habit, date: string, done: boolean) =>
    m.checkin.mutate(
      { id: h.id, date, done },
      {
        onError: () => {
          sound('error')
          toast({
            tone: 'error',
            icon: 'alert',
            message: "Couldn't save your check in",
            actionLabel: 'Retry',
            onAction: () => setDay(h, date, done),
            duration: 0,
          })
        },
      },
    )

  const toggleToday = (h: Habit) => {
    const today = toISODate(new Date())
    const before = habitStats(h, h.checkins, today)
    if (before.doneToday) {
      setDay(h, today, false)
      sound('undo')
      return
    }
    setDay(h, today, true)
    const after = habitStats(h, [...h.checkins, today], today)
    const undo = () => {
      sound('undo')
      setDay(h, today, false)
    }
    if (after.goal?.reached && !before.goal?.reached) {
      // confetti() left feedback.ts with the round 3 celebrations; the goal moment is sound plus toast
      // until a habit goal celebration is designed.
      sound('celebrate')
      toast({
        tone: 'success',
        silent: true,
        badge: 'logo',
        message: `Goal reached: ${after.goal.of} of ${after.goal.of}`,
        detail: `You built "${h.name}". Keep going if it feels good.`,
        actionLabel: 'Undo',
        onAction: undo,
        duration: 6000,
      })
      return
    }
    sound('complete')
    const milestone = milestoneReached(before.current, after.current)
    if (milestone) {
      toast({
        tone: 'success',
        silent: true,
        badge: 'flame',
        message: `${milestone} ${after.unit} streak`,
        detail:
          after.unit === 'day'
            ? MILESTONE_COPY[milestone]
            : 'Week after week. Lovely consistency.',
        actionLabel: 'Undo',
        onAction: undo,
      })
      return
    }
    toast({
      tone: 'success',
      silent: true,
      badge: 'check',
      message: `${h.name}: checked in`,
      detail: after.goal
        ? `Day ${after.goal.day} of ${after.goal.of}. Nice.`
        : after.current > 1
          ? `${streakLabel(after.current, after.unit)} in a row.`
          : 'Day one. Small steps count.',
      actionLabel: 'Undo',
      onAction: undo,
    })
  }

  const setArchived = (h: Habit, archived: boolean) => {
    m.update.mutate({ id: h.id, archived })
    toast({
      tone: 'success',
      icon: archived ? 'inbox' : 'refresh',
      message: archived ? 'Habit archived' : 'Habit restored',
      detail: archived ? 'Your streak and check ins are kept.' : undefined,
      actionLabel: 'Undo',
      onAction: () => {
        sound('undo')
        m.update.mutate({ id: h.id, archived: !archived })
      },
    })
  }

  /** Acts at once with Undo, like tasks: the delete waits out the toast. */
  const remove = (h: Habit, after?: () => void) => {
    const prev = {
      active: qc.getQueryData<Habit[]>(habitKeys.all),
      all: qc.getQueryData<Habit[]>(habitKeys.archived),
    }
    const without = (list?: Habit[]) => list?.filter((x) => x.id !== h.id)
    if (prev.active) qc.setQueryData(habitKeys.all, without(prev.active))
    if (prev.all) qc.setQueryData(habitKeys.archived, without(prev.all))
    sound('delete')
    let undone = false
    const timer = setTimeout(() => {
      if (!undone) m.remove.mutate(h.id)
    }, 4200)
    toast({
      badge: 'trash',
      message: 'Habit deleted',
      detail: h.name,
      actionLabel: 'Undo',
      onAction: () => {
        undone = true
        clearTimeout(timer)
        sound('undo')
        if (prev.active) qc.setQueryData(habitKeys.all, prev.active)
        if (prev.all) qc.setQueryData(habitKeys.archived, prev.all)
      },
    })
    after?.()
  }

  return { toggleToday, setDay, setArchived, remove }
}
