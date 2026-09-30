import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useDebouncedCallback } from '@tanstack/react-pacer'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import type { Element, Root } from 'hast'
import { api, qk, useNoteMutations, useNotes, useTasks } from '#/lib/api'
import type { Note } from '#/lib/api'
import { sound } from '#/lib/feedback'
import { deleteNoteWithUndo } from '#/lib/noteActions'
import {
  checklistLines,
  continueList,
  toggleChecklist,
  togglePrefix,
} from '#/lib/markdown'
import { toast } from '#/lib/store'
import { colorVar, NOTE_PRESET_COLORS } from '#/lib/colors'
import { Icon } from '#/ui/icons'
import { Button, EmptyState, IconButton, Skeleton } from '#/ui/zen'
import { AiExtract } from '#/components/AiExtract'
import { ColorPicker } from '#/components/ColorPicker'

/** Tags each task checkbox with the source line of its list item, so a click can tick the right line. */
function stampChecklistLines() {
  return (tree: Root) => {
    const walk = (node: Root | Element, line: number | null) => {
      for (const child of node.children) {
        if (child.type !== 'element') continue
        const own = child.tagName === 'li' ? child.position?.start.line : null
        if (child.tagName === 'input' && line !== null)
          child.properties.dataLine = line
        walk(child, own ?? line)
      }
    }
    walk(tree, null)
  }
}

// Same rules as the default sanitizer, plus the one attribute we add above.
const SCHEMA = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    input: [...(defaultSchema.attributes?.input ?? []), 'dataLine'],
  },
}

type Save = 'idle' | 'saving' | 'saved' | 'error'

/** Full note editor: title, markdown body with live checklists, autosave, pin, color, task link. */
export function NoteEditor({ id }: { id: string }) {
  const { data: notes, isLoading } = useNotes()
  const note = notes?.find((n) => n.id === id)
  if (isLoading) return <EditorSkeleton />
  if (!note)
    return (
      <EmptyState
        illustration="notes"
        title="Note not found"
        text="It may have been deleted."
      >
        <Link
          to="/notes"
          className="zn-btn zn-btn--primary zn-btn--md"
          style={{ textDecoration: 'none' }}
        >
          <span className="zn-btn-label">Back to notes</span>
        </Link>
      </EmptyState>
    )
  return <Editor key={note.id} note={note} />
}

function EditorSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading note"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <Skeleton width={120} height={36} radius={12} />
      <Skeleton width="70%" height={40} radius={10} />
      <Skeleton height={240} radius={20} />
    </div>
  )
}

function Editor({ note }: { note: Note }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { update, create } = useNoteMutations()
  const { data: tasks = [] } = useTasks()
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [mode, setMode] = useState<'write' | 'preview'>(
    note.body.trim() ? 'preview' : 'write',
  )
  const [status, setStatus] = useState<Save>('idle')
  const area = useRef<HTMLTextAreaElement>(null)
  const latest = useRef({ title: note.title, body: note.body, dirty: false })
  const caret = useRef<number | null>(null)

  const persist = (patch: Partial<Note>) =>
    update.mutate(
      { id: note.id, ...patch },
      {
        onSuccess: () => setStatus('saved'),
        onError: () => setStatus('error'),
      },
    )

  const save = useDebouncedCallback(
    () => {
      latest.current.dirty = false
      persist({ title: latest.current.title, body: latest.current.body })
    },
    { wait: 600 },
  )

  const edit = (next: { title?: string; body?: string }) => {
    if (next.title !== undefined) setTitle(next.title)
    if (next.body !== undefined) setBody(next.body)
    latest.current = { ...latest.current, ...next, dirty: true }
    setStatus('saving')
    save()
  }

  // Leaving the page inside the debounce window must not lose the last keystrokes.
  useEffect(
    () => () => {
      if (latest.current.dirty)
        void api<Note>(`/notes/${note.id}`, {
          method: 'PATCH',
          json: { title: latest.current.title, body: latest.current.body },
        }).then((saved) =>
          qc.setQueryData<Note[]>(qk.notes, (old) =>
            old?.map((n) => (n.id === saved.id ? saved : n)),
          ),
        )
    },
    [note.id, qc],
  )

  // Grow the textarea with its content, and restore the caret after list edits.
  useEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 240)}px`
    if (caret.current !== null) {
      el.setSelectionRange(caret.current, caret.current)
      caret.current = null
    }
  }, [body, mode])

  const apply = (r: { body: string; caret: number }) => {
    caret.current = r.caret
    edit({ body: r.body })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
    const el = e.currentTarget
    if (el.selectionStart !== el.selectionEnd) return
    const r = continueList(el.value, el.selectionStart)
    if (!r) return
    e.preventDefault()
    apply(r)
  }

  const prefix = (p: string) => {
    const el = area.current
    apply(togglePrefix(body, el?.selectionStart ?? body.length, p))
    el?.focus()
  }

  const tick = (line: number) => {
    const next = toggleChecklist(body, line)
    setBody(next)
    latest.current = { ...latest.current, body: next, dirty: false }
    persist({ body: next })
    sound('complete')
  }

  const remove = () => {
    latest.current.dirty = false
    deleteNoteWithUndo(qc, note.id)
    void navigate({ to: '/notes' })
  }

  const duplicate = () =>
    create.mutate(
      {
        title: `${title || 'Untitled note'} (copy)`,
        body,
        color: note.color,
        taskId: note.taskId,
      },
      {
        onSuccess: (n) => {
          toast({ tone: 'success', icon: 'check', message: 'Note duplicated' })
          void navigate({ to: '/notes/$id', params: { id: n.id } })
        },
      },
    )

  const items = useMemo(() => checklistLines(body), [body])
  const done = items.filter((i) => /\[[xX]\]/.test(body.split('\n')[i] ?? ''))
  const onSurface = note.color === 'surface'

  return (
    <div
      style={{
        maxWidth: 760,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link
          to="/notes"
          aria-label="Back to notes"
          className="zn-icon-btn"
          style={{ textDecoration: 'none' }}
        >
          <Icon name="arrowLeft" size={22} />
        </Link>
        <span
          aria-live="polite"
          style={{ flex: 1, fontSize: 12, color: 'var(--ink-muted)' }}
        >
          {status === 'saving' && 'Saving'}
          {status === 'saved' && 'Saved'}
          {status === 'error' && (
            <span style={{ color: 'var(--danger)' }}>
              Couldn't save. Keep typing and we'll retry.
            </span>
          )}
        </span>
        <IconButton
          label={note.pinned ? 'Unpin note' : 'Pin note'}
          icon="pin"
          iconSize={22}
          aria-pressed={note.pinned}
          onClick={() => persist({ pinned: !note.pinned })}
          style={note.pinned ? { color: 'var(--accent-ink)' } : undefined}
        />
        <IconButton
          label="Duplicate note"
          icon="copy"
          iconSize={22}
          onClick={duplicate}
        />
        <IconButton
          label="Delete note"
          icon="trash"
          iconSize={22}
          onClick={remove}
        />
      </header>

      <div
        className="note-card-editor"
        style={{
          borderRadius: 24,
          padding: 'clamp(16px, 4vw, 28px)',
          background: colorVar(note.color),
          color: onSurface ? 'var(--ink)' : 'var(--on-pastel)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <label htmlFor="note-title" className="sr-only">
          Title
        </label>
        <input
          id="note-title"
          value={title}
          onChange={(e) => edit({ title: e.target.value })}
          placeholder="Untitled note"
          maxLength={200}
          autoComplete="off"
          className="note-title"
        />

        <div
          role="group"
          aria-label="Editor mode"
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
        >
          <ModeButton on={mode === 'write'} onClick={() => setMode('write')}>
            Write
          </ModeButton>
          <ModeButton
            on={mode === 'preview'}
            onClick={() => setMode('preview')}
          >
            Preview
          </ModeButton>
          {mode === 'write' && (
            <>
              <span style={{ flex: 1 }} />
              <ToolButton label="Checklist" onClick={() => prefix('- [ ] ')} />
              <ToolButton label="Bullets" onClick={() => prefix('- ')} />
              <ToolButton label="Heading" onClick={() => prefix('## ')} />
            </>
          )}
        </div>

        {mode === 'write' ? (
          <>
            <label htmlFor="note-body" className="sr-only">
              Note
            </label>
            <textarea
              id="note-body"
              ref={area}
              value={body}
              onChange={(e) => edit({ body: e.target.value })}
              onKeyDown={onKeyDown}
              placeholder="Write here. Markdown works: - [ ] makes a checklist, ## a heading."
              maxLength={50000}
              className="note-body"
              style={{ minHeight: 240 }}
            />
          </>
        ) : (
          <Preview body={body} onTick={tick} />
        )}

        {items.length > 0 && (
          <p style={{ margin: 0, fontSize: 12, opacity: 0.75 }}>
            {done.length} of {items.length} done
          </p>
        )}
      </div>

      <AiExtract text={title.trim() ? `${title}\n${body}` : body} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ColorPicker
          label="Note color"
          presets={NOTE_PRESET_COLORS}
          value={note.color}
          onChange={(color) => persist({ color })}
        />

        <div>
          <label className="zn-field-label" htmlFor="note-task">
            Linked task
          </label>
          <div className="zn-field--filled" style={{ marginTop: 8 }}>
            <select
              id="note-task"
              className="zn-input"
              value={note.taskId ?? ''}
              onChange={(e) => persist({ taskId: e.target.value || null })}
            >
              <option value="">No task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button
          variant="outline"
          icon="trash"
          onClick={remove}
          className="note-delete"
        >
          Delete note
        </Button>
      </div>
    </div>
  )
}

function ModeButton({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={['note-mode', on && 'is-on'].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  )
}

function ToolButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button type="button" className="note-tool" onClick={onClick}>
      {label}
    </button>
  )
}

/** Sanitized markdown. Checklist boxes are real buttons that tick the matching line. */
function Preview({
  body,
  onTick,
}: {
  body: string
  onTick: (line: number) => void
}) {
  if (!body.trim())
    return (
      <p style={{ margin: 0, opacity: 0.7 }}>
        Nothing here yet. Switch to Write to start.
      </p>
    )
  const lines = new Set(checklistLines(body))
  return (
    <div className="md">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[stampChecklistLines, [rehypeSanitize, SCHEMA]]}
        components={{
          input: (props) => {
            if (props.type !== 'checkbox') return null
            const found = Number(props['data-line' as keyof typeof props]) - 1
            const line = lines.has(found) ? found : undefined
            const checked = !!props.checked
            return (
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                aria-label={checked ? 'Mark not done' : 'Mark done'}
                className={['md-check', checked && 'is-on']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => line !== undefined && onTick(line)}
              >
                {checked && <Icon name="check" size={16} strokeWidth={2.5} />}
              </button>
            )
          },
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow">
              {children}
            </a>
          ),
        }}
      >
        {body}
      </Markdown>
    </div>
  )
}

/** Hue gradient for the slider track: every stop is the soft shade the slider would pick. */
