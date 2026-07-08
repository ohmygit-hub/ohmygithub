import { describe, expect, it, vi } from 'vitest'
import type { GitHubOctokit } from '../transport'
import { ActivityApi, buildRepoCardsQuery, normalizeFeedEvent } from './activity'

function createApi(events: unknown[], linkHeader?: string) {
  const listReceivedEventsForUser = vi.fn().mockResolvedValue({
    data: events,
    headers: linkHeader ? { link: linkHeader } : {},
  })
  const api = new ActivityApi({
    rest: { activity: { listReceivedEventsForUser } },
  } as unknown as GitHubOctokit)

  return { api, listReceivedEventsForUser }
}

const NEXT_LINK = '<https://api.github.com/user/1/received_events?page=2>; rel="next"'

function rawEvent(type: string, payload: Record<string, unknown>) {
  return {
    id: '1000',
    type,
    actor: { login: 'antfu', avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4' },
    repo: { name: 'vitejs/vite' },
    payload,
    created_at: '2026-07-04T10:00:00Z',
  }
}

describe('ActivityApi.listReceivedEvents', () => {
  it('passes username, per_page and page to octokit', async () => {
    const { api, listReceivedEventsForUser } = createApi([])
    await api.listReceivedEvents({ username: 'acbox', page: 2, perPage: 50 })

    expect(listReceivedEventsForUser).toHaveBeenCalledWith({
      username: 'acbox',
      per_page: 50,
      page: 2,
    })
  })

  it('defaults to page 1 with per_page 100', async () => {
    const { api, listReceivedEventsForUser } = createApi([])
    await api.listReceivedEvents({ username: 'acbox' })

    expect(listReceivedEventsForUser).toHaveBeenCalledWith({
      username: 'acbox',
      per_page: 100,
      page: 1,
    })
  })

  it('reports hasMore from the Link header rel="next"', async () => {
    const withNext = createApi([], NEXT_LINK)
    expect((await withNext.api.listReceivedEvents({ username: 'acbox' })).hasMore).toBe(true)

    const withoutNext = createApi([])
    expect((await withoutNext.api.listReceivedEvents({ username: 'acbox' })).hasMore).toBe(false)
  })

  it('caps hasMore at page 3 (API hard limit of 300 events)', async () => {
    const { api } = createApi([], NEXT_LINK)
    expect((await api.listReceivedEvents({ username: 'acbox', page: 3 })).hasMore).toBe(false)
  })
})

describe('ActivityApi.getPushCommitCounts', () => {
  function createCompareApi(totalByBasehead: Record<string, number | null | Error>) {
    const compareCommitsWithBasehead = vi.fn(async ({ basehead }: { basehead: string }) => {
      const value = totalByBasehead[basehead]
      if (value instanceof Error) throw value
      return { data: { total_commits: value } }
    })
    const api = new ActivityApi({
      rest: { repos: { compareCommitsWithBasehead } },
    } as unknown as GitHubOctokit)

    return { api, compareCommitsWithBasehead }
  }

  it('resolves the commit count per push ref via compare', async () => {
    const { api, compareCommitsWithBasehead } = createCompareApi({ 'a1...b2': 4 })
    const result = await api.getPushCommitCounts([
      { key: 'vuejs/pinia@a1...b2', repoFullName: 'vuejs/pinia', before: 'a1', head: 'b2' },
    ])

    expect(result).toEqual({ 'vuejs/pinia@a1...b2': 4 })
    expect(compareCommitsWithBasehead).toHaveBeenCalledWith({
      owner: 'vuejs',
      repo: 'pinia',
      basehead: 'a1...b2',
      per_page: 1,
    })
  })

  it('marks new-branch pushes (zero base SHA) unknown without calling compare', async () => {
    const { api, compareCommitsWithBasehead } = createCompareApi({})
    const result = await api.getPushCommitCounts([
      { key: 'k', repoFullName: 'vuejs/pinia', before: '0000000000000000000000000000000000000000', head: 'b2' },
    ])

    expect(result).toEqual({ k: null })
    expect(compareCommitsWithBasehead).not.toHaveBeenCalled()
  })

  it('degrades a failed compare to an unknown count', async () => {
    const { api } = createCompareApi({ 'a1...b2': new Error('422 Unprocessable') })
    const result = await api.getPushCommitCounts([
      { key: 'k', repoFullName: 'vuejs/pinia', before: 'a1', head: 'b2' },
    ])

    expect(result).toEqual({ k: null })
  })
})

describe('normalizeFeedEvent', () => {
  it('normalizes a WatchEvent into a star payload', () => {
    expect(normalizeFeedEvent(rawEvent('WatchEvent', { action: 'started' }))).toEqual({
      id: '1000',
      type: 'WatchEvent',
      actor: { login: 'antfu', avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4' },
      repoFullName: 'vitejs/vite',
      createdAt: '2026-07-04T10:00:00Z',
      payload: { kind: 'star' },
    })
  })

  it('keeps the forkee full name for ForkEvent', () => {
    const event = normalizeFeedEvent(rawEvent('ForkEvent', { forkee: { full_name: 'antfu/vite' } }))
    expect(event.payload).toEqual({ kind: 'fork', forkFullName: 'antfu/vite' })
  })

  it('strips refs/heads/ from PushEvent and keeps first-line commit messages', () => {
    const event = normalizeFeedEvent(rawEvent('PushEvent', {
      ref: 'refs/heads/main',
      before: 'aaa111',
      head: 'bbb222',
      size: 3,
      commits: [
        { message: 'fix: cache invalidation\n\ndetails here' },
        { message: 'feat: add devtools hook' },
      ],
    }))
    expect(event.payload).toEqual({
      kind: 'push',
      branch: 'main',
      beforeSha: 'aaa111',
      headSha: 'bbb222',
      commitCount: 3,
      commitMessages: ['fix: cache invalidation', 'feat: add devtools hook'],
    })
  })

  it('leaves commitCount null when the reduced PushEvent payload omits size and commits', () => {
    const event = normalizeFeedEvent(rawEvent('PushEvent', {
      ref: 'refs/heads/main',
      before: 'aaa111',
      head: 'bbb222',
    }))
    expect(event.payload).toEqual({
      kind: 'push',
      branch: 'main',
      beforeSha: 'aaa111',
      headSha: 'bbb222',
      commitCount: null,
      commitMessages: [],
    })
  })

  it('normalizes CreateEvent branch and repository variants', () => {
    expect(normalizeFeedEvent(rawEvent('CreateEvent', { ref_type: 'branch', ref: 'feat/x' })).payload)
      .toEqual({ kind: 'create', refType: 'branch', ref: 'feat/x' })
    expect(normalizeFeedEvent(rawEvent('CreateEvent', { ref_type: 'repository', ref: null })).payload)
      .toEqual({ kind: 'create', refType: 'repository', ref: null })
  })

  it('normalizes ReleaseEvent tag, name and notes excerpt', () => {
    const event = normalizeFeedEvent(rawEvent('ReleaseEvent', {
      release: { tag_name: 'v3.2.0', name: 'vitest v3.2.0', body: 'Highlights\n\n- faster runs' },
    }))
    expect(event.payload).toEqual({
      kind: 'release',
      tagName: 'v3.2.0',
      releaseName: 'vitest v3.2.0',
      excerpt: 'Highlights\n- faster runs',
    })
  })

  it('truncates long excerpts to 280 characters', () => {
    const event = normalizeFeedEvent(rawEvent('ReleaseEvent', {
      release: { tag_name: 'v1', name: null, body: 'x'.repeat(500) },
    }))
    const payload = event.payload as { excerpt: string }
    expect(payload.excerpt).toHaveLength(281)
    expect(payload.excerpt.endsWith('…')).toBe(true)
  })

  it('flags IssueCommentEvent on pull requests with the comment excerpt', () => {
    const event = normalizeFeedEvent(rawEvent('IssueCommentEvent', {
      issue: { number: 7, title: 'Fix bug', pull_request: { url: 'x' } },
      comment: { body: 'LGTM with one nit' },
    }))
    expect(event.payload).toEqual({
      kind: 'issue-comment',
      number: 7,
      title: 'Fix bug',
      isPullRequest: true,
      excerpt: 'LGTM with one nit',
    })
  })

  it('keeps merged flag and body excerpt for closed PullRequestEvent', () => {
    const event = normalizeFeedEvent(rawEvent('PullRequestEvent', {
      action: 'closed',
      pull_request: { number: 9, title: 'Add feed', merged: true, body: 'Adds the feed page.' },
    }))
    expect(event.payload).toEqual({
      kind: 'pull-request',
      action: 'closed',
      number: 9,
      title: 'Add feed',
      merged: true,
      excerpt: 'Adds the feed page.',
    })
  })

  it('falls back to unknown payloads for unrecognized event types', () => {
    const event = normalizeFeedEvent(rawEvent('SomeNewEvent', {}))
    expect(event.payload).toEqual({ kind: 'unknown', type: 'SomeNewEvent' })
  })
})

describe('ActivityApi.getRepositoryCards', () => {
  function createGraphqlApi(response: Record<string, unknown> | (() => Promise<never>)) {
    const graphql = typeof response === 'function'
      ? vi.fn().mockImplementation(response)
      : vi.fn().mockResolvedValue(response)
    const api = new ActivityApi({ graphql } as unknown as GitHubOctokit)
    return { api, graphql }
  }

  it('maps aliased GraphQL nodes back to repo full names', async () => {
    const { api, graphql } = createGraphqlApi({
      repo0: {
        nameWithOwner: 'rust-lang/rust',
        description: 'Empowering everyone',
        stargazerCount: 98200,
        primaryLanguage: { name: 'Rust', color: '#dea584' },
      },
      repo1: null,
    })

    const cards = await api.getRepositoryCards(['rust-lang/rust', 'gone/repo'])

    expect(graphql).toHaveBeenCalledTimes(1)
    expect(cards['rust-lang/rust']).toEqual({
      fullName: 'rust-lang/rust',
      description: 'Empowering everyone',
      stars: 98200,
      language: 'Rust',
      languageColor: '#dea584',
    })
    expect(cards['gone/repo']).toBeNull()
  })

  it('recovers partial data when GraphQL reports errors for missing repos', async () => {
    const { api } = createGraphqlApi(() =>
      Promise.reject(Object.assign(new Error('partial'), {
        data: { repo0: { nameWithOwner: 'a/a', stargazerCount: 1, primaryLanguage: null }, repo1: null },
      })),
    )

    const cards = await api.getRepositoryCards(['a/a', 'b/b'])

    expect(cards['a/a']).toEqual({
      fullName: 'a/a',
      description: null,
      stars: 1,
      language: null,
      languageColor: null,
    })
    expect(cards['b/b']).toBeNull()
  })

  it('skips invalid full names and dedupes input', async () => {
    const { api, graphql } = createGraphqlApi({ repo0: null })
    await api.getRepositoryCards(['a/a', 'a/a', 'bad"name/x y'])

    expect(graphql).toHaveBeenCalledTimes(1)
    expect(graphql.mock.calls[0][0]).toContain('repo0: repository(owner: "a", name: "a")')
    expect(graphql.mock.calls[0][0]).not.toContain('bad')
  })
})

describe('buildRepoCardsQuery', () => {
  it('builds one aliased field per repo', () => {
    const query = buildRepoCardsQuery(['vitejs/vite', 'vuejs/core'])
    expect(query).toContain('repo0: repository(owner: "vitejs", name: "vite")')
    expect(query).toContain('repo1: repository(owner: "vuejs", name: "core")')
  })
})
