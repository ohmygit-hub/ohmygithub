export type DiffLineType = 'add' | 'del' | 'context' | 'hunk'

export interface DiffLine {
  type: DiffLineType
  content: string
  oldLine: number | null
  newLine: number | null
}

const HUNK_HEADER = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$/

/**
 * Parse a GitHub unified patch (the `files[].patch` field) into display lines.
 *
 * The leading +/-/space marker is stripped from `content`, `type` carries the
 * classification, and `oldLine`/`newLine` carry the 1-based line numbers
 * derived from the `@@` hunk headers (null where a side does not apply).
 * Hunk lines keep only the section context that trails the `@@ ... @@`, so the
 * raw range syntax is never rendered as code.
 */
export function parseDiff(patch: string): DiffLine[] {
  if (!patch) return []

  const lines: DiffLine[] = []
  let oldNo = 0
  let newNo = 0

  for (const raw of patch.split('\n')) {
    const hunk = HUNK_HEADER.exec(raw)
    if (hunk) {
      oldNo = Number(hunk[1])
      newNo = Number(hunk[2])
      lines.push({ type: 'hunk', content: hunk[3].trim(), oldLine: null, newLine: null })
      continue
    }

    if (raw.startsWith('@@')) {
      lines.push({ type: 'hunk', content: '', oldLine: null, newLine: null })
      continue
    }

    if (raw.startsWith('+')) {
      lines.push({ type: 'add', content: raw.slice(1), oldLine: null, newLine: newNo })
      newNo += 1
      continue
    }

    if (raw.startsWith('-')) {
      lines.push({ type: 'del', content: raw.slice(1), oldLine: oldNo, newLine: null })
      oldNo += 1
      continue
    }

    if (raw.startsWith('\\')) {
      // "\ No newline at end of file" — metadata, not a real line.
      lines.push({ type: 'context', content: raw, oldLine: null, newLine: null })
      continue
    }

    const content = raw.startsWith(' ') ? raw.slice(1) : raw
    lines.push({ type: 'context', content, oldLine: oldNo, newLine: newNo })
    oldNo += 1
    newNo += 1
  }

  return lines
}
