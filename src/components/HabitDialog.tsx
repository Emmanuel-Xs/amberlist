import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useCategories, useHabitMutations } from '#/lib/api'
import type { Habit, HabitFrequency } from '#/lib/api'
import { sound } from '#/lib/feedback'
import { toast } from '#/lib/store'
import type { IconName } from '#/ui/icons'
import { Button, Chip, Input, Modal } from '#/ui/zen'
import { habitIcon } from './HabitRow'

const HABIT_ICONS: IconName[] = [
  'flame',
  'book',
  'pen',
  'droplet',
  'target',
  'cart',
  'sun',
  'home',
  'note',
  'folder',
]
const ICON_NAMES: Partial<Record<IconName, string>> = {
  flame: 'Flame',
  book: 'Book',
  pen: 'Pen',
  droplet: 'Water drop',
  target: 'Target',
  cart: 'Cart',
  sun: 'Sun',
  home: 'Home',
  note: 'Notebook',
  folder: 'Folder',
}
const FREQUENCIES: { value: HabitFrequency; label: string }[] = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Some days' },
  { value: 'x_per_week', label: 'Times a week' },
]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const GOALS: (number | null)[] = [null, 7, 21, 30, 66]

function Group({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="zn-field-label">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
      >
        {children}
      </div>
    </div>
  )
}

/** Create or edit a habit: name, icon, folder, frequency and goal. */
export function HabitDialog({
  open,
  onClose,
  habit,
}: {
  open: boolean
  onClose: () => void
  habit?: Habit
}) {
  const m = useHabitMutations()
  const navigate = useNavigate()
  const { data: cats = [] } = useCategories()
  const [name, setName] = useState(habit?.name ?? '')
  const [icon, setIcon] = useState<IconName>(habitIcon(habit?.icon ?? 'flame'))
  const [categoryId, setCategoryId] = useState(habit?.categoryId ?? null)
  const [frequency, setFrequency] = useState<HabitFrequency>(
    habit?.frequency ?? 'daily',
  )
  const [days, setDays] = useState<number[]>(
    habit?.daysOfWeek ?? [1, 2, 3, 4, 5],
  )
  const [times, setTimes] = useState(habit?.timesPerWeek ?? 3)
  const [goal, setGoal] = useState<number | null>(habit ? habit.goalDays : 21)
  const [custom, setCustom] = useState(
    goal !== null && !GOALS.includes(goal) ? String(goal) : '',
  )
  const [error, setError] = useState<string | null>(null)
  const [goalError, setGoalError] = useState<string | null>(null)

  const toggleDay = (d: number) =>
    setDays((cur) =>
      cur.includes(d)
        ? cur.length > 1
          ? cur.filter((x) => x !== d)
          : cur
        : [...cur, d].sort((a, b) => a - b),
    )

  const save = () => {
    if (!name.trim()) return setError('Name the habit.')
    if (goal !== null && (goal < 1 || goal > 365))
      return setGoalError('Pick 1 to 365 days, or Ongoing.')
    const input = {
      name: name.trim(),
      icon,
      categoryId,
      frequency,
      daysOfWeek: frequency === 'weekdays' ? days : null,
      timesPerWeek: frequency === 'x_per_week' ? times : null,
      goalDays: goal,
    }
    const onError = (e: Error) => {
      sound('error')
      setError(e.message)
    }
    if (habit) {
      m.update.mutate(
        { id: habit.id, ...input },
        {
          onSuccess: () => {
            toast({ tone: 'success', icon: 'check', message: 'Habit updated' })
            onClose()
          },
          onError,
        },
      )
      return
    }
    m.create.mutate(input, {
      onSuccess: (h) => {
        toast({
          tone: 'success',
          badge: 'flame',
          message: 'Habit added',
          detail: 'Tap the circle each day you do it.',
          actionLabel: 'Open',
          onAction: () =>
            void navigate({ to: '/habits/$id', params: { id: h.id } }),
        })
        onClose()
      },
      onError,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={habit ? 'Edit habit' : 'New habit'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={save}
            loading={m.create.isPending || m.update.isPending}
          >
            {habit ? 'Save' : 'Add habit'}
          </Button>
        </>
      }
    >
      <Input
        label="Name"
        data-autofocus=""
        placeholder="Read 10 pages"
        value={name}
        maxLength={80}
        error={error}
        onChange={(e) => (setName(e.target.value), setError(null))}
        onKeyDown={(e) => e.key === 'Enter' && save()}
      />
      <Group label="Icon">
        {HABIT_ICONS.map((i) => (
          <Chip
            key={i}
            role="radio"
            aria-checked={icon === i}
            aria-pressed={undefined}
            aria-label={ICON_NAMES[i]}
            selected={icon === i}
            icon={i}
            onClick={() => setIcon(i)}
          />
        ))}
      </Group>
      <Group label="Folder">
        <Chip
          role="radio"
          aria-checked={categoryId === null}
          aria-pressed={undefined}
          selected={categoryId === null}
          onClick={() => setCategoryId(null)}
        >
          None
        </Chip>
        {cats.map((c) => (
          <Chip
            key={c.id}
            role="radio"
            aria-checked={categoryId === c.id}
            aria-pressed={undefined}
            selected={categoryId === c.id}
            onClick={() => setCategoryId(c.id)}
          >
            {c.name}
          </Chip>
        ))}
      </Group>
      <Group label="How often">
        {FREQUENCIES.map((f) => (
          <Chip
            key={f.value}
            role="radio"
            aria-checked={frequency === f.value}
            aria-pressed={undefined}
            selected={frequency === f.value}
            onClick={() => setFrequency(f.value)}
          >
            {f.label}
          </Chip>
        ))}
      </Group>
      {frequency === 'weekdays' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="zn-field-label" id="habit-days">
            Which days
          </span>
          <div
            role="group"
            aria-labelledby="habit-days"
            style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
          >
            {DAYS.map((d, i) => (
              <Chip
                key={d}
                selected={days.includes(i + 1)}
                onClick={() => toggleDay(i + 1)}
              >
                {d}
              </Chip>
            ))}
          </div>
        </div>
      )}
      {frequency === 'x_per_week' && (
        <Group label="Times a week">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Chip
              key={n}
              role="radio"
              aria-checked={times === n}
              aria-pressed={undefined}
              selected={times === n}
              onClick={() => setTimes(n)}
            >
              {n}
            </Chip>
          ))}
        </Group>
      )}
      <Group label="Goal">
        {GOALS.map((g) => (
          <Chip
            key={g ?? 'ongoing'}
            role="radio"
            aria-checked={!custom && goal === g}
            aria-pressed={undefined}
            selected={!custom && goal === g}
            onClick={() => (setGoal(g), setCustom(''), setGoalError(null))}
          >
            {g === null ? 'Ongoing' : `${g} days`}
          </Chip>
        ))}
      </Group>
      <Input
        label="Or your own goal (days)"
        optional
        type="number"
        inputMode="numeric"
        min={1}
        max={365}
        value={custom}
        error={goalError}
        onChange={(e) => {
          setGoalError(null)
          setCustom(e.target.value)
          const n = parseInt(e.target.value, 10)
          setGoal(Number.isNaN(n) ? null : n)
        }}
      />
    </Modal>
  )
}
