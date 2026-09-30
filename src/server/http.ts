import { ZodError } from 'zod'
import type { ZodType } from 'zod'
import { ensureSchema, getDb } from './db'
import type { Db } from './db'
import { getAuth } from './auth'
import { NotFoundError } from './services'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

type UserResolver = (request: Request) => Promise<string | null>

const sessionResolver: UserResolver = async (request) => {
  const session = await getAuth().api.getSession({ headers: request.headers })
  return session?.user.id ?? null
}

let resolveUser: UserResolver = sessionResolver

/** Tests swap the session lookup for a header-based one. */
export function setUserResolver(fn: UserResolver | null) {
  resolveUser = fn ?? sessionResolver
}

// Simple per-user write limit: 120 writes a minute per instance.
const writes = new Map<string, { n: number; reset: number }>()
/** Tests only: the suite makes more writes a minute than a person would. */
export function resetRateLimits() {
  writes.clear()
}
function rateLimit(userId: string) {
  const t = Date.now()
  const w = writes.get(userId)
  if (!w || w.reset < t) {
    writes.set(userId, { n: 1, reset: t + 60_000 })
    return
  }
  w.n += 1
  if (w.n > 120)
    throw new HttpError(429, 'Too many changes. Try again in a minute.')
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

export async function readBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    throw new HttpError(400, 'Body must be JSON.')
  }
  return schema.parse(raw)
}

export interface Ctx {
  db: Db
  userId: string
  request: Request
  params: Record<string, string>
}

/** Wraps every API handler: schema ready, session required, errors mapped to status codes. */
export function route(fn: (ctx: Ctx) => Promise<Response>) {
  return async ({
    request,
    params,
  }: {
    request: Request
    params?: Record<string, string>
  }) => {
    try {
      await ensureSchema()
      const userId = await resolveUser(request)
      if (!userId) return json({ error: 'Sign in required.' }, 401)
      if (request.method !== 'GET') rateLimit(userId)
      return await fn({ db: getDb(), userId, request, params: params ?? {} })
    } catch (err) {
      if (err instanceof ZodError)
        return json(
          {
            error: 'Invalid input.',
            issues: err.issues.map((i) => ({
              path: i.path.join('.'),
              message: i.message,
            })),
          },
          400,
        )
      if (err instanceof NotFoundError)
        return json({ error: 'Not found.' }, 404)
      if (err instanceof HttpError)
        return json({ error: err.message }, err.status)
      console.error(err)
      return json({ error: 'Something went wrong.' }, 500)
    }
  }
}
