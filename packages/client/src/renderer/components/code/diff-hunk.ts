/**
 * Trim a review-comment diff hunk down to its trailing context lines so a
 * thread card shows where the comment sits without repeating the whole hunk.
 */
export function trimDiffHunk(diffHunk: string | null, maxLines = 4): string {
  if (!diffHunk) return ''

  const lines = diffHunk.split('\n').filter((line) => !line.startsWith('@@'))

  return lines.slice(-maxLines).join('\n')
}
