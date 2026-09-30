import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useHabits } from '#/lib/api'
import { toISODate } from '#/lib/dates'
import { habitStats, isScheduled } from '#/lib/streaks'
import { Icon } from '#/ui/icons'
import { SectionHead } from './Cards'
import { HabitDialog } from './HabitDialog'
import { HabitRow } from './HabitRow'

/** Home's Habits row: today's habits (up to 6), shown once at least one habit exists. */
export function HomeHabits() {
  const { data: habits = [] } = useHabits()
  if (habits.length === 0) return null
  const today = toISODate(new Date())
  const due = habits.filter((h) => isScheduled(h, today))
  // Not yet done first, so the next tap is always near the start of the row.
  const ordered = [...due]
    .sort(
      (a, b) =>
        Number(habitStats(a, a.checkins, today).doneToday) -
        Number(habitStats(b, b.checkins, today).doneToday),
    )
    .slice(0, 6)
  return (
    <section
      aria-label="Habits"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <SectionHead
        title="Habits"
        action={
          <Link to="/habits" className="link">
            All habits
          </Link>
        }
      />
      {ordered.length === 0 ? (
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-muted)' }}>
          Rest day for all your habits. See you tomorrow.
        </p>
      ) : (
        <div className="habit-home-row hide-scroll">
          {ordered.map((h) => (
            <HabitRow key={h.id} habit={h} today={today} />
          ))}
        </div>
      )}
    </section>
  )
}

/** The small "+ Add a habit" link at the foot of Home. */
export function AddHabitLink() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className="link"
        onClick={() => setOpen(true)}
        style={{
          background: 'none',
          border: 0,
          padding: 0,
          minHeight: 44,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          font: 'inherit',
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        <Icon name="plus" size={16} />
        Add a habit
      </button>
      {open && <HabitDialog open={open} onClose={() => setOpen(false)} />}
    </>
  )
}
