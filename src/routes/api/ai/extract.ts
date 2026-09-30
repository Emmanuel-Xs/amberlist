import { createFileRoute } from '@tanstack/react-router'
import { aiExtract } from '#/server/handlers'

export const Route = createFileRoute('/api/ai/extract')({
  server: { handlers: aiExtract },
})
