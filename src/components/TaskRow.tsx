import { Link, useNavigate } from '@tanstack/react-router'
import type { Category, Task } from '#/lib/api'
import { dueLabel, formatTimeRange, toISODate } from '#/lib/dates'
import { Icon } from '#/ui/icons'
import { MenuButton, Tooltip } from '#/ui/zen'
import type { MenuItem } from '#/ui/zen'
import { motion } from 'motion/react'
import { SPRING_POP } from '#/lib/motion'
import { useTaskActions, useTicked } from './useTaskActions'

/** High: red flag plus "High"; Low: muted chevron plus "Low"; Medium shows nothing. */
export function Priority({
  priority,
  className,
}: {
  priority: Task['priority']
  className?: string
}) {
  if (priority === 'medium') return null
  const high = priority === 'high'
  return (
    <span
      className={[
        'task-priority',
        high ? 'task-priority--high' : 'task-priority--low',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon name={high ? 'flag' : 'chevronDown'} size={13} />
      {high ? 'High' : 'Low'}
    </span>
  )
}

/** The row and grid card share one menu: Open, Start, Duplicate, then Delete. */
export function useTaskMenu(task: Task): MenuItem[] {
  const { remove, duplicate, start } = useTaskActions()
  const navigate = useNavigate()
  return [
    {
      label: 'Open',
      icon: 'pen',
      onSelect: () =>
        void navigate({ to: '/tasks/$id', params: { id: task.id } }),
    },
    ...(task.status === 'todo'
      ? [{ label: 'Start', icon: 'play' as const, onSelect: () => start(task) }]
      : []),
    { label: 'Duplicate', icon: 'copy', onSelect: () => duplicate(task) },
    { separator: true },
    {
      label: 'Delete task',
      icon: 'trash',
      danger: true,
      onSelect: () => remove(task),
    },
  ]
}

export function TaskRow({
  task,
  category,
  selected,
}: {
  task: Task
  category?: Category
  selected?: boolean
}) {
  const { toggle } = useTaskActions()
  const menu = useTaskMenu(task)
  const [ticked, setTicked] = useTicked(task)
  const done = task.status === 'done' || ticked
  const today = toISODate(new Date())
  const due = dueLabel(task, today)
  const overdue = !!task.dueDate && task.dueDate < today && !done
  const subDone = task.subtasks.filter((s) => s.done).length
  const time = formatTimeRange(task.startTime, task.endTime)

  return (
    <div
      className={[
        'zn-task',
        'task-row',
        done && 'is-done',
        selected && 'is-selected',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`${done ? 'Mark not done' : 'Mark done'}: ${task.title}`}
        className="zn-check"
        onClick={() => {
          if (task.status !== 'done') setTicked(true)
          toggle(task)
        }}
      >
        {done && (
          <motion.span
            initial={ticked ? { scale: 0.4, rotate: -20 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={SPRING_POP}
            style={{ display: 'inline-flex' }}
          >
            <Icon name="check" size={14} strokeWidth={3} />
          </motion.span>
        )}
      </button>
      <Link
        to="/tasks/$id"
        params={{ id: task.id }}
        className="zn-task-body"
        style={{ textDecoration: 'none' }}
      >
        <span className="zn-task-title">{task.title}</span>
        <span className="zn-task-meta">
          {task.status === 'in_progress' && (
            <span style={{ color: 'var(--accent-ink)', fontWeight: 600 }}>
              In progress
            </span>
          )}
          {time && <span>{time}</span>}
          {due && (
            <span
              style={{
                color: overdue ? 'var(--danger)' : undefined,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              {overdue && <Icon name="flag" size={13} />}
              {due}
            </span>
          )}
          {category && <span className="zn-task-tag">{category.name}</span>}
          {!done && <Priority priority={task.priority} />}
          {task.subtasks.length > 0 && (
            <span>
              {subDone} of {task.subtasks.length}
            </span>
          )}
          {task.noteCount > 0 && (
            <span className="zn-task-note">
              <Icon name="note" size={14} />
              Note
            </span>
          )}
        </span>
      </Link>
      <div className="task-row-actions">
        {/* Same target as the row link, so it stays out of the tab order. */}
        <Tooltip label="Open">
          <Link
            to="/tasks/$id"
            params={{ id: task.id }}
            tabIndex={-1}
            aria-label={`Open ${task.title}`}
            className="zn-icon-btn task-action"
          >
            <Icon name="chevronRight" size={18} />
          </Link>
        </Tooltip>
        <MenuButton
          label={`More actions for ${task.title}`}
          tip="More actions"
          triggerClassName="task-action"
          items={menu}
        />
      </div>
    </div>
  )
}
