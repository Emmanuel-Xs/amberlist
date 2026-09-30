import { createFileRoute } from '@tanstack/react-router'
import { taskSkip } from '#/server/handlers'

export const Route = createFileRoute('/api/tasks/$id/skip')({
  server: { handlers: taskSkip },
})
