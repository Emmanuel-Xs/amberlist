import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Store, useStore } from '@tanstack/react-store'
import { meQuery, qk, tasksQuery, useTasks, useUpdateMe } from '#/lib/api'
import type { Task } from '#/lib/api'
import { toISODate } from '#/lib/dates'
import { sound } from '#/lib/feedback'
import { useNotifyState, resubscribe } from '#/lib/notifications'
import {
  DEFAULT_START_TIME,
  SNOOZE_MINUTES,
  reminderBody,
} from '#/lib/reminders'
import { askSnooze, askStopRepeat, ui } from '#/lib/store'
import { shortDate } from '#/lib/repeat'
import { Icon } from '#/ui/icons'
import { Button, ConfirmDialog, IconButton, Modal, Popover } from '#/ui/zen'
import { useNotifyFlow } from './NotifyDialogs'
import { useTaskActions } from './useTaskActions'

const hhmm = (d: Date) =>
  d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

/** 10 minutes, 1 hour, Tomorrow at 09:00: the three snooze choices and when each brings it back. */
export function snoozeChoices(now = new Date()) {
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)
  return [
    {
      label: '10 minutes',
      minutes: SNOOZE_MINUTES,
      back: `Back at ${hhmm(new Date(now.getTime() + SNOOZE_MINUTES * 60_000))}`,
    },
    {
      label: '1 hour',
      minutes: 60,
      back: `Back at ${hhmm(new Date(now.getTime() + 3_600_000))}`,
    },
    {
      label: 'Tomorrow',
      minutes: Math.max(
        1,
        Math.round((tomorrow.getTime() - now.getTime()) / 60_000),
      ),
      back: `${shortDate(toISODate(tomorrow))}, 09:00`,
    },
  ]
}

function SnoozeList({ onPick }: { onPick: (minutes: number) => void }) {
  const choices = useMemo(() => snoozeChoices(), [])
  return (
    <div className="pk-body">
      <span className="pk-label">Snooze for</span>
      <div className="pk-opts" role="menu" aria-label="Snooze for">
        {choices.map((c) => (
          <button
            key={c.label}
            type="button"
            role="menuitem"
            className="pk-opt"
            onClick={() => onPick(c.minutes)}
          >
            <span className="pk-opt-main">{c.label}</span>
            <span className="pk-opt-side">{c.back}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Stop repeating (asks first) and Snooze (from the task menu), hosted once for every list. */
export function TaskDialogs() {
  const stop = useStore(ui, (s) => s.stopRepeat)
  const snooze = useStore(ui, (s) => s.snoozeTask)
  const { stopRepeating, snooze: doSnooze } = useTaskActions()
  return (
    <>
      <ConfirmDialog
        open={!!stop}
        onClose={() => askStopRepeat(null)}
        onConfirm={() => {
          if (stop) stopRepeating(stop)
          askStopRepeat(null)
        }}
        title={`Stop repeating ${stop?.title ?? ''}?`}
        text="This task stays, but no new ones will be made. The ones you already finished stay in Completed."
        confirmLabel="Stop repeating"
        confirmIcon="repeat"
        icon="repeat"
      />
      <Modal
        open={!!snooze}
        onClose={() => askSnooze(null)}
        title={snooze?.title ?? 'Snooze'}
        icon="bell"
        iconTone="accent"
      >
        <SnoozeList
          onPick={(m) => {
            if (snooze) doSnooze(snooze, m)
            askSnooze(null)
          }}
        />
      </Modal>
    </>
  )
}

interface Banner {
  key: string
  taskId: string
  title: string
  detail: string
}
const banners = new Store({ items: [] as Banner[] })
const addBanner = (b: Banner) =>
  banners.setState((s) =>
    s.items.some((x) => x.key === b.key) ? s : { items: [...s.items, b] },
  )
const dropBanner = (key: string) =>
  banners.setState((s) => ({ items: s.items.filter((x) => x.key !== key) }))

const SEEN = 'honeylist-reminders-seen'
const seen = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(SEEN) ?? '[]') as string[]
  } catch {
    return []
  }
}
const markSeen = (key: string) => {
  try {
    localStorage.setItem(SEEN, JSON.stringify([...seen(), key].slice(-50)))
  } catch {
    // Private mode: the banner may show again, which is harmless.
  }
}
const asDate = (iso: string) => new Date(iso.endsWith('Z') ? iso : `${iso}Z`)

/**
 * Keeps reminders honest while the app is open: sends this browser's time zone to the server,
 * shows a banner when a push arrives in a focused tab, and (for people without push) turns a
 * due `remindAt` into a banner. Mounted once in the shell.
 */
export function useReminderRuntime(enabled: boolean) {
  const qc = useQueryClient()
  const { data: me } = useQuery({ ...meQuery, enabled })
  const { data: tasks } = useQuery({ ...tasksQuery, enabled })
  const updateMe = useUpdateMe()
  const notify = useNotifyState()

  // Reminders count in the person's zone, so tell the server which one it is.
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (me && tz && me.timezone !== tz) updateMe.mutate({ timezone: tz })
  }, [me?.timezone, !!me])

  // Allowed earlier but this browser isn't subscribed (new device, cleared data): do it quietly.
  useEffect(() => {
    if (
      enabled &&
      notify.ready &&
      notify.permission === 'granted' &&
      !notify.subscribed
    )
      void resubscribe()
  }, [enabled, notify.ready, notify.permission, notify.subscribed])

  // The service worker tells a focused tab about a push instead of showing a system notification.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const onMessage = (e: MessageEvent) => {
      const d = e.data as
        | { type?: string; taskId?: string; title?: string; body?: string }
        | undefined
      if (d?.type !== 'reminder' || !d.taskId) return
      addBanner({
        key: `${d.taskId}:${Date.now()}`,
        taskId: d.taskId,
        title: d.title ?? 'Reminder',
        detail: d.body ?? '',
      })
      sound('success')
      void qc.invalidateQueries({ queryKey: qk.tasks })
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () =>
      navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [qc])

  // No push on this device: fire due reminders as banners while the tab is open.
  useEffect(() => {
    if (!tasks || notify.subscribed) return
    const check = () => {
      const now = Date.now()
      for (const t of tasks) {
        if (t.status === 'done' || !t.remindAt || t.remindOffset === null)
          continue
        const at = asDate(t.remindAt).getTime()
        const key = `${t.id}:${t.remindAt}`
        if (at > now || now - at > 2 * 3_600_000 || seen().includes(key))
          continue
        markSeen(key)
        addBanner({
          key,
          taskId: t.id,
          title: t.title,
          detail: reminderBody(
            t.remindOffset,
            t.startTime ?? DEFAULT_START_TIME,
          ),
        })
        sound('success')
      }
    }
    check()
    const id = window.setInterval(check, 20_000)
    return () => window.clearInterval(id)
  }, [tasks, notify.subscribed])
}

function ReminderBanner({ b, task }: { b: Banner; task: Task | undefined }) {
  const { toggle, snooze } = useTaskActions()
  const [open, setOpen] = useState(false)
  return (
    <section
      className="zn-alert zn-alert--info"
      role="status"
      aria-label={`Reminder: ${b.title}`}
      style={{ alignItems: 'center', flexWrap: 'wrap' }}
    >
      <span className="zn-alert-icon">
        <Icon name="bell" />
      </span>
      <div className="zn-alert-body">
        <strong className="zn-alert-title">{b.title}</strong>
        {b.detail}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {task && (
          <Popover
            open={open}
            onOpenChange={setOpen}
            label="Snooze"
            align="end"
            trigger={
              <Button variant="secondary" size="sm">
                Snooze
              </Button>
            }
          >
            <SnoozeList
              onPick={(m) => {
                snooze(task, m)
                setOpen(false)
                dropBanner(b.key)
              }}
            />
          </Popover>
        )}
        {task && (
          <Button
            size="sm"
            icon="check"
            onClick={() => {
              toggle(task)
              dropBanner(b.key)
            }}
          >
            Done
          </Button>
        )}
      </div>
      <IconButton label="Dismiss" icon="x" onClick={() => dropBanner(b.key)} />
    </section>
  )
}

const OFF_KEY = 'honeylist-notify-banner'

/** In page banners at the top of a list: a reminder that fired, and the once a day "reminders are off". */
export function ReminderBanners() {
  const items = useStore(banners, (s) => s.items)
  const { data: tasks = [] } = useTasks()
  const notify = useNotifyState()
  const flow = useNotifyFlow()
  const [offHidden, setOffHidden] = useState(() => {
    try {
      return localStorage.getItem(OFF_KEY) === toISODate(new Date())
    } catch {
      return false
    }
  })
  const withReminder = tasks.filter(
    (t) => t.remindOffset !== null && t.status !== 'done',
  ).length
  const off =
    notify.ready &&
    withReminder > 0 &&
    !(notify.permission === 'granted' && notify.subscribed) &&
    !offHidden
  const hideOff = () => {
    setOffHidden(true)
    try {
      localStorage.setItem(OFF_KEY, toISODate(new Date()))
    } catch {
      // Not saved: it shows again next visit.
    }
  }
  if (!items.length && !off) return flow.dialogs
  return (
    <>
      {items.map((b) => (
        <ReminderBanner
          key={b.key}
          b={b}
          task={tasks.find((t) => t.id === b.taskId)}
        />
      ))}
      {off && (
        <section
          className="zn-alert zn-alert--warning"
          role="status"
          aria-label="Reminders are off"
          style={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <span className="zn-alert-icon">
            <Icon name="bellOff" />
          </span>
          <div className="zn-alert-body">
            <strong className="zn-alert-title">
              Reminders are off on this device
            </strong>
            You have {withReminder} task{withReminder === 1 ? '' : 's'} with a
            reminder. Turn on notifications so they reach you when Honeylist is
            closed.
          </div>
          <Button
            size="sm"
            onClick={() =>
              notify.permission === 'denied' ||
              notify.permission === 'unsupported'
                ? flow.openHelp()
                : flow.afterPick('', true)
            }
          >
            Turn on
          </Button>
          <IconButton label="Dismiss" icon="x" onClick={hideOff} />
        </section>
      )}
      {flow.dialogs}
    </>
  )
}
