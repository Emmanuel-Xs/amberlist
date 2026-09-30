import { useCallback, useEffect, useState } from 'react'
import { ApiError, api } from './api'

/**
 * Reminder notifications, browser side: what the browser allows, turning Web Push on and off.
 * Permission is always read live from `Notification.permission`, never stored.
 */
export type Permission = 'unsupported' | 'default' | 'granted' | 'denied'

export interface NotifyState {
  permission: Permission
  /** This browser has a push subscription saved on the server. */
  subscribed: boolean
  /** iPhone and iPad only allow Web Push once Honeylist is on the Home Screen. */
  needsInstall: boolean
  ready: boolean
}

const CHANGE = 'honeylist-notify-change'

const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

const supported = () =>
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window

export function readPermission(): Permission {
  if (typeof window === 'undefined' || !('Notification' in window))
    return 'unsupported'
  return Notification.permission
}

async function registration() {
  if (!('serviceWorker' in navigator)) return null
  return (await navigator.serviceWorker.getRegistration()) ?? null
}

async function readState(): Promise<NotifyState> {
  const needsInstall = isIos() && !isStandalone()
  const permission =
    needsInstall && !supported() ? 'unsupported' : readPermission()
  let subscribed = false
  if (supported() && permission === 'granted') {
    const reg = await registration()
    subscribed = !!(await reg?.pushManager.getSubscription())
  }
  return { permission, subscribed, needsInstall, ready: true }
}

const announce = () => window.dispatchEvent(new Event(CHANGE))

/** Live notification state for the pre prompt, Remind me, banners and the Profile row. */
export function useNotifyState() {
  const [state, setState] = useState<NotifyState>({
    permission: 'default',
    subscribed: false,
    needsInstall: false,
    ready: false,
  })
  const refresh = useCallback(async () => setState(await readState()), [])
  useEffect(() => {
    void refresh()
    window.addEventListener(CHANGE, refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener(CHANGE, refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [refresh])
  return { ...state, refresh }
}

const keyBytes = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export type EnableResult =
  'on' | 'denied' | 'dismissed' | 'unsupported' | 'unavailable' | 'error'

/**
 * Asks the browser for permission (call this only after our own pre prompt), then subscribes
 * this browser and saves the subscription. `unavailable` means the server has no push keys or
 * there is no service worker (dev): reminders still work as in app banners.
 */
export async function enableReminders(): Promise<EnableResult> {
  if (!supported()) return 'unsupported'
  const answer = await Notification.requestPermission()
  announce()
  if (answer === 'denied') return 'denied'
  if (answer !== 'granted') return 'dismissed'
  try {
    const cfg = await api<{ enabled: boolean; publicKey: string | null }>(
      '/push/config',
    )
    const reg = await registration()
    if (!cfg.enabled || !cfg.publicKey || !reg) return 'unavailable'
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(cfg.publicKey),
      }))
    const json = sub.toJSON()
    await api('/push/subscription', {
      method: 'POST',
      json: {
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      },
    })
    announce()
    return 'on'
  } catch {
    return 'error'
  }
}

/** Already allowed but not subscribed on this browser (new device, cleared data): subscribe quietly. */
export const resubscribe = () =>
  readPermission() === 'granted'
    ? enableReminders()
    : Promise.resolve('dismissed')

export async function disableReminders() {
  const reg = await registration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    await api('/push/subscription', {
      method: 'DELETE',
      json: { endpoint: sub.endpoint },
    }).catch((e: unknown) => {
      if (!(e instanceof ApiError)) throw e
    })
    await sub.unsubscribe()
  }
  announce()
}

/** Profile "Send a test": how many browsers it reached. */
export const sendTestNotification = () =>
  api<{ reached: number }>('/push/test', { method: 'POST' })
