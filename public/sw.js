/* Honeylist service worker (Phase 3 PWA).
 * - Hashed /assets/* files: cache first (they never change). Icons and manifest: stale while revalidate.
 * - Page navigations: network first, falling back to the cached page, then the cached home shell.
 * - /api/* is never cached or touched: data stays live and private.
 * Bump VERSION to drop old caches on the next visit.
 */
const VERSION = 'v1'
const SHELL = `honeylist-shell-${VERSION}`
const STATIC = `honeylist-static-${VERSION}`
const PAGES = ['/', '/tasks', '/notes', '/folders', '/habits', '/profile']
const FILES = [
  '/manifest.webmanifest',
  '/favicon.svg',
  '/logo.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
]

const isApi = (url) => url.pathname.startsWith('/api/')
const isStatic = (url) =>
  url.pathname.startsWith('/assets/') ||
  /\.(?:js|css|woff2?|png|svg|ico|webp|jpg|webmanifest)$/.test(url.pathname)

/** Same origin script and style files a page asks for, so the shell works offline on first install. */
function assetsIn(html) {
  const out = new Set()
  const re = /(?:src|href)="(\/assets\/[^"]+)"/g
  let m
  while ((m = re.exec(html))) out.add(m[1])
  return [...out]
}

async function precache() {
  const shell = await caches.open(SHELL)
  const statics = await caches.open(STATIC)
  await statics.addAll(FILES).catch(() => undefined)
  await Promise.all(
    PAGES.map(async (path) => {
      try {
        const res = await fetch(path, { credentials: 'same-origin' })
        if (!res.ok || res.redirected) return
        await shell.put(path, res.clone())
        const assets = assetsIn(await res.text())
        await Promise.all(
          assets.map((a) =>
            statics.match(a).then((hit) => hit || statics.add(a)),
          ),
        )
      } catch {
        // Offline during install or the page is missing: runtime caching fills it in later.
      }
    }),
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) => k.startsWith('honeylist-') && ![SHELL, STATIC].includes(k),
            )
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

async function networkFirstPage(request) {
  const url = new URL(request.url)
  const key = url.pathname
  const shell = await caches.open(SHELL)
  try {
    const res = await fetch(request)
    if (res.ok && !res.redirected && res.type === 'basic')
      await shell.put(key, res.clone())
    return res
  } catch {
    const hit = (await shell.match(key)) || (await shell.match('/'))
    if (hit) return hit
    return new Response(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Offline</title><body style="font-family:system-ui;background:#1c1d21;color:#f4f3ef;display:grid;place-items:center;min-height:100vh;margin:0"><p>You’re offline. Open Honeylist again when you’re back online.</p>',
      { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } },
    )
  }
}

async function cacheFirst(request) {
  const statics = await caches.open(STATIC)
  const hit = await statics.match(request, { ignoreSearch: true })
  if (hit) return hit
  const res = await fetch(request)
  if (res.ok && res.type === 'basic') await statics.put(request, res.clone())
  return res
}

/** Icons and the manifest: answer from cache at once, refresh it in the background. */
async function staleWhileRevalidate(request, event) {
  const statics = await caches.open(STATIC)
  const hit = await statics.match(request, { ignoreSearch: true })
  const fresh = fetch(request)
    .then(async (res) => {
      if (res.ok && res.type === 'basic')
        await statics.put(request, res.clone())
      return res
    })
    .catch(() => hit || Response.error())
  if (hit) {
    event.waitUntil(fresh)
    return hit
  }
  return fresh
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || isApi(url)) return
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request))
    return
  }
  if (url.pathname.startsWith('/assets/'))
    event.respondWith(cacheFirst(request))
  else if (isStatic(url))
    event.respondWith(staleWhileRevalidate(request, event))
})
