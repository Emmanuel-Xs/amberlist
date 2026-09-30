import { useEffect, useSyncExternalStore } from 'react'
import { openCreate } from './store'

/** Registers /sw.js in production builds only, after the page has loaded. */
export function useServiceWorker() {
  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    const register = () =>
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    if (document.readyState === 'complete') register()
    else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])
}

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}
/** False only when the browser says it is offline. Always true on the server. */
export const useOnline = () =>
  useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )

/** The "Add task" app shortcut opens `/?new=task`: open the create sheet, then tidy the URL. */
export function useNewTaskShortcut() {
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('new') !== 'task') return
    openCreate()
    url.searchParams.delete('new')
    window.history.replaceState(window.history.state, '', url)
  }, [])
}

/**
 * The theme-color metas follow the system scheme, but the app theme can differ (saved in
 * localStorage). Keep the status bar in step with the theme actually on screen.
 */
export function useThemeColorSync() {
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      // --bg of the theme on screen (src/tokens.css), so the bar colour never drifts from the page.
      const color = getComputedStyle(root).getPropertyValue('--bg').trim()
      if (!color) return
      document
        .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
        .forEach((m) => (m.content = color))
    }
    apply()
    const obs = new MutationObserver(apply)
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
}
