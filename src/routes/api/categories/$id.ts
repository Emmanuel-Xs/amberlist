import { createFileRoute } from '@tanstack/react-router'
import { categoryById } from '#/server/handlers'

export const Route = createFileRoute('/api/categories/$id')({
  server: { handlers: categoryById },
})
