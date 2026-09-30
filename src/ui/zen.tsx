import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  cloneElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactElement,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './icons'
import { LogoMark } from './logo'
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
  label?: ReactNode
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
// One comb cell on a 24 grid (the logo's cell), for pastel bits.
const COMB_CELL = 'M12 2.4 20.31 7.2v9.6L12 21.6 3.69 16.8V7.2Z'
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
      {/* The ticked box is the logo: a promise of what done looks like here. */}
      <LogoMark x={66} y={45} size={30} />
      <path {...S} fill="none" d="M96 60h30" />
      <circle {...S} {...f('paper')} cx={80} cy={84} r={8} />
      <path {...S} fill="none" d="M96 84h24" />
      <circle {...S} {...f('paper')} cx={80} cy={108} r={8} />
      <path {...S} fill="none" d="M96 108h28" />
    </>
  ),
  // The day is sealed: the big logo, its drop landed as a honey puddle, comb cell bits around.
  done: () => (
    <>
      <Ground />
      <ellipse
        cx={100}
        cy={134}
        rx={16}
        ry={3.2}
        style={{ fill: 'var(--accent)' }}
      />
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
      <path
        {...S}
        {...f('sky')}
        d={COMB_CELL}
        transform="translate(150 94) scale(1.05)"
      />
      <path
        {...S}
        {...f('peach')}
        d={COMB_CELL}
        transform="translate(34 94) scale(.7)"
      />
      <LogoMark x={52} y={8} size={100} drop={false} />
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
  habits: () => (
    <>
      <Ground />
      <circle cx={150} cy={38} r={14} style={{ fill: 'var(--accent)' }} />
      <path {...S} stroke="var(--ink)" fill="none" d="M100 100V54" />
      <ellipse
        {...S}
        {...f('mint')}
        cx={84}
        cy={62}
        rx={18}
        ry={9}
        transform="rotate(-30 84 62)"
      />
      <ellipse
        {...S}
        {...f('mint')}
        cx={116}
        cy={74}
        rx={18}
        ry={9}
        transform="rotate(30 116 74)"
      />
      <path {...S} {...f('peach')} d="M72 98h56l-8 34H80z" />
      <rect
        {...S}
        {...f('peach')}
        x={66}
        y={92}
        width={68}
        height={12}
        rx={4}
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
  'tasks' | 'done' | 'notes' | 'folder' | 'habits' | 'search' | 'offline'
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

// ---------- Tooltip ----------
const TIP_DELAY = 400
const TIP_GAP = 8
type TipChild = ReactElement<{
  'aria-label'?: string
  'aria-describedby'?: string
}>
/**
 * Inverted bubble above an icon button (below when there is no room). Shows after 400ms of mouse
 * hover or at once on keyboard focus, hides on Esc, blur, leave, press or scroll. Never on touch.
 * The wrapper is `display: contents`, so it never changes the trigger's layout.
 */
export function Tooltip({
  label,
  shortcut,
  media,
  children,
}: {
  label: string
  shortcut?: string
  /** Only show while this media query matches, e.g. when a rail hides the labels. */
  media?: string
  children: TipChild
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const wrap = useRef<HTMLSpanElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const allowed = () =>
    !window.matchMedia('(pointer: coarse)').matches &&
    (!media || window.matchMedia(media).matches)
  const trigger = () => wrap.current?.firstElementChild as HTMLElement | null
  const hide = () => {
    window.clearTimeout(timer.current)
    setOpen(false)
  }
  const show = (delay: number) => {
    if (!allowed()) return
    window.clearTimeout(timer.current)
    if (delay === 0) setOpen(true)
    else timer.current = window.setTimeout(() => setOpen(true), delay)
  }
  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    const r = trigger()?.getBoundingClientRect()
    const el = tip.current
    if (!r || !el) return
    const w = el.offsetWidth
    const h = el.offsetHeight
    const above = r.top - h - TIP_GAP
    const top = above < TIP_GAP ? r.bottom + TIP_GAP : above
    const left = Math.min(
      Math.max(TIP_GAP, r.left + r.width / 2 - w / 2),
      window.innerWidth - w - TIP_GAP,
    )
    setPos({ left, top })
  }, [open])
  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && hide()
    document.addEventListener('keydown', esc, true)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      document.removeEventListener('keydown', esc, true)
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [open])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  // Only describe what the accessible name doesn't already say.
  const describe = !!shortcut || children.props['aria-label'] !== label
  const body = (
    <>
      {label}
      {shortcut && <kbd className="zn-tooltip-kbd">{shortcut}</kbd>}
    </>
  )
  return (
    <span
      ref={wrap}
      className="zn-tooltip-anchor"
      onPointerEnter={(e) => e.pointerType === 'mouse' && show(TIP_DELAY)}
      onPointerLeave={() => {
        if (!trigger()?.matches(':focus-visible')) hide()
      }}
      onPointerDown={hide}
      onFocus={() => {
        if (trigger()?.matches(':focus-visible')) show(0)
      }}
      onBlur={hide}
    >
      {describe
        ? cloneElement(children, {
            'aria-describedby': [children.props['aria-describedby'], id]
              .filter(Boolean)
              .join(' '),
          })
        : children}
      {open ? (
        createPortal(
          <div
            ref={tip}
            id={id}
            role="tooltip"
            className="zn-tooltip"
            style={{
              left: pos?.left ?? 0,
              top: pos?.top ?? 0,
              visibility: pos ? 'visible' : 'hidden',
            }}
          >
            {body}
          </div>,
          document.body,
        )
      ) : (
        <span id={id} hidden>
          {body}
        </span>
      )}
    </span>
  )
}

/** Icon-only button with its aria-label shown as a Tooltip (plus the shortcut, if any). */
export function IconButton({
  label,
  icon,
  shortcut,
  iconSize = 20,
  tooltipMedia,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  icon: IconName
  shortcut?: string
  iconSize?: number
  tooltipMedia?: string
}) {
  return (
    <Tooltip label={label} shortcut={shortcut} media={tooltipMedia}>
      <button
        type="button"
        {...rest}
        aria-label={label}
        className={cx('zn-icon-btn', className)}
      >
        <Icon name={icon} size={iconSize} />
      </button>
    </Tooltip>
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
  tip,
  triggerClassName,
}: {
  label: string
  items: MenuItem[]
  /** Short tooltip for the trigger, e.g. "More actions". */
  tip?: string
  triggerClassName?: string
}) {
  // shadcn/ui DropdownMenu (Radix): portal, collision flip, roving focus, typeahead, Esc.
  // Styled with our own zn-menu classes, so it looks exactly like the approved design.
  const trigger = (
    <DropdownMenu.Trigger asChild>
      <button
        type="button"
        className={cx('zn-icon-btn', triggerClassName)}
        aria-label={label}
      >
        <Icon name="more" />
      </button>
    </DropdownMenu.Trigger>
  )
  return (
    <DropdownMenu.Root modal={false}>
      {tip ? <Tooltip label={tip}>{trigger}</Tooltip> : trigger}
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="zn-menu"
          aria-label={label}
          align="end"
          side="bottom"
          sideOffset={6}
          collisionPadding={8}
          style={{ zIndex: 60 }}
        >
          {items.map((it, i) =>
            it.separator ? (
              <DropdownMenu.Separator key={`s${i}`} className="zn-menu-sep" />
            ) : (
              <DropdownMenu.Item
                key={it.label}
                className={cx('zn-menu-item', it.danger && 'is-danger')}
                onSelect={() => it.onSelect?.()}
              >
                {it.icon && <Icon name={it.icon} size={18} />}
                <span>{it.label}</span>
                {it.shortcut && (
                  <kbd className="zn-menu-kbd">{it.shortcut}</kbd>
                )}
              </DropdownMenu.Item>
            ),
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
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
  // Keep the latest onClose without re-running the effect: callers pass inline functions,
  // and re-running it on every render refocused the first field (the phone keyboard kept popping up).
  const closeRef = useRef(onClose)
  closeRef.current = onClose
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
    // On touch screens focusing a field opens the keyboard, so only do it where typing is the
    // whole point (fields marked data-autofocus). Otherwise focus the panel itself.
    const touch = window.matchMedia('(pointer: coarse)').matches
    const marked = el?.querySelector<HTMLElement>('[data-autofocus]')
    const first = touch ? marked : (marked ?? focusables()[0])
    if (first) first.focus()
    else el?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
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
  }, [open])
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
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={tid}
        className={cx(
          'app-modal-panel',
          'zn-scroll',
          role === 'alertdialog' && 'app-modal-panel--alert',
        )}
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
            <IconButton
              label="Close"
              icon="x"
              shortcut="Esc"
              onClick={onClose}
            />
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
          label={
            <>
              Type <strong className="confirm-word">{confirmText}</strong> to
              confirm
            </>
          }
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
        />
      )}
    </Modal>
  )
}
