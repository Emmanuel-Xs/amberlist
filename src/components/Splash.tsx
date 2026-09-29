import { useEffect, useState } from 'react'
import { LogoMark } from '#/ui/logo'

/**
 * Loading screen shown from the first server-rendered byte until the guest session is ready.
 * It always lets the current drop finish falling before it fades out, so it never flashes or cuts off. Nothing here is a spinner:
 * the honey drop forms and falls, and stops for people who prefer reduced motion.
 */
export function Splash({ ready, failed }: { ready: boolean; failed: boolean }) {
  // True once the honey drop has finished a full fall, so the loop is never cut mid-drop.
  const [cycleDone, setCycleDone] = useState(false)
  const [gone, setGone] = useState(false)
  const leaving = failed || (ready && cycleDone)

  useEffect(() => {
    // No animation events without motion (reduced motion), and a safety net if one is missed.
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => setCycleDone(true), still ? 900 : 6000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!leaving) return
    const t = setTimeout(() => setGone(true), 450)
    return () => clearTimeout(t)
  }, [leaving])

  if (gone) return null
  return (
    <div
      className={leaving ? 'splash is-leaving' : 'splash'}
      role="status"
      aria-label="Loading Honeylist"
      onAnimationIteration={(e) => {
        if (e.animationName === 'honey-drop') setCycleDone(true)
      }}
    >
      <div className="splash-inner">
        <LogoMark size={112} animated />
        <span className="splash-name">Honeylist</span>
      </div>
    </div>
  )
}
