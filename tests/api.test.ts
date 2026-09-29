import { beforeEach, describe, expect, it } from 'vitest'
import { resetDbForTests } from '../src/server/db'
import { setUserResolver } from '../src/server/http'
import * as h from '../src/server/handlers'

// Every endpoint is tested for: success, bad input (400), no session (401) and another user's data (404).
setUserResolver(async (req) => req.headers.get('x-test-user'))

type Handler = (o: {
  request: Request
  params?: Record<string, string>
}) => Promise<Response>
async function call(
  fn: Handler,
  method: string,
  opts: {
    user?: string | null
    body?: unknown
    params?: Record<string, string>
    query?: string
  } = {},
) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  const user = opts.user === undefined ? 'alice' : opts.user
  if (user) headers['x-test-user'] = user
  const request = new Request(
    `http://test.local/api${opts.query ? '?' + opts.query : ''}`,
    {
      method,
      headers,
      body:
        opts.body === undefined
          ? undefined
          : typeof opts.body === 'string'
            ? opts.body
            : JSON.stringify(opts.body),
    },
  )
  const res = await fn({ request, params: opts.params })
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null }
}

beforeEach(async () => {
  await resetDbForTests()
})

describe('auth', () => {
  it('rejects every endpoint without a session', async () => {
    const endpoints: [Handler, string][] = [
      [h.tasks.GET, 'GET'],
      [h.tasks.POST, 'POST'],
      [h.taskById.GET, 'GET'],
      [h.taskById.PATCH, 'PATCH'],
      [h.taskById.DELETE, 'DELETE'],
      [h.taskSubtasks.POST, 'POST'],
      [h.subtaskById.PATCH, 'PATCH'],
      [h.subtaskById.DELETE, 'DELETE'],
      [h.notes.GET, 'GET'],
      [h.notes.POST, 'POST'],
      [h.noteById.GET, 'GET'],
      [h.noteById.PATCH, 'PATCH'],
      [h.noteById.DELETE, 'DELETE'],
      [h.scratchpad.GET, 'GET'],
      [h.scratchpad.PUT, 'PUT'],
      [h.categories.GET, 'GET'],
      [h.categories.POST, 'POST'],
      [h.categoryById.PATCH, 'PATCH'],
      [h.categoryById.DELETE, 'DELETE'],
      [h.me.GET, 'GET'],
      [h.me.PATCH, 'PATCH'],
      [h.meData.GET, 'GET'],
      [h.meData.DELETE, 'DELETE'],
      [h.searchAll.GET, 'GET'],
    ]
    for (const [fn, method] of endpoints) {
      const r = await call(fn, method, {
        user: null,
        body: method === 'GET' || method === 'DELETE' ? undefined : {},
        params: { id: 'x' },
      })
      expect(r.status, `${method} should need a session`).toBe(401)
    }
  })
})

describe('tasks', () => {
  it('creates, lists, reads, updates and deletes a task', async () => {
    const created = await call(h.tasks.POST, 'POST', {
      body: {
        title: 'Submit HNG Stage 1',
        startDate: '2026-09-29',
        dueDate: '2026-09-29',
        priority: 'high',
        subtasks: ['Build', 'Test'],
      },
    })
    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({
      title: 'Submit HNG Stage 1',
      status: 'todo',
      priority: 'high',
    })
    expect(created.body.subtasks).toHaveLength(2)
    const id = created.body.id

    const list = await call(h.tasks.GET, 'GET')
    expect(list.status).toBe(200)
    expect(list.body).toHaveLength(1)

    expect(
      (await call(h.taskById.GET, 'GET', { params: { id } })).body.title,
    ).toBe('Submit HNG Stage 1')

    const done = await call(h.taskById.PATCH, 'PATCH', {
      params: { id },
      body: { status: 'done' },
    })
    expect(done.status).toBe(200)
    expect(done.body.completedAt).toBeTruthy()
    const undone = await call(h.taskById.PATCH, 'PATCH', {
      params: { id },
      body: { status: 'todo' },
    })
    expect(undone.body.completedAt).toBeNull()

    expect(
      (await call(h.taskById.DELETE, 'DELETE', { params: { id } })).status,
    ).toBe(200)
    expect((await call(h.taskById.GET, 'GET', { params: { id } })).status).toBe(
      404,
    )
  })

  it('validates input', async () => {
    expect(
      (await call(h.tasks.POST, 'POST', { body: { title: '' } })).status,
    ).toBe(400)
    expect(
      (await call(h.tasks.POST, 'POST', { body: { title: 'x'.repeat(201) } }))
        .status,
    ).toBe(400)
    expect(
      (
        await call(h.tasks.POST, 'POST', {
          body: { title: 'ok', startDate: '29/09/2026' },
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await call(h.tasks.POST, 'POST', {
          body: { title: 'ok', hacker: true },
        })
      ).status,
    ).toBe(400)
    expect(
      (await call(h.tasks.POST, 'POST', { body: 'not json' })).status,
    ).toBe(400)
    expect(
      (await call(h.tasks.GET, 'GET', { query: 'status=weird' })).status,
    ).toBe(400)
  })

  it('filters by status, folder and search', async () => {
    const cats = (await call(h.categories.GET, 'GET')).body
    const work = cats.find((c: { name: string }) => c.name === 'Work')
    await call(h.tasks.POST, 'POST', {
      body: { title: 'Invoice client', categoryId: work.id },
    })
    await call(h.tasks.POST, 'POST', {
      body: { title: 'Buy bread', status: 'done' },
    })
    expect(
      (await call(h.tasks.GET, 'GET', { query: `categoryId=${work.id}` })).body,
    ).toHaveLength(1)
    expect(
      (await call(h.tasks.GET, 'GET', { query: 'status=done' })).body[0].title,
    ).toBe('Buy bread')
    expect(
      (await call(h.tasks.GET, 'GET', { query: 'q=invoice' })).body,
    ).toHaveLength(1)
  })

  it('never shows or changes another user’s task', async () => {
    const { body } = await call(h.tasks.POST, 'POST', {
      body: { title: 'Private' },
    })
    expect(
      (
        await call(h.taskById.GET, 'GET', {
          user: 'bob',
          params: { id: body.id },
        })
      ).status,
    ).toBe(404)
    expect(
      (
        await call(h.taskById.PATCH, 'PATCH', {
          user: 'bob',
          params: { id: body.id },
          body: { title: 'Hacked' },
        })
      ).status,
    ).toBe(404)
    expect(
      (
        await call(h.taskById.DELETE, 'DELETE', {
          user: 'bob',
          params: { id: body.id },
        })
      ).status,
    ).toBe(404)
    expect((await call(h.tasks.GET, 'GET', { user: 'bob' })).body).toHaveLength(
      0,
    )
  })

  it('refuses a folder that belongs to someone else', async () => {
    const bobCats = (await call(h.categories.GET, 'GET', { user: 'bob' })).body
    expect(
      (
        await call(h.tasks.POST, 'POST', {
          body: { title: 'x', categoryId: bobCats[0].id },
        })
      ).status,
    ).toBe(404)
  })
})

describe('subtasks', () => {
  it('adds, ticks (starting the task), renames and deletes subtasks', async () => {
    const t = (
      await call(h.tasks.POST, 'POST', { body: { title: 'Write tests' } })
    ).body
    const added = await call(h.taskSubtasks.POST, 'POST', {
      params: { id: t.id },
      body: { title: 'Endpoints' },
    })
    expect(added.status).toBe(201)
    const sub = added.body.subtasks[0]
    const ticked = await call(h.subtaskById.PATCH, 'PATCH', {
      params: { id: sub.id },
      body: { done: true },
    })
    expect(ticked.body.status).toBe('in_progress')
    expect(ticked.body.subtasks[0].done).toBe(true)
    expect(
      (
        await call(h.subtaskById.PATCH, 'PATCH', {
          params: { id: sub.id },
          body: { title: '' },
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await call(h.subtaskById.PATCH, 'PATCH', {
          user: 'bob',
          params: { id: sub.id },
          body: { done: false },
        })
      ).status,
    ).toBe(404)
    expect(
      (await call(h.subtaskById.DELETE, 'DELETE', { params: { id: sub.id } }))
        .body.subtasks,
    ).toHaveLength(0)
    expect(
      (
        await call(h.taskSubtasks.POST, 'POST', {
          user: 'bob',
          params: { id: t.id },
          body: { title: 'x' },
        })
      ).status,
    ).toBe(404)
  })
})

describe('notes and scratchpad', () => {
  it('creates, links, searches, pins, updates and deletes notes', async () => {
    const t = (
      await call(h.tasks.POST, 'POST', { body: { title: 'Design review' } })
    ).body
    const n = await call(h.notes.POST, 'POST', {
      body: { title: 'Review notes', body: '- [ ] contrast', taskId: t.id },
    })
    expect(n.status).toBe(201)
    await call(h.notes.POST, 'POST', {
      body: { title: 'Groceries', body: 'rice, eggs', pinned: true },
    })
    const all = (await call(h.notes.GET, 'GET')).body
    expect(all[0].title).toBe('Groceries') // pinned first
    expect(
      (await call(h.notes.GET, 'GET', { query: 'q=eggs' })).body,
    ).toHaveLength(1)
    expect(
      (await call(h.notes.GET, 'GET', { query: `taskId=${t.id}` })).body,
    ).toHaveLength(1)
    expect(
      (await call(h.taskById.GET, 'GET', { params: { id: t.id } })).body
        .noteCount,
    ).toBe(1)
    const up = await call(h.noteById.PATCH, 'PATCH', {
      params: { id: n.body.id },
      body: { color: 'mint' },
    })
    expect(up.body.color).toBe('mint')
    expect(
      (
        await call(h.noteById.PATCH, 'PATCH', {
          params: { id: n.body.id },
          body: { color: 'red' },
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await call(h.noteById.GET, 'GET', {
          user: 'bob',
          params: { id: n.body.id },
        })
      ).status,
    ).toBe(404)
    expect(
      (await call(h.noteById.DELETE, 'DELETE', { params: { id: n.body.id } }))
        .status,
    ).toBe(200)
    expect(
      (await call(h.noteById.GET, 'GET', { params: { id: n.body.id } })).status,
    ).toBe(404)
  })

  it('keeps a note when its task is deleted', async () => {
    const t = (await call(h.tasks.POST, 'POST', { body: { title: 'Temp' } }))
      .body
    const n = (
      await call(h.notes.POST, 'POST', {
        body: { title: 'Keep me', taskId: t.id },
      })
    ).body
    await call(h.taskById.DELETE, 'DELETE', { params: { id: t.id } })
    expect(
      (await call(h.noteById.GET, 'GET', { params: { id: n.id } })).body.taskId,
    ).toBeNull()
  })

  it('saves one private scratchpad per user', async () => {
    expect((await call(h.scratchpad.GET, 'GET')).body.body).toBe('')
    expect(
      (await call(h.scratchpad.PUT, 'PUT', { body: { body: 'call the bank' } }))
        .body.body,
    ).toBe('call the bank')
    expect(
      (await call(h.scratchpad.GET, 'GET', { user: 'bob' })).body.body,
    ).toBe('')
    expect(
      (await call(h.scratchpad.PUT, 'PUT', { body: { text: 1 } })).status,
    ).toBe(400)
    // The scratchpad never appears as a normal note.
    expect((await call(h.notes.GET, 'GET')).body).toHaveLength(0)
  })
})

describe('categories', () => {
  it('seeds three defaults, then creates, renames and deletes folders', async () => {
    const seeded = (await call(h.categories.GET, 'GET')).body
    expect(seeded.map((c: { name: string }) => c.name)).toEqual([
      'Personal',
      'Work',
      'Study',
    ])
    const c = await call(h.categories.POST, 'POST', {
      body: { name: 'Health', color: 'peach', icon: 'droplet' },
    })
    expect(c.status).toBe(201)
    expect(
      (await call(h.categories.POST, 'POST', { body: { name: '' } })).status,
    ).toBe(400)
    expect(
      (
        await call(h.categories.POST, 'POST', {
          body: { name: 'x', color: 'neon' },
        })
      ).status,
    ).toBe(400)
    const renamed = await call(h.categoryById.PATCH, 'PATCH', {
      params: { id: c.body.id },
      body: { name: 'Fitness' },
    })
    expect(renamed.body.name).toBe('Fitness')
    expect(
      (
        await call(h.categoryById.PATCH, 'PATCH', {
          user: 'bob',
          params: { id: c.body.id },
          body: { name: 'x' },
        })
      ).status,
    ).toBe(404)
  })

  it('moves tasks to Inbox when their folder is deleted', async () => {
    const c = (
      await call(h.categories.POST, 'POST', { body: { name: 'Temp' } })
    ).body
    const t = (
      await call(h.tasks.POST, 'POST', {
        body: { title: 'Inside', categoryId: c.id },
      })
    ).body
    expect(
      (
        await call(h.categoryById.DELETE, 'DELETE', {
          user: 'bob',
          params: { id: c.id },
        })
      ).status,
    ).toBe(404)
    expect(
      (await call(h.categoryById.DELETE, 'DELETE', { params: { id: c.id } }))
        .status,
    ).toBe(200)
    const after = (await call(h.taskById.GET, 'GET', { params: { id: t.id } }))
      .body
    expect(after.categoryId).toBeNull()
  })
})

describe('profile, search and data', () => {
  it('reads and updates preferences', async () => {
    expect((await call(h.me.GET, 'GET')).body).toMatchObject({
      theme: 'dark',
      sounds: true,
    })
    expect(
      (
        await call(h.me.PATCH, 'PATCH', {
          body: { displayName: 'Emmanuel', theme: 'light', sounds: false },
        })
      ).body,
    ).toMatchObject({ displayName: 'Emmanuel', theme: 'light', sounds: false })
    expect(
      (await call(h.me.PATCH, 'PATCH', { body: { theme: 'pink' } })).status,
    ).toBe(400)
  })

  it('searches tasks and notes together', async () => {
    await call(h.tasks.POST, 'POST', { body: { title: 'Send invoice' } })
    await call(h.notes.POST, 'POST', {
      body: { title: 'Client call', body: 'invoice sent monday' },
    })
    const r = await call(h.searchAll.GET, 'GET', { query: 'q=invoice' })
    expect(r.body.tasks).toHaveLength(1)
    expect(r.body.notes).toHaveLength(1)
    expect((await call(h.searchAll.GET, 'GET', { query: 'q=' })).status).toBe(
      400,
    )
  })

  it('exports and then deletes all of one user’s data only', async () => {
    await call(h.tasks.POST, 'POST', { body: { title: 'Mine' } })
    await call(h.tasks.POST, 'POST', { user: 'bob', body: { title: 'Bob’s' } })
    const exp = (await call(h.meData.GET, 'GET')).body
    expect(exp.tasks).toHaveLength(1)
    expect((await call(h.meData.DELETE, 'DELETE')).status).toBe(200)
    expect((await call(h.tasks.GET, 'GET')).body).toHaveLength(0)
    expect((await call(h.tasks.GET, 'GET', { user: 'bob' })).body).toHaveLength(
      1,
    )
  })
})
