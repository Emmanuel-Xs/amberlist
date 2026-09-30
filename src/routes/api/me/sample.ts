import { createFileRoute } from '@tanstack/react-router'
import { meSample } from '#/server/handlers'

export const Route = createFileRoute('/api/me/sample')({
  server: { handlers: meSample },
})
