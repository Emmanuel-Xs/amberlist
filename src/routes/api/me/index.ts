import { createFileRoute } from '@tanstack/react-router'
import { me } from '#/server/handlers'

export const Route = createFileRoute('/api/me/')({
  server: { handlers: me },
})
