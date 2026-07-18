# PR 行级 Review 评论 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 oh-my-github 客户端实现 PR 行级 review 评论：diff 选行（单行/拖拽多行）→ 复用 Review 页输入框提交（单条即发 / 加入 pending review）→ Review 页按文件分组展示线程并支持回复、resolve/unresolve，diff 行号旁显示线程标记。

**Architecture:** GraphQL 为主（`reviewThreads` 查询、pending review 生命周期、resolve），回复走 REST。pending review 存 GitHub 服务端。渲染层新建逐行渲染的 `review-diff` 组件（复用 `parseDiff` + shiki `codeToTokens`），右侧面板新增 `'pull-request-diff'` 内容类型，选区通过模块级 composable 在 diff 面板与 Review 页 composer 间共享。

**Tech Stack:** Octokit (GraphQL + REST)、Electron IPC、Vue 3 `<script setup>`、Pinia Colada、shiki v4、Tailwind 4 语义 token、vitest。

设计文档：`docs/superpowers/specs/2026-07-17-pr-line-review-comments-design.md`

## Global Constraints

- `packages/client` 文件名一律 kebab-case（如 `review-diff.vue`）。
- 渲染层用户可见文案全部走 vue-i18n，`en.json` 与 `zh.json` 同步补齐。
- 只用语义 token（`text-foreground`/`bg-card`/`border-border`/`bg-accent`/`bg-diff-add`/`bg-diff-remove`），禁止 raw color。
- 渲染层禁止 import `electron` / `node:*`；API 类型在 `env.d.ts` 以全局 ambient type 镜像。
- 静态 chrome 文案 `select-none`；代码内容保持可选中。
- Commit message 英文 Conventional Commits，结尾带 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。
- 每个任务完成后运行该任务的验证命令再提交；不通过不提交。
- 多行评论约束：`startLine < line`，同 side、同 hunk（v1）。
- 已有 pending review 时「单条即发」禁用（GitHub 一人一 PR 只允许一个 pending review）。

---

### Task 1: API — 线程查询（types + PullsApi.listPullRequestReviewThreads + mock）

**Files:**
- Modify: `packages/api/src/types.ts`
- Modify: `packages/api/src/modules/pulls.ts`
- Modify: `packages/api/src/client.ts`
- Modify: `packages/api/src/mock.ts`
- Test: `packages/api/src/modules/pulls.review-threads.test.ts`（新建）

**Interfaces:**
- Consumes: 既有 `GitHubPullRequestReviewComment`、`mapReviewComments`、`GetPullRequestDetailOptions`、`PullsApi` GraphQL 模式。
- Produces: 类型 `GitHubPullRequestDiffSide`、`GitHubPullRequestReviewThread`、`GitHubPullRequestPendingReview`、`GitHubPullRequestReviewThreadsResult`；方法 `listPullRequestReviewThreads(options: GetPullRequestDetailOptions): Promise<GitHubPullRequestReviewThreadsResult>`；`GitHubPullRequestReviewComment` 新增 `databaseId: number | null`。

- [ ] **Step 1: 写失败测试**

新建 `packages/api/src/modules/pulls.review-threads.test.ts`：

```ts
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter @oh-my-github/api test -- review-threads`
Expected: FAIL（`listPullRequestReviewThreads` 不存在）

- [ ] **Step 3: types.ts 加类型与契约**

在 `packages/api/src/types.ts` 中：

1. `GitHubPullRequestReviewComment`（约 1508 行）新增字段，放在 `nodeId` 之后：

```ts
  databaseId: number | null
```

2. 在 `GitHubPullRequestReviewComment` 定义之前新增：

```ts
export type GitHubPullRequestDiffSide = 'LEFT' | 'RIGHT'

export interface GitHubPullRequestReviewThread {
  id: string
  path: string
  line: number | null
  startLine: number | null
  side: GitHubPullRequestDiffSide
  startSide: GitHubPullRequestDiffSide | null
  isResolved: boolean
  isOutdated: boolean
  isPending: boolean
  viewerCanResolve: boolean
  viewerCanUnresolve: boolean
  viewerCanReply: boolean
  comments: GitHubPullRequestReviewComment[]
}

export interface GitHubPullRequestPendingReview {
  id: string
  body: string
  commentCount: number
}

export interface GitHubPullRequestReviewThreadsResult {
  threads: GitHubPullRequestReviewThread[]
  pendingReview: GitHubPullRequestPendingReview | null
}
```

3. `GitHubClient` 接口（约 1706 行 `submitPullRequestReview` 之后）新增：

```ts
  listPullRequestReviewThreads(options: GetPullRequestDetailOptions): Promise<GitHubPullRequestReviewThreadsResult>
```

- [ ] **Step 4: pulls.ts 实现查询与映射**

在 `packages/api/src/modules/pulls.ts` 中：

1. `GraphQLReviewCommentNode`（约 170 行）新增两个字段：

```ts
  databaseId?: number | null
  state?: string | null
```

2. `mapReviewComments`（约 2300 行）返回对象中 `nodeId` 之后加：

```ts
        databaseId: comment.databaseId ?? null,
```

3. 新增 GraphQL 节点接口与查询常量（放在 `markPullRequestReadyForReviewMutation` 附近）：

```ts
interface GraphQLReviewThreadNode {
  id: string
  isResolved?: boolean | null
  isOutdated?: boolean | null
  path: string
  line?: number | null
  startLine?: number | null
  diffSide?: string | null
  startDiffSide?: string | null
  viewerCanResolve?: boolean | null
  viewerCanUnresolve?: boolean | null
  viewerCanReply?: boolean | null
  comments?: {
    nodes?: Array<GraphQLReviewCommentNode | null> | null
  } | null
}

interface PullRequestReviewThreadsResponse {
  repository?: {
    pullRequest?: {
      reviewThreads?: {
        nodes?: Array<GraphQLReviewThreadNode | null> | null
      } | null
      reviews?: {
        nodes?: Array<{
          id: string
          body?: string | null
          comments?: { totalCount?: number | null } | null
        } | null> | null
      } | null
    } | null
  } | null
}

const pullRequestReviewThreadsQuery = `
  query PullRequestReviewThreads($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            isOutdated
            path
            line
            startLine
            diffSide
            startDiffSide
            viewerCanResolve
            viewerCanUnresolve
            viewerCanReply
            comments(first: 50) {
              nodes {
                id
                databaseId
                body
                createdAt
                updatedAt
                url
                path
                diffHunk
                line
                originalLine
                startLine
                outdated
                state
                replyTo { id }
                author { login avatarUrl }
              }
            }
          }
        }
        reviews(states: [PENDING], first: 1) {
          nodes {
            id
            body
            comments(first: 1) { totalCount }
          }
        }
      }
    }
  }
`
```

4. `PullsApi` 类中 `submitPullRequestReview` 之后新增方法：

```ts
  async listPullRequestReviewThreads(
    options: GetPullRequestDetailOptions
  ): Promise<GitHubPullRequestReviewThreadsResult> {
    const response = await this.octokit.graphql<PullRequestReviewThreadsResponse>(
      pullRequestReviewThreadsQuery,
      {
        owner: options.owner,
        repo: options.repo,
        number: options.number
      }
    )
    const pullRequest = response.repository?.pullRequest

    if (!pullRequest) {
      throw new Error('Pull request not found')
    }

    const pendingNode = (pullRequest.reviews?.nodes ?? []).find((node) => node !== null) ?? null

    return {
      threads: mapReviewThreads(pullRequest.reviewThreads?.nodes),
      pendingReview: pendingNode
        ? {
            id: pendingNode.id,
            body: pendingNode.body ?? '',
            commentCount: pendingNode.comments?.totalCount ?? 0
          }
        : null
    }
  }
```

5. 模块底部映射函数区（`mapReviewComments` 之后）新增：

```ts
function mapReviewThreads(
  nodes: Array<GraphQLReviewThreadNode | null> | null | undefined
): GitHubPullRequestReviewThread[] {
  return (nodes ?? []).flatMap((thread) => {
    if (!thread) return []

    return [
      {
        id: thread.id,
        path: thread.path,
        line: thread.line ?? null,
        startLine: thread.startLine ?? null,
        side: mapDiffSide(thread.diffSide) ?? 'RIGHT',
        startSide: mapDiffSide(thread.startDiffSide),
        isResolved: thread.isResolved ?? false,
        isOutdated: thread.isOutdated ?? false,
        isPending: (thread.comments?.nodes ?? []).some((comment) => comment?.state === 'PENDING'),
        viewerCanResolve: thread.viewerCanResolve ?? false,
        viewerCanUnresolve: thread.viewerCanUnresolve ?? false,
        viewerCanReply: thread.viewerCanReply ?? false,
        comments: mapReviewComments(thread.comments?.nodes)
      }
    ]
  })
}

function mapDiffSide(value: string | null | undefined): GitHubPullRequestDiffSide | null {
  return value === 'LEFT' || value === 'RIGHT' ? value : null
}
```

6. 模块顶部 type import 中补 `GitHubPullRequestDiffSide`、`GitHubPullRequestReviewThread`、`GitHubPullRequestReviewThreadsResult`。

- [ ] **Step 5: client.ts 委托 + mock 实现**

`packages/api/src/client.ts` 的 pulls 委托区（`submitPullRequestReview` 行后）加：

```ts
    listPullRequestReviewThreads: (options) => pulls.listPullRequestReviewThreads(options),
```

`packages/api/src/mock.ts` 的 `submitPullRequestReview` 之后加（import 区补 `GitHubPullRequestReviewThreadsResult`）：

```ts
  async listPullRequestReviewThreads(): Promise<GitHubPullRequestReviewThreadsResult> {
    return {
      threads: [
        {
          id: 'mock-review-thread-1',
          path: 'README.md',
          line: 3,
          startLine: null,
          side: 'RIGHT',
          startSide: null,
          isResolved: false,
          isOutdated: false,
          isPending: false,
          viewerCanResolve: true,
          viewerCanUnresolve: true,
          viewerCanReply: true,
          comments: [
            {
              id: 'pull-request-review-comment:mock-review-comment-1',
              nodeId: 'mock-review-comment-1',
              databaseId: 1001,
              author: { login: 'octocat', avatarUrl: null },
              body: 'Consider rewording this line.',
              createdAt: '2026-01-02T00:00:00Z',
              updatedAt: '2026-01-02T00:00:00Z',
              url: null,
              path: 'README.md',
              diffHunk: '@@ -1,2 +1,3 @@\n title\n+added line',
              line: 3,
              originalLine: 3,
              startLine: null,
              outdated: false,
              isReply: false,
              reactions: [],
            },
          ],
        },
      ],
      pendingReview: null,
    }
  }
```

注意：mock.ts 中既有构造 `GitHubPullRequestReviewComment` 的地方（如时间线 mock 数据）此时会因缺 `databaseId` 报 typecheck 错——全部补 `databaseId: null`（用 `pnpm --filter @oh-my-github/api typecheck` 找出所有位置）。

- [ ] **Step 6: 跑测试与 typecheck**

Run: `pnpm --filter @oh-my-github/api test && pnpm --filter @oh-my-github/api typecheck`
Expected: 全部 PASS（含既有测试）

- [ ] **Step 7: Commit**

```bash
git add packages/api
git commit -m "feat(api): add pull request review threads query"
```

---

### Task 2: API — 行级评论与线程变更（add/reply/resolve/submit/delete）

**Files:**
- Modify: `packages/api/src/types.ts`
- Modify: `packages/api/src/modules/pulls.ts`
- Modify: `packages/api/src/client.ts`
- Modify: `packages/api/src/mock.ts`
- Test: `packages/api/src/modules/pulls.review-threads.test.ts`

**Interfaces:**
- Consumes: Task 1 的类型；既有 `normalizePullRequestNodeId`、`GitHubPullRequestReviewEvent`。
- Produces（契约方法，IPC 层依赖）:
  - `addPullRequestReviewThread(options: AddPullRequestReviewThreadOptions): Promise<void>`
  - `replyToPullRequestReviewThread(options: ReplyToPullRequestReviewThreadOptions): Promise<void>`
  - `resolvePullRequestReviewThread(options: ResolvePullRequestReviewThreadOptions): Promise<void>`
  - `unresolvePullRequestReviewThread(options: ResolvePullRequestReviewThreadOptions): Promise<void>`
  - `submitPendingPullRequestReview(options: SubmitPendingPullRequestReviewOptions): Promise<void>`
  - `deletePendingPullRequestReview(options: DeletePendingPullRequestReviewOptions): Promise<void>`

- [ ] **Step 1: 写失败测试**

追加到 `pulls.review-threads.test.ts`（`createReviewApi` 辅助函数放文件底部）：

```ts
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter @oh-my-github/api test -- review-threads`
Expected: FAIL（新方法不存在）

- [ ] **Step 3: types.ts 加 options 与契约**

`packages/api/src/types.ts` 在 `SubmitPullRequestReviewOptions`（约 1916 行）之后新增：

```ts
export interface AddPullRequestReviewThreadOptions extends GetPullRequestDetailOptions {
  pullRequestId: string
  pendingReviewId: string | null
  mode: 'single' | 'review'
  path: string
  side: GitHubPullRequestDiffSide
  line: number
  startLine?: number | null
  startSide?: GitHubPullRequestDiffSide | null
  body: string
}

export interface ReplyToPullRequestReviewThreadOptions extends GetPullRequestDetailOptions {
  commentDatabaseId: number
  body: string
}

export interface ResolvePullRequestReviewThreadOptions extends RepositoryOptions {
  threadId: string
}

export interface SubmitPendingPullRequestReviewOptions extends GetPullRequestDetailOptions {
  reviewId: string
  event: GitHubPullRequestReviewEvent
  body?: string
}

export interface DeletePendingPullRequestReviewOptions extends RepositoryOptions {
  reviewId: string
}
```

`GitHubClient` 接口在 `listPullRequestReviewThreads` 之后加：

```ts
  addPullRequestReviewThread(options: AddPullRequestReviewThreadOptions): Promise<void>
  replyToPullRequestReviewThread(options: ReplyToPullRequestReviewThreadOptions): Promise<void>
  resolvePullRequestReviewThread(options: ResolvePullRequestReviewThreadOptions): Promise<void>
  unresolvePullRequestReviewThread(options: ResolvePullRequestReviewThreadOptions): Promise<void>
  submitPendingPullRequestReview(options: SubmitPendingPullRequestReviewOptions): Promise<void>
  deletePendingPullRequestReview(options: DeletePendingPullRequestReviewOptions): Promise<void>
```

- [ ] **Step 4: pulls.ts 实现变更方法**

mutation 常量（放 `pullRequestReviewThreadsQuery` 之后）：

```ts
const addPullRequestReviewMutation = `
  mutation AddPullRequestReview($pullRequestId: ID!, $event: PullRequestReviewEvent, $threads: [DraftPullRequestReviewThread]) {
    addPullRequestReview(input: { pullRequestId: $pullRequestId, event: $event, threads: $threads }) {
      pullRequestReview { id }
    }
  }
`

const addPullRequestReviewThreadMutation = `
  mutation AddPullRequestReviewThread($reviewId: ID!, $path: String!, $line: Int!, $side: DiffSide, $startLine: Int, $startSide: DiffSide, $body: String!) {
    addPullRequestReviewThread(input: { pullRequestReviewId: $reviewId, path: $path, line: $line, side: $side, startLine: $startLine, startSide: $startSide, body: $body }) {
      thread { id }
    }
  }
`

const resolveReviewThreadMutation = `
  mutation ResolveReviewThread($threadId: ID!) {
    resolveReviewThread(input: { threadId: $threadId }) {
      thread { id isResolved }
    }
  }
`

const unresolveReviewThreadMutation = `
  mutation UnresolveReviewThread($threadId: ID!) {
    unresolveReviewThread(input: { threadId: $threadId }) {
      thread { id isResolved }
    }
  }
`

const submitPendingPullRequestReviewMutation = `
  mutation SubmitPullRequestReview($reviewId: ID!, $event: PullRequestReviewEvent!, $body: String) {
    submitPullRequestReview(input: { pullRequestReviewId: $reviewId, event: $event, body: $body }) {
      pullRequestReview { id state }
    }
  }
`

const deletePendingPullRequestReviewMutation = `
  mutation DeletePullRequestReview($reviewId: ID!) {
    deletePullRequestReview(input: { pullRequestReviewId: $reviewId }) {
      pullRequestReview { id }
    }
  }
`
```

`PullsApi` 类新增方法（`listPullRequestReviewThreads` 之后）：

```ts
  async addPullRequestReviewThread(options: AddPullRequestReviewThreadOptions): Promise<void> {
    const startLine = options.startLine ?? null
    const startSide = startLine === null ? null : (options.startSide ?? options.side)

    if (options.mode === 'review' && options.pendingReviewId) {
      await this.octokit.graphql(addPullRequestReviewThreadMutation, {
        reviewId: options.pendingReviewId,
        path: options.path,
        side: options.side,
        line: options.line,
        startLine,
        startSide,
        body: options.body
      })
      return
    }

    await this.octokit.graphql(addPullRequestReviewMutation, {
      pullRequestId: normalizePullRequestNodeId(options.pullRequestId),
      event: options.mode === 'single' ? 'COMMENT' : null,
      threads: [
        {
          path: options.path,
          side: options.side,
          line: options.line,
          startLine,
          startSide,
          body: options.body
        }
      ]
    })
  }

  async replyToPullRequestReviewThread(options: ReplyToPullRequestReviewThreadOptions): Promise<void> {
    await this.octokit.rest.pulls.createReplyForReviewComment({
      owner: options.owner,
      repo: options.repo,
      pull_number: options.number,
      comment_id: options.commentDatabaseId,
      body: options.body
    })
  }

  async resolvePullRequestReviewThread(options: ResolvePullRequestReviewThreadOptions): Promise<void> {
    await this.octokit.graphql(resolveReviewThreadMutation, { threadId: options.threadId })
  }

  async unresolvePullRequestReviewThread(options: ResolvePullRequestReviewThreadOptions): Promise<void> {
    await this.octokit.graphql(unresolveReviewThreadMutation, { threadId: options.threadId })
  }

  async submitPendingPullRequestReview(options: SubmitPendingPullRequestReviewOptions): Promise<void> {
    await this.octokit.graphql(submitPendingPullRequestReviewMutation, {
      reviewId: options.reviewId,
      event: options.event,
      body: options.body ?? null
    })
  }

  async deletePendingPullRequestReview(options: DeletePendingPullRequestReviewOptions): Promise<void> {
    await this.octokit.graphql(deletePendingPullRequestReviewMutation, { reviewId: options.reviewId })
  }
```

顶部 type import 补新 options 类型。

- [ ] **Step 5: client.ts 委托 + mock 空实现**

client.ts pulls 委托区追加：

```ts
    addPullRequestReviewThread: (options) => pulls.addPullRequestReviewThread(options),
    replyToPullRequestReviewThread: (options) => pulls.replyToPullRequestReviewThread(options),
    resolvePullRequestReviewThread: (options) => pulls.resolvePullRequestReviewThread(options),
    unresolvePullRequestReviewThread: (options) => pulls.unresolvePullRequestReviewThread(options),
    submitPendingPullRequestReview: (options) => pulls.submitPendingPullRequestReview(options),
    deletePendingPullRequestReview: (options) => pulls.deletePendingPullRequestReview(options),
```

mock.ts 追加：

```ts
  async addPullRequestReviewThread(): Promise<void> {
    return
  }

  async replyToPullRequestReviewThread(): Promise<void> {
    return
  }

  async resolvePullRequestReviewThread(): Promise<void> {
    return
  }

  async unresolvePullRequestReviewThread(): Promise<void> {
    return
  }

  async submitPendingPullRequestReview(): Promise<void> {
    return
  }

  async deletePendingPullRequestReview(): Promise<void> {
    return
  }
```

- [ ] **Step 6: 跑测试与 typecheck**

Run: `pnpm --filter @oh-my-github/api test && pnpm --filter @oh-my-github/api typecheck`
Expected: 全部 PASS

- [ ] **Step 7: Commit**

```bash
git add packages/api
git commit -m "feat(api): add review thread mutations for line-level PR comments"
```

---

### Task 3: IPC 贯通（main + preload + env.d.ts + renderer composables）

**Files:**
- Modify: `packages/client/src/main/pulls.ts`
- Modify: `packages/client/src/preload/index.ts`
- Modify: `packages/client/src/renderer/env.d.ts`
- Modify: `packages/client/src/renderer/composables/github/use-pull-requests.ts`

**Interfaces:**
- Consumes: Task 1/2 的 api 方法与类型。
- Produces（渲染层依赖）:
  - `usePullRequestReviewThreadsQuery(owner, repo, number, enabled)` → `useQuery<GitHubPullRequestReviewThreadsResult>`，key `['github', 'pull-request-review-threads', owner, repo, number]`
  - `useReviewThreadsInvalidation()` → `{ invalidateReviewThreads(owner, repo, number): void }`
  - `addPullRequestReviewThread(owner, repo, number, options: { pullRequestId: string, pendingReviewId: string | null, mode: 'single' | 'review', path: string, side: GitHubPullRequestDiffSide, line: number, startLine: number | null, startSide: GitHubPullRequestDiffSide | null, body: string }): Promise<void>`
  - `replyToPullRequestReviewThread(owner, repo, number, options: { commentDatabaseId: number, body: string }): Promise<void>`
  - `setPullRequestReviewThreadResolved(owner, repo, threadId, resolved): Promise<void>`
  - `submitPendingPullRequestReview(owner, repo, number, options: { reviewId: string, event: GitHubPullRequestReviewEvent, body?: string }): Promise<void>`
  - `discardPendingPullRequestReview(owner, repo, reviewId): Promise<void>`

- [ ] **Step 1: main/pulls.ts 注册 handler**

`registerPullsIpc()` 内追加：

```ts
  ipcMain.handle('pulls:list-review-threads', (_event, owner: string, repo: string, number: number) =>
    listPullRequestReviewThreads(owner, repo, number)
  )
  ipcMain.handle('pulls:add-review-thread', (_event, owner: string, repo: string, number: number, options: unknown) =>
    addPullRequestReviewThread(owner, repo, number, options)
  )
  ipcMain.handle('pulls:reply-review-thread', (_event, owner: string, repo: string, number: number, options: unknown) =>
    replyToPullRequestReviewThread(owner, repo, number, options)
  )
  ipcMain.handle('pulls:set-review-thread-resolved', (_event, owner: string, repo: string, threadId: string, resolved: boolean) =>
    setPullRequestReviewThreadResolved(owner, repo, threadId, resolved)
  )
  ipcMain.handle('pulls:submit-pending-review', (_event, owner: string, repo: string, number: number, options: unknown) =>
    submitPendingPullRequestReview(owner, repo, number, options)
  )
  ipcMain.handle('pulls:delete-pending-review', (_event, owner: string, repo: string, reviewId: string) =>
    deletePendingPullRequestReview(owner, repo, reviewId)
  )
```

实现函数（`submitPullRequestReview` 之后；import 区补 `GitHubPullRequestDiffSide` type）：

```ts
async function listPullRequestReviewThreads(owner: string, repo: string, number: number) {
  const normalizedOptions = normalizePullRequestDetailOptions({ owner, repo, number })
  const api = await createAuthenticatedGitHubApi()

  return api.pulls.listPullRequestReviewThreads(normalizedOptions)
}

async function addPullRequestReviewThread(owner: string, repo: string, number: number, options: unknown) {
  const normalizedOptions = normalizePullRequestDetailOptions({ owner, repo, number })
  const payload = (options ?? {}) as {
    pullRequestId?: string
    pendingReviewId?: string | null
    mode?: 'single' | 'review'
    path?: string
    side?: GitHubPullRequestDiffSide
    line?: number
    startLine?: number | null
    startSide?: GitHubPullRequestDiffSide | null
    body?: string
  }

  if (payload.mode !== 'single' && payload.mode !== 'review') {
    throw new Error('Unknown review thread mode')
  }

  const body = typeof payload.body === 'string' ? payload.body.trim() : ''
  if (!body) throw new Error('Review comment body is required')

  const path = typeof payload.path === 'string' ? payload.path.trim() : ''
  if (!path) throw new Error('Review comment path is required')

  const line = normalizeLineNumber(payload.line)
  const startLine = payload.startLine == null ? null : normalizeLineNumber(payload.startLine)
  if (startLine !== null && startLine >= line) {
    throw new Error('Review comment start line must be less than the end line')
  }

  const side = normalizeDiffSide(payload.side)
  const api = await createAuthenticatedGitHubApi()

  return api.pulls.addPullRequestReviewThread({
    ...normalizedOptions,
    pullRequestId: requireNonEmpty(payload.pullRequestId?.trim(), 'Pull request id is required'),
    pendingReviewId:
      typeof payload.pendingReviewId === 'string' && payload.pendingReviewId ? payload.pendingReviewId : null,
    mode: payload.mode,
    path,
    side,
    line,
    startLine,
    startSide: startLine === null ? null : normalizeDiffSide(payload.startSide ?? side),
    body,
  })
}

async function replyToPullRequestReviewThread(owner: string, repo: string, number: number, options: unknown) {
  const normalizedOptions = normalizePullRequestDetailOptions({ owner, repo, number })
  const payload = (options ?? {}) as { commentDatabaseId?: number, body?: string }
  const body = typeof payload.body === 'string' ? payload.body.trim() : ''
  if (!body) throw new Error('Reply body is required')

  const api = await createAuthenticatedGitHubApi()

  return api.pulls.replyToPullRequestReviewThread({
    ...normalizedOptions,
    commentDatabaseId: normalizeLineNumber(payload.commentDatabaseId),
    body,
  })
}

async function setPullRequestReviewThreadResolved(owner: string, repo: string, threadId: string, resolved: boolean) {
  const normalizedOwner = owner.trim()
  const normalizedRepo = repo.trim()
  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }
  const id = requireNonEmpty(threadId.trim(), 'Review thread id is required')
  const api = await createAuthenticatedGitHubApi()
  const request = { owner: normalizedOwner, repo: normalizedRepo, threadId: id }

  return resolved
    ? api.pulls.resolvePullRequestReviewThread(request)
    : api.pulls.unresolvePullRequestReviewThread(request)
}

async function submitPendingPullRequestReview(owner: string, repo: string, number: number, options: unknown) {
  const normalizedOptions = normalizePullRequestDetailOptions({ owner, repo, number })
  const payload = (options ?? {}) as { reviewId?: string, event?: GitHubPullRequestReviewEvent, body?: string }
  const body = typeof payload.body === 'string' ? payload.body.trim() : ''
  const api = await createAuthenticatedGitHubApi()

  return api.pulls.submitPendingPullRequestReview({
    ...normalizedOptions,
    reviewId: requireNonEmpty(payload.reviewId?.trim(), 'Pending review id is required'),
    event: normalizeReviewEvent(payload.event),
    ...(body ? { body } : {}),
  })
}

async function deletePendingPullRequestReview(owner: string, repo: string, reviewId: string) {
  const normalizedOwner = owner.trim()
  const normalizedRepo = repo.trim()
  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }
  const api = await createAuthenticatedGitHubApi()

  return api.pulls.deletePendingPullRequestReview({
    owner: normalizedOwner,
    repo: normalizedRepo,
    reviewId: requireNonEmpty(reviewId.trim(), 'Pending review id is required'),
  })
}

function normalizeLineNumber(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error('Line number must be a positive integer')
  }

  return value
}

function normalizeDiffSide(value: GitHubPullRequestDiffSide | null | undefined): GitHubPullRequestDiffSide {
  if (value === 'LEFT' || value === 'RIGHT') return value

  throw new Error('Unknown diff side')
}
```

- [ ] **Step 2: preload/index.ts 桥接**

pulls 对象内 `submitPullRequestReview` 之后追加：

```ts
    listPullRequestReviewThreads: (owner: string, repo: string, number: number) =>
      ipcRenderer.invoke('pulls:list-review-threads', owner, repo, number),
    addPullRequestReviewThread: (owner: string, repo: string, number: number, options: unknown) =>
      ipcRenderer.invoke('pulls:add-review-thread', owner, repo, number, options),
    replyToPullRequestReviewThread: (owner: string, repo: string, number: number, options: unknown) =>
      ipcRenderer.invoke('pulls:reply-review-thread', owner, repo, number, options),
    setPullRequestReviewThreadResolved: (owner: string, repo: string, threadId: string, resolved: boolean) =>
      ipcRenderer.invoke('pulls:set-review-thread-resolved', owner, repo, threadId, resolved),
    submitPendingPullRequestReview: (owner: string, repo: string, number: number, options: unknown) =>
      ipcRenderer.invoke('pulls:submit-pending-review', owner, repo, number, options),
    deletePendingPullRequestReview: (owner: string, repo: string, reviewId: string) =>
      ipcRenderer.invoke('pulls:delete-pending-review', owner, repo, reviewId)
```

- [ ] **Step 3: env.d.ts 镜像类型与桥接签名**

1. 全局类型区（`GitHubPullRequestReviewComment` type 附近）：`GitHubPullRequestReviewComment` 加 `databaseId: number | null`；新增：

```ts
type GitHubPullRequestDiffSide = 'LEFT' | 'RIGHT'

type GitHubPullRequestReviewThread = {
  id: string
  path: string
  line: number | null
  startLine: number | null
  side: GitHubPullRequestDiffSide
  startSide: GitHubPullRequestDiffSide | null
  isResolved: boolean
  isOutdated: boolean
  isPending: boolean
  viewerCanResolve: boolean
  viewerCanUnresolve: boolean
  viewerCanReply: boolean
  comments: GitHubPullRequestReviewComment[]
}

type GitHubPullRequestPendingReview = {
  id: string
  body: string
  commentCount: number
}

type GitHubPullRequestReviewThreadsResult = {
  threads: GitHubPullRequestReviewThread[]
  pendingReview: GitHubPullRequestPendingReview | null
}
```

2. `window.ohMyGithub.pulls` 声明区 `submitPullRequestReview` 之后追加：

```ts
      listPullRequestReviewThreads: (
        owner: string,
        repo: string,
        number: number,
      ) => Promise<GitHubPullRequestReviewThreadsResult>
      addPullRequestReviewThread: (
        owner: string,
        repo: string,
        number: number,
        options: {
          pullRequestId: string
          pendingReviewId: string | null
          mode: 'single' | 'review'
          path: string
          side: GitHubPullRequestDiffSide
          line: number
          startLine: number | null
          startSide: GitHubPullRequestDiffSide | null
          body: string
        },
      ) => Promise<void>
      replyToPullRequestReviewThread: (
        owner: string,
        repo: string,
        number: number,
        options: { commentDatabaseId: number, body: string },
      ) => Promise<void>
      setPullRequestReviewThreadResolved: (
        owner: string,
        repo: string,
        threadId: string,
        resolved: boolean,
      ) => Promise<void>
      submitPendingPullRequestReview: (
        owner: string,
        repo: string,
        number: number,
        options: { reviewId: string, event: GitHubPullRequestReviewEvent, body?: string },
      ) => Promise<void>
      deletePendingPullRequestReview: (
        owner: string,
        repo: string,
        reviewId: string,
      ) => Promise<void>
```

- [ ] **Step 4: use-pull-requests.ts 查询与变更封装**

文件末尾追加：

```ts
export function usePullRequestReviewThreadsQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  pullRequestNumber: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubPullRequestReviewThreadsResult>({
    key: () => [
      'github',
      'pull-request-review-threads',
      toValue(owner),
      toValue(repo),
      toValue(pullRequestNumber),
    ],
    enabled: () => {
      const number = toValue(pullRequestNumber)

      return Boolean(toValue(owner))
        && Boolean(toValue(repo))
        && Number.isInteger(number)
        && number > 0
        && toValue(enabled)
    },
    query: async () => {
      if (!window.ohMyGithub?.pulls) {
        throw new Error('GitHub pulls bridge is unavailable')
      }

      return window.ohMyGithub.pulls.listPullRequestReviewThreads(
        toValue(owner),
        toValue(repo),
        toValue(pullRequestNumber),
      )
    },
  })
}

// Line-comment mutations happen on the review tab while the detail query (and
// sometimes the threads query in the right panel) may be inactive, so force
// refetchActive: 'all' — same reasoning as usePullRequestListInvalidation.
export function useReviewThreadsInvalidation() {
  const queryCache = useQueryCache()

  return {
    invalidateReviewThreads(owner: string, repo: string, pullRequestNumber: number): void {
      void queryCache.invalidateQueries(
        { key: ['github', 'pull-request-review-threads', owner, repo, pullRequestNumber] },
        'all',
      )
      void queryCache.invalidateQueries(
        { key: ['github', 'pull-request-detail', owner, repo, pullRequestNumber] },
        'all',
      )
    },
  }
}

export async function addPullRequestReviewThread(
  owner: string,
  repo: string,
  pullRequestNumber: number,
  options: {
    pullRequestId: string
    pendingReviewId: string | null
    mode: 'single' | 'review'
    path: string
    side: GitHubPullRequestDiffSide
    line: number
    startLine: number | null
    startSide: GitHubPullRequestDiffSide | null
    body: string
  },
): Promise<void> {
  if (!window.ohMyGithub?.pulls) {
    throw new Error('GitHub pulls bridge is unavailable')
  }

  return window.ohMyGithub.pulls.addPullRequestReviewThread(owner, repo, pullRequestNumber, options)
}

export async function replyToPullRequestReviewThread(
  owner: string,
  repo: string,
  pullRequestNumber: number,
  options: { commentDatabaseId: number, body: string },
): Promise<void> {
  if (!window.ohMyGithub?.pulls) {
    throw new Error('GitHub pulls bridge is unavailable')
  }

  return window.ohMyGithub.pulls.replyToPullRequestReviewThread(owner, repo, pullRequestNumber, options)
}

export async function setPullRequestReviewThreadResolved(
  owner: string,
  repo: string,
  threadId: string,
  resolved: boolean,
): Promise<void> {
  if (!window.ohMyGithub?.pulls) {
    throw new Error('GitHub pulls bridge is unavailable')
  }

  return window.ohMyGithub.pulls.setPullRequestReviewThreadResolved(owner, repo, threadId, resolved)
}

export async function submitPendingPullRequestReview(
  owner: string,
  repo: string,
  pullRequestNumber: number,
  options: { reviewId: string, event: GitHubPullRequestReviewEvent, body?: string },
): Promise<void> {
  if (!window.ohMyGithub?.pulls) {
    throw new Error('GitHub pulls bridge is unavailable')
  }

  return window.ohMyGithub.pulls.submitPendingPullRequestReview(owner, repo, pullRequestNumber, options)
}

export async function discardPendingPullRequestReview(
  owner: string,
  repo: string,
  reviewId: string,
): Promise<void> {
  if (!window.ohMyGithub?.pulls) {
    throw new Error('GitHub pulls bridge is unavailable')
  }

  return window.ohMyGithub.pulls.deletePendingPullRequestReview(owner, repo, reviewId)
}
```

- [ ] **Step 5: typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/client
git commit -m "feat(client): bridge review thread APIs through IPC"
```

---

### Task 4: 选区纯逻辑 + 共享选区状态

**Files:**
- Create: `packages/client/src/renderer/components/review/review-diff-selection.ts`
- Create: `packages/client/src/renderer/components/review/review-diff-selection.test.ts`
- Create: `packages/client/src/renderer/composables/use-review-selection.ts`

**Interfaces:**
- Consumes: `parseDiff` 的 `DiffLine`（`@/components/code/parse-diff`）。
- Produces:
  - `buildReviewDiffRows(lines: DiffLine[]): ReviewDiffRow[]`，`ReviewDiffRow = { diff: DiffLine, anchor: ReviewDiffAnchor | null }`，`ReviewDiffAnchor = { side: 'LEFT' | 'RIGHT', line: number, hunkIndex: number }`
  - `extendReviewDiffRange(start: ReviewDiffAnchor, current: ReviewDiffAnchor | null): ReviewDiffRange`，`ReviewDiffRange = { side, startLine: number | null, line: number }`
  - `useReviewSelection()` → `{ selection, locatedThreadId, setSelection, clearSelection, locateThread, clearLocatedThread }`，`ReviewCommentSelection = { owner, repo, number, path, side, startLine, line }`

- [ ] **Step 1: 写失败测试**

新建 `review-diff-selection.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { parseDiff } from '../code/parse-diff'
import { buildReviewDiffRows, extendReviewDiffRange } from './review-diff-selection'

const PATCH = [
  '@@ -1,3 +1,3 @@ header',
  ' context one',
  '-removed line',
  '+added line',
  '@@ -10,2 +10,3 @@',
  ' context two',
  '+tail line',
].join('\n')

describe('buildReviewDiffRows', () => {
  it('anchors del rows on the left side and add/context rows on the right side', () => {
    const rows = buildReviewDiffRows(parseDiff(PATCH))

    expect(rows[0]?.anchor).toBeNull()
    expect(rows[1]?.anchor).toEqual({ side: 'RIGHT', line: 1, hunkIndex: 0 })
    expect(rows[2]?.anchor).toEqual({ side: 'LEFT', line: 2, hunkIndex: 0 })
    expect(rows[3]?.anchor).toEqual({ side: 'RIGHT', line: 2, hunkIndex: 0 })
    expect(rows[4]?.anchor).toBeNull()
    expect(rows[5]?.anchor).toEqual({ side: 'RIGHT', line: 10, hunkIndex: 1 })
    expect(rows[6]?.anchor).toEqual({ side: 'RIGHT', line: 11, hunkIndex: 1 })
  })

  it('skips rows without a line number on their side', () => {
    const rows = buildReviewDiffRows(parseDiff('@@ -1 +1 @@\n+only\n\\ No newline at end of file'))

    expect(rows[2]?.anchor).toBeNull()
  })
})

describe('extendReviewDiffRange', () => {
  const start = { side: 'RIGHT' as const, line: 5, hunkIndex: 0 }

  it('returns a single-line range when start and current match', () => {
    expect(extendReviewDiffRange(start, start)).toEqual({ side: 'RIGHT', startLine: null, line: 5 })
  })

  it('orders the range regardless of drag direction', () => {
    expect(extendReviewDiffRange(start, { side: 'RIGHT', line: 9, hunkIndex: 0 }))
      .toEqual({ side: 'RIGHT', startLine: 5, line: 9 })
    expect(extendReviewDiffRange(start, { side: 'RIGHT', line: 2, hunkIndex: 0 }))
      .toEqual({ side: 'RIGHT', startLine: 2, line: 5 })
  })

  it('collapses to the start line when the side differs', () => {
    expect(extendReviewDiffRange(start, { side: 'LEFT', line: 9, hunkIndex: 0 }))
      .toEqual({ side: 'RIGHT', startLine: null, line: 5 })
  })

  it('collapses to the start line when the hunk differs or current is missing', () => {
    expect(extendReviewDiffRange(start, { side: 'RIGHT', line: 20, hunkIndex: 1 }))
      .toEqual({ side: 'RIGHT', startLine: null, line: 5 })
    expect(extendReviewDiffRange(start, null))
      .toEqual({ side: 'RIGHT', startLine: null, line: 5 })
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter @oh-my-github/client test -- review-diff-selection`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 review-diff-selection.ts**

```ts
import type { DiffLine } from '../code/parse-diff'

export type ReviewDiffSide = 'LEFT' | 'RIGHT'

export interface ReviewDiffAnchor {
  side: ReviewDiffSide
  line: number
  hunkIndex: number
}

export interface ReviewDiffRange {
  side: ReviewDiffSide
  startLine: number | null
  line: number
}

export interface ReviewDiffRow {
  diff: DiffLine
  anchor: ReviewDiffAnchor | null
}

/**
 * Deleted lines anchor on the LEFT (old) side; added and context lines anchor
 * on the RIGHT (new) side, matching how GitHub review comments address lines.
 * Hunk headers and no-newline metadata rows are not commentable.
 */
export function buildReviewDiffRows(lines: DiffLine[]): ReviewDiffRow[] {
  let hunkIndex = -1

  return lines.map((diff) => {
    if (diff.type === 'hunk') {
      hunkIndex += 1
      return { diff, anchor: null }
    }

    if (diff.type === 'del') {
      return {
        diff,
        anchor: diff.oldLine === null ? null : { side: 'LEFT' as const, line: diff.oldLine, hunkIndex },
      }
    }

    return {
      diff,
      anchor: diff.newLine === null ? null : { side: 'RIGHT' as const, line: diff.newLine, hunkIndex },
    }
  })
}

/**
 * The GitHub API cannot anchor a multi-line comment across sides or hunks, so
 * a drag onto an incompatible row collapses back to the start line.
 */
export function extendReviewDiffRange(
  start: ReviewDiffAnchor,
  current: ReviewDiffAnchor | null,
): ReviewDiffRange {
  if (!current || current.side !== start.side || current.hunkIndex !== start.hunkIndex) {
    return { side: start.side, startLine: null, line: start.line }
  }

  const low = Math.min(start.line, current.line)
  const high = Math.max(start.line, current.line)

  return { side: start.side, startLine: low === high ? null : low, line: high }
}
```

- [ ] **Step 4: 实现 use-review-selection.ts**

```ts
import { readonly, ref } from 'vue'

export interface ReviewCommentSelection {
  owner: string
  repo: string
  number: number
  path: string
  side: GitHubPullRequestDiffSide
  startLine: number | null
  line: number
}

// Module-level state (same pattern as use-right-panel): the diff panel writes
// the selection while the review tab composer reads it across the tree.
const selection = ref<ReviewCommentSelection | null>(null)
const locatedThreadId = ref<string | null>(null)

export function useReviewSelection() {
  function setSelection(next: ReviewCommentSelection): void {
    selection.value = next
  }

  function clearSelection(): void {
    selection.value = null
  }

  function locateThread(threadId: string): void {
    locatedThreadId.value = threadId
  }

  function clearLocatedThread(): void {
    locatedThreadId.value = null
  }

  return {
    selection: readonly(selection),
    locatedThreadId: readonly(locatedThreadId),
    setSelection,
    clearSelection,
    locateThread,
    clearLocatedThread,
  }
}
```

- [ ] **Step 5: 跑测试**

Run: `pnpm --filter @oh-my-github/client test -- review-diff-selection && pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/renderer/components/review packages/client/src/renderer/composables/use-review-selection.ts
git commit -m "feat(client): add review diff selection state and range logic"
```

---

### Task 5: review-diff 组件（逐行渲染 + gutter 交互 + 线程标记）

**Files:**
- Modify: `packages/client/src/renderer/components/code/use-shiki-highlighter.ts`
- Create: `packages/client/src/renderer/components/review/review-diff.vue`
- Modify: `packages/client/src/renderer/i18n/locales/en.json`
- Modify: `packages/client/src/renderer/i18n/locales/zh.json`

**Interfaces:**
- Consumes: Task 4 的 `buildReviewDiffRows` / `extendReviewDiffRange`；`parseDiff`；`useCodeTheme`。
- Produces:
  - `useShikiTokenizer()` → `{ tokenize(code: string, options?: ShikiHighlightOptions): Promise<ThemedToken[][] | null> }`（加在 use-shiki-highlighter.ts）
  - `review-diff.vue`：props `{ patch: string, filename: string, markers?: ReviewDiffMarker[], selection?: ReviewDiffRange | null }`；emits `select: [range: ReviewDiffRange]`、`locateThread: [threadId: string]`；导出类型 `ReviewDiffMarker = { threadId: string, side: 'LEFT' | 'RIGHT', line: number, count: number, isResolved: boolean, isPending: boolean }`

- [ ] **Step 1: use-shiki-highlighter.ts 加 tokenizer**

在 `useShikiHighlighter` 之后追加（import 区补 `ThemedToken` type）：

```ts
export function useShikiTokenizer() {
  const settings = useSettingsStore()

  async function tokenize(
    code: string,
    options: ShikiHighlightOptions = {}
  ): Promise<ThemedToken[][] | null> {
    try {
      const highlighter = await getHighlighter()
      const language = await ensureLanguage(highlighter, resolveCodeLanguage(options))
      const themes = options.themes ?? getSchemeCodeThemes(settings.colorScheme)

      await Promise.all([
        ensureTheme(highlighter, themes.light),
        ensureTheme(highlighter, themes.dark)
      ])

      // Dual-theme tokens carry htmlStyle with the light color plus a
      // --shiki-dark variable, so rows rendered inside a `.shiki` container
      // pick up dark mode from the existing stylesheet rule.
      return highlighter.codeToTokens(code, {
        lang: language as BundledLanguage,
        themes,
        defaultColor: 'light',
        cssVariablePrefix: '--shiki-'
      }).tokens
    } catch {
      return null
    }
  }

  return { tokenize }
}
```

- [ ] **Step 2: 实现 review-diff.vue**

```vue
<script setup lang="ts">
import type { ThemedToken } from 'shiki'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessageSquare } from 'lucide-vue-next'
import { useCodeTheme } from '../code/code-theme'
import { parseDiff } from '../code/parse-diff'
import { useShikiTokenizer } from '../code/use-shiki-highlighter'
import {
  buildReviewDiffRows,
  extendReviewDiffRange,
  type ReviewDiffAnchor,
  type ReviewDiffRange,
  type ReviewDiffRow,
} from './review-diff-selection'

export interface ReviewDiffMarker {
  threadId: string
  side: 'LEFT' | 'RIGHT'
  line: number
  count: number
  isResolved: boolean
  isPending: boolean
}

const props = defineProps<{
  patch: string
  filename: string
  markers?: ReviewDiffMarker[]
  selection?: ReviewDiffRange | null
}>()

const emit = defineEmits<{
  select: [range: ReviewDiffRange]
  locateThread: [threadId: string]
}>()

const { t } = useI18n()
const { themes } = useCodeTheme()
const { tokenize } = useShikiTokenizer()

const rows = computed(() => buildReviewDiffRows(parseDiff(props.patch)))
const tokensByRow = ref<ThemedToken[][] | null>(null)

let tokenizeRequest = 0
watch(
  () => [props.patch, props.filename, themes.value.light.name, themes.value.dark.name] as const,
  async ([patch, filename]) => {
    const requestId = ++tokenizeRequest
    const code = parseDiff(patch).map((line) => line.content).join('\n')
    const tokens = await tokenize(code, { filename, themes: themes.value })
    if (requestId === tokenizeRequest) tokensByRow.value = tokens
  },
  { immediate: true },
)

const gutterDigits = computed(() => {
  let max = 0
  for (const row of rows.value) {
    if (row.diff.oldLine && row.diff.oldLine > max) max = row.diff.oldLine
    if (row.diff.newLine && row.diff.newLine > max) max = row.diff.newLine
  }
  return Math.max(2, String(max).length)
})
const numberStyle = computed(() => ({ width: `${gutterDigits.value}ch` }))
const gutterStyle = computed(() => ({ width: `calc(${gutterDigits.value * 2}ch + 2.5rem)` }))

const markerByAnchor = computed(() => {
  const map = new Map<string, ReviewDiffMarker>()
  for (const marker of props.markers ?? []) {
    map.set(`${marker.side}:${marker.line}`, marker)
  }
  return map
})

const dragStart = ref<ReviewDiffAnchor | null>(null)
const dragRange = ref<ReviewDiffRange | null>(null)
const activeRange = computed(() => dragRange.value ?? props.selection ?? null)

function beginDrag(row: ReviewDiffRow): void {
  if (!row.anchor) return
  dragStart.value = row.anchor
  dragRange.value = extendReviewDiffRange(row.anchor, row.anchor)
  window.addEventListener('mouseup', endDrag)
}

function extendDrag(row: ReviewDiffRow): void {
  if (!dragStart.value) return
  dragRange.value = extendReviewDiffRange(dragStart.value, row.anchor)
}

function endDrag(): void {
  window.removeEventListener('mouseup', endDrag)
  if (dragRange.value) emit('select', dragRange.value)
  dragStart.value = null
  dragRange.value = null
}

onBeforeUnmount(() => {
  window.removeEventListener('mouseup', endDrag)
})

function isRowSelected(row: ReviewDiffRow): boolean {
  const range = activeRange.value
  if (!range || !row.anchor || row.anchor.side !== range.side) return false
  const start = range.startLine ?? range.line
  return row.anchor.line >= start && row.anchor.line <= range.line
}

function rowMarker(row: ReviewDiffRow): ReviewDiffMarker | undefined {
  if (!row.anchor) return undefined
  return markerByAnchor.value.get(`${row.anchor.side}:${row.anchor.line}`)
}
</script>

<template>
  <div class="shiki review-diff min-w-0 font-mono text-body leading-relaxed">
    <div
      v-for="(row, index) in rows"
      :key="index"
      class="flex min-w-0"
      :class="{
        'bg-diff-add': row.diff.type === 'add' && !isRowSelected(row),
        'bg-diff-remove': row.diff.type === 'del' && !isRowSelected(row),
        'bg-accent': isRowSelected(row),
      }"
      @mouseenter="extendDrag(row)"
    >
      <template v-if="row.diff.type === 'hunk'">
        <div
          class="shrink-0 select-none"
          :style="gutterStyle"
        />
        <div class="flex-1 select-none whitespace-pre px-2 text-muted-foreground">
          @@ {{ row.diff.content }}
        </div>
      </template>
      <template v-else>
        <div
          class="relative flex shrink-0 select-none items-center justify-end gap-1 pr-1 text-right tabular-nums text-muted-foreground"
          :class="row.anchor ? 'cursor-pointer hover:text-foreground' : ''"
          :style="gutterStyle"
          @mousedown.prevent="beginDrag(row)"
        >
          <button
            v-if="rowMarker(row)"
            :aria-label="t('pullRequest.review.diff.viewThread')"
            class="absolute left-0.5 inline-flex select-none items-center gap-0.5 rounded-sm px-0.5 text-caption hover:bg-accent"
            :class="rowMarker(row)?.isResolved ? 'text-muted-foreground' : 'text-foreground'"
            type="button"
            @click="emit('locateThread', rowMarker(row)!.threadId)"
            @mousedown.stop
          >
            <MessageSquare class="size-3" />
            <span>{{ rowMarker(row)!.count }}</span>
          </button>
          <span
            class="inline-block"
            :style="numberStyle"
          >{{ row.diff.oldLine ?? '' }}</span>
          <span
            class="inline-block"
            :style="numberStyle"
          >{{ row.diff.newLine ?? '' }}</span>
        </div>
        <div class="w-4 shrink-0 select-none text-center text-muted-foreground">
          {{ row.diff.type === 'add' ? '+' : row.diff.type === 'del' ? '-' : ' ' }}
        </div>
        <div class="min-w-0 flex-1 whitespace-pre pr-2">
          <template v-if="tokensByRow?.[index]">
            <span
              v-for="(token, tokenIndex) in tokensByRow[index]"
              :key="tokenIndex"
              :style="token.htmlStyle ?? (token.color ? { color: token.color } : undefined)"
            >{{ token.content }}</span>
          </template>
          <span
            v-else
            class="text-foreground"
          >{{ row.diff.content }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
```

- [ ] **Step 3: i18n keys**

`en.json` 的 `pullRequest.review` 内新增：

```json
"diff": {
  "viewThread": "View review thread"
}
```

`zh.json` 对应：

```json
"diff": {
  "viewThread": "查看评论线程"
}
```

- [ ] **Step 4: typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/renderer/components packages/client/src/renderer/i18n
git commit -m "feat(client): add line-interactive review diff component"
```

---

### Task 6: 右面板 'pull-request-diff' 集成

**Files:**
- Modify: `packages/client/src/renderer/composables/use-right-panel.ts`
- Create: `packages/client/src/renderer/components/review/pull-request-review-diff-panel.vue`
- Modify: `packages/client/src/renderer/components/index.ts`
- Modify: `packages/client/src/renderer/pages/workspace/components/workspace-right-panel.vue`
- Modify: `packages/client/src/renderer/components/file-tree/changed-files-tree.vue`
- Modify: `packages/client/src/renderer/pages/pull-request/components/pull-request-review-tab.vue`

**Interfaces:**
- Consumes: Task 3 `usePullRequestReviewThreadsQuery`；Task 4 `useReviewSelection`；Task 5 `review-diff.vue`。
- Produces: `RightPanelContent` 新增 `'pull-request-diff'` 变体；`PullRequestReviewDiffPanel` 组件（props `{ owner, repo, number, path, patch }`）；`ChangedFilesTree` 新增可选 prop `pullRequestNumber?: number`。

- [ ] **Step 1: use-right-panel.ts 加类型**

`RightPanelContent` 联合中 `'diff'` 变体之后加：

```ts
  | {
      type: 'pull-request-diff'
      owner: string
      repo: string
      number: number
      path: string
      patch: string
      additions?: number
      deletions?: number
      title?: string
    }
```

- [ ] **Step 2: 实现 pull-request-review-diff-panel.vue**

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { usePullRequestReviewThreadsQuery } from '@/composables/github/use-pull-requests'
import { useReviewSelection } from '@/composables/use-review-selection'
import ReviewDiff, { type ReviewDiffMarker } from './review-diff.vue'
import type { ReviewDiffRange } from './review-diff-selection'

const props = defineProps<{
  owner: string
  repo: string
  number: number
  path: string
  patch: string
}>()

const threadsQuery = usePullRequestReviewThreadsQuery(
  () => props.owner,
  () => props.repo,
  () => props.number,
  () => true,
)

const { selection, setSelection, clearSelection, locateThread } = useReviewSelection()

// Outdated threads report line: null and cannot be anchored in the current diff.
const markers = computed<ReviewDiffMarker[]>(() => {
  const threads = threadsQuery.data.value?.threads ?? []

  return threads.flatMap((thread) => {
    if (thread.path !== props.path || thread.line === null) return []

    return [{
      threadId: thread.id,
      side: thread.side,
      line: thread.line,
      count: thread.comments.length,
      isResolved: thread.isResolved,
      isPending: thread.isPending,
    }]
  })
})

const activeSelection = computed<ReviewDiffRange | null>(() => {
  const value = selection.value
  if (!value) return null
  if (
    value.owner !== props.owner
    || value.repo !== props.repo
    || value.number !== props.number
    || value.path !== props.path
  ) return null

  return { side: value.side, startLine: value.startLine, line: value.line }
})

function onSelect(range: ReviewDiffRange): void {
  setSelection({
    owner: props.owner,
    repo: props.repo,
    number: props.number,
    path: props.path,
    side: range.side,
    startLine: range.startLine,
    line: range.line,
  })
}

watch(
  () => [props.owner, props.repo, props.number, props.path] as const,
  () => {
    clearSelection()
  },
)

onBeforeUnmount(() => {
  clearSelection()
})
</script>

<template>
  <div class="min-h-full overflow-x-auto py-2">
    <ReviewDiff
      class="w-max min-w-full"
      :filename="props.path"
      :markers="markers"
      :patch="props.patch"
      :selection="activeSelection"
      @locate-thread="locateThread"
      @select="onSelect"
    />
  </div>
</template>
```

- [ ] **Step 3: components/index.ts 导出**

按现有导出模式追加：

```ts
export { default as PullRequestReviewDiffPanel } from './review/pull-request-review-diff-panel.vue'
export { default as ReviewDiff } from './review/review-diff.vue'
```

- [ ] **Step 4: workspace-right-panel.vue 加分支**

import 区把 `PullRequestReviewDiffPanel` 加进 `@/components` 导入；`'diff'` 分支之后加：

```html
        <div
          v-else-if="content.type === 'pull-request-diff'"
          class="min-h-full"
        >
          <PullRequestReviewDiffPanel
            :number="content.number"
            :owner="content.owner"
            :patch="content.patch"
            :path="content.path"
            :repo="content.repo"
          />
        </div>
```

- [ ] **Step 5: changed-files-tree.vue 加 prop 分流**

props 定义加 `pullRequestNumber?: number`。`selectNode` 中，`if (!file.patch)` 分支之后、通用 `'diff'` 打开之前加：

```ts
  if (props.pullRequestNumber) {
    openRightPanel({
      type: 'pull-request-diff',
      owner: props.owner,
      repo: props.repo,
      number: props.pullRequestNumber,
      path: file.filename,
      patch: file.patch,
      additions: file.additions,
      deletions: file.deletions,
      title: file.filename,
    })
    return
  }
```

`pull-request-review-tab.vue` 模板中 `ChangedFilesTree` 加 `:pull-request-number="number"`。

- [ ] **Step 6: typecheck + build**

Run: `pnpm typecheck && pnpm --filter @oh-my-github/client build`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/renderer
git commit -m "feat(client): open PR diffs in a commentable right-panel view"
```

---

### Task 7: Review 页 composer——锚点 chip、单条/加入 review、pending 提交与丢弃

**Files:**
- Modify: `packages/client/src/renderer/pages/pull-request/components/pull-request-review-tab.vue`
- Modify: `packages/client/src/renderer/i18n/locales/en.json`
- Modify: `packages/client/src/renderer/i18n/locales/zh.json`

**Interfaces:**
- Consumes: Task 3 的查询/变更函数与 `useReviewThreadsInvalidation`；Task 4 `useReviewSelection`；`props.pullRequest.nodeId`。
- Produces: Task 8 依赖本任务在 review tab 中创建的 `threadsQuery`（`usePullRequestReviewThreadsQuery` 实例）与 `onThreadsChanged()` 回调。

- [ ] **Step 1: script 扩展**

`pull-request-review-tab.vue` 的 `<script setup>`：

1. import 增补：

```ts
import { MessageSquarePlus, X } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@oh-my-github/ui'
import { useReviewSelection } from '@/composables/use-review-selection'
import {
  addPullRequestReviewThread,
  discardPendingPullRequestReview,
  submitPendingPullRequestReview,
  submitPullRequestReview,
  usePullRequestFilesQuery,
  usePullRequestReviewThreadsQuery,
  useReviewThreadsInvalidation,
} from '@/composables/github/use-pull-requests'
```

（`Button` 等既有 import 保留。）

2. `filesQuery` 之后加：

```ts
const threadsQuery = usePullRequestReviewThreadsQuery(
  () => props.owner,
  () => props.repo,
  () => props.number,
  () => props.active,
)
const pendingReview = computed(() => threadsQuery.data.value?.pendingReview ?? null)
const { invalidateReviewThreads } = useReviewThreadsInvalidation()
const { selection, clearSelection } = useReviewSelection()

const activeSelection = computed(() => {
  const value = selection.value
  if (!value) return null
  if (value.owner !== props.owner || value.repo !== props.repo || value.number !== props.number) return null
  return value
})

const anchorLabel = computed(() => {
  const anchor = activeSelection.value
  if (!anchor) return ''
  const range = anchor.startLine === null ? `L${anchor.line}` : `L${anchor.startLine}–L${anchor.line}`
  const label = t('pullRequest.review.anchor.commentingOn', { path: anchor.path, range })
  return anchor.side === 'LEFT' ? `${label} ${t('pullRequest.review.anchor.oldSide')}` : label
})

const isSubmittingThread = ref<'single' | 'review' | null>(null)
const isDiscardDialogOpen = ref(false)
const isDiscardingPending = ref(false)

async function submitLineComment(mode: 'single' | 'review'): Promise<void> {
  const anchor = activeSelection.value
  const body = reviewBody.value.trim()
  if (!anchor || !body || isSubmittingThread.value || submittingEvent.value) return

  isSubmittingThread.value = mode
  reviewError.value = null

  try {
    await addPullRequestReviewThread(props.owner, props.repo, props.number, {
      pullRequestId: props.pullRequest.nodeId,
      pendingReviewId: pendingReview.value?.id ?? null,
      mode,
      path: anchor.path,
      side: anchor.side,
      line: anchor.line,
      startLine: anchor.startLine,
      startSide: anchor.startLine === null ? null : anchor.side,
      body,
    })
    reviewBody.value = ''
    clearSelection()
    invalidateReviewThreads(props.owner, props.repo, props.number)
    emit('refetch')
  } catch {
    reviewError.value = t('pullRequest.review.threadError')
  } finally {
    isSubmittingThread.value = null
  }
}

async function discardPendingReview(): Promise<void> {
  const pending = pendingReview.value
  if (!pending || isDiscardingPending.value) return

  isDiscardingPending.value = true
  reviewError.value = null

  try {
    await discardPendingPullRequestReview(props.owner, props.repo, pending.id)
    isDiscardDialogOpen.value = false
    invalidateReviewThreads(props.owner, props.repo, props.number)
    emit('refetch')
  } catch {
    reviewError.value = t('pullRequest.review.pending.discardError')
  } finally {
    isDiscardingPending.value = false
  }
}

function onThreadsChanged(): void {
  invalidateReviewThreads(props.owner, props.repo, props.number)
  emit('refetch')
}
```

3. `submitReview` 整体替换为（pending 存在时改走 GraphQL submit；有 pending 评论时正文可空）：

```ts
async function submitReview(event: GitHubPullRequestReviewEvent): Promise<void> {
  if (submittingEvent.value || isSubmittingThread.value) return

  const pending = pendingReview.value
  const body = reviewBody.value.trim()
  if (!body && event !== 'APPROVE' && !pending) return

  submittingEvent.value = event
  reviewError.value = null

  try {
    if (pending) {
      await submitPendingPullRequestReview(props.owner, props.repo, props.number, {
        reviewId: pending.id,
        event,
        ...(body ? { body } : {}),
      })
    } else {
      await submitPullRequestReview(props.owner, props.repo, props.number, {
        event,
        ...(body ? { body } : {}),
      })
    }
    reviewBody.value = ''
    invalidateReviewThreads(props.owner, props.repo, props.number)
    emit('refetch')
  } catch {
    reviewError.value = t('pullRequest.review.error')
  } finally {
    submittingEvent.value = null
  }
}
```

- [ ] **Step 2: template 扩展**

1. 标题行（`ownPullRequest` span 处）改为：

```html
      <div class="flex flex-wrap items-baseline gap-2">
        <h2 class="text-title font-medium text-foreground">
          {{ t('pullRequest.review.title') }}
        </h2>
        <span
          v-if="pendingReview"
          class="select-none text-body text-muted-foreground"
        >
          {{ t('pullRequest.review.pending.count', { count: pendingReview.commentCount }) }}
        </span>
        <span
          v-else-if="isOwnPullRequest"
          class="text-body text-muted-foreground"
        >
          {{ t('pullRequest.review.ownPullRequest') }}
        </span>
      </div>
```

2. `ConversationCommentComposer` 之前插入锚点 chip：

```html
      <div
        v-if="activeSelection"
        class="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
      >
        <MessageSquarePlus class="size-4 shrink-0 text-muted-foreground" />
        <span class="min-w-0 flex-1 truncate text-body text-foreground">{{ anchorLabel }}</span>
        <Button
          :aria-label="t('pullRequest.review.anchor.clear')"
          size="icon-sm"
          type="button"
          variant="ghost"
          @click="clearSelection"
        >
          <X class="size-3.5" />
        </Button>
      </div>
```

3. `#actions` 槽内容改为双模式（有选区 → 行评论按钮组；无选区 → 原三按钮 + 可选丢弃按钮）：

```html
        <template #actions>
          <div
            v-if="activeSelection"
            class="flex shrink-0 items-center gap-2"
          >
            <Button
              :disabled="!hasBody || Boolean(pendingReview) || Boolean(isSubmittingThread)"
              :loading="isSubmittingThread === 'single'"
              loading-mode="leading"
              size="sm"
              :title="pendingReview ? t('pullRequest.review.singleDisabledPending') : undefined"
              type="button"
              variant="outline"
              @click="submitLineComment('single')"
            >
              {{ t('pullRequest.review.addSingleComment') }}
            </Button>
            <Button
              :disabled="!hasBody || Boolean(isSubmittingThread)"
              :loading="isSubmittingThread === 'review'"
              loading-mode="leading"
              size="sm"
              type="button"
              @click="submitLineComment('review')"
            >
              {{ t('pullRequest.review.addToReview') }}
            </Button>
          </div>
          <div
            v-else
            class="flex shrink-0 items-center gap-2"
          >
            <Button
              v-if="pendingReview"
              :disabled="Boolean(submittingEvent) || isDiscardingPending"
              size="sm"
              type="button"
              variant="ghost"
              @click="isDiscardDialogOpen = true"
            >
              {{ t('pullRequest.review.pending.discard') }}
            </Button>
            <Button
              :disabled="(!hasBody && !pendingReview) || Boolean(submittingEvent)"
              :loading="submittingEvent === 'COMMENT'"
              loading-mode="leading"
              size="sm"
              type="button"
              variant="outline"
              @click="submitReview('COMMENT')"
            >
              {{ t('pullRequest.review.comment') }}
            </Button>
            <Button
              :disabled="isOwnPullRequest || (!hasBody && !pendingReview) || Boolean(submittingEvent)"
              :loading="submittingEvent === 'REQUEST_CHANGES'"
              loading-mode="leading"
              size="sm"
              type="button"
              variant="outline"
              @click="submitReview('REQUEST_CHANGES')"
            >
              {{ t('pullRequest.review.requestChanges') }}
            </Button>
            <Button
              :disabled="isOwnPullRequest || Boolean(submittingEvent)"
              :loading="submittingEvent === 'APPROVE'"
              loading-mode="leading"
              size="sm"
              type="button"
              @click="submitReview('APPROVE')"
            >
              {{ t('pullRequest.review.approve') }}
            </Button>
          </div>
        </template>
```

4. 组件根部（最外层 div 内任意位置，惯例放模板末尾）加丢弃确认 Dialog：

```html
    <Dialog v-model:open="isDiscardDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('pullRequest.review.pending.discardTitle') }}</DialogTitle>
          <DialogDescription>{{ t('pullRequest.review.pending.discardDescription') }}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            :disabled="isDiscardingPending"
            type="button"
            variant="ghost"
            @click="isDiscardDialogOpen = false"
          >
            {{ t('pullRequest.review.pending.discardCancel') }}
          </Button>
          <Button
            :loading="isDiscardingPending"
            loading-mode="leading"
            type="button"
            variant="destructive"
            @click="discardPendingReview"
          >
            {{ t('pullRequest.review.pending.discardConfirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
```

- [ ] **Step 3: i18n keys**

`en.json` 的 `pullRequest.review` 内新增：

```json
"anchor": {
  "commentingOn": "Commenting on {path} · {range}",
  "oldSide": "(old code)",
  "clear": "Clear selected lines"
},
"addSingleComment": "Add single comment",
"addToReview": "Add to review",
"singleDisabledPending": "You have a pending review; new comments join it.",
"threadError": "The comment could not be added. Reselect the lines and try again.",
"pending": {
  "count": "{count} pending review comments",
  "discard": "Discard review",
  "discardTitle": "Discard pending review?",
  "discardDescription": "All pending review comments will be deleted. This cannot be undone.",
  "discardConfirm": "Discard",
  "discardCancel": "Cancel",
  "discardError": "The pending review could not be discarded."
}
```

`zh.json` 对应：

```json
"anchor": {
  "commentingOn": "评论 {path} · {range}",
  "oldSide": "（旧代码）",
  "clear": "清除所选行"
},
"addSingleComment": "单条评论",
"addToReview": "加入 Review",
"singleDisabledPending": "存在待提交的 review，新评论将加入其中。",
"threadError": "评论添加失败，请重新选择行后重试。",
"pending": {
  "count": "{count} 条待提交评论",
  "discard": "丢弃 Review",
  "discardTitle": "丢弃待提交的 review？",
  "discardDescription": "所有待提交的 review 评论都会被删除，且无法恢复。",
  "discardConfirm": "丢弃",
  "discardCancel": "取消",
  "discardError": "待提交的 review 丢弃失败。"
}
```

- [ ] **Step 4: typecheck + build**

Run: `pnpm typecheck && pnpm --filter @oh-my-github/client build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/renderer
git commit -m "feat(client): anchor review composer to selected diff lines with pending review flow"
```

---

### Task 8: Review 页线程列表（分组、回复、resolve、定位）

**Files:**
- Create: `packages/client/src/renderer/components/code/diff-hunk.ts`
- Modify: `packages/client/src/renderer/pages/pull-request/components/pull-request-review-card.vue`
- Create: `packages/client/src/renderer/pages/pull-request/components/pull-request-review-thread-card.vue`
- Create: `packages/client/src/renderer/pages/pull-request/components/pull-request-review-threads.vue`
- Modify: `packages/client/src/renderer/pages/pull-request/components/pull-request-review-tab.vue`
- Modify: `packages/client/src/renderer/i18n/locales/en.json`
- Modify: `packages/client/src/renderer/i18n/locales/zh.json`

**Interfaces:**
- Consumes: Task 3 `replyToPullRequestReviewThread` / `setPullRequestReviewThreadResolved`；Task 4 `useReviewSelection().locatedThreadId`；Task 7 的 `threadsQuery`、`onThreadsChanged()`。
- Produces: `trimDiffHunk(diffHunk: string | null, maxLines?: number): string`；`PullRequestReviewThreads` 组件（props `{ owner, repo, number, threads, isLoading, hasError }`，emits `retry`、`changed`）。

- [ ] **Step 1: 抽取 trimDiffHunk**

新建 `packages/client/src/renderer/components/code/diff-hunk.ts`：

```ts
/**
 * Trim a review-comment diff hunk down to its trailing context lines so a
 * thread card shows where the comment sits without repeating the whole hunk.
 */
export function trimDiffHunk(diffHunk: string | null, maxLines = 4): string {
  if (!diffHunk) return ''

  const lines = diffHunk.split('\n').filter((line) => !line.startsWith('@@'))

  return lines.slice(-maxLines).join('\n')
}
```

`pull-request-review-card.vue` 删除本地 `MAX_HUNK_LINES` 与 `trimDiffHunk`，改为 `import { trimDiffHunk } from '@/components/code/diff-hunk'`（调用处 `trimDiffHunk(comment.diffHunk)` 不变）。

- [ ] **Step 2: 实现 pull-request-review-thread-card.vue**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge, Button, Card } from '@oh-my-github/ui'
import GitHubMarkdownRenderer from '@/components/github/github-markdown-renderer.vue'
import ShikiDiff from '@/components/code/shiki-diff.vue'
import ConversationActorLine from '@/components/conversation/conversation-actor-line.vue'
import ConversationCommentComposer from '@/components/conversation/conversation-comment-composer.vue'
import { trimDiffHunk } from '@/components/code/diff-hunk'
import {
  replyToPullRequestReviewThread,
  setPullRequestReviewThreadResolved,
} from '@/composables/github/use-pull-requests'

const props = defineProps<{
  owner: string
  repo: string
  number: number
  thread: GitHubPullRequestReviewThread
  highlighted: boolean
}>()

const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()

const collapsed = ref(props.thread.isResolved)
const isReplying = ref(false)
const replyBody = ref('')
const replyError = ref<string | null>(null)
const isSubmittingReply = ref(false)
const isTogglingResolved = ref(false)
const actionError = ref<string | null>(null)

const rootComment = computed(() => props.thread.comments[0] ?? null)
const trimmedHunk = computed(() => trimDiffHunk(rootComment.value?.diffHunk ?? null))
// Replies to pending comments 404 on the REST endpoint (they are not
// published yet), so replying is gated on the thread being submitted.
const canReply = computed(() =>
  props.thread.viewerCanReply
  && !props.thread.isPending
  && rootComment.value?.databaseId !== null
  && rootComment.value !== null
)
const canToggleResolved = computed(() =>
  props.thread.isResolved ? props.thread.viewerCanUnresolve : props.thread.viewerCanResolve
)

const lineLabel = computed(() => {
  const { startLine, line, side, path } = props.thread
  if (line === null) return `${path} · ${t('pullRequest.review.threads.outdatedLine')}`
  const range = startLine === null ? `L${line}` : `L${startLine}–L${line}`
  return side === 'LEFT'
    ? `${path} · ${range} ${t('pullRequest.review.anchor.oldSide')}`
    : `${path} · ${range}`
})

async function submitReply(): Promise<void> {
  const databaseId = rootComment.value?.databaseId
  const body = replyBody.value.trim()
  if (!databaseId || !body || isSubmittingReply.value) return

  isSubmittingReply.value = true
  replyError.value = null

  try {
    await replyToPullRequestReviewThread(props.owner, props.repo, props.number, {
      commentDatabaseId: databaseId,
      body,
    })
    replyBody.value = ''
    isReplying.value = false
    emit('changed')
  } catch {
    replyError.value = t('pullRequest.review.threads.replyError')
  } finally {
    isSubmittingReply.value = false
  }
}

async function toggleResolved(): Promise<void> {
  if (isTogglingResolved.value) return

  isTogglingResolved.value = true
  actionError.value = null

  try {
    await setPullRequestReviewThreadResolved(props.owner, props.repo, props.thread.id, !props.thread.isResolved)
    emit('changed')
  } catch {
    actionError.value = t('pullRequest.review.threads.resolveError')
  } finally {
    isTogglingResolved.value = false
  }
}
</script>

<template>
  <Card
    class="grid min-w-0 gap-3 p-3 transition-colors"
    :class="highlighted ? 'bg-accent' : ''"
    :data-thread-id="thread.id"
  >
    <div class="flex min-w-0 flex-wrap items-center gap-2">
      <button
        class="min-w-0 flex-1 truncate text-left font-mono text-body text-foreground"
        type="button"
        @click="collapsed = !collapsed"
      >
        {{ lineLabel }}
      </button>
      <Badge
        v-if="thread.isPending"
        variant="secondary"
      >
        {{ t('pullRequest.review.threads.pendingBadge') }}
      </Badge>
      <Badge
        v-if="thread.isOutdated"
        variant="secondary"
      >
        {{ t('pullRequest.review.threads.outdatedBadge') }}
      </Badge>
      <Badge
        v-if="thread.isResolved"
        variant="secondary"
      >
        {{ t('pullRequest.review.threads.resolvedBadge') }}
      </Badge>
      <Button
        v-if="canToggleResolved"
        :disabled="isTogglingResolved"
        :loading="isTogglingResolved"
        loading-mode="leading"
        size="sm"
        type="button"
        variant="outline"
        @click="toggleResolved"
      >
        {{ thread.isResolved ? t('pullRequest.review.threads.unresolve') : t('pullRequest.review.threads.resolve') }}
      </Button>
    </div>

    <template v-if="!collapsed">
      <div
        v-if="trimmedHunk"
        class="overflow-hidden rounded-md border border-border"
      >
        <ShikiDiff
          :filename="thread.path"
          :patch="trimmedHunk"
        />
      </div>

      <div
        v-for="comment in thread.comments"
        :key="comment.id"
        class="grid min-w-0 gap-1.5"
      >
        <ConversationActorLine
          :actor="{ login: comment.author.login, avatarUrl: comment.author.avatarUrl ?? undefined }"
          :created-at="comment.createdAt"
        />
        <GitHubMarkdownRenderer
          :content="comment.body"
          :owner="owner"
          :repo="repo"
        />
      </div>

      <p
        v-if="actionError"
        class="text-body text-destructive"
        role="alert"
      >
        {{ actionError }}
      </p>

      <div v-if="canReply">
        <Button
          v-if="!isReplying"
          size="sm"
          type="button"
          variant="outline"
          @click="isReplying = true"
        >
          {{ t('pullRequest.review.threads.reply') }}
        </Button>
        <ConversationCommentComposer
          v-else
          v-model="replyBody"
          :error="replyError"
          i18n-scope="pullRequest.review.replyComposer"
          :is-submitting="isSubmittingReply"
          :owner="owner"
          :repo="repo"
          @submit="submitReply"
        />
      </div>
    </template>
  </Card>
</template>
```

注意：`ConversationActorLine` 的实际 props 以组件源码为准（实现时打开确认，比如 `actor`/`createdAt` 的命名与类型），签名不符时按源码调整调用。

- [ ] **Step 3: 实现 pull-request-review-threads.vue**

```vue
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button, Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Skeleton } from '@oh-my-github/ui'
import { AlertCircle } from 'lucide-vue-next'
import { useReviewSelection } from '@/composables/use-review-selection'
import PullRequestReviewThreadCard from './pull-request-review-thread-card.vue'

const props = defineProps<{
  owner: string
  repo: string
  number: number
  threads: GitHubPullRequestReviewThread[]
  isLoading: boolean
  hasError: boolean
}>()

const emit = defineEmits<{
  retry: []
  changed: []
}>()

const { t } = useI18n()
const { locatedThreadId, clearLocatedThread } = useReviewSelection()

const groups = computed(() => {
  const byPath = new Map<string, GitHubPullRequestReviewThread[]>()
  for (const thread of props.threads) {
    const list = byPath.get(thread.path) ?? []
    list.push(thread)
    byPath.set(thread.path, list)
  }
  return [...byPath.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, threads]) => ({ path, threads }))
})

const highlightedThreadId = ref<string | null>(null)
let highlightTimer: ReturnType<typeof setTimeout> | null = null

watch(
  locatedThreadId,
  async (threadId) => {
    if (!threadId) return
    await nextTick()
    const element = document.querySelector(`[data-thread-id="${threadId}"]`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightedThreadId.value = threadId
    if (highlightTimer) clearTimeout(highlightTimer)
    highlightTimer = setTimeout(() => {
      highlightedThreadId.value = null
    }, 1600)
    clearLocatedThread()
  },
  { immediate: true },
)
</script>

<template>
  <section
    v-if="isLoading || hasError || threads.length > 0"
    class="grid gap-2"
  >
    <h2 class="select-none text-title font-medium text-foreground">
      {{ t('pullRequest.review.threads.title') }}
    </h2>

    <div
      v-if="isLoading"
      class="grid gap-2"
    >
      <Skeleton
        v-for="index in 3"
        :key="index"
        class="h-20 rounded-xl"
      />
    </div>

    <Empty
      v-else-if="hasError"
      class="border border-border bg-card"
    >
      <EmptyHeader>
        <EmptyMedia>
          <AlertCircle class="size-5" />
        </EmptyMedia>
        <EmptyTitle>{{ t('pullRequest.review.threads.errorTitle') }}</EmptyTitle>
        <EmptyDescription>{{ t('pullRequest.review.threads.errorDescription') }}</EmptyDescription>
        <Button
          class="justify-self-center"
          size="sm"
          type="button"
          variant="outline"
          @click="emit('retry')"
        >
          {{ t('pullRequest.review.retry') }}
        </Button>
      </EmptyHeader>
    </Empty>

    <div
      v-else
      class="grid gap-4"
    >
      <div
        v-for="group in groups"
        :key="group.path"
        class="grid gap-2"
      >
        <h3 class="select-none truncate font-mono text-body text-muted-foreground">
          {{ group.path }}
        </h3>
        <PullRequestReviewThreadCard
          v-for="thread in group.threads"
          :key="thread.id"
          :highlighted="highlightedThreadId === thread.id"
          :number="number"
          :owner="owner"
          :repo="repo"
          :thread="thread"
          @changed="emit('changed')"
        />
      </div>
    </div>
  </section>
</template>
```

（线程为空且无错误/加载时整个 section 消失——这是次要条件区块，空态不占位。）

- [ ] **Step 4: review tab 挂载线程区**

`pull-request-review-tab.vue`：

1. import `PullRequestReviewThreads from './pull-request-review-threads.vue'`。
2. script 加：

```ts
const threads = computed(() => threadsQuery.data.value?.threads ?? [])
const isLoadingThreads = computed(() => threadsQuery.isLoading.value && threads.value.length === 0)
const hasThreadsError = computed(() => Boolean(threadsQuery.error.value))

function retryThreads(): void {
  void threadsQuery.refetch()
}
```

3. 模板中 composer `</section>` 之后、files section 之前插入：

```html
    <PullRequestReviewThreads
      :has-error="hasThreadsError"
      :is-loading="isLoadingThreads"
      :number="number"
      :owner="owner"
      :repo="repo"
      :threads="threads"
      @changed="onThreadsChanged"
      @retry="retryThreads"
    />
```

- [ ] **Step 5: i18n keys**

`en.json` 的 `pullRequest.review` 内新增：

```json
"threads": {
  "title": "Review threads",
  "pendingBadge": "Pending",
  "outdatedBadge": "Outdated",
  "resolvedBadge": "Resolved",
  "outdatedLine": "outdated location",
  "resolve": "Resolve",
  "unresolve": "Unresolve",
  "reply": "Reply",
  "replyError": "The reply could not be posted. Try again.",
  "resolveError": "The thread state could not be updated. Try again.",
  "errorTitle": "Could not load review threads",
  "errorDescription": "Review threads could not be loaded. Check the connection and try again."
},
"replyComposer": {
  "inputLabel": "Reply to review thread",
  "placeholder": "Write a reply",
  "emptyPreview": "Nothing to preview.",
  "submit": "Reply"
}
```

`zh.json` 对应：

```json
"threads": {
  "title": "Review 线程",
  "pendingBadge": "待提交",
  "outdatedBadge": "已过期",
  "resolvedBadge": "已解决",
  "outdatedLine": "位置已过期",
  "resolve": "标记解决",
  "unresolve": "取消解决",
  "reply": "回复",
  "replyError": "回复发送失败，请重试。",
  "resolveError": "线程状态更新失败，请重试。",
  "errorTitle": "无法加载 review 线程",
  "errorDescription": "review 线程加载失败，请检查网络后重试。"
},
"replyComposer": {
  "inputLabel": "回复 review 线程",
  "placeholder": "写下回复",
  "emptyPreview": "暂无可预览内容。",
  "submit": "回复"
}
```

注意：`replyComposer` 需要的键名以 `ConversationMarkdownComposerShell` 实际读取的 scope 键为准（实现时对照 `pullRequest.review` 既有键，如 `inputLabel`/`placeholder`/`emptyPreview`），缺了会渲染出裸键名。

- [ ] **Step 6: typecheck + build + 全部测试**

Run: `pnpm typecheck && pnpm --filter @oh-my-github/client test && pnpm --filter @oh-my-github/client build`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/renderer
git commit -m "feat(client): show review threads with reply and resolve on the review tab"
```

---

### Task 9: 全局验收

**Files:** 无新增（只验证）

- [ ] **Step 1: 全量验证命令**

```bash
pnpm typecheck
pnpm --filter @oh-my-github/api test
pnpm --filter @oh-my-github/client test
pnpm --filter @oh-my-github/client build
```

Expected: 全部 PASS。

- [ ] **Step 2: 手工验收清单（`pnpm --filter @oh-my-github/client dev` 起真应用，用真实 GitHub 账号）**

1. 打开一个自己有权限的 PR → Review 标签页 → 点一个文件，右侧出现带行号的 diff。
2. 点击一行行号 → Review 页 composer 上方出现锚点 chip（路径 + L 行号）；拖拽行号 → 显示 L{start}–L{end}；跨 hunk / 跨新旧侧拖拽会收敛回起始行。
3. 输入正文 → 「单条评论」→ GitHub 网页端立即可见该行评论；diff 对应行出现标记，Review 页线程列表出现该线程。
4. 选行 → 「加入 Review」→ 标题旁出现「N 条待提交评论」，线程带「待提交」徽标；GitHub 网页端显示 pending review。此时「单条评论」禁用。
5. 无选区时三按钮提交 pending review（Approve 可空正文）→ pending 清空，线程转为已发布；「丢弃 Review」弹确认框，确认后 pending 评论全部消失。
6. 对已发布线程回复 → 新评论出现在线程中；resolve → 徽标变化且默认折叠；unresolve 恢复。
7. 点击 diff 行标记 → Review 页滚动定位到对应线程并短暂高亮。
8. 切换深色模式看 diff 与线程卡片；把右面板拖窄确认无溢出；切 zh/en 文案完整。

- [ ] **Step 3: 更新验收结果**

把手工验收结果（通过项/问题项）汇报给开发者。

## Self-Review 结论

- 覆盖设计文档全部 v1 范围：双提交模型（Task 2/7）、线程展示+回复+resolve（Task 1/8）、多行拖拽（Task 4/5）、composer 锚点复用（Task 7）、Review 页列表+diff 标记+定位（Task 5/6/8）、错误处理（各任务 error 态）、「明确不做」未实现。
- 类型/签名跨任务一致性已核对（`ReviewDiffRange`、`GitHubPullRequestDiffSide`、`invalidateReviewThreads`、`onThreadsChanged`）。
- 已知风险：GraphQL `addPullRequestReviewThread` 输入字段与 `ThemedToken.htmlStyle`、`ConversationActorLine` props 以运行时/源码为准，执行时如有出入按错误信息调整（计划中已标注）。
