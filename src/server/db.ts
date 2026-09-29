import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import pg from 'pg'
import type { PGlite } from '@electric-sql/pglite'
import { DDL, schema } from './schema'

// Production: Postgres (Neon) through node-postgres, which supports the transactions Better Auth uses.
// Local dev and tests: PGlite, an in-process Postgres, loaded only when DATABASE_URL is empty.
export type Db = ReturnType<typeof drizzlePglite<typeof schema>>

let db: Db | null = null
let ready: Promise<void> | null = null
let pool: pg.Pool | null = null
let pglite: PGlite | null = null

function makePool(url: string) {
  const local = /localhost|127\.0\.0\.1/.test(url)
  return new pg.Pool({
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 10_000,
    ssl: local ? false : { rejectUnauthorized: true },
  })
}

export function getDb(): Db {
  if (db) return db
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Database not ready: call ensureSchema() first.')
  pool = makePool(url)
  db = drizzlePg(pool, { schema }) as unknown as Db
  return db
}

async function init(): Promise<void> {
  const url = process.env.DATABASE_URL
  if (url) getDb()
  else if (!db) {
    const { PGlite: Lite } = await import('@electric-sql/pglite')
    pglite = new Lite(process.env.PGLITE_DIR || undefined)
    db = drizzlePglite(pglite, { schema })
  }
  const statements = DDL.split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const s of statements) {
    if (pool) await pool.query(s)
    else await pglite!.query(s)
  }
}

/** Connects and creates tables once per cold start. Every handler awaits this first. */
export function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = init().catch((err: unknown) => {
      ready = null
      throw err
    })
  }
  return ready
}

/** Tests only: a fresh in-memory database. */
export async function resetDbForTests(): Promise<Db> {
  const { PGlite: Lite } = await import('@electric-sql/pglite')
  pglite = new Lite()
  pool = null
  db = drizzlePglite(pglite, { schema })
  ready = null
  await ensureSchema()
  return db
}
