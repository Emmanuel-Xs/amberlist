import { Store } from '@tanstack/react-store'
import { playedRecently, sound } from './feedback'
import type { IconName } from '#/ui/icons'

export type ToastBadge = 'logo' | 'check' | 'trash' | 'alert' | 'flame'

export interface ToastItem {
  id: number
  message: string
  /** Optional second line, muted. */
  detail?: string
  /** A bigger face on the left for friendly messages; replaces icon. */
  badge?: ToastBadge
  icon?: IconName
  tone?: 'neutral' | 'success' | 'error'
  actionLabel?: string
  onAction?: () => void
  duration?: number
  /** Success toasts play a soft sound; pass true when the caller already played one. */
  silent?: boolean
}

// UI state that is not server data lives here (TanStack Store).
export const ui = new Store({
  createOpen: false,
  createDraft: '',
  scratchOpen: false,
  shortcutsOpen: false,
  toasts: [] as ToastItem[],
})

let seq = 0
export function toast(t: Omit<ToastItem, 'id'>) {
  const id = ++seq
  // Skipped when a sound just played (for example "complete" right before "Task completed").
  if (t.tone === 'success' && !t.silent && !playedRecently()) sound('success')
  ui.setState((s) => ({ ...s, toasts: [...s.toasts, { ...t, id }].slice(-3) }))
  if (t.duration !== 0) setTimeout(() => dismissToast(id), t.duration ?? 4000)
  return id
}
export function dismissToast(id: number) {
  ui.setState((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) }))
}
export const openCreate = (draft = '') =>
  ui.setState((s) => ({ ...s, createOpen: true, createDraft: draft }))
export const closeCreate = () =>
  ui.setState((s) => ({ ...s, createOpen: false }))
export const setScratch = (open: boolean) =>
  ui.setState((s) => ({ ...s, scratchOpen: open }))
export const setShortcuts = (open: boolean) =>
  ui.setState((s) => ({ ...s, shortcutsOpen: open }))
