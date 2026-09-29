import { createFileRoute } from '@tanstack/react-router'
import { subtaskById } from '#/server/handlers'

export const Route = createFileRoute('/api/subtasks/$id')({
  server: { handlers: subtaskById },
})
