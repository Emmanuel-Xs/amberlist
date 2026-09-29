import { createFileRoute } from '@tanstack/react-router'
import { getAuth } from '#/server/auth'
import { ensureSchema } from '#/server/db'

const handle = async ({ request }: { request: Request }) => {
  await ensureSchema()
  return getAuth().handler(request)
}

export const Route = createFileRoute('/api/auth/$')({
  server: { handlers: { GET: handle, POST: handle } },
})
