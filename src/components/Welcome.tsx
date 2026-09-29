import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { meQuery, qk, useUpdateMe } from '#/lib/api'
import type { Prefs } from '#/lib/api'
import { toast } from '#/lib/store'
import { LogoMark } from '#/ui/logo'
import { Button, Chip, Input } from '#/ui/zen'

const THEMES = [
  ['dark', 'Dark', 'moon'],
  ['light', 'Light', 'sun'],
  ['system', 'Match device', undefined],
] as const

/**
 * First visit only: asks for a name and a theme, then gets out of the way.
 * Full page on phones, a dialog over the app from 768px. Finishing or skipping marks it done on the server.
 */
export function Welcome() {
  const qc = useQueryClient()
  const { data: me } = useQuery(meQuery)
  const save = useUpdateMe()
  const [name, setName] = useState('')
  const [closed, setClosed] = useState(false)
  const open = !!me && !me.onboarded && !closed

  const finish = (withName: boolean) => {
    const displayName = name.trim()
    setClosed(true)
    save.mutate(
      {
        onboarded: true,
        ...(withName && displayName ? { displayName } : {}),
      },
      {
        onError: (e) => {
          setClosed(false)
          toast({
            tone: 'error',
            icon: 'alert',
            message: e.message,
            duration: 0,
          })
        },
      },
    )
  }

  const pickTheme = (theme: Prefs['theme']) => {
    // Preview right away; the server copy follows.
    qc.setQueryData<Prefs>(qk.me, (old) => (old ? { ...old, theme } : old))
    save.mutate({ theme })
  }

  if (!open) return null
  return (
    <WelcomePanel onSkip={() => finish(false)}>
      {(titleId) => (
        <form
          className="welcome-body"
          onSubmit={(e) => {
            e.preventDefault()
            finish(true)
          }}
        >
          <LogoMark size={64} />
          <div className="welcome-intro">
            <h1 id={titleId} className="title" style={{ margin: 0 }}>
              Welcome to Honeylist
            </h1>
            <p className="welcome-text">
              A calm place for your tasks, notes and quick thoughts. Two quick
              things and you're in.
            </p>
          </div>
          <Input
            data-welcome-name
            label="What should we call you?"
            placeholder="Your first name"
            value={name}
            maxLength={40}
            autoComplete="given-name"
            enterKeyHint="go"
            onChange={(e) => setName(e.target.value)}
          />
          <div className="welcome-theme">
            <span className="zn-field-label" id={`${titleId}-theme`}>
              Theme
            </span>
            <div
              role="radiogroup"
              aria-labelledby={`${titleId}-theme`}
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
            >
              {THEMES.map(([v, l, i]) => (
                <Chip
                  key={v}
                  role="radio"
                  aria-checked={me.theme === v}
                  selected={me.theme === v}
                  icon={i}
                  onClick={() => pickTheme(v)}
                >
                  {l}
                </Chip>
              ))}
            </div>
          </div>
          <div className="welcome-actions">
            <Button type="submit" className="welcome-go">
              Let's go
            </Button>
            <Button variant="ghost" onClick={() => finish(false)}>
              Skip for now
            </Button>
          </div>
          <p className="welcome-caption">
            You can change both any time in Profile.
          </p>
        </form>
      )}
    </WelcomePanel>
  )
}

/** The shell: scrim, focus trap, Escape to skip, and focus on the name field only with a fine pointer. */
function WelcomePanel({
  onSkip,
  children,
}: {
  onSkip: () => void
  children: (titleId: string) => ReactNode
}) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const skipRef = useRef(onSkip)
  skipRef.current = onSkip

  useEffect(() => {
    const el = panel.current
    // Touch screens would pop the keyboard up over the welcome, so only desktop gets the focus.
    const input = el?.querySelector<HTMLInputElement>('[data-welcome-name]')
    if (input && window.matchMedia('(pointer: fine)').matches) input.focus()
    else el?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        skipRef.current()
      }
      if (e.key !== 'Tab' || !el) return
      const els = Array.from(
        el.querySelectorAll<HTMLElement>('button,input,[href]'),
      ).filter((x) => !x.hasAttribute('disabled'))
      if (!els.length) return
      const first = els[0]
      const last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = overflow
    }
  }, [])

  return (
    <div className="welcome">
      <div className="zn-scrim welcome-scrim" aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="welcome-panel zn-scroll"
      >
        {children(titleId)}
      </div>
    </div>
  )
}
