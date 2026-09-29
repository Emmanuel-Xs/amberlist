import { Link, useNavigate } from '@tanstack/react-router'
import type { Category, Task } from '#/lib/api'
import { dueLabel, formatTimeRange, toISODate } from '#/lib/dates'
import { Icon } from '#/ui/icons'
import { MenuButton } from '#/ui/zen'
import { useTaskActions } from './useTaskActions'

export function TaskRow({
  task,
  category,
  selected,
}: {
  task: Task
  category?: Category
  selected?: boolean
}) {
  const { toggle, remove, duplicate, start } = useTaskActions()
  const navigate = useNavigate()
  const done = task.status === 'done'
  const today = toISODate(new Date())
  const due = dueLabel(task, today)
  const overdue = !!task.dueDate && task.dueDate < today && !done
  const subDone = task.subtasks.filter((s) => s.done).length
  const time = formatTimeRange(task.startTime, task.endTime)

  return (
    <div
      className={['zn-task', done && 'is-done', selected && 'is-selected']
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`${done ? 'Mark not done' : 'Mark done'}: ${task.title}`}
        className="zn-check"
        onClick={() => toggle(task)}
      >
        {done && <Icon name="check" size={14} strokeWidth={3} />}
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
          {task.priority === 'high' && !done && (
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}
            >
              <Icon name="flag" size={13} />
              High
            </span>
          )}
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
      <MenuButton
        label={`More actions for ${task.title}`}
        items={[
          {
            label: 'Open',
            icon: 'pen',
            onSelect: () =>
              navigate({ to: '/tasks/$id', params: { id: task.id } }),
          },
          ...(task.status === 'todo'
            ? [
                {
                  label: 'Start',
                  icon: 'play' as const,
                  onSelect: () => start(task),
                },
              ]
            : []),
          { label: 'Duplicate', icon: 'copy', onSelect: () => duplicate(task) },
          { separator: true },
          {
            label: 'Delete task',
            icon: 'trash',
            danger: true,
            onSelect: () => remove(task),
          },
        ]}
      />
    </div>
  )
}
