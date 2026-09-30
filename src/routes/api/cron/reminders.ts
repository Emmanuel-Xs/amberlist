import { createFileRoute } from '@tanstack/react-router'
import { cronReminders } from '#/server/handlers'

export const Route = createFileRoute('/api/cron/reminders')({
  server: { handlers: cronReminders },
})
