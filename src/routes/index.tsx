import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { meQuery, useCategories, useNotes, useTasks } from '#/lib/api'
import {
  greeting,
  groupOf,
  isOnDay,
  sortTasks,
  toISODate,
  weekAround,
} from '#/lib/dates'
import { openCreate } from '#/lib/store'
import { Icon } from '#/ui/icons'
import { EmptyState, Skeleton } from '#/ui/zen'
import {
  DateStrip,
  FolderCard,
  NoteCard,
  SectionHead,
  TodayCard,
} from '#/components/Cards'
import { QuickAdd } from '#/components/QuickAdd'
import { TaskRow } from '#/components/TaskRow'
import { Logo } from '#/ui/logo'

export const Route = createFileRoute('/')({
  component: Home,
  head: () => ({ meta: [{ title: 'Home · Honeylist' }] }),
})

function Home() {
  const { data: tasks, isLoading } = useTasks()
  const { data: cats = [] } = useCategories()
  const { data: notes = [] } = useNotes()
  const { data: me } = useQuery(meQuery)
  const today = toISODate(new Date())
  const [day, setDay] = useState(today)
  const catById = useMemo(() => new Map(cats.map((c) => [c.id, c])), [cats])

  if (isLoading || !tasks) {
    return (
      <div
        aria-busy="true"
        style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        <Skeleton width={200} height={14} />
        <Skeleton width={340} height={34} radius={10} />
        <Skeleton height={56} radius={9999} />
        <Skeleton height={188} radius={28} />
      </div>
    )
  }

  const open = tasks.filter((t) => t.status !== 'done')
  const todayTasks = sortTasks(
    open.filter((t) => ['today', 'overdue'].includes(groupOf(t, today))),
  )
  const dayTasks =
    day === today
      ? todayTasks
      : sortTasks(open.filter((t) => isOnDay(t, day, today)))
  const overdue = open.filter((t) => groupOf(t, today) === 'overdue')
  const hasDated = tasks.some((t) => t.startDate || t.dueDate)
  const usedFolders = cats.filter((c) => c.taskCount > 0)
  const days = weekAround(today).map((d) => ({
    ...d,
    count:
      d.key === today
        ? todayTasks.length
        : open.filter((t) => isOnDay(t, d.key, today)).length,
  }))
  const name = me?.displayName
  const hello = `${greeting(new Date().getHours())}${name ? `, ${name}` : ''}`
  const fresh = tasks.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="phone-header">
          <Logo size={40} />
          <Link to="/profile" className="zn-icon-btn" aria-label="Profile">
            <Icon name="user" size={24} />
          </Link>
        </div>
        <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-muted)' }}>
          {hello}
        </p>
        <h1 className="display" style={{ margin: 0 }}>
          {fresh ? (
            "Let's plan your day."
          ) : todayTasks.length === 0 ? (
            'Nothing due today.'
          ) : (
            <>
              You have{' '}
              <span style={{ color: 'var(--accent-ink)' }}>
                {todayTasks.length === 1
                  ? '1 task'
                  : `${todayTasks.length} tasks`}
              </span>{' '}
              today.
            </>
          )}
        </h1>
      </header>

      <div
        className={['home-grid', notes.length === 0 && 'no-aside']
          .filter(Boolean)
          .join(' ')}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            minWidth: 0,
          }}
        >
          <QuickAdd />

          {fresh && (
            <div style={{ borderRadius: 28, background: 'var(--surface)' }}>
              <EmptyState
                illustration="tasks"
                title="Add your first task"
                text={
                  'Type it above and press Enter. Try "Read 20 pages tomorrow #study" and we\'ll set the date and folder for you.'
                }
              />
            </div>
          )}

          {hasDated && <DateStrip days={days} value={day} onChange={setDay} />}

          {overdue.length > 0 && day === today && (
            <Link
              to="/tasks"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 16,
                background: 'var(--surface)',
                border: '1px solid var(--danger)',
                color: 'var(--ink)',
                textDecoration: 'none',
              }}
            >
              <span style={{ color: 'var(--danger)', display: 'inline-flex' }}>
                <Icon name="flag" />
              </span>
              <span style={{ flex: 1, fontSize: 14, lineHeight: '20px' }}>
                <strong style={{ color: 'var(--danger)', fontWeight: 600 }}>
                  {overdue.length} overdue:
                </strong>{' '}
                {overdue[0].title}
                {overdue.length > 1 ? ` and ${overdue.length - 1} more` : ''}
              </span>
              <span className="link">Review</span>
            </Link>
          )}

          {!fresh && (
            <>
              <SectionHead
                title={
                  day === today
                    ? 'Today'
                    : new Date(day + 'T00:00').toLocaleDateString('en-GB', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })
                }
                action={
                  <Link to="/tasks" className="link">
                    All tasks
                  </Link>
                }
              />
              {dayTasks.length === 0 ? (
                <div style={{ borderRadius: 28, background: 'var(--surface)' }}>
                  {day === today &&
                  tasks.some(
                    (t) =>
                      t.status === 'done' &&
                      t.completedAt?.slice(0, 10) === today,
                  ) ? (
                    <EmptyState
                      illustration="done"
                      title="All done for today"
                      text="Nice work. Rest, or pull something forward from later."
                    />
                  ) : (
                    <EmptyState
                      illustration="tasks"
                      title="Nothing planned"
                      text="Add a task above, or press Q anywhere."
                    />
                  )}
                </div>
              ) : (
                <div className="cards-grid">
                  {dayTasks.slice(0, 4).map((t, i) => (
                    <TodayCard
                      key={t.id}
                      task={t}
                      category={
                        t.categoryId ? catById.get(t.categoryId) : undefined
                      }
                      index={i}
                    />
                  ))}
                </div>
              )}
              {dayTasks.length > 4 && (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  {dayTasks.slice(4, 6).map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      category={
                        t.categoryId ? catById.get(t.categoryId) : undefined
                      }
                    />
                  ))}
                </div>
              )}
              {dayTasks.length > 6 && (
                <Link
                  to="/tasks"
                  className="link"
                  style={{ alignSelf: 'flex-start' }}
                >
                  See all {dayTasks.length} tasks
                </Link>
              )}
            </>
          )}
        </div>

        {notes.length > 0 && (
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SectionHead
              title="Recent notes"
              action={
                <Link to="/notes" className="link">
                  All notes
                </Link>
              }
            />
            {notes.slice(0, 3).map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                height={148}
                linkedTitle={
                  n.taskId
                    ? tasks.find((t) => t.id === n.taskId)?.title
                    : undefined
                }
              />
            ))}
          </aside>
        )}
      </div>

      {usedFolders.length > 0 && (
        <section
          aria-labelledby="folders-h"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }}
          >
            <h2 id="folders-h" className="heading" style={{ margin: 0 }}>
              Folders
            </h2>
            <Link to="/folders" className="link">
              All folders
            </Link>
          </div>
          <div className="folder-row hide-scroll">
            {cats.map((c) => (
              <FolderCard key={c.id} category={c} />
            ))}
          </div>
        </section>
      )}

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="link"
          onClick={() => openCreate()}
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
          Full task form
        </button>
        <Link
          to="/folders"
          className="link"
          style={{
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name="plus" size={16} />
          New folder
        </Link>
      </div>
    </div>
  )
}
