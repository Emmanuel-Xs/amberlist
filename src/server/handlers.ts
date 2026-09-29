import { z } from 'zod'
import { json, readBody, route } from './http'
import * as s from './services'
import * as v from './validation'

const idParam = (params: Record<string, string>) =>
  z.string().min(1).max(64).parse(params.id)

export const tasks = {
  GET: route(async ({ db, userId, request }) => {
    const url = new URL(request.url)
    const filters = v.taskFilters.parse(Object.fromEntries(url.searchParams))
    return json(await s.listTasks(db, userId, filters))
  }),
  POST: route(async ({ db, userId, request }) =>
    json(
      await s.createTask(db, userId, await readBody(request, v.taskCreate)),
      201,
    ),
  ),
}

export const taskById = {
  GET: route(async ({ db, userId, params }) =>
    json(await s.getTask(db, userId, idParam(params))),
  ),
  PATCH: route(async ({ db, userId, request, params }) =>
    json(
      await s.updateTask(
        db,
        userId,
        idParam(params),
        await readBody(request, v.taskUpdate),
      ),
    ),
  ),
  DELETE: route(async ({ db, userId, params }) =>
    json(await s.deleteTask(db, userId, idParam(params))),
  ),
}

export const taskSubtasks = {
  POST: route(async ({ db, userId, request, params }) => {
    const { title } = await readBody(request, v.subtaskCreate)
    return json(await s.addSubtask(db, userId, idParam(params), title), 201)
  }),
}

export const subtaskById = {
  PATCH: route(async ({ db, userId, request, params }) =>
    json(
      await s.updateSubtask(
        db,
        userId,
        idParam(params),
        await readBody(request, v.subtaskUpdate),
      ),
    ),
  ),
  DELETE: route(async ({ db, userId, params }) =>
    json(await s.deleteSubtask(db, userId, idParam(params))),
  ),
}

export const notes = {
  GET: route(async ({ db, userId, request }) => {
    const url = new URL(request.url)
    const q = z
      .string()
      .max(200)
      .optional()
      .parse(url.searchParams.get('q') ?? undefined)
    const taskId = z
      .string()
      .max(64)
      .optional()
      .parse(url.searchParams.get('taskId') ?? undefined)
    return json(await s.listNotes(db, userId, { q, taskId }))
  }),
  POST: route(async ({ db, userId, request }) =>
    json(
      await s.createNote(db, userId, await readBody(request, v.noteCreate)),
      201,
    ),
  ),
}

export const noteById = {
  GET: route(async ({ db, userId, params }) =>
    json(await s.getNote(db, userId, idParam(params))),
  ),
  PATCH: route(async ({ db, userId, request, params }) =>
    json(
      await s.updateNote(
        db,
        userId,
        idParam(params),
        await readBody(request, v.noteUpdate),
      ),
    ),
  ),
  DELETE: route(async ({ db, userId, params }) =>
    json(await s.deleteNote(db, userId, idParam(params))),
  ),
}

export const scratchpad = {
  GET: route(async ({ db, userId }) => json(await s.getScratchpad(db, userId))),
  PUT: route(async ({ db, userId, request }) =>
    json(
      await s.saveScratchpad(
        db,
        userId,
        (await readBody(request, v.scratchpadUpdate)).body,
      ),
    ),
  ),
}

export const categories = {
  GET: route(async ({ db, userId }) =>
    json(await s.listCategories(db, userId)),
  ),
  POST: route(async ({ db, userId, request }) =>
    json(
      await s.createCategory(
        db,
        userId,
        await readBody(request, v.categoryCreate),
      ),
      201,
    ),
  ),
}

export const categoryById = {
  PATCH: route(async ({ db, userId, request, params }) =>
    json(
      await s.updateCategory(
        db,
        userId,
        idParam(params),
        await readBody(request, v.categoryUpdate),
      ),
    ),
  ),
  DELETE: route(async ({ db, userId, params }) =>
    json(await s.deleteCategory(db, userId, idParam(params))),
  ),
}

export const me = {
  GET: route(async ({ db, userId }) => json(await s.getPrefs(db, userId))),
  PATCH: route(async ({ db, userId, request }) =>
    json(
      await s.updatePrefs(db, userId, await readBody(request, v.prefsUpdate)),
    ),
  ),
}

export const meData = {
  GET: route(async ({ db, userId }) => json(await s.exportData(db, userId))),
  DELETE: route(async ({ db, userId }) =>
    json(await s.deleteAllData(db, userId)),
  ),
}

export const searchAll = {
  GET: route(async ({ db, userId, request }) => {
    const q = z
      .string()
      .trim()
      .min(1)
      .max(200)
      .parse(new URL(request.url).searchParams.get('q'))
    return json(await s.search(db, userId, q))
  }),
}
