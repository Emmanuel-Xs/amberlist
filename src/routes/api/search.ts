import { createFileRoute } from '@tanstack/react-router'
import { searchAll } from '#/server/handlers'

export const Route = createFileRoute('/api/search')({
  server: { handlers: searchAll },
})
