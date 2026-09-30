import { createFileRoute } from '@tanstack/react-router'
import { taskSnooze } from '#/server/handlers'

export const Route = createFileRoute('/api/tasks/$id/snooze')({
  server: { handlers: taskSnooze },
})
