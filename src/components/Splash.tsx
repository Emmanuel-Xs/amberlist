import { useEffect, useState } from 'react'
import { LogoMark } from '#/ui/logo'

/**
 * Loading screen shown from the first server-rendered byte until the guest session is ready.
 * It stays for a moment so it never flashes, then fades out. Nothing here is a spinner:
 * the honey drop forms and falls, and stops for people who prefer reduced motion.
 */
export function Splash({ ready, failed }: { ready: boolean; failed: boolean }) {
  const [minDone, setMinDone] = useState(false)
  const [gone, setGone] = useState(false)
  const leaving = failed || (ready && minDone)

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), 900)
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
    >
      <div className="splash-inner">
        <LogoMark size={112} animated />
        <span className="splash-name">Honeylist</span>
      </div>
    </div>
  )
}
