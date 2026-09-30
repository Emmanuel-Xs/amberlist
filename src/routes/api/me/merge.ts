import { createFileRoute } from '@tanstack/react-router'
import { meMerge } from '#/server/handlers'

export const Route = createFileRoute('/api/me/merge')({
  server: { handlers: meMerge },
})
