/** Small pure helpers for the note editor: checklists and list continuation. */

const CHECK_LINE = /^(\s*)([-*+]) \[( |x|X)\] ?/
const BULLET_LINE = /^(\s*)([-*+]) /
const NUMBER_LINE = /^(\s*)(\d+)\. /

/** Line numbers (0 based) of every checklist item, in order. */
export function checklistLines(body: string): number[] {
  const out: number[] = []
  let fence = false
  body.split('\n').forEach((line, i) => {
    if (/^\s*```/.test(line)) fence = !fence
    if (!fence && CHECK_LINE.test(line)) out.push(i)
  })
  return out
}

/** Flip the checkbox on one line. Other lines are untouched. */
export function toggleChecklist(body: string, line: number): string {
  const lines = body.split('\n')
  const l = lines[line]
  if (l === undefined) return body
  lines[line] = l.replace(
    CHECK_LINE,
    (_m, indent: string, mark: string, state: string) =>
      `${indent}${mark} [${state === ' ' ? 'x' : ' '}] `,
  )
  return lines.join('\n')
}

export interface Edit {
  body: string
  caret: number
}

/**
 * Enter inside a list keeps the list going: "- [ ] " after a checklist item, "- " after a bullet,
 * the next number after a numbered item. Enter on an empty item ends the list.
 * Returns null when the caret is not on a list line, so the browser handles Enter normally.
 */
export function continueList(body: string, caret: number): Edit | null {
  const start = body.lastIndexOf('\n', caret - 1) + 1
  const endIdx = body.indexOf('\n', caret)
  const end = endIdx === -1 ? body.length : endIdx
  const line = body.slice(start, end)
  const before = body.slice(start, caret)

  const check = CHECK_LINE.exec(line)
  const bullet = check ? null : BULLET_LINE.exec(line)
  const num = check || bullet ? null : NUMBER_LINE.exec(line)
  const m = check ?? bullet ?? num
  if (!m || before.length < m[0].length) return null

  const marker = m[0]
  const rest = line.slice(marker.length)
  if (rest.trim() === '') {
    // Empty item: drop the marker and leave the list.
    const next = body.slice(0, start) + body.slice(end)
    return { body: next, caret: start }
  }
  const indent = m[1] ?? ''
  const next = check
    ? `${indent}${check[2]} [ ] `
    : bullet
      ? `${indent}${bullet[2]} `
      : `${indent}${Number(num?.[2]) + 1}. `
  const insert = '\n' + next
  return {
    body: body.slice(0, caret) + insert + body.slice(caret),
    caret: caret + insert.length,
  }
}

/** Add or remove a line prefix (like "- [ ] " or "# ") on the line holding the caret. */
export function togglePrefix(
  body: string,
  caret: number,
  prefix: string,
): Edit {
  const start = body.lastIndexOf('\n', caret - 1) + 1
  const endIdx = body.indexOf('\n', caret)
  const end = endIdx === -1 ? body.length : endIdx
  const line = body.slice(start, end)
  if (line.startsWith(prefix)) {
    return {
      body: body.slice(0, start) + line.slice(prefix.length) + body.slice(end),
      caret: Math.max(start, caret - prefix.length),
    }
  }
  // Swap any other list or heading marker for this one.
  const stripped = line.replace(
    /^(\s*)([-*+] \[( |x|X)\] |[-*+] |\d+\. |#{1,6} )/,
    '$1',
  )
  return {
    body: body.slice(0, start) + prefix + stripped + body.slice(end),
    caret: caret + prefix.length - (line.length - stripped.length),
  }
}
