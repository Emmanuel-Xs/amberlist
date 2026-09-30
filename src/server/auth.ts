import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { anonymous } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { getDb } from './db'
import { schema } from './schema'
import { linkGuestAccount } from './services'

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined

let instance: ReturnType<typeof createAuth> | null = null

// Call ensureSchema() before getAuth(): the database connects there.

function createAuth() {
  return betterAuth({
    secret:
      process.env.BETTER_AUTH_SECRET ||
      'dev-only-secret-change-me-in-production-please',
    baseURL:
      process.env.BETTER_AUTH_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL &&
        `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`),
    // Every hostname this deployment answers on. TRUSTED_ORIGINS adds more (comma separated).
    trustedOrigins: [
      process.env.VERCEL_URL,
      process.env.VERCEL_BRANCH_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ]
      .filter((h): h is string => !!h)
      .map((h) => `https://${h}`)
      .concat(
        (process.env.TRUSTED_ORIGINS ?? '')
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean),
      ),
    database: drizzleAdapter(getDb(), { provider: 'pg', schema }),
    socialProviders: google,
    session: { expiresIn: 60 * 60 * 24 * 365, updateAge: 60 * 60 * 24 },
    rateLimit: { enabled: true, window: 60, max: 60 },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production',
      ipAddress: { ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'] },
    },
    plugins: [
      anonymous({
        // Signing in with Google from a guest session keeps the guest's data. If the Google
        // account already has data, the account waits for the merge prompt instead.
        // The plugin then deletes the guest user row; app rows have no foreign key to it.
        onLinkAccount: async ({ anonymousUser, newUser }) => {
          await linkGuestAccount(getDb(), anonymousUser.user.id, newUser.user.id)
        },
      }),
      tanstackStartCookies(),
    ],
  })
}

export function getAuth() {
  if (!instance) instance = createAuth()
  return instance
}
