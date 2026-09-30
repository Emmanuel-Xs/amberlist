import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { Db } from './db'
import { addDays, daysBetween } from '../lib/dates'
import { nextOccurrence } from '../lib/repeat'
import type { RepeatRule } from '../lib/repeat'
import { remindAtFor, utcToZoned } from '../lib/reminders'
import {
  category,
  habit,
  habitCheckin,
  note,
  prefs,
  pushSubscription,
  subtask,
  task,
  user,
} from './schema'
import type {
  categoryCreate,
  categoryUpdate,
  habitCreate,
  habitUpdate,
  noteCreate,
  noteUpdate,
  prefsUpdate,
  taskCreate,
  taskFilters,
  taskUpdate,
} from './validation'

export class NotFoundError extends Error {}

/** Today's date where the user is (their time zone), not the server's. */
const todayIn = (tz: string) => utcToZoned(new Date(), tz).date
const id = () => crypto.randomUUID()
const now = () => new Date()

export type TaskRow = typeof task.$inferSelect
export type SubtaskRow = typeof subtask.$inferSelect
export type NoteRow = typeof note.$inferSelect
export type CategoryRow = typeof category.$inferSelect
export type TaskWithParts = TaskRow & {
  subtasks: SubtaskRow[]
  noteCount: number
}

// ---------- Prefs and seeding ----------
export async function getPrefs(db: Db, userId: string) {
  const [row] = await db.select().from(prefs).where(eq(prefs.userId, userId))
  if (row) return row
  const [created] = await db
    .insert(prefs)
    .values({ userId })
    .onConflictDoNothing()
    .returning()
  return (
    created ??
    (await db.select().from(prefs).where(eq(prefs.userId, userId)))[0]
  )
}

export async function updatePrefs(
  db: Db,
  userId: string,
  input: z.infer<typeof prefsUpdate>,
) {
  const current = await getPrefs(db, userId)
  const { onboarded, nudgeDismissed, ...rest } = input
  const [row] = await db
    .update(prefs)
    .set({
      ...rest,
      ...(onboarded && !current.onboardedAt ? { onboardedAt: now() } : {}),
      ...(nudgeDismissed
        ? {
            nudgeState: {
              ...current.nudgeState,
              [nudgeDismissed]: now().toISOString(),
            },
          }
        : {}),
      updatedAt: now(),
    })
    .where(eq(prefs.userId, userId))
    .returning()
  return row
}

/**
 * What GET /api/me returns: the prefs plus whether the welcome screen is done and when the
 * account was made. Guests from before the welcome screen (any task, note or name) count as done.
 */
export async function getMe(db: Db, userId: string) {
  const p = await getPrefs(db, userId)
  return withMe(db, userId, p)
}

export async function updateMe(
  db: Db,
  userId: string,
  input: z.infer<typeof prefsUpdate>,
) {
  return withMe(db, userId, await updatePrefs(db, userId, input))
}

async function withMe(db: Db, userId: string, p: typeof prefs.$inferSelect) {
  const [account] = await db
    .select({
      createdAt: user.createdAt,
      isAnonymous: user.isAnonymous,
      email: user.email,
      image: user.image,
      name: user.name,
    })
    .from(user)
    .where(eq(user.id, userId))
  // No user row (tests) or an anonymous one: a guest.
  const isGuest = !account || account.isAnonymous !== false
  let onboarded = !!p.onboardedAt || !!p.displayName
  if (!onboarded) {
    const [[t], [n]] = await Promise.all([
      db
        .select({ id: task.id })
        .from(task)
        .where(eq(task.userId, userId))
        .limit(1),
      db
        .select({ id: note.id })
        .from(note)
        .where(and(eq(note.userId, userId), eq(note.isScratchpad, false)))
        .limit(1),
    ])
    onboarded = !!t || !!n
  }
  return {
    ...p,
    onboarded,
    joinedAt: account?.createdAt ?? null,
    isGuest,
    isAnonymous: isGuest,
    email: isGuest ? null : (account?.email ?? null),
    image: isGuest ? null : (account?.image ?? null),
    accountName: isGuest ? null : (account?.name ?? null),
    googleEnabled: googleEnabled(),
    sampleLoaded: !!p.sampleIds,
    pendingMerge: await pendingMergeCounts(db, p.pendingMerge),
  }
}

async function seedDefaults(db: Db, userId: string) {
  const p = await getPrefs(db, userId)
  if (p.seeded) return
  const defaults = [
    { name: 'Personal', color: 'mint', icon: 'home' },
    { name: 'Work', color: 'butter', icon: 'pen' },
    { name: 'Study', color: 'lavender', icon: 'book' },
  ]
  await db
    .insert(category)
    .values(defaults.map((d, i) => ({ id: id(), userId, position: i, ...d })))
  await db.update(prefs).set({ seeded: true }).where(eq(prefs.userId, userId))
}

// ---------- Categories ----------
export async function listCategories(db: Db, userId: string) {
  await seedDefaults(db, userId)
  const cats = await db
    .select()
    .from(category)
    .where(eq(category.userId, userId))
    .orderBy(asc(category.position), asc(category.createdAt))
  const counts = await db
    .select({
      categoryId: task.categoryId,
      total: sql<number>`count(*)::int`,
      done: sql<number>`count(*) filter (where ${task.status} = 'done')::int`,
    })
    .from(task)
    .where(eq(task.userId, userId))
    .groupBy(task.categoryId)
  return cats.map((c) => {
    const n = counts.find((x) => x.categoryId === c.id)
    return { ...c, taskCount: n?.total ?? 0, doneCount: n?.done ?? 0 }
  })
}

export async function createCategory(
  db: Db,
  userId: string,
  input: z.infer<typeof categoryCreate>,
) {
  await seedDefaults(db, userId)
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${category.position}), -1)::int` })
    .from(category)
    .where(eq(category.userId, userId))
  const [row] = await db
    .insert(category)
    .values({
      id: id(),
      userId,
      name: input.name,
      color: input.color ?? 'lavender',
      icon: input.icon ?? 'folder',
      position: max + 1,
    })
    .returning()
  return row
}

export async function updateCategory(
  db: Db,
  userId: string,
  catId: string,
  input: z.infer<typeof categoryUpdate>,
) {
  const [row] = await db
    .update(category)
    .set({ ...input, updatedAt: now() })
    .where(and(eq(category.id, catId), eq(category.userId, userId)))
    .returning()
  if (!row) throw new NotFoundError()
  return row
}

/** Deleting a folder never deletes its tasks: they move to Inbox. */
export async function deleteCategory(db: Db, userId: string, catId: string) {
  const [row] = await db
    .delete(category)
    .where(and(eq(category.id, catId), eq(category.userId, userId)))
    .returning()
  if (!row) throw new NotFoundError()
  await db
    .update(task)
    .set({ categoryId: null })
    .where(and(eq(task.userId, userId), eq(task.categoryId, catId)))
  await db
    .update(habit)
    .set({ categoryId: null })
    .where(and(eq(habit.userId, userId), eq(habit.categoryId, catId)))
  return { ok: true, moved: true }
}

async function assertCategory(
  db: Db,
  userId: string,
  catId: string | null | undefined,
) {
  if (!catId) return
  const [c] = await db
    .select({ id: category.id })
    .from(category)
    .where(and(eq(category.id, catId), eq(category.userId, userId)))
  if (!c) throw new NotFoundError('Folder not found')
}

// ---------- Tasks ----------
async function attachParts(
  db: Db,
  userId: string,
  rows: TaskRow[],
): Promise<TaskWithParts[]> {
  if (!rows.length) return []
  const ids = rows.map((r) => r.id)
  const subs = await db
    .select()
    .from(subtask)
    .where(and(eq(subtask.userId, userId), inArray(subtask.taskId, ids)))
    .orderBy(asc(subtask.position), asc(subtask.createdAt))
  const notes = await db
    .select({ taskId: note.taskId, n: sql<number>`count(*)::int` })
    .from(note)
    .where(and(eq(note.userId, userId), inArray(note.taskId, ids)))
    .groupBy(note.taskId)
  return rows.map((r) => ({
    ...r,
    subtasks: subs.filter((s) => s.taskId === r.id),
    noteCount: notes.find((n) => n.taskId === r.id)?.n ?? 0,
  }))
}

export async function listTasks(
  db: Db,
  userId: string,
  filters: z.infer<typeof taskFilters> = {},
) {
  const where = [eq(task.userId, userId)]
  if (filters.categoryId) where.push(eq(task.categoryId, filters.categoryId))
  if (filters.status) where.push(eq(task.status, filters.status))
  if (filters.q)
    where.push(ilike(task.title, `%${filters.q.replace(/[%_]/g, '')}%`))
  const rows = await db
    .select()
    .from(task)
    .where(and(...where))
    .orderBy(asc(task.position), desc(task.createdAt))
  return attachParts(db, userId, rows)
}

export async function getTask(db: Db, userId: string, taskId: string) {
  const [row] = await db
    .select()
    .from(task)
    .where(and(eq(task.id, taskId), eq(task.userId, userId)))
  if (!row) throw new NotFoundError()
  const [full] = await attachParts(db, userId, [row])
  return full
}

/** Bad combination of otherwise valid fields (a repeat with no start date). Mapped to 400. */
export class ValidationError extends Error {}

type Repeatable = Pick<
  TaskRow,
  'startDate' | 'startTime' | 'dueDate' | 'repeatRule' | 'repeatEnd'
>

/** A repeat needs a start date to count from; a monthly rule remembers its day of the month. */
function checkRepeat(t: Repeatable): RepeatRule | null {
  if (!t.repeatRule) return null
  if (!t.startDate)
    throw new ValidationError('Repeating tasks need a start date.')
  if (t.repeatRule.kind === 'monthly' && !t.repeatRule.day)
    return { kind: 'monthly', day: Number(t.startDate.slice(8, 10)) }
  return t.repeatRule
}

async function timezoneOf(db: Q, userId: string) {
  const [p] = await db
    .select({ tz: prefs.timezone })
    .from(prefs)
    .where(eq(prefs.userId, userId))
  return p?.tz ?? 'UTC'
}

/** When the reminder fires. Null when off, done, undated, or already in the past. */
function reminderMoment(
  t: Pick<TaskRow, 'startDate' | 'startTime' | 'dueDate' | 'status'>,
  offset: number | null,
  tz: string,
) {
  if (t.status === 'done') return null
  const at = remindAtFor(t, offset, tz)
  return at && at.getTime() > Date.now() ? at : null
}

export async function createTask(
  db: Db,
  userId: string,
  input: z.infer<typeof taskCreate>,
) {
  await assertCategory(db, userId, input.categoryId)
  const { subtasks: subs, remind, remindOffset, ...fields } = input
  const status = fields.status ?? 'todo'
  const offset = remindOffset !== undefined ? remindOffset : remind ? 0 : null
  const rule = checkRepeat({
    startDate: fields.startDate ?? null,
    startTime: fields.startTime ?? null,
    dueDate: fields.dueDate ?? null,
    repeatRule: fields.repeatRule ?? null,
    repeatEnd: fields.repeatEnd ?? null,
  })
  const tz = await timezoneOf(db, userId)
  const [row] = await db
    .insert(task)
    .values({
      id: id(),
      userId,
      ...fields,
      repeatRule: rule,
      status,
      completedAt: status === 'done' ? now() : null,
      remind: offset !== null,
      remindOffset: offset,
      remindAt: reminderMoment(
        {
          startDate: fields.startDate ?? null,
          startTime: fields.startTime ?? null,
          dueDate: fields.dueDate ?? null,
          status,
        },
        offset,
        tz,
      ),
    })
    .returning()
  if (subs?.length) {
    await db.insert(subtask).values(
      subs.map((title, i) => ({
        id: id(),
        userId,
        taskId: row.id,
        title,
        position: i,
      })),
    )
  }
  return getTask(db, userId, row.id)
}

/** The next open task of a series: same details, next date, unticked subtasks, counted down end. */
async function spawnNext(tx: Q, userId: string, from: TaskRow, tz: string) {
  const rule = checkRepeat(from)
  if (!rule || !from.startDate) return null
  const occ = nextOccurrence(rule, from.repeatEnd, from.startDate, todayIn(tz))
  if (!occ) return null
  const shift = daysBetween(from.startDate, occ.date)
  const dueDate = from.dueDate ? addDays(from.dueDate, shift) : null
  const values = {
    startDate: occ.date,
    startTime: from.startTime,
    dueDate,
    status: 'todo',
  }
  const [row] = await tx
    .insert(task)
    .values({
      id: id(),
      userId,
      title: from.title,
      categoryId: from.categoryId,
      endTime: from.endTime,
      priority: from.priority,
      repeatRule: rule,
      repeatEnd: occ.end,
      remind: from.remindOffset !== null,
      remindOffset: from.remindOffset,
      remindAt: reminderMoment(values, from.remindOffset, tz),
      ...values,
    })
    .returning()
  const subs = await tx
    .select({ title: subtask.title })
    .from(subtask)
    .where(and(eq(subtask.userId, userId), eq(subtask.taskId, from.id)))
    .orderBy(asc(subtask.position), asc(subtask.createdAt))
  if (subs.length)
    await tx.insert(subtask).values(
      subs.map((s, i) => ({
        id: id(),
        userId,
        taskId: row.id,
        title: s.title,
        position: i,
      })),
    )
  return row
}

export async function updateTask(
  db: Db,
  userId: string,
  taskId: string,
  input: z.infer<typeof taskUpdate>,
) {
  if (input.categoryId !== undefined)
    await assertCategory(db, userId, input.categoryId)
  const tz = await timezoneOf(db, userId)
  const nextId = await db.transaction(async (tx) => {
    const [cur] = await tx
      .select()
      .from(task)
      .where(and(eq(task.id, taskId), eq(task.userId, userId)))
    if (!cur) throw new NotFoundError()
    const { remind, remindOffset, ...rest } = input
    const merged = { ...cur, ...rest }
    const rule = checkRepeat(merged)
    const offset =
      remindOffset !== undefined
        ? remindOffset
        : remind !== undefined
          ? remind
            ? 0
            : null
          : cur.remindOffset
    const patch: Partial<TaskRow> = {
      ...rest,
      updatedAt: now(),
      remind: offset !== null,
      remindOffset: offset,
      remindAt: reminderMoment(merged, offset, tz),
    }
    if (rest.repeatRule) patch.repeatRule = rule
    if (rest.status === 'done') patch.completedAt = now()
    else if (rest.status) patch.completedAt = null
    // Editing the time or reminder must not re-arm a reminder that already went off.
    const untouched =
      rest.startDate === undefined &&
      rest.startTime === undefined &&
      rest.dueDate === undefined &&
      remindOffset === undefined &&
      remind === undefined &&
      rest.status === undefined
    if (untouched) delete patch.remindAt
    const [row] = await tx
      .update(task)
      .set(patch)
      .where(and(eq(task.id, taskId), eq(task.userId, userId)))
      .returning()
    const finishing = rest.status === 'done' && cur.status !== 'done'
    if (!finishing || !row.repeatRule) return null
    return (await spawnNext(tx, userId, row, tz))?.id ?? null
  })
  const updated = await getTask(db, userId, taskId)
  return {
    ...updated,
    next: nextId ? await getTask(db, userId, nextId) : null,
  }
}

/** Skip: move an open repeating task to its next day without a Completed entry. */
export async function skipTask(db: Db, userId: string, taskId: string) {
  const tz = await timezoneOf(db, userId)
  await db.transaction(async (tx) => {
    const [cur] = await tx
      .select()
      .from(task)
      .where(and(eq(task.id, taskId), eq(task.userId, userId)))
    if (!cur) throw new NotFoundError()
    const rule = checkRepeat(cur)
    if (!rule || !cur.startDate || cur.status === 'done')
      throw new ValidationError('Only an open repeating task can be skipped.')
    const occ = nextOccurrence(rule, cur.repeatEnd, cur.startDate, todayIn(tz))
    if (!occ)
      throw new ValidationError(
        'This is the last one. Delete it or stop repeating instead.',
      )
    const shift = daysBetween(cur.startDate, occ.date)
    const moved = {
      startDate: occ.date,
      dueDate: cur.dueDate ? addDays(cur.dueDate, shift) : null,
      startTime: cur.startTime,
      status: cur.status,
    }
    await tx
      .update(task)
      .set({
        ...moved,
        repeatEnd: occ.end,
        remindAt: reminderMoment(moved, cur.remindOffset, tz),
        updatedAt: now(),
      })
      .where(eq(task.id, taskId))
  })
  return getTask(db, userId, taskId)
}

/** Push a reminder back: fires again `minutes` from now. */
export async function snoozeTask(
  db: Db,
  userId: string,
  taskId: string,
  minutes: number,
) {
  const [row] = await db
    .update(task)
    .set({
      remindAt: new Date(Date.now() + minutes * 60_000),
      remind: true,
      remindOffset: sql`coalesce(${task.remindOffset}, 0)`,
      updatedAt: now(),
    })
    .where(
      and(
        eq(task.id, taskId),
        eq(task.userId, userId),
        sql`${task.status} <> 'done'`,
      ),
    )
    .returning()
  if (!row) throw new NotFoundError()
  return getTask(db, userId, taskId)
}

export async function deleteTask(db: Db, userId: string, taskId: string) {
  const [row] = await db
    .delete(task)
    .where(and(eq(task.id, taskId), eq(task.userId, userId)))
    .returning()
  if (!row) throw new NotFoundError()
  await db
    .delete(subtask)
    .where(and(eq(subtask.userId, userId), eq(subtask.taskId, taskId)))
  // Notes survive; they just stop being linked.
  await db
    .update(note)
    .set({ taskId: null })
    .where(and(eq(note.userId, userId), eq(note.taskId, taskId)))
  return { ok: true }
}

// ---------- Subtasks ----------
export async function addSubtask(
  db: Db,
  userId: string,
  taskId: string,
  title: string,
) {
  await getTask(db, userId, taskId)
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${subtask.position}), -1)::int` })
    .from(subtask)
    .where(eq(subtask.taskId, taskId))
  await db
    .insert(subtask)
    .values({ id: id(), userId, taskId, title, position: max + 1 })
  return getTask(db, userId, taskId)
}

export async function updateSubtask(
  db: Db,
  userId: string,
  subId: string,
  input: { title?: string; done?: boolean },
) {
  const [row] = await db
    .update(subtask)
    .set(input)
    .where(and(eq(subtask.id, subId), eq(subtask.userId, userId)))
    .returning()
  if (!row) throw new NotFoundError()
  // Ticking the first subtask starts the task.
  if (input.done) {
    await db
      .update(task)
      .set({ status: 'in_progress', updatedAt: now() })
      .where(
        and(
          eq(task.id, row.taskId),
          eq(task.userId, userId),
          eq(task.status, 'todo'),
        ),
      )
  }
  return getTask(db, userId, row.taskId)
}

export async function deleteSubtask(db: Db, userId: string, subId: string) {
  const [row] = await db
    .delete(subtask)
    .where(and(eq(subtask.id, subId), eq(subtask.userId, userId)))
    .returning()
  if (!row) throw new NotFoundError()
  return getTask(db, userId, row.taskId)
}

// ---------- Notes ----------
export async function listNotes(
  db: Db,
  userId: string,
  opts: { q?: string; taskId?: string } = {},
) {
  const where = [eq(note.userId, userId), eq(note.isScratchpad, false)]
  if (opts.taskId) where.push(eq(note.taskId, opts.taskId))
  if (opts.q) {
    const q = `%${opts.q.replace(/[%_]/g, '')}%`
    where.push(or(ilike(note.title, q), ilike(note.body, q))!)
  }
  return db
    .select()
    .from(note)
    .where(and(...where))
    .orderBy(desc(note.pinned), desc(note.updatedAt))
}

export async function getNote(db: Db, userId: string, noteId: string) {
  const [row] = await db
    .select()
    .from(note)
    .where(
      and(
        eq(note.id, noteId),
        eq(note.userId, userId),
        eq(note.isScratchpad, false),
      ),
    )
  if (!row) throw new NotFoundError()
  return row
}

export async function createNote(
  db: Db,
  userId: string,
  input: z.infer<typeof noteCreate>,
) {
  if (input.taskId) await getTask(db, userId, input.taskId)
  const [row] = await db
    .insert(note)
    .values({ id: id(), userId, ...input })
    .returning()
  return row
}

export async function updateNote(
  db: Db,
  userId: string,
  noteId: string,
  input: z.infer<typeof noteUpdate>,
) {
  if (input.taskId) await getTask(db, userId, input.taskId)
  const [row] = await db
    .update(note)
    .set({ ...input, updatedAt: now() })
    .where(
      and(
        eq(note.id, noteId),
        eq(note.userId, userId),
        eq(note.isScratchpad, false),
      ),
    )
    .returning()
  if (!row) throw new NotFoundError()
  return row
}

export async function deleteNote(db: Db, userId: string, noteId: string) {
  const [row] = await db
    .delete(note)
    .where(
      and(
        eq(note.id, noteId),
        eq(note.userId, userId),
        eq(note.isScratchpad, false),
      ),
    )
    .returning()
  if (!row) throw new NotFoundError()
  return { ok: true }
}

export async function getScratchpad(db: Db, userId: string) {
  const [row] = await db
    .select()
    .from(note)
    .where(and(eq(note.userId, userId), eq(note.isScratchpad, true)))
  if (row) return row
  const [created] = await db
    .insert(note)
    .values({ id: id(), userId, title: 'Scratchpad', isScratchpad: true })
    .returning()
  return created
}

export async function saveScratchpad(db: Db, userId: string, body: string) {
  const pad = await getScratchpad(db, userId)
  const [row] = await db
    .update(note)
    .set({ body, updatedAt: now() })
    .where(eq(note.id, pad.id))
    .returning()
  return row
}

// ---------- Account ----------
export async function search(db: Db, userId: string, q: string) {
  const [tasks, notes] = await Promise.all([
    listTasks(db, userId, { q }),
    listNotes(db, userId, { q }),
  ])
  return { tasks, notes }
}

export async function exportData(db: Db, userId: string) {
  const [tasks, notes, categories, scratchpad, p, habits] = await Promise.all([
    listTasks(db, userId),
    listNotes(db, userId),
    listCategories(db, userId),
    getScratchpad(db, userId),
    getPrefs(db, userId),
    listHabits(db, userId, { archived: true }),
  ])
  return {
    exportedAt: new Date().toISOString(),
    habits,
    prefs: p,
    categories,
    tasks,
    notes,
    scratchpad: scratchpad.body,
  }
}

export async function deleteAllData(db: Db, userId: string) {
  await wipeRows(db, userId)
  const [account] = await db
    .select({ isAnonymous: user.isAnonymous })
    .from(user)
    .where(eq(user.id, userId))
  if (account && account.isAnonymous === false) {
    // Signed in: keep the Google account and skip the welcome screen next time.
    await db.insert(prefs).values({ userId, onboardedAt: now() })
    return { ok: true, reset: false }
  }
  // Guests start over: the user row goes (sessions cascade) and the browser gets a new guest.
  await db.delete(user).where(eq(user.id, userId))
  return { ok: true, reset: true }
}

/** Removes every app row a user owns. Account tables are left alone. */
async function wipeRows(q: Q, userId: string) {
  await q.delete(subtask).where(eq(subtask.userId, userId))
  await q.delete(task).where(eq(task.userId, userId))
  await q.delete(note).where(eq(note.userId, userId))
  await q.delete(category).where(eq(category.userId, userId))
  await q.delete(habitCheckin).where(eq(habitCheckin.userId, userId))
  await q.delete(habit).where(eq(habit.userId, userId))
  await q.delete(pushSubscription).where(eq(pushSubscription.userId, userId))
  await q.delete(prefs).where(eq(prefs.userId, userId))
}

// ---------- Google sign in: linking a guest ----------
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]
type Q = Db | Tx

export const googleEnabled = () =>
  !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

/** True when a user has anything worth keeping: a task, a note, a habit or scratchpad text. */
export async function hasData(db: Q, userId: string) {
  const [[t], [n], [hb]] = await Promise.all([
    db
      .select({ id: task.id })
      .from(task)
      .where(eq(task.userId, userId))
      .limit(1),
    db
      .select({ id: note.id })
      .from(note)
      .where(
        and(
          eq(note.userId, userId),
          or(eq(note.isScratchpad, false), sql`trim(${note.body}) <> ''`),
        ),
      )
      .limit(1),
    db
      .select({ id: habit.id })
      .from(habit)
      .where(eq(habit.userId, userId))
      .limit(1),
  ])
  return !!t || !!n || !!hb
}

async function pendingMergeCounts(db: Q, ids: string[] | null) {
  if (!ids?.length) return null
  const [[t], [n]] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(task)
      .where(inArray(task.userId, ids)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(note)
      .where(and(inArray(note.userId, ids), eq(note.isScratchpad, false))),
  ])
  return { tasks: t.n, notes: n.n }
}

/**
 * Moves everything a guest owns into another account, in one transaction.
 * Folders with the same name (ignoring case) become one; the scratchpad text is appended;
 * the account keeps its own prefs (the guest's are used only when it has none).
 */
export async function mergeGuestData(
  db: Db,
  fromUserId: string,
  toUserId: string,
) {
  if (fromUserId === toUserId) return { ok: true }
  await db.transaction(async (tx) => {
    // Folders first, while the guest's tasks still point at the guest's folder ids.
    const [mine, theirs] = await Promise.all([
      tx.select().from(category).where(eq(category.userId, toUserId)),
      tx
        .select()
        .from(category)
        .where(eq(category.userId, fromUserId))
        .orderBy(asc(category.position)),
    ])
    const byName = new Map(mine.map((c) => [c.name.trim().toLowerCase(), c]))
    let position = Math.max(-1, ...mine.map((c) => c.position))
    for (const c of theirs) {
      const same = byName.get(c.name.trim().toLowerCase())
      if (same) {
        await tx
          .update(task)
          .set({ categoryId: same.id })
          .where(and(eq(task.userId, fromUserId), eq(task.categoryId, c.id)))
        await tx
          .update(habit)
          .set({ categoryId: same.id })
          .where(and(eq(habit.userId, fromUserId), eq(habit.categoryId, c.id)))
        await tx.delete(category).where(eq(category.id, c.id))
      } else {
        position += 1
        await tx
          .update(category)
          .set({ userId: toUserId, position, updatedAt: now() })
          .where(eq(category.id, c.id))
      }
    }
    await tx
      .update(task)
      .set({ userId: toUserId })
      .where(eq(task.userId, fromUserId))
    await tx
      .update(subtask)
      .set({ userId: toUserId })
      .where(eq(subtask.userId, fromUserId))
    await tx
      .update(note)
      .set({ userId: toUserId })
      .where(and(eq(note.userId, fromUserId), eq(note.isScratchpad, false)))
    // Habits go after the account's own, in their order; check ins follow their habit.
    const [{ maxHabit }] = await tx
      .select({
        maxHabit: sql<number>`coalesce(max(${habit.position}), -1)::int`,
      })
      .from(habit)
      .where(eq(habit.userId, toUserId))
    await tx
      .update(habit)
      .set({
        userId: toUserId,
        position: sql`${habit.position} + ${maxHabit + 1}`,
      })
      .where(eq(habit.userId, fromUserId))
    await tx
      .update(habitCheckin)
      .set({ userId: toUserId })
      .where(eq(habitCheckin.userId, fromUserId))
    await tx
      .update(pushSubscription)
      .set({ userId: toUserId })
      .where(eq(pushSubscription.userId, fromUserId))

    // One scratchpad per user: keep the account's and add the guest's text under it.
    const [[pad], [guestPad]] = await Promise.all([
      tx
        .select()
        .from(note)
        .where(and(eq(note.userId, toUserId), eq(note.isScratchpad, true))),
      tx
        .select()
        .from(note)
        .where(and(eq(note.userId, fromUserId), eq(note.isScratchpad, true))),
    ])
    if (guestPad && !pad) {
      await tx
        .update(note)
        .set({ userId: toUserId })
        .where(eq(note.id, guestPad.id))
    } else if (guestPad && pad) {
      if (guestPad.body.trim()) {
        const body = pad.body.trim()
          ? `${pad.body}\n\n${guestPad.body}`
          : guestPad.body
        await tx
          .update(note)
          .set({ body: body.slice(0, 50_000), updatedAt: now() })
          .where(eq(note.id, pad.id))
      }
      await tx.delete(note).where(eq(note.id, guestPad.id))
    }

    const [[myPrefs], [guestPrefs]] = await Promise.all([
      tx.select().from(prefs).where(eq(prefs.userId, toUserId)),
      tx.select().from(prefs).where(eq(prefs.userId, fromUserId)),
    ])
    if (guestPrefs && !myPrefs) {
      await tx
        .update(prefs)
        .set({ userId: toUserId, pendingMerge: null, updatedAt: now() })
        .where(eq(prefs.userId, fromUserId))
    } else if (guestPrefs) {
      await tx.delete(prefs).where(eq(prefs.userId, fromUserId))
    }
    // The folders came across, so don't seed the defaults again.
    if (theirs.length)
      await tx
        .update(prefs)
        .set({ seeded: true })
        .where(eq(prefs.userId, toUserId))
  })
  return { ok: true }
}

/**
 * Called right after a guest signs in with Google. Nothing is lost silently:
 * a fresh account takes the guest's data, a guest with nothing is dropped,
 * and when both sides have data the account waits for the merge prompt.
 */
export async function linkGuestAccount(
  db: Db,
  guestId: string,
  accountId: string,
): Promise<'merged' | 'discarded' | 'pending'> {
  if (guestId === accountId) return 'merged'
  const [guestHas, accountHas] = await Promise.all([
    hasData(db, guestId),
    hasData(db, accountId),
  ])
  if (!accountHas) {
    await mergeGuestData(db, guestId, accountId)
    return 'merged'
  }
  if (!guestHas) {
    await wipeRows(db, guestId)
    return 'discarded'
  }
  const p = await getPrefs(db, accountId)
  const ids = [...new Set([...(p.pendingMerge ?? []), guestId])]
  await db
    .update(prefs)
    .set({ pendingMerge: ids, updatedAt: now() })
    .where(eq(prefs.userId, accountId))
  return 'pending'
}

/** The merge prompt's answer: merge every waiting guest into this account, or drop them. */
export async function resolvePendingMerge(
  db: Db,
  userId: string,
  choice: 'merge' | 'discard',
) {
  const p = await getPrefs(db, userId)
  const ids = p.pendingMerge ?? []
  if (!ids.length) throw new NotFoundError('Nothing to merge')
  for (const guestId of ids) {
    if (choice === 'merge') await mergeGuestData(db, guestId, userId)
    else await wipeRows(db, guestId)
  }
  await db
    .update(prefs)
    .set({ pendingMerge: null, updatedAt: now() })
    .where(eq(prefs.userId, userId))
  return getMe(db, userId)
}

// ---------- Habits (Phase 2) ----------
export type HabitRow = typeof habit.$inferSelect
/** A habit plus every check in date (local YYYY-MM-DD, ascending). Streaks are worked out on the client. */
export type HabitWithCheckins = HabitRow & { checkins: string[] }

async function attachCheckins(
  db: Db,
  userId: string,
  rows: HabitRow[],
): Promise<HabitWithCheckins[]> {
  if (!rows.length) return []
  const days = await db
    .select({ habitId: habitCheckin.habitId, date: habitCheckin.date })
    .from(habitCheckin)
    .where(
      and(
        eq(habitCheckin.userId, userId),
        inArray(
          habitCheckin.habitId,
          rows.map((r) => r.id),
        ),
      ),
    )
    .orderBy(asc(habitCheckin.date))
  return rows.map((r) => ({
    ...r,
    checkins: days.filter((d) => d.habitId === r.id).map((d) => d.date),
  }))
}

/** Active habits by default; `archived: true` returns every habit. */
export async function listHabits(
  db: Db,
  userId: string,
  opts: { archived?: boolean } = {},
) {
  const where = [eq(habit.userId, userId)]
  if (!opts.archived) where.push(eq(habit.archived, false))
  const rows = await db
    .select()
    .from(habit)
    .where(and(...where))
    .orderBy(asc(habit.position), asc(habit.createdAt))
  return attachCheckins(db, userId, rows)
}

export async function getHabit(db: Db, userId: string, habitId: string) {
  const [row] = await db
    .select()
    .from(habit)
    .where(and(eq(habit.id, habitId), eq(habit.userId, userId)))
  if (!row) throw new NotFoundError()
  const [full] = await attachCheckins(db, userId, [row])
  return full
}

/** Keeps the frequency fields tidy: only the one that matches the frequency is stored. */
function frequencyFields(input: {
  frequency: string
  daysOfWeek?: number[] | null
  timesPerWeek?: number | null
}) {
  return {
    frequency: input.frequency,
    daysOfWeek:
      input.frequency === 'weekdays'
        ? [...new Set(input.daysOfWeek ?? [1, 2, 3, 4, 5])].sort(
            (a, b) => a - b,
          )
        : null,
    timesPerWeek:
      input.frequency === 'x_per_week' ? (input.timesPerWeek ?? 3) : null,
  }
}

export async function createHabit(
  db: Db,
  userId: string,
  input: z.infer<typeof habitCreate>,
) {
  await assertCategory(db, userId, input.categoryId)
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${habit.position}), -1)::int` })
    .from(habit)
    .where(eq(habit.userId, userId))
  const [row] = await db
    .insert(habit)
    .values({
      id: id(),
      userId,
      ...input,
      ...frequencyFields({ ...input, frequency: input.frequency ?? 'daily' }),
      position: max + 1,
    })
    .returning()
  return { ...row, checkins: [] as string[] }
}

export async function updateHabit(
  db: Db,
  userId: string,
  habitId: string,
  input: z.infer<typeof habitUpdate>,
) {
  const current = await getHabit(db, userId, habitId)
  if (input.categoryId !== undefined)
    await assertCategory(db, userId, input.categoryId)
  const touchesFrequency =
    input.frequency !== undefined ||
    input.daysOfWeek !== undefined ||
    input.timesPerWeek !== undefined
  const freq = touchesFrequency
    ? frequencyFields({
        frequency: input.frequency ?? current.frequency,
        daysOfWeek:
          input.daysOfWeek !== undefined
            ? input.daysOfWeek
            : current.daysOfWeek,
        timesPerWeek:
          input.timesPerWeek !== undefined
            ? input.timesPerWeek
            : current.timesPerWeek,
      })
    : {}
  await db
    .update(habit)
    .set({ ...input, ...freq, updatedAt: now() })
    .where(and(eq(habit.id, habitId), eq(habit.userId, userId)))
  return getHabit(db, userId, habitId)
}

export async function deleteHabit(db: Db, userId: string, habitId: string) {
  const [row] = await db
    .delete(habit)
    .where(and(eq(habit.id, habitId), eq(habit.userId, userId)))
    .returning()
  if (!row) throw new NotFoundError()
  await db
    .delete(habitCheckin)
    .where(
      and(eq(habitCheckin.userId, userId), eq(habitCheckin.habitId, habitId)),
    )
  return { ok: true }
}

/** Checks in (or undoes) one day. Without `done` it toggles, so a second tap the same day undoes. */
export async function toggleCheckin(
  db: Db,
  userId: string,
  habitId: string,
  input: { date: string; done?: boolean },
) {
  await getHabit(db, userId, habitId)
  const where = and(
    eq(habitCheckin.userId, userId),
    eq(habitCheckin.habitId, habitId),
    eq(habitCheckin.date, input.date),
  )
  const [existing] = await db
    .select({ id: habitCheckin.id })
    .from(habitCheckin)
    .where(where)
  const done = input.done ?? !existing
  if (done && !existing)
    await db
      .insert(habitCheckin)
      .values({ id: id(), userId, habitId, date: input.date })
      .onConflictDoNothing()
  if (!done && existing) await db.delete(habitCheckin).where(where)
  return getHabit(db, userId, habitId)
}

// ---------- Push subscriptions (reminders) ----------
export async function savePushSubscription(
  db: Db,
  userId: string,
  input: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent: string | null,
) {
  await db
    .insert(pushSubscription)
    .values({
      id: id(),
      userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: userAgent?.slice(0, 300) ?? null,
    })
    // The same browser subscribing again (or after signing in) moves to the current account.
    .onConflictDoUpdate({
      target: pushSubscription.endpoint,
      set: {
        userId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: userAgent?.slice(0, 300) ?? null,
      },
    })
  return { ok: true }
}

export async function deletePushSubscription(
  db: Db,
  userId: string,
  endpoint: string,
) {
  await db
    .delete(pushSubscription)
    .where(
      and(
        eq(pushSubscription.userId, userId),
        eq(pushSubscription.endpoint, endpoint),
      ),
    )
  return { ok: true }
}

// ---------- Sample data ----------
/** One click to see the app full: a spread of tasks, notes and habits. Tracked so it can be cleared. */
export async function loadSampleData(db: Db, userId: string, today: string) {
  const p = await getPrefs(db, userId)
  if (p.sampleIds) throw new ValidationError('Sample data is already loaded.')
  const cats = await listCategories(db, userId)
  const folder = (name: string) => cats.find((c) => c.name === name)?.id ?? null
  const day = (n: number) => addDays(today, n)
  const tasks: z.infer<typeof taskCreate>[] = [
    {
      title: 'Submit HNG stage 1',
      categoryId: folder('Work'),
      startDate: day(0),
      startTime: '18:00',
      dueDate: day(0),
      priority: 'high',
      subtasks: [
        'Deploy the app',
        'Check it in a private window',
        'Fill in the form',
      ],
    },
    {
      title: 'Reply to the design feedback',
      categoryId: folder('Work'),
      startDate: day(-2),
      dueDate: day(-1),
      priority: 'high',
    },
    {
      title: 'Call mum',
      categoryId: folder('Personal'),
      startDate: day(0),
      startTime: '17:00',
      priority: 'medium',
    },
    {
      title: 'Read 20 pages',
      categoryId: folder('Study'),
      startDate: day(1),
      priority: 'low',
      subtasks: ['Chapter 4', 'Write three notes'],
    },
    {
      title: 'Plan the week',
      categoryId: folder('Personal'),
      startDate: day(2),
      priority: 'medium',
    },
    {
      title: 'Book a dentist appointment',
      categoryId: folder('Personal'),
      startDate: day(5),
      priority: 'low',
    },
    {
      title: 'Water the plants',
      categoryId: folder('Personal'),
      startDate: day(0),
      priority: 'low',
    },
    {
      title: 'Buy bread',
      categoryId: folder('Personal'),
      startDate: day(-1),
      status: 'done',
    },
    {
      title: 'Send the invoice',
      categoryId: folder('Work'),
      startDate: day(-3),
      status: 'done',
    },
    {
      title: 'Write the project outline',
      categoryId: folder('Study'),
      startDate: day(0),
      status: 'in_progress',
      priority: 'medium',
    },
  ]
  const taskIds: string[] = []
  for (const t of tasks) taskIds.push((await createTask(db, userId, t)).id)

  const notes: z.infer<typeof noteCreate>[] = [
    {
      title: 'Ideas',
      body: 'A calmer way to plan the day.\n\n- [ ] Sketch the home screen\n- [x] Pick a name\n- [ ] Try the scratchpad',
      color: 'butter',
      pinned: true,
    },
    {
      title: 'Reading list',
      body: '1. Deep Work\n2. The Design of Everyday Things\n3. Atomic Habits',
      color: 'lavender',
    },
    {
      title: 'Shopping',
      body: '- Bread\n- Oat milk\n- Tomatoes',
      color: 'mint',
    },
  ]
  const noteIds: string[] = []
  for (const n of notes) noteIds.push((await createNote(db, userId, n)).id)

  const habits: [z.infer<typeof habitCreate>, number][] = [
    [
      {
        name: 'Drink 8 glasses of water',
        icon: 'droplet',
        categoryId: folder('Personal'),
        goalDays: 21,
      },
      12,
    ],
    [
      {
        name: 'Read for 20 minutes',
        icon: 'book',
        categoryId: folder('Study'),
      },
      5,
    ],
    [{ name: 'Stretch', icon: 'sun', frequency: 'weekdays' }, 3],
  ]
  const habitIds: string[] = []
  for (const [h, streak] of habits) {
    const row = await createHabit(db, userId, h)
    habitIds.push(row.id)
    for (let i = 0; i < streak; i++)
      await toggleCheckin(db, userId, row.id, { date: day(-i), done: true })
  }
  await db
    .update(prefs)
    .set({
      sampleIds: { tasks: taskIds, notes: noteIds, habits: habitIds },
      updatedAt: now(),
    })
    .where(eq(prefs.userId, userId))
  return {
    ok: true,
    tasks: taskIds.length,
    notes: noteIds.length,
    habits: habitIds.length,
  }
}

/** Back to the empty state: removes only what "Load sample data" made. */
export async function clearSampleData(db: Db, userId: string) {
  const p = await getPrefs(db, userId)
  const ids = p.sampleIds
  if (!ids) throw new NotFoundError()
  await db.transaction(async (tx) => {
    if (ids.tasks.length) {
      await tx
        .delete(subtask)
        .where(
          and(eq(subtask.userId, userId), inArray(subtask.taskId, ids.tasks)),
        )
      await tx
        .update(note)
        .set({ taskId: null })
        .where(and(eq(note.userId, userId), inArray(note.taskId, ids.tasks)))
      await tx
        .delete(task)
        .where(and(eq(task.userId, userId), inArray(task.id, ids.tasks)))
    }
    if (ids.notes.length)
      await tx
        .delete(note)
        .where(and(eq(note.userId, userId), inArray(note.id, ids.notes)))
    if (ids.habits.length) {
      await tx
        .delete(habitCheckin)
        .where(
          and(
            eq(habitCheckin.userId, userId),
            inArray(habitCheckin.habitId, ids.habits),
          ),
        )
      await tx
        .delete(habit)
        .where(and(eq(habit.userId, userId), inArray(habit.id, ids.habits)))
    }
    await tx
      .update(prefs)
      .set({ sampleIds: null, updatedAt: now() })
      .where(eq(prefs.userId, userId))
  })
  return { ok: true }
}
