import { createFileRoute } from '@tanstack/react-router'
import { habits } from '#/server/handlers'

export const Route = createFileRoute('/api/habits/')({
  server: { handlers: habits },
})
