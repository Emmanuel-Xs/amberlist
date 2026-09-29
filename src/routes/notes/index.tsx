import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useNoteMutations, useNotes, useTasks } from '#/lib/api'
import { setScratch } from '#/lib/store'
import { Icon } from '#/ui/icons'
import { Button, EmptyState, SearchBar, Skeleton } from '#/ui/zen'
import { NoteCard } from '#/components/Cards'

export const Route = createFileRoute('/notes/')({
  component: Notes,
  head: () => ({ meta: [{ title: 'Notes · Honeylist' }] }),
})

function Notes() {
  const { data: notes, isLoading } = useNotes()
  const { data: tasks = [] } = useTasks()
  const { create } = useNoteMutations()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const title = (id: string | null) =>
    id ? tasks.find((t) => t.id === id)?.title : undefined
  const list = (notes ?? []).filter(
    (n) => !q || `${n.title} ${n.body}`.toLowerCase().includes(q.toLowerCase()),
  )
  const pinned = list.filter((n) => n.pinned)
  const rest = list.filter((n) => !n.pinned)
  const newNote = () =>
    create.mutate(
      { title: '', body: '' },
      {
        onSuccess: (n) =>
          void navigate({ to: '/notes/$id', params: { id: n.id } }),
      },
    )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <h1 className="display" style={{ margin: 0 }}>
          Notes
        </h1>
        <Button icon="plus" onClick={newNote} loading={create.isPending}>
          New note
        </Button>
      </header>
      <SearchBar value={q} onChange={setQ} placeholder="Search notes" />
      <button
        type="button"
        onClick={() => setScratch(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: 16,
          borderRadius: 20,
          background: 'var(--accent-soft)',
          color: 'var(--ink)',
          border: 0,
          cursor: 'pointer',
          font: 'inherit',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: 14,
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name="scratch" size={22} />
        </span>
        <span
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <span style={{ fontSize: 15, fontWeight: 600 }}>Scratchpad</span>
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            Dump a thought, turn any line into a task. Press N anywhere.
          </span>
        </span>
        <span style={{ color: 'var(--accent-ink)', display: 'inline-flex' }}>
          <Icon name="chevronRight" />
        </span>
      </button>
      {isLoading ? (
        <div className="notes-grid">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={180} radius={20} />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div style={{ borderRadius: 28, background: 'var(--surface)' }}>
          {q ? (
            <EmptyState
              illustration="search"
              title={`No results for "${q}"`}
              text="Try a word from inside the note."
            />
          ) : (
            <EmptyState
              illustration="notes"
              title="No notes yet"
              text="Capture ideas, meeting notes and checklists. Markdown works."
            >
              <Button icon="plus" onClick={newNote}>
                New note
              </Button>
            </EmptyState>
          )}
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <>
              <h2
                style={{
                  margin: '4px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <Icon name="pin" size={16} />
                Pinned
              </h2>
              <div className="notes-grid">
                {pinned.map((n) => (
                  <NoteCard key={n.id} note={n} linkedTitle={title(n.taskId)} />
                ))}
              </div>
            </>
          )}
          {rest.length > 0 && (
            <>
              <h2 style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600 }}>
                All notes{' '}
                <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>
                  {rest.length}
                </span>
              </h2>
              <div className="notes-grid">
                {rest.map((n) => (
                  <NoteCard key={n.id} note={n} linkedTitle={title(n.taskId)} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
