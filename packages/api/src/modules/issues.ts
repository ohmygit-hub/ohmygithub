import type { GitHubOctokit } from '../transport'
import type {
  CreateIssueCommentOptions,
  GetIssueDetailOptions,
  GitHubActor,
  GitHubIssue,
  GitHubIssueComment,
  GitHubIssueDetail,
  GitHubIssueMilestone,
  GitHubIssueReaction,
  GitHubIssueSearchResult,
  GitHubIssueSearchState,
  GitHubIssueState,
  GitHubIssueTimelineEvent,
  GitHubIssueTimelineReference,
  ListIssueCategoryOptions,
  ListRepositoryWorkspaceItemsOptions,
  ListWorkspaceItemsOptions,
  SearchRepositoryIssuesOptions
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

interface GraphQLIssueNode extends GraphQLWorkItemBase {
  stateReason?: string | null
}

interface GraphQLActorNode {
  login: string
  avatarUrl?: string | null
}

interface GraphQLReactionGroup {
  content: string
  reactors: {
    totalCount: number
  }
  viewerHasReacted?: boolean
}

interface GraphQLMilestoneNode {
  id: string
  number: number
  title: string
  description?: string | null
  dueOn?: string | null
  state: string
  url: string
}

interface GraphQLIssueCommentNode {
  id: string
  body: string
  createdAt: string
  updatedAt: string
  authorAssociation: string
  url: string
  author: GraphQLActorNode | null
  reactionGroups?: GraphQLReactionGroup[] | null
}

interface RestIssueCommentNode {
  id: number
  node_id?: string | null
  body?: string | null
  created_at?: string | null
  updated_at?: string | null
  author_association?: string | null
  html_url?: string | null
  user?: {
    login?: string | null
    avatar_url?: string | null
  } | null
}

interface GraphQLTimelineSourceNode {
  __typename?: string
  title?: string | null
  number?: number | null
  url?: string | null
  repository?: {
    nameWithOwner: string
  } | null
}

interface GraphQLIssueTimelineNode {
  __typename?: string
  id?: string | null
  actor?: GraphQLActorNode | null
  createdAt?: string | null
  assignee?: GraphQLActorNode | null
  label?: {
    name?: string | null
  } | null
  previousTitle?: string | null
  currentTitle?: string | null
  source?: GraphQLTimelineSourceNode | null
}

interface GraphQLIssueDetailNode extends GraphQLIssueNode {
  createdAt: string
  closedAt?: string | null
  body: string
  assignees?: {
    nodes?: Array<GraphQLActorNode | null> | null
  } | null
  milestone?: GraphQLMilestoneNode | null
  participants?: {
    nodes?: Array<GraphQLActorNode | null> | null
  } | null
  comments?: {
    nodes?: Array<GraphQLIssueCommentNode | null> | null
  } | null
  timelineItems?: {
    nodes?: Array<GraphQLIssueTimelineNode | null> | null
  } | null
  reactionGroups?: GraphQLReactionGroup[] | null
}

interface ViewerIssuesResponse {
  search: {
    nodes?: Array<GraphQLIssueNode | null> | null
  }
}

interface RepositoryIssuesResponse {
  repository: {
    issues: {
      nodes?: Array<GraphQLIssueNode | null> | null
    }
  } | null
}

interface IssueByNumberResponse {
  repository: {
    issue: GraphQLIssueNode | null
  } | null
}

interface IssueNodesResponse {
  nodes?: Array<GraphQLIssueNode | null> | null
}

interface SearchIssueItem {
  node_id?: string | null
}

interface SearchIssuesResponse {
  incomplete_results?: boolean
  items?: SearchIssueItem[]
  total_count?: number
}

interface IssueDetailResponse {
  repository: {
    issue: GraphQLIssueDetailNode | null
  } | null
}

const issueFields = `
  fragment IssueFields on Issue {
    id
    title
    number
    state
    stateReason
    url
    updatedAt
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
  }
`

const viewerIssuesQuery = `
  query ViewerIssues($searchQuery: String!, $first: Int!) {
    search(query: $searchQuery, type: ISSUE, first: $first) {
      nodes {
        ...IssueFields
      }
    }
  }

  ${issueFields}
`

const repositoryIssuesQuery = `
  query RepositoryIssues($owner: String!, $repo: String!, $first: Int!) {
    repository(owner: $owner, name: $repo) {
      issues(first: $first, states: [OPEN], orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes {
          ...IssueFields
        }
      }
    }
  }

  ${issueFields}
`

const issueByNumberQuery = `
  query IssueByNumber($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) {
        ...IssueFields
      }
    }
  }

  ${issueFields}
`

const issueNodesQuery = `
  query IssueNodes($ids: [ID!]!) {
    nodes(ids: $ids) {
      ...IssueFields
    }
  }

  ${issueFields}
`

const issueDetailQuery = `
  query IssueDetail($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) {
        ...IssueFields
        createdAt
        closedAt
        body
        assignees(first: 10) {
          nodes {
            login
            avatarUrl
          }
        }
        milestone {
          id
          number
          title
          description
          dueOn
          state
          url
        }
        participants(first: 10) {
          nodes {
            login
            avatarUrl
          }
        }
        comments(last: 100) {
          nodes {
            id
            body
            createdAt
            updatedAt
            authorAssociation
            url
            author {
              login
              avatarUrl
            }
            reactionGroups {
              content
              reactors {
                totalCount
              }
              viewerHasReacted
            }
          }
        }
        timelineItems(
          first: 50
          itemTypes: [
            ASSIGNED_EVENT
            UNASSIGNED_EVENT
            LABELED_EVENT
            UNLABELED_EVENT
            CLOSED_EVENT
            REOPENED_EVENT
            RENAMED_TITLE_EVENT
            CROSS_REFERENCED_EVENT
            MENTIONED_EVENT
          ]
        ) {
          nodes {
            __typename
            ... on AssignedEvent {
              id
              actor {
                login
                avatarUrl
              }
              createdAt
              assignee {
                ... on Bot {
                  login
                  avatarUrl
                }
                ... on Mannequin {
                  login
                  avatarUrl
                }
                ... on Organization {
                  login
                  avatarUrl
                }
                ... on User {
                  login
                  avatarUrl
                }
              }
            }
            ... on UnassignedEvent {
              id
              actor {
                login
                avatarUrl
              }
              createdAt
              assignee {
                ... on Bot {
                  login
                  avatarUrl
                }
                ... on Mannequin {
                  login
                  avatarUrl
                }
                ... on Organization {
                  login
                  avatarUrl
                }
                ... on User {
                  login
                  avatarUrl
                }
              }
            }
            ... on LabeledEvent {
              id
              actor {
                login
                avatarUrl
              }
              createdAt
              label {
                name
              }
            }
            ... on UnlabeledEvent {
              id
              actor {
                login
                avatarUrl
              }
              createdAt
              label {
                name
              }
            }
            ... on ClosedEvent {
              id
              actor {
                login
                avatarUrl
              }
              createdAt
            }
            ... on ReopenedEvent {
              id
              actor {
                login
                avatarUrl
              }
              createdAt
            }
            ... on RenamedTitleEvent {
              id
              actor {
                login
                avatarUrl
              }
              createdAt
              previousTitle
              currentTitle
            }
            ... on CrossReferencedEvent {
              id
              actor {
                login
                avatarUrl
              }
              createdAt
              source {
                __typename
                ... on Issue {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
                ... on PullRequest {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
              }
            }
            ... on MentionedEvent {
              id
              actor {
                login
                avatarUrl
              }
              createdAt
            }
          }
        }
        reactionGroups {
          content
          reactors {
            totalCount
          }
          viewerHasReacted
        }
      }
    }
  }

  ${issueFields}
`

const MAX_SEARCH_RESULTS = 1000
export class IssuesApi {
  constructor(private readonly octokit: GitHubOctokit) {}

  async listIssueCategory(options: ListIssueCategoryOptions): Promise<GitHubIssue[]> {
    const limit = normalizeLimit(options.limit)
    const { data: viewer } = await this.octokit.rest.users.getAuthenticated()

    if (options.category === 'inbox') {
      const references = await listInboxWorkItemReferences(this.octokit, 'issue')
      const unreadKeys = await listUnreadWorkItemKeys(this.octokit)
      const nodes = await Promise.all(
        references.map((reference) => this.fetchIssueByReference(reference).catch(() => null))
      )

      return dedupeIssues(mapIssueNodes(nodes.filter(isOpenIssueNode), unreadKeys)).slice(0, limit)
    }

    return this.searchIssues(categorySearchQuery(options.category, viewer.login), limit)
  }

  async listViewerIssues(options: ListWorkspaceItemsOptions = {}): Promise<GitHubIssue[]> {
    const limit = normalizeLimit(options.limit)
    const { data: viewer } = await this.octokit.rest.users.getAuthenticated()
    return this.searchIssues(
      `is:issue is:open archived:false involves:${viewer.login} sort:updated-desc`,
      limit
    )
  }

  async listRepositoryIssues(options: ListRepositoryWorkspaceItemsOptions): Promise<GitHubIssue[]> {
    const limit = normalizeLimit(options.limit)
    const response = await this.octokit.graphql<RepositoryIssuesResponse>(
      repositoryIssuesQuery,
      {
        owner: options.owner,
        repo: options.repo,
        first: limit
      }
    )
    const unreadKeys = await listUnreadWorkItemKeys(this.octokit)

    return mapIssueNodes(response.repository?.issues.nodes, unreadKeys)
  }

  async searchRepositoryIssues(options: SearchRepositoryIssuesOptions): Promise<GitHubIssueSearchResult> {
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
    const payload = response.data as SearchIssuesResponse
    const ids = (payload.items ?? [])
      .map((item) => item.node_id)
      .filter(isString)
    const unreadKeys = await listUnreadWorkItemKeys(this.octokit)
    const issues = await this.fetchIssueNodes(ids, unreadKeys)
    const totalCount = payload.total_count ?? issues.length

    return {
      items: issues,
      totalCount,
      page,
      perPage,
      hasNextPage: page * perPage < Math.min(totalCount, MAX_SEARCH_RESULTS),
      incompleteResults: Boolean(payload.incomplete_results),
    }
  }

  async getIssueDetail(options: GetIssueDetailOptions): Promise<GitHubIssueDetail> {
    const response = await this.octokit.graphql<IssueDetailResponse>(
      issueDetailQuery,
      {
        owner: options.owner,
        repo: options.repo,
        number: options.number
      }
    )
    const issue = response.repository?.issue

    if (!issue) {
      throw new Error('Issue not found')
    }

    const unreadKeys = await listUnreadWorkItemKeys(this.octokit)

    return mapIssueDetailNode(issue, unreadKeys)
  }

  async createIssueComment(options: CreateIssueCommentOptions): Promise<GitHubIssueComment> {
    const response = await this.octokit.rest.issues.createComment({
      owner: options.owner,
      repo: options.repo,
      issue_number: options.number,
      body: options.body
    })

    return mapRestIssueComment(response.data)
  }

  private async searchIssues(searchQuery: string, limit: number): Promise<GitHubIssue[]> {
    const response = await this.octokit.graphql<ViewerIssuesResponse>(
      viewerIssuesQuery,
      {
        first: limit,
        searchQuery
      }
    )
    const unreadKeys = await listUnreadWorkItemKeys(this.octokit)

    return dedupeIssues(mapIssueNodes(response.search.nodes, unreadKeys))
  }

  private async fetchIssueByReference(reference: {
    owner: string
    repo: string
    number: number
  }): Promise<GraphQLIssueNode | null> {
    const response = await this.octokit.graphql<IssueByNumberResponse>(
      issueByNumberQuery,
      {
        owner: reference.owner,
        repo: reference.repo,
        number: reference.number
      }
    )

    return response.repository?.issue ?? null
  }

  private async fetchIssueNodes(
    ids: string[],
    unreadKeys: Set<string>
  ): Promise<GitHubIssue[]> {
    if (ids.length === 0) return []

    const response = await this.octokit.graphql<IssueNodesResponse>(
      issueNodesQuery,
      { ids }
    )

    return mapIssueNodes(response.nodes, unreadKeys)
  }
}

function isOpenIssueNode(node: GraphQLIssueNode | null): node is GraphQLIssueNode {
  return Boolean(node) && node?.state === 'OPEN'
}

function categorySearchQuery(category: ListIssueCategoryOptions['category'], login: string): string {
  if (category === 'created-by-me') {
    return `is:issue is:open archived:false author:${login} sort:updated-desc`
  }

  return `is:issue is:open archived:false mentions:${login} sort:updated-desc`
}

function repositorySearchQuery(options: {
  owner: string
  repo: string
  search?: string
  state: GitHubIssueSearchState
}): string {
  const parts = [
    `repo:${options.owner}/${options.repo}`,
    'is:issue',
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

function normalizeSearchState(value: SearchRepositoryIssuesOptions['state']): GitHubIssueSearchState {
  if (value === 'closed' || value === 'all') return value

  return 'open'
}

function isString(value: string | null | undefined): value is string {
  return Boolean(value)
}

function mapIssueNodes(
  nodes: Array<GraphQLIssueNode | null> | null | undefined,
  unreadKeys: Set<string>
): GitHubIssue[] {
  return (nodes ?? []).flatMap((node) => {
    if (!node) return []

    const repository = splitRepositoryName(node.repository.nameWithOwner)

    return [
      {
        id: `issue:${node.id}`,
        owner: repository.owner,
        repo: repository.repo,
        repository: repository.repository,
        number: node.number,
        title: node.title,
        state: normalizeIssueState(node),
        author: normalizeActor(node.author),
        updatedAt: node.updatedAt,
        labels: mapLabels(node.labels),
        url: node.url,
        hasUpdates: unreadKeys.has(createWorkItemKey('issue', repository.repository, node.number))
      }
    ]
  })
}

function mapIssueDetailNode(
  node: GraphQLIssueDetailNode,
  unreadKeys: Set<string>
): GitHubIssueDetail {
  const repository = splitRepositoryName(node.repository.nameWithOwner)

  return {
    id: `issue:${node.id}`,
    owner: repository.owner,
    repo: repository.repo,
    repository: repository.repository,
    number: node.number,
    title: node.title,
    state: normalizeIssueState(node),
    author: normalizeActor(node.author),
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    closedAt: node.closedAt ?? null,
    body: node.body,
    labels: mapLabels(node.labels),
    assignees: mapActorNodes(node.assignees?.nodes),
    milestone: mapMilestone(node.milestone),
    participants: mapActorNodes(node.participants?.nodes),
    comments: mapComments(node.comments?.nodes),
    timelineEvents: mapTimelineEvents(node.timelineItems?.nodes),
    reactions: mapReactions(node.reactionGroups),
    url: node.url,
    hasUpdates: unreadKeys.has(createWorkItemKey('issue', repository.repository, node.number))
  }
}

function mapActorNodes(
  nodes: Array<GraphQLActorNode | null> | null | undefined
): GitHubActor[] {
  return (nodes ?? []).flatMap((actor) => {
    if (!actor?.login) return []

    return [normalizeActor(actor)]
  })
}

function mapOptionalActor(actor: GraphQLActorNode | null | undefined): GitHubActor | undefined {
  if (!actor?.login) return undefined

  return normalizeActor(actor)
}

function mapMilestone(
  milestone: GraphQLMilestoneNode | null | undefined
): GitHubIssueMilestone | null {
  if (!milestone) return null

  return {
    id: milestone.id,
    number: milestone.number,
    title: milestone.title,
    description: milestone.description ?? null,
    dueOn: milestone.dueOn ?? null,
    state: milestone.state === 'CLOSED' ? 'closed' : 'open',
    url: milestone.url
  }
}

function mapComments(
  nodes: Array<GraphQLIssueCommentNode | null> | null | undefined
): GitHubIssueComment[] {
  return (nodes ?? []).flatMap((comment) => {
    if (!comment) return []

    return [
      {
        id: `issue-comment:${comment.id}`,
        author: normalizeActor(comment.author),
        body: comment.body,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        authorAssociation: comment.authorAssociation,
        reactions: mapReactions(comment.reactionGroups),
        url: comment.url
      }
    ]
  })
}

function mapRestIssueComment(comment: RestIssueCommentNode): GitHubIssueComment {
  return {
    id: `issue-comment:${comment.node_id ?? comment.id}`,
    author: {
      login: comment.user?.login ?? 'unknown',
      avatarUrl: comment.user?.avatar_url ?? undefined
    },
    body: comment.body ?? '',
    createdAt: comment.created_at ?? '',
    updatedAt: comment.updated_at ?? comment.created_at ?? '',
    authorAssociation: comment.author_association ?? 'NONE',
    reactions: [],
    url: comment.html_url ?? ''
  }
}

function mapReactions(
  groups: GraphQLReactionGroup[] | null | undefined
): GitHubIssueReaction[] {
  return (groups ?? []).flatMap((group) => {
    const count = group.reactors.totalCount

    if (count <= 0 && !group.viewerHasReacted) return []

    return [
      {
        content: normalizeReactionContent(group.content),
        count,
        viewerHasReacted: group.viewerHasReacted || undefined
      }
    ]
  })
}

function mapTimelineEvents(
  nodes: Array<GraphQLIssueTimelineNode | null> | null | undefined
): GitHubIssueTimelineEvent[] {
  return (nodes ?? []).flatMap((node, index): GitHubIssueTimelineEvent[] => {
    if (!node) return []

    const base = {
      id: node.id ? `issue-event:${node.id}` : `issue-event:${node.__typename ?? 'generic'}:${index}`,
      actor: normalizeActor(node.actor ?? null),
      createdAt: node.createdAt ?? ''
    }

    if (node.__typename === 'AssignedEvent') {
      return [{ ...base, type: 'assigned' as const, assignee: mapOptionalActor(node.assignee) }]
    }

    if (node.__typename === 'UnassignedEvent') {
      return [{ ...base, type: 'unassigned' as const, assignee: mapOptionalActor(node.assignee) }]
    }

    if (node.__typename === 'LabeledEvent') {
      return [{ ...base, type: 'labeled' as const, label: node.label?.name ?? null }]
    }

    if (node.__typename === 'UnlabeledEvent') {
      return [{ ...base, type: 'unlabeled' as const, label: node.label?.name ?? null }]
    }

    if (node.__typename === 'ClosedEvent') {
      return [{ ...base, type: 'closed' as const }]
    }

    if (node.__typename === 'ReopenedEvent') {
      return [{ ...base, type: 'reopened' as const }]
    }

    if (node.__typename === 'RenamedTitleEvent') {
      return [
        {
          ...base,
          type: 'renamed' as const,
          from: node.previousTitle ?? null,
          to: node.currentTitle ?? null
        }
      ]
    }

    if (node.__typename === 'CrossReferencedEvent') {
      return [
        {
          ...base,
          type: 'cross-referenced' as const,
          url: node.source?.url ?? null,
          source: mapTimelineSource(node.source)
        }
      ]
    }

    if (node.__typename === 'MentionedEvent') {
      return [{ ...base, type: 'mentioned' as const }]
    }

    return [
      {
        ...base,
        type: 'generic' as const,
        text: node.__typename ?? 'TimelineEvent'
      }
    ]
  })
}

function mapTimelineSource(
  source: GraphQLTimelineSourceNode | null | undefined
): GitHubIssueTimelineReference | undefined {
  if (!source) return undefined

  return {
    type: normalizeTimelineSourceType(source.__typename),
    repository: source.repository?.nameWithOwner,
    number: source.number ?? undefined,
    title: source.title ?? undefined,
    url: source.url ?? null
  }
}

function dedupeIssues(issues: GitHubIssue[]): GitHubIssue[] {
  const seen = new Set<string>()
  const result: GitHubIssue[] = []

  for (const issue of issues) {
    const key = createWorkItemKey('issue', issue.repository, issue.number)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(issue)
  }

  return result
}

function normalizeIssueState(node: GraphQLIssueNode): GitHubIssueState {
  if (node.state !== 'CLOSED') return 'open'
  if (node.stateReason === 'COMPLETED') return 'completed'

  return 'not_planned'
}

function normalizeReactionContent(content: string): string {
  const reactionContent: Record<string, string> = {
    THUMBS_UP: 'thumbs-up',
    THUMBS_DOWN: 'thumbs-down',
    LAUGH: 'laugh',
    HOORAY: 'hooray',
    CONFUSED: 'confused',
    HEART: 'heart',
    ROCKET: 'rocket',
    EYES: 'eyes'
  }

  return reactionContent[content] ?? content.toLowerCase()
}

function normalizeTimelineSourceType(type: string | undefined): string {
  if (type === 'PullRequest') return 'pull-request'
  if (type === 'Issue') return 'issue'

  return type ?? 'unknown'
}
