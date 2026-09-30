import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useDebouncedCallback } from '@tanstack/react-pacer'
import {
  api,
  qk,
  scratchpadQuery,
  useNoteMutations,
  useTaskMutations,
} from '#/lib/api'
import type { Note } from '#/lib/api'
import { toISODate } from '#/lib/dates'
import { sound } from '#/lib/feedback'
import { parseQuickAdd } from '#/lib/parse'
import { setScratch, toast, ui } from '#/lib/store'
import { Button, Modal } from '#/ui/zen'
import { AiExtract } from './AiExtract'

/** One always-there quick note. Any line can become a task or a note. */
export function Scratchpad() {
  const open = useStore(ui, (s) => s.scratchOpen)
  const qc = useQueryClient()
  const { data } = useQuery({ ...scratchpadQuery, enabled: open })
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  )
  const tasks = useTaskMutations()
  const notes = useNoteMutations()

  useEffect(() => {
    if (data) setBody(data.body)
  }, [data])

  const save = useDebouncedCallback(
    async (text: string) => {
      try {
        const saved = await api<Note>('/scratchpad', {
          method: 'PUT',
          json: { body: text },
        })
        qc.setQueryData(qk.scratchpad, saved)
        setStatus('saved')
      } catch {
        setStatus('error')
      }
    },
    { wait: 600 },
  )

  const update = (text: string) => {
    setBody(text)
    setStatus('saving')
    save(text)
  }

  const lines = body
    .split('\n')
    .map((l, i) => ({ text: l.trim(), i }))
    .filter((l) => l.text)
  const takeLine = (i: number) =>
    update(
      body
        .split('\n')
        .filter((_, j) => j !== i)
        .join('\n'),
    )

  const toTask = (text: string, i: number) => {
    const p = parseQuickAdd(text, toISODate(new Date()))
    tasks.create.mutate({
      title: p.title || text,
      startDate: p.startDate ?? null,
      startTime: p.startTime ?? null,
      endTime: p.endTime ?? null,
      dueDate: p.dueDate ?? null,
      priority: p.priority,
    })
    takeLine(i)
    sound('complete')
    toast({ tone: 'success', icon: 'check', message: 'Turned into a task' })
  }
  const toNote = (text: string, i: number) => {
    notes.create.mutate({ title: text.slice(0, 200), body: '' })
    takeLine(i)
    toast({ icon: 'note', message: 'Turned into a note' })
  }

  return (
    <Modal
      open={open}
      onClose={() => setScratch(false)}
      title="Scratchpad"
      description="Dump anything here. Turn any line into a task or a note."
      variant="right"
    >
      <label htmlFor="scratch-body" className="sr-only">
        Scratchpad
      </label>
      <textarea
        id="scratch-body"
        data-autofocus=""
        value={body}
        onChange={(e) => update(e.target.value)}
        placeholder="Type a thought"
        rows={8}
        maxLength={50000}
        style={{
          width: '100%',
          minHeight: 180,
          resize: 'vertical',
          font: 'inherit',
          fontSize: 16,
          lineHeight: '24px',
          color: 'var(--ink)',
          background: 'var(--surface-raised)',
          border: '1px solid transparent',
          borderRadius: 16,
          padding: 14,
          outline: 'none',
        }}
      />
      <span
        aria-live="polite"
        style={{
          fontSize: 12,
          color: status === 'error' ? 'var(--danger)' : 'var(--ink-muted)',
        }}
      >
        {status === 'saving'
          ? 'Saving'
          : status === 'saved'
            ? 'Saved'
            : status === 'error'
              ? "Couldn't save. Keep typing and we'll retry."
              : ' '}
      </span>
      <AiExtract text={body} />
      {lines.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="zn-field-label">Lines</span>
          {lines.map((l) => (
            <div
              key={l.i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '10px 12px',
                borderRadius: 12,
                background: 'var(--surface-raised)',
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  lineHeight: '22px',
                  wordBreak: 'break-word',
                }}
              >
                {l.text}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  size="sm"
                  icon="tasks"
                  onClick={() => toTask(l.text, l.i)}
                >
                  Make task
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon="note"
                  onClick={() => toNote(l.text, l.i)}
                >
                  Make note
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
