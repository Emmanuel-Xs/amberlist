import { useEffect, useState } from 'react'
import { useStore } from '@tanstack/react-store'
import { useQueryClient } from '@tanstack/react-query'
import { announceAdded } from '#/lib/announce'
import { celebrateFirstTask, isFirstTask } from './Celebrate'
import { useForm } from '@tanstack/react-form'
import { useCategories, useTaskMutations } from '#/lib/api'
import { toISODate } from '#/lib/dates'
import { sound } from '#/lib/feedback'
import { parseQuickAdd } from '#/lib/parse'
import { closeCreate, toast, ui } from '#/lib/store'
import { Icon } from '#/ui/icons'
import { Button, Chip, Input, Modal, Switch } from '#/ui/zen'

/** Full task form: a bottom sheet on phones, a dialog from tablet up. */
export function CreateTask() {
  const open = useStore(ui, (s) => s.createOpen)
  const draft = useStore(ui, (s) => s.createDraft)
  const { data: cats = [] } = useCategories()
  const { create } = useTaskMutations()
  const qc = useQueryClient()
  const [subInput, setSubInput] = useState('')
  const today = toISODate(new Date())

  const form = useForm({
    defaultValues: {
      title: '',
      startDate: today,
      dueDate: '',
      startTime: '',
      endTime: '',
      categoryId: '',
      priority: 'medium' as 'low' | 'medium' | 'high',
      remind: false,
      subtasks: [] as string[],
    },
    onSubmit: ({ value }) => {
      const first = isFirstTask(qc)
      create.mutate(
        {
          title: value.title.trim(),
          startDate: value.startDate || null,
          dueDate: value.dueDate || null,
          startTime: value.startTime || null,
          endTime: value.startTime && value.endTime ? value.endTime : null,
          categoryId: value.categoryId || null,
          priority: value.priority,
          remind: value.remind,
          subtasks: value.subtasks,
        },
        {
          onSuccess: (created) => {
            sound('complete')
            if (first) celebrateFirstTask(created.id)
            else announceAdded(qc, created)
            closeCreate()
          },
          onError: (e) =>
            toast({
              tone: 'error',
              icon: 'alert',
              message: e.message,
              duration: 0,
            }),
        },
      )
    },
  })

  useEffect(() => {
    if (!open) return
    const p = draft ? parseQuickAdd(draft, today) : null
    const cat = p?.category
      ? cats.find((c) => c.name.toLowerCase() === p.category!.toLowerCase())
      : undefined
    form.reset({
      title: p?.title ?? '',
      startDate: p?.startDate ?? today,
      dueDate: p?.dueDate ?? '',
      startTime: p?.startTime ?? '',
      endTime: p?.endTime ?? '',
      categoryId: cat?.id ?? '',
      priority: p?.priority ?? 'medium',
      remind: false,
      subtasks: [],
    })
    setSubInput('')
  }, [open])

  return (
    <Modal
      open={open}
      onClose={closeCreate}
      title="New task"
      footer={
        <>
          <Button variant="secondary" onClick={closeCreate}>
            Cancel
          </Button>
          <form.Subscribe selector={(s) => [s.canSubmit, s.values.title]}>
            {([canSubmit, title]) => (
              <Button
                icon="plus"
                disabled={!canSubmit || !String(title).trim()}
                loading={create.isPending}
                onClick={() => void form.handleSubmit()}
              >
                Create task
              </Button>
            )}
          </form.Subscribe>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
      >
        <form.Field
          name="title"
          validators={{
            onChange: ({ value }) =>
              value.length > 200 ? 'Keep it under 200 characters.' : undefined,
          }}
        >
          {(f) => (
            <Input
              label="Title"
              data-autofocus=""
              value={f.state.value}
              onChange={(e) => f.handleChange(e.target.value)}
              onBlur={f.handleBlur}
              error={
                f.state.meta.errors[0] ? String(f.state.meta.errors[0]) : null
              }
              placeholder="What needs doing?"
              maxLength={200}
            />
          )}
        </form.Field>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px 20px',
          }}
        >
          <form.Field name="startDate">
            {(f) => (
              <Input
                type="date"
                label="Start"
                value={f.state.value}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            )}
          </form.Field>
          <form.Field name="dueDate">
            {(f) => (
              <Input
                type="date"
                label="Due"
                optional
                value={f.state.value}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            )}
          </form.Field>
          <form.Field name="startTime">
            {(f) => (
              <Input
                type="time"
                label="From"
                optional
                value={f.state.value}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            )}
          </form.Field>
          <form.Field name="endTime">
            {(f) => (
              <Input
                type="time"
                label="To"
                optional
                value={f.state.value}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            )}
          </form.Field>
        </div>
        <form.Field name="categoryId">
          {(f) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="zn-field-label">Folder</span>
              <div
                role="radiogroup"
                aria-label="Folder"
                style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
              >
                <Chip
                  role="radio"
                  aria-checked={!f.state.value}
                  selected={!f.state.value}
                  icon="inbox"
                  onClick={() => f.handleChange('')}
                >
                  Inbox
                </Chip>
                {cats.map((c) => (
                  <Chip
                    key={c.id}
                    role="radio"
                    aria-checked={f.state.value === c.id}
                    selected={f.state.value === c.id}
                    onClick={() => f.handleChange(c.id)}
                  >
                    {c.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </form.Field>
        <form.Field name="priority">
          {(f) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="zn-field-label">Priority</span>
              <div
                role="radiogroup"
                aria-label="Priority"
                style={{ display: 'flex', gap: 8 }}
              >
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <Chip
                    key={p}
                    role="radio"
                    aria-checked={f.state.value === p}
                    selected={f.state.value === p}
                    icon={p === 'high' ? 'flag' : undefined}
                    onClick={() => f.handleChange(p)}
                  >
                    {p[0].toUpperCase() + p.slice(1)}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </form.Field>
        <form.Field name="subtasks">
          {(f) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="zn-field-label">Subtasks</span>
              {f.state.value.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 40,
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: '1.5px solid var(--line-strong)',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, fontSize: 14 }}>{s}</span>
                  <button
                    type="button"
                    className="zn-icon-btn"
                    aria-label={`Remove ${s}`}
                    onClick={() =>
                      f.handleChange(f.state.value.filter((_, j) => j !== i))
                    }
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>
              ))}
              <Input
                aria-label="New subtask"
                placeholder="Add a subtask and press Enter"
                value={subInput}
                maxLength={200}
                onChange={(e) => setSubInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (subInput.trim())
                      f.handleChange([...f.state.value, subInput.trim()])
                    setSubInput('')
                  }
                }}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="remind">
          {(f) => (
            <Switch
              label="Remind me when it starts"
              icon="bell"
              checked={f.state.value}
              onChange={f.handleChange}
            />
          )}
        </form.Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
