import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useHotkey, useHotkeySequence } from '@tanstack/react-hotkeys'
import { categoriesQuery, meQuery } from '#/lib/api'
import { colorVar } from '#/lib/colors'
import { ensureGuest } from '#/lib/auth-client'
import { setSoundsEnabled } from '#/lib/feedback'
import { openCreate, setScratch, setShortcuts, toast, ui } from '#/lib/store'
import { visitInfo } from '#/lib/visits'
import { Icon } from '#/ui/icons'
import { LogoMark } from '#/ui/logo'
import { Splash } from '#/components/Splash'
import type { IconName } from '#/ui/icons'
import { Button, Modal, Skeleton, Tooltip } from '#/ui/zen'
import { CreateTask } from './CreateTask'
import { Scratchpad } from './Scratchpad'
import { Welcome } from './Welcome'
import { Toaster } from './Toaster'

const NAV: {
  to: '/' | '/tasks' | '/notes' | '/folders' | '/profile'
  label: string
  icon: IconName
}[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/tasks', label: 'Tasks', icon: 'tasks' },
  { to: '/notes', label: 'Notes', icon: 'note' },
  { to: '/folders', label: 'Folders', icon: 'folder' },
]

/** Tablet rail: labels are hidden, so icon-only items get tooltips. */
const RAIL = '(min-width: 768px) and (max-width: 1023.98px)'

function useActive() {
  const path = useRouterState({ select: (s) => s.location.pathname })
  return (to: string) => (to === '/' ? path === '/' : path.startsWith(to))
}

function SideNav({ ready }: { ready: boolean }) {
  const isActive = useActive()
  const { data: cats = [] } = useQuery({ ...categoriesQuery, enabled: ready })
  return (
    <aside
      className="app-side"
      style={{
        position: 'sticky',
        top: 0,
        height: '100dvh',
        flexDirection: 'column',
        background: 'var(--surface)',
        borderRight: '1px solid var(--line)',
      }}
    >
      <nav
        aria-label="Main"
        className="zn-nav zn-nav--auto"
        style={{ height: 'auto', border: 0 }}
      >
        <Link
          to="/"
          className="zn-nav-brand app-brand"
          aria-label="Honeylist home"
          style={{ color: 'var(--ink)', textDecoration: 'none' }}
        >
          <LogoMark size={40} />
          <span className="app-sidebar-extra">Honeylist</span>
        </Link>
        <ul className="zn-nav-list">
          {NAV.map((n) => (
            <li key={n.to}>
              <Link
                to={n.to}
                className={['zn-nav-item', isActive(n.to) && 'is-active']
                  .filter(Boolean)
                  .join(' ')}
                aria-current={isActive(n.to) ? 'page' : undefined}
              >
                <Icon name={n.icon} size={22} />
                <span className="zn-nav-label">{n.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div
        className="app-sidebar-extra"
        style={{
          flexDirection: 'column',
          gap: 2,
          padding: '8px 16px',
          overflowY: 'auto',
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 4px 6px 12px',
          }}
        >
          <span
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)' }}
          >
            Folders
          </span>
          <Link
            to="/folders"
            className="zn-icon-btn"
            aria-label="All folders"
            style={{ width: 32, height: 32, color: 'var(--ink-muted)' }}
          >
            <Icon name="chevronRight" size={18} />
          </Link>
        </div>
        {cats.map((c) => (
          <Link
            key={c.id}
            to="/folders/$id"
            params={{ id: c.id }}
            className="zn-nav-item"
            style={{
              gap: 12,
              minHeight: 40,
              padding: '0 12px',
              fontSize: 14,
              color: 'var(--ink)',
            }}
            activeProps={{ className: 'zn-nav-item is-active' }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                background: colorVar(c.color),
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1 }}>{c.name}</span>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              {c.taskCount - c.doneCount}
            </span>
          </Link>
        ))}
      </div>
      <div
        style={{
          padding: 16,
          borderTop: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <Tooltip label="Scratchpad" shortcut="N" media={RAIL}>
          <button
            type="button"
            aria-label="Scratchpad"
            onClick={() => setScratch(true)}
            className="zn-nav-item"
            style={{
              gap: 12,
              minHeight: 48,
              padding: '0 12px',
              fontSize: 15,
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              justifyContent: 'center',
              font: 'inherit',
            }}
          >
            <Icon name="scratch" size={22} />
            <span
              className="app-sidebar-extra"
              style={{ flex: 1, textAlign: 'left' }}
            >
              Scratchpad
            </span>
            <kbd
              className="app-sidebar-extra"
              style={{
                fontFamily: 'inherit',
                fontSize: 11,
                color: 'var(--ink-muted)',
                border: '1px solid var(--line-strong)',
                borderRadius: 6,
                padding: '1px 6px',
              }}
            >
              N
            </kbd>
          </button>
        </Tooltip>
        <Tooltip label="Profile" media={RAIL}>
          <Link
            to="/profile"
            aria-label="Profile"
            className={['zn-nav-item', isActive('/profile') && 'is-active']
              .filter(Boolean)
              .join(' ')}
            style={{
              gap: 12,
              minHeight: 48,
              padding: '0 12px',
              fontSize: 15,
              justifyContent: 'center',
            }}
          >
            <Icon name="user" size={22} />
            <span className="app-sidebar-extra" style={{ flex: 1 }}>
              Profile
            </span>
          </Link>
        </Tooltip>
      </div>
    </aside>
  )
}

/** Hides while scrolling down, comes back on any scroll up or at the top. */
function useHideOnScroll() {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const dy = y - last
      if (y < 48 || dy < -6) setHidden(false)
      else if (dy > 6) setHidden(true)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return hidden
}

function BottomNav() {
  const isActive = useActive()
  const hidden = useHideOnScroll()
  const items = [NAV[0], NAV[1], null, NAV[2], NAV[3]]
  return (
    <nav
      aria-label="Main"
      className={`zn-nav zn-nav--bar app-bottom${hidden ? ' is-hidden' : ''}`}
    >
      <ul className="zn-nav-list">
        {items.map((n) =>
          n ? (
            <li key={n.to}>
              <Link
                to={n.to}
                className={['zn-nav-item', isActive(n.to) && 'is-active']
                  .filter(Boolean)
                  .join(' ')}
                aria-current={isActive(n.to) ? 'page' : undefined}
              >
                <Icon name={n.icon} size={22} />
                <span className="zn-nav-label">{n.label}</span>
              </Link>
            </li>
          ) : (
            <li key="add">
              <button
                type="button"
                onClick={() => openCreate()}
                className="zn-nav-item"
                aria-label="Add a task"
                style={{
                  border: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  font: 'inherit',
                }}
              >
                <span
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    color: 'var(--on-accent)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon name="plus" size={24} strokeWidth={2.25} />
                </span>
              </button>
            </li>
          ),
        )}
      </ul>
    </nav>
  )
}

const SHORTCUTS = [
  ['Quick add a task', 'Q'],
  ['New task form', 'C'],
  ['Open the scratchpad', 'N'],
  ['Go to Home', 'G then H'],
  ['Go to Tasks', 'G then T'],
  ['Go to Notes', 'G then N'],
  ['Show shortcuts', '?'],
  ['Close anything', 'Esc'],
]

function Shortcuts() {
  const open = useStore(ui, (s) => s.shortcutsOpen)
  return (
    <Modal
      open={open}
      onClose={() => setShortcuts(false)}
      title="Keyboard shortcuts"
    >
      {SHORTCUTS.map(([label, key]) => (
        <div
          key={key}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 14,
            minHeight: 32,
          }}
        >
          <span>{label}</span>
          <kbd
            style={{
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 600,
              padding: '2px 10px',
              border: '1px solid var(--line-strong)',
              borderBottomWidth: 2,
              borderRadius: 8,
            }}
          >
            {key}
          </kbd>
        </div>
      ))}
    </Modal>
  )
}

function useTheme(ready: boolean) {
  const { data } = useQuery({ ...meQuery, staleTime: 60_000, enabled: ready })
  useEffect(() => {
    if (!data) return
    setSoundsEnabled(data.sounds)
    const apply = () => {
      const theme =
        data.theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: light)').matches
            ? 'light'
            : 'dark'
          : data.theme
      document.documentElement.dataset.theme = theme
      try {
        localStorage.setItem('honeylist-theme', data.theme)
      } catch {
        // Private mode: the server copy still holds the choice.
      }
    }
    apply()
    if (data.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [data])
}

const TIP_KEY = 'honeylist-tip-shortcuts'
const TIP_ACTIVE_MS = 90_000

function tipSeen() {
  try {
    return localStorage.getItem(TIP_KEY) === '1'
  } catch {
    return true
  }
}
function markTipSeen() {
  try {
    localStorage.setItem(TIP_KEY, '1')
  } catch {
    // Without storage the tip simply never shows.
  }
}
const typing = () => {
  const el = document.activeElement
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    (el instanceof HTMLElement && el.isContentEditable)
  )
}

/**
 * Desktop only, once per browser: after about 90 seconds of active use (or on the 3rd visit),
 * one toast points to the shortcuts sheet. It waits while the person is typing or a dialog is open.
 */
function useShortcutTip(enabled: boolean) {
  const sheetOpen = useStore(ui, (s) => s.shortcutsOpen)
  useEffect(() => {
    // Opening the sheet any other way means they found it already.
    if (sheetOpen) markTipSeen()
  }, [sheetOpen])
  useEffect(() => {
    if (!enabled || tipSeen()) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const due = visitInfo().count >= 3 ? 10_000 : TIP_ACTIVE_MS
    let active = 0
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      active += 1000
      if (active < due || tipSeen()) return
      const s = ui.state
      const busy =
        typing() ||
        s.createOpen ||
        s.scratchOpen ||
        s.shortcutsOpen ||
        document.querySelector('[aria-modal="true"]')
      if (busy) return
      window.clearInterval(id)
      markTipSeen()
      toast({
        message: 'Tip: press ? to see all keyboard shortcuts',
        actionLabel: 'Show',
        onAction: () => setShortcuts(true),
        duration: 8000,
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [enabled])
}

export function AppShell({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const navigate = useNavigate()
  useEffect(() => {
    ensureGuest()
      .then(() => {
        visitInfo() // records this visit for the greeting and the shortcuts tip
        setReady(true)
      })
      .catch(() => setFailed(true))
  }, [])

  useTheme(ready)
  const { data: me } = useQuery({
    ...meQuery,
    staleTime: 60_000,
    enabled: ready,
  })
  useShortcutTip(ready && !!me?.onboarded)
  const focusQuickAdd = () => {
    const el = document.getElementById('quick-add')
    if (el) el.focus()
    else openCreate()
  }
  useHotkey('Q', focusQuickAdd)
  useHotkey('C', () => openCreate())
  // "G N" goes to notes, so a bare N right after G must not open the scratchpad.
  const lastG = useRef(0)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'g') lastG.current = Date.now()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  useHotkey('N', () => {
    if (Date.now() - lastG.current < 1000) return
    setScratch(true)
  })
  useHotkey('Shift+/', () => setShortcuts(true))
  useHotkeySequence(['G', 'H'], () => void navigate({ to: '/' }))
  useHotkeySequence(['G', 'T'], () => void navigate({ to: '/tasks' }))
  useHotkeySequence(['G', 'N'], () => void navigate({ to: '/notes' }))

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Splash ready={ready} failed={failed} />
      <SideNav ready={ready} />
      <main id="main" className="app-main" tabIndex={-1}>
        <div className="app-content">
          {failed ? (
            <div
              style={{
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <h1 className="title" style={{ margin: 0 }}>
                We couldn't start your session
              </h1>
              <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
                Check your connection, then try again.
              </p>
              <Button icon="refresh" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </div>
          ) : ready ? (
            children
          ) : (
            <div
              aria-busy="true"
              aria-label="Loading"
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <Skeleton width={180} height={14} />
              <Skeleton width={320} height={32} radius={10} />
              <Skeleton height={56} radius={9999} />
              <Skeleton height={188} radius={28} />
              <Skeleton height={188} radius={28} />
            </div>
          )}
        </div>
      </main>
      <BottomNav />
      <Toaster />
      {ready && (
        <>
          <CreateTask />
          <Scratchpad />
          <Shortcuts />
          <Welcome />
        </>
      )}
    </div>
  )
}
