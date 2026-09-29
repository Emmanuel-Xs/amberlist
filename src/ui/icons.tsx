import type { ReactNode } from 'react'
import { LogoMark } from '#/ui/logo'
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  CirclePlus,
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
  PencilLine,
  PenTool,
  Pin,
  Play,
  RotateCw,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sun,
  Target,
  Trash2,
  Undo2,
  User,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Design system icon names mapped to lucide-react, as documented in the Zen Todo README.
export const ICONS = {
  home: House,
  tasks: ListTodo,
  note: NotebookPen,
  flame: Flame,
  folder: Folder,
  plus: CirclePlus,
  search: Search,
  sliders: SlidersHorizontal,
  more: EllipsisVertical,
  x: X,
  calendar: Calendar,
  clock: Clock,
  flag: Flag,
  bell: Bell,
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
} satisfies Record<string, LucideIcon>

/**
 * Honeycomb set for the main destinations: every glyph sits in a rounded hex cell so the app
 * icons read as one family with the logo. Home is the logo itself.
 */
const HEX = 'M12 2.4 20.31 7.2v9.6L12 21.6 3.69 16.8V7.2Z'
type HoneyProps = { size: number; strokeWidth: number; className?: string }
function HoneySvg({
  size,
  strokeWidth,
  className,
  children,
}: HoneyProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}
const HONEY = {
  tasks: (p: HoneyProps) => (
    <HoneySvg {...p}>
      <path d={HEX} />
      <path d="M8.6 9.4h.01M11.4 9.4h4M8.6 12h.01M11.4 12h4M8.6 14.6h.01M11.4 14.6h4" />
    </HoneySvg>
  ),
  note: (p: HoneyProps) => (
    <HoneySvg {...p}>
      <path d={HEX} />
      <path d="M8.4 9.6h7.2M8.4 12.2h7.2M8.4 14.8h4" />
    </HoneySvg>
  ),
  folder: (p: HoneyProps) => (
    <HoneySvg {...p}>
      <path d="M8.45 4.1 12 6.15v4.1L8.45 12.3 4.9 10.25v-4.1Z" />
      <path d="M15.55 4.1 19.1 6.15v4.1L15.55 12.3 12 10.25v-4.1Z" />
      <path d="M12 10.25l3.55 2.05v4.1L12 18.45 8.45 16.4v-4.1Z" />
    </HoneySvg>
  ),
  user: (p: HoneyProps) => (
    <HoneySvg {...p}>
      <path d={HEX} />
      <circle cx="12" cy="10.2" r="2.1" />
      <path d="M8.2 16.6c.5-1.9 2-2.9 3.8-2.9s3.3 1 3.8 2.9" />
    </HoneySvg>
  ),
}

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
  const sw = strokeWidth ?? (size >= 44 ? 1.25 : 1.75)
  if (name === 'home') return <LogoMark size={size + 2} className={className} />
  if (name in HONEY) {
    const H = HONEY[name as keyof typeof HONEY]
    return <H size={size} strokeWidth={sw} className={className} />
  }
  const C = ICONS[name]
  return (
    <C size={size} strokeWidth={sw} className={className} aria-hidden="true" />
  )
}
