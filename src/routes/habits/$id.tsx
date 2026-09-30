import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { allHabitsQuery, useCategories, useHabits } from '#/lib/api'
import type { Habit } from '#/lib/api'
import { addDays, toISODate } from '#/lib/dates'
import { SPRING_POP } from '#/lib/motion'
import {
  frequencyLabel,
  habitStats,
  isScheduled,
  streakLabel,
  weekStart,
} from '#/lib/streaks'
import { Icon } from '#/ui/icons'
import type { IconName } from '#/ui/icons'
import { Button, EmptyState, MenuButton, Skeleton } from '#/ui/zen'
import { HabitDialog } from '#/components/HabitDialog'
import { habitIcon } from '#/components/HabitRow'
import { useHabitActions } from '#/components/useHabitActions'

export const Route = createFileRoute('/habits/$id')({
  component: HabitDetail,
  head: () => ({ meta: [{ title: 'Habit · Honeylist' }] }),
})

const WEEKS = 12
const ROW_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']
const STATE_WORDS = {
  done: 'checked in',
  missed: 'no check in',
  off: 'rest day',
  future: 'ahead',
  before: 'before this habit',
} as const

function Stat({
  icon,
  label,
  value,
}: {
  icon: IconName
  label: string
  value: string
}) {
  return (
    <div className="habit-stat">
      <span className="habit-stat-icon" aria-hidden="true">
        <Icon name={icon} size={18} />
      </span>
      <span className="habit-stat-value">{value}</span>
      <span className="habit-stat-label">{label}</span>
    </div>
  )
}

const shortDate = (iso: string) =>
  new Date(iso + 'T00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
const monthOf = (iso: string) =>
  new Date(iso + 'T00:00').toLocaleDateString('en-GB', { month: 'short' })

/** The last 12 weeks, Monday to Sunday down each column. Checked days are amber with a tick. */
function Heatmap({ habit, today }: { habit: Habit; today: string }) {
  const done = new Set(habit.checkins)
  const start = addDays(weekStart(today), -7 * (WEEKS - 1))
  const created = toISODate(new Date(habit.createdAt))
  const inRange = habit.checkins.filter((d) => d >= start && d <= today).length
  const cols = Array.from({ length: WEEKS }, (_week, w) =>
    Array.from({ length: 7 }, (_day, d) => addDays(start, w * 7 + d)),
  )
  const stateOf = (d: string): keyof typeof STATE_WORDS =>
    d > today
      ? 'future'
      : done.has(d)
        ? 'done'
        : d < created
          ? 'before'
          : !isScheduled(habit, d)
            ? 'off'
            : 'missed'
  return (
    <section aria-labelledby="heat-h" className="habit-card">
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <h2 id="heat-h" className="heading" style={{ margin: 0 }}>
          Last 12 weeks
        </h2>
        <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
          {inRange === 1 ? '1 check in' : `${inRange} check ins`}
        </span>
      </div>
      <div
        className="heatmap"
        role="img"
        aria-label={`${inRange} check ins in the last 12 weeks`}
      >
        <div className="heatmap-rows" aria-hidden="true">
          <span />
          {ROW_LABELS.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
        {cols.map((days, w) => (
          <div key={days[0]} className="heatmap-col" aria-hidden="true">
            <span className="heatmap-month">
              {w === 0 || monthOf(days[0]) !== monthOf(addDays(days[0], -7))
                ? monthOf(days[0])
                : ''}
            </span>
            {days.map((d) => {
              const state = stateOf(d)
              return (
                <span
                  key={d}
                  className={`heatmap-cell is-${state}${d === today ? ' is-today' : ''}`}
                  title={`${shortDate(d)}: ${STATE_WORDS[state]}`}
                >
                  {state === 'done' && (
                    <Icon name="check" size={10} strokeWidth={3} />
                  )}
                </span>
              )
            })}
          </div>
        ))}
      </div>
      <div className="heatmap-legend" aria-hidden="true">
        <span>
          <span className="heatmap-cell is-done">
            <Icon name="check" size={10} strokeWidth={3} />
          </span>
          Checked in
        </span>
        <span>
          <span className="heatmap-cell is-missed" />
          No check in
        </span>
        <span>
          <span className="heatmap-cell is-off" />
          Rest day
        </span>
      </div>
    </section>
  )
}

function HabitDetail() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { data: active, isLoading } = useHabits()
  const inActive = active?.find((h) => h.id === id)
  const { data: all, isLoading: loadingAll } = useQuery({
    ...allHabitsQuery,
    enabled: !!active && !inActive,
  })
  const habit = inActive ?? all?.find((h) => h.id === id)
  const { data: cats = [] } = useCategories()
  const { toggleToday, setArchived, remove } = useHabitActions()
  const [editing, setEditing] = useState(false)
  const today = toISODate(new Date())

  const back = (
    <Link
      to="/habits"
      className="zn-icon-btn"
      aria-label="Back to habits"
      style={{ alignSelf: 'flex-start' }}
    >
      <Icon name="arrowLeft" />
    </Link>
  )

  if (isLoading || (!habit && loadingAll)) {
    return (
      <div
        aria-busy="true"
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <Skeleton width={44} height={44} radius={9999} />
        <Skeleton width={260} height={32} radius={10} />
        <Skeleton height={96} radius={20} />
        <Skeleton height={200} radius={20} />
      </div>
    )
  }
  if (!habit) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {back}
        <div style={{ borderRadius: 28, background: 'var(--surface)' }}>
          <EmptyState
            illustration="habits"
            title="This habit isn't here"
            text="It may have been deleted. Your other habits are safe."
          >
            <Button
              icon="flame"
              onClick={() => void navigate({ to: '/habits' })}
            >
              All habits
            </Button>
          </EmptyState>
        </div>
      </div>
    )
  }

  const s = habitStats(habit, habit.checkins, today)
  const folder = habit.categoryId
    ? cats.find((c) => c.id === habit.categoryId)
    : undefined
  const pct = s.goal ? Math.round((s.goal.day / s.goal.of) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {back}
        <MenuButton
          label="Habit actions"
          tip="More actions"
          items={[
            { label: 'Edit', icon: 'pen', onSelect: () => setEditing(true) },
            {
              label: habit.archived ? 'Restore' : 'Archive',
              icon: habit.archived ? 'refresh' : 'inbox',
              onSelect: () => setArchived(habit, !habit.archived),
            },
            { separator: true },
            {
              label: 'Delete',
              icon: 'trash',
              danger: true,
              onSelect: () =>
                remove(habit, () => void navigate({ to: '/habits' })),
            },
          ]}
        />
      </div>

      <header style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span className="habit-hero-icon" aria-hidden="true">
          <Icon name={habitIcon(habit.icon)} size={28} />
        </span>
        <div style={{ minWidth: 0 }}>
          <h1 className="title" style={{ margin: 0, overflowWrap: 'anywhere' }}>
            {habit.name}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)' }}>
            {frequencyLabel(habit)}
            {folder ? ` · ${folder.name}` : ''}
            {habit.archived ? ' · Archived' : ''}
          </p>
        </div>
      </header>

      {!habit.archived && (
        <motion.div
          key={s.doneToday ? 'done' : 'todo'}
          initial={{ scale: 0.96 }}
          animate={{ scale: 1 }}
          transition={SPRING_POP}
          style={{ display: 'flex' }}
        >
          <Button
            block
            size="lg"
            icon={s.doneToday ? 'check' : 'flame'}
            variant={s.doneToday ? 'secondary' : 'primary'}
            role="checkbox"
            aria-checked={s.doneToday}
            onClick={() => toggleToday(habit)}
          >
            {s.doneToday
              ? 'Checked in today (tap to undo)'
              : isScheduled(habit, today)
                ? 'Check in today'
                : 'Check in anyway (rest day)'}
          </Button>
        </motion.div>
      )}

      <div className="habit-stats">
        <Stat
          icon="flame"
          label="Current streak"
          value={streakLabel(s.current, s.unit)}
        />
        <Stat
          icon="target"
          label="Best streak"
          value={streakLabel(s.best, s.unit)}
        />
        <Stat icon="check" label="Total check ins" value={String(s.total)} />
      </div>

      <section className="habit-card" aria-label="Goal">
        {s.goal ? (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <span className="heading">
                Day {s.goal.day} of {s.goal.of}
              </span>
              <span className="zn-progress-value">{pct}%</span>
            </div>
            <div
              className="zn-progress-track"
              role="progressbar"
              aria-label="Goal progress"
              aria-valuemin={0}
              aria-valuemax={s.goal.of}
              aria-valuenow={s.goal.day}
              style={{ flex: 'none' }}
            >
              <div className="zn-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)' }}>
              {s.goal.reached
                ? 'Goal reached. Keep going as long as it helps.'
                : `${s.goal.of - s.goal.day} more check ins to reach your goal.`}
            </p>
          </>
        ) : (
          <>
            <span className="heading">Ongoing</span>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)' }}>
              No finish line. Add a goal from Edit if you'd like one.
            </p>
          </>
        )}
      </section>

      <Heatmap habit={habit} today={today} />

      {editing && (
        <HabitDialog
          open={editing}
          habit={habit}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  )
}
