import { useStore } from '@tanstack/react-store'
import { AnimatePresence, motion } from 'motion/react'
import { dismissToast, ui } from '#/lib/store'
import type { ToastBadge } from '#/lib/store'
import { Icon } from '#/ui/icons'
import type { IconName } from '#/ui/icons'
import { LogoMark } from '#/ui/logo'
import { SPRING_SOFT } from '#/lib/motion'
import { CelebrateHost } from './Celebrate'

const BADGE_ICON: Record<Exclude<ToastBadge, 'logo'>, IconName> = {
  check: 'check',
  trash: 'trash',
  alert: 'alert',
  flame: 'flame',
}

function Badge({ badge }: { badge: ToastBadge }) {
  if (badge === 'logo')
    return (
      <span className="toast-badge toast-badge--logo">
        <LogoMark size={30} />
      </span>
    )
  return (
    <span className={`toast-badge toast-badge--${badge}`}>
      <Icon name={BADGE_ICON[badge]} size={badge === 'check' ? 18 : 17} />
    </span>
  )
}

/** Bottom centre on phones, bottom left of the content on larger screens (see design board 3). */
export function Toaster() {
  const toasts = useStore(ui, (s) => s.toasts)
  return (
    <>
      {/* Celebrations sit beside the toasts: the toaster is transformed, so they can't live inside. */}
      <CelebrateHost />
      <div className="zn-toaster" aria-live="polite">
        <AnimatePresence initial={false} mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: 8,
                scale: 0.98,
                transition: { duration: 0.18 },
              }}
              transition={SPRING_SOFT}
              className={`zn-toast zn-toast--${t.tone ?? 'neutral'}${t.badge ? ' zn-toast--rich' : ''}`}
              role={t.tone === 'error' ? 'alert' : 'status'}
            >
              {t.badge ? (
                <Badge badge={t.badge} />
              ) : (
                t.icon && (
                  <span className="zn-toast-icon">
                    <Icon name={t.icon} size={18} />
                  </span>
                )
              )}
              <span className="zn-toast-msg">
                <span className="toast-title">{t.message}</span>
                {t.detail && <span className="toast-detail">{t.detail}</span>}
              </span>
              {t.actionLabel && (
                <button
                  type="button"
                  className="zn-toast-action"
                  onClick={() => {
                    t.onAction?.()
                    dismissToast(t.id)
                  }}
                >
                  {t.actionLabel}
                </button>
              )}
              <button
                type="button"
                className="zn-icon-btn"
                aria-label="Dismiss"
                onClick={() => dismissToast(t.id)}
              >
                <Icon name="x" size={18} />
              </button>
              {t.duration !== 0 && (
                <span
                  className="zn-toast-timer"
                  aria-hidden="true"
                  style={{ animationDuration: `${t.duration ?? 4000}ms` }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}
