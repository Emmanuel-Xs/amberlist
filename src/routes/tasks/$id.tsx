import { createFileRoute } from '@tanstack/react-router'
import { TasksPage } from '#/components/TasksPage'

export const Route = createFileRoute('/tasks/$id')({
  component: TaskRoute,
  head: () => ({ meta: [{ title: 'Task · Amberlist' }] }),
})

function TaskRoute() {
  const { id } = Route.useParams()
  return <TasksPage selectedId={id} />
}
