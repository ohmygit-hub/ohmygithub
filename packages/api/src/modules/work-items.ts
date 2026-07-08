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
  kind: WorkItemKind
): Promise<WorkItemReference[]> {
  try {
    const notifications = await listAllNotifications(octokit)
    const seen = new Set<string>()
    const refs: WorkItemReference[] = []

    for (const notification of notifications) {
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
    }

    return refs
  } catch {
    return []
  }
}

function listUnreadNotifications(octokit: GitHubOctokit) {
  return listNotifications(octokit, false)
}

function listAllNotifications(octokit: GitHubOctokit) {
  return listNotifications(octokit, true)
}

// Cache notification fetches briefly so the first screen — which fires several
// list/detail endpoints that each independently paginate notifications — shares
// one fetch instead of racing duplicates. Concurrent callers de-dup on the same
// promise; once resolved the value is reused until the TTL elapses.
const NOTIFICATIONS_TTL = 30_000
const notificationsCache = new Map<boolean, { fetchedAt: number; result: ReturnType<typeof fetchNotifications> }>()

function listNotifications(octokit: GitHubOctokit, all: boolean) {
  const now = Date.now()
  const cached = notificationsCache.get(all)

  if (cached && now - cached.fetchedAt < NOTIFICATIONS_TTL) {
    return cached.result
  }

  const result = fetchNotifications(octokit, all)
  notificationsCache.set(all, { fetchedAt: now, result })
  setTimeout(() => {
    if (notificationsCache.get(all)?.fetchedAt === now) {
      notificationsCache.delete(all)
    }
  }, NOTIFICATIONS_TTL).unref?.()

  return result
}

// Cap to a single page. These notifications feed unread-dot lookups for the
// current list/detail view, whose items are the user's most recent anyway, so
// the newest 100 always cover them. paginate here previously walked every page
// (dozens of serial round-trips for accounts with many stale unread threads)
// only to build a key set that old entries never match against.
async function fetchNotifications(octokit: GitHubOctokit, all: boolean) {
  const response = await octokit.rest.activity.listNotificationsForAuthenticatedUser({
    all,
    per_page: 100,
  })
  return response.data
}

function parseSubjectNumber(url: string | undefined): number | null {
  const match = url?.match(/\/(?:issues|pulls)\/(\d+)$/)
  if (!match) return null

  const value = Number(match[1])
  return Number.isFinite(value) ? value : null
}
