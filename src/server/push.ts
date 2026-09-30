import { and, eq, inArray, lte, sql } from 'drizzle-orm'
import webpush from 'web-push'
import type { Db } from './db'
import { pushSubscription, task } from './schema'
import { DEFAULT_START_TIME, reminderBody } from '../lib/reminders'

export interface PushPayload {
  title: string
  body: string
  /** One notification per task: a repeat or a snooze replaces the last one. */
  tag: string
  taskId?: string
  url: string
}

interface Target {
  endpoint: string
  p256dh: string
  auth: string
}

/** Resolves false when the push service says the subscription is gone (404 or 410). */
type Sender = (target: Target, payload: PushPayload) => Promise<boolean>

export const pushConfigured = () =>
  !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)

export const vapidPublicKey = () => process.env.VAPID_PUBLIC_KEY ?? null

const realSender: Sender = async (target, payload) => {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:hello@honeylist.app',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
  try {
    await webpush.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
      },
      JSON.stringify(payload),
      { TTL: 3600 },
    )
    return true
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 404 || status === 410) return false
    console.error('push failed', status)
    return true
  }
}

let sender: Sender = realSender

/** Tests swap the push service for a recorder. */
export function setPushSender(fn: Sender | null) {
  sender = fn ?? realSender
}

async function sendToUser(db: Db, userId: string, payload: PushPayload) {
  const subs = await db
    .select()
    .from(pushSubscription)
    .where(eq(pushSubscription.userId, userId))
  const gone: string[] = []
  await Promise.all(
    subs.map(async (s) => {
      if (!(await sender(s, payload))) gone.push(s.id)
    }),
  )
  if (gone.length)
    await db.delete(pushSubscription).where(inArray(pushSubscription.id, gone))
  return subs.length - gone.length
}

/** Profile "Send a test": how many browsers it reached. */
export function sendTestPush(db: Db, userId: string) {
  return sendToUser(db, userId, {
    title: 'Honeylist',
    body: 'Reminders are on. This is what they look like.',
    tag: 'honeylist-test',
    url: '/profile',
  })
}

/**
 * Sends every reminder that is due. Rows are claimed with one UPDATE ... RETURNING that clears
 * remind_at, so two overlapping runs never send the same one. Only people with a subscribed
 * browser are claimed; everyone else keeps remind_at for the in-app banner.
 */
export async function sendDueReminders(db: Db, at = new Date()) {
  const claimed = await db
    .update(task)
    .set({ remindAt: null })
    .where(
      and(
        lte(task.remindAt, at),
        sql`${task.status} <> 'done'`,
        sql`exists (select 1 from ${pushSubscription} where ${pushSubscription.userId} = ${task.userId})`,
      ),
    )
    .returning({
      id: task.id,
      userId: task.userId,
      title: task.title,
      startTime: task.startTime,
      offset: task.remindOffset,
    })
  let sent = 0
  for (const t of claimed) {
    const offset = t.offset ?? 0
    const payload: PushPayload = {
      title: t.title,
      body: reminderBody(offset, t.startTime ?? DEFAULT_START_TIME),
      tag: t.id,
      taskId: t.id,
      url: `/tasks/${t.id}`,
    }
    if (await sendToUser(db, t.userId, payload)) sent += 1
  }
  return { claimed: claimed.length, sent }
}
