import { normalizeLimit } from './work-items'
import type { GitHubOctokit } from '../transport'
import type {
  GitHubItemKind,
  GitHubItemState,
  GitHubNotification,
  GitHubWorkspaceItem,
  ListNotificationsOptions,
  ListWorkspaceItemsOptions,
} from '../types'

type GraphQLActor = {
  login: string
  avatarUrl?: string | null
} | null

interface GraphQLLabelConnection {
  nodes?: Array<{ name: string; color?: string | null; description?: string | null } | null> | null
}

interface GraphQLRepository {
  nameWithOwner: string
  url?: string
}

interface GraphQLWorkItemNode {
  id: string
  title: string
  number: number
  state: string
  url: string
  updatedAt: string
  author: GraphQLActor
  repository: GraphQLRepository
  labels?: GraphQLLabelConnection | null
}

interface ViewerWorkItemsResponse {
  viewer: {
    pullRequests: {
      nodes?: Array<GraphQLWorkItemNode | null> | null
    }
    issues: {
      nodes?: Array<GraphQLWorkItemNode | null> | null
    }
  }
}

const viewerWorkItemsQuery = `
  query ViewerWorkItems($first: Int!) {
    viewer {
      pullRequests(first: $first, states: [OPEN], orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes {
          id
          title
          number
          state
          url
          updatedAt
          author {
            login
            avatarUrl
          }
          repository {
            nameWithOwner
            url
          }
          labels(first: 8) {
            nodes {
              name
              color
              description
            }
          }
        }
      }
      issues(first: $first, states: [OPEN], orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes {
          id
          title
          number
          state
          url
          updatedAt
          author {
            login
            avatarUrl
          }
          repository {
            nameWithOwner
            url
          }
          labels(first: 8) {
            nodes {
              name
              color
              description
            }
          }
        }
      }
    }
  }
`

export class InboxApi {
  constructor(private readonly octokit: GitHubOctokit) {}

  async listWorkspaceItems(options: ListWorkspaceItemsOptions = {}): Promise<GitHubWorkspaceItem[]> {
    // Each underlying fetch takes a single page (GraphQL first:100, REST
    // per_page:50), so normalize the limit to that ceiling up front.
    const limit = normalizeLimit(options.limit)
    // fetchViewerWorkItems returns PR and issue nodes in one query; fetch once
    // and split locally instead of issuing it twice.
    const [notifications, response] = await Promise.all([
      this.listNotifications({ ...options, limit }),
      this.fetchViewerWorkItems({ ...options, limit })
    ])
    const pullRequests = mapGraphQLNodes(response.viewer.pullRequests.nodes, 'pull_request')
    const issues = mapGraphQLNodes(response.viewer.issues.nodes, 'issue')

    return [...notifications, ...pullRequests, ...issues].sort((a, b) => {
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
    })
  }

  async listNotifications(options: ListWorkspaceItemsOptions = {}): Promise<GitHubWorkspaceItem[]> {
    const limit = options.limit ?? 50
    // Notifications arrive newest-first, so a single page is enough.
    const response = await this.octokit.rest.activity.listNotificationsForAuthenticatedUser({
      all: false,
      per_page: Math.min(limit, 50)
    })
    const notifications = response.data

    return notifications.slice(0, limit).map((notification) => {
      const repository = notification.repository.full_name
      const title = notification.subject.title
      const kind = notificationKind(notification.subject.type)

      return {
        id: `notification:${notification.id}`,
        kind,
        title,
        repository,
        number: parseSubjectNumber(notification.subject.url),
        state: notification.unread ? 'unread' : 'open',
        author: {
          login: notification.reason
        },
        updatedAt: notification.updated_at,
        labels: [{ name: notification.reason, color: '', description: null }],
        summary: notification.subject.type,
        url: notification.repository.html_url
      }
    })
  }

  async listInboxNotifications(options: ListNotificationsOptions = {}): Promise<GitHubNotification[]> {
    const limit = options.limit ?? 50
    // Notifications arrive newest-first, so a single page is enough.
    const response = await this.octokit.rest.activity.listNotificationsForAuthenticatedUser({
      all: options.all ?? false,
      participating: options.participating ?? false,
      per_page: Math.min(limit, 50),
    })
    const notifications = response.data

    return notifications.slice(0, limit).map((notification) => ({
      id: notification.id,
      unread: notification.unread,
      reason: notification.reason,
      updatedAt: notification.updated_at,
      subjectType: notification.subject.type,
      subjectTitle: notification.subject.title,
      repositoryFullName: notification.repository.full_name,
      repositoryHtmlUrl: notification.repository.html_url,
      number: parseSubjectNumber(notification.subject.url),
      htmlUrl: notificationHtmlUrl(notification.subject.url, notification.repository.html_url),
    }))
  }

  async markThreadAsRead(threadId: string): Promise<void> {
    await this.octokit.rest.activity.markThreadAsRead({ thread_id: Number(threadId) })
  }

  async markAllAsRead(lastReadAt?: string): Promise<void> {
    await this.octokit.rest.activity.markNotificationsAsRead(
      lastReadAt ? { last_read_at: lastReadAt } : {},
    )
  }

  async markThreadAsDone(threadId: string): Promise<void> {
    await this.octokit.rest.activity.markThreadAsDone({ thread_id: Number(threadId) })
  }

  async unsubscribe(threadId: string): Promise<void> {
    await this.octokit.rest.activity.setThreadSubscription({ thread_id: Number(threadId), ignored: true })
  }

  async listPullRequests(options: ListWorkspaceItemsOptions = {}): Promise<GitHubWorkspaceItem[]> {
    const response = await this.fetchViewerWorkItems(options)
    return mapGraphQLNodes(response.viewer.pullRequests.nodes, 'pull_request')
  }

  async listIssues(options: ListWorkspaceItemsOptions = {}): Promise<GitHubWorkspaceItem[]> {
    const response = await this.fetchViewerWorkItems(options)
    return mapGraphQLNodes(response.viewer.issues.nodes, 'issue')
  }

  private async fetchViewerWorkItems(
    options: ListWorkspaceItemsOptions = {}
  ): Promise<ViewerWorkItemsResponse> {
    return this.octokit.graphql<ViewerWorkItemsResponse>(viewerWorkItemsQuery, {
      first: Math.min(options.limit ?? 50, 100)
    })
  }
}

function mapGraphQLNodes(
  nodes: Array<GraphQLWorkItemNode | null> | null | undefined,
  kind: Extract<GitHubItemKind, 'pull_request' | 'issue'>
): GitHubWorkspaceItem[] {
  return (nodes ?? []).flatMap((node) => {
    if (!node) {
      return []
    }

    return [
      {
        id: `${kind}:${node.id}`,
        kind,
        title: node.title,
        repository: node.repository.nameWithOwner,
        number: node.number,
        state: normalizeState(node.state),
        author: {
          login: node.author?.login ?? 'unknown',
          avatarUrl: node.author?.avatarUrl ?? undefined
        },
        updatedAt: node.updatedAt,
        labels: (node.labels?.nodes ?? []).flatMap((label) =>
          label?.name
            ? [{ name: label.name, color: label.color ?? '', description: label.description ?? null }]
            : []
        ),
        summary: node.repository.nameWithOwner,
        url: node.url
      }
    ]
  })
}

function notificationKind(subjectType: string): GitHubItemKind {
  if (subjectType === 'PullRequest') {
    return 'pull_request'
  }

  if (subjectType === 'Issue') {
    return 'issue'
  }

  if (subjectType === 'CheckSuite' || subjectType === 'WorkflowRun') {
    return 'action'
  }

  return 'notification'
}

function normalizeState(value: string): GitHubItemState {
  if (value === 'MERGED') {
    return 'merged'
  }

  if (value === 'CLOSED') {
    return 'closed'
  }

  return 'open'
}

export function parseSubjectNumber(url: string | undefined | null): number | undefined {
  const match = url?.match(/\/(?:issues|pulls)\/(\d+)$/)
  return match ? Number(match[1]) : undefined
}

export function notificationHtmlUrl(
  subjectUrl: string | null | undefined,
  repositoryHtmlUrl: string,
): string {
  if (!subjectUrl) {
    return repositoryHtmlUrl
  }

  const match = subjectUrl.match(/^https:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/)
  if (!match) {
    return repositoryHtmlUrl
  }

  const [, owner, repo, segment, rest] = match
  const mapped = segment === 'pulls' ? 'pull' : segment === 'commits' ? 'commit' : segment
  if (mapped !== 'pull' && mapped !== 'commit' && mapped !== 'issues') {
    return repositoryHtmlUrl
  }

  return `https://github.com/${owner}/${repo}/${mapped}/${rest}`
}
