import { createFileRoute } from '@tanstack/react-router'
import { NoteEditor } from '#/components/NoteEditor'

export const Route = createFileRoute('/notes/$id')({
  component: NoteRoute,
  head: () => ({ meta: [{ title: 'Note · Honeylist' }] }),
})

function NoteRoute() {
  const { id } = Route.useParams()
  return <NoteEditor id={id} />
}
