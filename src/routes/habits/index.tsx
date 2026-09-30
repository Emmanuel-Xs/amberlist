import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { allHabitsQuery, useHabits } from '#/lib/api'
import { toISODate } from '#/lib/dates'
import { habitStats, isScheduled } from '#/lib/streaks'
import { Icon } from '#/ui/icons'
import { Button, EmptyState, Skeleton } from '#/ui/zen'
import { SectionHead } from '#/components/Cards'
import { HabitDialog } from '#/components/HabitDialog'
import { HabitRow, habitIcon } from '#/components/HabitRow'
import { useHabitActions } from '#/components/useHabitActions'

export const Route = createFileRoute('/habits/')({
  component: Habits,
  head: () => ({
    meta: [
      { title: 'Habits · Honeylist' },
      {
        name: 'description',
        content: 'Small daily habits with check ins and streaks.',
      },
      { property: 'og:title', content: 'Habits · Honeylist' },
    ],
  }),
})

function Archived() {
  const [open, setOpen] = useState(false)
  const { data = [] } = useQuery({ ...allHabitsQuery, enabled: open })
  const { setArchived } = useHabitActions()
  const archived = data.filter((h) => h.archived)
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        type="button"
        className="link"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          alignSelf: 'flex-start',
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
        <Icon name={open ? 'chevronDown' : 'chevronRight'} size={16} />
        Archived habits
      </button>
      {open &&
        (archived.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)' }}>
            Nothing archived. Archive a habit from its page to pause it without
            losing the history.
          </p>
        ) : (
          archived.map((h) => (
            <div key={h.id} className="habit-row is-archived">
              <Link
                to="/habits/$id"
                params={{ id: h.id }}
                className="habit-row-link"
              >
                <span className="habit-row-icon" aria-hidden="true">
                  <Icon name={habitIcon(h.icon)} size={22} />
                </span>
                <span className="habit-row-body">
                  <span className="habit-row-name">{h.name}</span>
                  <span className="habit-row-meta">
                    {h.checkins.length} check ins kept
                  </span>
                </span>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                icon="refresh"
                onClick={() => setArchived(h, false)}
              >
                Restore
              </Button>
            </div>
          ))
        ))}
    </section>
  )
}

function Habits() {
  const { data: habits, isLoading } = useHabits()
  const [creating, setCreating] = useState(false)
  const today = toISODate(new Date())

  const add = (
    <Button icon="plus" onClick={() => setCreating(true)}>
      New habit
    </Button>
  )
  let body: React.ReactNode
  if (isLoading || !habits) {
    body = (
      <div
        aria-busy="true"
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={96} radius={20} />
        ))}
      </div>
    )
  } else if (habits.length === 0) {
    body = (
      <div style={{ borderRadius: 28, background: 'var(--surface)' }}>
        <EmptyState
          illustration="habits"
          title="Build your first habit"
          text="Pick something small you want to do most days. We'll track the streak."
        >
          <Button icon="plus" onClick={() => setCreating(true)}>
            Add a habit
          </Button>
        </EmptyState>
      </div>
    )
  } else {
    const due = habits.filter((h) => isScheduled(h, today))
    const rest = habits.filter((h) => !isScheduled(h, today))
    const doneCount = due.filter(
      (h) => habitStats(h, h.checkins, today).doneToday,
    ).length
    body = (
      <>
        {due.length > 0 && (
          <section
            aria-labelledby="habits-today"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <h2 id="habits-today" className="heading" style={{ margin: 0 }}>
                Today
              </h2>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                {doneCount === due.length
                  ? 'All checked in'
                  : `${doneCount} of ${due.length} done`}
              </span>
            </div>
            <div className="habit-list">
              {due.map((h) => (
                <HabitRow key={h.id} habit={h} today={today} dots />
              ))}
            </div>
          </section>
        )}
        {rest.length > 0 && (
          <section
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <SectionHead title="Not today" />
            <div className="habit-list">
              {rest.map((h) => (
                <HabitRow key={h.id} habit={h} today={today} dots />
              ))}
            </div>
          </section>
        )}
      </>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <h1 className="display" style={{ margin: 0 }}>
          Habits
        </h1>
        {habits && habits.length > 0 && add}
      </header>
      <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: 14 }}>
        Tap the circle when you've done it today. Tap again to undo. Missing a
        day only resets the current streak; your best and total stay.
      </p>
      {body}
      <Archived />
      {creating && (
        <HabitDialog open={creating} onClose={() => setCreating(false)} />
      )}
    </div>
  )
}
