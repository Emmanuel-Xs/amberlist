import { createFileRoute } from '@tanstack/react-router'
import { tasks } from '#/server/handlers'

export const Route = createFileRoute('/api/tasks/')({
  server: { handlers: tasks },
})
