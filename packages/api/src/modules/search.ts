import type { GitHubOctokit } from '../transport'
import type {
  GitHubIssueState,
  GitHubPullRequestState,
  GitHubRepositoryReferenceKind,
  GitHubRepositoryReferenceResolution,
  GitHubWorkspaceGotoResult,
  GitHubWorkspaceSearchItem,
  GitHubWorkspaceSearchMode,
  GitHubWorkspaceSearchResult,
  ResolveRepositoryReferenceOptions,
  SearchWorkspaceOptions,
} from '../types'

interface UserResponse {
  id?: number
  login?: string
  avatar_url?: string | null
  html_url?: string | null
  type?: string | null
}

interface RepositoryResponse {
  id?: number
  name?: string
  full_name?: string
  owner?: { login?: string | null, avatar_url?: string | null } | null
  description?: string | null
  private?: boolean
  stargazers_count?: number
  updated_at?: string | null
  html_url?: string | null
}

interface IssueReferenceResponse {
  number?: number
  title?: string | null
  state?: string | null
  state_reason?: string | null
  html_url?: string | null
  pull_request?: unknown
}

interface PullRequestReferenceResponse {
  title?: string | null
  state?: string | null
  draft?: boolean | null
  merged?: boolean | null
  html_url?: string | null
}

interface SearchUsersResponse {
  total_count?: number
  incomplete_results?: boolean
  items?: UserResponse[]
}

interface SearchRepositoriesResponse {
  total_count?: number
  incomplete_results?: boolean
  items?: RepositoryResponse[]
}

interface ParsedGotoInput {
  owner: string
  repo?: string
}

const DEFAULT_SEARCH_PAGE = 1
const DEFAULT_SEARCH_PER_PAGE = 20
const MAX_SEARCH_PER_PAGE = 100
const ALL_SEARCH_PER_KIND_LIMIT = 8

export class SearchApi {
  constructor(private readonly octokit: GitHubOctokit) {}

  async resolveWorkspaceGoto(input: string): Promise<GitHubWorkspaceGotoResult> {
    const normalizedInput = input.trim()
    const parsed = parseGotoInput(normalizedInput)

    if (!parsed) {
      return createNotFoundResult(normalizedInput, 'invalid')
    }

    if (parsed.repo) {
      try {
        const repository = await this.getRepository(parsed.owner, parsed.repo)
        const owner = repository.owner?.login?.trim() || parsed.owner
        const repo = repository.name?.trim() || parsed.repo
        const nameWithOwner = repository.full_name?.trim() || `${owner}/${repo}`

        return {
          status: 'found',
          input: normalizedInput,
          type: 'repo',
          title: nameWithOwner,
          url: `/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
        }
      } catch (error) {
        if (isNotFoundError(error)) {
          return createNotFoundResult(normalizedInput, 'not_found')
        }

        throw error
      }
    }

    try {
      const user = await this.getUser(parsed.owner)
      const login = user.login?.trim() || parsed.owner

      return {
        status: 'found',
        input: normalizedInput,
        type: 'account',
        title: login,
        url: `/${encodeURIComponent(login)}`,
      }
    } catch (error) {
      if (isNotFoundError(error)) {
        return createNotFoundResult(normalizedInput, 'not_found')
      }

      throw error
    }
  }

  async searchWorkspace(options: SearchWorkspaceOptions): Promise<GitHubWorkspaceSearchResult> {
    const query = options.query.trim()
    const mode = normalizeMode(options.mode)
    const page = normalizePage(options.page)
    const perPage = normalizePerPage(options.perPage)

    if (!query) {
      return {
        mode,
        query,
        items: [],
        totalCount: 0,
        page,
        perPage,
        hasNextPage: false,
        incompleteResults: false,
      }
    }

    if (mode === 'all') {
      return this.searchAll(query, page, perPage)
    }

    if (mode === 'repos') {
      return this.searchRepositories(query, page, perPage)
    }

    return this.searchUsers(mode, query, page, perPage)
  }

  async resolveRepositoryReference(
    options: ResolveRepositoryReferenceOptions,
  ): Promise<GitHubRepositoryReferenceResolution> {
    const owner = options.owner.trim()
    const repo = options.repo.trim()
    const number = Math.floor(Number(options.number))
    const repository = `${owner}/${repo}`

    try {
      const issue = await this.getIssueReference(owner, repo, number)
      const isPullRequest = Boolean(issue.pull_request)
      const kind: GitHubRepositoryReferenceKind = isPullRequest ? 'pull-request' : 'issue'

      if (kind === 'pull-request') {
        const pullRequest = await this.getPullRequestReference(owner, repo, number)
          .catch(() => null)
        const title = pullRequest?.title?.trim() || issue.title?.trim() || `${repository}#${number}`
        const url = pullRequest?.html_url ?? issue.html_url ?? `https://github.com/${repository}/pull/${number}`

        return {
          status: 'found',
          owner,
          repo,
          repository,
          number,
          kind,
          state: mapPullRequestState(pullRequest, issue),
          title,
          url,
          workspaceUrl: createWorkItemWorkspaceUrl(owner, repo, 'pull-request', number),
        }
      }

      return {
        status: 'found',
        owner,
        repo,
        repository,
        number,
        kind,
        state: mapIssueState(issue),
        title: issue.title?.trim() || `${repository}#${number}`,
        url: issue.html_url ?? `https://github.com/${repository}/issues/${number}`,
        workspaceUrl: createWorkItemWorkspaceUrl(owner, repo, 'issue', number),
      }
    } catch (error) {
      if (isNotFoundError(error)) {
        return {
          status: 'not_found',
          owner,
          repo,
          repository,
          number,
        }
      }

      throw error
    }
  }

  private async searchAll(query: string, page: number, perPage: number): Promise<GitHubWorkspaceSearchResult> {
    const perKind = Math.min(perPage, ALL_SEARCH_PER_KIND_LIMIT)
    const [users, orgs, repos] = await Promise.all([
      this.searchUsers('users', query, page, perKind),
      this.searchUsers('orgs', query, page, perKind),
      this.searchRepositories(query, page, perKind),
    ])
    const totalCount = users.totalCount + orgs.totalCount + repos.totalCount

    return {
      mode: 'all',
      query,
      items: [...users.items, ...orgs.items, ...repos.items],
      totalCount,
      page,
      perPage,
      hasNextPage: users.hasNextPage || orgs.hasNextPage || repos.hasNextPage,
      incompleteResults: users.incompleteResults || orgs.incompleteResults || repos.incompleteResults,
    }
  }

  private async searchUsers(
    mode: 'users' | 'orgs',
    query: string,
    page: number,
    perPage: number,
  ): Promise<GitHubWorkspaceSearchResult> {
    const type = mode === 'orgs' ? 'org' : 'user'
    const response = await this.octokit.request('GET /search/users', {
      q: `${query} type:${type}`,
      page,
      per_page: perPage,
    })
    const payload = response.data as SearchUsersResponse
    const items = (payload.items ?? []).map((user) => mapUserSearchItem(user, mode))
    const totalCount = payload.total_count ?? items.length

    return {
      mode,
      query,
      items,
      totalCount,
      page,
      perPage,
      hasNextPage: page * perPage < totalCount,
      incompleteResults: Boolean(payload.incomplete_results),
    }
  }

  private async searchRepositories(
    query: string,
    page: number,
    perPage: number,
  ): Promise<GitHubWorkspaceSearchResult> {
    const response = await this.octokit.request('GET /search/repositories', {
      q: `${query} in:name,description`,
      page,
      per_page: perPage,
    })
    const payload = response.data as SearchRepositoriesResponse
    const items = (payload.items ?? []).map(mapRepositorySearchItem)
    const totalCount = payload.total_count ?? items.length

    return {
      mode: 'repos',
      query,
      items,
      totalCount,
      page,
      perPage,
      hasNextPage: page * perPage < totalCount,
      incompleteResults: Boolean(payload.incomplete_results),
    }
  }

  private async getUser(username: string): Promise<UserResponse> {
    const response = await this.octokit.request('GET /users/{username}', {
      username,
    })

    return response.data as UserResponse
  }

  private async getRepository(owner: string, repo: string): Promise<RepositoryResponse> {
    const response = await this.octokit.request('GET /repos/{owner}/{repo}', {
      owner,
      repo,
    })

    return response.data as RepositoryResponse
  }

  private async getIssueReference(owner: string, repo: string, number: number): Promise<IssueReferenceResponse> {
    const response = await this.octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
      owner,
      repo,
      issue_number: number,
    })

    return response.data as IssueReferenceResponse
  }

  private async getPullRequestReference(
    owner: string,
    repo: string,
    number: number,
  ): Promise<PullRequestReferenceResponse> {
    const response = await this.octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner,
      repo,
      pull_number: number,
    })

    return response.data as PullRequestReferenceResponse
  }
}

function parseGotoInput(input: string): ParsedGotoInput | null {
  const normalized = input.trim()
  if (!normalized) return null

  const urlInput = normalized.match(/^https?:\/\//i) ? normalized : `https://${normalized}`

  try {
    const url = new URL(urlInput)
    if (url.hostname.toLowerCase() === 'github.com') {
      const segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
      return segmentsToGotoInput(segments)
    }
  } catch {
    // Fall through to plain owner/repo parsing.
  }

  return segmentsToGotoInput(normalized.split('/').filter(Boolean))
}

function segmentsToGotoInput(segments: string[]): ParsedGotoInput | null {
  const owner = sanitizePathSegment(segments[0])
  const repo = sanitizePathSegment(segments[1])

  if (!owner) return null

  return repo ? { owner, repo } : { owner }
}

function sanitizePathSegment(value: string | undefined): string {
  return String(value ?? '').trim()
}

function mapIssueState(issue: IssueReferenceResponse): GitHubIssueState {
  if (issue.state !== 'closed') return 'open'
  if (issue.state_reason === 'not_planned') return 'not_planned'

  return 'completed'
}

function mapPullRequestState(
  pullRequest: PullRequestReferenceResponse | null,
  issue: IssueReferenceResponse,
): GitHubPullRequestState {
  if (pullRequest?.merged) return 'merged'
  if (pullRequest?.draft) return 'draft'
  if ((pullRequest?.state ?? issue.state) === 'closed') return 'closed'

  return 'open'
}

function createWorkItemWorkspaceUrl(
  owner: string,
  repo: string,
  kind: GitHubRepositoryReferenceKind,
  number: number,
): string {
  const ownerPath = encodeURIComponent(owner)
  const repoPath = encodeURIComponent(repo)
  const pathKind = kind === 'pull-request' ? 'pull' : 'issues'

  return `/${ownerPath}/${repoPath}/${pathKind}/${encodeURIComponent(String(number))}`
}

function mapUserSearchItem(user: UserResponse, mode: 'users' | 'orgs'): GitHubWorkspaceSearchItem {
  const login = user.login?.trim() ?? ''

  return {
    id: user.id ?? 0,
    kind: mode === 'orgs' ? 'org' : 'user',
    title: login,
    description: null,
    url: user.html_url ?? `https://github.com/${login}`,
    workspaceUrl: `/${encodeURIComponent(login)}`,
    avatarUrl: user.avatar_url ?? undefined,
  }
}

function mapRepositorySearchItem(repository: RepositoryResponse): GitHubWorkspaceSearchItem {
  const owner = repository.owner?.login?.trim() ?? ''
  const repo = repository.name?.trim() ?? ''
  const nameWithOwner = repository.full_name?.trim() || `${owner}/${repo}`

  return {
    id: repository.id ?? 0,
    kind: 'repo',
    title: nameWithOwner,
    description: repository.description ?? null,
    url: repository.html_url ?? `https://github.com/${nameWithOwner}`,
    workspaceUrl: `/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    avatarUrl: repository.owner?.avatar_url ?? undefined,
    owner,
    repo,
    nameWithOwner,
    isPrivate: Boolean(repository.private),
    starCount: repository.stargazers_count ?? 0,
    updatedAt: repository.updated_at ?? null,
  }
}

function createNotFoundResult(input: string, reason: 'invalid' | 'not_found'): GitHubWorkspaceGotoResult {
  const query = encodeURIComponent(input)

  return {
    status: 'not_found',
    input,
    reason,
    url: query ? `/not-found?q=${query}` : '/not-found',
  }
}

function normalizeMode(mode: GitHubWorkspaceSearchMode): GitHubWorkspaceSearchMode {
  return mode === 'users' || mode === 'orgs' || mode === 'repos' || mode === 'all' ? mode : 'all'
}

function normalizePage(page: number | undefined): number {
  const value = Math.floor(Number(page ?? DEFAULT_SEARCH_PAGE))
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_SEARCH_PAGE
}

function normalizePerPage(perPage: number | undefined): number {
  const value = Math.floor(Number(perPage ?? DEFAULT_SEARCH_PER_PAGE))
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_SEARCH_PER_PAGE

  return Math.min(MAX_SEARCH_PER_PAGE, value)
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'status' in error
    && (error as { status?: unknown }).status === 404
}
