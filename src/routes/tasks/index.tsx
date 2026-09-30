import { createFileRoute } from '@tanstack/react-router'
import { TasksPage } from '#/components/TasksPage'

export const Route = createFileRoute('/tasks/')({
  component: () => <TasksPage />,
  head: () => ({
    meta: [
      { title: 'Tasks · Honeylist' },
      { name: 'description', content: 'All your tasks by day: overdue, today, this week and later, with subtasks and quick add.' },
      { property: 'og:title', content: 'Tasks · Honeylist' },
    ],
  }),
})
