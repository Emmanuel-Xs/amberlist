import { createFileRoute } from '@tanstack/react-router'
import { meData } from '#/server/handlers'

export const Route = createFileRoute('/api/me/data')({
  server: { handlers: meData },
})
