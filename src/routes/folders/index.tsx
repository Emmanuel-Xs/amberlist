import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useCategories, useCategoryMutations } from '#/lib/api'
import type { Category } from '#/lib/api'
import { toast } from '#/lib/store'
import { Icon } from '#/ui/icons'
import type { IconName } from '#/ui/icons'
import { Button, Chip, EmptyState, Input, Modal, Skeleton } from '#/ui/zen'
import { FolderCard } from '#/components/Cards'

export const Route = createFileRoute('/folders/')({
  component: Folders,
  head: () => ({ meta: [{ title: 'Folders · Amberlist' }] }),
})

export const FOLDER_COLORS = [
  'lavender',
  'butter',
  'mint',
  'peach',
  'sky',
] as const
export const FOLDER_ICONS: IconName[] = [
  'folder',
  'pen',
  'book',
  'home',
  'target',
  'droplet',
  'sun',
  'cart',
  'flame',
  'note',
]

export function FolderDialog({
  open,
  onClose,
  folder,
}: {
  open: boolean
  onClose: () => void
  folder?: Category
}) {
  const m = useCategoryMutations()
  const [name, setName] = useState(folder?.name ?? '')
  const [color, setColor] = useState<Category['color']>(
    folder?.color ?? 'lavender',
  )
  const [icon, setIcon] = useState(folder?.icon ?? 'folder')
  const [error, setError] = useState<string | null>(null)
  const save = () => {
    if (!name.trim()) return setError('Name the folder.')
    const done = () => {
      toast({
        tone: 'success',
        icon: 'check',
        message: folder ? 'Folder updated' : 'Folder created',
      })
      onClose()
    }
    const onError = (e: Error) => setError(e.message)
    if (folder)
      m.update.mutate(
        { id: folder.id, name: name.trim(), color, icon },
        { onSuccess: done, onError },
      )
    else
      m.create.mutate(
        { name: name.trim(), color, icon },
        { onSuccess: done, onError },
      )
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={folder ? 'Edit folder' : 'New folder'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={save}
            loading={m.create.isPending || m.update.isPending}
          >
            {folder ? 'Save' : 'Create folder'}
          </Button>
        </>
      }
    >
      <Input
        label="Name"
        data-autofocus=""
        value={name}
        maxLength={40}
        error={error}
        onChange={(e) => (setName(e.target.value), setError(null))}
        onKeyDown={(e) => e.key === 'Enter' && save()}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="zn-field-label">Color</span>
        <div
          role="radiogroup"
          aria-label="Folder color"
          style={{ display: 'flex', gap: 10 }}
        >
          {FOLDER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={c}
              className={['zn-swatch', color === c && 'is-selected']
                .filter(Boolean)
                .join(' ')}
              style={{ background: `var(--${c})` }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="zn-field-label">Icon</span>
        <div
          role="radiogroup"
          aria-label="Folder icon"
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
        >
          {FOLDER_ICONS.map((i) => (
            <Chip
              key={i}
              role="radio"
              aria-checked={icon === i}
              aria-label={i}
              selected={icon === i}
              icon={i}
              onClick={() => setIcon(i)}
            />
          ))}
        </div>
      </div>
    </Modal>
  )
}

function Folders() {
  const { data: cats, isLoading } = useCategories()
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <h1 className="display" style={{ margin: 0 }}>
          Folders
        </h1>
        <Button icon="plus" onClick={() => setOpen(true)}>
          New folder
        </Button>
      </header>
      <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: 14 }}>
        Group tasks and notes by area of life. Deleting a folder moves its tasks
        to Inbox; nothing is lost.
      </p>
      {isLoading ? (
        <div className="folders-grid">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={160} radius={20} />
          ))}
        </div>
      ) : !cats?.length ? (
        <div style={{ borderRadius: 28, background: 'var(--surface)' }}>
          <EmptyState
            illustration="folder"
            title="No folders yet"
            text="Create one for work, study or anything you juggle."
          >
            <Button icon="plus" onClick={() => setOpen(true)}>
              New folder
            </Button>
          </EmptyState>
        </div>
      ) : (
        <div className="folders-grid">
          {cats.map((c) => (
            <FolderCard key={c.id} category={c} />
          ))}
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{
              height: 160,
              marginTop: 0,
              borderRadius: 20,
              border: '1.5px dashed var(--line-strong)',
              background: 'transparent',
              color: 'var(--ink-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              font: 'inherit',
              fontWeight: 500,
            }}
          >
            <Icon name="plus" size={24} />
            New folder
          </button>
        </div>
      )}
      {open && <FolderDialog open={open} onClose={() => setOpen(false)} />}
    </div>
  )
}
