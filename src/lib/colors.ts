/** Colour helpers for note and folder grounds: preset tokens plus soft custom shades. Pure, shared by client and server. */

export const PRESET_COLORS = [
  'lavender',
  'butter',
  'mint',
  'peach',
  'sky',
] as const
export const NOTE_PRESET_COLORS = ['surface', ...PRESET_COLORS] as const
export type PresetColor = (typeof PRESET_COLORS)[number]
export type NotePresetColor = (typeof NOTE_PRESET_COLORS)[number]

/** Custom colours are stored as `#rrggbb`. */
export type HexColor = `#${string}`

/** The on-pastel token value (same in both themes); used only for contrast maths. */
export const ON_PASTEL_HEX = '#1c1d21'
/** Custom shades are HSL(h, 70%, 80%): soft and light so on-pastel text stays readable. */
export const CUSTOM_SATURATION = 70
export const CUSTOM_LIGHTNESS = 80
/** Lightness band the server accepts for a custom hex. */
export const MIN_LIGHTNESS = 70
export const MAX_LIGHTNESS = 90
export const MIN_CONTRAST = 4.5
export const MAX_CUSTOM_COLORS = 6

const HEX = /^#[0-9a-f]{6}$/i

export const isHexColor = (c: string): c is HexColor => HEX.test(c)
export const isPresetColor = (c: string): c is NotePresetColor =>
  (NOTE_PRESET_COLORS as readonly string[]).includes(c)

/** CSS value for a stored colour: `var(--token)` for presets, the hex itself for custom colours. */
export function colorVar(c: string): string {
  return isHexColor(c) ? c.toLowerCase() : `var(--${c})`
}

/** HSL (h 0..360, s and l 0..100) to lowercase `#rrggbb`. */
export function hslToHex(h: number, s: number, l: number): HexColor {
  const hue = ((h % 360) + 360) % 360
  const sat = s / 100
  const lig = l / 100
  const k = (n: number) => (n + hue / 30) % 12
  const a = sat * Math.min(lig, 1 - lig)
  const f = (n: number) =>
    lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const part = (n: number) =>
    Math.round(f(n) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${part(0)}${part(8)}${part(4)}`
}

export function hexToRgb(hex: string): [number, number, number] {
  if (!isHexColor(hex)) throw new Error(`Not a hex colour: ${hex}`)
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Hex to HSL with h 0..360 and s, l 0..100 (unrounded). */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as [
    number,
    number,
    number,
  ]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l: l * 100 }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h = (h * 60 + 360) % 360
  return { h, s: s * 100, l: l * 100 }
}

/** WCAG 2.x relative luminance. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two hex colours, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** The soft shade for a hue: HSL(h, 70%, 80%) as hex. */
export const customShade = (hue: number): HexColor =>
  hslToHex(hue, CUSTOM_SATURATION, CUSTOM_LIGHTNESS)

/** A custom hex the app accepts: lightness 70% to 90% and on-pastel text at 4.5:1 or better. */
export function isAllowedCustomColor(c: string): boolean {
  if (!isHexColor(c)) return false
  const { l } = hexToHsl(c)
  return (
    l >= MIN_LIGHTNESS &&
    l <= MAX_LIGHTNESS &&
    contrastRatio(c, ON_PASTEL_HEX) >= MIN_CONTRAST
  )
}

/** Custom colours already in use, most recent first, unique, at most 6. */
export function recentCustomColors(used: readonly string[]): HexColor[] {
  const out: HexColor[] = []
  for (const c of used) {
    if (!isHexColor(c)) continue
    const hex = c.toLowerCase() as HexColor
    if (!out.includes(hex)) out.push(hex)
    if (out.length === MAX_CUSTOM_COLORS) break
  }
  return out
}

/** "7.8" style ratio for the readable check line. */
export const formatRatio = (r: number) => (Math.floor(r * 10) / 10).toFixed(1)
