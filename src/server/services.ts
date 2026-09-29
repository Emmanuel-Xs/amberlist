import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { Db } from './db'
import { category, note, prefs, subtask, task } from './schema'
import type {
  categoryCreate,
  categoryUpdate,
  noteCreate,
  noteUpdate,
  prefsUpdate,
  taskCreate,
  taskFilters,
  taskUpdate,
} from './validation'

export class NotFoundError extends Error {}
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
  await getPrefs(db, userId)
  const [row] = await db
    .update(prefs)
    .set({ ...input, updatedAt: now() })
    .where(eq(prefs.userId, userId))
    .returning()
  return row
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

export async function createTask(
  db: Db,
  userId: string,
  input: z.infer<typeof taskCreate>,
) {
  await assertCategory(db, userId, input.categoryId)
  const { subtasks: subs, ...fields } = input
  const status = fields.status ?? 'todo'
  const [row] = await db
    .insert(task)
    .values({
      id: id(),
      userId,
      ...fields,
      status,
      completedAt: status === 'done' ? now() : null,
    })
    .returning()
  if (subs?.length) {
    await db
      .insert(subtask)
      .values(
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

export async function updateTask(
  db: Db,
  userId: string,
  taskId: string,
  input: z.infer<typeof taskUpdate>,
) {
  if (input.categoryId !== undefined)
    await assertCategory(db, userId, input.categoryId)
  const patch: Partial<TaskRow> = { ...input, updatedAt: now() }
  if (input.status === 'done') patch.completedAt = now()
  else if (input.status) patch.completedAt = null
  const [row] = await db
    .update(task)
    .set(patch)
    .where(and(eq(task.id, taskId), eq(task.userId, userId)))
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
  const [tasks, notes, categories, scratchpad, p] = await Promise.all([
    listTasks(db, userId),
    listNotes(db, userId),
    listCategories(db, userId),
    getScratchpad(db, userId),
    getPrefs(db, userId),
  ])
  return {
    exportedAt: new Date().toISOString(),
    prefs: p,
    categories,
    tasks,
    notes,
    scratchpad: scratchpad.body,
  }
}

export async function deleteAllData(db: Db, userId: string) {
  await db.delete(subtask).where(eq(subtask.userId, userId))
  await db.delete(task).where(eq(task.userId, userId))
  await db.delete(note).where(eq(note.userId, userId))
  await db.delete(category).where(eq(category.userId, userId))
  await db.delete(prefs).where(eq(prefs.userId, userId))
  return { ok: true }
}
