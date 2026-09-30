import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import type { Habit } from '#/lib/api'
import { SPRING_POP } from '#/lib/motion'
import {
  frequencyLabel,
  habitStats,
  isScheduled,
  streakLabel,
  weekDots,
} from '#/lib/streaks'
import { ICONS, Icon } from '#/ui/icons'
import type { IconName } from '#/ui/icons'
import { useHabitActions } from './useHabitActions'

/** The stored icon name, or the flame when it isn't one we know. */
export const habitIcon = (icon: string): IconName =>
  icon in ICONS ? (icon as IconName) : 'flame'

/** "Day 19 of 21", "2 of 3 this week" or the frequency, for the line under the name. */
export function habitMeta(h: Habit, today: string) {
  const s = habitStats(h, h.checkins, today)
  if (s.goal) return `Day ${s.goal.day} of ${s.goal.of}`
  if (h.frequency === 'x_per_week')
    return `${s.thisWeek} of ${h.timesPerWeek ?? 3} this week`
  return frequencyLabel(h)
}

/**
 * The approved HabitRow board: icon ring, name, meta and streak flame, one tap check in on the right.
 * `dots` adds this week's Monday to Sunday dots under the meta (Habits page).
 */
export function HabitRow({
  habit,
  today,
  dots = false,
}: {
  habit: Habit
  today: string
  dots?: boolean
}) {
  const { toggleToday } = useHabitActions()
  const stats = habitStats(habit, habit.checkins, today)
  const done = stats.doneToday
  const offDay = !isScheduled(habit, today)
  return (
    <div className={`habit-row${done ? ' is-done' : ''}`}>
      <Link
        to="/habits/$id"
        params={{ id: habit.id }}
        className="habit-row-link"
        aria-label={`${habit.name}, ${streakLabel(stats.current, stats.unit)} streak. Open details`}
      >
        <span className="habit-row-icon" aria-hidden="true">
          <Icon name={habitIcon(habit.icon)} size={22} />
        </span>
        <span className="habit-row-body">
          <span className="habit-row-name">{habit.name}</span>
          <span className="habit-row-meta">
            <span>
              {offDay && !done ? 'Rest day' : habitMeta(habit, today)}
            </span>
            <span className="habit-row-streak">
              <Icon name="flame" size={14} />
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={stats.current}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={SPRING_POP}
                >
                  {streakLabel(stats.current, stats.unit)}
                </motion.span>
              </AnimatePresence>
            </span>
          </span>
          {dots && (
            <span className="habit-dots" aria-hidden="true">
              {weekDots(habit, habit.checkins, today).map((d) => (
                <span
                  key={d.date}
                  className={[
                    'habit-dot',
                    d.done && 'is-done',
                    d.isToday && 'is-today',
                    !d.scheduled && 'is-off',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  title={d.label}
                >
                  {d.letter}
                </span>
              ))}
            </span>
          )}
        </span>
      </Link>
      <motion.button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`Check in: ${habit.name}`}
        className="habit-check"
        onClick={() => toggleToday(habit)}
        initial={false}
        whileTap={{ scale: 0.9 }}
        animate={done ? { scale: [1, 1.18, 1] } : { scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <AnimatePresence initial={false}>
          {done && (
            <motion.span
              key="tick"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0, transition: { duration: 0.12 } }}
              transition={SPRING_POP}
              style={{ display: 'grid' }}
            >
              <Icon name="check" size={18} strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
