import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { breakdownTask, useAiRemaining, useAiStatus } from '#/lib/ai'
import { ApiError, useTaskMutations } from '#/lib/api'
import type { Task } from '#/lib/api'
import { toast } from '#/lib/store'
import { Alert, Button, Chip, Skeleton } from '#/ui/zen'

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'review'; items: string[]; picked: boolean[] }

/** Phase 3: suggests 3 to 7 subtasks for one task. Runs only on tap; only this task is sent. */
export function AiBreakdown({ task }: { task: Task }) {
  const { data: status } = useAiStatus()
  const setRemaining = useAiRemaining()
  const m = useTaskMutations()
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [adding, setAdding] = useState(false)
  if (!status?.enabled || task.status === 'done') return null

  const run = async () => {
    setState({ kind: 'loading' })
    try {
      const r = await breakdownTask(task.id)
      setRemaining(r.remaining)
      setState({
        kind: 'review',
        items: r.subtasks,
        picked: r.subtasks.map(() => true),
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setRemaining(0)
      setState({
        kind: 'error',
        message:
          err instanceof Error ? err.message : 'Something went wrong. Try again.',
      })
    }
  }

  const add = async (items: string[]) => {
    setAdding(true)
    try {
      // One at a time so they keep the suggested order.
      for (const title of items)
        await m.addSubtask.mutateAsync({ taskId: task.id, title })
      toast({
        tone: 'success',
        badge: 'check',
        message: `Added ${items.length} ${items.length === 1 ? 'subtask' : 'subtasks'}`,
      })
      setState({ kind: 'idle' })
    } catch {
      toast({ tone: 'error', icon: 'alert', message: "Couldn't add them all." })
    } finally {
      setAdding(false)
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
        <span className="sr-only">Thinking up steps</span>
        <Skeleton width="78%" height={14} />
        <Skeleton width="62%" height={14} />
        <Skeleton width="70%" height={14} />
      </div>
    )

  if (state.kind === 'review') {
    const chosen = state.items.filter((_, i) => state.picked[i])
    return (
      <div className="ai-panel" role="group" aria-label="Suggested subtasks">
        <p className="ai-panel-title">
          <Sparkles size={16} aria-hidden="true" /> Suggested steps
        </p>
        <div className="ai-chips">
          {state.items.map((s, i) => (
            <Chip
              key={s}
              className="ai-chip"
              selected={state.picked[i]}
              icon={state.picked[i] ? 'check' : 'plus'}
              onClick={() =>
                setState({
                  ...state,
                  picked: state.picked.map((p, j) => (j === i ? !p : p)),
                })
              }
            >
              {s}
            </Chip>
          ))}
        </div>
        <div className="ai-actions">
          <Button
            size="sm"
            icon="plus"
            disabled={!chosen.length}
            loading={adding}
            onClick={() => void add(chosen)}
          >
            {chosen.length === state.items.length
              ? 'Add all'
              : `Add selected (${chosen.length})`}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={adding}
            onClick={() => setState({ kind: 'idle' })}
          >
            Cancel
          </Button>
        </div>
        <AiFootnote remaining={status.remaining} what="task" />
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
      <AiButton onClick={() => void run()} disabled={status.remaining <= 0}>
        Break it down
      </AiButton>
      <AiFootnote remaining={status.remaining} what="task" />
    </div>
  )
}

/** Secondary button with the sparkles mark, shared by the AI actions. */
export function AiButton({
  children,
  onClick,
  disabled,
}: {
  children: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className="zn-btn zn-btn--outline zn-btn--sm zn-btn--lead-icon ai-btn"
      onClick={onClick}
      disabled={disabled}
    >
      <Sparkles size={16} aria-hidden="true" />
      <span className="zn-btn-label">{children}</span>
    </button>
  )
}

export function AiFootnote({
  remaining,
  what,
}: {
  remaining: number
  what: 'task' | 'text'
}) {
  return (
    <p className="ai-footnote">
      Only this {what} is sent to the AI.{' '}
      {remaining <= 0
        ? 'No AI helps left today.'
        : `${remaining} AI ${remaining === 1 ? 'help' : 'helps'} left today.`}
    </p>
  )
}
