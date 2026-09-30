import { createFileRoute } from '@tanstack/react-router'
import { pushConfig } from '#/server/handlers'

export const Route = createFileRoute('/api/push/config')({
  server: { handlers: pushConfig },
})
