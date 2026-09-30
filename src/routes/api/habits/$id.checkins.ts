import { createFileRoute } from '@tanstack/react-router'
import { habitCheckins } from '#/server/handlers'

export const Route = createFileRoute('/api/habits/$id/checkins')({
  server: { handlers: habitCheckins },
})
