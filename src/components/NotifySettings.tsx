import { useState } from 'react'
import {
  disableReminders,
  enableReminders,
  sendTestNotification,
} from '#/lib/notifications'
import { toast } from '#/lib/store'
import { Icon } from '#/ui/icons'
import { Button } from '#/ui/zen'
import { useNotifyFlow } from './NotifyDialogs'

/** The Profile settings row for reminders: Off, On for this browser, or Blocked in browser settings. */
export function NotifySettings() {
  const flow = useNotifyFlow()
  const { notify } = flow
  const [busy, setBusy] = useState(false)

  const blocked = notify.permission === 'denied'
  const unsupported = notify.permission === 'unsupported'
  const on = notify.permission === 'granted' && notify.subscribed

  const turnOn = async () => {
    if (blocked || unsupported) return flow.openHelp()
    if (notify.permission === 'granted') {
      setBusy(true)
      const r = await enableReminders()
      setBusy(false)
      if (r === 'unavailable')
        toast({
          icon: 'bellOff',
          message: 'Reminders can’t reach a closed tab yet',
          detail: 'Push is not set up on this server. Banners still work.',
        })
      return
    }
    flow.afterPick('', true)
  }
  const test = async () => {
    setBusy(true)
    try {
      const { reached } = await sendTestNotification()
      toast(
        reached
          ? {
              icon: 'bell',
              message: 'Test sent',
              detail: 'It should arrive in a moment.',
            }
          : {
              icon: 'bellOff',
              message: 'No browser to send to',
              detail: 'Turn reminders off and on again.',
            },
      )
    } finally {
      setBusy(false)
    }
  }

  const [title, text] = blocked
    ? ['Blocked in browser settings', 'We cannot turn this on for you.']
    : on
      ? [
          'On for this browser',
          'Reminders arrive even when Honeylist is closed.',
        ]
      : unsupported && notify.needsInstall
        ? [
            'Add Honeylist to your Home Screen',
            'iPhone and iPad only send reminders to installed apps.',
          ]
        : ['Off', 'Reminders show inside Honeylist only while it is open.']

  return (
    <div
      role="group"
      aria-label="Notifications"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        flexWrap: 'wrap',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          background: on ? 'var(--accent-soft)' : 'var(--surface-raised)',
          color: on ? 'var(--accent-ink)' : 'var(--ink-muted)',
        }}
      >
        <Icon name={blocked ? 'bellOff' : 'bell'} size={20} />
      </span>
      <span
        style={{
          flex: '1 1 200px',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
        <span
          style={{
            fontSize: 12,
            lineHeight: '18px',
            color: 'var(--ink-muted)',
          }}
        >
          {text}
        </span>
      </span>
      <span style={{ display: 'flex', gap: 8 }}>
        {on ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              loading={busy}
              onClick={() => void test()}
            >
              Send a test
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                void disableReminders().then(() =>
                  toast({
                    icon: 'bellOff',
                    message: 'Reminders are off on this browser',
                  }),
                )
              }
            >
              Turn off
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant={blocked || unsupported ? 'secondary' : 'primary'}
            loading={busy}
            onClick={() => void turnOn()}
          >
            {blocked || unsupported ? 'How to fix' : 'Turn on'}
          </Button>
        )}
      </span>
      {flow.dialogs}
    </div>
  )
}
