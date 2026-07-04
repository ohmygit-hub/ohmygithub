import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { AccountTabId, RepositoryTabId, WorkspaceTab, WorkspaceTabType } from './types'

export const DEFAULT_WORKSPACE_URL = '/inbox'

const INTERNAL_TYPES = new Set<WorkspaceTabType>(['inbox', 'reviews', 'activity', 'new-repository'])
const INTERNAL_PATHS = new Set(['pull-requests', 'issues', 'search', 'not-found', 'apps'])
const DEFAULT_ACCOUNT_SECTION: AccountTabId = 'overview'
const DEFAULT_REPOSITORY_SECTION: RepositoryTabId = 'overview'
const PULL_REQUEST_CATEGORIES = new Set<GitHubPullRequestCategory>([
  'created-by-me',
  'needs-review',
  'mentioned-me',
])
const ISSUE_CATEGORIES = new Set<GitHubIssueCategory>([
  'created-by-me',
  'mentioned-me',
])
const DEFAULT_PULL_REQUEST_CATEGORY: GitHubPullRequestCategory = 'created-by-me'
const DEFAULT_ISSUE_CATEGORY: GitHubIssueCategory = 'created-by-me'

export const REPOSITORY_SETTINGS_SUBPAGES: Partial<Record<RepositoryTabId, readonly string[]>> = {
  settingsAccess: ['collaborators', 'teams', 'moderation'],
  settingsAutomation: [
    'branches',
    'rules',
    'actions',
    'runners',
    'webhooks',
    'environments',
    'pages',
    'custom-properties',
  ],
  settingsSecurity: ['advanced-security', 'deploy-keys', 'secrets'],
  settingsIntegrations: ['autolinks'],
}

export function sanitizeRepositorySettingsSub(
  section: RepositoryTabId,
  value: string | undefined,
): string | undefined {
  if (!value) return undefined

  const subpages = REPOSITORY_SETTINGS_SUBPAGES[section]
  if (!subpages) return undefined

  return subpages.includes(value) && value !== subpages[0] ? value : undefined
}
const VALID_TYPES = new Set<WorkspaceTabType>([
  'inbox',
  'reviews',
  'activity',
  'new-repository',
  'account',
  'app',
  'repo',
  'pull-request-list',
  'issue-list',
  'pull-request',
  'issue',
  'action-run',
  'search-result',
  'not-found',
])

export function isWorkspaceTabType(value: string): value is WorkspaceTabType {
  return VALID_TYPES.has(value as WorkspaceTabType)
}

export function routeToWorkspaceUrl(route: RouteLocationNormalizedLoaded): string {
  const path = normalizeWorkspacePath(route.path)
  if (path === '/') return path

  if (path === '/not-found') {
    return createNotFoundUrl(typeof route.query.q === 'string' ? route.query.q : '')
  }

  if (path.startsWith('/search/')) {
    const [, , rawMode] = path.split('/')
    return createSearchUrl(sanitizeSearchMode(rawMode), typeof route.query.q === 'string' ? route.query.q : '')
  }

  if (isActionRunWorkspacePath(path)) {
    return createActionRunWorkspaceUrlFromPath(path, typeof route.query.job === 'string' ? route.query.job : '')
  }

  if (isRepositoryWorkspacePath(path)) {
    return createRepositoryUrlFromPath(
      path,
      typeof route.query.tab === 'string' ? route.query.tab : '',
      typeof route.query.sub === 'string' ? route.query.sub : undefined,
    )
  }

  if (isAccountWorkspacePath(path)) {
    return createAccountUrlFromPath(path, typeof route.query.tab === 'string' ? route.query.tab : '')
  }

  const type = typeof route.query.type === 'string' ? route.query.type : ''
  if (!type || isReservedInternalPath(path)) return path
  if (!isWorkspaceTabType(type)) return path

  return `${path}?type=${encodeURIComponent(type)}`
}

export function createWorkspaceTabFromUrl(url: string): WorkspaceTab {
  const parsed = parseWorkspaceUrl(url)
  return {
    ...parsed,
    title: titleForWorkspaceTab(parsed),
  }
}

export function normalizeWorkspaceUrl(url: string): string {
  const [rawPath, rawSearch = ''] = url.split('?')
  const path = normalizeWorkspacePath(rawPath)
  const search = new URLSearchParams(rawSearch)
  if (path === '/not-found') {
    return createNotFoundUrl(search.get('q') ?? '')
  }

  if (path.startsWith('/search/')) {
    const [, , rawMode] = path.split('/')
    return createSearchUrl(sanitizeSearchMode(rawMode), search.get('q') ?? '')
  }

  if (isActionRunWorkspacePath(path)) {
    return createActionRunWorkspaceUrlFromPath(path, search.get('job') ?? '')
  }

  if (isRepositoryWorkspacePath(path)) {
    return createRepositoryUrlFromPath(path, search.get('tab') ?? '', search.get('sub') ?? undefined)
  }

  if (isAccountWorkspacePath(path)) {
    return createAccountUrlFromPath(path, search.get('tab') ?? '')
  }

  return path
}

export function createRepositoryWorkspaceUrl(
  owner: string,
  repo: string,
  section: RepositoryTabId = DEFAULT_REPOSITORY_SECTION,
  settingsSub?: string,
): string {
  const path = `/${sanitizeSegment(owner)}/${sanitizeSegment(repo)}`
  return createRepositoryUrlFromPath(path, repositorySectionToQuery(section), settingsSub)
}

export function createActionRunWorkspaceUrl(
  owner: string,
  repo: string,
  runId: number,
  jobId?: number | null,
): string {
  const path = `/${sanitizeSegment(owner)}/${sanitizeSegment(repo)}/actions/runs/${runId}`
  const normalizedJobId = sanitizeNumber(jobId)

  if (!normalizedJobId) return path

  const params = new URLSearchParams()
  params.set('job', String(normalizedJobId))
  return `${path}?${params.toString()}`
}

export function createCommitWorkspaceUrl(owner: string, repo: string, sha: string): string {
  return `/${sanitizeSegment(owner)}/${sanitizeSegment(repo)}/commit/${sha}`
}

function sanitizeCommitSha(value: string | undefined): string {
  const decoded = sanitizeSegment(value)
  return /^[0-9a-f]{7,40}$/i.test(decoded) ? decoded.toLowerCase() : ''
}

export function createAccountWorkspaceUrl(
  login: string,
  section: AccountTabId = DEFAULT_ACCOUNT_SECTION,
): string {
  const path = `/${sanitizeSegment(login)}`
  return createAccountUrlFromPath(path, accountSectionToQuery(section))
}

export function createAppWorkspaceUrl(slug: string): string {
  return `/apps/${encodeURIComponent(sanitizeSegment(slug))}`
}

export function isReservedInternalPath(path: string): boolean {
  const [firstSegment] = normalizeWorkspacePath(path).split('/').filter(Boolean)
  return INTERNAL_PATHS.has(firstSegment) || INTERNAL_TYPES.has(firstSegment as WorkspaceTabType)
}

function parseWorkspaceUrl(url: string): Omit<WorkspaceTab, 'title'> {
  const normalizedUrl = normalizeWorkspaceUrl(url)
  const [rawPath, rawSearch = ''] = normalizedUrl.split('?')
  const path = normalizeWorkspacePath(rawPath)
  const segments = path.split('/').filter(Boolean).map(decodeURIComponent)
  const query = new URLSearchParams(rawSearch)

  if (segments.length === 0) {
    return { url: DEFAULT_WORKSPACE_URL, type: 'inbox' }
  }

  const firstSegment = segments[0]

  if (firstSegment === 'not-found') {
    const input = sanitizeSearchQuery(query.get('q') ?? '')

    return {
      url: createNotFoundUrl(input),
      type: 'not-found',
      notFoundInput: input,
    }
  }

  if (firstSegment === 'search') {
    const mode = sanitizeSearchMode(segments[1])
    const searchQuery = sanitizeSearchQuery(query.get('q') ?? '')

    return {
      url: createSearchUrl(mode, searchQuery),
      type: 'search-result',
      searchMode: mode,
      searchQuery,
    }
  }

  if (INTERNAL_TYPES.has(firstSegment as WorkspaceTabType)) {
    return {
      url: `/${firstSegment}`,
      type: firstSegment as WorkspaceTabType,
    }
  }

  if (firstSegment === 'apps') {
    const appSlug = sanitizeSegment(segments[1])

    if (appSlug) {
      return {
        url: createAppWorkspaceUrl(appSlug),
        type: 'app',
        appSlug,
      }
    }
  }

  if (firstSegment === 'pull-requests') {
    const category = sanitizePullRequestCategory(segments[1])

    return {
      url: `/pull-requests/${category}`,
      type: 'pull-request-list',
      pullRequestCategory: category,
    }
  }

  if (firstSegment === 'issues') {
    const category = sanitizeIssueCategory(segments[1])

    return {
      url: `/issues/${category}`,
      type: 'issue-list',
      issueCategory: category,
    }
  }

  const owner = sanitizeSegment(firstSegment)
  const repo = sanitizeSegment(segments[1])
  const resourceType = sanitizeSegment(segments[2])
  const resourceNumber = sanitizeNumber(segments[3])

  if (owner && repo && resourceType === 'pull' && resourceNumber) {
    return {
      url: `/${owner}/${repo}/pull/${resourceNumber}`,
      type: 'pull-request',
      owner,
      repo,
      number: resourceNumber,
    }
  }

  if (owner && repo && resourceType === 'issues' && resourceNumber) {
    return {
      url: `/${owner}/${repo}/issues/${resourceNumber}`,
      type: 'issue',
      owner,
      repo,
      number: resourceNumber,
    }
  }

  if (owner && repo && resourceType === 'actions' && segments[3] === 'runs') {
    const runId = sanitizeNumber(segments[4])
    const jobId = sanitizeNumber(query.get('job') ?? '')

    if (runId) {
      return {
        url: createActionRunWorkspaceUrl(owner, repo, runId, jobId),
        type: 'action-run',
        owner,
        repo,
        runId,
        jobId: jobId ?? undefined,
      }
    }
  }

  if (owner && repo && resourceType === 'commit') {
    const sha = sanitizeCommitSha(segments[3])

    if (sha) {
      return {
        url: createCommitWorkspaceUrl(owner, repo, sha),
        type: 'commit',
        owner,
        repo,
        commitSha: sha,
      }
    }
  }

  if (owner && repo) {
    const repositorySection = sanitizeRepositorySection(query.get('tab') ?? '')
    const repositorySettingsSub = sanitizeRepositorySettingsSub(repositorySection, query.get('sub') ?? undefined)

    return {
      url: createRepositoryWorkspaceUrl(owner, repo, repositorySection, repositorySettingsSub),
      type: 'repo',
      owner,
      repo,
      repositorySection,
      repositorySettingsSub,
    }
  }

  const accountSection = sanitizeAccountSection(query.get('tab') ?? '')

  return {
    url: createAccountWorkspaceUrl(owner, accountSection),
    type: 'account',
    owner,
    accountSection,
  }
}

function titleForWorkspaceTab(tab: Omit<WorkspaceTab, 'title'>): string {
  if (tab.type === 'inbox') return 'Inbox'
  if (tab.type === 'reviews') return 'Review Queue'
  if (tab.type === 'activity') return 'Activity'
  if (tab.type === 'new-repository') return 'New Repository'
  if (tab.type === 'pull-request-list') return titleForPullRequestCategory(tab.pullRequestCategory)
  if (tab.type === 'issue-list') return titleForIssueCategory(tab.issueCategory)
  if (tab.type === 'pull-request') return `${tab.owner}/${tab.repo}#${tab.number ?? ''}`
  if (tab.type === 'issue') return `${tab.owner}/${tab.repo}#${tab.number ?? ''}`
  if (tab.type === 'action-run') return `${tab.owner}/${tab.repo} run ${tab.runId ?? ''}`
  if (tab.type === 'commit') return `${tab.owner}/${tab.repo}@${tab.commitSha?.slice(0, 7) ?? ''}`
  if (tab.type === 'search-result') return tab.searchQuery ? `Search: ${tab.searchQuery}` : 'Search'
  if (tab.type === 'not-found') return tab.notFoundInput ? `Not Found: ${tab.notFoundInput}` : 'Not Found'
  if (tab.type === 'repo') return `${tab.owner}/${tab.repo}`
  if (tab.type === 'app') return tab.appSlug ?? 'App'
  return tab.owner ?? 'Account'
}

function titleForPullRequestCategory(category: GitHubPullRequestCategory | undefined): string {
  if (category === 'needs-review') return 'Needs Review'
  if (category === 'mentioned-me') return 'Mentioned Me'
  return 'Created by Me'
}

function titleForIssueCategory(category: GitHubIssueCategory | undefined): string {
  if (category === 'mentioned-me') return 'Mentioned Me'
  return 'Created by Me'
}

function normalizeWorkspacePath(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const trimmed = cleanPath.replace(/\/+/g, '/').replace(/\/$/, '')
  return trimmed || '/'
}

function createRepositoryUrlFromPath(path: string, rawSection: string, rawSub?: string): string {
  const repositorySection = sanitizeRepositorySection(rawSection)

  if (repositorySection === DEFAULT_REPOSITORY_SECTION) {
    return path
  }

  const params = new URLSearchParams()
  params.set('tab', repositorySectionToQuery(repositorySection))

  const settingsSub = sanitizeRepositorySettingsSub(repositorySection, rawSub ?? undefined)
  if (settingsSub) {
    params.set('sub', settingsSub)
  }

  return `${path}?${params.toString()}`
}

function createAccountUrlFromPath(path: string, rawSection: string): string {
  const accountSection = sanitizeAccountSection(rawSection)

  if (accountSection === DEFAULT_ACCOUNT_SECTION) {
    return path
  }

  const params = new URLSearchParams()
  params.set('tab', accountSectionToQuery(accountSection))
  return `${path}?${params.toString()}`
}

function createActionRunWorkspaceUrlFromPath(path: string, rawJobId?: string | number | null): string {
  const [owner, repo, , , rawRunId] = normalizeWorkspacePath(path).split('/').filter(Boolean)
  const runId = sanitizeNumber(rawRunId)
  const jobId = sanitizeNumber(rawJobId)

  if (!owner || !repo || !runId) return path

  return createActionRunWorkspaceUrl(decodeURIComponent(owner), decodeURIComponent(repo), runId, jobId)
}

function isActionRunWorkspacePath(path: string): boolean {
  const segments = normalizeWorkspacePath(path).split('/').filter(Boolean)
  return segments.length === 5
    && segments[2] === 'actions'
    && segments[3] === 'runs'
    && Boolean(sanitizeNumber(segments[4]))
}

function isRepositoryWorkspacePath(path: string): boolean {
  const segments = normalizeWorkspacePath(path).split('/').filter(Boolean)
  return segments.length === 2 && !isReservedInternalPath(path)
}

function isAccountWorkspacePath(path: string): boolean {
  const segments = normalizeWorkspacePath(path).split('/').filter(Boolean)
  return segments.length === 1 && !isReservedInternalPath(path)
}

function createSearchUrl(mode: GitHubWorkspaceSearchMode, query: string): string {
  const searchQuery = sanitizeSearchQuery(query)
  const params = new URLSearchParams()

  if (searchQuery) {
    params.set('q', searchQuery)
  }

  const suffix = params.toString()
  return suffix ? `/search/${mode}?${suffix}` : `/search/${mode}`
}

function createNotFoundUrl(input: string): string {
  const notFoundInput = sanitizeSearchQuery(input)
  const params = new URLSearchParams()

  if (notFoundInput) {
    params.set('q', notFoundInput)
  }

  const suffix = params.toString()
  return suffix ? `/not-found?${suffix}` : '/not-found'
}

function sanitizeSegment(value: string | undefined): string {
  return String(value ?? '').trim()
}

function sanitizeSearchQuery(value: string | undefined): string {
  return String(value ?? '').trim()
}

function sanitizeSearchMode(value: string | undefined): GitHubWorkspaceSearchMode {
  if (value === 'users' || value === 'orgs' || value === 'repos' || value === 'all') {
    return value
  }

  return 'all'
}

function sanitizeRepositorySection(value: string | undefined): RepositoryTabId {
  if (value === 'files') return 'files'
  if (value === 'commits') return 'commits'
  if (value === 'branches') return 'branches'
  if (value === 'pull-requests' || value === 'pullRequests') return 'pullRequests'
  if (value === 'issues') return 'issues'
  if (value === 'actions') return 'actions'
  if (value === 'releases') return 'releases'
  if (value === 'contributors') return 'contributors'
  if (value === 'packages') return 'packages'
  if (value === 'deployments') return 'deployments'
  if (value === 'settings' || value === 'settings-general') return 'settingsGeneral'
  if (value === 'settings-access') return 'settingsAccess'
  if (value === 'settings-automation') return 'settingsAutomation'
  if (value === 'settings-security') return 'settingsSecurity'
  if (value === 'settings-integrations') return 'settingsIntegrations'
  return DEFAULT_REPOSITORY_SECTION
}

function sanitizeAccountSection(value: string | undefined): AccountTabId {
  if (value === 'repositories') return 'repositories'
  if (value === 'stars') return 'stars'
  if (value === 'followers') return 'followers'
  if (value === 'sponsors') return 'sponsors'
  if (value === 'people') return 'people'
  return DEFAULT_ACCOUNT_SECTION
}

const REPOSITORY_SECTION_QUERY_TOKENS: Partial<Record<RepositoryTabId, string>> = {
  pullRequests: 'pull-requests',
  settingsGeneral: 'settings-general',
  settingsAccess: 'settings-access',
  settingsAutomation: 'settings-automation',
  settingsSecurity: 'settings-security',
  settingsIntegrations: 'settings-integrations',
}

function repositorySectionToQuery(section: RepositoryTabId): string {
  return REPOSITORY_SECTION_QUERY_TOKENS[section] ?? section
}

function accountSectionToQuery(section: AccountTabId): string {
  return section
}

function sanitizeNumber(value: string | number | null | undefined): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function sanitizePullRequestCategory(value: string | undefined): GitHubPullRequestCategory {
  return PULL_REQUEST_CATEGORIES.has(value as GitHubPullRequestCategory)
    ? value as GitHubPullRequestCategory
    : DEFAULT_PULL_REQUEST_CATEGORY
}

function sanitizeIssueCategory(value: string | undefined): GitHubIssueCategory {
  return ISSUE_CATEGORIES.has(value as GitHubIssueCategory)
    ? value as GitHubIssueCategory
    : DEFAULT_ISSUE_CATEGORY
}
