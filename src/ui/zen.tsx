import { useEffect, useId, useRef, useState } from 'react'
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './icons'
import type { IconName } from './icons'

const cx = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(' ')

// ---------- Button ----------
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?:
    'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'danger-solid'
  size?: 'sm' | 'md' | 'lg'
  icon?: IconName
  block?: boolean
  loading?: boolean
}
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  block,
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'zn-btn',
        `zn-btn--${variant}`,
        `zn-btn--${size}`,
        block && 'zn-btn--block',
        children == null && 'zn-btn--icon-only',
        children != null && (icon || loading) && 'zn-btn--lead-icon',
        loading && 'is-loading',
        className,
      )}
    >
      {loading ? (
        <span className="zn-spinner" aria-hidden="true" />
      ) : (
        icon && <Icon name={icon} size={size === 'sm' ? 16 : 20} />
      )}
      {children != null && <span className="zn-btn-label">{children}</span>}
    </button>
  )
}

// ---------- Chip ----------
export function Chip({
  selected,
  icon,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  icon?: IconName
}) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      {...rest}
      className={cx('zn-chip', selected && 'is-selected', className)}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  )
}

// ---------- Fields ----------
interface FieldBits {
  label?: string
  hint?: string
  error?: string | null
  optional?: boolean
  variant?: 'line' | 'filled'
  trailingIcon?: IconName
}
function Field({
  id,
  label,
  hint,
  error,
  optional,
  variant = 'line',
  trailingIcon,
  children,
  className,
}: FieldBits & { id: string; children: ReactNode; className?: string }) {
  return (
    <div className={cx('zn-field', `zn-field--${variant}`, className)}>
      {label && (
        <label className="zn-field-label" htmlFor={id}>
          {label}
          {optional && <span className="zn-field-opt"> (Optional)</span>}
        </label>
      )}
      <div className="zn-field-control">
        {children}
        {trailingIcon && (
          <Icon name={trailingIcon} size={18} className="zn-field-trail" />
        )}
      </div>
      {(error || hint) && (
        <p
          id={`${id}-hint`}
          className={cx('zn-field-hint', !!error && 'is-error')}
        >
          {error || hint}
        </p>
      )}
    </div>
  )
}
export function Input({
  label,
  hint,
  error,
  optional,
  variant,
  trailingIcon,
  className,
  id,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & FieldBits) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <Field
      id={fid}
      {...{ label, hint, error, optional, variant, trailingIcon, className }}
    >
      <input
        id={fid}
        {...rest}
        className="zn-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${fid}-hint` : undefined}
      />
    </Field>
  )
}
export function Textarea({
  label,
  hint,
  error,
  optional,
  variant,
  className,
  id,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldBits) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <Field id={fid} {...{ label, hint, error, optional, variant, className }}>
      <textarea
        id={fid}
        rows={3}
        {...rest}
        className="zn-input zn-textarea"
        aria-invalid={error ? true : undefined}
      />
    </Field>
  )
}

// ---------- Switch ----------
export function Switch({
  checked,
  onChange,
  label,
  icon,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  icon?: IconName
  disabled?: boolean
}) {
  return (
    <label className="zn-switch-row">
      <span className="zn-switch-label">
        {icon && <Icon name={icon} size={18} />}
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={cx('zn-switch', checked && 'is-on')}
        onClick={() => onChange(!checked)}
      >
        <span className="zn-switch-thumb" />
      </button>
    </label>
  )
}

// ---------- Search ----------
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search',
  onFilter,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  onFilter?: () => void
  className?: string
}) {
  return (
    <div className={cx('zn-search', className)} role="search">
      <Icon name="search" size={20} className="zn-search-icon" />
      <input
        type="search"
        className="zn-search-input"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {onFilter && (
        <button
          type="button"
          className="zn-search-filter"
          aria-label="Filters"
          onClick={onFilter}
        >
          <Icon name="sliders" size={18} />
        </button>
      )}
    </div>
  )
}

// ---------- Illustrations (original, from the design system) ----------
const S = {
  stroke: 'var(--on-pastel)',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}
const f = (c: string) => ({
  style: { fill: c === 'paper' ? '#fdfcf9' : `var(--${c})` },
})
const Ground = () => (
  <ellipse
    cx={100}
    cy={136}
    rx={70}
    ry={8}
    style={{ fill: 'var(--surface-raised)' }}
  />
)
const ILLOS: Record<string, () => ReactNode> = {
  tasks: () => (
    <>
      <Ground />
      <circle cx={156} cy={34} r={14} style={{ fill: 'var(--accent)' }} />
      <rect
        {...S}
        {...f('lavender')}
        x={58}
        y={28}
        width={84}
        height={104}
        rx={14}
      />
      <rect
        {...S}
        {...f('butter')}
        x={80}
        y={20}
        width={40}
        height={18}
        rx={7}
      />
      <circle {...S} {...f('accent')} cx={80} cy={60} r={8} />
      <path {...S} fill="none" d="M76 60l3 3 5-6M96 60h30" />
      <circle {...S} {...f('paper')} cx={80} cy={84} r={8} />
      <path {...S} fill="none" d="M96 84h24" />
      <circle {...S} {...f('paper')} cx={80} cy={108} r={8} />
      <path {...S} fill="none" d="M96 108h28" />
    </>
  ),
  done: () => (
    <>
      <Ground />
      <rect
        {...S}
        {...f('mint')}
        x={30}
        y={44}
        width={28}
        height={10}
        rx={5}
        transform="rotate(-20 44 49)"
      />
      <rect
        {...S}
        {...f('lavender')}
        x={146}
        y={30}
        width={24}
        height={10}
        rx={5}
        transform="rotate(25 158 35)"
      />
      <rect
        {...S}
        {...f('sky')}
        x={150}
        y={98}
        width={26}
        height={10}
        rx={5}
        transform="rotate(-10 163 103)"
      />
      <circle {...S} {...f('peach')} cx={42} cy={104} r={6} />
      <circle {...S} {...f('accent')} cx={100} cy={74} r={42} />
      <path
        d="M80 74l14 14 26-28"
        fill="none"
        stroke="var(--on-pastel)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  notes: () => (
    <>
      <Ground />
      <rect
        {...S}
        {...f('butter')}
        x={46}
        y={34}
        width={78}
        height={96}
        rx={12}
        transform="rotate(-8 85 82)"
      />
      <rect
        {...S}
        {...f('lavender')}
        x={72}
        y={26}
        width={78}
        height={96}
        rx={12}
        transform="rotate(6 111 74)"
      />
      <path
        {...S}
        fill="none"
        d="M88 52h40M86 66h44M84 80h30"
        transform="rotate(6 111 74)"
      />
      <rect
        {...S}
        {...f('peach')}
        x={144}
        y={44}
        width={14}
        height={62}
        rx={3}
        transform="rotate(30 151 75)"
      />
    </>
  ),
  folder: () => (
    <>
      <Ground />
      <path
        {...S}
        {...f('butter')}
        d="M40 44a8 8 0 0 1 8-8h30l10 10h64a8 8 0 0 1 8 8v70a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8z"
      />
      <rect
        x={62}
        y={36}
        width={76}
        height={58}
        rx={6}
        style={{ fill: '#fdfcf9' }}
        stroke="var(--on-pastel)"
        strokeWidth={2}
        strokeDasharray="5 5"
      />
      <path
        {...S}
        {...f('accent')}
        d="M34 70a8 8 0 0 1 8-8h116a8 8 0 0 1 8 8l-6 52a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8z"
      />
    </>
  ),
  search: () => (
    <>
      <Ground />
      <rect
        x={40}
        y={26}
        width={104}
        height={90}
        rx={16}
        fill="none"
        stroke="var(--line-strong)"
        strokeWidth={2}
        strokeDasharray="6 6"
      />
      <path
        {...S}
        stroke="var(--ink)"
        strokeWidth={10}
        fill="none"
        d="M128 98l24 24"
      />
      <circle {...S} {...f('sky')} cx={108} cy={76} r={30} />
      <path
        d="M98 70a10 10 0 1 1 14 9c-3 2-4 3-4 7M108 94v1"
        fill="none"
        stroke="var(--on-pastel)"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </>
  ),
  offline: () => (
    <>
      <Ground />
      <path
        {...S}
        {...f('sky')}
        d="M58 104a24 24 0 0 1 4-47 32 32 0 0 1 60-6 26 26 0 0 1 22 53z"
      />
      <path
        d="M60 36l84 84"
        stroke="var(--danger)"
        strokeWidth={6}
        strokeLinecap="round"
      />
    </>
  ),
}
export type IllustrationName =
  'tasks' | 'done' | 'notes' | 'folder' | 'search' | 'offline'
export function Illustration({
  name,
  width = 180,
}: {
  name: IllustrationName
  width?: number
}) {
  return (
    <svg
      width={width}
      height={width * 0.75}
      viewBox="0 0 200 150"
      className="zn-illo"
      aria-hidden="true"
    >
      {ILLOS[name]()}
    </svg>
  )
}

export function EmptyState({
  illustration,
  title,
  text,
  children,
  width,
}: {
  illustration: IllustrationName
  title: string
  text?: string
  children?: ReactNode
  width?: number
}) {
  return (
    <div className="zn-empty">
      <Illustration name={illustration} width={width} />
      <h3 className="zn-empty-title">{title}</h3>
      {text && <p className="zn-empty-text">{text}</p>}
      {children && <div className="zn-empty-actions">{children}</div>}
    </div>
  )
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius,
}: {
  width?: number | string
  height?: number | string
  radius?: number | string
}) {
  return (
    <span
      className="zn-skeleton"
      aria-hidden="true"
      style={{ width, height, borderRadius: radius }}
    />
  )
}

export function Alert({
  tone = 'danger',
  title,
  children,
  actionLabel,
  onAction,
}: {
  tone?: 'danger' | 'warning' | 'success' | 'info'
  title?: string
  children?: ReactNode
  actionLabel?: string
  onAction?: () => void
}) {
  const icon: IconName =
    tone === 'success' ? 'check' : tone === 'info' ? 'bell' : 'alert'
  return (
    <div
      className={cx('zn-alert', `zn-alert--${tone}`)}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <span className="zn-alert-icon">
        <Icon name={icon} />
      </span>
      <div className="zn-alert-body">
        {title && <strong className="zn-alert-title">{title}</strong>}
        {children}
      </div>
      {actionLabel && (
        <Button variant="ghost" size="sm" icon="refresh" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

// ---------- Menu ----------
export interface MenuItem {
  label?: string
  icon?: IconName
  danger?: boolean
  shortcut?: string
  separator?: boolean
  onSelect?: () => void
}
export function MenuButton({
  label,
  items,
}: {
  label: string
  items: MenuItem[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    ref.current?.querySelector<HTMLButtonElement>('[role=menuitem]')?.focus()
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const els = Array.from(
      ref.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]') ?? [],
    )
    const i = els.indexOf(document.activeElement as HTMLButtonElement)
    els.at((i + (e.key === 'ArrowDown' ? 1 : -1)) % els.length)?.focus()
  }
  return (
    <div ref={ref} style={{ position: 'relative' }} onKeyDown={onKey}>
      <button
        type="button"
        className="zn-icon-btn"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="more" />
      </button>
      {open && (
        <div
          className="zn-menu"
          role="menu"
          aria-label={label}
          style={{ position: 'absolute', right: 0, top: 44, zIndex: 40 }}
        >
          {items.map((it, i) =>
            it.separator ? (
              <div key={`s${i}`} className="zn-menu-sep" role="separator" />
            ) : (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                className={cx('zn-menu-item', it.danger && 'is-danger')}
                onClick={() => {
                  setOpen(false)
                  it.onSelect?.()
                }}
              >
                {it.icon && <Icon name={it.icon} size={18} />}
                <span>{it.label}</span>
                {it.shortcut && (
                  <kbd className="zn-menu-kbd">{it.shortcut}</kbd>
                )}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}

// ---------- Modal: dialog on tablet and up, bottom sheet on phones ----------
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = 'responsive',
  role = 'dialog',
  icon,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  variant?: 'responsive' | 'right'
  role?: 'dialog' | 'alertdialog'
  icon?: IconName
}) {
  const ref = useRef<HTMLDivElement>(null)
  const tid = useId()
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const el = ref.current
    const focusables = () =>
      Array.from(
        el?.querySelectorAll<HTMLElement>(
          'button,[href],input,textarea,select,[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((x) => !x.hasAttribute('disabled'))
    const first =
      el?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0]
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
      if (e.key === 'Tab') {
        const els = focusables()
        if (!els.length) return
        const a = els[0]
        const z = els[els.length - 1]
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault()
          z.focus()
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault()
          a.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      prev?.focus()
    }
  }, [open, onClose])
  if (!open || typeof document === 'undefined') return null
  return createPortal(
    <div className={cx('app-modal', `app-modal--${variant}`)}>
      <div
        className="zn-scrim"
        style={{ position: 'fixed' }}
        onClick={onClose}
      />
      <div
        ref={ref}
        role={role}
        aria-modal="true"
        aria-labelledby={tid}
        className={cx('app-modal-panel', 'zn-scroll')}
      >
        {variant === 'responsive' && (
          <span className="zn-sheet-grip app-grip" aria-hidden="true" />
        )}
        {icon && (
          <span className="zn-dialog-icon">
            <Icon name={icon} size={22} />
          </span>
        )}
        <div className="zn-dialog-head">
          <div>
            <h2 id={tid} className="zn-dialog-title">
              {title}
            </h2>
            {description && (
              <p className="zn-dialog-text" style={{ marginTop: 4 }}>
                {description}
              </p>
            )}
          </div>
          {role === 'dialog' && (
            <button
              type="button"
              className="zn-icon-btn"
              aria-label="Close"
              onClick={onClose}
            >
              <Icon name="x" />
            </button>
          )}
        </div>
        {children && <div className="zn-dialog-body">{children}</div>}
        {footer && <div className="zn-dialog-actions">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  text,
  confirmLabel = 'Delete',
  confirmText,
  icon = 'trash',
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  text: string
  confirmLabel?: string
  confirmText?: string
  icon?: IconName
}) {
  const [typed, setTyped] = useState('')
  useEffect(() => setTyped(''), [open])
  const ok = !confirmText || typed === confirmText
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={text}
      role="alertdialog"
      icon={icon}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-autofocus="">
            Cancel
          </Button>
          <Button
            variant="danger-solid"
            icon="trash"
            disabled={!ok}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {confirmText && (
        <Input
          label={`Type ${confirmText} to confirm`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
        />
      )}
    </Modal>
  )
}
