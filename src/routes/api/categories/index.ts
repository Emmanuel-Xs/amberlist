import { createFileRoute } from '@tanstack/react-router'
import { categories } from '#/server/handlers'

export const Route = createFileRoute('/api/categories/')({
  server: { handlers: categories },
})
