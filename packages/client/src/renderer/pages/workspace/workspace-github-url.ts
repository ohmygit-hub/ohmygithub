import type { WorkspaceTab } from './types'

const GITHUB_ORIGIN = 'https://github.com'

export function workspaceTabToGitHubUrl(tab: WorkspaceTab): string | null {
  if (tab.type === 'inbox') return `${GITHUB_ORIGIN}/notifications`
  if (tab.type === 'reviews') return `${GITHUB_ORIGIN}/pulls/review-requested`

  if (tab.type === 'account' && tab.owner) {
    return accountGitHubUrl(tab.owner, tab.accountSection)
  }

  if (tab.type === 'repo' && tab.owner && tab.repo) {
    return repositoryGitHubUrl(tab)
  }

  if (tab.type === 'team' && tab.owner && tab.teamSlug) {
    return teamGitHubUrl(tab)
  }

  if (tab.type === 'pull-request' && tab.owner && tab.repo && tab.number) {
    return `${repositoryBaseUrl(tab.owner, tab.repo)}/pull/${tab.number}`
  }

  if (tab.type === 'issue' && tab.owner && tab.repo && tab.number) {
    return `${repositoryBaseUrl(tab.owner, tab.repo)}/issues/${tab.number}`
  }

  if (tab.type === 'action-run' && tab.owner && tab.repo && tab.runId) {
    const runUrl = `${repositoryBaseUrl(tab.owner, tab.repo)}/actions/runs/${tab.runId}`

    return tab.jobId ? `${runUrl}/job/${tab.jobId}` : runUrl
  }

  if (tab.type === 'commit' && tab.owner && tab.repo && tab.commitSha) {
    return `${repositoryBaseUrl(tab.owner, tab.repo)}/commit/${pathSegment(tab.commitSha)}`
  }

  if (tab.type === 'app' && tab.appSlug) {
    return `${GITHUB_ORIGIN}/apps/${pathSegment(tab.appSlug)}`
  }

  if (tab.type === 'search-result') {
    return searchGitHubUrl(tab.searchQuery, tab.searchMode)
  }

  if (tab.type === 'not-found' && tab.notFoundInput) {
    return searchGitHubUrl(tab.notFoundInput, 'all')
  }

  return null
}

function accountGitHubUrl(owner: string, section: WorkspaceTab['accountSection']): string {
  // Teams only exist on organizations, where GitHub serves them under /orgs.
  if (section === 'teams') {
    return `${GITHUB_ORIGIN}/orgs/${pathSegment(owner)}/teams`
  }

  const url = new URL(`${GITHUB_ORIGIN}/${pathSegment(owner)}`)

  if (section === 'repositories' || section === 'stars') {
    url.searchParams.set('tab', section)
  }

  return url.toString()
}

function teamGitHubUrl(tab: WorkspaceTab): string {
  const baseUrl = `${GITHUB_ORIGIN}/orgs/${pathSegment(tab.owner ?? '')}/teams/${pathSegment(tab.teamSlug ?? '')}`

  if (tab.teamSection === 'repositories') return `${baseUrl}/repositories`
  if (tab.teamSection === 'teams') return `${baseUrl}/teams`
  // GitHub hosts team settings on the /edit page.
  if (tab.teamSection === 'settings') return `${baseUrl}/edit`

  return baseUrl
}

function repositoryGitHubUrl(tab: WorkspaceTab): string {
  const baseUrl = repositoryBaseUrl(tab.owner ?? '', tab.repo ?? '')

  if (tab.repositorySection === 'pullRequests') return `${baseUrl}/pulls`
  if (tab.repositorySection === 'issues') return `${baseUrl}/issues`
  if (tab.repositorySection === 'actions') return `${baseUrl}/actions`
  if (tab.repositorySection?.startsWith('settings')) return `${baseUrl}/settings`

  return baseUrl
}

function searchGitHubUrl(query: string | undefined, mode: GitHubWorkspaceSearchMode | undefined): string {
  const url = new URL(`${GITHUB_ORIGIN}/search`)
  const normalizedQuery = query?.trim()

  if (normalizedQuery) {
    url.searchParams.set('q', mode === 'orgs' ? `type:org ${normalizedQuery}` : normalizedQuery)
  }

  if (mode === 'repos') {
    url.searchParams.set('type', 'repositories')
  } else if (mode === 'users' || mode === 'orgs') {
    url.searchParams.set('type', 'users')
  }

  return url.toString()
}

function repositoryBaseUrl(owner: string, repo: string): string {
  return `${GITHUB_ORIGIN}/${pathSegment(owner)}/${pathSegment(repo)}`
}

function pathSegment(value: string): string {
  return encodeURIComponent(value.trim())
}
