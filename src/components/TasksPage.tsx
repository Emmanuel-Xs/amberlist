import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LayoutGrid } from 'lucide-react'
import { useCategories, useTasks } from '#/lib/api'
import { GROUP_LABELS, groupOf, sortTasks, toISODate } from '#/lib/dates'
import type { Group } from '#/lib/dates'
import { Icon } from '#/ui/icons'
import { Chip, EmptyState, SearchBar, Skeleton } from '#/ui/zen'
import { QuickAdd } from './QuickAdd'
import { TaskDetail } from './TaskDetail'
import { TaskGridCard } from './TaskGridCard'
import { TaskRow } from './TaskRow'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { SPRING_GLIDE } from '#/lib/motion'

type View = 'list' | 'grid'
const VIEW_KEY = 'honeylist-task-view'

/** List or grid, remembered per device. Read after mount so the server render always matches. */
function useTaskView() {
  const [view, setView] = useState<View>('list')
  useEffect(() => {
    try {
      if (localStorage.getItem(VIEW_KEY) === 'grid') setView('grid')
    } catch {
      // Storage blocked: fall back to the list.
    }
  }, [])
  const choose = (v: View) => {
    setView(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      // Private mode: the choice lasts for this visit only.
    }
  }
  return [view, choose] as const
}

function ViewToggle({
  view,
  onChange,
}: {
  view: View
  onChange: (v: View) => void
}) {
  return (
    <div role="group" aria-label="Task view" className="zn-seg">
      <button
        type="button"
        className="zn-seg-item"
        aria-pressed={view === 'list'}
        onClick={() => onChange('list')}
      >
        <Icon name="tasks" size={16} />
        List
      </button>
      <button
        type="button"
        className="zn-seg-item"
        aria-pressed={view === 'grid'}
        onClick={() => onChange('grid')}
      >
        <LayoutGrid size={16} strokeWidth={1.75} aria-hidden="true" />
        Grid
      </button>
    </div>
  )
}

const ORDER: Group[] = [
  'overdue',
  'today',
  'tomorrow',
  'week',
  'later',
  'inbox',
]

export function TasksPage({
  selectedId,
  folderId,
  title = 'Tasks',
}: {
  selectedId?: string
  folderId?: string
  title?: string
}) {
  const { data: tasks, isLoading, isError, refetch } = useTasks()
  const { data: cats = [] } = useCategories()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<string>(folderId ?? 'all')
  const [showDone, setShowDone] = useState(false)
  const [view, setView] = useTaskView()
  const today = toISODate(new Date())
  const catById = useMemo(() => new Map(cats.map((c) => [c.id, c])), [cats])

  const visible = (tasks ?? []).filter((t) => {
    const f = folderId ?? filter
    if (f === 'high' && t.priority !== 'high') return false
    if (f !== 'all' && f !== 'high' && t.categoryId !== f) return false
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })
  const groups = ORDER.map((g) => ({
    g,
    items: sortTasks(visible.filter((t) => groupOf(t, today) === g)),
  })).filter((x) => x.items.length)
  const done = visible.filter((t) => t.status === 'done')
  const selected = tasks?.find((t) => t.id === selectedId)
  const openCount = (tasks ?? []).filter(
    (t) => t.status !== 'done' && (!folderId || t.categoryId === folderId),
  ).length

  const renderTasks = (items: typeof visible) => {
    const Item = view === 'grid' ? TaskGridCard : TaskRow
    // layoutId lets a ticked row glide from its group into Completed (board 11 motion).
    const els = (
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((t) => (
          <motion.div
            key={t.id}
            layoutId={`task-${t.id}`}
            layout="position"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.16 } }}
            transition={SPRING_GLIDE}
          >
            <Item
              task={t}
              category={t.categoryId ? catById.get(t.categoryId) : undefined}
              selected={t.id === selectedId}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    )
    return view === 'grid' ? <div className="task-grid">{els}</div> : els
  }

  const list = (
    <LayoutGroup>
      <div
        className="tasks-list"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          minWidth: 0,
        }}
      >
        <header className="tasks-head">
          <h1 className="display" style={{ margin: 0 }}>
            {title}
          </h1>
          {tasks && (
            <span style={{ fontSize: 14, color: 'var(--ink-muted)' }}>
              {openCount} open
            </span>
          )}
          <ViewToggle view={view} onChange={setView} />
        </header>
        <SearchBar value={q} onChange={setQ} placeholder="Search tasks" />
        <QuickAdd />
        {!folderId && (
          <div
            role="group"
            aria-label="Filter tasks"
            className="hide-scroll"
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 2,
            }}
          >
            <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>
              All
            </Chip>
            {cats.map((c) => (
              <Chip
                key={c.id}
                selected={filter === c.id}
                onClick={() => setFilter(c.id)}
              >
                {c.name}
              </Chip>
            ))}
            <Chip
              selected={filter === 'high'}
              icon="flag"
              onClick={() => setFilter('high')}
            >
              High priority
            </Chip>
          </div>
        )}
        {isError ? (
          <div className="zn-alert zn-alert--danger" role="alert">
            <span className="zn-alert-icon">
              <Icon name="alert" />
            </span>
            <div className="zn-alert-body">
              <strong className="zn-alert-title">
                Couldn't load your tasks
              </strong>
              Check your connection.
            </div>
            <button
              type="button"
              className="zn-btn zn-btn--ghost zn-btn--sm"
              onClick={() => void refetch()}
            >
              <span className="zn-btn-label">Retry</span>
            </button>
          </div>
        ) : isLoading ? (
          <div
            aria-busy="true"
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={64} radius={20} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div style={{ borderRadius: 28, background: 'var(--surface)' }}>
            {q ? (
              <EmptyState
                illustration="search"
                title={`No results for "${q}"`}
                text="Check the spelling, or search your notes instead."
              />
            ) : folderId ? (
              <EmptyState
                illustration="folder"
                title="This folder is empty"
                text={`Add a task above with #${catById.get(folderId)?.name.toLowerCase() ?? 'folder'}, or move one here from its details.`}
              />
            ) : (
              <EmptyState
                illustration="tasks"
                title="No tasks yet"
                text={
                  'Type one above and press Enter. Try "Read 20 pages tomorrow #study".'
                }
              />
            )}
          </div>
        ) : (
          <>
            {groups.map(({ g, items }) => (
              <section
                key={g}
                aria-labelledby={`g-${g}`}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <h2
                  id={`g-${g}`}
                  style={{
                    margin: '4px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: g === 'overdue' ? 'var(--danger)' : 'var(--ink)',
                  }}
                >
                  {g === 'overdue' && <Icon name="flag" size={16} />}
                  {g === 'inbox' && <Icon name="inbox" size={16} />}
                  {GROUP_LABELS[g]}{' '}
                  <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>
                    {items.length}
                  </span>
                </h2>
                {renderTasks(items)}
              </section>
            ))}
            {done.length > 0 && (
              <section
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <button
                  type="button"
                  aria-expanded={showDone}
                  onClick={() => setShowDone((v) => !v)}
                  style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    minHeight: 44,
                    padding: '0 12px 0 4px',
                    border: 0,
                    background: 'transparent',
                    color: 'var(--ink-muted)',
                    font: 'inherit',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Icon
                    name={showDone ? 'chevronDown' : 'chevronRight'}
                    size={18}
                  />
                  Completed {done.length}
                </button>
                {showDone && renderTasks(done)}
              </section>
            )}
          </>
        )}
      </div>
    </LayoutGroup>
  )

  return (
    <div
      className={['tasks-layout', selectedId && 'has-detail']
        .filter(Boolean)
        .join(' ')}
    >
      {list}
      <aside className="tasks-pane" aria-label="Task details">
        <div className="tasks-pane-scroll zn-scroll">
          {selected ? (
            <TaskDetail
              key={selected.id}
              task={selected}
              onClose={() =>
                void navigate({
                  to: folderId ? '/folders/$id' : '/tasks',
                  params: folderId ? { id: folderId } : undefined,
                } as never)
              }
            />
          ) : selectedId && tasks ? (
            <EmptyState
              illustration="search"
              title="Task not found"
              text="It may have been deleted."
            />
          ) : (
            <EmptyState
              illustration="tasks"
              title="Pick a task"
              text="Select a task to see its dates, subtasks and notes here. Press Q to add a new one."
            />
          )}
        </div>
      </aside>
      {selectedId && (
        <div className="tasks-detail-mobile">
          {selected ? (
            <TaskDetail key={selected.id} task={selected} backLink />
          ) : tasks ? (
            <EmptyState
              illustration="search"
              title="Task not found"
              text="It may have been deleted."
            />
          ) : (
            <Skeleton height={400} radius={28} />
          )}
        </div>
      )}
    </div>
  )
}
