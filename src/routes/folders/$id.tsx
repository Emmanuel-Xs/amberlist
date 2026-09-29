import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCategories, useCategoryMutations } from '#/lib/api'
import { sound } from '#/lib/feedback'
import { toast } from '#/lib/store'
import { ConfirmDialog, EmptyState, MenuButton } from '#/ui/zen'
import { TasksPage } from '#/components/TasksPage'
import { FolderDialog } from './index'

export const Route = createFileRoute('/folders/$id')({
  component: FolderRoute,
  head: () => ({ meta: [{ title: 'Folder · Amberlist' }] }),
})

function FolderRoute() {
  const { id } = Route.useParams()
  const { data: cats } = useCategories()
  const m = useCategoryMutations()
  const navigate = useNavigate()
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const folder = cats?.find((c) => c.id === id)
  if (cats && !folder)
    return (
      <EmptyState
        illustration="folder"
        title="Folder not found"
        text="It may have been deleted. Its tasks are in Inbox."
      />
    )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {folder && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: -52,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <MenuButton
            label={`Actions for ${folder.name}`}
            items={[
              {
                label: 'Edit folder',
                icon: 'pen',
                onSelect: () => setEdit(true),
              },
              { separator: true },
              {
                label: 'Delete folder',
                icon: 'trash',
                danger: true,
                onSelect: () => setDel(true),
              },
            ]}
          />
        </div>
      )}
      <TasksPage folderId={id} title={folder?.name ?? 'Folder'} />
      {edit && folder && (
        <FolderDialog
          open={edit}
          onClose={() => setEdit(false)}
          folder={folder}
        />
      )}
      {folder && (
        <ConfirmDialog
          open={del}
          onClose={() => setDel(false)}
          icon="folder"
          title={`Delete the ${folder.name} folder?`}
          text={`Its ${folder.taskCount} ${folder.taskCount === 1 ? 'task moves' : 'tasks move'} to Inbox. Nothing else is deleted.`}
          confirmLabel="Delete folder"
          onConfirm={() =>
            m.remove.mutate(folder.id, {
              onSuccess: () => {
                sound('delete')
                toast({
                  icon: 'trash',
                  message: `${folder.name} deleted. Tasks moved to Inbox.`,
                })
                void navigate({ to: '/folders' })
              },
            })
          }
        />
      )}
    </div>
  )
}
