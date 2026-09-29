type IconName = 'check'|'search'|'sliders'|'more'|'home'|'tasks'|'plus'|'calendar'|'clock'|'user'|'bell'|'note'|'droplet'|'book'|'pen'|'target'|'sun'|'cart'|'arrowLeft'|'trash'|'folder'|'pin'|'flame'|'inbox'|'flag'|'x'|'chevronRight'|'chevronDown'|'play'|'menu'|'link'|'moon'|'scratch'|'alert'|'refresh'|'undo'|'download'|'logout'|'copy';
type Tone = 'lavender'|'butter'|'mint'|'peach'|'sky';
type Layout = 'auto'|'bar'|'rail'|'sidebar';
export interface IconProps { name: IconName; size?: number; strokeWidth?: number; className?: string }
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { loading?: boolean; variant?: 'primary'|'secondary'|'outline'|'ghost'|'danger'|'danger-solid'; size?: 'sm'|'md'|'lg'; icon?: IconName; block?: boolean }
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { id: string; label?: string; optional?: boolean; hint?: string; error?: boolean; variant?: 'line'|'filled'; trailingIcon?: IconName }
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { id: string; label?: string; optional?: boolean; hint?: string; error?: boolean; variant?: 'line'|'filled' }
export interface SwitchProps { checked?: boolean; defaultChecked?: boolean; onCheckedChange?: (v: boolean) => void; label?: string; icon?: IconName; disabled?: boolean; id?: string; 'aria-label'?: string }
export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { selected?: boolean; icon?: IconName }
export interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> { onFilter?: (() => void) | null; filterLabel?: string }
export interface TaskItemProps { title: string; time?: string; category?: string; hasNote?: boolean; done?: boolean; selected?: boolean; onToggle?: () => void; onOpen?: () => void; onMenu?: () => void }
export interface CategoryCardProps { title: string; count?: number; tone?: Tone; icon?: IconName; onClick?: () => void }
export interface ProgressCardProps { title: string; meta?: string; description?: string; value: number; icon?: IconName; onMenu?: () => void }
export interface DateStripProps { days: { key: string; day: string | number; weekday: string; today?: boolean }[]; value?: string; defaultValue?: string; onChange?: (key: string) => void; label?: string }
export interface AppNavProps { items: { id: string; label: string; icon: IconName; href?: string }[]; active?: string; onSelect?: (id: string) => void; brand?: string; layout?: Layout; fixed?: boolean }
export interface AppShellProps { nav: React.ReactNode; children: React.ReactNode; aside?: React.ReactNode; asideLabel?: string; layout?: Exclude<Layout,'bar'> }
export interface IllustrationProps { name: 'tasks'|'done'|'notes'|'folder'|'habits'|'search'|'offline'; width?: number; className?: string }
export interface EmptyStateProps { illustration: IllustrationProps['name']; title: string; text?: string; illustrationWidth?: number; children?: React.ReactNode }
export interface SkeletonProps { width?: number | string; height?: number | string; radius?: number | string }
export interface ToastProps { tone?: 'neutral'|'success'|'error'; duration?: number; paused?: boolean; message: string; icon?: IconName; actionLabel?: string; onAction?: () => void; onClose?: (() => void) | null }
export interface AlertProps { tone?: 'danger'|'warning'|'success'|'info'; title?: string; icon?: IconName; actionLabel?: string; actionIcon?: IconName; onAction?: () => void; children?: React.ReactNode }
export interface MenuItem { label?: string; icon?: IconName; danger?: boolean; shortcut?: string; disabled?: boolean; separator?: boolean; onSelect?: () => void }
export interface MenuProps { items: MenuItem[]; label?: string }
export interface ConfirmDialogProps { title: string; text: string; confirmLabel?: string; confirmIcon?: IconName; cancelLabel?: string; confirmText?: string; icon?: IconName; id?: string; onConfirm?: () => void; onCancel?: () => void }
export interface DialogProps { title: string; description?: string; wide?: boolean; id?: string; footer?: React.ReactNode; onClose?: (() => void) | null; children?: React.ReactNode }
export interface SheetProps { title: string; side?: 'bottom'|'right'; id?: string; footer?: React.ReactNode; onClose?: () => void; children?: React.ReactNode }
export interface PopoverProps { label: string; children?: React.ReactNode }
export interface TooltipProps { label: string; shortcut?: string; open?: boolean; children: React.ReactNode }
export interface ToasterProps { position?: 'bottom-center'|'bottom-left'|'static'; children?: React.ReactNode }
/** Zen.sound('complete'|'undo'|'delete'|'error'|'celebrate'|'tap', { volume }) and Zen.sound.enable(boolean) */
/** Zen.confetti({ x, y, count, duration, container }) */
