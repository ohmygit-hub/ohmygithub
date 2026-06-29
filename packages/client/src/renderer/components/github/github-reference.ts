export interface ParsedGitHubReference {
  owner: string
  repo: string
  number: number
  kindHint: GitHubRepositoryReferenceKind
  url: string
}

export interface TrimmedUrlCandidate {
  value: string
  trailing: string
}

type GitHubRepositorySection = 'overview' | 'pull-requests' | 'issues' | 'actions' | 'settings'

const GITHUB_REFERENCE_TYPES: Record<string, GitHubRepositoryReferenceKind | undefined> = {
  issues: 'issue',
  pull: 'pull-request',
  pulls: 'pull-request',
}

export function parseGitHubReferenceUrl(value: string): ParsedGitHubReference | null {
  const trimmed = trimUrlCandidate(value).value

  try {
    const url = new URL(trimmed)
    if (url.hostname.toLowerCase() !== 'github.com') return null

    const [owner, repo, type, rawNumber] = url.pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment))
    const kindHint = GITHUB_REFERENCE_TYPES[type]
    const number = Number(rawNumber)

    if (!owner || !repo || !kindHint || !Number.isInteger(number) || number <= 0) {
      return null
    }

    return {
      owner,
      repo,
      number,
      kindHint,
      url: trimmed,
    }
  } catch {
    return null
  }
}

export function parseGitHubWorkspaceUrl(value: string): string | null {
  const trimmed = trimUrlCandidate(value).value

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com') return null

    const segments = url.pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment))

    if (segments.length === 0) return null

    if (segments[0] === 'notifications') return '/inbox'
    if (segments[0] === 'pulls') return createPullRequestListWorkspaceUrl(segments[1])
    if (segments[0] === 'issues') return createIssueListWorkspaceUrl(segments[1])
    if (segments[0] === 'search') return createSearchWorkspaceUrl(url)
    if (segments[0] === 'orgs' && segments[1] && segments.length === 2) {
      return createOrganizationWorkspaceUrl(segments[1])
    }

    const [owner, repo, type, rawNumber] = segments
    if (!owner) return null

    if (!repo) {
      return createAccountWorkspaceUrl(owner)
    }

    if (!type) {
      return createRepositoryWorkspaceUrl(owner, repo)
    }

    const reference = parseRepositoryReference(owner, repo, type, rawNumber)
    if (reference) return reference

    const repositorySection = repositorySectionForPath(type)
    if (repositorySection) {
      return createRepositoryWorkspaceUrl(owner, repo, repositorySection)
    }

    return null
  } catch {
    return null
  }
}

export function trimUrlCandidate(value: string): TrimmedUrlCandidate {
  let candidate = value.trim()
  let trailing = ''

  while (candidate.length > 0 && /[),.;:!?]/.test(candidate[candidate.length - 1])) {
    const nextTrailing = candidate[candidate.length - 1] + trailing
    const nextCandidate = candidate.slice(0, -1)

    if (nextTrailing.startsWith(')') && unmatchedOpeningParenCount(nextCandidate) > 0) {
      break
    }

    candidate = nextCandidate
    trailing = nextTrailing
  }

  return { value: candidate, trailing }
}

export function createGitHubAvatarUrl(login: string, size = 40): string {
  return `https://github.com/${encodeURIComponent(login)}.png?size=${encodeURIComponent(String(size))}`
}

export function createAccountWorkspaceUrl(login: string): string {
  return `/${encodeURIComponent(login)}`
}

export function createOrganizationWorkspaceUrl(login: string): string {
  return `/${encodeURIComponent(login)}?type=org`
}

export function createRepositoryWorkspaceUrl(
  owner: string,
  repo: string,
  section: GitHubRepositorySection = 'overview',
): string {
  const path = `/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
  if (section === 'overview') return path

  const params = new URLSearchParams()
  params.set('tab', section)
  return `${path}?${params.toString()}`
}

export function createReferenceWorkspaceUrl(
  owner: string,
  repo: string,
  kind: GitHubRepositoryReferenceKind,
  number: number,
): string {
  const itemPath = kind === 'pull-request' ? 'pull' : 'issues'

  return `/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${itemPath}/${encodeURIComponent(String(number))}`
}

function parseRepositoryReference(
  owner: string,
  repo: string,
  type: string | undefined,
  rawNumber: string | undefined,
): string | null {
  const kindHint = type ? GITHUB_REFERENCE_TYPES[type] : undefined
  const number = Number(rawNumber)

  if (!kindHint || !Number.isInteger(number) || number <= 0) return null

  return createReferenceWorkspaceUrl(owner, repo, kindHint, number)
}

function repositorySectionForPath(type: string): GitHubRepositorySection | null {
  if (type === 'pulls') return 'pull-requests'
  if (type === 'issues') return 'issues'
  if (type === 'actions') return 'actions'
  if (type === 'settings') return 'settings'

  return null
}

function createPullRequestListWorkspaceUrl(category: string | undefined): string {
  if (category === 'created') return '/pull-requests/created-by-me'
  if (category === 'mentioned') return '/pull-requests/mentioned-me'
  if (category === 'review-requested') return '/pull-requests/needs-review'

  return '/pull-requests/inbox'
}

function createIssueListWorkspaceUrl(category: string | undefined): string {
  if (category === 'created') return '/issues/created-by-me'
  if (category === 'mentioned') return '/issues/mentioned-me'

  return '/issues/inbox'
}

function createSearchWorkspaceUrl(url: URL): string {
  const rawQuery = url.searchParams.get('q')?.trim() ?? ''
  const rawType = url.searchParams.get('type')?.trim() ?? ''
  const mode = searchModeForGitHubType(rawType, rawQuery)
  const query = normalizeGitHubSearchQuery(rawQuery, mode)
  const params = new URLSearchParams()

  if (query) {
    params.set('q', query)
  }

  const suffix = params.toString()
  return suffix ? `/search/${mode}?${params.toString()}` : `/search/${mode}`
}

function searchModeForGitHubType(type: string, query: string): GitHubWorkspaceSearchMode {
  if (type === 'repositories') return 'repos'
  if (type === 'users' && /\btype:org\b/i.test(query)) return 'orgs'
  if (type === 'users') return 'users'

  return 'all'
}

function normalizeGitHubSearchQuery(query: string, mode: GitHubWorkspaceSearchMode): string {
  if (mode !== 'orgs') return query

  return query.replace(/\btype:org\b/ig, '').replace(/\s+/g, ' ').trim()
}

function unmatchedOpeningParenCount(value: string): number {
  let count = 0

  for (const character of value) {
    if (character === '(') count += 1
    else if (character === ')' && count > 0) count -= 1
  }

  return count
}
