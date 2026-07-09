import type { GitHubOctokit } from '../transport'
import type {
  CreateIssueCommentOptions,
  GetIssueDetailOptions,
  GitHubActor,
  GitHubIssue,
  GitHubIssueComment,
  GitHubIssueDetail,
  GitHubIssueDevelopment,
  GitHubIssueLinkedRef,
  GitHubIssueMilestone,
  GitHubIssueProjectItem,
  GitHubIssueRelationships,
  GitHubIssueSubscription,
  GitHubLabel,
  GitHubIssueReaction,
  GitHubReactionUser,
  GitHubReactionContent,
  GitHubIssueSearchResult,
  GitHubIssueSearchState,
  GitHubIssueState,
  GitHubIssueTimelineEvent,
  GitHubIssueTimelineReference,
  ListIssueCategoryOptions,
  ListRepositoryWorkspaceItemsOptions,
  ListWorkspaceItemsOptions,
  RepositoryOptions,
  SearchRepositoryIssuesOptions,
  DeleteIssueOptions,
  SetIssueLockOptions,
  SetIssuePinnedOptions,
  SetIssueSubscriptionOptions,
  SetReactionOptions,
  UpdateIssueCommentOptions,
  UpdateIssueOptions
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
    nodes?: Array<GraphQLReactorNode | null> | null
  }
  viewerHasReacted?: boolean
}

interface GraphQLReactorNode {
  login?: string | null
  name?: string | null
  avatarUrl?: string | null
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
  databaseId?: number | null
  body: string
  createdAt: string
  updatedAt: string
  authorAssociation: string
  url: string
  author: GraphQLActorNode | null
  reactionGroups?: GraphQLReactionGroup[] | null
  viewerCanUpdate?: boolean | null
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
  issueType?: { name: string, color?: string | null, description?: string | null } | null
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
  linkedBranches?: { nodes?: Array<{ id: string, ref?: { name: string } | null } | null> | null } | null
  closedByPullRequestsReferences?: {
    nodes?: Array<GraphQLLinkedRefNode | null> | null
  } | null
  parent?: GraphQLLinkedRefNode | null
  subIssues?: { nodes?: Array<GraphQLLinkedRefNode | null> | null } | null
  trackedIssues?: { nodes?: Array<GraphQLLinkedRefNode | null> | null } | null
  projectItems?: {
    nodes?: Array<{
      id: string
      project?: { title: string, url?: string | null } | null
      fieldValues?: {
        nodes?: Array<{
          __typename?: string
          name?: string | null
          text?: string | null
          number?: number | null
          field?: { name?: string | null } | null
        } | null> | null
      } | null
    } | null> | null
  } | null
  viewerCanUpdate?: boolean | null
  viewerCanClose?: boolean | null
  viewerCanReopen?: boolean | null
  locked?: boolean | null
  isPinned?: boolean | null
  viewerSubscription?: string | null
}

interface GraphQLLinkedRefNode {
  id: string
  number: number
  title?: string | null
  state?: string | null
  url?: string | null
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
        color
        description
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
      issues(first: $first, states: [OPEN], orderBy: { field: CREATED_AT, direction: DESC }) {
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
        issueType {
          name
          color
          description
        }
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
            databaseId
            body
            createdAt
            updatedAt
            authorAssociation
            url
            viewerCanUpdate
            author {
              login
              avatarUrl
            }
            reactionGroups {
              content
              reactors(first: 20) {
                totalCount
                nodes {
                  ... on User {
                    login
                    name
                    avatarUrl
                  }
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
                    name
                    avatarUrl
                  }
                }
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
          reactors(first: 20) {
            totalCount
            nodes {
              ... on User {
                login
                name
                avatarUrl
              }
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
                name
                avatarUrl
              }
            }
          }
          viewerHasReacted
        }
        linkedBranches(first: 10) {
          nodes {
            id
            ref {
              name
            }
          }
        }
        closedByPullRequestsReferences(first: 10, includeClosedPrs: true) {
          nodes {
            id
            number
            title
            state
            url
          }
        }
        parent {
          id
          number
          title
          state
          url
        }
        subIssues(first: 20) {
          nodes {
            id
            number
            title
            state
            url
          }
        }
        trackedIssues(first: 20) {
          nodes {
            id
            number
            title
            state
            url
          }
        }
        projectItems(first: 10) {
          nodes {
            id
            project {
              title
              url
            }
            fieldValues(first: 20) {
              nodes {
                __typename
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  field {
                    ... on ProjectV2SingleSelectField {
                      name
                    }
                  }
                }
                ... on ProjectV2ItemFieldTextValue {
                  text
                  field {
                    ... on ProjectV2FieldCommon {
                      name
                    }
                  }
                }
                ... on ProjectV2ItemFieldNumberValue {
                  number
                  field {
                    ... on ProjectV2FieldCommon {
                      name
                    }
                  }
                }
              }
            }
          }
        }
        viewerCanUpdate
        viewerCanClose
        viewerCanReopen
        locked
        isPinned
        viewerSubscription
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
      const references = await listInboxWorkItemReferences(this.octokit, 'issue', limit)
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
      sort: 'created',
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

  async listRepositoryLabels(options: RepositoryOptions): Promise<GitHubLabel[]> {
    const response = await this.octokit.rest.issues.listLabelsForRepo({
      owner: options.owner,
      repo: options.repo,
      per_page: 100
    })

    return response.data.map((label) => ({
      name: label.name,
      color: label.color ?? '',
      description: label.description ?? null
    }))
  }

  async listRepositoryMilestones(options: RepositoryOptions): Promise<GitHubIssueMilestone[]> {
    const response = await this.octokit.rest.issues.listMilestones({
      owner: options.owner,
      repo: options.repo,
      state: 'open',
      per_page: 100
    })

    return response.data.map((milestone) => ({
      id: String(milestone.id),
      number: milestone.number,
      title: milestone.title,
      description: milestone.description ?? null,
      dueOn: milestone.due_on ?? null,
      state: milestone.state === 'closed' ? 'closed' : 'open',
      url: milestone.html_url
    }))
  }

  async listAssignableUsers(options: RepositoryOptions): Promise<GitHubActor[]> {
    const response = await this.octokit.rest.issues.listAssignees({
      owner: options.owner,
      repo: options.repo,
      per_page: 100
    })

    return response.data.map((user) => ({
      login: user.login,
      avatarUrl: user.avatar_url
    }))
  }

  async updateIssue(options: UpdateIssueOptions): Promise<void> {
    await this.octokit.rest.issues.update({
      owner: options.owner,
      repo: options.repo,
      issue_number: options.number,
      ...(options.title !== undefined ? { title: options.title } : {}),
      ...(options.body !== undefined ? { body: options.body } : {}),
      ...(options.state !== undefined ? { state: options.state } : {}),
      ...(options.stateReason !== undefined ? { state_reason: issueStateReasonToRest(options.stateReason) } : {}),
      ...(options.assignees !== undefined ? { assignees: options.assignees } : {}),
      ...(options.labels !== undefined ? { labels: options.labels } : {}),
      ...(options.milestone !== undefined ? { milestone: options.milestone } : {})
    })
  }

  async updateIssueComment(options: UpdateIssueCommentOptions): Promise<void> {
    await this.octokit.rest.issues.updateComment({
      owner: options.owner,
      repo: options.repo,
      comment_id: normalizeIssueCommentId(options.commentId),
      body: options.body
    })
  }

  async setIssueSubscription(options: SetIssueSubscriptionOptions): Promise<void> {
    await this.octokit.graphql(
      'mutation($id: ID!, $state: SubscriptionState!) { updateSubscription(input: { subscribableId: $id, state: $state }) { clientMutationId } }',
      { id: options.subscribableId, state: options.subscribed ? 'SUBSCRIBED' : 'UNSUBSCRIBED' }
    )
  }

  async setIssueLock(options: SetIssueLockOptions): Promise<void> {
    if (options.locked) {
      await this.octokit.rest.issues.lock({ owner: options.owner, repo: options.repo, issue_number: options.number })
    } else {
      await this.octokit.rest.issues.unlock({ owner: options.owner, repo: options.repo, issue_number: options.number })
    }
  }

  async setIssuePinned(options: SetIssuePinnedOptions): Promise<void> {
    const mutation = options.pinned
      ? 'mutation($id: ID!) { pinIssue(input: { issueId: $id }) { clientMutationId } }'
      : 'mutation($id: ID!) { unpinIssue(input: { issueId: $id }) { clientMutationId } }'
    await this.octokit.graphql(mutation, { id: options.issueId })
  }

  async deleteIssue(options: DeleteIssueOptions): Promise<void> {
    await this.octokit.graphql(
      'mutation($id: ID!) { deleteIssue(input: { issueId: $id }) { clientMutationId } }',
      { id: options.issueId }
    )
  }

  async setReaction(options: SetReactionOptions): Promise<void> {
    const mutation = options.reacted
      ? 'mutation($subjectId: ID!, $content: ReactionContent!) { addReaction(input: { subjectId: $subjectId, content: $content }) { clientMutationId } }'
      : 'mutation($subjectId: ID!, $content: ReactionContent!) { removeReaction(input: { subjectId: $subjectId, content: $content }) { clientMutationId } }'
    await this.octokit.graphql(mutation, {
      subjectId: options.subjectId,
      content: reactionContentToGraphQL(options.content)
    })
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

function mapLinkedRef(node: GraphQLLinkedRefNode | null | undefined): GitHubIssueLinkedRef | null {
  if (!node) return null
  return { id: node.id, number: node.number, title: node.title ?? null, state: node.state ?? null, url: node.url ?? null }
}

function mapLinkedRefs(nodes: Array<GraphQLLinkedRefNode | null> | null | undefined): GitHubIssueLinkedRef[] {
  return (nodes ?? []).flatMap((node) => {
    const ref = mapLinkedRef(node)
    return ref ? [ref] : []
  })
}

export function mapIssueRelationships(
  node: Pick<GraphQLIssueDetailNode, 'parent' | 'subIssues' | 'trackedIssues'>
): GitHubIssueRelationships {
  return {
    parent: mapLinkedRef(node.parent),
    subIssues: mapLinkedRefs(node.subIssues?.nodes),
    tracked: mapLinkedRefs(node.trackedIssues?.nodes)
  }
}

export function mapIssueProjects(
  node: Pick<GraphQLIssueDetailNode, 'projectItems'>
): GitHubIssueProjectItem[] {
  const itemNodes = (node.projectItems?.nodes ?? []).filter(
    (item): item is NonNullable<typeof item> => Boolean(item?.project)
  )
  return itemNodes.map((item) => {
    const fieldNodes = (item.fieldValues?.nodes ?? []).filter((f): f is NonNullable<typeof f> => Boolean(f))
    const fields = fieldNodes.flatMap((field) => {
      const name = field.field?.name
      const value = field.name ?? field.text ?? (typeof field.number === 'number' ? String(field.number) : null)
      return name && value ? [{ name, value }] : []
    })
    return {
      id: item.id,
      title: item.project?.title ?? '',
      url: item.project?.url ?? null,
      fields
    }
  })
}

export function mapIssueDevelopment(
  node: Pick<GraphQLIssueDetailNode, 'linkedBranches' | 'closedByPullRequestsReferences'>
): GitHubIssueDevelopment | null {
  const branchNodes = (node.linkedBranches?.nodes ?? []).filter((b): b is NonNullable<typeof b> => Boolean(b))
  const prNodes = (node.closedByPullRequestsReferences?.nodes ?? []).filter(
    (p): p is NonNullable<typeof p> => Boolean(p)
  )
  const pullRequests = prNodes.map((pr) => ({
    id: pr.id,
    number: pr.number,
    title: pr.title ?? null,
    state: pr.state ?? null,
    url: pr.url ?? null
  }))

  if (branchNodes.length === 0 && pullRequests.length === 0) return null

  return {
    branches: branchNodes.length > 0 ? branchNodes.length : null,
    commits: null,
    pullRequests
  }
}

function normalizeIssueSubscription(value: string | null | undefined): GitHubIssueSubscription | null {
  if (value === 'SUBSCRIBED' || value === 'UNSUBSCRIBED' || value === 'IGNORED') return value
  return null
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
    issueType: node.issueType
      ? { name: node.issueType.name, color: node.issueType.color ?? null, description: node.issueType.description ?? null }
      : null,
    relationships: mapIssueRelationships(node),
    projects: mapIssueProjects(node),
    assignees: mapActorNodes(node.assignees?.nodes),
    milestone: mapMilestone(node.milestone),
    participants: mapActorNodes(node.participants?.nodes),
    comments: mapComments(node.comments?.nodes),
    timelineEvents: mapTimelineEvents(node.timelineItems?.nodes),
    reactions: mapReactions(node.reactionGroups),
    development: mapIssueDevelopment(node),
    url: node.url,
    hasUpdates: unreadKeys.has(createWorkItemKey('issue', repository.repository, node.number)),
    viewerCanUpdate: node.viewerCanUpdate ?? false,
    viewerCanClose: node.viewerCanClose ?? false,
    viewerCanReopen: node.viewerCanReopen ?? false,
    nodeId: node.id,
    locked: node.locked ?? false,
    isPinned: node.isPinned ?? false,
    viewerSubscription: normalizeIssueSubscription(node.viewerSubscription)
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
        id: `issue-comment:${comment.databaseId ?? comment.id}`,
        nodeId: comment.id,
        author: normalizeActor(comment.author),
        body: comment.body,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        authorAssociation: comment.authorAssociation,
        reactions: mapReactions(comment.reactionGroups),
        url: comment.url,
        viewerCanUpdate: comment.viewerCanUpdate ?? false
      }
    ]
  })
}

function mapRestIssueComment(comment: RestIssueCommentNode): GitHubIssueComment {
  return {
    id: `issue-comment:${comment.id}`,
    nodeId: comment.node_id ?? '',
    author: {
      login: comment.user?.login ?? 'unknown',
      avatarUrl: comment.user?.avatar_url ?? undefined
    },
    body: comment.body ?? '',
    createdAt: comment.created_at ?? '',
    updatedAt: comment.updated_at ?? comment.created_at ?? '',
    authorAssociation: comment.author_association ?? 'NONE',
    reactions: [],
    url: comment.html_url ?? '',
    viewerCanUpdate: true
  }
}

function issueStateReasonToRest(reason: UpdateIssueOptions['stateReason']): 'completed' | 'not_planned' {
  return reason === 'not_planned' ? 'not_planned' : 'completed'
}

function normalizeIssueCommentId(value: string | number): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value

  const raw = String(value)
  const numericPart = raw.includes(':') ? raw.split(':').at(-1) : raw
  const parsed = Number(numericPart)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Issue comment id must be a positive integer')
  }

  return parsed
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
        viewerHasReacted: group.viewerHasReacted || undefined,
        reactors: mapReactors(group.reactors.nodes)
      }
    ]
  })
}

function mapReactors(
  nodes: Array<GraphQLReactorNode | null> | null | undefined
): GitHubReactionUser[] {
  return (nodes ?? []).flatMap((node) => {
    if (!node?.login) return []

    return [
      {
        login: node.login,
        name: node.name ?? null,
        avatarUrl: node.avatarUrl ?? null
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

function reactionContentToGraphQL(content: GitHubReactionContent): string {
  const graphqlContent: Record<GitHubReactionContent, string> = {
    'thumbs-up': 'THUMBS_UP',
    'thumbs-down': 'THUMBS_DOWN',
    'laugh': 'LAUGH',
    'hooray': 'HOORAY',
    'confused': 'CONFUSED',
    'heart': 'HEART',
    'rocket': 'ROCKET',
    'eyes': 'EYES'
  }

  return graphqlContent[content]
}

function normalizeTimelineSourceType(type: string | undefined): string {
  if (type === 'PullRequest') return 'pull-request'
  if (type === 'Issue') return 'issue'

  return type ?? 'unknown'
}
