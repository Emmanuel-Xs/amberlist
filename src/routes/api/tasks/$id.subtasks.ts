import { createFileRoute } from '@tanstack/react-router'
import { taskSubtasks } from '#/server/handlers'

export const Route = createFileRoute('/api/tasks/$id/subtasks')({
  server: { handlers: taskSubtasks },
})
