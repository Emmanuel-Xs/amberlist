import {
  AlertTriangle,
  ArrowLeft,
  Bell,
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
  plus: Plus,
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
