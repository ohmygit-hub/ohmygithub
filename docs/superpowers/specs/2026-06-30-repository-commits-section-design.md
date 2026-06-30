# Repository Commits Section — 设计文档

- 日期：2026-06-30
- 范围：在 repo 页面左侧栏新增一个 **Commits** section，展示所选分支的提交列表（仿 GitHub）。
- 明确不做：commit diff 详情页（点击行的跳转目标）本期不实现，仅预留点击逻辑。

## 1. 目标与决策

新增一个仓库 section，渲染所选分支的提交列表，特性：

- **位置**：左侧 `SectionSidebar` 中放在 `files` 之后（同属"代码"类）。
- **分支选择**：顶部带一个**可搜索的分支下拉**，默认选中仓库默认分支。封装成可复用的共享组件 `GitHubBranchSelect`，供其他页面将来复用。
- **翻页**：**上一页 / 下一页**（GitHub 风格）。因为 GitHub commits REST 接口不返回总数，无法复用现有"页码 + 总数"的 `AppPagination`。
- **行点击**：预留 `openCommit(commit)` 处理函数，当前为空操作；未来接 diff 页只需填入跳转，无需改动行/列表组件。
- **每行展示**：作者头像、commit 首行消息（headline，截断）、作者 login、相对提交时间、短 SHA（等宽）、复制 SHA 按钮。
- **快捷键**：section 快捷键**重新编号**，commits 取 `3`，其后顺延（见 §6）。

## 2. 架构与数据流

新增两类数据：**commits** 和 **branches**。两者都沿用现有 `listFiles` 已验证的纵向链路：

```
api/modules/repositories.ts
  -> client.ts (真实实现) + mock.ts (mock 实现)
  -> main/repositories.ts (IPC handler)
  -> preload/index.ts (bridge)
  -> renderer/env.d.ts (window.ohMyGithub.repositories 类型)
  -> composables/github/use-repositories.ts (Pinia-Colada query)
  -> repository/components/commits/* (UI)
```

### 2.1 API 层（`packages/api`）

**`types.ts` 新增类型：**

```ts
export interface GitHubRepositoryCommitAuthor {
  login: string | null          // 非 GitHub 账号时为 null
  name: string | null           // git commit author name
  avatarUrl: string | null
}

export interface GitHubRepositoryCommit {
  sha: string
  shortSha: string              // sha.slice(0, 7)
  message: string               // 完整 commit message
  headline: string              // message 首行
  author: GitHubRepositoryCommitAuthor
  committedDate: string         // ISO 字符串
  htmlUrl: string
}

export interface GitHubRepositoryCommitPage {
  items: GitHubRepositoryCommit[]
  page: number
  perPage: number
  hasPreviousPage: boolean      // page > 1
  hasNextPage: boolean          // items.length === perPage
}

export interface GitHubRepositoryBranch {
  name: string
  commitSha: string
}

export interface RepositoryCommitsOptions extends RepositoryOptions {
  ref?: string | null           // 分支名；空则解析默认分支
  page?: number                 // 默认 1
  perPage?: number              // 默认 30
}

export type RepositoryBranchesOptions = RepositoryOptions
```

在 `GitHubApi` interface 增加：

```ts
listRepositoryCommits(options: RepositoryCommitsOptions): Promise<GitHubRepositoryCommitPage>
listRepositoryBranches(options: RepositoryBranchesOptions): Promise<GitHubRepositoryBranch[]>
```

**`modules/repositories.ts` 新增方法：**

- `listCommits(options)`：`GET /repos/{owner}/{repo}/commits`，参数 `sha=ref`（复用 `resolveRepositoryRef` 取默认分支）、`page`、`per_page`。映射响应为 `GitHubRepositoryCommit`：
  - `sha` → `sha` / `shortSha`
  - `commit.message` → `message`，首行 → `headline`
  - 优先用顶层 `author`（GitHub 账号：`login` / `avatar_url`），否则回退 `commit.author.name`
  - `commit.committer.date`（或 `commit.author.date`）→ `committedDate`
  - `html_url` → `htmlUrl`
  - 翻页标志：`hasNextPage = items.length === perPage`，`hasPreviousPage = page > 1`
- `listBranches(options)`：`GET /repos/{owner}/{repo}/branches?per_page=100`，映射为 `{ name, commitSha }`，本期只取第一页（最多 100）。

**`client.ts`**：把 `listRepositoryCommits` / `listRepositoryBranches` 接到 `RepositoriesApi` 对应方法。

**`mock.ts`**：补两个 mock 实现（`GitHubApi` interface 要求，否则 typecheck 不过），返回若干示例 commit / branch。

### 2.2 Main 进程（`packages/client/src/main/repositories.ts`）

新增两个 handler，沿用 `normalizeRepository` / `normalizeRepositoryRef` / `createAuthenticatedGitHubApi`：

- `repositories:list-commits`（owner, repo, ref?, page?, perPage?）
- `repositories:list-branches`（owner, repo）

并在 `registerRepositoriesIpc()` 注册。

### 2.3 Preload（`packages/client/src/preload/index.ts`）

在 `repositories` 块新增：

```ts
listCommits: (owner: string, repo: string, ref?: string | null, page?: number, perPage?: number) =>
  ipcRenderer.invoke('repositories:list-commits', owner, repo, ref, page, perPage),
listBranches: (owner: string, repo: string) =>
  ipcRenderer.invoke('repositories:list-branches', owner, repo),
```

### 2.4 Renderer 类型（`packages/client/src/renderer/env.d.ts`）

在 `repositories` 类型里增加对应签名：

```ts
listCommits: (
  owner: string, repo: string, ref?: string | null, page?: number, perPage?: number
) => Promise<GitHubRepositoryCommitPage>
listBranches: (owner: string, repo: string) => Promise<GitHubRepositoryBranch[]>
```

### 2.5 Composables（`composables/github/use-repositories.ts`）

- `useRepositoryCommitsQuery(owner, repo, ref, page, perPage, enabled)`：query key 含全部参数（owner / repo / ref / page / perPage）；`enabled` 要求 owner、repo 存在。
- `useRepositoryBranchesQuery(owner, repo, enabled)`：key 为 `['github','repository','branches',owner,repo]`，`staleTime` 取较长（分支列表变动不频繁）。

## 3. 共享分支选择器组件

- 新增 `components/github/github-branch-select.vue`，从 `components/index.ts` 导出为 **`GitHubBranchSelect`**（与 `GitHubActorLink` / `RepositoryCard` 同目录、同导出方式）。
- 基于 UI 包的 `Popover` + `Command` 实现**可搜索下拉**：触发器显示当前分支，展开后是带搜索框的分支列表，客户端按输入过滤。
- Props：`owner: string`、`repo: string`、`modelValue: string | null`（当前分支）、`defaultBranch?: string | null`。
- Emit：`update:modelValue`（选中分支名）。
- 自包含数据获取：内部使用 `useRepositoryBranchesQuery(owner, repo)`；列表加载中 / 出错有相应态；默认选中 `defaultBranch`（或第一个分支）。
- 设计为通用、可复用（Files section 以后可改用它，本期不改 Files）。

## 4. Commits 组件（`repository/components/commits/`）

仿照 `pulls/` 的 `section -> list -> row` 三层结构：

- **`section.vue`**：
  - 持有 `ref`（选中分支，初值 = props 传入的默认分支）与 `page`（初值 1）状态。
  - 头部：`GitHubBranchSelect` + 简短计数/分支标签。
  - 数据：`useRepositoryCommitsQuery`。
  - owner / repo / 分支变化时 `page` 重置为 1。
  - 把 `openCommit(commit)` 传给 list/row（当前为空操作占位，留 TODO 注释指向未来 diff 路由）。
  - props：`owner`、`repo`、`defaultBranch`。
- **`list.vue`**：loading 骨架 / 无 identity / error（带重试）/ empty / 列表；底部 **上一页 / 下一页** 控件（新写一个轻量 prev-next，依据 `hasPreviousPage` / `hasNextPage` 禁用按钮，不依赖总数）。
- **`row.vue`**：`grid` 布局 —— 作者（`author.login` 存在时用 `GitHubActorLink` 显示头像 + login；为 null 时回退显示 `author.name` 纯文本 + 通用头像占位）、headline（截断）、相对提交时间、短 SHA（等宽）+ 复制 SHA 按钮。整行 `role="button"`，点击 / Enter / Space emit `select(commit)`。复制 SHA 按钮独立点击且 `stopPropagation`，避免触发行点击。

## 5. 接入 Sidebar / 路由 / i18n

- `workspace/types.ts`：`RepositoryTabId` 增加 `'commits'`。
- `repository/repository-page.vue`：
  - `repositorySections` 在 `files` 后插入 `{ id: 'commits', icon: GitCommitHorizontal }`（lucide 图标）。
  - `sectionShortcutIds` record 增加 `commits: 'repository.section.commits'`（该 record 对 `RepositorySectionId` 穷举，必须补，否则 typecheck 失败）。
  - 模板新增 `<CommitsSection v-else-if="activeSection === 'commits'" :owner :repo :default-branch="overview?.defaultBranch ?? null" />`。
- `workspace/workspace-url.ts`：`sanitizeRepositorySection` 增加 `if (value === 'commits') return 'commits'`；`repositorySectionToQuery` 中 `commits` 直接映射为 `'commits'`（无特殊处理）。
- i18n `i18n/locales/en.json` + `zh.json`：
  - `repository.sections.commits.title`
  - `repository.commits.*` 文案块：分支选择器（占位 / 搜索框 placeholder / 空 / 加载失败）、列表（empty / error / retry / missingIdentity）、`meta.committed`（`committed {date}` 相对时间）、`copySha` / `copied`、分页（`previous` / `next`）。
  - `settings.keyboard.commands.repositorySectionCommits.{label,description}`。

## 6. 快捷键重新编号

`keyboard/shortcut-definitions.ts`：

- union 增加 `'repository.section.commits'`。
- 定义条目按侧栏顺序**重新编号**（commits 插入 files 之后）：

  | section | 旧 accelerator | 新 accelerator |
  |---|---|---|
  | overview | 1 | 1 |
  | files | 2 | 2 |
  | **commits** | — | **3** |
  | pullRequests | 3 | 4 |
  | issues | 4 | 5 |
  | actions | 5 | 6 |
  | settings | 6 | 7 |

- 已知影响：pullRequests / issues / actions / settings 的默认快捷键各后移一位。可接受（应用尚为 v0.1，且数字与侧栏顺序保持一致更直观）。

## 7. 测试与验证

仓库当前**没有测试框架**（无 vitest / jest，无 `*.test.ts`）。验证手段：

- `pnpm typecheck`（即 `pnpm lint`，`pnpm -r typecheck`）：确认 api → main → preload → env.d.ts → composable → 组件 全链路类型打通，且新增 interface 方法在 client.ts 与 mock.ts 都已实现。
- dev 模式手动冒烟：
  - 打开任意 repo，切到 Commits section。
  - 默认分支加载提交；切换分支（搜索 + 选择）后列表刷新、page 重置。
  - 上一页 / 下一页：首页禁用"上一页"，末页（返回数 < perPage）禁用"下一页"。
  - 空仓库 / 网络错误 → 对应空态 / 错误态 + 重试。
  - 点击行 → 当前无跳转（预留）；复制 SHA 按钮可用且不触发行点击。
  - 快捷键 1–7 切换 section 正确。

## 8. 不在本期范围

- commit diff / 详情页及其路由。
- 分支列表超过 100 的分页 / 服务端搜索（本期取前 100 + 客户端过滤）。
- 按作者 / 路径 / 时间过滤提交。
- 将 Files section 迁移到新的 `GitHubBranchSelect`（组件已设计为可复用，但本期不改 Files）。
