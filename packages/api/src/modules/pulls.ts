import type { GitHubOctokit } from '../transport'
import type {
  GitHubCiState,
  GitHubPullRequest,
  GitHubPullRequestSearchResult,
  GitHubPullRequestSearchState,
  GitHubPullRequestState,
  ListPullRequestCategoryOptions,
  ListRepositoryWorkspaceItemsOptions,
  ListWorkspaceItemsOptions,
  SearchRepositoryPullRequestsOptions
} from '../types'
import {
  createWorkItemKey,
  listInboxWorkItemReferences,
  listUnreadWorkItemKeys,
  mapLabels,
  normalizeActor,
  normalizeLimit,
  splitRepositoryName,
  type GraphQLWorkItemBase
} from './work-items'

interface GraphQLPullRequestNode extends GraphQLWorkItemBase {
  isDraft: boolean
  merged: boolean
  statusCheckRollup?: {
    state?: string | null
  } | null
}

interface ViewerPullRequestsResponse {
  search: {
    nodes?: Array<GraphQLPullRequestNode | null> | null
  }
}

interface RepositoryPullRequestsResponse {
  repository: {
    pullRequests: {
      nodes?: Array<GraphQLPullRequestNode | null> | null
    }
  } | null
}

interface PullRequestByNumberResponse {
  repository: {
    pullRequest: GraphQLPullRequestNode | null
  } | null
}

interface PullRequestNodesResponse {
  nodes?: Array<GraphQLPullRequestNode | null> | null
}

interface SearchPullRequestItem {
  node_id?: string | null
}

interface SearchPullRequestsResponse {
  incomplete_results?: boolean
  items?: SearchPullRequestItem[]
  total_count?: number
}

const pullRequestFields = `
  fragment PullRequestFields on PullRequest {
    id
    title
    number
    state
    url
    updatedAt
    isDraft
    merged
    author {
      login
      avatarUrl
    }
    repository {
      nameWithOwner
    }
    labels(first: 8) {
      nodes {
        name
      }
    }
    statusCheckRollup {
      state
    }
  }
`

const viewerPullRequestsQuery = `
  query ViewerPullRequests($searchQuery: String!, $first: Int!) {
    search(query: $searchQuery, type: ISSUE, first: $first) {
      nodes {
        ...PullRequestFields
      }
    }
  }

  ${pullRequestFields}
`

const repositoryPullRequestsQuery = `
  query RepositoryPullRequests($owner: String!, $repo: String!, $first: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequests(first: $first, states: [OPEN], orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes {
          ...PullRequestFields
        }
      }
    }
  }

  ${pullRequestFields}
`

const pullRequestByNumberQuery = `
  query PullRequestByNumber($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        ...PullRequestFields
      }
    }
  }

  ${pullRequestFields}
`

const pullRequestNodesQuery = `
  query PullRequestNodes($ids: [ID!]!) {
    nodes(ids: $ids) {
      ...PullRequestFields
    }
  }

  ${pullRequestFields}
`

const MAX_SEARCH_RESULTS = 1000

export class PullsApi {
  constructor(private readonly octokit: GitHubOctokit) {}

  async listPullRequestCategory(options: ListPullRequestCategoryOptions): Promise<GitHubPullRequest[]> {
    const limit = normalizeLimit(options.limit)
    const { data: viewer } = await this.octokit.rest.users.getAuthenticated()

    if (options.category === 'inbox') {
      const references = await listInboxWorkItemReferences(this.octokit, 'pull-request')
      const unreadKeys = await listUnreadWorkItemKeys(this.octokit)
      const nodes = await Promise.all(
        references.map((reference) => this.fetchPullRequestByReference(reference).catch(() => null))
      )

      return dedupePullRequests(mapPullRequestNodes(nodes.filter(isOpenPullRequestNode), unreadKeys)).slice(0, limit)
    }

    return this.searchPullRequests(categorySearchQuery(options.category, viewer.login), limit)
  }

  async listViewerPullRequests(options: ListWorkspaceItemsOptions = {}): Promise<GitHubPullRequest[]> {
    const limit = normalizeLimit(options.limit)
    const { data: viewer } = await this.octokit.rest.users.getAuthenticated()
    return this.searchPullRequests(
      `is:pr is:open archived:false involves:${viewer.login} sort:updated-desc`,
      limit
    )
  }

  async listRepositoryPullRequests(options: ListRepositoryWorkspaceItemsOptions): Promise<GitHubPullRequest[]> {
    const limit = normalizeLimit(options.limit)
    const response = await this.octokit.graphql<RepositoryPullRequestsResponse>(
      repositoryPullRequestsQuery,
      {
        owner: options.owner,
        repo: options.repo,
        first: limit
      }
    )
    const unreadKeys = await listUnreadWorkItemKeys(this.octokit)

    return mapPullRequestNodes(response.repository?.pullRequests.nodes, unreadKeys)
  }

  async searchRepositoryPullRequests(
    options: SearchRepositoryPullRequestsOptions
  ): Promise<GitHubPullRequestSearchResult> {
    const page = normalizePage(options.page)
    const perPage = normalizeLimit(options.perPage)
    const state = normalizeSearchState(options.state)
    const searchQuery = repositorySearchQuery({
      owner: options.owner,
      repo: options.repo,
      search: options.search,
      state,
    })
    const response = await this.octokit.request('GET /search/issues', {
      q: searchQuery,
      sort: 'updated',
      order: 'desc',
      page,
      per_page: perPage,
    })
    const payload = response.data as SearchPullRequestsResponse
    const ids = (payload.items ?? [])
      .map((item) => item.node_id)
      .filter(isString)
    const unreadKeys = await listUnreadWorkItemKeys(this.octokit)
    const pullRequests = await this.fetchPullRequestNodes(ids, unreadKeys)
    const totalCount = payload.total_count ?? pullRequests.length

    return {
      items: pullRequests,
      totalCount,
      page,
      perPage,
      hasNextPage: page * perPage < Math.min(totalCount, MAX_SEARCH_RESULTS),
      incompleteResults: Boolean(payload.incomplete_results),
    }
  }

  private async searchPullRequests(searchQuery: string, limit: number): Promise<GitHubPullRequest[]> {
    const response = await this.octokit.graphql<ViewerPullRequestsResponse>(
      viewerPullRequestsQuery,
      {
        first: limit,
        searchQuery
      }
    )
    const unreadKeys = await listUnreadWorkItemKeys(this.octokit)

    return dedupePullRequests(mapPullRequestNodes(response.search.nodes, unreadKeys))
  }

  private async fetchPullRequestByReference(reference: {
    owner: string
    repo: string
    number: number
  }): Promise<GraphQLPullRequestNode | null> {
    const response = await this.octokit.graphql<PullRequestByNumberResponse>(
      pullRequestByNumberQuery,
      {
        owner: reference.owner,
        repo: reference.repo,
        number: reference.number
      }
    )

    return response.repository?.pullRequest ?? null
  }

  private async fetchPullRequestNodes(
    ids: string[],
    unreadKeys: Set<string>
  ): Promise<GitHubPullRequest[]> {
    if (ids.length === 0) return []

    const response = await this.octokit.graphql<PullRequestNodesResponse>(
      pullRequestNodesQuery,
      { ids }
    )

    return mapPullRequestNodes(response.nodes, unreadKeys)
  }
}

function isOpenPullRequestNode(node: GraphQLPullRequestNode | null): node is GraphQLPullRequestNode {
  return Boolean(node) && node?.state === 'OPEN'
}

function categorySearchQuery(category: ListPullRequestCategoryOptions['category'], login: string): string {
  if (category === 'created-by-me') {
    return `is:pr is:open archived:false author:${login} sort:updated-desc`
  }

  if (category === 'needs-review') {
    return `is:pr is:open archived:false review-requested:${login} sort:updated-desc`
  }

  return `is:pr is:open archived:false mentions:${login} sort:updated-desc`
}

function repositorySearchQuery(options: {
  owner: string
  repo: string
  search?: string
  state: GitHubPullRequestSearchState
}): string {
  const parts = [
    `repo:${options.owner}/${options.repo}`,
    'is:pr',
  ]

  if (options.state === 'open') {
    parts.push('is:open')
  } else if (options.state === 'closed') {
    parts.push('is:closed')
  }

  const search = options.search?.trim()
  if (search) {
    parts.push(search)
  }

  return parts.join(' ')
}

function normalizePage(value: number | undefined): number {
  return Math.min(Math.max(Math.round(value ?? 1), 1), 50)
}

function normalizeSearchState(
  value: SearchRepositoryPullRequestsOptions['state']
): GitHubPullRequestSearchState {
  if (value === 'closed' || value === 'all') return value

  return 'open'
}

function isString(value: string | null | undefined): value is string {
  return Boolean(value)
}

function mapPullRequestNodes(
  nodes: Array<GraphQLPullRequestNode | null> | null | undefined,
  unreadKeys: Set<string>
): GitHubPullRequest[] {
  return (nodes ?? []).flatMap((node) => {
    if (!node) return []

    const repository = splitRepositoryName(node.repository.nameWithOwner)

    return [
      {
        id: `pull-request:${node.id}`,
        owner: repository.owner,
        repo: repository.repo,
        repository: repository.repository,
        number: node.number,
        title: node.title,
        state: normalizePullRequestState(node),
        ciState: normalizeCiState(node.statusCheckRollup?.state),
        author: normalizeActor(node.author),
        updatedAt: node.updatedAt,
        labels: mapLabels(node.labels),
        url: node.url,
        hasUpdates: unreadKeys.has(createWorkItemKey('pull-request', repository.repository, node.number))
      }
    ]
  })
}

function dedupePullRequests(pullRequests: GitHubPullRequest[]): GitHubPullRequest[] {
  const seen = new Set<string>()
  const result: GitHubPullRequest[] = []

  for (const pullRequest of pullRequests) {
    const key = createWorkItemKey('pull-request', pullRequest.repository, pullRequest.number)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(pullRequest)
  }

  return result
}

function normalizePullRequestState(node: GraphQLPullRequestNode): GitHubPullRequestState {
  if (node.merged || node.state === 'MERGED') return 'merged'
  if (node.state === 'CLOSED') return 'closed'
  if (node.isDraft) return 'draft'

  return 'open'
}

function normalizeCiState(value: string | null | undefined): GitHubCiState | null {
  if (value === 'SUCCESS') return 'success'
  if (value === 'FAILURE' || value === 'ERROR') return 'failure'
  if (value === 'PENDING' || value === 'EXPECTED') return 'pending'

  return null
}
