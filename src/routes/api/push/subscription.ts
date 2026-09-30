import { createFileRoute } from '@tanstack/react-router'
import { pushSubscriptionRoute } from '#/server/handlers'

export const Route = createFileRoute('/api/push/subscription')({
  server: { handlers: pushSubscriptionRoute },
})
