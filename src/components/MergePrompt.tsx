import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, meQuery, qk } from '#/lib/api'
import type { Prefs } from '#/lib/api'
import { toast } from '#/lib/store'
import { Button, ConfirmDialog, Modal } from '#/ui/zen'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/**
 * Overlays board, "Keep this device's tasks?": shown after returning from Google when this
 * device and the Google account both had data. Merge is the default; there is no close button,
 * so nothing is dropped without a choice.
 */
export function MergePrompt() {
  const qc = useQueryClient()
  const { data: me } = useQuery(meQuery)
  const [choice, setChoice] = useState<'merge' | 'discard' | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const answer = useMutation({
    mutationFn: (c: 'merge' | 'discard') =>
      api<Prefs>('/me/merge', { method: 'POST', json: { choice: c } }),
    onMutate: (c) => {
      setChoice(c)
      setConfirmDiscard(false)
    },
    onSuccess: (p, c) => {
      qc.setQueryData(qk.me, p)
      void qc.invalidateQueries()
      toast({
        tone: 'success',
        icon: 'check',
        message:
          c === 'merge'
            ? 'Merged. Your data is saved to your Google account.'
            : "Done. You're seeing your account's data.",
      })
    },
    onError: (e) => {
      setChoice(null)
      toast({ tone: 'error', icon: 'alert', message: e.message, duration: 0 })
    },
  })

  const pending = me?.pendingMerge
  if (!pending) return null
  const parts = [
    pending.tasks ? plural(pending.tasks, 'task') : null,
    pending.notes ? plural(pending.notes, 'note') : null,
  ].filter(Boolean)
  const what = parts.length ? parts.join(' and ') : 'some data'

  // One overlay at a time: Discard swaps the prompt for its confirm, Cancel swaps back.
  if (confirmDiscard)
    return (
      <ConfirmDialog
        open
        onClose={() => setConfirmDiscard(false)}
        onConfirm={() => answer.mutate('discard')}
        title="Discard this device's data?"
        text={`The ${what} made on this device will be deleted for good. Your Google account keeps only its own data.`}
        confirmLabel="Discard them"
      />
    )

  return (
    <Modal
      open
      role="alertdialog"
      onClose={() => undefined}
      title="Keep this device's tasks?"
      description={`This device has ${what}. Your Google account already has data from another device.`}
      footer={
        <>
          <Button
            variant="ghost"
            loading={choice === 'discard'}
            disabled={answer.isPending}
            onClick={() => setConfirmDiscard(true)}
          >
            Discard them
          </Button>
          <Button
            data-autofocus=""
            loading={choice === 'merge'}
            disabled={answer.isPending}
            onClick={() => answer.mutate('merge')}
          >
            Merge into account
          </Button>
        </>
      }
    />
  )
}
