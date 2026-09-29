import { createFileRoute } from '@tanstack/react-router'
import { noteById } from '#/server/handlers'

export const Route = createFileRoute('/api/notes/$id')({
  server: { handlers: noteById },
})
