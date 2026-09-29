import { describe, expect, it } from 'vitest'
import {
  checklistLines,
  continueList,
  toggleChecklist,
  togglePrefix,
} from '../src/lib/markdown'

describe('checklists', () => {
  const body = 'Intro\n- [ ] one\n- [x] two\n```\n- [ ] not real\n```\n- [ ] three'

  it('finds checklist lines and ignores code fences', () => {
    expect(checklistLines(body)).toEqual([1, 2, 6])
  })

  it('toggles one line both ways and leaves the rest alone', () => {
    const a = toggleChecklist(body, 1)
    expect(a.split('\n')[1]).toBe('- [x] one')
    expect(a.split('\n')[2]).toBe('- [x] two')
    expect(toggleChecklist(a, 2).split('\n')[2]).toBe('- [ ] two')
  })

  it('ignores lines that are not checklist items', () => {
    expect(toggleChecklist(body, 0)).toBe(body)
    expect(toggleChecklist(body, 99)).toBe(body)
  })
})

describe('continueList', () => {
  it('continues a checklist with an empty box', () => {
    const body = '- [x] done'
    const r = continueList(body, body.length)
    expect(r?.body).toBe('- [x] done\n- [ ] ')
    expect(r?.caret).toBe(r?.body.length)
  })

  it('continues bullets and numbers', () => {
    expect(continueList('- milk', 6)?.body).toBe('- milk\n- ')
    expect(continueList('2. eggs', 7)?.body).toBe('2. eggs\n3. ')
  })

  it('ends the list on an empty item', () => {
    const r = continueList('- a\n- [ ] ', 10)
    expect(r?.body).toBe('- a\n')
    expect(r?.caret).toBe(4)
  })

  it('splits the line at the caret', () => {
    expect(continueList('- [ ] abcd', 8)?.body).toBe('- [ ] ab\n- [ ] cd')
  })

  it('returns null on plain text and when the caret is inside the marker', () => {
    expect(continueList('hello', 5)).toBeNull()
    expect(continueList('- [ ] task', 2)).toBeNull()
  })
})

describe('togglePrefix', () => {
  it('adds and removes a prefix on the current line', () => {
    const on = togglePrefix('a\nb', 3, '- [ ] ')
    expect(on.body).toBe('a\n- [ ] b')
    expect(togglePrefix(on.body, on.caret, '- [ ] ').body).toBe('a\nb')
  })

  it('swaps one marker for another', () => {
    expect(togglePrefix('- item', 6, '# ').body).toBe('# item')
  })
})
