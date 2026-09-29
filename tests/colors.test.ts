import { describe, expect, it } from 'vitest'
import {
  colorVar,
  contrastRatio,
  customShade,
  formatRatio,
  hexToHsl,
  hslToHex,
  isAllowedCustomColor,
  isHexColor,
  ON_PASTEL_HEX,
  recentCustomColors,
} from '../src/lib/colors'

describe('hslToHex', () => {
  it('converts known colours', () => {
    expect(hslToHex(0, 100, 50)).toBe('#ff0000')
    expect(hslToHex(120, 100, 50)).toBe('#00ff00')
    expect(hslToHex(240, 100, 50)).toBe('#0000ff')
    expect(hslToHex(0, 0, 100)).toBe('#ffffff')
    expect(hslToHex(0, 0, 0)).toBe('#000000')
    expect(hslToHex(360, 100, 50)).toBe('#ff0000')
  })
  it('round trips through hexToHsl', () => {
    const { h, s, l } = hexToHsl(hslToHex(200, 70, 80))
    // hex rounding moves each channel by at most half a step
    expect(Math.abs(h - 200)).toBeLessThan(1)
    expect(Math.abs(s - 70)).toBeLessThan(1.5)
    expect(Math.abs(l - 80)).toBeLessThan(0.5)
  })
})

describe('contrastRatio', () => {
  it('matches WCAG reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
    expect(contrastRatio('#1c1d21', '#fdb833')).toBe(
      contrastRatio('#fdb833', '#1c1d21'),
    )
  })
})

describe('customShade', () => {
  it('is HSL(h, 70%, 80%) as lowercase hex', () => {
    expect(customShade(270)).toBe('#cca8f0')
    expect(customShade(0)).toMatch(/^#[0-9a-f]{6}$/)
  })
  it('keeps on-pastel text at 4.5:1 or better for every hue', () => {
    for (let h = 0; h < 360; h++) {
      const hex = customShade(h)
      expect(contrastRatio(hex, ON_PASTEL_HEX)).toBeGreaterThanOrEqual(4.5)
      expect(isAllowedCustomColor(hex)).toBe(true)
    }
  })
})

describe('isAllowedCustomColor', () => {
  it('accepts soft light shades in either case', () => {
    expect(isAllowedCustomColor('#cca8f0')).toBe(true)
    expect(isAllowedCustomColor('#CCA8F0')).toBe(true)
  })
  it('rejects dark, too light, low contrast and malformed values', () => {
    expect(isAllowedCustomColor('#333366')).toBe(false) // too dark
    expect(isAllowedCustomColor('#ffffff')).toBe(false) // lightness 100
    expect(isAllowedCustomColor('#6666ff')).toBe(false) // 70% but under 4.5:1
    expect(isAllowedCustomColor('#abc')).toBe(false)
    expect(isAllowedCustomColor('lavender')).toBe(false)
    expect(isAllowedCustomColor('#gggggg')).toBe(false)
  })
})

describe('colorVar', () => {
  it('maps tokens to CSS variables and passes custom hex through', () => {
    expect(colorVar('lavender')).toBe('var(--lavender)')
    expect(colorVar('surface')).toBe('var(--surface)')
    expect(colorVar('#CCA8F0')).toBe('#cca8f0')
    expect(isHexColor('#cca8f0')).toBe(true)
  })
})

describe('recentCustomColors', () => {
  it('keeps unique custom hex values in order, at most 6', () => {
    const used = [
      'mint',
      '#aaaaaa',
      '#AAAAAA',
      '#bbbbbb',
      'surface',
      '#cccccc',
      '#dddddd',
      '#eeeeee',
      '#f0f0f0',
      '#f1f1f1',
    ]
    expect(recentCustomColors(used)).toEqual([
      '#aaaaaa',
      '#bbbbbb',
      '#cccccc',
      '#dddddd',
      '#eeeeee',
      '#f0f0f0',
    ])
  })
})

describe('formatRatio', () => {
  it('rounds down to one decimal so it never overstates', () => {
    expect(formatRatio(4.4999)).toBe('4.4')
    expect(formatRatio(7.86)).toBe('7.8')
  })
})
