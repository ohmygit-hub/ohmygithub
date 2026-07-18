# PR 行级 Review 评论设计

日期：2026-07-17
状态：已与开发者对齐方向

## 目标

在 oh-my-github 桌面客户端中实现 PR review 行级评论，对齐 GitHub 网页版能力：

1. 在 diff 中选中单行或拖拽选中多行，对选中范围添加评论。
2. 双提交模型：
   - 单条即发（对应 GitHub「Add single comment」）。
   - 批量 pending review（攒多条评论，最终以 Approve / Comment / Request changes 统一提交）。
3. 展示已有行级评论线程，支持回复与 resolve / unresolve。
4. 复用 Review 标签页现有评论输入框：有选区时输入框显示锚定的文件与行号范围；不新增内嵌输入框。
5. 线程内容在 Review 页按文件分组展示；diff 中只在行号旁显示线程标记，点击标记定位到 Review 页对应线程。

## 已确认的方向性决策

| 决策点 | 结论 | 理由 |
| --- | --- | --- |
| API 传输 | GraphQL 为主，回复走 REST | resolve/unresolve 与 `isResolved` 仅 GraphQL 提供；`pulls.ts` 已有 GraphQL 基础设施。REST replies 接口语义简单（立即发布）。 |
| pending review 状态 | 存 GitHub 服务端 | 与网页版互通、重启不丢、语义与 GitHub 一致。GitHub 限制每人每 PR 只能有一个 pending review。 |
| diff 行级交互 | 新建逐行渲染的 `review-diff` 组件 | 现有 `ShikiCode` 整段 `v-html`，行级交互脆弱。复用 `parseDiff()` 行号解析 + shiki `codeToTokens` 逐行高亮，gutter 交互归 Vue 状态管理。 |
| diff 承载位置 | 右侧面板新增 `'pull-request-diff'` 内容类型 | 不污染通用 `'diff'` 类型；面板组件自行用 Pinia Colada 查线程（与 Review 页共享缓存）。 |
| 选区共享 | 模块级 composable `use-review-selection` | diff 面板（写）与 Review 页 composer（读）跨树共享，参照 `use-right-panel` 模式。 |

## API 层（packages/api）

### 新类型（types.ts）

```ts
export type GitHubPullRequestDiffSide = 'LEFT' | 'RIGHT'

export interface GitHubPullRequestReviewThread {
  id: string                     // GraphQL node id，resolve/reply 用
  path: string
  line: number | null            // 结束行（锚定行）
  startLine: number | null      // 多行范围起始行，单行为 null
  side: GitHubPullRequestDiffSide
  startSide: GitHubPullRequestDiffSide | null
  isResolved: boolean
  isOutdated: boolean
  isPending: boolean             // 属于 viewer 的 pending review（仅本人可见）
  viewerCanResolve: boolean
  viewerCanUnresolve: boolean
  viewerCanReply: boolean
  comments: GitHubPullRequestReviewComment[]   // 复用既有类型
}

export interface GitHubPullRequestPendingReview {
  id: string                     // GraphQL node id
  body: string
  commentCount: number
}

export interface GitHubPullRequestReviewThreadsResult {
  threads: GitHubPullRequestReviewThread[]
  pendingReview: GitHubPullRequestPendingReview | null
}
```

`GitHubPullRequestReviewComment` 已含 `path`/`line`/`startLine`/`diffHunk`，补充需要的字段（如缺 `databaseId`，REST 回复需要数字 id）。

### 新方法（GitHubClient 契约 + pulls 模块 + MockGitHubClient）

| 方法 | 传输 | 说明 |
| --- | --- | --- |
| `listPullRequestReviewThreads(options)` | GraphQL | `pullRequest.reviewThreads` + `reviews(states: PENDING, first: 1)`。pending review 仅本人可见，无需再过滤 author。 |
| `addPullRequestReviewThread(options)` | GraphQL | `options.mode: 'single' \| 'review'`。single → `addPullRequestReview(event: COMMENT, threads: [...])` 一次创建并提交；review → 无 pending 时 `addPullRequestReview`（无 event，带 threads）创建 pending；已有 pending 时 `addPullRequestReviewThread(pullRequestReviewId, ...)` 追加。参数：`path`、`line`、`side`、`startLine?`、`startSide?`、`body`。 |
| `replyToPullRequestReviewThread(options)` | REST | `POST /pulls/{n}/comments/{comment_id}/replies`，立即发布。入参取线程根评论的数字 id。 |
| `resolvePullRequestReviewThread(options)` | GraphQL | `resolveReviewThread(threadId)` |
| `unresolvePullRequestReviewThread(options)` | GraphQL | `unresolveReviewThread(threadId)` |
| `submitPendingPullRequestReview(options)` | GraphQL | `submitPullRequestReview(pullRequestReviewId, event, body?)`，提交 pending review。 |
| `deletePendingPullRequestReview(options)` | GraphQL | `deletePullRequestReview(pullRequestReviewId)`，丢弃 pending review 及其全部评论。 |

既有 `submitPullRequestReview`（REST createReview）保持不变，仅用于**无 pending review**时的整体 review 提交；有 pending 时 Review 页改走 `submitPendingPullRequestReview`（REST createReview 在存在 pending 时会 422）。

### 行为约束

- viewer 已有 pending review 时，「单条即发」在 GitHub 侧会 422 —— UI 层直接禁用该按钮（对齐网页版：有 pending 时只有「Add review comment」）。
- 多行范围：`startLine < line`，二者必须锚定在**同一 side**（v1 简化；GitHub 网页版支持跨 side，暂不做）。

## IPC 链（packages/client）

每个新 API 方法贯通四层：

1. `src/main/pulls.ts`：IPC handler，参数校验后转调 api 包。
2. `src/preload/index.ts`：`ohMyGithub.pulls.*` 窄方法。
3. `src/renderer/env.d.ts`：preload 返回类型同步。
4. `src/renderer/composables/github/use-pull-requests.ts`：查询 + 变更封装。

## 渲染层（packages/client/src/renderer）

### 选区状态：`composables/use-review-selection.ts`

```ts
interface ReviewSelection {
  owner: string
  repo: string
  number: number
  path: string
  side: GitHubPullRequestDiffSide
  startLine: number | null   // 多行时非 null，始终 <= line
  line: number
}
```

模块级 `ref`（同 `use-right-panel` 模式）。提供 `setSelection` / `clearSelection`。切换 PR、切换文件、右面板关闭时清除。

### diff 组件：`components/code/review-diff.vue`

- 输入：`patch`、`filename`、`threads`（本文件的线程，含行号/side/resolved/数量）、当前选区。
- 渲染：`parseDiff()` 得到行数组；shiki `codeToTokens` 对内容整体高亮后按行切分（加载失败回退纯文本）；`v-for` 逐行渲染。
- 每行结构：旧行号列 + 新行号列（gutter）+ 内容。add/context 行锚定 RIGHT（newLine），del 行锚定 LEFT（oldLine），hunk 行不可锚定。
- 交互：
  - 点击行号：选中单行（写入选区 composable，side 由行类型决定）。
  - 拖拽行号：同 side 连续范围选择（mousedown 起点 → mouseover 更新 → mouseup 落定）。
  - 选中行整行高亮（语义 token：`--ui-selected` 阶梯）。
  - 有线程的行在 gutter 显示标记（图标 + 数量，resolved 弱化）；点击标记发出 `locate-thread` 事件。
- 纯逻辑（选区状态机、行锚定判定）抽到 `review-diff-selection.ts` 以便单测。

### 右侧面板：`'pull-request-diff'` 内容类型

`use-right-panel.ts` 增加类型：`{ type: 'pull-request-diff', owner, repo, number, path, patch, additions?, deletions?, title? }`。

新面板组件 `pull-request-diff-panel.vue`：

- 用共享的 `usePullRequestReviewThreadsQuery` 取线程，过滤出当前 path 的线程传给 `review-diff`。
- 读写 `use-review-selection`。
- `locate-thread` 事件 → 通过共享事件/状态通知 Review 页滚动定位并高亮对应线程卡片。

`changed-files-tree.vue` 增加可选 prop（如 `review: { number } | undefined`）：提供时点文件打开 `'pull-request-diff'` 而非通用 `'diff'`（commit 场景不受影响）。

### Review 标签页（pull-request-review-tab.vue）

1. **Composer 扩展**（复用 `ConversationCommentComposer`）：
   - 有选区：composer 上方显示锚定 chip——`路径 L{start}–L{line}`（单行 `L{line}`）+ 清除按钮；按钮组切换为「单条评论」（有 pending 时禁用并提示）与「加入 Review」。
   - 无选区：保持现状（Comment / Request changes / Approve）。
2. **Pending review 状态条**：存在 pending review 时显示「N 条待提交评论」+「提交 Review」（选 event + 可选总结正文）+「丢弃」（带确认）。提交走 `submitPendingPullRequestReview`。
3. **线程列表**：按文件分组；每个线程卡片含：行号范围、outdated / resolved / pending 徽标、评论列表（markdown 渲染、作者、时间）、回复输入框、resolve/unresolve 按钮（按 `viewerCan*` 显示）。resolved 线程默认折叠。
4. 所有变更后失效 `review-threads` 查询与 PR detail 查询（时间线含 review 事件）。

### 查询与变更（use-pull-requests.ts）

- `usePullRequestReviewThreadsQuery(owner, repo, number, active)`，key：`['github', 'pull-request-review-threads', owner, repo, number]`。
- 变更函数：`addReviewThread`、`replyToReviewThread`、`resolveReviewThread`、`unresolveReviewThread`、`submitPendingReview`、`discardPendingReview`。每个变更后 `invalidateQueries`（threads key + detail key，`refetchActive: 'all'`）。

### i18n

全部新文案进 `en.json` 与 `zh-CN`（以仓库现有 locale 文件为准）双语。

## 数据流示例

**单条即发**：diff 拖选 L10–L15 → 选区 composable 更新 → Review 页 composer 显示锚定 chip → 输入正文 → 点「单条评论」→ `addPullRequestReviewThread(mode: 'single')` → GraphQL `addPullRequestReview(event: COMMENT, threads: [...])` → 失效 threads + detail 查询 → 清除选区 → diff 对应行出现标记，Review 页列表出现线程。

**批量 review**：同上但点「加入 Review」→ 首条创建 pending review，后续追加 → 状态条显示待提交数 → 「提交 Review」选 Approve/Comment/Request changes（+ 总结正文）→ GraphQL submit → pending 清空，线程转为已发布。

## 错误处理

- 单条即发遇到已有 pending（422/GraphQL 错误）：composer 显示错误文案（正常情况下按钮已禁用，此为兜底）。
- 行号在最新 head 上已失效（force-push 等导致 position 错误）：composer 显示「所选行已过期，请重新选择」类错误。
- resolve/unresolve 权限：按 `viewerCanResolve` / `viewerCanUnresolve` 隐藏按钮。
- 线程查询失败：Review 页线程区显示错误态 + 重试（沿用文件树区既有模式）。

## 测试与验收

- api 包：GraphQL 映射与选项组装单测（沿既有 `pulls.mutations.test.ts` 模式）；Mock 客户端补齐同名方法与 mock 数据。
- 渲染层：`review-diff-selection.ts` 选区状态机单测；锚定 side 判定单测。
- 验收命令：`pnpm typecheck`、`pnpm --filter @oh-my-github/client build`、`pnpm --filter @oh-my-github/api test`（如有 test script）。
- 手工验收路径：打开 PR → Review 页 → 点文件 → 拖选行 → 单条评论 / 加入 review → 提交 / 丢弃 → 回复 / resolve。

## 明确不做（v1）

- 跨 side 的多行范围评论。
- 回复攒入 pending review（回复一律立即发布）。
- diff 内嵌线程展开（线程只在 Review 页展示）。
- 编辑 / 删除已发布的行级评论。
- 时间线（conversations 页）中行级线程的交互增强。
