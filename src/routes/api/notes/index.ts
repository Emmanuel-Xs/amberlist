import { createFileRoute } from '@tanstack/react-router'
import { notes } from '#/server/handlers'

export const Route = createFileRoute('/api/notes/')({
  server: { handlers: notes },
})
