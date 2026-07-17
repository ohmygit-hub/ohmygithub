import type { DiffLine } from '../code/parse-diff'

export type ReviewDiffSide = 'LEFT' | 'RIGHT'

export interface ReviewDiffAnchor {
  side: ReviewDiffSide
  line: number
  hunkIndex: number
}

export interface ReviewDiffRange {
  side: ReviewDiffSide
  startLine: number | null
  line: number
}

export interface ReviewDiffRow {
  diff: DiffLine
  anchor: ReviewDiffAnchor | null
}

/**
 * Deleted lines anchor on the LEFT (old) side; added and context lines anchor
 * on the RIGHT (new) side, matching how GitHub review comments address lines.
 * Hunk headers and no-newline metadata rows are not commentable.
 */
export function buildReviewDiffRows(lines: DiffLine[]): ReviewDiffRow[] {
  let hunkIndex = -1

  return lines.map((diff) => {
    if (diff.type === 'hunk') {
      hunkIndex += 1
      return { diff, anchor: null }
    }

    if (diff.type === 'del') {
      return {
        diff,
        anchor: diff.oldLine === null ? null : { side: 'LEFT' as const, line: diff.oldLine, hunkIndex },
      }
    }

    return {
      diff,
      anchor: diff.newLine === null ? null : { side: 'RIGHT' as const, line: diff.newLine, hunkIndex },
    }
  })
}

/**
 * The GitHub API cannot anchor a multi-line comment across sides or hunks, so
 * a drag onto an incompatible row collapses back to the start line.
 */
export function extendReviewDiffRange(
  start: ReviewDiffAnchor,
  current: ReviewDiffAnchor | null,
): ReviewDiffRange {
  if (!current || current.side !== start.side || current.hunkIndex !== start.hunkIndex) {
    return { side: start.side, startLine: null, line: start.line }
  }

  const low = Math.min(start.line, current.line)
  const high = Math.max(start.line, current.line)

  return { side: start.side, startLine: low === high ? null : low, line: high }
}
