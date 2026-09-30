import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Prefs } from '#/lib/api'
import { signInWithGoogle, signOutToGuest } from '#/lib/auth-client'
import { toast } from '#/lib/store'
import { Alert, Button, Illustration } from '#/ui/zen'

const pill = {
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 10px',
  borderRadius: 9999,
  background: 'var(--surface-raised)',
  color: 'var(--ink-muted)',
  marginRight: 8,
} as const

/** Profile avatar: the Google photo when signed in, else the name's initial. */
export function Avatar({ me }: { me: Prefs | undefined }) {
  const initial = (me?.displayName || me?.accountName || 'G')[0].toUpperCase()
  return (
    <span
      aria-hidden="true"
      style={{
        width: 72,
        height: 72,
        flexShrink: 0,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'var(--accent-soft)',
        color: 'var(--accent-ink)',
        display: 'grid',
        placeItems: 'center',
        fontSize: 28,
        fontWeight: 600,
      }}
    >
      {me?.image ? (
        <img
          src={me.image}
          alt=""
          width={72}
          height={72}
          referrerPolicy="no-referrer"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initial
      )}
    </span>
  )
}

/** The line under the name: Guest pill for guests, the Google email and Sign out once signed in. */
export function AccountStatus({ me }: { me: Prefs | undefined }) {
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  if (!me || me.isGuest)
    return (
      <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
        <span style={pill}>Guest</span>
        Everything is saved in this browser only.
      </span>
    )
  const signOut = async () => {
    setBusy(true)
    try {
      await signOutToGuest()
      qc.clear()
      await qc.invalidateQueries()
      toast({
        icon: 'logout',
        message: "Signed out. You're a guest on this device now.",
      })
    } catch {
      toast({
        tone: 'error',
        icon: 'alert',
        message: "Couldn't sign out. Try again.",
      })
    } finally {
      setBusy(false)
    }
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        fontSize: 13,
        color: 'var(--ink-muted)',
      }}
    >
      <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
        <span style={pill}>Google</span>
        {me.email}
      </span>
      <Button
        variant="ghost"
        size="sm"
        icon="logout"
        loading={busy}
        onClick={() => void signOut()}
      >
        Sign out
      </Button>
    </div>
  )
}

/** "Save your data" card (Profile board). Signed in: a calm success note. No Google keys: a note only. */
export function SaveDataCard({ me }: { me: Prefs | undefined }) {
  const [busy, setBusy] = useState(false)
  if (me && !me.isGuest)
    return (
      <Alert tone="success">Your data is saved to your Google account.</Alert>
    )
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
      aria-labelledby="save-h"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 20,
        borderRadius: 28,
        background: 'var(--accent-soft)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Illustration name="folder" width={80} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 id="save-h" className="heading" style={{ margin: 0 }}>
            Save your data
          </h2>
          <p style={{ margin: 0, fontSize: 13, lineHeight: '19px' }}>
            {me?.googleEnabled
              ? 'Sign in with Google to keep your tasks, notes and habits on every device. Nothing here is lost.'
              : 'Everything lives in this browser for now. Clearing your browser data removes it, so export a copy now and then.'}
          </p>
        </div>
      </div>
      {me?.googleEnabled && (
        <Button block loading={busy} onClick={() => void save()}>
          Continue with Google
        </Button>
      )}
    </section>
  )
}
