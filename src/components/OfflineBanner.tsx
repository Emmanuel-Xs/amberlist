import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useOnline } from '#/lib/pwa'
import { Button, Illustration } from '#/ui/zen'

/** In-page banner while the browser is offline (design: "offline" illustration, sky cloud with a slash). */
export function OfflineBanner() {
  const online = useOnline()
  const qc = useQueryClient()
  const [checking, setChecking] = useState(false)
  if (online) return null

  const retry = async () => {
    setChecking(true)
    try {
      await qc.refetchQueries({ type: 'active' })
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <Illustration name="offline" width={72} />
      <div className="offline-banner-text">
        <strong>You're offline.</strong>
        <span>
          You can still read what's on screen. Changes need a connection, so
          they won't save until you're back online.
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        icon="refresh"
        loading={checking}
        onClick={() => void retry()}
      >
        Retry now
      </Button>
    </div>
  )
}
