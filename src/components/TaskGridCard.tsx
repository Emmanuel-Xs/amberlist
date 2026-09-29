import { Link } from '@tanstack/react-router'
import type { Category, Task } from '#/lib/api'
import { colorVar } from '#/lib/colors'
import { dueLabel, formatTimeRange, toISODate } from '#/lib/dates'
import { Icon } from '#/ui/icons'
import { MenuButton } from '#/ui/zen'
import { Priority, useTaskMenu } from './TaskRow'
import { motion } from 'motion/react'
import { SPRING_POP } from '#/lib/motion'
import { useTaskActions, useTicked } from './useTaskActions'

/** Grid view card: folder colour band, check and menu on top, title, then one meta line. */
export function TaskGridCard({
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
  const time = formatTimeRange(task.startTime, task.endTime)
  const subDone = task.subtasks.filter((s) => s.done).length

  return (
    <article
      className={['task-card', done && 'is-done', selected && 'is-selected']
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className="task-card-band"
        aria-hidden="true"
        style={{
          background: category ? colorVar(category.color) : 'var(--line)',
        }}
      />
      <div className="task-card-body">
        <div className="task-card-top">
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
          <MenuButton
            label={`More actions for ${task.title}`}
            tip="More actions"
            triggerClassName="task-action"
            items={menu}
          />
        </div>
        <Link
          to="/tasks/$id"
          params={{ id: task.id }}
          className="task-card-link"
        >
          {task.title}
        </Link>
        <div className="task-card-meta">
          {task.status === 'in_progress' && (
            <span style={{ color: 'var(--accent-ink)', fontWeight: 600 }}>
              In progress
            </span>
          )}
          {category && <span>{category.name}</span>}
          {time ? (
            <span>{time}</span>
          ) : (
            due && (
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
            )
          )}
          {task.subtasks.length > 0 && (
            <span>
              {subDone} of {task.subtasks.length}
            </span>
          )}
          {!done && <Priority priority={task.priority} />}
        </div>
      </div>
    </article>
  )
}
