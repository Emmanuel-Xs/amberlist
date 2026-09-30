import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, meQuery, useNotes, useTasks, useUpdateMe } from '#/lib/api'
import type { PrefsUpdate } from '#/lib/api'
import { setSoundsEnabled, sound } from '#/lib/feedback'
import { setShortcuts, toast } from '#/lib/store'
import { Button, Chip, ConfirmDialog, Input, Switch } from '#/ui/zen'
import { LogoMark } from '#/ui/logo'
import { SampleDataButton } from '#/components/SampleData'
import { NotifySettings } from '#/components/NotifySettings'
import { AccountStatus, Avatar, SaveDataCard } from '#/components/Account'
import { ensureGuest } from '#/lib/auth-client'
import { holdWelcome } from '#/lib/welcomeHold'

export const Route = createFileRoute('/profile')({
  component: Profile,
  head: () => ({
    meta: [
      { title: 'Profile · Honeylist' },
      {
        name: 'description',
        content: 'Your name, theme, sounds, Google sign in and your data.',
      },
      { property: 'og:title', content: 'Profile · Honeylist' },
    ],
  }),
})

function Profile() {
  const qc = useQueryClient()
  const { data: me } = useQuery(meQuery)
  const { data: tasks = [] } = useTasks()
  const { data: notes = [] } = useNotes()
  const [name, setName] = useState('')
  const [confirm, setConfirm] = useState(false)
  useEffect(() => setName(me?.displayName ?? ''), [me?.displayName])

  const updateMe = useUpdateMe()
  const update = {
    mutate: (p: PrefsUpdate, opts?: { onSuccess?: () => void }) =>
      updateMe.mutate(p, {
        onSuccess: opts?.onSuccess,
        onError: (e) =>
          toast({
            tone: 'error',
            icon: 'alert',
            message: e.message,
            duration: 0,
          }),
      }),
  }
  const wipe = useMutation({
    mutationFn: () =>
      api<{ ok: true; reset: boolean }>('/me/data', { method: 'DELETE' }),
    onSuccess: async ({ reset }) => {
      // Guests start over with a new guest session; a Google account is kept.
      if (reset) {
        holdWelcome()
        await ensureGuest()
        qc.clear()
      }
      void qc.invalidateQueries()
      setConfirm(false)
      toast({ icon: 'trash', message: 'All your data was deleted' })
    },
  })

  const exportJson = async () => {
    const data = await api<unknown>('/me/data')
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = `honeylist-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const thisMonth = new Date().toISOString().slice(0, 7)
  const doneThisMonth = tasks.filter(
    (t) => t.completedAt?.slice(0, 7) === thisMonth,
  ).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 className="display" style={{ margin: 0 }}>
        Profile
      </h1>
      <div className="profile-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section
            aria-label="Your profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 20,
              borderRadius: 28,
              background: 'var(--surface)',
            }}
          >
            <Avatar me={me} />
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  update.mutate(
                    { displayName: name.trim() || null },
                    {
                      onSuccess: () =>
                        toast({
                          tone: 'success',
                          icon: 'check',
                          message: 'Name saved',
                        }),
                    },
                  )
                }}
                style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}
              >
                <Input
                  label="What should we call you?"
                  value={name}
                  maxLength={40}
                  placeholder="Your name"
                  onChange={(e) => setName(e.target.value)}
                  className="grow"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  disabled={name === (me?.displayName ?? '')}
                >
                  Save
                </Button>
              </form>
              <AccountStatus me={me} />
            </div>
          </section>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            {[
              [String(doneThisMonth), 'Tasks done this month'],
              [
                String(tasks.filter((t) => t.status !== 'done').length),
                'Open tasks',
              ],
              [String(notes.length), 'Notes'],
            ].map(([n, l]) => (
              <div
                key={l}
                style={{
                  padding: 16,
                  borderRadius: 20,
                  background: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <span
                  style={{ fontSize: 24, lineHeight: '30px', fontWeight: 600 }}
                >
                  {n}
                </span>
                <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  {l}
                </span>
              </div>
            ))}
          </div>
          <SaveDataCard me={me} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section
            aria-labelledby="set-h"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 20,
              borderRadius: 28,
              background: 'var(--surface)',
            }}
          >
            <h2 id="set-h" className="heading" style={{ margin: '0 0 4px' }}>
              Settings
            </h2>
            <span className="zn-field-label">Theme</span>
            <div
              role="radiogroup"
              aria-label="Theme"
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 8,
              }}
            >
              {(
                [
                  ['dark', 'Dark', 'moon'],
                  ['light', 'Light', 'sun'],
                  ['system', 'Match device', undefined],
                ] as const
              ).map(([v, l, i]) => (
                <Chip
                  key={v}
                  role="radio"
                  aria-checked={me?.theme === v}
                  selected={me?.theme === v}
                  icon={i}
                  onClick={() => update.mutate({ theme: v })}
                >
                  {l}
                </Chip>
              ))}
            </div>
            <Switch
              label="Sounds"
              icon="bell"
              checked={me?.sounds ?? true}
              onChange={(v) => {
                setSoundsEnabled(v)
                if (v) sound('complete')
                update.mutate({ sounds: v })
              }}
            />
            <NotifySettings />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShortcuts(true)}
              className="from-tablet"
              style={{ alignSelf: 'flex-start' }}
            >
              Keyboard shortcuts (?)
            </Button>
          </section>
          <section
            aria-labelledby="data-h"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 20,
              borderRadius: 28,
              background: 'var(--surface)',
            }}
          >
            <h2 id="data-h" className="heading" style={{ margin: 0 }}>
              Your data
            </h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <SampleDataButton size="sm" variant="outline" />
              <Button
                variant="outline"
                size="sm"
                icon="download"
                onClick={() => void exportJson()}
              >
                Export as JSON
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon="trash"
                onClick={() => setConfirm(true)}
              >
                Delete all my data
              </Button>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                lineHeight: '18px',
                color: 'var(--ink-muted)',
              }}
            >
              Deleting removes every task, note and folder. It can't be undone.
              {me && !me.isGuest && ' Your Google account stays signed in.'}
            </p>
          </section>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'var(--ink-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <LogoMark size={28} />
            Honeylist 0.1 · Built with AI for HNG 15
          </p>
          <p style={{ textAlign: 'center', fontSize: 13, margin: 0 }}>
            <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link>
          </p>
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => wipe.mutate()}
        title="Delete all your data?"
        text={
          me && !me.isGuest
            ? 'Every task, note and folder will be removed for good. Your Google account stays. This cannot be undone.'
            : 'Every task, note and folder will be removed for good and this browser starts as a new guest. This cannot be undone.'
        }
        confirmLabel="Delete everything"
        confirmText="DELETE"
      />
    </div>
  )
}
