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

/** Sends the browser to Google; it comes back to the page it left. Guest data carries over. */
export async function signInWithGoogle(): Promise<void> {
  const { pathname, search } = window.location
  const { error } = await authClient.signIn.social({
    provider: 'google',
    callbackURL: pathname + search,
  })
  if (error) throw new Error(error.message ?? "Couldn't reach Google.")
}

/** Signs out of the Google account and starts a fresh guest session on this browser. */
export async function signOutToGuest(): Promise<void> {
  await authClient.signOut()
  await ensureGuest()
}
