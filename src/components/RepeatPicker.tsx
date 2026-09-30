import { useState } from 'react'
import type { ReactNode } from 'react'
import { addDays, parseISO, toISODate } from '#/lib/dates'
import { usePhone } from '#/lib/useMedia'
import {
  WEEK_ORDER,
  dayLetter,
  dayLong,
  describeRepeat,
  repeatLabel,
  ruleIncomplete,
  shortDate,
} from '#/lib/repeat'
import type { RepeatEnd, RepeatRule } from '#/lib/repeat'
import { Icon } from '#/ui/icons'
import { Button, Chip, Input, Modal, PickerField, Popover } from '#/ui/zen'

export interface RepeatValue {
  rule: RepeatRule | null
  end: RepeatEnd | null
}

type Kind = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom'
const KINDS: [Kind, string][] = [
  ['none', 'Does not repeat'],
  ['daily', 'Daily'],
  ['weekdays', 'Weekdays'],
  ['weekly', 'Weekly'],
  ['monthly', 'Monthly'],
  ['custom', 'Custom'],
]

const kindOf = (r: RepeatRule | null): Kind =>
  !r ? 'none' : r.kind === 'every' ? 'custom' : r.kind

/** The label in the Repeat field: "Weekly on Mon, Wed", "Every 2 weeks", "Does not repeat". */
export function repeatFieldLabel(v: RepeatValue) {
  const r = v.rule
  if (!r) return 'Does not repeat'
  if (r.kind === 'weekly') {
    const names = WEEK_ORDER.filter((n) => r.days.includes(n)).map((n) =>
      dayLong(n).slice(0, 3),
    )
    return `Weekly on ${names.join(', ')}`
  }
  return repeatLabel(r)
}

export const endsFieldLabel = (end: RepeatEnd | null) =>
  end?.kind === 'on'
    ? shortDate(end.date, true)
    : end?.kind === 'after'
      ? `After ${end.count} time${end.count === 1 ? '' : 's'}`
      : 'Never'

const dowOf = (iso: string) => parseISO(iso).getDay()

/** The picker itself: six choices, weekly days, custom interval, optional end, a plain sentence. */
function RepeatPanel({
  value,
  start,
  hasStart,
  onCancel,
  onDone,
}: {
  value: RepeatValue
  start: string
  hasStart: boolean
  onCancel: () => void
  onDone: (v: RepeatValue) => void
}) {
  const [rule, setRule] = useState<RepeatRule | null>(value.rule)
  const [end, setEnd] = useState<RepeatEnd | null>(value.end)
  const kind = kindOf(rule)
  const endKind = end?.kind ?? 'never'

  const pick = (k: Kind) => {
    if (k === kindOf(rule)) return
    setEnd(k === 'none' ? null : end)
    if (k === 'none') setRule(null)
    else if (k === 'daily') setRule({ kind: 'daily' })
    else if (k === 'weekdays') setRule({ kind: 'weekdays' })
    else if (k === 'weekly') setRule({ kind: 'weekly', days: [dowOf(start)] })
    else if (k === 'monthly')
      setRule({ kind: 'monthly', day: Number(start.slice(8, 10)) })
    else setRule({ kind: 'every', unit: 'day', interval: 2 })
  }
  const toggleDay = (n: number) => {
    if (rule?.kind !== 'weekly') return
    const days = rule.days.includes(n)
      ? rule.days.filter((d) => d !== n)
      : [...rule.days, n]
    setRule({ ...rule, days })
  }
  const pickEnd = (k: RepeatEnd['kind']) => {
    if (k === 'never') setEnd({ kind: 'never' })
    else if (k === 'on')
      setEnd({
        kind: 'on',
        date: end?.kind === 'on' ? end.date : addDays(start, 30),
      })
    else setEnd({ kind: 'after', count: end?.kind === 'after' ? end.count : 5 })
  }

  const badEnd =
    (end?.kind === 'on' && (!end.date || end.date < start)) ||
    (end?.kind === 'after' && !(end.count >= 1 && end.count <= 999))
  const noDays = !!rule && ruleIncomplete(rule)
  const canDone = !noDays && !badEnd

  return (
    <div className="pk-body">
      <span className="pk-label">Repeat</span>
      <div className="pk-chips" role="radiogroup" aria-label="Repeat">
        {KINDS.map(([k, label]) => (
          <Chip
            key={k}
            role="radio"
            aria-checked={kind === k}
            selected={kind === k}
            onClick={() => pick(k)}
          >
            {label}
          </Chip>
        ))}
      </div>

      {rule?.kind === 'weekly' && (
        <>
          <span className="pk-label">On</span>
          <div className="pk-days">
            {WEEK_ORDER.map((n) => (
              <button
                key={n}
                type="button"
                role="checkbox"
                aria-checked={rule.days.includes(n)}
                aria-label={dayLong(n)}
                className="pk-day"
                onClick={() => toggleDay(n)}
              >
                {dayLetter(n)}
              </button>
            ))}
          </div>
          {noDays && <p className="pk-error">Pick at least one day.</p>}
        </>
      )}

      {rule?.kind === 'every' && (
        <div className="pk-inline">
          <Input
            label="Every"
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            value={rule.interval}
            onChange={(e) =>
              setRule({
                ...rule,
                interval: Math.min(
                  99,
                  Math.max(1, Math.floor(Number(e.target.value)) || 1),
                ),
              })
            }
          />
          <div className="pk-chips" role="radiogroup" aria-label="Unit">
            {(['day', 'week'] as const).map((u) => (
              <Chip
                key={u}
                role="radio"
                aria-checked={rule.unit === u}
                selected={rule.unit === u}
                onClick={() => setRule({ ...rule, unit: u })}
              >
                {u === 'day' ? 'Days' : 'Weeks'}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {rule?.kind === 'monthly' && (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: '19px',
            color: 'var(--ink-muted)',
          }}
        >
          On the same day as the start date. Months without that day use their
          last day.
        </p>
      )}

      {rule && (
        <>
          <span className="pk-label">Ends</span>
          <div className="pk-chips" role="radiogroup" aria-label="Ends">
            {(
              [
                ['never', 'Never'],
                ['on', 'On date'],
                ['after', 'After N times'],
              ] as const
            ).map(([k, label]) => (
              <Chip
                key={k}
                role="radio"
                aria-checked={endKind === k}
                selected={endKind === k}
                onClick={() => pickEnd(k)}
              >
                {label}
              </Chip>
            ))}
          </div>
          {end?.kind === 'on' && (
            <Input
              type="date"
              label="Last day"
              min={start}
              value={end.date}
              error={
                badEnd ? 'Pick a day on or after the start date.' : undefined
              }
              onChange={(e) => setEnd({ kind: 'on', date: e.target.value })}
            />
          )}
          {end?.kind === 'after' && (
            <div className="pk-inline">
              <Input
                label="Repeat"
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                value={end.count}
                onChange={(e) =>
                  setEnd({
                    kind: 'after',
                    count: Math.floor(Number(e.target.value)) || 0,
                  })
                }
              />
              <span style={{ paddingBottom: 8, fontSize: 14 }}>times</span>
            </div>
          )}
        </>
      )}

      {rule && !noDays && (
        <div className="pk-note" role="status">
          <span className="pk-note-icon">
            <Icon name="repeat" size={18} />
          </span>
          <span className="pk-note-text">
            {describeRepeat(rule, end, start)}
            <small>
              {hasStart
                ? `First one is ${shortDate(start)}.`
                : `No start date yet, so we start today, ${shortDate(start)}.`}
            </small>
          </span>
        </div>
      )}

      <div className="pk-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={!canDone}
          onClick={() =>
            onDone({
              rule,
              end: rule ? (end?.kind === 'never' ? null : end) : null,
            })
          }
        >
          Done
        </Button>
      </div>
    </div>
  )
}

/**
 * Repeat (and Ends) fields. Tapping either opens the picker: a popover from tablet up, a bottom
 * sheet on phones. Picking a repeat on a task with no start date starts it today.
 */
export function RepeatFields({
  value,
  startDate,
  onChange,
  onStartDate,
  disabled,
  between,
}: {
  value: RepeatValue
  startDate: string
  onChange: (v: RepeatValue) => void
  /** Called with today when a repeat is picked and there is no start date. */
  onStartDate?: (date: string) => void
  disabled?: boolean
  /** Goes between Repeat and Ends (the Remind me field), so the tab order matches the design. */
  between?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const phone = usePhone()
  const today = toISODate(new Date())
  const start = startDate || today

  const done = (v: RepeatValue) => {
    if (v.rule && !startDate) onStartDate?.(today)
    onChange(v)
    setOpen(false)
  }
  const panel: ReactNode = open ? (
    <RepeatPanel
      value={value}
      start={start}
      hasStart={!!startDate}
      onCancel={() => setOpen(false)}
      onDone={done}
    />
  ) : null

  // In the popover the trigger toggles it; on phones the field opens the sheet.
  const repeatField = (
    <PickerField
      label="Repeat"
      value={repeatFieldLabel(value)}
      disabled={disabled}
      aria-expanded={open}
      onClick={phone ? () => setOpen(true) : undefined}
    />
  )
  return (
    <>
      {phone ? (
        <>
          {repeatField}
          <Modal open={open} onClose={() => setOpen(false)} title="Repeat">
            {panel}
          </Modal>
        </>
      ) : (
        <Popover
          open={open}
          onOpenChange={setOpen}
          label="Repeat"
          trigger={repeatField}
        >
          <div style={{ width: 356, maxWidth: '100%' }}>{panel}</div>
        </Popover>
      )}
      {between}
      {value.rule && (
        <PickerField
          label="Ends"
          value={endsFieldLabel(value.end)}
          disabled={disabled}
          aria-expanded={open}
          onClick={() => setOpen(true)}
        />
      )}
    </>
  )
}
