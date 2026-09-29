import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useCategories, useNoteMutations, useNotes } from '#/lib/api'
import type { Task, TaskInput } from '#/lib/api'
import { sound } from '#/lib/feedback'
import { toast } from '#/lib/store'
import { Icon } from '#/ui/icons'
import { Button, Chip, Input, Switch } from '#/ui/zen'
import { NoteCard } from './Cards'
import { useTaskActions } from './useTaskActions'

export function TaskDetail({
  task,
  onClose,
  backLink,
}: {
  task: Task
  onClose?: () => void
  backLink?: boolean
}) {
  const { mutations: m, remove, toggle } = useTaskActions()
  const { data: cats = [] } = useCategories()
  const { data: notes = [] } = useNotes()
  const noteM = useNoteMutations()
  const navigate = useNavigate()
  const [title, setTitle] = useState(task.title)
  const [sub, setSub] = useState('')
  useEffect(() => setTitle(task.title), [task.id, task.title])

  const save = (input: TaskInput) =>
    m.update.mutate(
      { id: task.id, ...input },
      {
        onError: (e) => {
          sound('error')
          toast({
            tone: 'error',
            icon: 'alert',
            message: `Couldn't save: ${e.message}`,
            duration: 0,
          })
        },
      },
    )
  const linked = notes.filter((n) => n.taskId === task.id)
  const done = task.subtasks.filter((s) => s.done).length
  const pct = task.subtasks.length
    ? Math.round((done / task.subtasks.length) * 100)
    : 0

  const addNote = () =>
    noteM.create.mutate(
      { title: `${task.title} notes`, body: '', taskId: task.id },
      {
        onSuccess: (n) =>
          void navigate({ to: '/notes/$id', params: { id: n.id } }),
      },
    )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        {backLink ? (
          <Link
            to="/tasks"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              minHeight: 44,
              color: 'var(--ink)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            <Icon name="arrowLeft" />
            Tasks
          </Link>
        ) : (
          <span
            style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-muted)' }}
          >
            Task details
          </span>
        )}
        <div style={{ display: 'flex', gap: 4 }}>
          <Button
            variant="danger"
            size="sm"
            icon="trash"
            onClick={() => remove(task, () => void navigate({ to: '/tasks' }))}
          >
            Delete
          </Button>
          {onClose && (
            <button
              type="button"
              className="zn-icon-btn"
              aria-label="Close details"
              onClick={onClose}
            >
              <Icon name="x" />
            </button>
          )}
        </div>
      </div>

      <label htmlFor={`title-${task.id}`} className="sr-only">
        Task title
      </label>
      <textarea
        id={`title-${task.id}`}
        value={title}
        rows={1}
        maxLength={200}
        onChange={(e) => setTitle(e.target.value.replace(/\n/g, ''))}
        onBlur={() =>
          title.trim() && title !== task.title && save({ title: title.trim() })
        }
        onKeyDown={(e) =>
          e.key === 'Enter' &&
          (e.preventDefault(), (e.target as HTMLTextAreaElement).blur())
        }
        style={{
          font: 'inherit',
          fontSize: 22,
          lineHeight: '30px',
          fontWeight: 600,
          color: 'var(--ink)',
          background: 'transparent',
          border: 0,
          padding: 0,
          resize: 'none',
          outline: 'none',
          fieldSizing: 'content',
        }}
      />

      <div
        role="radiogroup"
        aria-label="Status"
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
      >
        <Chip
          role="radio"
          aria-checked={task.status === 'todo'}
          selected={task.status === 'todo'}
          onClick={() => save({ status: 'todo' })}
        >
          Todo
        </Chip>
        <Chip
          role="radio"
          aria-checked={task.status === 'in_progress'}
          selected={task.status === 'in_progress'}
          icon="play"
          onClick={() => save({ status: 'in_progress' })}
        >
          In progress
        </Chip>
        <Chip
          role="radio"
          aria-checked={task.status === 'done'}
          selected={task.status === 'done'}
          icon="check"
          onClick={() => task.status !== 'done' && toggle(task)}
        >
          Done
        </Chip>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px 20px',
        }}
      >
        <Input
          type="date"
          label="Start"
          value={task.startDate ?? ''}
          onChange={(e) => save({ startDate: e.target.value || null })}
        />
        <Input
          type="date"
          label="Due"
          value={task.dueDate ?? ''}
          onChange={(e) => save({ dueDate: e.target.value || null })}
        />
        <Input
          type="time"
          label="From"
          value={task.startTime ?? ''}
          onChange={(e) =>
            save({
              startTime: e.target.value || null,
              ...(e.target.value ? {} : { endTime: null }),
            })
          }
        />
        <Input
          type="time"
          label="To"
          value={task.endTime ?? ''}
          disabled={!task.startTime}
          onChange={(e) => save({ endTime: e.target.value || null })}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="zn-field-label">Folder</span>
        <div
          role="radiogroup"
          aria-label="Folder"
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
        >
          <Chip
            role="radio"
            aria-checked={!task.categoryId}
            selected={!task.categoryId}
            icon="inbox"
            onClick={() => save({ categoryId: null })}
          >
            Inbox
          </Chip>
          {cats.map((c) => (
            <Chip
              key={c.id}
              role="radio"
              aria-checked={task.categoryId === c.id}
              selected={task.categoryId === c.id}
              onClick={() => save({ categoryId: c.id })}
            >
              {c.name}
            </Chip>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="zn-field-label">Priority</span>
        <div
          role="radiogroup"
          aria-label="Priority"
          style={{ display: 'flex', gap: 8 }}
        >
          {(['low', 'medium', 'high'] as const).map((p) => (
            <Chip
              key={p}
              role="radio"
              aria-checked={task.priority === p}
              selected={task.priority === p}
              icon={p === 'high' ? 'flag' : undefined}
              onClick={() => save({ priority: p })}
            >
              {p[0].toUpperCase() + p.slice(1)}
            </Chip>
          ))}
        </div>
      </div>

      <Switch
        label="Remind me when it starts"
        icon="bell"
        checked={task.remind}
        onChange={(v) => save({ remind: v })}
      />

      <section
        aria-labelledby={`st-${task.id}`}
        style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <h2
            id={`st-${task.id}`}
            style={{ margin: 0, fontSize: 15, fontWeight: 600 }}
          >
            Subtasks
          </h2>
          {task.subtasks.length > 0 && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--accent-ink)',
              }}
            >
              {done} of {task.subtasks.length}
            </span>
          )}
        </div>
        {task.subtasks.length > 0 && (
          <div
            role="progressbar"
            aria-label="Subtasks done"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              height: 6,
              borderRadius: 9999,
              background: 'var(--surface-raised)',
              overflow: 'hidden',
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: 'var(--accent)',
                borderRadius: 9999,
                transition: 'width .3s',
              }}
            />
          </div>
        )}
        {task.subtasks.map((s) => (
          <div
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minHeight: 44,
            }}
          >
            <button
              type="button"
              role="checkbox"
              aria-checked={s.done}
              aria-label={s.title}
              className="zn-check"
              style={
                s.done
                  ? {
                      background: 'var(--accent)',
                      borderColor: 'var(--accent-edge)',
                    }
                  : undefined
              }
              onClick={() => {
                if (!s.done) sound('complete')
                m.updateSubtask.mutate({
                  id: s.id,
                  taskId: task.id,
                  done: !s.done,
                })
              }}
            >
              {s.done && <Icon name="check" size={14} strokeWidth={3} />}
            </button>
            <span
              style={{
                flex: 1,
                fontSize: 14,
                lineHeight: '20px',
                color: s.done ? 'var(--ink-muted)' : 'var(--ink)',
                textDecoration: s.done ? 'line-through' : 'none',
              }}
            >
              {s.title}
            </span>
            <button
              type="button"
              className="zn-icon-btn"
              aria-label={`Delete subtask ${s.title}`}
              onClick={() =>
                m.deleteSubtask.mutate({ id: s.id, taskId: task.id })
              }
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!sub.trim()) return
            m.addSubtask.mutate({ taskId: task.id, title: sub.trim() })
            setSub('')
          }}
        >
          <Input
            aria-label="Add a subtask"
            placeholder="Add a subtask and press Enter"
            value={sub}
            maxLength={200}
            onChange={(e) => setSub(e.target.value)}
          />
        </form>
      </section>

      <section
        aria-labelledby={`nt-${task.id}`}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            id={`nt-${task.id}`}
            style={{ margin: 0, fontSize: 15, fontWeight: 600 }}
          >
            Notes
          </h2>
          <Button
            variant="ghost"
            size="sm"
            icon="plus"
            onClick={addNote}
            loading={noteM.create.isPending}
          >
            New note
          </Button>
        </div>
        {linked.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)' }}>
            No notes yet. Add one to keep context, links or a checklist beside
            this task.
          </p>
        ) : (
          linked.map((n) => <NoteCard key={n.id} note={n} height={120} />)
        )}
      </section>

      <span
        aria-live="polite"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: 'var(--ink-muted)',
        }}
      >
        {m.update.isPending || m.updateSubtask.isPending ? (
          <>
            <span
              className="zn-spinner"
              aria-hidden="true"
              style={{ width: 12, height: 12 }}
            />
            Saving
          </>
        ) : (
          <>
            <Icon name="check" size={14} />
            Saved
          </>
        )}
      </span>
    </div>
  )
}
