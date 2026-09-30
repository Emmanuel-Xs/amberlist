import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDb as liveDb, resetDbForTests } from '../src/server/db'
import { resetRateLimits, setUserResolver } from '../src/server/http'
import * as h from '../src/server/handlers'
import { sendDueReminders, setPushSender } from '../src/server/push'

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
  resetRateLimits()
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
      [h.taskSkip.POST, 'POST'],
      [h.taskSnooze.POST, 'POST'],
      [h.pushConfig.GET, 'GET'],
      [h.pushSubscriptionRoute.POST, 'POST'],
      [h.pushSubscriptionRoute.DELETE, 'DELETE'],
      [h.pushTest.POST, 'POST'],
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

  it('marks the welcome screen as done with a name', async () => {
    const first = (await call(h.me.GET, 'GET')).body
    expect(first).toMatchObject({ onboarded: false, onboardedAt: null })
    const r = await call(h.me.PATCH, 'PATCH', {
      body: { displayName: 'Emmanuel', theme: 'light', onboarded: true },
    })
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({
      displayName: 'Emmanuel',
      theme: 'light',
      onboarded: true,
    })
    expect(r.body.onboardedAt).toEqual(expect.any(String))
    // Setting it again keeps the first time.
    const again = await call(h.me.PATCH, 'PATCH', { body: { onboarded: true } })
    expect(again.body.onboardedAt).toBe(r.body.onboardedAt)
    // Only this user is onboarded.
    expect((await call(h.me.GET, 'GET', { user: 'bob' })).body.onboarded).toBe(
      false,
    )
  })

  it('skipping the welcome screen needs no name', async () => {
    const r = await call(h.me.PATCH, 'PATCH', { body: { onboarded: true } })
    expect(r.body).toMatchObject({ onboarded: true, displayName: null })
    expect((await call(h.me.GET, 'GET')).body.onboarded).toBe(true)
  })

  it('treats guests who already have a task or note as onboarded', async () => {
    await call(h.tasks.POST, 'POST', { body: { title: 'Old task' } })
    await call(h.notes.POST, 'POST', { user: 'bob', body: { title: 'Idea' } })
    // The scratchpad alone does not count.
    await call(h.scratchpad.GET, 'GET', { user: 'carol' })
    expect((await call(h.me.GET, 'GET')).body.onboarded).toBe(true)
    expect((await call(h.me.GET, 'GET', { user: 'bob' })).body.onboarded).toBe(
      true,
    )
    expect(
      (await call(h.me.GET, 'GET', { user: 'carol' })).body.onboarded,
    ).toBe(false)
  })

  it('rejects a bad onboarding body and a missing session', async () => {
    for (const body of [
      { onboarded: false },
      { onboarded: 'yes' },
      { onboardedAt: '2026-01-01' },
      { displayName: 'x'.repeat(41), onboarded: true },
    ]) {
      expect((await call(h.me.PATCH, 'PATCH', { body })).status).toBe(400)
    }
    expect(
      (
        await call(h.me.PATCH, 'PATCH', {
          user: null,
          body: { onboarded: true },
        })
      ).status,
    ).toBe(401)
    expect((await call(h.me.GET, 'GET', { user: null })).status).toBe(401)
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

describe('custom colours for notes and folders', () => {
  // #cca8f0 is HSL(270, 70%, 80%); #333366 is far too dark; #6666ff sits at 70% but fails 4.5:1.
  const soft = '#cca8f0'
  const bad = [
    '#333366',
    '#6666ff',
    '#ffffff',
    'neon',
    '#abc',
    'd4b9f0',
    '#zzzzzz',
    42,
  ]

  it('notes accept a preset or a soft custom hex, and reject dark or garbage colours', async () => {
    const preset = await call(h.notes.POST, 'POST', { body: { color: 'mint' } })
    expect(preset.status).toBe(201)
    expect(preset.body.color).toBe('mint')
    const custom = await call(h.notes.POST, 'POST', { body: { color: soft } })
    expect(custom.status).toBe(201)
    expect(custom.body.color).toBe(soft)
    const upper = await call(h.noteById.PATCH, 'PATCH', {
      params: { id: preset.body.id },
      body: { color: '#CCA8F0' },
    })
    expect(upper.status).toBe(200)
    for (const color of bad) {
      expect(
        (await call(h.notes.POST, 'POST', { body: { color } })).status,
      ).toBe(400)
      expect(
        (
          await call(h.noteById.PATCH, 'PATCH', {
            params: { id: custom.body.id },
            body: { color },
          })
        ).status,
      ).toBe(400)
    }
    expect(
      (await call(h.noteById.GET, 'GET', { params: { id: custom.body.id } }))
        .body.color,
    ).toBe(soft)
    expect(
      (
        await call(h.noteById.PATCH, 'PATCH', {
          user: 'bob',
          params: { id: custom.body.id },
          body: { color: soft },
        })
      ).status,
    ).toBe(404)
    expect(
      (await call(h.notes.POST, 'POST', { user: null, body: { color: soft } }))
        .status,
    ).toBe(401)
  })

  it('folders accept a preset or a soft custom hex, and reject dark or garbage colours', async () => {
    const preset = await call(h.categories.POST, 'POST', {
      body: { name: 'Gym', color: 'peach' },
    })
    expect(preset.status).toBe(201)
    const custom = await call(h.categories.POST, 'POST', {
      body: { name: 'Garden', color: soft },
    })
    expect(custom.status).toBe(201)
    expect(custom.body.color).toBe(soft)
    const patched = await call(h.categoryById.PATCH, 'PATCH', {
      params: { id: preset.body.id },
      body: { color: soft },
    })
    expect(patched.body.color).toBe(soft)
    // Folders have no plain surface colour.
    expect(
      (
        await call(h.categories.POST, 'POST', {
          body: { name: 'x', color: 'surface' },
        })
      ).status,
    ).toBe(400)
    for (const color of bad) {
      expect(
        (
          await call(h.categories.POST, 'POST', {
            body: { name: 'x', color },
          })
        ).status,
      ).toBe(400)
      expect(
        (
          await call(h.categoryById.PATCH, 'PATCH', {
            params: { id: custom.body.id },
            body: { color },
          })
        ).status,
      ).toBe(400)
    }
    expect(
      (
        await call(h.categoryById.PATCH, 'PATCH', {
          user: 'bob',
          params: { id: custom.body.id },
          body: { color: soft },
        })
      ).status,
    ).toBe(404)
    expect(
      (
        await call(h.categories.POST, 'POST', {
          user: null,
          body: { name: 'x', color: soft },
        })
      ).status,
    ).toBe(401)
  })
})

// ---- AI (Phase 3): the model call is mocked; nothing leaves the machine ----
const aiMock = vi.hoisted(() => ({ generateText: vi.fn() }))
vi.mock('ai', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  generateText: aiMock.generateText,
}))

describe('ai', () => {
  const keys = ['GROQ_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY', 'XAI_API_KEY']
  beforeEach(() => {
    for (const k of keys) delete process.env[k]
    process.env.GROQ_API_KEY = 'test-key'
    aiMock.generateText.mockReset()
  })
  afterEach(() => {
    for (const k of keys) delete process.env[k]
  })
  const reply = (output: unknown) =>
    aiMock.generateText.mockResolvedValueOnce({ output })
  const newTask = async (user: string, title: string) =>
    (await call(h.tasks.POST, 'POST', { user, body: { title } })).body as {
      id: string
    }

  it('needs a session on every AI endpoint', async () => {
    for (const [fn, method] of [
      [h.aiStatus.GET, 'GET'],
      [h.aiBreakdown.POST, 'POST'],
      [h.aiExtract.POST, 'POST'],
    ] as [Handler, string][]) {
      const r = await call(fn, method, {
        user: null,
        body: method === 'POST' ? { taskId: 'x', text: 'x' } : undefined,
      })
      expect(r.status).toBe(401)
    }
    expect(aiMock.generateText).not.toHaveBeenCalled()
  })

  it('reports whether AI is on and the calls left today', async () => {
    let r = await call(h.aiStatus.GET, 'GET')
    expect(r.body).toEqual({ enabled: true, limit: 20, remaining: 20 })
    delete process.env.GROQ_API_KEY
    r = await call(h.aiStatus.GET, 'GET')
    expect(r.body.enabled).toBe(false)
    process.env.XAI_API_KEY = 'x'
    expect((await call(h.aiStatus.GET, 'GET')).body.enabled).toBe(true)
  })

  it('breaks a task into subtasks, sending only that task', async () => {
    const t = await newTask('alice', 'Plan birthday party')
    await call(h.taskSubtasks.POST, 'POST', {
      params: { id: t.id },
      body: { title: 'Pick a date' },
    })
    await newTask('alice', 'Secret other task')
    reply({
      subtasks: [
        '1. Make a guest list',
        'pick a date',
        '- Book a venue',
        '  ',
        'Order the cake',
        'Send invites',
        'Buy decorations',
        'Plan games',
        'Make a playlist',
        'Clean up',
      ],
    })
    const r = await call(h.aiBreakdown.POST, 'POST', { body: { taskId: t.id } })
    expect(r.status).toBe(200)
    expect(r.body.subtasks).toEqual([
      'Make a guest list',
      'Book a venue',
      'Order the cake',
      'Send invites',
      'Buy decorations',
      'Plan games',
      'Make a playlist',
    ])
    expect(r.body.remaining).toBe(19)
    const sent = aiMock.generateText.mock.calls[0][0] as { prompt: string }
    expect(sent.prompt).toContain('Plan birthday party')
    expect(sent.prompt).toContain('Pick a date')
    expect(sent.prompt).not.toContain('Secret other task')
  })

  it('rejects bad breakdown input and other users tasks', async () => {
    for (const body of [{}, { taskId: '' }, { taskId: 'x', extra: 1 }, 'nope'])
      expect((await call(h.aiBreakdown.POST, 'POST', { body })).status).toBe(
        400,
      )
    const bobs = await newTask('bob', 'Bob task')
    const r = await call(h.aiBreakdown.POST, 'POST', {
      body: { taskId: bobs.id },
    })
    expect(r.status).toBe(404)
    expect(aiMock.generateText).not.toHaveBeenCalled()
    expect((await call(h.aiStatus.GET, 'GET')).body.remaining).toBe(20)
  })

  it('turns text into tasks with dates and priority', async () => {
    reply({
      tasks: [
        { title: ' Email the tutor ', date: '2026-10-01', priority: null },
        { title: 'Pay rent', date: 'Friday', priority: 'high' },
        { title: '   ', date: null, priority: null },
      ],
    })
    const r = await call(h.aiExtract.POST, 'POST', {
      body: { text: 'email tutor tomorrow\nPAY RENT!!', today: '2026-09-30' },
    })
    expect(r.status).toBe(200)
    expect(r.body.tasks).toEqual([
      { title: 'Email the tutor', date: '2026-10-01' },
      { title: 'Pay rent', priority: 'high' },
    ])
    const sent = aiMock.generateText.mock.calls[0][0] as {
      prompt: string
      system: string
    }
    expect(sent.prompt).toContain('email tutor tomorrow')
    expect(sent.system).toContain('2026-09-30')
  })

  it('rejects bad extract input', async () => {
    for (const body of [
      {},
      { text: '   ' },
      { text: 'x'.repeat(4001) },
      { text: 'ok', today: 'tomorrow' },
      { text: 'ok', userId: 'bob' },
    ])
      expect((await call(h.aiExtract.POST, 'POST', { body })).status).toBe(400)
    expect(aiMock.generateText).not.toHaveBeenCalled()
  })

  it('stops at 20 calls a day with a friendly 429', async () => {
    const { getDb } = await import('../src/server/db')
    const { aiUsage } = await import('../src/server/schema')
    await getDb()
      .insert(aiUsage)
      .values({
        userId: 'alice',
        day: new Date().toISOString().slice(0, 10),
        count: 20,
      })
    const t = await newTask('alice', 'Anything')
    const r = await call(h.aiBreakdown.POST, 'POST', { body: { taskId: t.id } })
    expect(r.status).toBe(429)
    expect(r.body.error).toMatch(/tomorrow/)
    expect(
      (await call(h.aiExtract.POST, 'POST', { body: { text: 'x' } })).status,
    ).toBe(429)
    expect(aiMock.generateText).not.toHaveBeenCalled()
    // Bob has his own allowance.
    reply({ tasks: [{ title: 'Call mum', date: null, priority: null }] })
    expect(
      (
        await call(h.aiExtract.POST, 'POST', {
          user: 'bob',
          body: { text: 'x' },
        })
      ).status,
    ).toBe(200)
  })

  it('falls back to the next provider and refunds a failed call', async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'g'
    aiMock.generateText.mockRejectedValueOnce(new Error('groq down'))
    reply({ tasks: [{ title: 'Water plants', date: null, priority: null }] })
    let r = await call(h.aiExtract.POST, 'POST', { body: { text: 'plants' } })
    expect(r.status).toBe(200)
    expect(aiMock.generateText).toHaveBeenCalledTimes(2)
    aiMock.generateText.mockRejectedValue(new Error('all down'))
    r = await call(h.aiExtract.POST, 'POST', { body: { text: 'plants' } })
    expect(r.status).toBe(502)
    expect((await call(h.aiStatus.GET, 'GET')).body.remaining).toBe(19)
  })

  it('is off without a key', async () => {
    delete process.env.GROQ_API_KEY
    const t = await newTask('alice', 'Anything')
    expect(
      (await call(h.aiBreakdown.POST, 'POST', { body: { taskId: t.id } }))
        .status,
    ).toBe(404)
  })
})

describe('habits', () => {
  const today = new Date().toISOString().slice(0, 10)
  const daysAgo = (n: number) =>
    new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)

  it('needs a session for every habit endpoint', async () => {
    const endpoints: [Handler, string][] = [
      [h.habits.GET, 'GET'],
      [h.habits.POST, 'POST'],
      [h.habitById.GET, 'GET'],
      [h.habitById.PATCH, 'PATCH'],
      [h.habitById.DELETE, 'DELETE'],
      [h.habitCheckins.POST, 'POST'],
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

  it('creates, lists, reads, updates, archives and deletes a habit', async () => {
    const created = await call(h.habits.POST, 'POST', {
      body: { name: 'Read', icon: 'book', goalDays: 21 },
    })
    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({
      name: 'Read',
      icon: 'book',
      frequency: 'daily',
      goalDays: 21,
      archived: false,
      checkins: [],
      daysOfWeek: null,
      timesPerWeek: null,
    })
    const id = created.body.id

    const list = await call(h.habits.GET, 'GET')
    expect(list.status).toBe(200)
    expect(list.body).toHaveLength(1)
    expect(
      (await call(h.habitById.GET, 'GET', { params: { id } })).body.name,
    ).toBe('Read')

    // Weekdays default to Monday to Friday; switching to x a week clears the days.
    const weekdays = await call(h.habitById.PATCH, 'PATCH', {
      params: { id },
      body: { frequency: 'weekdays' },
    })
    expect(weekdays.status).toBe(200)
    expect(weekdays.body.daysOfWeek).toEqual([1, 2, 3, 4, 5])
    const mwf = await call(h.habitById.PATCH, 'PATCH', {
      params: { id },
      body: { daysOfWeek: [5, 1, 3, 3] },
    })
    expect(mwf.body.daysOfWeek).toEqual([1, 3, 5])
    const weekly = await call(h.habitById.PATCH, 'PATCH', {
      params: { id },
      body: { frequency: 'x_per_week', timesPerWeek: 4, goalDays: null },
    })
    expect(weekly.body).toMatchObject({
      frequency: 'x_per_week',
      timesPerWeek: 4,
      daysOfWeek: null,
      goalDays: null,
    })

    const archived = await call(h.habitById.PATCH, 'PATCH', {
      params: { id },
      body: { archived: true },
    })
    expect(archived.body.archived).toBe(true)
    expect((await call(h.habits.GET, 'GET')).body).toHaveLength(0)
    expect(
      (await call(h.habits.GET, 'GET', { query: 'archived=1' })).body,
    ).toHaveLength(1)

    expect(
      (await call(h.habitById.DELETE, 'DELETE', { params: { id } })).status,
    ).toBe(200)
    expect(
      (await call(h.habitById.GET, 'GET', { params: { id } })).status,
    ).toBe(404)
  })

  it('toggles a check in per day and keeps one row per day', async () => {
    const { body: habit } = await call(h.habits.POST, 'POST', {
      body: { name: 'Water', icon: 'droplet' },
    })
    const params = { id: habit.id }
    const on = await call(h.habitCheckins.POST, 'POST', {
      params,
      body: { date: today },
    })
    expect(on.status).toBe(200)
    expect(on.body.checkins).toEqual([today])
    // Tapping again the same day undoes it.
    const off = await call(h.habitCheckins.POST, 'POST', {
      params,
      body: { date: today },
    })
    expect(off.body.checkins).toEqual([])
    // Explicit done is idempotent.
    for (let i = 0; i < 2; i++)
      await call(h.habitCheckins.POST, 'POST', {
        params,
        body: { date: today, done: true },
      })
    for (const n of [1, 2]) {
      await call(h.habitCheckins.POST, 'POST', {
        params,
        body: { date: daysAgo(n), done: true },
      })
    }
    const read = await call(h.habitById.GET, 'GET', { params })
    expect(read.body.checkins).toEqual([daysAgo(2), daysAgo(1), today])
    const undo = await call(h.habitCheckins.POST, 'POST', {
      params,
      body: { date: daysAgo(1), done: false },
    })
    expect(undo.body.checkins).toEqual([daysAgo(2), today])
    // Deleting the habit removes its check ins too.
    await call(h.habitById.DELETE, 'DELETE', { params })
    const again = await call(h.habits.POST, 'POST', { body: { name: 'Water' } })
    expect(again.body.checkins).toEqual([])
  })

  it('validates habit and check in input', async () => {
    const bad = [
      {},
      { name: '' },
      { name: 'x'.repeat(81) },
      { name: 'Run', frequency: 'hourly' },
      { name: 'Run', icon: 'rocket' },
      { name: 'Run', daysOfWeek: [] },
      { name: 'Run', daysOfWeek: [0] },
      { name: 'Run', timesPerWeek: 8 },
      { name: 'Run', goalDays: 0 },
      { name: 'Run', reminderTime: '25:00' },
      { name: 'Run', color: '#000000' },
      { name: 'Run', archived: true },
      { name: 'Run', userId: 'bob' },
    ]
    for (const body of bad)
      expect(
        (await call(h.habits.POST, 'POST', { body })).status,
        JSON.stringify(body),
      ).toBe(400)
    expect(
      (await call(h.habits.POST, 'POST', { body: 'not json' })).status,
    ).toBe(400)
    expect(
      (await call(h.habits.GET, 'GET', { query: 'archived=maybe' })).status,
    ).toBe(400)

    const { body: habit } = await call(h.habits.POST, 'POST', {
      body: { name: 'Run' },
    })
    const params = { id: habit.id }
    expect(
      (await call(h.habitById.PATCH, 'PATCH', { params, body: { name: ' ' } }))
        .status,
    ).toBe(400)
    expect(
      (
        await call(h.habitById.PATCH, 'PATCH', {
          params,
          body: { checkins: [] },
        })
      ).status,
    ).toBe(400)
    for (const body of [
      {},
      { date: 'today' },
      { date: '2026-02-30' },
      { date: '2999-01-01' },
      { date: today, done: 'yes' },
      { date: today, extra: 1 },
    ])
      expect(
        (await call(h.habitCheckins.POST, 'POST', { params, body })).status,
        JSON.stringify(body),
      ).toBe(400)
  })

  it('refuses a folder that belongs to someone else, and clears a deleted folder', async () => {
    const { body: bobFolder } = await call(h.categories.POST, 'POST', {
      user: 'bob',
      body: { name: 'Bob' },
    })
    expect(
      (
        await call(h.habits.POST, 'POST', {
          body: { name: 'Run', categoryId: bobFolder.id },
        })
      ).status,
    ).toBe(404)
    const { body: folder } = await call(h.categories.POST, 'POST', {
      body: { name: 'Health' },
    })
    const { body: habit } = await call(h.habits.POST, 'POST', {
      body: { name: 'Run', categoryId: folder.id },
    })
    expect(habit.categoryId).toBe(folder.id)
    await call(h.categoryById.DELETE, 'DELETE', { params: { id: folder.id } })
    expect(
      (await call(h.habitById.GET, 'GET', { params: { id: habit.id } })).body
        .categoryId,
    ).toBe(null)
  })

  it('never shows or changes another user’s habit', async () => {
    const { body: habit } = await call(h.habits.POST, 'POST', {
      body: { name: 'Mine' },
    })
    const params = { id: habit.id }
    expect((await call(h.habits.GET, 'GET', { user: 'bob' })).body).toEqual([])
    expect(
      (await call(h.habitById.GET, 'GET', { user: 'bob', params })).status,
    ).toBe(404)
    expect(
      (
        await call(h.habitById.PATCH, 'PATCH', {
          user: 'bob',
          params,
          body: { name: 'Hacked' },
        })
      ).status,
    ).toBe(404)
    expect(
      (
        await call(h.habitCheckins.POST, 'POST', {
          user: 'bob',
          params,
          body: { date: today },
        })
      ).status,
    ).toBe(404)
    expect(
      (await call(h.habitById.DELETE, 'DELETE', { user: 'bob', params }))
        .status,
    ).toBe(404)
    const mine = await call(h.habitById.GET, 'GET', { params })
    expect(mine.body).toMatchObject({ name: 'Mine', checkins: [] })
  })

  it('exports habits and wipes them with all data', async () => {
    const { body: habit } = await call(h.habits.POST, 'POST', {
      body: { name: 'Stretch' },
    })
    await call(h.habitCheckins.POST, 'POST', {
      params: { id: habit.id },
      body: { date: today },
    })
    await call(h.habits.POST, 'POST', {
      user: 'bob',
      body: { name: 'Bob habit' },
    })
    const exported = await call(h.meData.GET, 'GET')
    expect(exported.body.habits).toHaveLength(1)
    expect(exported.body.habits[0].checkins).toEqual([today])
    await call(h.meData.DELETE, 'DELETE')
    expect((await call(h.habits.GET, 'GET')).body).toEqual([])
    expect(
      (await call(h.habits.GET, 'GET', { user: 'bob' })).body,
    ).toHaveLength(1)
  })
})

describe('google sign in: linking and merging a guest', () => {
  const day = new Date().toISOString().slice(0, 10)
  async function seed(user: string, label: string) {
    const { body: work } = await call(h.categories.GET, 'GET', { user })
    const folder = work.find((c: { name: string }) => c.name === 'Work')
    const { body: t } = await call(h.tasks.POST, 'POST', {
      user,
      body: {
        title: `${label} task`,
        categoryId: folder.id,
        subtasks: ['step'],
      },
    })
    await call(h.notes.POST, 'POST', { user, body: { title: `${label} note` } })
    await call(h.scratchpad.PUT, 'PUT', {
      user,
      body: { body: `${label} pad` },
    })
    const { body: habit } = await call(h.habits.POST, 'POST', {
      user,
      body: { name: `${label} habit` },
    })
    await call(h.habitCheckins.POST, 'POST', {
      user,
      params: { id: habit.id },
      body: { date: day },
    })
    return t
  }

  it('mergeGuestData moves every row and dedupes folders by name', async () => {
    const { getDb } = await import('../src/server/db')
    const s = await import('../src/server/services')
    await seed('alice', 'Account')
    await call(h.me.PATCH, 'PATCH', {
      user: 'alice',
      body: { displayName: 'Alice' },
    })
    const guestTask = await seed('guest', 'Guest')
    await call(h.categories.POST, 'POST', {
      user: 'guest',
      body: { name: 'Gym' },
    })
    await call(h.me.PATCH, 'PATCH', {
      user: 'guest',
      body: { displayName: 'G' },
    })

    await s.mergeGuestData(getDb(), 'guest', 'alice')

    const tasks = (await call(h.tasks.GET, 'GET')).body
    expect(tasks.map((t: { title: string }) => t.title).sort()).toEqual([
      'Account task',
      'Guest task',
    ])
    const moved = tasks.find((t: { id: string }) => t.id === guestTask.id)
    expect(moved.subtasks).toHaveLength(1)
    const cats = (await call(h.categories.GET, 'GET')).body
    const names = cats.map((c: { name: string }) => c.name)
    expect(names.filter((n: string) => n === 'Work')).toHaveLength(1)
    expect(names).toContain('Gym')
    // The guest's task now points at the account's Work folder.
    expect(moved.categoryId).toBe(
      cats.find((c: { name: string }) => c.name === 'Work').id,
    )
    expect((await call(h.notes.GET, 'GET')).body).toHaveLength(2)
    expect((await call(h.scratchpad.GET, 'GET')).body.body).toBe(
      'Account pad\n\nGuest pad',
    )
    const habits = (await call(h.habits.GET, 'GET')).body
    expect(habits).toHaveLength(2)
    expect(
      habits.every((x: { checkins: string[] }) => x.checkins.length === 1),
    ).toBe(true)
    // Prefs: the account keeps its own.
    expect((await call(h.me.GET, 'GET')).body.displayName).toBe('Alice')
    // Nothing is left behind on the guest.
    expect(
      (await call(h.tasks.GET, 'GET', { user: 'guest' })).body,
    ).toHaveLength(0)
    expect(
      (await call(h.habits.GET, 'GET', { user: 'guest' })).body,
    ).toHaveLength(0)
  })

  it('a fresh account takes the guest data at once, prefs included', async () => {
    const { getDb } = await import('../src/server/db')
    const s = await import('../src/server/services')
    await seed('guest', 'Guest')
    await call(h.me.PATCH, 'PATCH', {
      user: 'guest',
      body: { displayName: 'Guesty' },
    })
    expect(await s.linkGuestAccount(getDb(), 'guest', 'fresh')).toBe('merged')
    const me = (await call(h.me.GET, 'GET', { user: 'fresh' })).body
    expect(me.displayName).toBe('Guesty')
    expect(me.pendingMerge).toBeNull()
    expect(
      (await call(h.tasks.GET, 'GET', { user: 'fresh' })).body,
    ).toHaveLength(1)
    // Defaults are not seeded twice.
    const cats = (await call(h.categories.GET, 'GET', { user: 'fresh' })).body
    expect(
      cats.filter((c: { name: string }) => c.name === 'Work'),
    ).toHaveLength(1)
  })

  it('an empty guest is dropped without a prompt', async () => {
    const { getDb } = await import('../src/server/db')
    const s = await import('../src/server/services')
    await seed('alice', 'Account')
    await call(h.categories.GET, 'GET', { user: 'guest' })
    expect(await s.linkGuestAccount(getDb(), 'guest', 'alice')).toBe(
      'discarded',
    )
    expect((await call(h.me.GET, 'GET')).body.pendingMerge).toBeNull()
  })

  it('both sides with data: waits for the prompt, then merges', async () => {
    const { getDb } = await import('../src/server/db')
    const s = await import('../src/server/services')
    await seed('alice', 'Account')
    await seed('guest', 'Guest')
    expect(await s.linkGuestAccount(getDb(), 'guest', 'alice')).toBe('pending')
    const me = (await call(h.me.GET, 'GET')).body
    expect(me.pendingMerge).toEqual({ tasks: 1, notes: 1 })
    // Nothing moved yet.
    expect((await call(h.tasks.GET, 'GET')).body).toHaveLength(1)

    const r = await call(h.meMerge.POST, 'POST', { body: { choice: 'merge' } })
    expect(r.status).toBe(200)
    expect(r.body.pendingMerge).toBeNull()
    expect((await call(h.tasks.GET, 'GET')).body).toHaveLength(2)
    // Answered once: a second answer finds nothing waiting.
    expect(
      (await call(h.meMerge.POST, 'POST', { body: { choice: 'merge' } }))
        .status,
    ).toBe(404)
  })

  it('discard keeps only the account data', async () => {
    const { getDb } = await import('../src/server/db')
    const s = await import('../src/server/services')
    await seed('alice', 'Account')
    await seed('guest', 'Guest')
    await s.linkGuestAccount(getDb(), 'guest', 'alice')
    const r = await call(h.meMerge.POST, 'POST', {
      body: { choice: 'discard' },
    })
    expect(r.status).toBe(200)
    const titles = (await call(h.tasks.GET, 'GET')).body.map(
      (t: { title: string }) => t.title,
    )
    expect(titles).toEqual(['Account task'])
    expect(
      (await call(h.tasks.GET, 'GET', { user: 'guest' })).body,
    ).toHaveLength(0)
  })

  it('POST /api/me/merge: 400 on bad input, 401 without a session, 404 for another user', async () => {
    const { getDb } = await import('../src/server/db')
    const s = await import('../src/server/services')
    await seed('alice', 'Account')
    await seed('guest', 'Guest')
    await s.linkGuestAccount(getDb(), 'guest', 'alice')
    expect(
      (await call(h.meMerge.POST, 'POST', { body: { choice: 'keep' } })).status,
    ).toBe(400)
    expect(
      (
        await call(h.meMerge.POST, 'POST', {
          body: { choice: 'merge', fromUserId: 'guest' },
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await call(h.meMerge.POST, 'POST', {
          user: null,
          body: { choice: 'merge' },
        })
      ).status,
    ).toBe(401)
    // Bob has nothing waiting, so he can't pull Alice's pending guest.
    expect(
      (
        await call(h.meMerge.POST, 'POST', {
          user: 'bob',
          body: { choice: 'merge' },
        })
      ).status,
    ).toBe(404)
    expect((await call(h.tasks.GET, 'GET', { user: 'bob' })).body).toHaveLength(
      0,
    )
  })

  it('GET /api/me says guest, and Google is off without the keys', async () => {
    const me = (await call(h.me.GET, 'GET')).body
    expect(me).toMatchObject({
      isGuest: true,
      isAnonymous: true,
      email: null,
      image: null,
      googleEnabled: false,
      pendingMerge: null,
      nudgeState: null,
    })
  })

  it('remembers a dismissed nudge', async () => {
    const r = await call(h.me.PATCH, 'PATCH', {
      body: { nudgeDismissed: 'task' },
    })
    expect(r.status).toBe(200)
    expect(r.body.nudgeState.task).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(
      (await call(h.me.PATCH, 'PATCH', { body: { nudgeDismissed: 'later' } }))
        .status,
    ).toBe(400)
  })
})

// ---------- Repeating tasks ----------
const ymd = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10)

describe('repeating tasks', () => {
  const make = async (body: Record<string, unknown>, user = 'alice') =>
    call(h.tasks.POST, 'POST', {
      user,
      body: {
        title: 'Standup',
        startDate: ymd(0),
        startTime: '09:30',
        ...body,
      },
    })

  it('needs a start date and a sane rule', async () => {
    const noDate = await call(h.tasks.POST, 'POST', {
      body: { title: 'x', repeatRule: { kind: 'daily' } },
    })
    expect(noDate.status).toBe(400)
    const noDays = await make({ repeatRule: { kind: 'weekly', days: [] } })
    expect(noDays.status).toBe(400)
    const junk = await make({ repeatRule: { kind: 'yearly' } })
    expect(junk.status).toBe(400)
    const extra = await make({ repeatRule: { kind: 'daily', nope: 1 } })
    expect(extra.status).toBe(400)
  })

  it('creates the next task in the same request when a repeat is completed', async () => {
    const created = await make({
      repeatRule: { kind: 'daily' },
      dueDate: ymd(0),
      priority: 'high',
      subtasks: ['Prep', 'Send'],
    })
    expect(created.status).toBe(201)
    expect(created.body.repeatRule).toEqual({ kind: 'daily' })
    const id = created.body.id
    const sub = created.body.subtasks[0].id
    await call(h.subtaskById.PATCH, 'PATCH', {
      params: { id: sub },
      body: { done: true },
    })

    const done = await call(h.taskById.PATCH, 'PATCH', {
      params: { id },
      body: { status: 'done' },
    })
    expect(done.status).toBe(200)
    expect(done.body.status).toBe('done')
    expect(done.body.next).toMatchObject({
      title: 'Standup',
      status: 'todo',
      startDate: ymd(1),
      dueDate: ymd(1),
      startTime: '09:30',
      priority: 'high',
    })
    expect(
      done.body.next.subtasks.map((x: { done: boolean }) => x.done),
    ).toEqual([false, false])
    // One open task per series.
    const open = (await call(h.tasks.GET, 'GET', { query: 'status=todo' })).body
    expect(open).toHaveLength(1)

    // Undo: reopen, and delete the new one.
    const reopened = await call(h.taskById.PATCH, 'PATCH', {
      params: { id },
      body: { status: 'todo' },
    })
    expect(reopened.body.next).toBeNull()
    await call(h.taskById.DELETE, 'DELETE', {
      params: { id: done.body.next.id },
    })
    expect((await call(h.tasks.GET, 'GET')).body).toHaveLength(1)
  })

  it('counts down "after N times" and stops on the last one', async () => {
    const created = await make({
      repeatRule: { kind: 'daily' },
      repeatEnd: { kind: 'after', count: 2 },
    })
    const first = await call(h.taskById.PATCH, 'PATCH', {
      params: { id: created.body.id },
      body: { status: 'done' },
    })
    expect(first.body.next.repeatEnd).toEqual({ kind: 'after', count: 1 })
    const last = await call(h.taskById.PATCH, 'PATCH', {
      params: { id: first.body.next.id },
      body: { status: 'done' },
    })
    expect(last.body.next).toBeNull()
  })

  it('makes no new task after the end date or once repeating is stopped', async () => {
    const ended = await make({
      repeatRule: { kind: 'daily' },
      repeatEnd: { kind: 'on', date: ymd(0) },
    })
    expect(
      (
        await call(h.taskById.PATCH, 'PATCH', {
          params: { id: ended.body.id },
          body: { status: 'done' },
        })
      ).body.next,
    ).toBeNull()

    const stopped = await make({ repeatRule: { kind: 'daily' } })
    const off = await call(h.taskById.PATCH, 'PATCH', {
      params: { id: stopped.body.id },
      body: { repeatRule: null, repeatEnd: null },
    })
    expect(off.body.repeatRule).toBeNull()
    expect(
      (
        await call(h.taskById.PATCH, 'PATCH', {
          params: { id: stopped.body.id },
          body: { status: 'done' },
        })
      ).body.next,
    ).toBeNull()
  })

  it('jumps past today when the task was overdue', async () => {
    const created = await make({
      startDate: ymd(-3),
      dueDate: ymd(-3),
      repeatRule: { kind: 'daily' },
    })
    const done = await call(h.taskById.PATCH, 'PATCH', {
      params: { id: created.body.id },
      body: { status: 'done' },
    })
    expect(done.body.next.startDate).toBe(ymd(1))
    expect(done.body.next.dueDate).toBe(ymd(1))
  })

  it('a monthly rule remembers its day of the month', async () => {
    const created = await make({
      startDate: '2027-01-31',
      repeatRule: { kind: 'monthly' },
    })
    expect(created.body.repeatRule).toEqual({ kind: 'monthly', day: 31 })
  })

  it('skips to the next day without completing', async () => {
    const created = await make({
      repeatRule: { kind: 'daily' },
      repeatEnd: { kind: 'after', count: 3 },
    })
    const id = created.body.id
    const skipped = await call(h.taskSkip.POST, 'POST', { params: { id } })
    expect(skipped.status).toBe(200)
    expect(skipped.body).toMatchObject({
      status: 'todo',
      startDate: ymd(1),
      completedAt: null,
      repeatEnd: { kind: 'after', count: 2 },
    })
    expect(
      (await call(h.tasks.GET, 'GET', { query: 'status=done' })).body,
    ).toHaveLength(0)
  })

  it('refuses to skip a plain task or the last one, and other people’s tasks', async () => {
    const plain = await make({})
    expect(
      (await call(h.taskSkip.POST, 'POST', { params: { id: plain.body.id } }))
        .status,
    ).toBe(400)
    const last = await make({
      repeatRule: { kind: 'daily' },
      repeatEnd: { kind: 'after', count: 1 },
    })
    expect(
      (await call(h.taskSkip.POST, 'POST', { params: { id: last.body.id } }))
        .status,
    ).toBe(400)
    const mine = await make({ repeatRule: { kind: 'daily' } })
    expect(
      (
        await call(h.taskSkip.POST, 'POST', {
          user: 'bob',
          params: { id: mine.body.id },
        })
      ).status,
    ).toBe(404)
    expect(
      (await call(h.taskSkip.POST, 'POST', { params: { id: 'missing' } }))
        .status,
    ).toBe(404)
  })
})

// ---------- Reminders and push ----------
describe('reminders', () => {
  it('works out when to fire from the start time, offset and time zone', async () => {
    await call(h.me.PATCH, 'PATCH', { body: { timezone: 'Africa/Lagos' } })
    const t = await call(h.tasks.POST, 'POST', {
      body: {
        title: 'Call bank',
        startDate: ymd(2),
        startTime: '10:00',
        remindOffset: 10,
      },
    })
    expect(t.status).toBe(201)
    expect(t.body).toMatchObject({ remind: true, remindOffset: 10 })
    expect(new Date(t.body.remindAt).toISOString()).toBe(
      `${ymd(2)}T08:50:00.000Z`,
    )

    const off = await call(h.taskById.PATCH, 'PATCH', {
      params: { id: t.body.id },
      body: { remindOffset: null },
    })
    expect(off.body).toMatchObject({
      remind: false,
      remindOffset: null,
      remindAt: null,
    })
  })

  it('uses 09:00 without a time, and accepts the old on/off switch', async () => {
    const t = await call(h.tasks.POST, 'POST', {
      body: { title: 'No time', startDate: ymd(3), remind: true },
    })
    expect(t.body.remindOffset).toBe(0)
    expect(new Date(t.body.remindAt).toISOString()).toBe(
      `${ymd(3)}T09:00:00.000Z`,
    )
  })

  it('never arms a reminder for a done task, an undated task or the past', async () => {
    const done = await call(h.tasks.POST, 'POST', {
      body: { title: 'a', startDate: ymd(2), remindOffset: 0, status: 'done' },
    })
    expect(done.body.remindAt).toBeNull()
    const undated = await call(h.tasks.POST, 'POST', {
      body: { title: 'b', remindOffset: 0 },
    })
    expect(undated.body.remindAt).toBeNull()
    const past = await call(h.tasks.POST, 'POST', {
      body: { title: 'c', startDate: ymd(-2), remindOffset: 0 },
    })
    expect(past.body.remindAt).toBeNull()
  })

  it('moves the reminder with the task and clears it when done', async () => {
    const t = await call(h.tasks.POST, 'POST', {
      body: {
        title: 'x',
        startDate: ymd(2),
        startTime: '10:00',
        remindOffset: 60,
      },
    })
    const moved = await call(h.taskById.PATCH, 'PATCH', {
      params: { id: t.body.id },
      body: { startDate: ymd(4) },
    })
    expect(new Date(moved.body.remindAt).toISOString()).toBe(
      `${ymd(4)}T09:00:00.000Z`,
    )
    const done = await call(h.taskById.PATCH, 'PATCH', {
      params: { id: t.body.id },
      body: { status: 'done' },
    })
    expect(done.body.remindAt).toBeNull()
  })

  it('validates the offset and the time zone', async () => {
    expect(
      (
        await call(h.tasks.POST, 'POST', {
          body: { title: 'x', remindOffset: -5 },
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await call(h.tasks.POST, 'POST', {
          body: { title: 'x', remindOffset: 1.5 },
        })
      ).status,
    ).toBe(400)
    expect(
      (await call(h.me.PATCH, 'PATCH', { body: { timezone: 'Mars/Base' } }))
        .status,
    ).toBe(400)
    expect(
      (await call(h.me.PATCH, 'PATCH', { body: { timezone: 'Europe/London' } }))
        .status,
    ).toBe(200)
  })

  it('snoozes a task', async () => {
    const t = await call(h.tasks.POST, 'POST', { body: { title: 'x' } })
    const id = t.body.id
    const r = await call(h.taskSnooze.POST, 'POST', {
      params: { id },
      body: { minutes: 10 },
    })
    expect(r.status).toBe(200)
    const gap = new Date(r.body.remindAt).getTime() - Date.now()
    expect(gap).toBeGreaterThan(9 * 60_000)
    expect(gap).toBeLessThan(11 * 60_000)
    expect(r.body.remind).toBe(true)

    expect(
      (
        await call(h.taskSnooze.POST, 'POST', {
          params: { id },
          body: { minutes: 0 },
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await call(h.taskSnooze.POST, 'POST', {
          params: { id },
          body: { minutes: 5, extra: 1 },
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await call(h.taskSnooze.POST, 'POST', {
          user: 'bob',
          params: { id },
          body: { minutes: 10 },
        })
      ).status,
    ).toBe(404)
    await call(h.taskById.PATCH, 'PATCH', {
      params: { id },
      body: { status: 'done' },
    })
    expect(
      (
        await call(h.taskSnooze.POST, 'POST', {
          params: { id },
          body: { minutes: 10 },
        })
      ).status,
    ).toBe(404)
  })
})

describe('push subscriptions and delivery', () => {
  const sub = (n = 1) => ({
    endpoint: `https://push.example.com/send/${n}`,
    keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
  })
  const sent: { endpoint: string; title: string; body: string }[] = []
  beforeEach(() => {
    sent.length = 0
    setPushSender(async (target, payload) => {
      sent.push({
        endpoint: target.endpoint,
        title: payload.title,
        body: payload.body,
      })
      return !target.endpoint.endsWith('/gone')
    })
  })
  afterEach(() => setPushSender(null))

  it('saves and removes a subscription', async () => {
    expect(
      (await call(h.pushSubscriptionRoute.POST, 'POST', { body: sub() }))
        .status,
    ).toBe(201)
    expect(
      (await call(h.pushSubscriptionRoute.POST, 'POST', { body: sub() }))
        .status,
    ).toBe(201)
    expect((await call(h.pushTest.POST, 'POST')).body.reached).toBe(1)
    expect(
      (
        await call(h.pushSubscriptionRoute.DELETE, 'DELETE', {
          body: { endpoint: sub().endpoint },
        })
      ).status,
    ).toBe(200)
    expect((await call(h.pushTest.POST, 'POST')).body.reached).toBe(0)
  })

  it('validates a subscription', async () => {
    expect(
      (await call(h.pushSubscriptionRoute.POST, 'POST', { body: {} })).status,
    ).toBe(400)
    expect(
      (
        await call(h.pushSubscriptionRoute.POST, 'POST', {
          body: { endpoint: 'not a url', keys: { p256dh: 'a', auth: 'b' } },
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await call(h.pushSubscriptionRoute.DELETE, 'DELETE', {
          body: { endpoint: 5 },
        })
      ).status,
    ).toBe(400)
  })

  it('does not let one person remove another person’s subscription', async () => {
    await call(h.pushSubscriptionRoute.POST, 'POST', { body: sub() })
    await call(h.pushSubscriptionRoute.DELETE, 'DELETE', {
      user: 'bob',
      body: { endpoint: sub().endpoint },
    })
    expect((await call(h.pushTest.POST, 'POST')).body.reached).toBe(1)
  })

  it('reports whether push is configured', async () => {
    const r = await call(h.pushConfig.GET, 'GET')
    expect(r.status).toBe(200)
    expect(r.body).toHaveProperty('enabled')
  })

  it('sends a due reminder once, only to people with a subscribed browser', async () => {
    const mk = (user: string, title: string) =>
      call(h.tasks.POST, 'POST', {
        user,
        body: {
          title,
          startDate: ymd(1),
          startTime: '18:00',
          remindOffset: 10,
        },
      })
    const mine = await mk('alice', 'Submit HNG stage 1')
    const bobs = await mk('bob', 'Bob task')
    await call(h.pushSubscriptionRoute.POST, 'POST', { body: sub(1) })

    const db = liveDb()
    const later = new Date(Date.now() + 3 * 86_400_000)
    expect(await sendDueReminders(db, later)).toEqual({ claimed: 1, sent: 1 })
    expect(sent).toEqual([
      {
        endpoint: sub(1).endpoint,
        title: 'Submit HNG stage 1',
        body: 'Starts in 10 minutes, at 18:00.',
      },
    ])
    // Claimed, so a second run has nothing left.
    expect(await sendDueReminders(db, later)).toEqual({ claimed: 0, sent: 0 })
    expect(
      (await call(h.taskById.GET, 'GET', { params: { id: mine.body.id } })).body
        .remindAt,
    ).toBeNull()
    // Bob has no subscription, so his reminder stays for the in-app banner.
    expect(
      (
        await call(h.taskById.GET, 'GET', {
          user: 'bob',
          params: { id: bobs.body.id },
        })
      ).body.remindAt,
    ).not.toBeNull()
  })

  it('skips done tasks and drops a subscription the push service says is gone', async () => {
    const t = await call(h.tasks.POST, 'POST', {
      body: { title: 'x', startDate: ymd(1), remindOffset: 0 },
    })
    await call(h.pushSubscriptionRoute.POST, 'POST', {
      body: { ...sub(), endpoint: 'https://push.example.com/gone' },
    })
    const later = new Date(Date.now() + 3 * 86_400_000)
    await sendDueReminders(liveDb(), later)
    expect((await call(h.pushTest.POST, 'POST')).body.reached).toBe(0)

    const t2 = await call(h.tasks.POST, 'POST', {
      body: { title: 'y', startDate: ymd(1), remindOffset: 0 },
    })
    await call(h.pushSubscriptionRoute.POST, 'POST', { body: sub(2) })
    await call(h.taskById.PATCH, 'PATCH', {
      params: { id: t2.body.id },
      body: { status: 'done' },
    })
    sent.length = 0
    expect(await sendDueReminders(liveDb(), later)).toEqual({
      claimed: 0,
      sent: 0,
    })
    expect(sent).toHaveLength(0)
    expect(t.status).toBe(201)
  })

  describe('the scheduler endpoint', () => {
    const cron = (auth?: string) =>
      h.cronReminders.POST({
        request: new Request('http://test.local/api/cron/reminders', {
          method: 'POST',
          headers: auth ? { authorization: auth } : {},
        }),
      })

    afterEach(() => vi.unstubAllEnvs())

    it('refuses without the secret, and when no secret is set', async () => {
      expect((await cron()).status).toBe(401)
      vi.stubEnv('CRON_SECRET', 'letmein')
      expect((await cron()).status).toBe(401)
      expect((await cron('Bearer wrong!')).status).toBe(401)
      expect((await cron('Bearer letmein')).status).toBe(200)
    })

    it('fails closed when CRON_SECRET is empty', async () => {
      vi.stubEnv('CRON_SECRET', '')
      expect((await cron('Bearer ')).status).toBe(401)
    })
  })
})
