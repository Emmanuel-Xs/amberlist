import { createAuthClient } from 'better-auth/react'
import { anonymousClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({ plugins: [anonymousClient()] })

let pending: Promise<void> | null = null

/** Every visitor gets a guest account on first load; no sign up needed. */
export function ensureGuest(): Promise<void> {
  pending ??= (async () => {
    const { data } = await authClient.getSession()
    if (!data?.user) await authClient.signIn.anonymous()
  })().finally(() => {
    pending = null
  })
  return pending
}
