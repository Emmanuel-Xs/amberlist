import {
  useNewTaskShortcut,
  useServiceWorker,
  useThemeColorSync,
} from '#/lib/pwa'
import { OfflineBanner } from './OfflineBanner'

/** Install and offline support: service worker, app shortcut, status bar colour, offline banner. */
export function PwaSupport() {
  useServiceWorker()
  useNewTaskShortcut()
  useThemeColorSync()
  return (
    <>
      {/* Drag area under the window controls when installed on desktop with the title bar hidden. */}
      <div className="pwa-titlebar" aria-hidden="true" />
      <OfflineBanner />
    </>
  )
}
