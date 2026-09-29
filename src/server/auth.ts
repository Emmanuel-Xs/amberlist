import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { anonymous } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { getDb } from './db'
import { schema } from './schema'

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
    trustedOrigins: process.env.VERCEL_URL
      ? [`https://${process.env.VERCEL_URL}`]
      : [],
    database: drizzleAdapter(getDb(), { provider: 'pg', schema }),
    socialProviders: google,
    session: { expiresIn: 60 * 60 * 24 * 365, updateAge: 60 * 60 * 24 },
    rateLimit: { enabled: true, window: 60, max: 60 },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production',
      ipAddress: { ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'] },
    },
    plugins: [anonymous(), tanstackStartCookies()],
  })
}

export function getAuth() {
  if (!instance) instance = createAuth()
  return instance
}
