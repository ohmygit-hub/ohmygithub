import { createReferenceWorkspaceUrl } from '@/components/github/github-reference'
import {
  createAccountWorkspaceUrl,
  createCommitWorkspaceUrl,
  createRepositoryWorkspaceUrl,
} from '@/pages/workspace/workspace-url'

export type ActivityFilterKey = 'stars' | 'forks' | 'repos' | 'releases' | 'commits' | 'issuesAndPrs'

export const ACTIVITY_FILTER_KEYS: ActivityFilterKey[] = [
  'stars',
  'forks',
  'repos',
  'releases',
  'commits',
  'issuesAndPrs',
]

const FILTER_KINDS: Record<ActivityFilterKey, ReadonlySet<string>> = {
  stars: new Set(['star']),
  forks: new Set(['fork']),
  repos: new Set(['create', 'delete', 'public', 'member', 'wiki']),
  releases: new Set(['release']),
  commits: new Set(['push', 'commit-comment']),
  issuesAndPrs: new Set([
    'issue',
    'issue-comment',
    'pull-request',
    'pull-request-review',
    'pull-request-review-comment',
    'discussion',
  ]),
}

export function matchesActivityFilter(event: GitHubFeedEvent, filter: ActivityFilterKey | null): boolean {
  if (!filter) return true

  return FILTER_KINDS[filter].has(event.payload.kind)
}

export function mergeFeedEvents(pages: GitHubFeedEvent[][]): GitHubFeedEvent[] {
  const seen = new Set<string>()
  const merged: GitHubFeedEvent[] = []

  for (const page of pages) {
    for (const event of page) {
      if (seen.has(event.id)) continue

      seen.add(event.id)
      merged.push(event)
    }
  }

  return merged.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

export type ActivityGroupKind = 'single' | 'star' | 'fork' | 'push'

export interface ActivityFeedGroup {
  id: string
  kind: ActivityGroupKind
  actor: GitHubFeedEventActor
  createdAt: string
  events: GitHubFeedEvent[]
}

export function groupFeedEvents(events: GitHubFeedEvent[]): ActivityFeedGroup[] {
  const groups: ActivityFeedGroup[] = []
  let openKey: string | null = null

  for (const event of events) {
    const key = groupKeyForEvent(event)
    const lastGroup = groups[groups.length - 1]

    if (key && key === openKey && lastGroup) {
      lastGroup.events.push(event)
      continue
    }

    openKey = key
    groups.push({
      id: event.id,
      kind: key ? (event.payload.kind as Exclude<ActivityGroupKind, 'single'>) : 'single',
      actor: event.actor,
      createdAt: event.createdAt,
      events: [event],
    })
  }

  return groups.map((group) =>
    group.kind !== 'single' && group.events.length === 1 ? { ...group, kind: 'single' } : group,
  )
}

function groupKeyForEvent(event: GitHubFeedEvent): string | null {
  const { payload } = event

  if (payload.kind === 'star') return `star:${event.actor.login}`
  if (payload.kind === 'fork') return `fork:${event.actor.login}`
  if (payload.kind === 'push') return `push:${event.actor.login}:${event.repoFullName}:${payload.branch}`

  return null
}

export interface FeedSentencePart {
  label: string
  url: string | null
}

export type FeedEventCard =
  | { kind: 'repo'; repoFullName: string; url: string | null }
  | { kind: 'text'; title: string; excerpt: string | null; url: string | null }
  | { kind: 'commits'; messages: string[]; url: string | null }

export interface FeedEventPresentation {
  sentenceKey: string
  pluralCount: number | null
  parts: Record<string, FeedSentencePart>
  card: FeedEventCard | null
  targetUrl: string | null
}

// star/fork/建仓/开源事件的仓库卡需要 GraphQL 补拉的数据；收集每页涉及的仓库名
export function collectRepoCardNames(events: GitHubFeedEvent[]): string[] {
  const names = new Set<string>()

  for (const event of events) {
    const card = presentFeedEvent(event).card
    if (card?.kind === 'repo') names.add(card.repoFullName)
  }

  return [...names]
}

export interface ActivityPushCountRef {
  key: string
  repoFullName: string
  before: string
  head: string
}

export function buildPushCountKey(repoFullName: string, before: string, head: string): string {
  return `${repoFullName}@${before}...${head}`
}

function makePushCountRef(repoFullName: string, before: string, head: string): ActivityPushCountRef | null {
  if (!before || !head) return null
  return { key: buildPushCountKey(repoFullName, before, head), repoFullName, before, head }
}

export function pushCountRefForEvent(event: GitHubFeedEvent): ActivityPushCountRef | null {
  if (event.payload.kind !== 'push') return null
  return makePushCountRef(event.repoFullName, event.payload.beforeSha, event.payload.headSha)
}

export function pushCountRefForGroup(group: ActivityFeedGroup): ActivityPushCountRef | null {
  const newest = group.events[0]
  const oldest = group.events[group.events.length - 1]
  if (newest?.payload.kind !== 'push' || oldest?.payload.kind !== 'push') return null
  // Events are newest-first, so the compare range spans the oldest push's `before` to the
  // newest push's `head` — the group's whole pushed span in one call.
  return makePushCountRef(newest.repoFullName, oldest.payload.beforeSha, newest.payload.headSha)
}

// Collect the unique compare refs to enrich for the currently-grouped feed. Covers both
// single push rows and multi-push groups (a single is a group of one).
export function collectPushCountRefs(groups: ActivityFeedGroup[]): ActivityPushCountRef[] {
  const refs = new Map<string, ActivityPushCountRef>()
  for (const group of groups) {
    const ref = pushCountRefForGroup(group)
    if (ref) refs.set(ref.key, ref)
  }
  return [...refs.values()]
}

const SENTENCE_PREFIX = 'workspace.activity.sentences'

export function presentFeedEvent(
  event: GitHubFeedEvent,
  // Real commit count for a push, resolved via the compare API (GitHub no longer sends
  // it in the payload). `undefined` = not looked up (use the payload's own value if any);
  // `null` = looked up but unavailable → render the count-less sentence, never a fake 0.
  resolvedPushCount?: number | null,
): FeedEventPresentation {
  const { payload } = event
  const { owner, repo } = splitRepoFullName(event.repoFullName)
  const repoUrl = owner && repo ? createRepositoryWorkspaceUrl(owner, repo) : null
  const repoPart: FeedSentencePart = { label: event.repoFullName, url: repoUrl }
  const repoCard: FeedEventCard = { kind: 'repo', repoFullName: event.repoFullName, url: repoUrl }
  const base = { pluralCount: null, card: null }

  switch (payload.kind) {
    case 'star':
      return { ...base, sentenceKey: `${SENTENCE_PREFIX}.starred`, parts: { repo: repoPart }, card: repoCard, targetUrl: repoUrl }
    case 'fork': {
      const forkPart = payload.forkFullName
        ? { label: payload.forkFullName, url: repoUrlFor(payload.forkFullName) }
        : repoPart
      return {
        ...base,
        sentenceKey: `${SENTENCE_PREFIX}.forked`,
        parts: { repo: repoPart, fork: forkPart },
        card: { kind: 'repo', repoFullName: forkPart.label, url: forkPart.url },
        targetUrl: forkPart.url ?? repoUrl,
      }
    }
    case 'create': {
      if (payload.refType === 'repository') {
        return { ...base, sentenceKey: `${SENTENCE_PREFIX}.createdRepository`, parts: { repo: repoPart }, card: repoCard, targetUrl: repoUrl }
      }
      const branchesUrl = owner && repo ? createRepositoryWorkspaceUrl(owner, repo, 'branches') : null
      return {
        ...base,
        sentenceKey: payload.refType === 'tag' ? `${SENTENCE_PREFIX}.createdTag` : `${SENTENCE_PREFIX}.createdBranch`,
        parts: { repo: repoPart, ref: { label: payload.ref ?? '', url: null } },
        targetUrl: branchesUrl ?? repoUrl,
      }
    }
    case 'delete': {
      const branchesUrl = owner && repo ? createRepositoryWorkspaceUrl(owner, repo, 'branches') : null
      return {
        ...base,
        sentenceKey: payload.refType === 'tag' ? `${SENTENCE_PREFIX}.deletedTag` : `${SENTENCE_PREFIX}.deletedBranch`,
        parts: { repo: repoPart, ref: { label: payload.ref, url: null } },
        targetUrl: branchesUrl ?? repoUrl,
      }
    }
    case 'push': {
      const commitsUrl = owner && repo ? createRepositoryWorkspaceUrl(owner, repo, 'commits') : null
      const count = resolvedPushCount === undefined ? payload.commitCount : resolvedPushCount
      const branchPart: FeedSentencePart = { label: payload.branch, url: commitsUrl }
      const pushCard: FeedEventCard | null = payload.commitMessages.length
        ? { kind: 'commits', messages: payload.commitMessages, url: commitsUrl ?? repoUrl }
        : null
      if (count === null) {
        return {
          ...base,
          sentenceKey: `${SENTENCE_PREFIX}.pushedUnknown`,
          parts: { repo: repoPart, branch: branchPart },
          card: pushCard,
          targetUrl: commitsUrl ?? repoUrl,
        }
      }
      return {
        sentenceKey: `${SENTENCE_PREFIX}.pushed`,
        pluralCount: count,
        parts: {
          repo: repoPart,
          branch: branchPart,
          count: { label: String(count), url: null },
        },
        card: pushCard,
        targetUrl: commitsUrl ?? repoUrl,
      }
    }
    case 'release': {
      const releasesUrl = owner && repo ? createRepositoryWorkspaceUrl(owner, repo, 'releases') : null
      const releaseName = payload.releaseName?.trim() || ''
      const label = releaseName || payload.tagName
      return {
        ...base,
        sentenceKey: `${SENTENCE_PREFIX}.published`,
        parts: { repo: repoPart, release: { label, url: releasesUrl } },
        card: {
          kind: 'text',
          title: releaseName && releaseName !== payload.tagName
            ? `${payload.tagName} · ${releaseName}`
            : payload.tagName || releaseName,
          excerpt: payload.excerpt,
          url: releasesUrl ?? repoUrl,
        },
        targetUrl: releasesUrl ?? repoUrl,
      }
    }
    case 'public':
      return { ...base, sentenceKey: `${SENTENCE_PREFIX}.madePublic`, parts: { repo: repoPart }, card: repoCard, targetUrl: repoUrl }
    case 'member': {
      const memberPart: FeedSentencePart = payload.memberLogin
        ? { label: payload.memberLogin, url: createAccountWorkspaceUrl(payload.memberLogin) }
        : { label: '', url: null }
      return {
        ...base,
        sentenceKey: `${SENTENCE_PREFIX}.addedMember`,
        parts: { repo: repoPart, member: memberPart },
        targetUrl: repoUrl,
      }
    }
    case 'issue': {
      const url = referenceUrl(owner, repo, 'issue', payload.number)
      return {
        ...base,
        sentenceKey: issueSentenceKey(payload.action),
        parts: { target: targetPart(event.repoFullName, payload.number, url, repoUrl) },
        card: referenceCard(payload.number, payload.title, payload.excerpt, url ?? repoUrl),
        targetUrl: url ?? repoUrl,
      }
    }
    case 'issue-comment': {
      const kind = payload.isPullRequest ? 'pull-request' : 'issue'
      const url = referenceUrl(owner, repo, kind, payload.number)
      return {
        ...base,
        sentenceKey: payload.isPullRequest
          ? `${SENTENCE_PREFIX}.commentedPullRequest`
          : `${SENTENCE_PREFIX}.commentedIssue`,
        parts: { target: targetPart(event.repoFullName, payload.number, url, repoUrl) },
        card: referenceCard(payload.number, payload.title, payload.excerpt, url ?? repoUrl),
        targetUrl: url ?? repoUrl,
      }
    }
    case 'pull-request': {
      const url = referenceUrl(owner, repo, 'pull-request', payload.number)
      return {
        ...base,
        sentenceKey: pullRequestSentenceKey(payload.action, payload.merged),
        parts: { target: targetPart(event.repoFullName, payload.number, url, repoUrl) },
        card: referenceCard(payload.number, payload.title, payload.excerpt, url ?? repoUrl),
        targetUrl: url ?? repoUrl,
      }
    }
    case 'pull-request-review':
    case 'pull-request-review-comment': {
      const url = referenceUrl(owner, repo, 'pull-request', payload.number)
      return {
        ...base,
        sentenceKey: payload.kind === 'pull-request-review'
          ? `${SENTENCE_PREFIX}.reviewedPullRequest`
          : `${SENTENCE_PREFIX}.commentedPullRequest`,
        parts: { target: targetPart(event.repoFullName, payload.number, url, repoUrl) },
        card: referenceCard(payload.number, payload.title, payload.excerpt, url ?? repoUrl),
        targetUrl: url ?? repoUrl,
      }
    }
    case 'commit-comment': {
      const url = owner && repo && payload.commitSha
        ? createCommitWorkspaceUrl(owner, repo, payload.commitSha)
        : null
      const label = payload.commitSha ? `${event.repoFullName}@${payload.commitSha.slice(0, 7)}` : event.repoFullName
      return {
        ...base,
        sentenceKey: `${SENTENCE_PREFIX}.commentedCommit`,
        parts: { target: { label, url: url ?? repoUrl } },
        card: payload.excerpt ? { kind: 'text', title: label, excerpt: payload.excerpt, url: url ?? repoUrl } : null,
        targetUrl: url ?? repoUrl,
      }
    }
    case 'discussion':
      return {
        ...base,
        sentenceKey: `${SENTENCE_PREFIX}.startedDiscussion`,
        parts: { repo: repoPart },
        card: payload.title
          ? { kind: 'text', title: payload.title, excerpt: payload.excerpt, url: repoUrl }
          : null,
        targetUrl: repoUrl,
      }
    case 'wiki':
      return {
        sentenceKey: `${SENTENCE_PREFIX}.editedWiki`,
        pluralCount: payload.pageCount,
        parts: { repo: repoPart, count: { label: String(payload.pageCount), url: null } },
        card: null,
        targetUrl: repoUrl,
      }
    case 'sponsorship':
      return { ...base, sentenceKey: `${SENTENCE_PREFIX}.sponsored`, parts: { repo: repoPart }, targetUrl: repoUrl }
    default:
      return { ...base, sentenceKey: `${SENTENCE_PREFIX}.acted`, parts: { repo: repoPart }, targetUrl: repoUrl }
  }
}

export interface FeedGroupPresentation {
  sentenceKey: string
  pluralCount: number | null
  parts: Record<string, FeedSentencePart>
  card: FeedEventCard | null
  targetUrl: string | null
  expandable: boolean
  children: Array<{ id: string; part: FeedSentencePart; createdAt: string }>
}

export function presentFeedGroup(
  group: ActivityFeedGroup,
  // Aggregate commit count for the whole push group, resolved via one compare call over
  // the group's oldest→newest SHA range. Same semantics as presentFeedEvent's parameter.
  resolvedPushCount?: number | null,
): FeedGroupPresentation {
  if (group.kind === 'push') {
    const first = presentFeedEvent(group.events[0])
    const payloadTotal = group.events.reduce<number | null>((sum, event) => {
      if (event.payload.kind !== 'push' || typeof event.payload.commitCount !== 'number') return sum
      return (sum ?? 0) + event.payload.commitCount
    }, null)
    const total = resolvedPushCount === undefined ? payloadTotal : resolvedPushCount
    const messages = group.events
      .flatMap((event) => (event.payload.kind === 'push' ? event.payload.commitMessages : []))
      .slice(0, 5)
    const card: FeedEventCard | null = messages.length ? { kind: 'commits', messages, url: first.targetUrl } : null

    if (total === null) {
      return {
        sentenceKey: `${SENTENCE_PREFIX}.pushedUnknown`,
        pluralCount: null,
        parts: { repo: first.parts.repo, branch: first.parts.branch },
        card,
        targetUrl: first.targetUrl,
        expandable: false,
        children: [],
      }
    }

    return {
      sentenceKey: `${SENTENCE_PREFIX}.pushed`,
      pluralCount: total,
      parts: { repo: first.parts.repo, branch: first.parts.branch, count: { label: String(total), url: null } },
      card,
      targetUrl: first.targetUrl,
      expandable: false,
      children: [],
    }
  }

  return {
    sentenceKey: group.kind === 'fork' ? 'workspace.activity.groups.forked' : 'workspace.activity.groups.starred',
    pluralCount: null,
    parts: { count: { label: String(group.events.length), url: null } },
    card: null,
    targetUrl: null,
    expandable: true,
    children: group.events.map((event) => ({
      id: event.id,
      part: childPart(event),
      createdAt: event.createdAt,
    })),
  }
}

function childPart(event: GitHubFeedEvent): FeedSentencePart {
  if (event.payload.kind === 'fork' && event.payload.forkFullName) {
    return { label: event.payload.forkFullName, url: repoUrlFor(event.payload.forkFullName) }
  }

  return { label: event.repoFullName, url: repoUrlFor(event.repoFullName) }
}

function issueSentenceKey(action: string): string {
  if (action === 'opened') return `${SENTENCE_PREFIX}.openedIssue`
  if (action === 'closed') return `${SENTENCE_PREFIX}.closedIssue`
  if (action === 'reopened') return `${SENTENCE_PREFIX}.reopenedIssue`

  return `${SENTENCE_PREFIX}.updatedIssue`
}

function pullRequestSentenceKey(action: string, merged: boolean): string {
  if (action === 'closed' && merged) return `${SENTENCE_PREFIX}.mergedPullRequest`
  if (action === 'closed') return `${SENTENCE_PREFIX}.closedPullRequest`
  if (action === 'opened') return `${SENTENCE_PREFIX}.openedPullRequest`
  if (action === 'reopened') return `${SENTENCE_PREFIX}.reopenedPullRequest`

  return `${SENTENCE_PREFIX}.updatedPullRequest`
}

function targetPart(
  repoFullName: string,
  number: number | null,
  url: string | null,
  repoUrl: string | null,
): FeedSentencePart {
  return {
    label: number ? `${repoFullName}#${number}` : repoFullName,
    url: url ?? repoUrl,
  }
}

function referenceCard(
  number: number | null,
  title: string,
  excerpt: string | null,
  url: string | null,
): FeedEventCard | null {
  if (!title) return null

  return {
    kind: 'text',
    title: number ? `#${number} ${title}` : title,
    excerpt,
    url,
  }
}

function referenceUrl(
  owner: string,
  repo: string,
  kind: 'issue' | 'pull-request',
  number: number | null,
): string | null {
  if (!owner || !repo || !number || number <= 0) return null

  return createReferenceWorkspaceUrl(owner, repo, kind, number)
}

function repoUrlFor(fullName: string): string | null {
  const { owner, repo } = splitRepoFullName(fullName)
  return owner && repo ? createRepositoryWorkspaceUrl(owner, repo) : null
}

function splitRepoFullName(fullName: string): { owner: string; repo: string } {
  const [owner = '', repo = ''] = fullName.split('/')
  return { owner, repo }
}
