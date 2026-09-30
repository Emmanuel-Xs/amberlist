import { createFileRoute } from '@tanstack/react-router'
import { habitById } from '#/server/handlers'

export const Route = createFileRoute('/api/habits/$id')({
  server: { handlers: habitById },
})
