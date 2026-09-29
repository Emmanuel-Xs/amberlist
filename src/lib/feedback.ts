// Sounds and confetti from the design system. Quiet, rare, and only after something the user did.

let ctx: AudioContext | null = null
let enabled = true
// When the last sound started, so a success toast right after an action sound stays quiet.
let lastPlayedAt = 0
export function setSoundsEnabled(on: boolean) {
  enabled = on
}

const SOUNDS: Record<string, [number, number, number][]> = {
  complete: [
    [784, 0, 0.09],
    [1175, 0.07, 0.14],
  ],
  undo: [
    [880, 0, 0.08],
    [659, 0.06, 0.1],
  ],
  delete: [
    [330, 0, 0.1],
    [247, 0.05, 0.14],
  ],
  error: [
    [311, 0, 0.12],
    [262, 0.12, 0.16],
  ],
  // Soft confirmation for success toasts: two gentle rising notes, quieter than complete.
  success: [
    [659, 0, 0.08],
    [880, 0.08, 0.14],
  ],
  celebrate: [
    [523, 0, 0.1],
    [659, 0.08, 0.1],
    [784, 0.16, 0.1],
    [1047, 0.24, 0.24],
  ],
}

const GAIN: Partial<Record<keyof typeof SOUNDS, number>> = { success: 0.035 }

/** True when a sound started within the last `ms`, so callers can avoid doubling up. */
export function playedRecently(ms = 400) {
  return Date.now() - lastPlayedAt < ms
}

export function sound(name: keyof typeof SOUNDS) {
  if (
    !enabled ||
    typeof window === 'undefined' ||
    typeof AudioContext === 'undefined'
  )
    return
  try {
    ctx ??= new AudioContext()
    lastPlayedAt = Date.now()
    const peak = GAIN[name] ?? 0.06
    const now = ctx.currentTime
    for (const [freq, at, len] of SOUNDS[name]) {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.setValueAtTime(0, now + at)
      g.gain.linearRampToValueAtTime(peak, now + at + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, now + at + len)
      o.connect(g).connect(ctx.destination)
      o.start(now + at)
      o.stop(now + at + len + 0.02)
    }
  } catch {
    // Audio is a nicety; never break the app for it.
  }
}

export function confetti() {
  if (
    typeof window === 'undefined' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return
  const cv = document.createElement('canvas')
  const dpr = window.devicePixelRatio || 1
  const W = window.innerWidth
  const H = window.innerHeight
  cv.width = W * dpr
  cv.height = H * dpr
  cv.setAttribute('aria-hidden', 'true')
  cv.style.cssText = `position:fixed;inset:0;width:${W}px;height:${H}px;pointer-events:none;z-index:9999`
  document.body.appendChild(cv)
  const c = cv.getContext('2d')
  if (!c) return
  c.scale(dpr, dpr)
  const cs = getComputedStyle(document.documentElement)
  const colors = [
    '--accent',
    '--lavender',
    '--butter',
    '--mint',
    '--peach',
    '--sky',
  ].map((v) => cs.getPropertyValue(v).trim() || '#fdb833')
  const parts = Array.from({ length: 90 }, (_, i) => {
    const a = Math.random() * Math.PI * 2
    const sp = 4 + Math.random() * 7
    return {
      x: W / 2,
      y: H * 0.35,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 5,
      w: 6 + Math.random() * 6,
      h: 3 + Math.random() * 3,
      r: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.3,
      col: colors[i % colors.length],
      round: i % 3 === 0,
    }
  })
  const start = performance.now()
  const frame = (t: number) => {
    const k = (t - start) / 1800
    c.clearRect(0, 0, W, H)
    for (const p of parts) {
      p.vy += 0.25
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.r += p.vr
      c.save()
      c.globalAlpha = Math.max(0, 1 - k * k)
      c.translate(p.x, p.y)
      c.rotate(p.r)
      c.fillStyle = p.col
      c.beginPath()
      if (p.round) c.arc(0, 0, p.h, 0, Math.PI * 2)
      else c.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, p.h / 2)
      c.fill()
      c.restore()
    }
    if (k < 1) requestAnimationFrame(frame)
    else cv.remove()
  }
  requestAnimationFrame(frame)
}
