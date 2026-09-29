import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, RefObject } from 'react'
import { useCategories, useNotes } from '#/lib/api'
import {
  colorVar,
  contrastRatio,
  customShade,
  formatRatio,
  hexToHsl,
  isHexColor,
  MIN_CONTRAST,
  ON_PASTEL_HEX,
  recentCustomColors,
} from '#/lib/colors'
import type { HexColor } from '#/lib/colors'
import { Icon } from '#/ui/icons'
import { Button } from '#/ui/zen'

const HUE_TRACK = `linear-gradient(to right, ${Array.from(
  { length: 13 },
  (_, i) => customShade(i * 30),
).join(', ')})`

/**
 * Colour radiogroup for notes and folders: preset tokens, up to 6 custom colours the user already
 * uses (derived from their notes and folders), and "Add your own colour" with a hue slider.
 */
export function ColorPicker<T extends string>({
  label,
  presets,
  value,
  onChange,
}: {
  label: string
  presets: readonly T[]
  value: T | HexColor
  onChange: (color: T | HexColor) => void
}) {
  const { data: notes = [] } = useNotes()
  const { data: folders = [] } = useCategories()
  // Colours added or open in this picker stay put while it is mounted, so picking a preset
  // doesn't make a just-added swatch vanish. Across reloads the list comes from notes and folders.
  const [kept, setKept] = useState<HexColor[]>(() =>
    isHexColor(value) ? [value.toLowerCase() as HexColor] : [],
  )
  const customs = useMemo(
    () =>
      recentCustomColors([
        ...kept,
        ...[...notes]
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .map((n) => n.color),
        ...folders.map((f) => f.color),
      ]),
    [kept, notes, folders],
  )
  const options: (T | HexColor)[] = [...presets, ...customs]
  const selected = (isHexColor(value) ? value.toLowerCase() : value) as
    T | HexColor
  const group = useRef<HTMLDivElement>(null)
  const addBtn = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  // Arrow keys move and select, like native radios; only the checked swatch is in the tab order.
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0
    if (!step) return
    e.preventDefault()
    const i = Math.max(0, options.indexOf(selected))
    const next = (i + step + options.length) % options.length
    onChange(options[next])
    requestAnimationFrame(() =>
      group.current
        ?.querySelectorAll<HTMLButtonElement>('[role=radio]')
        [next]?.focus(),
    )
  }
  const close = () => {
    setOpen(false)
    requestAnimationFrame(() => addBtn.current?.focus())
  }

  return (
    <div className="color-picker">
      <span className="zn-field-label" aria-hidden="true">
        Color
      </span>
      <div className="color-picker-row">
        <div
          ref={group}
          role="radiogroup"
          aria-label={label}
          onKeyDown={onKey}
          className="color-picker-swatches"
        >
          {options.map((c) => {
            const on = selected === c
            const plain = c === 'surface'
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={
                  on || (!options.includes(selected) && c === options[0])
                    ? 0
                    : -1
                }
                aria-label={
                  plain ? 'Plain' : isHexColor(c) ? `Custom colour ${c}` : c
                }
                className={['zn-swatch color-swatch', on && 'is-selected']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onChange(c)}
                style={{
                  background: colorVar(c),
                  boxShadow: plain
                    ? 'inset 0 0 0 1px var(--line-strong)'
                    : undefined,
                }}
              >
                {on && (
                  <Icon
                    name="check"
                    size={18}
                    className={plain ? 'note-swatch-ink' : undefined}
                  />
                )}
              </button>
            )
          })}
        </div>
        <button
          ref={addBtn}
          type="button"
          className="color-add"
          aria-label="Add your own colour"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => (open ? close() : setOpen(true))}
        >
          <Icon name="palette" size={20} />
        </button>
      </div>
      {open && (
        <CustomColorPopover
          initial={isHexColor(value) ? value : null}
          onCancel={close}
          onAdd={(hex) => {
            setKept((k) => [hex, ...k.filter((c) => c !== hex)])
            onChange(hex)
            close()
          }}
          ignore={addBtn}
        />
      )}
    </div>
  )
}

function CustomColorPopover({
  initial,
  onCancel,
  onAdd,
  ignore,
}: {
  initial: string | null
  onCancel: () => void
  onAdd: (hex: HexColor) => void
  ignore: RefObject<HTMLButtonElement | null>
}) {
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)
  const [hue, setHue] = useState(() =>
    initial ? Math.round(hexToHsl(initial).h) : 200,
  )
  const hex = customShade(hue)
  const ratio = contrastRatio(hex, ON_PASTEL_HEX)
  const readable = ratio >= MIN_CONTRAST

  const cancel = useRef(onCancel)
  cancel.current = onCancel

  // Focus the slider once on open; a click outside the panel (and its trigger) cancels.
  useEffect(() => {
    panel.current?.querySelector<HTMLInputElement>('input')?.focus()
    const outside = (e: MouseEvent) => {
      const t = e.target as Node
      if (!panel.current?.contains(t) && !ignore.current?.contains(t))
        cancel.current()
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [ignore])

  return (
    <div
      ref={panel}
      role="dialog"
      aria-labelledby={`${id}-title`}
      className="zn-popover color-popover"
      onKeyDown={(e) => {
        // Esc closes only the popover, not a surrounding dialog.
        if (e.key === 'Escape') {
          e.stopPropagation()
          onCancel()
        }
      }}
    >
      <p id={`${id}-title`} className="color-popover-title">
        Add your own colour
      </p>
      <div className="color-popover-body">
        <span
          className="color-preview"
          style={{ background: hex }}
          aria-hidden="true"
        >
          Aa
        </span>
        <div className="color-popover-slider">
          <label htmlFor={`${id}-hue`} className="zn-field-label">
            Hue
          </label>
          <input
            id={`${id}-hue`}
            type="range"
            min={0}
            max={359}
            step={1}
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
            aria-valuetext={`Hue ${hue} degrees`}
            className="color-hue"
            style={{ background: HUE_TRACK }}
          />
        </div>
      </div>
      <p className="color-check" aria-live="polite">
        <Icon name={readable ? 'check' : 'alert'} size={16} />
        {readable ? 'Text stays readable' : 'Text is hard to read'}:{' '}
        {formatRatio(ratio)} to 1
      </p>
      <div className="color-popover-actions">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={!readable} onClick={() => onAdd(hex)}>
          Add colour
        </Button>
      </div>
    </div>
  )
}
