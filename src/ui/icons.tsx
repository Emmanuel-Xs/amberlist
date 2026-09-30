import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BellOff,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Droplet,
  EllipsisVertical,
  Flag,
  Flame,
  Folder,
  House,
  Inbox,
  Link,
  ListTodo,
  LogOut,
  Menu,
  Moon,
  NotebookPen,
  Palette,
  PencilLine,
  PenTool,
  Pin,
  Play,
  Plus,
  Repeat,
  RotateCw,
  Search,
  ShoppingCart,
  SkipForward,
  SlidersHorizontal,
  Sun,
  Target,
  Trash2,
  Undo2,
  User,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// Design system icon names mapped to lucide-react, as documented in the Zen Todo README.
export const ICONS = {
  home: House,
  tasks: ListTodo,
  note: NotebookPen,
  flame: Flame,
  folder: Folder,
  plus: Plus,
  search: Search,
  sliders: SlidersHorizontal,
  more: EllipsisVertical,
  x: X,
  calendar: Calendar,
  clock: Clock,
  flag: Flag,
  bell: Bell,
  bellOff: BellOff,
  repeat: Repeat,
  skip: SkipForward,
  inbox: Inbox,
  check: Check,
  play: Play,
  pin: Pin,
  link: Link,
  scratch: PencilLine,
  trash: Trash2,
  alert: AlertTriangle,
  refresh: RotateCw,
  undo: Undo2,
  download: Download,
  copy: Copy,
  logout: LogOut,
  arrowLeft: ArrowLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  user: User,
  moon: Moon,
  sun: Sun,
  book: BookOpen,
  pen: PenTool,
  droplet: Droplet,
  target: Target,
  cart: ShoppingCart,
  menu: Menu,
  palette: Palette,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS

export function Icon({
  name,
  size = 20,
  strokeWidth,
  className,
}: {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
}) {
  const C = ICONS[name]
  return (
    <C
      size={size}
      strokeWidth={strokeWidth ?? (size >= 44 ? 1.25 : 1.75)}
      className={className}
      aria-hidden="true"
    />
  )
}

// ---------- Nav icons (design board 14, option B: honey fill when active) ----------

const HONEY = { fill: 'var(--accent)', stroke: 'var(--accent-ink)' }
const HOME =
  'M4 11.2c0-.6.27-1.16.73-1.54l6.1-5a1.85 1.85 0 0 1 2.34 0l6.1 5c.46.38.73.94.73 1.54V18.5a2.5 2.5 0 0 1-2.5 2.5h-2.1a1 1 0 0 1-1-1v-3.6a2.4 2.4 0 0 0-4.8 0V20a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 18.5Z'
const COMB_TOP = 'M6.5 2.8 10.14 4.9v4.2L6.5 11.2 2.86 9.1V4.9Z'
const COMB_BOTTOM = 'M6.5 12.8 10.14 14.9v4.2L6.5 21.2 2.86 19.1v-4.2Z'
const COMB_CHECK = 'm4.7 7.1 1.3 1.3 2.4-2.6'
// Lucide NotebookPen, Folder and User, plus filled variants drawn in the same style.
const NOTE_BODY =
  'M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4'
const NOTE_PEN =
  'M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z'
// The page under the pen, closed along the pen's lower edge so the fill never crosses it.
const NOTE_FILL =
  'M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4L16.37 10.64l-.86.5-2.87.84-.62-.62.84-2.87.5-.85Z'
const NOTE_RINGS = 'M2 6h4M2 10h4M2 14h4M2 18h4'
const FOLDER =
  'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'

// Lucide Flame, drawn as a closed shape so it can take the honey fill.
const FLAME =
  'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z'

const NAV_GLYPHS: Partial<
  Record<IconName, { idle: ReactNode; active: ReactNode }>
> = {
  home: {
    idle: <path d={HOME} />,
    active: <path d={HOME} {...HONEY} />,
  },
  tasks: {
    idle: (
      <>
        <path d={COMB_TOP} />
        <path d={COMB_CHECK} />
        <path d={COMB_BOTTOM} />
        {/* The second line is shorter so it reads as a list, not stripes. */}
        <path d="M13 7h8M13 17h5" />
      </>
    ),
    active: (
      <>
        <path d={COMB_TOP} {...HONEY} />
        <path d={COMB_CHECK} stroke="var(--on-accent)" />
        <path d={COMB_BOTTOM} />
        <path d="M13 7h8M13 17h5" />
      </>
    ),
  },
  note: {
    idle: (
      <>
        <path d={NOTE_BODY} />
        <path d={NOTE_RINGS} />
        <path d={NOTE_PEN} />
      </>
    ),
    active: (
      <>
        <path d={NOTE_FILL} fill="var(--accent)" stroke="none" />
        <path d={NOTE_BODY} stroke="var(--accent-ink)" />
        {/* Dark outline so the pen stays readable where accent-ink equals accent. */}
        <path d={NOTE_PEN} fill="var(--accent)" stroke="var(--on-accent)" />
        <path d={NOTE_RINGS} stroke="var(--accent-ink)" />
      </>
    ),
  },
  folder: {
    idle: <path d={FOLDER} />,
    active: <path d={FOLDER} {...HONEY} />,
  },
  flame: {
    idle: <path d={FLAME} />,
    active: <path d={FLAME} {...HONEY} />,
  },
  user: {
    idle: (
      <>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    active: (
      <>
        <path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2Z" {...HONEY} />
        <circle cx="12" cy="7" r="4" {...HONEY} />
      </>
    ),
  },
}

/**
 * Nav item icon. Inactive: outline in the item colour (ink-muted). Active: the shape fills with
 * honey, edges in accent-ink, inner marks in on-accent. Icons without a drawn glyph fall back to
 * the plain lucide icon.
 */
export function NavIcon({
  name,
  active,
  size = 22,
}: {
  name: IconName
  active?: boolean
  size?: number
}) {
  const glyph = NAV_GLYPHS[name]
  if (!glyph) return <Icon name={name} size={size} />
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="nav-icon"
    >
      {/* Both layers render; CSS shows the honey one when active or hovered. */}
      <g
        className="nav-icon-off"
        style={active ? { display: 'none' } : undefined}
      >
        {glyph.idle}
      </g>
      <g
        className="nav-icon-on"
        style={active ? { display: 'inline' } : undefined}
      >
        {glyph.active}
      </g>
    </svg>
  )
}
