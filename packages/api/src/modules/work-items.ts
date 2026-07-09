import type { GitHubActor, GitHubLabel } from '../types'
import type { GitHubOctokit } from '../transport'

export type WorkItemKind = 'pull-request' | 'issue'

export interface GraphQLLabelConnection {
  nodes?: Array<{ name: string; color?: string | null; description?: string | null } | null> | null
}

export interface GraphQLRepositoryReference {
  nameWithOwner: string
}

export interface GraphQLWorkItemBase {
  id: string
  title: string
  number: number
  state: string
  url: string
  updatedAt: string
  author: {
    __typename?: string | null
    login: string
    avatarUrl?: string | null
  } | null
  repository: GraphQLRepositoryReference
  labels?: GraphQLLabelConnection | null
}

export interface WorkItemReference {
  kind: WorkItemKind
  owner: string
  repo: string
  repository: string
  number: number
  updatedAt: string
}

export function normalizeLimit(value: number | undefined): number {
  return Math.min(Math.max(Math.round(value ?? 50), 1), 100)
}

export function normalizeActor(actor: GraphQLWorkItemBase['author']): GitHubActor {
  return {
    login: actor?.login ?? 'unknown',
    avatarUrl: actor?.avatarUrl ?? undefined,
    isBot: actor?.__typename === 'Bot' || undefined
  }
}

export function mapLabels(labels: GraphQLLabelConnection | null | undefined): GitHubLabel[] {
  return (labels?.nodes ?? []).flatMap((label) =>
    label?.name
      ? [{ name: label.name, color: label.color ?? '', description: label.description ?? null }]
      : []
  )
}

export function splitRepositoryName(nameWithOwner: string): { owner: string; repo: string; repository: string } {
  const [owner = '', repo = ''] = nameWithOwner.split('/')

  return {
    owner,
    repo,
    repository: owner && repo ? `${owner}/${repo}` : nameWithOwner
  }
}

export function createWorkItemKey(
  kind: WorkItemKind,
  repository: string,
  number: number
): string {
  return `${kind}:${repository.toLowerCase()}:${number}`
}

export async function listUnreadWorkItemKeys(octokit: GitHubOctokit): Promise<Set<string>> {
  try {
    const notifications = await listUnreadNotifications(octokit)

    return new Set(
      notifications.flatMap((notification) => {
        const kind = notification.subject.type === 'PullRequest'
          ? 'pull-request'
          : notification.subject.type === 'Issue'
            ? 'issue'
            : null
        const number = parseSubjectNumber(notification.subject.url)

        if (!kind || !number) {
          return []
        }

        return [
          createWorkItemKey(
            kind,
            notification.repository.full_name,
            number
          )
        ]
      })
    )
  } catch {
    return new Set()
  }
}

export async function listInboxWorkItemReferences(
  octokit: GitHubOctokit,
  kind: WorkItemKind,
  limit = 100
): Promise<WorkItemReference[]> {
  try {
    const seen = new Set<string>()
    const refs: WorkItemReference[] = []
    let page = 1

    // Page by reference count: a mixed notification stream may have few
    // matching kinds, so we keep paging until enough refs are collected.
    while (refs.length < limit) {
      const response = await octokit.rest.activity.listNotificationsForAuthenticatedUser({
        all: true,
        per_page: 50,
        page,
      })

      if (response.data.length === 0) {
        break
      }

      for (const notification of response.data) {
        const notificationKind = notification.subject.type === 'PullRequest'
          ? 'pull-request'
          : notification.subject.type === 'Issue'
            ? 'issue'
            : null
        const number = parseSubjectNumber(notification.subject.url)

        if (notificationKind !== kind || !number) {
          continue
        }

        const repository = notification.repository.full_name
        const [owner = '', repo = ''] = repository.split('/')
        const key = createWorkItemKey(kind, repository, number)

        if (!owner || !repo || seen.has(key)) {
          continue
        }

        seen.add(key)
        refs.push({
          kind,
          owner,
          repo,
          repository,
          number,
          updatedAt: notification.updated_at
        })

        if (refs.length >= limit) {
          break
        }
      }

      if (!response.headers.link?.includes('rel="next"')) {
        break
      }

      page += 1
    }

    return refs
  } catch {
    return []
  }
}

// Unread-dot lookups only need the newest page.
async function listUnreadNotifications(octokit: GitHubOctokit) {
  const response = await octokit.rest.activity.listNotificationsForAuthenticatedUser({
    all: false,
    per_page: 50,
  })
  return response.data
}

function parseSubjectNumber(url: string | undefined): number | null {
  const match = url?.match(/\/(?:issues|pulls)\/(\d+)$/)
  if (!match) return null

  const value = Number(match[1])
  return Number.isFinite(value) ? value : null
}
