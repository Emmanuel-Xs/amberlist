import { createFileRoute } from '@tanstack/react-router'
import { taskById } from '#/server/handlers'

export const Route = createFileRoute('/api/tasks/$id')({
  server: { handlers: taskById },
})
