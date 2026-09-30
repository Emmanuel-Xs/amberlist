import { useSyncExternalStore } from 'react'

/** Tracks a CSS media query. Always false on the server. */
export function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Phones get bottom sheets; tablet and up get popovers. */
export const usePhone = () => useMedia('(max-width: 767.98px)')
