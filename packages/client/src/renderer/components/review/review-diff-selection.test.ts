import { describe, expect, it } from 'vitest'
import { parseDiff } from '../code/parse-diff'
import { buildReviewDiffRows, extendReviewDiffRange } from './review-diff-selection'

const PATCH = [
  '@@ -1,3 +1,3 @@ header',
  ' context one',
  '-removed line',
  '+added line',
  '@@ -10,2 +10,3 @@',
  ' context two',
  '+tail line',
].join('\n')

describe('buildReviewDiffRows', () => {
  it('anchors del rows on the left side and add/context rows on the right side', () => {
    const rows = buildReviewDiffRows(parseDiff(PATCH))

    expect(rows[0]?.anchor).toBeNull()
    expect(rows[1]?.anchor).toEqual({ side: 'RIGHT', line: 1, hunkIndex: 0 })
    expect(rows[2]?.anchor).toEqual({ side: 'LEFT', line: 2, hunkIndex: 0 })
    expect(rows[3]?.anchor).toEqual({ side: 'RIGHT', line: 2, hunkIndex: 0 })
    expect(rows[4]?.anchor).toBeNull()
    expect(rows[5]?.anchor).toEqual({ side: 'RIGHT', line: 10, hunkIndex: 1 })
    expect(rows[6]?.anchor).toEqual({ side: 'RIGHT', line: 11, hunkIndex: 1 })
  })

  it('skips rows without a line number on their side', () => {
    const rows = buildReviewDiffRows(parseDiff('@@ -1 +1 @@\n+only\n\\ No newline at end of file'))

    expect(rows[2]?.anchor).toBeNull()
  })
})

describe('extendReviewDiffRange', () => {
  const start = { side: 'RIGHT' as const, line: 5, hunkIndex: 0 }

  it('returns a single-line range when start and current match', () => {
    expect(extendReviewDiffRange(start, start)).toEqual({ side: 'RIGHT', startLine: null, line: 5 })
  })

  it('orders the range regardless of drag direction', () => {
    expect(extendReviewDiffRange(start, { side: 'RIGHT', line: 9, hunkIndex: 0 }))
      .toEqual({ side: 'RIGHT', startLine: 5, line: 9 })
    expect(extendReviewDiffRange(start, { side: 'RIGHT', line: 2, hunkIndex: 0 }))
      .toEqual({ side: 'RIGHT', startLine: 2, line: 5 })
  })

  it('collapses to the start line when the side differs', () => {
    expect(extendReviewDiffRange(start, { side: 'LEFT', line: 9, hunkIndex: 0 }))
      .toEqual({ side: 'RIGHT', startLine: null, line: 5 })
  })

  it('collapses to the start line when the hunk differs or current is missing', () => {
    expect(extendReviewDiffRange(start, { side: 'RIGHT', line: 20, hunkIndex: 1 }))
      .toEqual({ side: 'RIGHT', startLine: null, line: 5 })
    expect(extendReviewDiffRange(start, null))
      .toEqual({ side: 'RIGHT', startLine: null, line: 5 })
  })
})
