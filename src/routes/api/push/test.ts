import { createFileRoute } from '@tanstack/react-router'
import { pushTest } from '#/server/handlers'

export const Route = createFileRoute('/api/push/test')({
  server: { handlers: pushTest },
})
