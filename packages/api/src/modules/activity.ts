import type { GitHubOctokit } from '../transport'

export interface ListReceivedEventsOptions {
  username: string
  page?: number
  perPage?: number
}

export interface GitHubFeedEventActor {
  login: string
  avatarUrl: string | null
}

export type GitHubFeedEventPayload =
  | { kind: 'star' }
  | { kind: 'fork'; forkFullName: string | null }
  | { kind: 'create'; refType: 'repository' | 'branch' | 'tag'; ref: string | null }
  | { kind: 'delete'; refType: 'branch' | 'tag'; ref: string }
  | { kind: 'push'; branch: string; beforeSha: string; headSha: string; commitCount: number | null; commitMessages: string[] }
  | { kind: 'release'; tagName: string; releaseName: string | null; excerpt: string | null }
  | { kind: 'public' }
  | { kind: 'member'; memberLogin: string | null }
  | { kind: 'issue'; action: string; number: number; title: string; excerpt: string | null }
  | { kind: 'issue-comment'; number: number | null; title: string; isPullRequest: boolean; excerpt: string | null }
  | { kind: 'pull-request'; action: string; number: number; title: string; merged: boolean; excerpt: string | null }
  | { kind: 'pull-request-review'; number: number | null; title: string; excerpt: string | null }
  | { kind: 'pull-request-review-comment'; number: number | null; title: string; excerpt: string | null }
  | { kind: 'commit-comment'; commitSha: string | null; excerpt: string | null }
  | { kind: 'discussion'; title: string | null; excerpt: string | null }
  | { kind: 'wiki'; pageCount: number }
  | { kind: 'sponsorship' }
  | { kind: 'unknown'; type: string }

export interface GitHubFeedEvent {
  id: string
  type: string
  actor: GitHubFeedEventActor
  repoFullName: string
  createdAt: string
  payload: GitHubFeedEventPayload
}

export interface GitHubFeedEventPage {
  events: GitHubFeedEvent[]
  page: number
  hasMore: boolean
}

export interface GitHubFeedRepoCard {
  fullName: string
  description: string | null
  stars: number
  language: string | null
  languageColor: string | null
}

// received_events 上限 300 条（30 天），per_page=100 时最多 3 页
const MAX_FEED_PAGE = 3

interface RawFeedEvent {
  id: string
  type: string | null
  actor: { login: string; avatar_url?: string | null }
  repo: { name: string }
  payload: Record<string, any> | null
  created_at: string | null
}

export class ActivityApi {
  constructor(private readonly octokit: GitHubOctokit) {}

  async listReceivedEvents(options: ListReceivedEventsOptions): Promise<GitHubFeedEventPage> {
    const page = options.page ?? 1
    const perPage = options.perPage ?? 100
    const response = await this.octokit.rest.activity.listReceivedEventsForUser({
      username: options.username,
      per_page: perPage,
      page,
    })

    return {
      events: (response.data as unknown as RawFeedEvent[]).map(normalizeFeedEvent),
      page,
      hasMore: hasNextPage(response.headers.link) && page < MAX_FEED_PAGE,
    }
  }

  async getRepositoryCards(fullNames: string[]): Promise<Record<string, GitHubFeedRepoCard | null>> {
    const result: Record<string, GitHubFeedRepoCard | null> = {}
    const valid = [...new Set(fullNames)].filter(isValidRepoFullName)

    for (let start = 0; start < valid.length; start += REPO_CARDS_CHUNK_SIZE) {
      const chunk = valid.slice(start, start + REPO_CARDS_CHUNK_SIZE)
      const data = await this.fetchRepoCardsChunk(chunk)

      chunk.forEach((fullName, index) => {
        const node = data[`repo${index}`]
        result[fullName] = node
          ? {
              fullName: node.nameWithOwner,
              description: node.description ?? null,
              stars: node.stargazerCount,
              language: node.primaryLanguage?.name ?? null,
              languageColor: node.primaryLanguage?.color ?? null,
            }
          : null
      })
    }

    return result
  }

  private async fetchRepoCardsChunk(chunk: string[]): Promise<Record<string, RawRepoCardNode | null>> {
    try {
      return await this.octokit.graphql<Record<string, RawRepoCardNode | null>>(buildRepoCardsQuery(chunk))
    } catch (error) {
      // 部分仓库被删/转私有时 GraphQL 抛部分错误，但 data 里仍带可用节点
      const partial = (error as { data?: Record<string, RawRepoCardNode | null> }).data
      if (partial) return partial
      throw error
    }
  }

  // GitHub no longer ships commit counts inside PushEvent payloads (only before/head
  // SHAs). Recover the real count per push via the compare endpoint, keyed by a
  // caller-supplied `key` so the renderer owns the cache identity. Runs as progressive
  // enhancement: concurrency-limited, and any push we can't compare stays `null`.
  async getPushCommitCounts(refs: PushCommitCountRef[]): Promise<Record<string, number | null>> {
    const result: Record<string, number | null> = {}
    const pending: PushCommitCountRef[] = []

    for (const ref of refs) {
      if (isEnrichablePushRef(ref)) {
        pending.push(ref)
      } else {
        // New-branch pushes (before = zero SHA) and malformed refs have no comparable
        // base — leave the count unknown rather than guessing.
        result[ref.key] = null
      }
    }

    let cursor = 0
    const workerCount = Math.min(PUSH_COUNT_CONCURRENCY, pending.length)
    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (cursor < pending.length) {
          const ref = pending[cursor++]
          result[ref.key] = await this.fetchPushCommitCount(ref)
        }
      }),
    )

    return result
  }

  private async fetchPushCommitCount(ref: PushCommitCountRef): Promise<number | null> {
    const [owner, repo] = ref.repoFullName.split('/')
    try {
      const response = await this.octokit.rest.repos.compareCommitsWithBasehead({
        owner,
        repo,
        basehead: `${ref.before}...${ref.head}`,
        per_page: 1,
      })
      return typeof response.data.total_commits === 'number' ? response.data.total_commits : null
    } catch {
      // Force-push / rewritten or deleted history / lost access: count stays unknown.
      return null
    }
  }
}

export interface PushCommitCountRef {
  key: string
  repoFullName: string
  before: string
  head: string
}

const PUSH_COUNT_CONCURRENCY = 8
const ZERO_SHA = '0000000000000000000000000000000000000000'

function isEnrichablePushRef(ref: PushCommitCountRef): boolean {
  return (
    isValidRepoFullName(ref.repoFullName)
    && ref.before.length > 0
    && ref.head.length > 0
    && ref.before !== ZERO_SHA
  )
}

const REPO_CARDS_CHUNK_SIZE = 50

interface RawRepoCardNode {
  nameWithOwner: string
  description?: string | null
  stargazerCount: number
  primaryLanguage?: { name: string; color?: string | null } | null
}

export function isValidRepoFullName(fullName: string): boolean {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(fullName)
}

export function buildRepoCardsQuery(fullNames: string[]): string {
  const fields = fullNames.map((fullName, index) => {
    const [owner, name] = fullName.split('/')
    return `  repo${index}: repository(owner: "${owner}", name: "${name}") { nameWithOwner description stargazerCount primaryLanguage { name color } }`
  })

  return `query {\n${fields.join('\n')}\n}`
}

export function normalizeFeedEvent(raw: RawFeedEvent): GitHubFeedEvent {
  return {
    id: raw.id,
    type: raw.type ?? 'UnknownEvent',
    actor: {
      login: raw.actor.login,
      avatarUrl: raw.actor.avatar_url ?? null,
    },
    repoFullName: raw.repo.name,
    createdAt: raw.created_at ?? '',
    payload: normalizeFeedEventPayload(raw.type, raw.payload ?? {}),
  }
}

function normalizeFeedEventPayload(
  type: string | null,
  payload: Record<string, any>,
): GitHubFeedEventPayload {
  switch (type) {
    case 'WatchEvent':
      return { kind: 'star' }
    case 'ForkEvent':
      return { kind: 'fork', forkFullName: payload.forkee?.full_name ?? null }
    case 'CreateEvent': {
      const refType = payload.ref_type === 'branch' || payload.ref_type === 'tag'
        ? payload.ref_type
        : 'repository'
      return { kind: 'create', refType, ref: payload.ref ?? null }
    }
    case 'DeleteEvent':
      return {
        kind: 'delete',
        refType: payload.ref_type === 'tag' ? 'tag' : 'branch',
        ref: String(payload.ref ?? ''),
      }
    case 'PushEvent':
      return {
        kind: 'push',
        branch: String(payload.ref ?? '').replace(/^refs\/heads\//, ''),
        beforeSha: String(payload.before ?? ''),
        headSha: String(payload.head ?? ''),
        // GitHub reduced the PushEvent payload: `size`/`distinct_size`/`commits` are no
        // longer sent, so the count is unknown here. `null` signals "resolve it later"
        // (via getPushCommitCounts) rather than a fake `0`; keep reading `size` for the
        // rare payloads / future restores that still carry it.
        commitCount: typeof payload.size === 'number'
          ? payload.size
          : (Array.isArray(payload.commits) && payload.commits.length > 0 ? payload.commits.length : null),
        commitMessages: (Array.isArray(payload.commits) ? payload.commits : [])
          .slice(0, MAX_COMMIT_MESSAGES)
          .map((commit: { message?: string | null }) => firstLine(commit.message))
          .filter((message: string) => message.length > 0),
      }
    case 'ReleaseEvent':
      return {
        kind: 'release',
        tagName: String(payload.release?.tag_name ?? ''),
        releaseName: payload.release?.name ?? null,
        excerpt: truncateExcerpt(payload.release?.body),
      }
    case 'PublicEvent':
      return { kind: 'public' }
    case 'MemberEvent':
      return { kind: 'member', memberLogin: payload.member?.login ?? null }
    case 'IssuesEvent':
      return {
        kind: 'issue',
        action: String(payload.action ?? ''),
        number: Number(payload.issue?.number ?? 0),
        title: String(payload.issue?.title ?? ''),
        excerpt: truncateExcerpt(payload.issue?.body),
      }
    case 'IssueCommentEvent':
      return {
        kind: 'issue-comment',
        number: payload.issue?.number ?? null,
        title: String(payload.issue?.title ?? ''),
        isPullRequest: Boolean(payload.issue?.pull_request),
        excerpt: truncateExcerpt(payload.comment?.body),
      }
    case 'PullRequestEvent':
      return {
        kind: 'pull-request',
        action: String(payload.action ?? ''),
        number: Number(payload.pull_request?.number ?? payload.number ?? 0),
        title: String(payload.pull_request?.title ?? ''),
        merged: Boolean(payload.pull_request?.merged),
        excerpt: truncateExcerpt(payload.pull_request?.body),
      }
    case 'PullRequestReviewEvent':
      return {
        kind: 'pull-request-review',
        number: payload.pull_request?.number ?? null,
        title: String(payload.pull_request?.title ?? ''),
        excerpt: truncateExcerpt(payload.review?.body),
      }
    case 'PullRequestReviewCommentEvent':
      return {
        kind: 'pull-request-review-comment',
        number: payload.pull_request?.number ?? null,
        title: String(payload.pull_request?.title ?? ''),
        excerpt: truncateExcerpt(payload.comment?.body),
      }
    case 'CommitCommentEvent':
      return {
        kind: 'commit-comment',
        commitSha: payload.comment?.commit_id ?? null,
        excerpt: truncateExcerpt(payload.comment?.body),
      }
    case 'DiscussionEvent':
      return {
        kind: 'discussion',
        title: payload.discussion?.title ?? null,
        excerpt: truncateExcerpt(payload.discussion?.body),
      }
    case 'GollumEvent':
      return { kind: 'wiki', pageCount: Array.isArray(payload.pages) ? payload.pages.length : 0 }
    case 'SponsorshipEvent':
      return { kind: 'sponsorship' }
    default:
      return { kind: 'unknown', type: type ?? 'UnknownEvent' }
  }
}

function hasNextPage(link: string | undefined): boolean {
  return Boolean(link?.includes('rel="next"'))
}

const MAX_COMMIT_MESSAGES = 5
const MAX_EXCERPT_LENGTH = 280

// 卡片摘要在 API 层裁剪，避免整段 markdown 正文走 IPC
function truncateExcerpt(text: unknown): string | null {
  if (typeof text !== 'string') return null

  const collapsed = text.replace(/\r/g, '').replace(/\n{2,}/g, '\n').trim()
  if (!collapsed) return null

  return collapsed.length > MAX_EXCERPT_LENGTH ? `${collapsed.slice(0, MAX_EXCERPT_LENGTH)}…` : collapsed
}

function firstLine(text: unknown): string {
  if (typeof text !== 'string') return ''

  return text.split('\n', 1)[0].trim()
}
