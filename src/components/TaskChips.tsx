import type { Task } from '#/lib/api'
import { toISODate } from '#/lib/dates'
import { readPermission } from '#/lib/notifications'
import { offsetLabel, remindAtFor, utcToZoned } from '#/lib/reminders'
import { leftLabel, repeatLabel } from '#/lib/repeat'
import { Icon } from '#/ui/icons'

const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

/** Repeat icon plus a short label: Daily, Weekdays, Every 3 days. "4 left" or "Last one" when it applies. */
export function RepeatChip({ task }: { task: Task }) {
  if (!task.repeatRule) return null
  const left = task.status === 'done' ? null : leftLabel(task.repeatEnd)
  return (
    <>
      <span className="task-chip">
        <Icon name="repeat" size={13} />
        {repeatLabel(task.repeatRule)}
      </span>
      {left && <span className="task-chip">{left}</span>}
    </>
  )
}

/** The words for a reminder chip, and how it should look. */
export function reminderChip(task: Task) {
  if (task.remindOffset === null || task.status === 'done') return null
  const zone = browserZone()
  const today = toISODate(new Date())
  const expected = remindAtFor(task, task.remindOffset, zone)
  if (task.remindAt) {
    const at = new Date(
      task.remindAt.endsWith('Z') ? task.remindAt : `${task.remindAt}Z`,
    )
    const z = utcToZoned(at, zone)
    const snoozed =
      !expected || Math.abs(expected.getTime() - at.getTime()) > 60_000
    if (snoozed) return { text: `Snoozed to ${z.time}`, soft: true }
    if (z.date === today) return { text: z.time, soft: false }
  }
  return {
    text: offsetLabel(task.remindOffset).replace(' minutes', ' min'),
    soft: false,
  }
}

/** Bell plus when it will fire; amber soft while snoozed; a slashed bell when notifications are blocked. */
export function ReminderChip({ task }: { task: Task }) {
  const chip = reminderChip(task)
  if (!chip) return null
  const blocked = readPermission() === 'denied'
  return (
    <span
      className={[
        'task-chip',
        chip.soft && 'task-chip--soft',
        blocked && 'task-chip--warn',
      ]
        .filter(Boolean)
        .join(' ')}
      title={
        blocked
          ? 'Notifications are blocked, so reminders only show inside Honeylist'
          : undefined
      }
    >
      <Icon name={blocked ? 'bellOff' : 'bell'} size={13} />
      {chip.text}
    </span>
  )
}
