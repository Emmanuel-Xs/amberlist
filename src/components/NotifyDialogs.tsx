import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { meQuery, useUpdateMe } from '#/lib/api'
import { daysBetween, toISODate } from '#/lib/dates'
import { enableReminders, useNotifyState } from '#/lib/notifications'
import type { EnableResult } from '#/lib/notifications'
import { toast } from '#/lib/store'
import { Icon } from '#/ui/icons'
import { Button, Modal } from '#/ui/zen'

/** The pre prompt rests for a week after "Not now" and never nags in between. */
const REST_DAYS = 7

/** Our own friendly ask, shown before the browser's permission box (which we can't style). */
export function PrePrompt({
  open,
  busy,
  onNotNow,
  onTurnOn,
}: {
  open: boolean
  busy?: boolean
  onNotNow: () => void
  onTurnOn: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onNotNow}
      title="Turn on reminders"
      icon="bell"
      iconTone="accent"
      footer={
        <>
          <Button variant="secondary" onClick={onNotNow}>
            Not now
          </Button>
          <Button loading={busy} onClick={onTurnOn} data-autofocus="">
            Turn on reminders
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p
          style={{
            margin: 0,
            fontSize: 17,
            lineHeight: '24px',
            fontWeight: 600,
          }}
        >
          Want a nudge when it is time?
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: '20px',
            color: 'var(--ink-muted)',
          }}
        >
          Honeylist can send a small notification before a task starts, even
          when this tab is closed. Your browser will ask you to confirm next.
        </p>
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            fontSize: 14,
          }}
        >
          {[
            'Only for tasks where you set Remind me',
            'No marketing, ever',
            'Turn it off any time in Profile',
          ].map((t) => (
            <li
              key={t}
              style={{ display: 'flex', gap: 10, alignItems: 'center' }}
            >
              <span
                style={{ color: 'var(--accent-ink)', display: 'inline-flex' }}
              >
                <Icon name="check" size={18} />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}

const STEPS: [string, string][] = [
  [
    'Open your browser settings for this site',
    'Click the lock icon beside the address, then Site settings.',
  ],
  ['Set Notifications to Allow', 'It says Block now.'],
  [
    'Come back and press Check again',
    'Your reminders start working right away.',
  ],
]

/** What to do when the browser has blocked notifications (it will not ask again on its own). */
export function BlockedHelp({
  open,
  onClose,
  needsInstall,
  onChecked,
}: {
  open: boolean
  onClose: () => void
  needsInstall?: boolean
  /** Runs when Check again finds notifications allowed. */
  onChecked?: () => void
}) {
  const notify = useNotifyState()
  const [busy, setBusy] = useState(false)
  const check = async () => {
    setBusy(true)
    await notify.refresh()
    setBusy(false)
    if (Notification.permission === 'granted') {
      const r = await enableReminders()
      if (r === 'on' || r === 'unavailable') {
        toast({ tone: 'success', icon: 'bell', message: 'Reminders are on' })
        onChecked?.()
        onClose()
      }
    } else
      toast({
        icon: 'bellOff',
        message: 'Still blocked',
        detail: 'Change the setting, then press Check again.',
      })
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Turn on notifications in your browser"
      description="Reminders were blocked earlier, so the browser will not ask again."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button loading={busy} onClick={() => void check()}>
            Check again
          </Button>
        </>
      }
    >
      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {STEPS.map(([title, text], i) => (
          <li key={title} style={{ display: 'flex', gap: 12 }}>
            <span
              aria-hidden="true"
              style={{
                width: 28,
                height: 28,
                flexShrink: 0,
                borderRadius: '50%',
                background: 'var(--accent)',
                color: 'var(--on-accent)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {i + 1}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                {text}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p
        className="pk-note"
        style={{ margin: '16px 0 0', fontSize: 13, lineHeight: '19px' }}
      >
        <span className="pk-note-icon">
          <Icon name="alert" size={18} />
        </span>
        <span>
          On iPhone and iPad, reminders need Honeylist on your Home Screen
          first: Share, then Add to Home Screen. Then allow notifications from
          Settings, Notifications, Honeylist.
          {needsInstall && ' This browser is not installed yet.'}
        </span>
      </p>
    </Modal>
  )
}

/**
 * The permission flow around "Remind me". Call `afterPick(when)` once a reminder is chosen:
 * the first time (and if the browser hasn't been asked) our pre prompt opens, then the
 * browser's own box, then a friendly toast. Blocked and rested states never nag.
 */
export function useNotifyFlow() {
  const notify = useNotifyState()
  const { data: me } = useQuery(meQuery)
  const updateMe = useUpdateMe()
  const [prompt, setPrompt] = useState<string | null>(null)
  const [help, setHelp] = useState(false)
  const [busy, setBusy] = useState(false)

  const resting = () => {
    const last = me?.nudgeState?.notify
    return !!last && daysBetween(last, toISODate(new Date())) < REST_DAYS
  }

  const afterPick = (when?: string, force = false) => {
    if (!notify.ready || notify.permission !== 'default') return
    if (!force && resting()) return
    setPrompt(when ?? '')
  }
  const notNow = () => {
    setPrompt(null)
    updateMe.mutate({ nudgeDismissed: 'notify' })
  }
  const turnOn = async () => {
    const when = prompt
    setBusy(true)
    const r: EnableResult = await enableReminders()
    setBusy(false)
    setPrompt(null)
    if (r === 'on' || r === 'unavailable')
      toast({
        tone: 'success',
        icon: 'bell',
        message: 'Reminders are on',
        detail: when ? `We will nudge you at ${when}.` : undefined,
      })
    else if (r === 'denied') setHelp(true)
  }

  const dialogs = (
    <>
      <PrePrompt
        open={prompt !== null}
        busy={busy}
        onNotNow={notNow}
        onTurnOn={() => void turnOn()}
      />
      <BlockedHelp
        open={help}
        onClose={() => setHelp(false)}
        needsInstall={notify.needsInstall}
      />
    </>
  )
  return { notify, afterPick, openHelp: () => setHelp(true), dialogs }
}
