import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_FILTER_KEYS,
  collectPushCountRefs,
  collectRepoCardNames,
  groupFeedEvents,
  matchesActivityFilter,
  mergeFeedEvents,
  presentFeedEvent,
  presentFeedGroup,
  pushCountRefForGroup,
} from './activity-helpers'

let nextId = 1

function feedEvent(overrides: {
  payload: GitHubFeedEventPayload
  actorLogin?: string
  repoFullName?: string
  createdAt?: string
  id?: string
}): GitHubFeedEvent {
  return {
    id: overrides.id ?? String(nextId++),
    type: 'TestEvent',
    actor: { login: overrides.actorLogin ?? 'antfu', avatarUrl: null },
    repoFullName: overrides.repoFullName ?? 'vitejs/vite',
    createdAt: overrides.createdAt ?? '2026-07-04T10:00:00Z',
    payload: overrides.payload,
  }
}

const star = (login = 'antfu', repo = 'vitejs/vite', createdAt = '2026-07-04T10:00:00Z') =>
  feedEvent({ payload: { kind: 'star' }, actorLogin: login, repoFullName: repo, createdAt })

describe('mergeFeedEvents', () => {
  it('dedupes by id and sorts by createdAt desc', () => {
    const a = star('antfu', 'a/a', '2026-07-04T10:00:00Z')
    const b = star('posva', 'b/b', '2026-07-04T12:00:00Z')
    const merged = mergeFeedEvents([[a], [b, { ...a }]])

    expect(merged.map((event) => event.id)).toEqual([b.id, a.id])
  })
})

describe('groupFeedEvents', () => {
  it('groups adjacent stars by the same actor and downgrades singles', () => {
    const events = [star('antfu', 'a/a'), star('antfu', 'b/b'), star('posva', 'c/c')]
    const groups = groupFeedEvents(events)

    expect(groups).toHaveLength(2)
    expect(groups[0].kind).toBe('star')
    expect(groups[0].events).toHaveLength(2)
    expect(groups[1].kind).toBe('single')
  })

  it('does not group stars separated by another event', () => {
    const events = [
      star('antfu', 'a/a'),
      feedEvent({ payload: { kind: 'release', tagName: 'v1', releaseName: null, excerpt: null }, actorLogin: 'antfu' }),
      star('antfu', 'b/b'),
    ]
    expect(groupFeedEvents(events)).toHaveLength(3)
  })

  it('sums commit counts and merges commit messages for adjacent pushes', () => {
    const push = (count: number, messages: string[]) =>
      feedEvent({
        payload: { kind: 'push', branch: 'main', beforeSha: 'a1', headSha: 'b2', commitCount: count, commitMessages: messages },
        actorLogin: 'posva',
        repoFullName: 'vuejs/pinia',
      })
    const groups = groupFeedEvents([push(2, ['fix: a', 'feat: b']), push(3, ['chore: c'])])

    expect(groups).toHaveLength(1)
    expect(groups[0].kind).toBe('push')
    const presentation = presentFeedGroup(groups[0])
    expect(presentation.pluralCount).toBe(5)
    expect(presentation.card).toEqual({
      kind: 'commits',
      messages: ['fix: a', 'feat: b', 'chore: c'],
      url: '/vuejs/pinia?tab=commits',
    })
  })
})

describe('matchesActivityFilter', () => {
  it('maps each filter key to its payload kinds', () => {
    const releaseEvent = feedEvent({ payload: { kind: 'release', tagName: 'v1', releaseName: null, excerpt: null } })
    expect(matchesActivityFilter(releaseEvent, 'releases')).toBe(true)
    expect(matchesActivityFilter(releaseEvent, 'stars')).toBe(false)
    expect(matchesActivityFilter(releaseEvent, null)).toBe(true)
    expect(ACTIVITY_FILTER_KEYS).toHaveLength(6)
  })

  it('hides unknown events behind any active filter', () => {
    const unknown = feedEvent({ payload: { kind: 'unknown', type: 'X' } })
    expect(matchesActivityFilter(unknown, null)).toBe(true)
    expect(matchesActivityFilter(unknown, 'repos')).toBe(false)
  })
})

describe('presentFeedEvent', () => {
  it('presents a star with the repo as link, repo card and row target', () => {
    const presentation = presentFeedEvent(star())

    expect(presentation.sentenceKey).toBe('workspace.activity.sentences.starred')
    expect(presentation.parts.repo).toEqual({ label: 'vitejs/vite', url: '/vitejs/vite' })
    expect(presentation.card).toEqual({ kind: 'repo', repoFullName: 'vitejs/vite', url: '/vitejs/vite' })
    expect(presentation.targetUrl).toBe('/vitejs/vite')
  })

  it('uses the forkee for fork repo cards', () => {
    const event = feedEvent({ payload: { kind: 'fork', forkFullName: 'antfu/vite' } })
    expect(presentFeedEvent(event).card).toEqual({ kind: 'repo', repoFullName: 'antfu/vite', url: '/antfu/vite' })
  })

  it('targets the commits section for pushes with a commits card', () => {
    const event = feedEvent({
      payload: { kind: 'push', branch: 'main', beforeSha: 'a1', headSha: 'b2', commitCount: 3, commitMessages: ['fix: a'] },
    })
    const presentation = presentFeedEvent(event)

    expect(presentation.sentenceKey).toBe('workspace.activity.sentences.pushed')
    expect(presentation.pluralCount).toBe(3)
    expect(presentation.targetUrl).toBe('/vitejs/vite?tab=commits')
    expect(presentation.card).toEqual({ kind: 'commits', messages: ['fix: a'], url: '/vitejs/vite?tab=commits' })
  })

  it('omits the count for a push whose commit count is unknown', () => {
    const event = feedEvent({
      payload: { kind: 'push', branch: 'main', beforeSha: 'a1', headSha: 'b2', commitCount: null, commitMessages: [] },
    })
    const presentation = presentFeedEvent(event)

    expect(presentation.sentenceKey).toBe('workspace.activity.sentences.pushedUnknown')
    expect(presentation.pluralCount).toBeNull()
    expect(presentation.parts.count).toBeUndefined()
  })

  it('prefers the resolved compare count over the payload count', () => {
    const event = feedEvent({
      payload: { kind: 'push', branch: 'main', beforeSha: 'a1', headSha: 'b2', commitCount: null, commitMessages: [] },
    })
    const presentation = presentFeedEvent(event, 7)

    expect(presentation.sentenceKey).toBe('workspace.activity.sentences.pushed')
    expect(presentation.pluralCount).toBe(7)
    expect(presentation.parts.count.label).toBe('7')
  })

  it('links merged pull requests to the PR tab with a text card', () => {
    const event = feedEvent({
      payload: { kind: 'pull-request', action: 'closed', number: 9, title: 'Add feed', merged: true, excerpt: 'Adds the feed.' },
    })
    const presentation = presentFeedEvent(event)

    expect(presentation.sentenceKey).toBe('workspace.activity.sentences.mergedPullRequest')
    expect(presentation.parts.target.url).toBe('/vitejs/vite/pull/9')
    expect(presentation.card).toEqual({
      kind: 'text',
      title: '#9 Add feed',
      excerpt: 'Adds the feed.',
      url: '/vitejs/vite/pull/9',
    })
  })

  it('builds release cards from tag, name and notes excerpt', () => {
    const event = feedEvent({
      payload: { kind: 'release', tagName: 'v3.2.0', releaseName: 'vitest v3.2.0', excerpt: 'Highlights' },
    })
    expect(presentFeedEvent(event).card).toEqual({
      kind: 'text',
      title: 'v3.2.0 · vitest v3.2.0',
      excerpt: 'Highlights',
      url: '/vitejs/vite?tab=releases',
    })
  })

  it('routes PR comments to the pull request even for issue-comment payloads', () => {
    const event = feedEvent({
      payload: { kind: 'issue-comment', number: 7, title: 'Fix', isPullRequest: true, excerpt: null },
    })
    const presentation = presentFeedEvent(event)

    expect(presentation.sentenceKey).toBe('workspace.activity.sentences.commentedPullRequest')
    expect(presentation.parts.target.url).toBe('/vitejs/vite/pull/7')
  })

  it('falls back to the repo without a card for unknown events', () => {
    const presentation = presentFeedEvent(feedEvent({ payload: { kind: 'unknown', type: 'X' } }))
    expect(presentation.sentenceKey).toBe('workspace.activity.sentences.acted')
    expect(presentation.targetUrl).toBe('/vitejs/vite')
    expect(presentation.card).toBeNull()
  })
})

describe('collectRepoCardNames', () => {
  it('collects repo names only from repo-card events, deduped', () => {
    const events = [
      star('antfu', 'a/a'),
      star('posva', 'a/a'),
      feedEvent({ payload: { kind: 'fork', forkFullName: 'antfu/vite' } }),
      feedEvent({ payload: { kind: 'push', branch: 'main', beforeSha: 'a1', headSha: 'b2', commitCount: 1, commitMessages: [] } }),
    ]
    expect(collectRepoCardNames(events).sort()).toEqual(['a/a', 'antfu/vite'])
  })
})

describe('presentFeedGroup', () => {
  it('presents star groups as expandable with repo children', () => {
    const groups = groupFeedEvents([star('antfu', 'a/a'), star('antfu', 'b/b')])
    const presentation = presentFeedGroup(groups[0])

    expect(presentation.sentenceKey).toBe('workspace.activity.groups.starred')
    expect(presentation.expandable).toBe(true)
    expect(presentation.parts.count.label).toBe('2')
    expect(presentation.children.map((child) => child.part.label)).toEqual(['a/a', 'b/b'])
    expect(presentation.children[0].part.url).toBe('/a/a')
  })

  it('uses the resolved compare total for a push group', () => {
    const push = (before: string, head: string) =>
      feedEvent({
        payload: { kind: 'push', branch: 'main', beforeSha: before, headSha: head, commitCount: null, commitMessages: [] },
        actorLogin: 'posva',
        repoFullName: 'vuejs/pinia',
      })
    const groups = groupFeedEvents([push('c3', 'd4'), push('a1', 'c3')])

    expect(presentFeedGroup(groups[0]).sentenceKey).toBe('workspace.activity.sentences.pushedUnknown')
    expect(presentFeedGroup(groups[0], 9).pluralCount).toBe(9)
  })
})

describe('push count refs', () => {
  it('spans the oldest before SHA to the newest head SHA of a group', () => {
    const push = (before: string, head: string) =>
      feedEvent({
        payload: { kind: 'push', branch: 'main', beforeSha: before, headSha: head, commitCount: null, commitMessages: [] },
        actorLogin: 'posva',
        repoFullName: 'vuejs/pinia',
      })
    // Newest-first ordering: the group's compare range is oldest.before...newest.head.
    const groups = groupFeedEvents([push('c3', 'd4'), push('a1', 'c3')])
    const ref = pushCountRefForGroup(groups[0])

    expect(ref).toEqual({ key: 'vuejs/pinia@a1...d4', repoFullName: 'vuejs/pinia', before: 'a1', head: 'd4' })
    expect(collectPushCountRefs(groups).map((entry) => entry.key)).toEqual(['vuejs/pinia@a1...d4'])
  })
})
