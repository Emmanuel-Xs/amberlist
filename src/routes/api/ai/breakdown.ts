import { createFileRoute } from '@tanstack/react-router'
import { aiBreakdown } from '#/server/handlers'

export const Route = createFileRoute('/api/ai/breakdown')({
  server: { handlers: aiBreakdown },
})
