import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useCategories,
  useCategoryMutations,
  useTaskMutations,
} from '#/lib/api'
import type { Category } from '#/lib/api'
import { toISODate } from '#/lib/dates'
import { sound } from '#/lib/feedback'
import { parseQuickAdd } from '#/lib/parse'
import { openCreate, toast } from '#/lib/store'
import { Icon } from '#/ui/icons'
import type { IconName } from '#/ui/icons'
import { Button } from '#/ui/zen'

const CHIP_ICON: Record<string, IconName> = {
  date: 'calendar',
  time: 'clock',
  due: 'flag',
  category: 'folder',
  priority: 'flag',
}
const COLORS = ['lavender', 'butter', 'mint', 'peach', 'sky'] as const
// Invisible markers that stop the parser from re-reading a chip the user removed.
const MARK = String.fromCharCode(0x2063)
const NBSP = String.fromCharCode(0xa0)

/** Type a title and press Enter. Dates, times, #folders and !priority become chips you can remove. */
export function QuickAdd({
  autoFocus,
  onAdded,
}: {
  autoFocus?: boolean
  onAdded?: () => void
}) {
  const [text, setText] = useState('')
  const [removed, setRemoved] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: cats = [] } = useCategories()
  const { create } = useTaskMutations()
  const catM = useCategoryMutations()
  const today = toISODate(new Date())
  // Short hint on narrow phones so the placeholder never gets cut off.
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 519.98px)')
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const parsed = useMemo(() => {
    // Removing a chip puts its words back into the title.
    let src = text
    for (const r of removed) src = src.replace(r, MARK + r.replace(/\s/g, NBSP))
    const p = parseQuickAdd(src, today)
    return { ...p, title: p.title.split(MARK).join('').split(NBSP).join(' ') }
  }, [text, removed, today])

  const submit = async () => {
    const p = parsed
    if (!p.title.trim()) return
    let categoryId: string | null = null
    if (p.category) {
      const found = cats.find(
        (c: Category) => c.name.toLowerCase() === p.category!.toLowerCase(),
      )
      if (found) categoryId = found.id
      else {
        const made = await catM.create.mutateAsync({
          name: p.category[0].toUpperCase() + p.category.slice(1),
          color: COLORS[cats.length % COLORS.length],
        })
        categoryId = made.id
      }
    }
    create.mutate(
      {
        title: p.title,
        startDate: p.startDate ?? null,
        startTime: p.startTime ?? null,
        endTime: p.endTime ?? null,
        dueDate: p.dueDate ?? null,
        priority: p.priority,
        categoryId,
      },
      {
        onSuccess: () => {
          sound('complete')
          toast({
            tone: 'success',
            icon: 'check',
            message: `Added "${p.title}"`,
          })
          onAdded?.()
        },
        onError: (e) => {
          sound('error')
          toast({
            tone: 'error',
            icon: 'alert',
            message: e.message,
            duration: 0,
          })
        },
      },
    )
    setText('')
    setRemoved([])
    inputRef.current?.focus()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 8px 0 10px',
          borderRadius: 9999,
          background: 'var(--surface)',
          border: `1px solid ${text ? 'var(--ring)' : 'var(--line)'}`,
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <button
          type="button"
          onClick={() => openCreate(text)}
          aria-label="Open the full task form"
          title="Full task form"
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            border: 0,
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
        >
          <Icon name="plus" size={20} strokeWidth={2.25} />
        </button>
        <label htmlFor="quick-add" className="sr-only">
          Add a task
        </label>
        <input
          id="quick-add"
          ref={inputRef}
          autoFocus={autoFocus}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setRemoved([])
          }}
          placeholder={
            narrow
              ? 'Add a task, try "Gym tomorrow"'
              : 'Add a task. Try "Read 20 pages tomorrow #study"'
          }
          autoComplete="off"
          maxLength={300}
          style={{
            flex: 1,
            minWidth: 0,
            height: 44,
            border: 0,
            outline: 0,
            background: 'transparent',
            font: 'inherit',
            fontSize: 16,
            color: 'var(--ink)',
          }}
        />
        {text.trim() ? (
          <Button size="sm" type="submit">
            Add
          </Button>
        ) : (
          <kbd
            className="from-tablet"
            style={{
              fontFamily: 'inherit',
              fontSize: 12,
              color: 'var(--ink-muted)',
              padding: '3px 9px',
              marginRight: 8,
              border: '1px solid var(--line-strong)',
              borderRadius: 8,
            }}
          >
            Q
          </kbd>
        )}
      </div>
      {parsed.chips.length > 0 && (
        <div
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingLeft: 12 }}
          aria-live="polite"
        >
          {parsed.chips.map((c) => (
            <span
              key={c.raw}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 32,
                padding: '0 6px 0 12px',
                borderRadius: 9999,
                background: 'var(--accent-soft)',
                color: 'var(--accent-ink)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <Icon name={CHIP_ICON[c.kind]} size={16} />
              {c.label}
              <button
                type="button"
                aria-label={`Remove ${c.label}`}
                onClick={() => setRemoved((r) => [...r, c.raw])}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: 0,
                  background: 'transparent',
                  color: 'var(--accent-ink)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <Icon name="x" size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
    </form>
  )
}
