import type { RepositorySectionId } from './types'

export type RepositorySectionCounts = Pick<
  GitHubRepositoryOverviewCounts,
  'commits' | 'openIssues' | 'openPullRequests'
>

export function createRepositorySectionCountLabel(
  section: RepositorySectionId,
  counts: RepositorySectionCounts | null,
): string | null {
  if (!counts) return null

  const count = getRepositorySectionCount(section, counts)
  if (count === null) return null

  return `(${new Intl.NumberFormat().format(count)})`
}

export function resolveRepositorySidebarCounts(
  navigationCounts: RepositorySectionCounts | null,
  overviewCounts: RepositorySectionCounts | null,
): RepositorySectionCounts | null {
  return navigationCounts ?? overviewCounts
}

function getRepositorySectionCount(
  section: RepositorySectionId,
  counts: RepositorySectionCounts,
): number | null {
  if (section === 'commits') return counts.commits
  if (section === 'pullRequests') return counts.openPullRequests
  if (section === 'issues') return counts.openIssues

  return null
}
