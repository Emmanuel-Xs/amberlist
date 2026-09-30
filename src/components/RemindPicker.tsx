import { useState } from 'react'
import { toISODate, addDays } from '#/lib/dates'
import {
  REMIND_PRESETS,
  DEFAULT_START_TIME,
  customToOffset,
  offsetLabel,
  offsetToCustom,
  remindAtFor,
  utcToZoned,
} from '#/lib/reminders'
import { shortDate } from '#/lib/repeat'
import { usePhone } from '#/lib/useMedia'
import { Icon } from '#/ui/icons'
import {
  Alert,
  Button,
  Chip,
  Input,
  Modal,
  PickerField,
  Popover,
} from '#/ui/zen'
import { useNotifyFlow } from './NotifyDialogs'

const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

interface Timing {
  startDate: string
  startTime: string
  dueDate?: string
}

/** When a reminder would fire in this browser's zone, as words: "today at 09:50". */
export function fireWords(t: Timing, offset: number) {
  const at = remindAtFor(
    {
      startDate: t.startDate || null,
      startTime: t.startTime || null,
      dueDate: t.dueDate || null,
    },
    offset,
    browserZone(),
  )
  if (!at) return null
  const z = utcToZoned(at, browserZone())
  const today = toISODate(new Date())
  const day =
    z.date === today
      ? 'today'
      : z.date === addDays(today, 1)
        ? 'tomorrow'
        : shortDate(z.date)
  return { day, time: z.time }
}

function Hint({ t, offset }: { t: Timing; offset: number }) {
  const w = fireWords(t, offset)
  if (!w)
    return (
      <div className="pk-note" role="status">
        <span className="pk-note-icon">
          <Icon name="bell" size={18} />
        </span>
        <span className="pk-note-text">
          Add a start date so we know when to remind you.
        </span>
      </div>
    )
  return (
    <div className="pk-note" role="status">
      <span className="pk-note-icon">
        <Icon name="bell" size={18} />
      </span>
      <span className="pk-note-text">
        You will be reminded {w.day} at {w.time}.
        <small>
          {t.startTime
            ? `The task starts at ${t.startTime}.`
            : `No start time, so we count from ${DEFAULT_START_TIME}.`}
        </small>
      </span>
    </div>
  )
}

function Options({
  value,
  timing,
  blocked,
  onPick,
  onCustom,
  onHelp,
}: {
  value: number | null
  timing: Timing
  blocked: boolean
  onPick: (v: number | null) => void
  onCustom: () => void
  onHelp: () => void
}) {
  const isCustom =
    value !== null && !REMIND_PRESETS.some((p) => p.value === value)
  return (
    <div className="pk-body">
      <span className="pk-label">Remind me</span>
      <div className="pk-opts" role="radiogroup" aria-label="Remind me">
        {REMIND_PRESETS.map((p) => {
          const w = p.value === null ? null : fireWords(timing, p.value)
          const on = value === p.value
          return (
            <button
              key={p.label}
              type="button"
              role="radio"
              aria-checked={on}
              className="pk-opt"
              onClick={() => onPick(p.value)}
            >
              <span className="pk-opt-check">
                {on && <Icon name="check" size={16} />}
              </span>
              <span className="pk-opt-main">{p.label}</span>
              {w && p.value !== 0 && (
                <span className="pk-opt-side">At {w.time}</span>
              )}
            </button>
          )
        })}
        <button
          type="button"
          role="radio"
          aria-checked={isCustom}
          className="pk-opt"
          onClick={onCustom}
        >
          <span className="pk-opt-check">
            {isCustom && <Icon name="check" size={16} />}
          </span>
          <span className="pk-opt-main">
            {isCustom ? offsetLabel(value) : 'Custom time'}
          </span>
          <Icon name="chevronRight" size={16} />
        </button>
      </div>
      {value !== null && <Hint t={timing} offset={value} />}
      {blocked && (
        <Alert
          tone="warning"
          title="Notifications are blocked"
          actionLabel="How to fix"
          actionIcon="bellOff"
          onAction={onHelp}
        >
          Reminders will show inside Honeylist while it is open.
        </Alert>
      )}
    </div>
  )
}

function CustomTime({
  value,
  timing,
  onBack,
  onDone,
}: {
  value: number | null
  timing: Timing
  onBack: () => void
  onDone: (v: number) => void
}) {
  const initial =
    value !== null
      ? offsetToCustom(value, timing.startTime || null)
      : { daysBefore: 0, time: '08:00' }
  const [days, setDays] = useState(Math.min(2, initial.daysBefore))
  const [time, setTime] = useState(initial.time)
  const offset = customToOffset(days, time, timing.startTime || null)
  return (
    <div className="pk-body">
      <span className="pk-label">Pick a day and a time</span>
      <div className="pk-chips" role="radiogroup" aria-label="Day">
        {['Same day', 'Day before', '2 days before'].map((label, i) => (
          <Chip
            key={label}
            role="radio"
            aria-checked={days === i}
            selected={days === i}
            onClick={() => setDays(i)}
          >
            {label}
          </Chip>
        ))}
      </div>
      <div className="pk-times">
        <Input
          type="time"
          label="Time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          error={
            offset === null ? 'Pick a time before the task starts.' : undefined
          }
        />
      </div>
      {offset !== null && <Hint t={timing} offset={offset} />}
      <div className="pk-actions">
        <Button variant="secondary" onClick={onBack}>
          Cancel
        </Button>
        <Button
          disabled={offset === null}
          onClick={() => offset !== null && onDone(offset)}
        >
          Done
        </Button>
      </div>
    </div>
  )
}

/**
 * The Remind me field. Options open in a popover (tablet and up) or a bottom sheet (phones).
 * Choosing a reminder for the first time starts the friendly permission flow.
 */
export function RemindField({
  value,
  timing,
  onChange,
}: {
  value: number | null
  timing: Timing
  onChange: (v: number | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'options' | 'custom'>('options')
  const phone = usePhone()
  const flow = useNotifyFlow()
  const blocked = flow.notify.permission === 'denied'

  const close = () => {
    setOpen(false)
    setView('options')
  }
  const choose = (v: number | null) => {
    onChange(v)
    close()
    if (v !== null) {
      const w = fireWords(timing, v)
      flow.afterPick(w?.time)
    }
  }
  const panel = open ? (
    view === 'custom' ? (
      <CustomTime
        value={value}
        timing={timing}
        onBack={() => setView('options')}
        onDone={choose}
      />
    ) : (
      <Options
        value={value}
        timing={timing}
        blocked={blocked}
        onPick={choose}
        onCustom={() => setView('custom')}
        onHelp={() => {
          close()
          flow.openHelp()
        }}
      />
    )
  ) : null

  const field = (
    <PickerField
      label="Remind me"
      trailingIcon={blocked && value !== null ? 'bellOff' : 'bell'}
      value={offsetLabel(value)}
      aria-expanded={open}
      onClick={phone ? () => setOpen(true) : undefined}
    />
  )
  return (
    <>
      {phone ? (
        <>
          {field}
          <Modal open={open} onClose={close} title="Remind me">
            {panel}
          </Modal>
        </>
      ) : (
        <Popover
          open={open}
          onOpenChange={(o) => (o ? setOpen(true) : close())}
          label="Remind me"
          trigger={field}
        >
          <div style={{ width: 340, maxWidth: '100%' }}>{panel}</div>
        </Popover>
      )}
      {flow.dialogs}
    </>
  )
}
