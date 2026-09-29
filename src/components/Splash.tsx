import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion/react'
import { LogoMark } from '#/ui/logo'

/** The visible logo that the splash logo should land on: sidebar/rail brand, or the phone Home header. */
function findTarget(): HTMLElement | null {
  const els = document.querySelectorAll<HTMLElement>(
    '.app-brand .logo-mark, .phone-header .logo-mark',
  )
  for (const el of els) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return el
  }
  return null
}

/**
 * Loading screen shown from the first server-rendered byte until the guest session is ready.
 * The honey drop forms and falls on a loop; we always let the current fall finish. When ready,
 * the logo flies to where it lives in the app (sidebar or phone header) while the page rises in
 * behind it (design board 11). Reduced motion: a plain fade.
 */
export function Splash({ ready, failed }: { ready: boolean; failed: boolean }) {
  const [cycleDone, setCycleDone] = useState(false)
  const [gone, setGone] = useState(false)
  const leaving = failed || (ready && cycleDone)
  const root = useRef<HTMLDivElement>(null)
  const mark = useRef<HTMLDivElement>(null)
  const name = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => setCycleDone(true), still ? 900 : 6000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!leaving || !root.current) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const target = failed || still ? null : findTarget()
    const main = document.querySelector<HTMLElement>('.app-main')
    main?.classList.add('app-enter')
    if (!target || !mark.current) {
      const a = animate(root.current, { opacity: 0 }, { duration: 0.35 })
      void a.then(() => setGone(true))
      return () => a.stop()
    }
    const from = mark.current.getBoundingClientRect()
    const to = target.getBoundingClientRect()
    const scale = to.width / from.width
    const dx = to.left + to.width / 2 - (from.left + from.width / 2)
    const dy = to.top + to.height / 2 - (from.top + from.height / 2)
    target.style.opacity = '0'
    root.current.classList.add('is-flying')
    const anims = [
      animate(name.current, { opacity: 0, y: 6 }, { duration: 0.18 }),
      animate(
        root.current,
        { backgroundColor: 'rgba(0,0,0,0)' },
        { duration: 0.35, delay: 0.1 },
      ),
      animate(
        mark.current,
        { x: dx, y: dy, scale },
        { type: 'spring', visualDuration: 0.55, bounce: 0.12 },
      ),
    ]
    void anims[2].then(() => {
      target.style.opacity = ''
      setGone(true)
    })
    return () => {
      anims.forEach((a) => a.stop())
      target.style.opacity = ''
    }
  }, [leaving, failed])

  if (gone) return null
  return (
    <div
      ref={root}
      className="splash"
      role="status"
      aria-label="Loading Honeylist"
      onAnimationIteration={(e) => {
        if (e.animationName === 'honey-drop') setCycleDone(true)
      }}
    >
      <div className="splash-inner">
        <div ref={mark} style={{ transformOrigin: 'center' }}>
          <LogoMark size={112} animated={!leaving} />
        </div>
        <span ref={name} className="splash-name">
          Honeylist
        </span>
      </div>
    </div>
  )
}
