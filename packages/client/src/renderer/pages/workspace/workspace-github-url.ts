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

  if (tab.type === 'search-result') {
    return searchGitHubUrl(tab.searchQuery, tab.searchMode)
  }

  if (tab.type === 'not-found' && tab.notFoundInput) {
    return searchGitHubUrl(tab.notFoundInput, 'all')
  }

  return null
}

function accountGitHubUrl(owner: string, section: WorkspaceTab['accountSection']): string {
  const url = new URL(`${GITHUB_ORIGIN}/${pathSegment(owner)}`)

  if (section === 'repositories' || section === 'stars') {
    url.searchParams.set('tab', section)
  }

  return url.toString()
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
