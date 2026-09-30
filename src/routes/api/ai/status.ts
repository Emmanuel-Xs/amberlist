import { createFileRoute } from '@tanstack/react-router'
import { aiStatus } from '#/server/handlers'

export const Route = createFileRoute('/api/ai/status')({
  server: { handlers: aiStatus },
})
