import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { Category, Note, Task } from '#/lib/api'
import { dueLabel, formatTimeRange, toISODate } from '#/lib/dates'
import { Icon } from '#/ui/icons'
import type { IconName } from '#/ui/icons'
import { deleteNoteWithUndo } from '#/lib/noteActions'
import { useTaskActions } from './useTaskActions'

const TONES = ['accent', 'butter', 'lavender', 'mint', 'peach', 'sky'] as const

/** Bold card for today's tasks on Home: colored half plus a lighter panel with the folder icon. */
export function TodayCard({
  task,
  category,
  index,
}: {
  task: Task
  category?: Category
  index: number
}) {
  const { toggle } = useTaskActions()
  const tone =
    index === 0 ? 'accent' : (category?.color ?? TONES[(index % 5) + 1])
  const bg = `var(--${tone})`
  const today = toISODate(new Date())
  const badge =
    task.status === 'in_progress' ? 'In progress' : dueLabel(task, today)
  const done = task.subtasks.filter((s) => s.done).length
  const total = task.subtasks.length
  const pct = total ? Math.round((done / total) * 100) : 0
  const time = formatTimeRange(task.startTime, task.endTime)
  return (
    <div
      style={{
        display: 'flex',
        minHeight: 188,
        borderRadius: 28,
        overflow: 'hidden',
        background: bg,
        color: 'var(--on-pastel)',
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 12,
              lineHeight: '16px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 9999,
              background: 'rgba(28,29,33,0.1)',
            }}
          >
            {category?.name ?? 'Inbox'}
          </span>
          {badge && (
            <span
              style={{
                fontSize: 12,
                lineHeight: '16px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 9999,
                background: 'var(--on-pastel)',
                color: bg,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <Link
          to="/tasks/$id"
          params={{ id: task.id }}
          style={{
            fontSize: 21,
            lineHeight: '27px',
            fontWeight: 600,
            color: 'var(--on-pastel)',
            textDecoration: 'none',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {task.title}
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {time && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <Icon name="clock" size={16} />
              {time}
            </div>
          )}
          {total > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                role="progressbar"
                aria-label="Subtasks done"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 9999,
                  background: 'rgba(28,29,33,0.14)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    borderRadius: 9999,
                    background: 'var(--on-pastel)',
                    transition: 'width .3s',
                  }}
                />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                {done} of {total}
              </span>
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          width: 112,
          flexShrink: 0,
          background: 'rgba(255,255,255,0.38)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 0 28px',
        }}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={task.status === 'done'}
          aria-label={`Mark done: ${task.title}`}
          onClick={() => toggle(task)}
          style={{
            alignSelf: 'flex-end',
            marginRight: 16,
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1.5px solid var(--on-pastel)',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
          }}
        />
        <Icon
          name={(category?.icon as IconName | undefined) ?? 'flag'}
          size={52}
        />
      </div>
    </div>
  )
}

export function FolderCard({ category }: { category: Category }) {
  const bg = `var(--${category.color})`
  const pct = category.taskCount
    ? Math.round((category.doneCount / category.taskCount) * 100)
    : 0
  return (
    <Link
      to="/folders/$id"
      params={{ id: category.id }}
      className="folder-card"
      aria-label={`${category.name} folder, ${category.taskCount} tasks`}
    >
      <span className="folder-tab" style={{ background: bg }} />
      <span className="folder-body" style={{ background: bg }}>
        <span
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Icon name={category.icon as IconName} size={26} />
          <span
            style={{
              fontSize: 12,
              lineHeight: '16px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 9999,
              background: 'rgba(28,29,33,0.1)',
            }}
          >
            {category.taskCount}
          </span>
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 15, lineHeight: '20px', fontWeight: 600 }}>
            {category.name}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                flex: 1,
                height: 6,
                borderRadius: 9999,
                background: 'rgba(28,29,33,0.14)',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  display: 'block',
                  width: `${pct}%`,
                  height: '100%',
                  background: 'var(--on-pastel)',
                  borderRadius: 9999,
                }}
              />
            </span>
            <span
              style={{ fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}
            >
              {category.doneCount} of {category.taskCount} done
            </span>
          </span>
        </span>
      </span>
    </Link>
  )
}

export function NoteCard({
  note,
  linkedTitle,
  height = 180,
}: {
  note: Note
  linkedTitle?: string
  height?: number
}) {
  const qc = useQueryClient()
  const onSurface = note.color === 'surface'
  const muted = onSurface ? 'var(--ink-muted)' : 'rgba(28,29,33,0.74)'
  const preview = note.body
    .replace(/^- \[( |x)\] /gm, '')
    .replace(/[#*_`>]/g, '')
    .slice(0, 220)
  return (
    <div className="note-card" style={{ position: 'relative' }}>
      <Link
        to="/notes/$id"
        params={{ id: note.id }}
        style={{
          height,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: 16,
          borderRadius: 20,
          background: `var(--${note.color})`,
          color: onSurface ? 'var(--ink)' : 'var(--on-pastel)',
          textDecoration: 'none',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}
      >
        <span style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span
            style={{
              flex: 1,
              fontSize: 15,
              lineHeight: '20px',
              fontWeight: 600,
            }}
          >
            {note.title || 'Untitled note'}
          </span>
          {note.pinned && (
            <span aria-label="Pinned" style={{ display: 'inline-flex' }}>
              <Icon name="pin" size={16} />
            </span>
          )}
        </span>
        <span
          style={{
            flex: 1,
            fontSize: 13,
            lineHeight: '19px',
            color: muted,
            whiteSpace: 'pre-line',
            overflow: 'hidden',
          }}
        >
          {preview || 'Empty note'}
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 500,
            color: muted,
            minWidth: 0,
          }}
        >
          {linkedTitle ? (
            <>
              <Icon name="link" size={14} />
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {linkedTitle}
              </span>
            </>
          ) : (
            <span>
              Edited{' '}
              {new Date(note.updatedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
        </span>
      </Link>
      <button
        type="button"
        className="note-card-delete"
        aria-label={`Delete note ${note.title || 'Untitled note'}`}
        onClick={() => deleteNoteWithUndo(qc, note.id)}
        style={{ color: onSurface ? 'var(--ink-muted)' : 'var(--on-pastel)' }}
      >
        <Icon name="trash" size={16} />
      </button>
    </div>
  )
}

export function DateStrip({
  days,
  value,
  onChange,
}: {
  days: {
    key: string
    day: number
    weekday: string
    today: boolean
    count?: number
  }[]
  value: string
  onChange: (k: string) => void
}) {
  return (
    <div className="zn-dates" role="listbox" aria-label="Pick a day">
      {days.map((d) => (
        <button
          key={d.key}
          type="button"
          role="option"
          aria-selected={d.key === value}
          aria-label={`${d.weekday} ${d.day}${d.count ? `, ${d.count} tasks` : ''}`}
          className={[
            'zn-date',
            d.key === value && 'is-selected',
            d.today && 'is-today',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onChange(d.key)}
        >
          <span className="zn-date-num">{d.day}</span>
          <span className="zn-date-wd">{d.weekday}</span>
        </button>
      ))}
    </div>
  )
}

export function SectionHead({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <h2 className="heading" style={{ margin: 0 }}>
        {title}
      </h2>
      {action}
    </div>
  )
}
