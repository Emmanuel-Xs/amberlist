import { useId, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { extractTasks, useAiRemaining, useAiStatus } from '#/lib/ai'
import type { ExtractedTask } from '#/lib/ai'
import { ApiError, api, qk } from '#/lib/api'
import type { Task } from '#/lib/api'
import { formatDay, toISODate } from '#/lib/dates'
import { toast } from '#/lib/store'
import { Icon } from '#/ui/icons'
import { Alert, Button, Skeleton } from '#/ui/zen'
import { AiButton, AiFootnote } from './AiBreakdown'

type Row = ExtractedTask & { keep: boolean }
type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'review'; rows: Row[] }

/**
 * Phase 3: reads a note or the scratchpad and proposes tasks. The user reviews them
 * (edit titles, untick) before anything is created. Runs only on tap; only this text is sent.
 */
export function AiExtract({ text }: { text: string }) {
  const { data: status } = useAiStatus()
  const setRemaining = useAiRemaining()
  const qc = useQueryClient()
  const uid = useId()
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [adding, setAdding] = useState(false)
  if (!status?.enabled) return null
  const empty = !text.trim()

  const run = async () => {
    setState({ kind: 'loading' })
    try {
      const r = await extractTasks(text, toISODate(new Date()))
      setRemaining(r.remaining)
      setState({
        kind: 'review',
        rows: r.tasks.map((t) => ({ ...t, keep: true })),
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setRemaining(0)
      setState({
        kind: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Something went wrong. Try again.',
      })
    }
  }

  const create = async (rows: Row[]) => {
    setAdding(true)
    let made = 0
    try {
      for (const r of rows) {
        const t = await api<Task>('/tasks', {
          method: 'POST',
          json: {
            title: r.title.trim(),
            ...(r.date ? { startDate: r.date } : {}),
            ...(r.priority ? { priority: r.priority } : {}),
          },
        })
        made += 1
        qc.setQueryData<Task[]>(qk.tasks, (old) => [t, ...(old ?? [])])
      }
      toast({
        tone: 'success',
        badge: 'logo',
        message: `Added ${made} ${made === 1 ? 'task' : 'tasks'}`,
        detail: 'Find them in Tasks.',
      })
      setState({ kind: 'idle' })
    } catch {
      toast({
        tone: 'error',
        icon: 'alert',
        message: made
          ? `Added ${made}, then something went wrong.`
          : "Couldn't add the tasks.",
      })
    } finally {
      setAdding(false)
      void qc.invalidateQueries({ queryKey: qk.tasks })
      void qc.invalidateQueries({ queryKey: qk.categories })
    }
  }

  if (state.kind === 'loading')
    return (
      <div
        className="ai-panel"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">Finding tasks</span>
        <Skeleton width="82%" height={14} />
        <Skeleton width="58%" height={14} />
        <Skeleton width="70%" height={14} />
      </div>
    )

  if (state.kind === 'review') {
    const { rows } = state
    const setRow = (i: number, patch: Partial<Row>) =>
      setState({
        kind: 'review',
        rows: rows.map((r, j) => (j === i ? { ...r, ...patch } : r)),
      })
    const chosen = rows.filter((r) => r.keep && r.title.trim())
    return (
      <div className="ai-panel" role="group" aria-label="Tasks found">
        <p className="ai-panel-title">
          <Sparkles size={16} aria-hidden="true" />
          {rows.length
            ? `Found ${rows.length} ${rows.length === 1 ? 'task' : 'tasks'}. Check them before adding.`
            : 'No tasks found in this text.'}
        </p>
        {rows.map((r, i) => (
          <div key={i} className="ai-row">
            <button
              type="button"
              role="checkbox"
              aria-checked={r.keep}
              aria-label={`Add "${r.title || 'untitled'}"`}
              className="zn-check"
              onClick={() => setRow(i, { keep: !r.keep })}
            >
              {r.keep && <Icon name="check" size={14} />}
            </button>
            <div className="ai-row-body">
              <label htmlFor={`${uid}-${i}`} className="sr-only">
                Task title {i + 1}
              </label>
              <input
                id={`${uid}-${i}`}
                className="ai-row-input"
                value={r.title}
                maxLength={200}
                onChange={(e) => setRow(i, { title: e.target.value })}
              />
              {(r.date || r.priority === 'high' || r.priority === 'low') && (
                <span className="ai-row-meta">
                  {r.date && (
                    <span>
                      <Icon name="calendar" size={14} /> {formatDay(r.date)}
                    </span>
                  )}
                  {r.priority === 'high' && (
                    <span className="ai-row-high">
                      <Icon name="flag" size={14} /> High
                    </span>
                  )}
                  {r.priority === 'low' && (
                    <span>
                      <Icon name="chevronDown" size={14} /> Low
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        ))}
        <div className="ai-actions">
          {rows.length > 0 && (
            <Button
              size="sm"
              icon="plus"
              disabled={!chosen.length}
              loading={adding}
              onClick={() => void create(chosen)}
            >
              {`Add ${chosen.length} ${chosen.length === 1 ? 'task' : 'tasks'}`}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            disabled={adding}
            onClick={() => setState({ kind: 'idle' })}
          >
            {rows.length ? 'Cancel' : 'Close'}
          </Button>
        </div>
        <AiFootnote remaining={status.remaining} what="text" />
      </div>
    )
  }

  return (
    <div className="ai-panel ai-panel--idle">
      {state.kind === 'error' && (
        <Alert
          tone="warning"
          actionLabel={status.remaining > 0 ? 'Try again' : undefined}
          onAction={() => void run()}
        >
          {state.message}
        </Alert>
      )}
      <AiButton
        onClick={() => void run()}
        disabled={empty || status.remaining <= 0}
      >
        Turn into tasks
      </AiButton>
      <AiFootnote remaining={status.remaining} what="text" />
    </div>
  )
}
