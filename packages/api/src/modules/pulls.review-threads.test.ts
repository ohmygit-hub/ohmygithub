import { describe, expect, it, vi } from 'vitest'
import type { GitHubOctokit } from '../transport'
import { PullsApi } from './pulls'

describe('PullsApi review threads', () => {
  it('lists review threads with the viewer pending review', async () => {
    const graphql = vi.fn().mockResolvedValue({
      repository: {
        pullRequest: {
          reviewThreads: {
            nodes: [
              {
                id: 'PRRT_1',
                isResolved: false,
                isOutdated: false,
                path: 'src/index.ts',
                line: 12,
                startLine: 10,
                diffSide: 'RIGHT',
                startDiffSide: 'RIGHT',
                viewerCanResolve: true,
                viewerCanUnresolve: false,
                viewerCanReply: true,
                comments: {
                  nodes: [
                    {
                      id: 'PRRC_1',
                      databaseId: 555,
                      body: 'Watch this loop',
                      createdAt: '2026-07-01T00:00:00Z',
                      updatedAt: '2026-07-01T00:00:00Z',
                      url: 'https://github.com/octo-org/hello-world/pull/24#discussion_r555',
                      path: 'src/index.ts',
                      diffHunk: '@@ -1 +1 @@',
                      line: 12,
                      originalLine: 12,
                      startLine: 10,
                      outdated: false,
                      state: 'SUBMITTED',
                      replyTo: null,
                      author: { login: 'octocat', avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4' },
                    },
                  ],
                },
              },
            ],
          },
          reviews: { nodes: [{ id: 'PRR_9', body: '', comments: { totalCount: 2 } }] },
        },
      },
    })
    const api = new PullsApi({ graphql } as unknown as GitHubOctokit)

    const result = await api.listPullRequestReviewThreads({
      owner: 'octo-org',
      repo: 'hello-world',
      number: 24,
    })

    expect(graphql).toHaveBeenCalledWith(expect.stringContaining('reviewThreads'), {
      owner: 'octo-org',
      repo: 'hello-world',
      number: 24,
    })
    expect(result.pendingReview).toEqual({ id: 'PRR_9', body: '', commentCount: 2 })
    expect(result.threads).toHaveLength(1)
    expect(result.threads[0]).toMatchObject({
      id: 'PRRT_1',
      path: 'src/index.ts',
      line: 12,
      startLine: 10,
      side: 'RIGHT',
      startSide: 'RIGHT',
      isResolved: false,
      isOutdated: false,
      isPending: false,
      viewerCanResolve: true,
      viewerCanUnresolve: false,
      viewerCanReply: true,
    })
    expect(result.threads[0]?.comments[0]).toMatchObject({
      nodeId: 'PRRC_1',
      databaseId: 555,
      body: 'Watch this loop',
    })
  })

  it('marks threads with pending comments and defaults missing fields', async () => {
    const graphql = vi.fn().mockResolvedValue({
      repository: {
        pullRequest: {
          reviewThreads: {
            nodes: [
              {
                id: 'PRRT_2',
                isResolved: true,
                isOutdated: true,
                path: 'README.md',
                line: null,
                startLine: null,
                diffSide: 'LEFT',
                startDiffSide: null,
                viewerCanResolve: false,
                viewerCanUnresolve: true,
                viewerCanReply: true,
                comments: {
                  nodes: [
                    {
                      id: 'PRRC_2',
                      databaseId: null,
                      body: 'pending note',
                      createdAt: '2026-07-01T00:00:00Z',
                      updatedAt: '2026-07-01T00:00:00Z',
                      url: null,
                      path: 'README.md',
                      diffHunk: null,
                      line: null,
                      originalLine: 3,
                      startLine: null,
                      outdated: true,
                      state: 'PENDING',
                      replyTo: null,
                      author: { login: 'acbox', avatarUrl: null },
                    },
                  ],
                },
              },
              null,
            ],
          },
          reviews: { nodes: [] },
        },
      },
    })
    const api = new PullsApi({ graphql } as unknown as GitHubOctokit)

    const result = await api.listPullRequestReviewThreads({
      owner: 'octo-org',
      repo: 'hello-world',
      number: 24,
    })

    expect(result.pendingReview).toBeNull()
    expect(result.threads).toHaveLength(1)
    expect(result.threads[0]).toMatchObject({
      id: 'PRRT_2',
      side: 'LEFT',
      startSide: null,
      line: null,
      isPending: true,
      isOutdated: true,
    })
    expect(result.threads[0]?.comments[0]?.databaseId).toBeNull()
  })

  it('throws when the pull request is missing', async () => {
    const graphql = vi.fn().mockResolvedValue({ repository: { pullRequest: null } })
    const api = new PullsApi({ graphql } as unknown as GitHubOctokit)

    await expect(
      api.listPullRequestReviewThreads({ owner: 'octo-org', repo: 'hello-world', number: 24 }),
    ).rejects.toThrow('Pull request not found')
  })
})

describe('PullsApi review thread mutations', () => {
  it('adds a single comment through an immediately submitted review', async () => {
    const { api, graphql } = createReviewApi()

    await api.addPullRequestReviewThread({
      owner: 'octo-org',
      repo: 'hello-world',
      number: 24,
      pullRequestId: 'PR_kwDOExample',
      pendingReviewId: null,
      mode: 'single',
      path: 'src/index.ts',
      side: 'RIGHT',
      line: 12,
      startLine: 10,
      startSide: 'RIGHT',
      body: 'Watch this loop',
    })

    expect(graphql).toHaveBeenCalledWith(expect.stringContaining('addPullRequestReview('), {
      pullRequestId: 'PR_kwDOExample',
      event: 'COMMENT',
      threads: [
        { path: 'src/index.ts', side: 'RIGHT', line: 12, startLine: 10, startSide: 'RIGHT', body: 'Watch this loop' },
      ],
    })
  })

  it('creates a pending review when adding the first review comment', async () => {
    const { api, graphql } = createReviewApi()

    await api.addPullRequestReviewThread({
      owner: 'octo-org',
      repo: 'hello-world',
      number: 24,
      pullRequestId: 'PR_kwDOExample',
      pendingReviewId: null,
      mode: 'review',
      path: 'src/index.ts',
      side: 'RIGHT',
      line: 12,
      body: 'Watch this loop',
    })

    expect(graphql).toHaveBeenCalledWith(expect.stringContaining('addPullRequestReview('), {
      pullRequestId: 'PR_kwDOExample',
      event: null,
      threads: [
        { path: 'src/index.ts', side: 'RIGHT', line: 12, startLine: null, startSide: null, body: 'Watch this loop' },
      ],
    })
  })

  it('appends to the existing pending review', async () => {
    const { api, graphql } = createReviewApi()

    await api.addPullRequestReviewThread({
      owner: 'octo-org',
      repo: 'hello-world',
      number: 24,
      pullRequestId: 'PR_kwDOExample',
      pendingReviewId: 'PRR_9',
      mode: 'review',
      path: 'src/index.ts',
      side: 'LEFT',
      line: 8,
      body: 'Old branch handled this',
    })

    expect(graphql).toHaveBeenCalledWith(expect.stringContaining('addPullRequestReviewThread('), {
      reviewId: 'PRR_9',
      path: 'src/index.ts',
      side: 'LEFT',
      line: 8,
      startLine: null,
      startSide: null,
      body: 'Old branch handled this',
    })
  })

  it('replies through the REST review comment endpoint', async () => {
    const { api, createReplyForReviewComment } = createReviewApi()

    await api.replyToPullRequestReviewThread({
      owner: 'octo-org',
      repo: 'hello-world',
      number: 24,
      commentDatabaseId: 555,
      body: 'Agreed',
    })

    expect(createReplyForReviewComment).toHaveBeenCalledWith({
      owner: 'octo-org',
      repo: 'hello-world',
      pull_number: 24,
      comment_id: 555,
      body: 'Agreed',
    })
  })

  it('resolves and unresolves threads by node id', async () => {
    const { api, graphql } = createReviewApi()

    await api.resolvePullRequestReviewThread({ owner: 'octo-org', repo: 'hello-world', threadId: 'PRRT_1' })
    expect(graphql).toHaveBeenCalledWith(expect.stringContaining('resolveReviewThread'), { threadId: 'PRRT_1' })

    await api.unresolvePullRequestReviewThread({ owner: 'octo-org', repo: 'hello-world', threadId: 'PRRT_1' })
    expect(graphql).toHaveBeenCalledWith(expect.stringContaining('unresolveReviewThread'), { threadId: 'PRRT_1' })
  })

  it('submits the pending review with an event and body', async () => {
    const { api, graphql } = createReviewApi()

    await api.submitPendingPullRequestReview({
      owner: 'octo-org',
      repo: 'hello-world',
      number: 24,
      reviewId: 'PRR_9',
      event: 'REQUEST_CHANGES',
      body: 'See inline notes',
    })

    expect(graphql).toHaveBeenCalledWith(expect.stringContaining('submitPullRequestReview('), {
      reviewId: 'PRR_9',
      event: 'REQUEST_CHANGES',
      body: 'See inline notes',
    })
  })

  it('deletes the pending review', async () => {
    const { api, graphql } = createReviewApi()

    await api.deletePendingPullRequestReview({ owner: 'octo-org', repo: 'hello-world', reviewId: 'PRR_9' })

    expect(graphql).toHaveBeenCalledWith(expect.stringContaining('deletePullRequestReview('), {
      reviewId: 'PRR_9',
    })
  })
})

function createReviewApi() {
  const graphql = vi.fn().mockResolvedValue({})
  const createReplyForReviewComment = vi.fn().mockResolvedValue({ data: {} })
  const api = new PullsApi({
    graphql,
    rest: {
      pulls: {
        createReplyForReviewComment,
      },
    },
  } as unknown as GitHubOctokit)

  return { api, graphql, createReplyForReviewComment }
}
