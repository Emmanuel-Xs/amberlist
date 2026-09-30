// Sounds from the design system (celebrations live in src/components/Celebrate.tsx).
// Quiet, rare, and only after something the user did.

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
