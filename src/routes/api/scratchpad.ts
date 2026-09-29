import { createFileRoute } from '@tanstack/react-router'
import { scratchpad } from '#/server/handlers'

export const Route = createFileRoute('/api/scratchpad')({
  server: { handlers: scratchpad },
})
