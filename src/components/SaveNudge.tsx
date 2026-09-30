import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { meQuery, useTasks, useUpdateMe } from '#/lib/api'
import { signInWithGoogle } from '#/lib/auth-client'
import { toISODate } from '#/lib/dates'
import { daysUsed, markShown, pickNudge, shownThisSession } from '#/lib/nudge'
import type { NudgeKind } from '#/lib/nudge'
import { toast } from '#/lib/store'
import { Icon } from '#/ui/icons'
import { Button, IconButton } from '#/ui/zen'

const typing = () => {
  const el = document.activeElement
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    (el instanceof HTMLElement && el.isContentEditable)
  )
}

const COPY: Record<NudgeKind, string> = {
  task: 'Clearing your browser data will remove your tasks. Save with Google to keep them on every device.',
  days: "You've used Honeylist for a few days. Clearing your browser data would remove it all, so save it with Google.",
}

/**
 * The "You're a guest" card on Home (Icons and destructive board, warning tone).
 * It never appears while the person is typing; once shown it stays until dismissed or they leave.
 */
export function SaveNudge() {
  const { data: me } = useQuery(meQuery)
  const { data: tasks = [] } = useTasks()
  const dismiss = useUpdateMe()
  const [shown, setShown] = useState<NudgeKind | null>(null)
  const [hidden, setHidden] = useState(false)
  const [busy, setBusy] = useState(false)

  const due =
    me && me.googleEnabled && !me.pendingMerge
      ? pickNudge({
          isGuest: me.isGuest,
          taskCount: tasks.length,
          daysUsed: daysUsed(),
          dismissed: me.nudgeState,
          shownThisSession: shownThisSession(),
          today: toISODate(new Date()),
        })
      : null

  useEffect(() => {
    if (!due || shown) return
    // Wait until focus leaves the field (the 2nd task is usually typed into quick add).
    const reveal = () => {
      if (typing()) return false
      markShown(due)
      setShown(due)
      return true
    }
    if (reveal()) return
    const onFocus = () => {
      window.setTimeout(() => {
        if (reveal()) document.removeEventListener('focusout', onFocus)
      }, 0)
    }
    document.addEventListener('focusout', onFocus)
    return () => document.removeEventListener('focusout', onFocus)
  }, [due, shown])

  if (!shown || hidden || !me?.isGuest) return null

  const close = () => {
    setHidden(true)
    dismiss.mutate({ nudgeDismissed: shown })
  }
  const save = async () => {
    setBusy(true)
    try {
      await signInWithGoogle()
    } catch (e) {
      setBusy(false)
      toast({
        tone: 'error',
        icon: 'alert',
        message: e instanceof Error ? e.message : "Couldn't reach Google.",
      })
    }
  }

  return (
    <section
      className="zn-alert zn-alert--warning"
      role="status"
      aria-label="Save your data"
      style={{ alignItems: 'flex-start' }}
    >
      <span className="zn-alert-icon">
        <Icon name="alert" />
      </span>
      <div
        className="zn-alert-body"
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <div>
          <strong className="zn-alert-title">You're a guest</strong>
          {COPY[shown]}
        </div>
        <div style={{ display: 'flex', margin: '6px 0 2px' }}>
          <Button size="sm" loading={busy} onClick={() => void save()}>
            Save with Google
          </Button>
        </div>
      </div>
      <IconButton label="Dismiss" icon="x" onClick={close} />
    </section>
  )
}
