# Repository Settings 阶段 2(General 页)Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `settingsGeneral` 分类页从外链壳替换为原生实现:基本信息 / 默认分支 / Features / Pull Requests / Releases 表单 + Danger Zone(改可见性、转移、归档、删除,输全名确认),并补 `delete_repo` OAuth scope。

**Architecture:** 新增 api 命名空间模块 `repositorySettings`(只挂 `GitHubApi` 命名空间,不动扁平 `GitHubClient`——该接口仅被无人消费的 `MockGitHubClient` 实现)→ main IPC `repository-settings:*` → preload `window.ohMyGithub.repositorySettings` → composable `use-repository-settings.ts`(pinia-colada query + 平凡 async 函数,沿 use-repositories 的模式)→ `settings/general/` 组件组。Discussions/Sponsorships 开关走 GraphQL `updateRepository`(REST PATCH 无此字段);其余走 `PATCH /repos`。

**Tech Stack:** 同阶段 1;开关用 `@oh-my-github/ui` 的 `Switch`,下拉一律 reka-ui `Select`(不用 NativeSelect),topics 用 `TagsInput`,确认对话框仿 `branches/delete-ref-dialog.vue`,分支重命名复用 `branches/rename-branch-dialog.vue`。

## Global Constraints

- 每个 Task 结束必须通过:`pnpm --filter @oh-my-github/api test && pnpm --filter @oh-my-github/api typecheck`(涉及 api 时)、`pnpm --filter @oh-my-github/client test && pnpm --filter @oh-my-github/client typecheck`。
- i18n en/zh 同步;`@` 写 `{'@'}`。
- 表单不套圆角边框卡片;bordered 容器只放列表行(Danger Zone 的 destructive 边框容器内是操作行,符合约定)。
- `env.d.ts` 与 `packages/api/src/mock.ts` 是手工副本——改 api 类型时同步(mock 本阶段无需新增方法,因为不动 `GitHubClient` 扁平接口)。
- GraphQL 变量不得命名为 `query`/`method`/`url`。
- Commit 尾部加 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。
- 完成后提醒用户重启 dev 实例(api/main 改动 HMR 不生效)。

---

### Task 1: api 模块 `repository-settings.general.ts`(TDD)

**Files:**
- Modify: `packages/api/src/types.ts`(新类型,加在 `GitHubRepositoryOverview` 定义之后)
- Create: `packages/api/src/modules/repository-settings.general.ts`
- Create: `packages/api/src/modules/repository-settings.general.test.ts`
- Modify: `packages/api/src/client.ts`(挂命名空间)
- Modify: `packages/api/src/modules/auth.ts`(`defaultGitHubOAuthScopes` 追加 `delete_repo`)

**Interfaces:**
- Consumes: `RepositoryOptions`(types.ts 已有)、`GitHubOctokit`
- Produces:
  - `GitHubRepositoryGeneralSettings`(见 Step 3,含 `repositoryNodeId`)
  - `UpdateRepositoryGeneralSettingsInput`(全可选 camel 字段)
  - `TransferRepositoryOptions extends RepositoryOptions { newOwner: string; newName?: string }`
  - class `RepositorySettingsApi`:`getGeneralSettings(o)` / `updateGeneralSettings(o & {input})` / `replaceTopics(o & {names})` / `setDiscussionsEnabled({repositoryNodeId, enabled})` / `setSponsorshipsEnabled({repositoryNodeId, enabled})` / `setImmutableReleases(o & {enabled})` / `transferRepository(o)` / `deleteRepository(o)`
  - `GitHubApi.repositorySettings: RepositorySettingsApi`

- [ ] **Step 1: 写失败测试** `repository-settings.general.test.ts`

```ts
import { describe, expect, it, vi } from 'vitest'
import type { GitHubOctokit } from '../transport'
import { RepositorySettingsApi } from './repository-settings.general'

describe('RepositorySettingsApi general', () => {
  it('maps general settings from REST, GraphQL, and immutable releases probes', async () => {
    const { api, request, graphql } = createApi()

    const settings = await api.getGeneralSettings({ owner: 'octo-org', repo: 'hello-world' })

    expect(request).toHaveBeenCalledWith('GET /repos/{owner}/{repo}', {
      owner: 'octo-org',
      repo: 'hello-world',
    })
    expect(graphql).toHaveBeenCalledWith(expect.stringContaining('hasSponsorshipsEnabled'), {
      owner: 'octo-org',
      repo: 'hello-world',
    })
    expect(settings).toMatchObject({
      repositoryNodeId: 'R_node1',
      name: 'hello-world',
      description: 'A test repository',
      homepage: 'https://example.dev',
      visibility: 'public',
      isArchived: false,
      isTemplate: false,
      webCommitSignoffRequired: true,
      defaultBranch: 'main',
      topics: ['vue', 'electron'],
      hasIssues: true,
      hasWiki: false,
      hasProjects: true,
      hasDiscussions: true,
      hasSponsorships: true,
      allowMergeCommit: true,
      allowSquashMerge: true,
      allowRebaseMerge: false,
      allowAutoMerge: true,
      deleteBranchOnMerge: true,
      allowUpdateBranch: true,
      squashMergeCommitTitle: 'PR_TITLE',
      squashMergeCommitMessage: 'COMMIT_MESSAGES',
      mergeCommitTitle: 'MERGE_MESSAGE',
      mergeCommitMessage: 'PR_TITLE',
      immutableReleases: true,
    })
  })

  it('tolerates missing sponsorships data and immutable releases probe failures', async () => {
    const { api } = createApi({ sponsorshipsError: true, immutableStatus: 'error' })

    const settings = await api.getGeneralSettings({ owner: 'octo-org', repo: 'hello-world' })

    expect(settings.hasSponsorships).toBeNull()
    expect(settings.immutableReleases).toBeNull()
  })

  it('reports immutable releases disabled on 404', async () => {
    const { api } = createApi({ immutableStatus: 404 })

    const settings = await api.getGeneralSettings({ owner: 'octo-org', repo: 'hello-world' })

    expect(settings.immutableReleases).toBe(false)
  })

  it('patches only the provided general settings fields with snake_case names', async () => {
    const { api, request } = createApi()

    await api.updateGeneralSettings({
      owner: 'octo-org',
      repo: 'hello-world',
      input: {
        description: 'new description',
        hasWiki: false,
        allowSquashMerge: true,
        squashMergeCommitTitle: 'COMMIT_OR_PR_TITLE',
        webCommitSignoffRequired: false,
      },
    })

    expect(request).toHaveBeenCalledWith('PATCH /repos/{owner}/{repo}', {
      owner: 'octo-org',
      repo: 'hello-world',
      description: 'new description',
      has_wiki: false,
      allow_squash_merge: true,
      squash_merge_commit_title: 'COMMIT_OR_PR_TITLE',
      web_commit_signoff_required: false,
    })
  })

  it('replaces topics, toggles immutable releases, transfers, and deletes', async () => {
    const { api, request } = createApi()

    await api.replaceTopics({ owner: 'octo-org', repo: 'hello-world', names: ['vue'] })
    expect(request).toHaveBeenCalledWith('PUT /repos/{owner}/{repo}/topics', {
      owner: 'octo-org',
      repo: 'hello-world',
      names: ['vue'],
    })

    await api.setImmutableReleases({ owner: 'octo-org', repo: 'hello-world', enabled: true })
    expect(request).toHaveBeenCalledWith('PUT /repos/{owner}/{repo}/immutable-releases', {
      owner: 'octo-org',
      repo: 'hello-world',
    })

    await api.setImmutableReleases({ owner: 'octo-org', repo: 'hello-world', enabled: false })
    expect(request).toHaveBeenCalledWith('DELETE /repos/{owner}/{repo}/immutable-releases', {
      owner: 'octo-org',
      repo: 'hello-world',
    })

    await api.transferRepository({ owner: 'octo-org', repo: 'hello-world', newOwner: 'acbox', newName: 'renamed' })
    expect(request).toHaveBeenCalledWith('POST /repos/{owner}/{repo}/transfer', {
      owner: 'octo-org',
      repo: 'hello-world',
      new_owner: 'acbox',
      new_name: 'renamed',
    })

    await api.deleteRepository({ owner: 'octo-org', repo: 'hello-world' })
    expect(request).toHaveBeenCalledWith('DELETE /repos/{owner}/{repo}', {
      owner: 'octo-org',
      repo: 'hello-world',
    })
  })

  it('toggles discussions and sponsorships through the GraphQL updateRepository mutation', async () => {
    const { api, graphql } = createApi()

    await api.setDiscussionsEnabled({ repositoryNodeId: 'R_node1', enabled: true })
    expect(graphql).toHaveBeenCalledWith(expect.stringContaining('hasDiscussionsEnabled'), {
      repositoryId: 'R_node1',
      enabled: true,
    })

    await api.setSponsorshipsEnabled({ repositoryNodeId: 'R_node1', enabled: false })
    expect(graphql).toHaveBeenCalledWith(expect.stringContaining('hasSponsorshipsEnabled'), {
      repositoryId: 'R_node1',
      enabled: false,
    })
  })
})

function createApi(overrides: { sponsorshipsError?: boolean; immutableStatus?: 204 | 404 | 'error' } = {}) {
  const immutableStatus = overrides.immutableStatus ?? 204
  const request = vi.fn(async (route: string) => {
    if (route === 'GET /repos/{owner}/{repo}') {
      return {
        data: {
          node_id: 'R_node1',
          name: 'hello-world',
          description: 'A test repository',
          homepage: 'https://example.dev',
          visibility: 'public',
          archived: false,
          is_template: false,
          web_commit_signoff_required: true,
          default_branch: 'main',
          topics: ['vue', 'electron'],
          has_issues: true,
          has_wiki: false,
          has_projects: true,
          has_discussions: true,
          allow_merge_commit: true,
          allow_squash_merge: true,
          allow_rebase_merge: false,
          allow_auto_merge: true,
          delete_branch_on_merge: true,
          allow_update_branch: true,
          squash_merge_commit_title: 'PR_TITLE',
          squash_merge_commit_message: 'COMMIT_MESSAGES',
          merge_commit_title: 'MERGE_MESSAGE',
          merge_commit_message: 'PR_TITLE',
        },
      }
    }

    if (route === 'GET /repos/{owner}/{repo}/immutable-releases') {
      if (immutableStatus === 204) return { status: 204 }
      const error = new Error(immutableStatus === 404 ? 'Not Found' : 'boom') as Error & { status?: number }
      if (immutableStatus === 404) error.status = 404
      throw error
    }

    return { data: {}, status: 204 }
  })
  const graphql = vi.fn(async (document: string) => {
    if (document.includes('hasSponsorshipsEnabled') && !document.includes('mutation')) {
      if (overrides.sponsorshipsError) throw new Error('forbidden')
      return { repository: { hasSponsorshipsEnabled: true } }
    }
    return { updateRepository: { repository: { id: 'R_node1' } } }
  })
  const octokit = { request, graphql } as unknown as GitHubOctokit

  return { api: new RepositorySettingsApi(octokit), request, graphql }
}
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter @oh-my-github/api exec vitest run src/modules/repository-settings.general.test.ts`
Expected: FAIL(模块不存在)。

- [ ] **Step 3: types.ts 新增类型**(`GitHubRepositoryOverview` 接口之后)

```ts
export type GitHubSquashMergeCommitTitle = 'PR_TITLE' | 'COMMIT_OR_PR_TITLE'
export type GitHubSquashMergeCommitMessage = 'PR_BODY' | 'COMMIT_MESSAGES' | 'BLANK'
export type GitHubMergeCommitTitle = 'PR_TITLE' | 'MERGE_MESSAGE'
export type GitHubMergeCommitMessage = 'PR_BODY' | 'PR_TITLE' | 'BLANK'

export interface GitHubRepositoryGeneralSettings {
  repositoryNodeId: string
  name: string
  description: string | null
  homepage: string | null
  visibility: 'public' | 'private'
  isArchived: boolean
  isTemplate: boolean
  webCommitSignoffRequired: boolean
  defaultBranch: string | null
  topics: string[]
  hasIssues: boolean
  hasWiki: boolean
  hasProjects: boolean
  hasDiscussions: boolean
  hasSponsorships: boolean | null
  allowMergeCommit: boolean
  allowSquashMerge: boolean
  allowRebaseMerge: boolean
  allowAutoMerge: boolean
  deleteBranchOnMerge: boolean
  allowUpdateBranch: boolean
  squashMergeCommitTitle: GitHubSquashMergeCommitTitle | null
  squashMergeCommitMessage: GitHubSquashMergeCommitMessage | null
  mergeCommitTitle: GitHubMergeCommitTitle | null
  mergeCommitMessage: GitHubMergeCommitMessage | null
  immutableReleases: boolean | null
}

export interface UpdateRepositoryGeneralSettingsInput {
  name?: string
  description?: string
  homepage?: string
  visibility?: 'public' | 'private'
  archived?: boolean
  isTemplate?: boolean
  webCommitSignoffRequired?: boolean
  defaultBranch?: string
  hasIssues?: boolean
  hasWiki?: boolean
  hasProjects?: boolean
  allowMergeCommit?: boolean
  allowSquashMerge?: boolean
  allowRebaseMerge?: boolean
  allowAutoMerge?: boolean
  deleteBranchOnMerge?: boolean
  allowUpdateBranch?: boolean
  squashMergeCommitTitle?: GitHubSquashMergeCommitTitle
  squashMergeCommitMessage?: GitHubSquashMergeCommitMessage
  mergeCommitTitle?: GitHubMergeCommitTitle
  mergeCommitMessage?: GitHubMergeCommitMessage
}

export interface TransferRepositoryOptions extends RepositoryOptions {
  newOwner: string
  newName?: string
}

export interface SetRepositoryFeatureNodeOptions {
  repositoryNodeId: string
  enabled: boolean
}
```

- [ ] **Step 4: 实现 `repository-settings.general.ts`**

```ts
import type { GitHubOctokit } from '../transport'
import type {
  GitHubRepositoryGeneralSettings,
  RepositoryOptions,
  SetRepositoryFeatureNodeOptions,
  TransferRepositoryOptions,
  UpdateRepositoryGeneralSettingsInput,
} from '../types'

interface GeneralSettingsResponse {
  node_id?: string
  name?: string
  description?: string | null
  homepage?: string | null
  visibility?: string | null
  archived?: boolean
  is_template?: boolean
  web_commit_signoff_required?: boolean
  default_branch?: string | null
  topics?: string[]
  has_issues?: boolean
  has_wiki?: boolean
  has_projects?: boolean
  has_discussions?: boolean
  allow_merge_commit?: boolean
  allow_squash_merge?: boolean
  allow_rebase_merge?: boolean
  allow_auto_merge?: boolean
  delete_branch_on_merge?: boolean
  allow_update_branch?: boolean
  squash_merge_commit_title?: string | null
  squash_merge_commit_message?: string | null
  merge_commit_title?: string | null
  merge_commit_message?: string | null
}

interface SponsorshipsResponse {
  repository?: { hasSponsorshipsEnabled?: boolean | null } | null
}

const sponsorshipsQuery = `
  query RepositorySponsorships($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      hasSponsorshipsEnabled
    }
  }
`

const discussionsMutation = `
  mutation UpdateRepositoryDiscussions($repositoryId: ID!, $enabled: Boolean!) {
    updateRepository(input: { repositoryId: $repositoryId, hasDiscussionsEnabled: $enabled }) {
      repository { id }
    }
  }
`

const sponsorshipsMutation = `
  mutation UpdateRepositorySponsorships($repositoryId: ID!, $enabled: Boolean!) {
    updateRepository(input: { repositoryId: $repositoryId, hasSponsorshipsEnabled: $enabled }) {
      repository { id }
    }
  }
`

const GENERAL_SETTINGS_FIELD_MAP: Record<keyof UpdateRepositoryGeneralSettingsInput, string> = {
  name: 'name',
  description: 'description',
  homepage: 'homepage',
  visibility: 'visibility',
  archived: 'archived',
  isTemplate: 'is_template',
  webCommitSignoffRequired: 'web_commit_signoff_required',
  defaultBranch: 'default_branch',
  hasIssues: 'has_issues',
  hasWiki: 'has_wiki',
  hasProjects: 'has_projects',
  allowMergeCommit: 'allow_merge_commit',
  allowSquashMerge: 'allow_squash_merge',
  allowRebaseMerge: 'allow_rebase_merge',
  allowAutoMerge: 'allow_auto_merge',
  deleteBranchOnMerge: 'delete_branch_on_merge',
  allowUpdateBranch: 'allow_update_branch',
  squashMergeCommitTitle: 'squash_merge_commit_title',
  squashMergeCommitMessage: 'squash_merge_commit_message',
  mergeCommitTitle: 'merge_commit_title',
  mergeCommitMessage: 'merge_commit_message',
}

export class RepositorySettingsApi {
  constructor(private readonly octokit: GitHubOctokit) {}

  async getGeneralSettings(options: RepositoryOptions): Promise<GitHubRepositoryGeneralSettings> {
    const [response, hasSponsorships, immutableReleases] = await Promise.all([
      this.octokit.request('GET /repos/{owner}/{repo}', {
        owner: options.owner,
        repo: options.repo,
      }),
      this.getSponsorshipsEnabled(options),
      this.getImmutableReleases(options),
    ])
    const repository = response.data as GeneralSettingsResponse

    return {
      repositoryNodeId: repository.node_id ?? '',
      name: repository.name ?? options.repo,
      description: repository.description ?? null,
      homepage: repository.homepage?.trim() ? repository.homepage : null,
      visibility: repository.visibility === 'private' ? 'private' : 'public',
      isArchived: Boolean(repository.archived),
      isTemplate: Boolean(repository.is_template),
      webCommitSignoffRequired: Boolean(repository.web_commit_signoff_required),
      defaultBranch: repository.default_branch ?? null,
      topics: repository.topics ?? [],
      hasIssues: Boolean(repository.has_issues),
      hasWiki: Boolean(repository.has_wiki),
      hasProjects: Boolean(repository.has_projects),
      hasDiscussions: Boolean(repository.has_discussions),
      hasSponsorships,
      allowMergeCommit: Boolean(repository.allow_merge_commit),
      allowSquashMerge: Boolean(repository.allow_squash_merge),
      allowRebaseMerge: Boolean(repository.allow_rebase_merge),
      allowAutoMerge: Boolean(repository.allow_auto_merge),
      deleteBranchOnMerge: Boolean(repository.delete_branch_on_merge),
      allowUpdateBranch: Boolean(repository.allow_update_branch),
      squashMergeCommitTitle: normalizeEnum(repository.squash_merge_commit_title, ['PR_TITLE', 'COMMIT_OR_PR_TITLE']),
      squashMergeCommitMessage: normalizeEnum(repository.squash_merge_commit_message, ['PR_BODY', 'COMMIT_MESSAGES', 'BLANK']),
      mergeCommitTitle: normalizeEnum(repository.merge_commit_title, ['PR_TITLE', 'MERGE_MESSAGE']),
      mergeCommitMessage: normalizeEnum(repository.merge_commit_message, ['PR_BODY', 'PR_TITLE', 'BLANK']),
      immutableReleases,
    }
  }

  async updateGeneralSettings(
    options: RepositoryOptions & { input: UpdateRepositoryGeneralSettingsInput },
  ): Promise<void> {
    const payload: Record<string, unknown> = {
      owner: options.owner,
      repo: options.repo,
    }

    for (const [key, restField] of Object.entries(GENERAL_SETTINGS_FIELD_MAP)) {
      const value = options.input[key as keyof UpdateRepositoryGeneralSettingsInput]
      if (value !== undefined) {
        payload[restField] = value
      }
    }

    await this.octokit.request('PATCH /repos/{owner}/{repo}', payload)
  }

  async replaceTopics(options: RepositoryOptions & { names: string[] }): Promise<void> {
    await this.octokit.request('PUT /repos/{owner}/{repo}/topics', {
      owner: options.owner,
      repo: options.repo,
      names: options.names,
    })
  }

  async setDiscussionsEnabled(options: SetRepositoryFeatureNodeOptions): Promise<void> {
    await this.octokit.graphql(discussionsMutation, {
      repositoryId: options.repositoryNodeId,
      enabled: options.enabled,
    })
  }

  async setSponsorshipsEnabled(options: SetRepositoryFeatureNodeOptions): Promise<void> {
    await this.octokit.graphql(sponsorshipsMutation, {
      repositoryId: options.repositoryNodeId,
      enabled: options.enabled,
    })
  }

  async setImmutableReleases(options: RepositoryOptions & { enabled: boolean }): Promise<void> {
    const route = options.enabled
      ? 'PUT /repos/{owner}/{repo}/immutable-releases'
      : 'DELETE /repos/{owner}/{repo}/immutable-releases'

    await this.octokit.request(route, {
      owner: options.owner,
      repo: options.repo,
    })
  }

  async transferRepository(options: TransferRepositoryOptions): Promise<void> {
    const payload: Record<string, unknown> = {
      owner: options.owner,
      repo: options.repo,
      new_owner: options.newOwner,
    }
    if (options.newName?.trim()) {
      payload.new_name = options.newName.trim()
    }

    await this.octokit.request('POST /repos/{owner}/{repo}/transfer', payload)
  }

  async deleteRepository(options: RepositoryOptions): Promise<void> {
    await this.octokit.request('DELETE /repos/{owner}/{repo}', {
      owner: options.owner,
      repo: options.repo,
    })
  }

  private async getSponsorshipsEnabled(options: RepositoryOptions): Promise<boolean | null> {
    try {
      const response = await this.octokit.graphql<SponsorshipsResponse>(sponsorshipsQuery, {
        owner: options.owner,
        repo: options.repo,
      })
      const enabled = response.repository?.hasSponsorshipsEnabled
      return typeof enabled === 'boolean' ? enabled : null
    } catch {
      return null
    }
  }

  private async getImmutableReleases(options: RepositoryOptions): Promise<boolean | null> {
    try {
      await this.octokit.request('GET /repos/{owner}/{repo}/immutable-releases', {
        owner: options.owner,
        repo: options.repo,
      })
      return true
    } catch (error) {
      if ((error as { status?: number }).status === 404) return false
      return null
    }
  }
}

function normalizeEnum<T extends string>(value: string | null | undefined, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null
}
```

- [ ] **Step 5: client.ts 挂命名空间**

import 区加 `import { RepositorySettingsApi } from './modules/repository-settings.general'`;`GitHubApi` 接口加 `readonly repositorySettings: RepositorySettingsApi`;工厂里 `const repositorySettings = new RepositorySettingsApi(octokit)` 并加入返回对象(放 `repositories,` 之后)。**不改** `GitHubClient` 扁平接口、不动 mock.ts。

- [ ] **Step 6: auth.ts 加 scope**

`defaultGitHubOAuthScopes` 数组追加 `'delete_repo'`(放 `'codespace:secrets'` 之后)。

- [ ] **Step 7: 验证 + Commit**

Run: `pnpm --filter @oh-my-github/api test && pnpm --filter @oh-my-github/api typecheck`
Expected: PASS。

```bash
git add packages/api/src
git commit -m "feat(api): add repository general settings module with GraphQL feature toggles

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: main IPC + preload + env.d.ts 全局类型

**Files:**
- Create: `packages/client/src/main/repository-settings.ts`
- Modify: `packages/client/src/main/index.ts`(import + 调用 `registerRepositorySettingsIpc()`,放 `registerRepositoriesIpc()` 之后)
- Modify: `packages/client/src/preload/index.ts`(`repositories` 命名空间之后加 `repositorySettings`)
- Modify: `packages/client/src/renderer/env.d.ts`(全局类型 + window 桥类型)

**Interfaces:**
- Consumes: Task 1 的 `RepositorySettingsApi` 与类型
- Produces: `window.ohMyGithub.repositorySettings` 桥:`getGeneral(owner, repo)` / `updateGeneral(owner, repo, input)` / `replaceTopics(owner, repo, names)` / `setDiscussions(repositoryNodeId, enabled)` / `setSponsorships(repositoryNodeId, enabled)` / `setImmutableReleases(owner, repo, enabled)` / `transfer(owner, repo, newOwner, newName?)` / `deleteRepository(owner, repo)`

- [ ] **Step 1: main IPC**(仿 `main/deployments.ts` 的鉴权与规范化模式:`createAuthenticatedGitHubApi` + `normalizeRepository`;两个辅助函数从 deployments.ts 同形复制)

```ts
import {
  createGitHubApi,
  type UpdateRepositoryGeneralSettingsInput,
} from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken } from './auth'
import { resolveGitHubProxyUrl } from './proxy'

export function registerRepositorySettingsIpc(): void {
  ipcMain.handle('repository-settings:get-general', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettings.getGeneralSettings(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:update-general',
    async (_event, owner: string, repo: string, input: UpdateRepositoryGeneralSettingsInput) =>
      (await createAuthenticatedGitHubApi()).repositorySettings.updateGeneralSettings({
        ...normalizeRepository(owner, repo),
        input,
      })
  )
  ipcMain.handle('repository-settings:replace-topics', async (_event, owner: string, repo: string, names: string[]) =>
    (await createAuthenticatedGitHubApi()).repositorySettings.replaceTopics({
      ...normalizeRepository(owner, repo),
      names: Array.isArray(names) ? names.map((name) => String(name).trim()).filter(Boolean) : [],
    })
  )
  ipcMain.handle('repository-settings:set-discussions', async (_event, repositoryNodeId: string, enabled: boolean) =>
    (await createAuthenticatedGitHubApi()).repositorySettings.setDiscussionsEnabled({
      repositoryNodeId: String(repositoryNodeId),
      enabled: Boolean(enabled),
    })
  )
  ipcMain.handle('repository-settings:set-sponsorships', async (_event, repositoryNodeId: string, enabled: boolean) =>
    (await createAuthenticatedGitHubApi()).repositorySettings.setSponsorshipsEnabled({
      repositoryNodeId: String(repositoryNodeId),
      enabled: Boolean(enabled),
    })
  )
  ipcMain.handle(
    'repository-settings:set-immutable-releases',
    async (_event, owner: string, repo: string, enabled: boolean) =>
      (await createAuthenticatedGitHubApi()).repositorySettings.setImmutableReleases({
        ...normalizeRepository(owner, repo),
        enabled: Boolean(enabled),
      })
  )
  ipcMain.handle(
    'repository-settings:transfer',
    async (_event, owner: string, repo: string, newOwner: string, newName?: string) =>
      (await createAuthenticatedGitHubApi()).repositorySettings.transferRepository({
        ...normalizeRepository(owner, repo),
        newOwner: String(newOwner).trim(),
        newName: newName ? String(newName).trim() : undefined,
      })
  )
  ipcMain.handle('repository-settings:delete', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettings.deleteRepository(normalizeRepository(owner, repo))
  )
}

async function createAuthenticatedGitHubApi() {
  const accessToken = await getAuthenticatedAccessToken()

  return createGitHubApi({
    accessToken,
    proxyUrl: resolveGitHubProxyUrl(),
  })
}

function normalizeRepository(owner: string, repo: string): { owner: string; repo: string } {
  const normalizedOwner = String(owner ?? '').trim()
  const normalizedRepo = String(repo ?? '').trim()
  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  return { owner: normalizedOwner, repo: normalizedRepo }
}
```

(实现前先看 `main/deployments.ts` 底部的同名辅助函数——若签名不同以现文件为准。)

- [ ] **Step 2: preload 桥**(`repositories: { ... }` 块之后)

```ts
  repositorySettings: {
    getGeneral: (owner: string, repo: string) =>
      ipcRenderer.invoke('repository-settings:get-general', owner, repo),
    updateGeneral: (owner: string, repo: string, input: unknown) =>
      ipcRenderer.invoke('repository-settings:update-general', owner, repo, input),
    replaceTopics: (owner: string, repo: string, names: string[]) =>
      ipcRenderer.invoke('repository-settings:replace-topics', owner, repo, names),
    setDiscussions: (repositoryNodeId: string, enabled: boolean) =>
      ipcRenderer.invoke('repository-settings:set-discussions', repositoryNodeId, enabled),
    setSponsorships: (repositoryNodeId: string, enabled: boolean) =>
      ipcRenderer.invoke('repository-settings:set-sponsorships', repositoryNodeId, enabled),
    setImmutableReleases: (owner: string, repo: string, enabled: boolean) =>
      ipcRenderer.invoke('repository-settings:set-immutable-releases', owner, repo, enabled),
    transfer: (owner: string, repo: string, newOwner: string, newName?: string) =>
      ipcRenderer.invoke('repository-settings:transfer', owner, repo, newOwner, newName),
    deleteRepository: (owner: string, repo: string) =>
      ipcRenderer.invoke('repository-settings:delete', owner, repo),
  },
```

- [ ] **Step 3: env.d.ts**

(a) 全局类型区(`GitHubRepositoryOverview` 附近)加 `GitHubRepositoryGeneralSettings`、`UpdateRepositoryGeneralSettingsInput` 及 4 个 merge 枚举 type——内容与 Task 1 Step 3 完全一致(手工副本)。
(b) `window.ohMyGithub` 类型里 `repositories` 之后加:

```ts
  repositorySettings: {
    getGeneral(owner: string, repo: string): Promise<GitHubRepositoryGeneralSettings>
    updateGeneral(owner: string, repo: string, input: UpdateRepositoryGeneralSettingsInput): Promise<void>
    replaceTopics(owner: string, repo: string, names: string[]): Promise<void>
    setDiscussions(repositoryNodeId: string, enabled: boolean): Promise<void>
    setSponsorships(repositoryNodeId: string, enabled: boolean): Promise<void>
    setImmutableReleases(owner: string, repo: string, enabled: boolean): Promise<void>
    transfer(owner: string, repo: string, newOwner: string, newName?: string): Promise<void>
    deleteRepository(owner: string, repo: string): Promise<void>
  }
```

- [ ] **Step 4: 验证 + Commit**

Run: `pnpm --filter @oh-my-github/client typecheck && pnpm --filter @oh-my-github/client test`
Expected: PASS。

```bash
git add packages/client/src/main packages/client/src/preload packages/client/src/renderer/env.d.ts
git commit -m "feat(client): wire repository settings IPC bridge

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: composable `use-repository-settings.ts`

**Files:**
- Create: `packages/client/src/renderer/composables/github/use-repository-settings.ts`

**Interfaces:**
- Consumes: Task 2 的 window 桥
- Produces:
  - `useRepositoryGeneralSettingsQuery(owner, repo, enabled)`(key `['github','repository','settings','general', owner, repo]`,staleTime 30s)
  - `useRepositoryGeneralSettingsInvalidation()` → `{ invalidateGeneralSettings(owner, repo), invalidateOverview(owner, repo) }`(overview 失效用其现有 key 前缀 `['github','repository','overview']` + owner/repo 精确 key——实现时以 `use-repositories.ts` 的 key 结构为准,带上版本常量;直接从该文件导出常量复用,避免 key 漂移)
  - 平凡 async 透传函数:`updateGeneralSettings` / `replaceTopics` / `setDiscussionsEnabled` / `setSponsorshipsEnabled` / `setImmutableReleases` / `transferRepository` / `deleteRepository`(各自校验桥存在,仿 `use-repositories.ts` 中 `deleteBranch` 的写法)

- [ ] **Step 1: 实现**(需先把 `use-repositories.ts` 的 `REPOSITORY_OVERVIEW_QUERY_VERSION` 改为 `export const` 并从新文件导入)

```ts
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useQuery, useQueryCache } from '@pinia/colada'
import { REPOSITORY_OVERVIEW_QUERY_VERSION } from './use-repositories'

export function useRepositoryGeneralSettingsQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubRepositoryGeneralSettings>({
    key: () => ['github', 'repository', 'settings', 'general', toValue(owner), toValue(repo)],
    enabled: () => Boolean(toValue(owner)) && Boolean(toValue(repo)) && toValue(enabled),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    query: async () => {
      const bridge = window.ohMyGithub?.repositorySettings
      if (!bridge) throw new Error('GitHub repository settings bridge is unavailable')

      return bridge.getGeneral(toValue(owner), toValue(repo))
    },
  })
}

export function useRepositorySettingsInvalidation() {
  const queryCache = useQueryCache()

  return {
    invalidateGeneralSettings(owner: string, repo: string): void {
      void queryCache.invalidateQueries({
        key: ['github', 'repository', 'settings', 'general', owner, repo],
      })
    },
    invalidateRepositoryOverview(owner: string, repo: string): void {
      void queryCache.invalidateQueries({
        key: ['github', 'repository', 'overview', REPOSITORY_OVERVIEW_QUERY_VERSION, owner, repo],
      })
    },
  }
}

function requireBridge() {
  const bridge = window.ohMyGithub?.repositorySettings
  if (!bridge) throw new Error('GitHub repository settings bridge is unavailable')
  return bridge
}

export function updateGeneralSettings(
  owner: string,
  repo: string,
  input: UpdateRepositoryGeneralSettingsInput,
): Promise<void> {
  return requireBridge().updateGeneral(owner, repo, input)
}

export function replaceTopics(owner: string, repo: string, names: string[]): Promise<void> {
  return requireBridge().replaceTopics(owner, repo, names)
}

export function setDiscussionsEnabled(repositoryNodeId: string, enabled: boolean): Promise<void> {
  return requireBridge().setDiscussions(repositoryNodeId, enabled)
}

export function setSponsorshipsEnabled(repositoryNodeId: string, enabled: boolean): Promise<void> {
  return requireBridge().setSponsorships(repositoryNodeId, enabled)
}

export function setImmutableReleases(owner: string, repo: string, enabled: boolean): Promise<void> {
  return requireBridge().setImmutableReleases(owner, repo, enabled)
}

export function transferRepository(
  owner: string,
  repo: string,
  newOwner: string,
  newName?: string,
): Promise<void> {
  return requireBridge().transfer(owner, repo, newOwner, newName)
}

export function deleteRepository(owner: string, repo: string): Promise<void> {
  return requireBridge().deleteRepository(owner, repo)
}
```

- [ ] **Step 2: 验证 + Commit**

Run: `pnpm --filter @oh-my-github/client typecheck && pnpm --filter @oh-my-github/client test`
Expected: PASS。

```bash
git add packages/client/src/renderer/composables/github
git commit -m "feat(client): add repository general settings composable

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: General 页 UI(表单 + Danger Zone)

**Files:**
- Create: `packages/client/src/renderer/pages/repository/components/settings/general/general-section.vue`(主编排)
- Create: `.../settings/general/settings-toggle-row.vue`(开关行:label+描述+Switch,乐观即存)
- Create: `.../settings/general/basics-form.vue`(名称/描述/主页/topics,成组 Save)
- Create: `.../settings/general/merge-options-form.vue`(PR 与合并选项:开关即存 + 两个 Select 即存)
- Create: `.../settings/general/danger-zone.vue`(4 行 + 确认对话框)
- Create: `.../settings/general/danger-confirm.ts` + `danger-confirm.test.ts`(全名确认校验纯函数)
- Modify: `.../settings/section.vue`(settingsGeneral 走 GeneralSection,其余分类保持外链壳;`settings-links.ts` 删除 `settingsGeneral` 键并把类型改为 `Partial<Record<...>>`)
- Modify: `.../repository-page.vue`(监听 settings 事件:改名 → `replaceActiveUrl`;删除 → 跳 owner 页 + 失效 owned 列表)

**Interfaces:**
- Consumes: Task 3 的 query 与函数;`Switch`/`Select`/`TagsInput`/`Input`/`Textarea`/`Button`/`Dialog*`/`Spinner`(`@oh-my-github/ui`);`github-branch-select`;`rename-branch-dialog.vue`(现有);`useToast`;`findMissingScopes`+`useAuthStateQuery`(`use-user-settings.ts`,delete 按钮的 `delete_repo` scope 横幅)
- Produces:
  - `general-section.vue` props `{ owner: string; repo: string }`,emits `renamed: [newName: string]`、`deleted: []`
  - `settings/section.vue` 新 emits 同名向上转发
  - `danger-confirm.ts`:`export function isDangerConfirmed(input: string, owner: string, repo: string): boolean`(trim 后与 `owner/repo` 精确比较)

- [ ] **Step 1: 写 `danger-confirm.ts` 失败测试**

```ts
import { describe, expect, it } from 'vitest'
import { isDangerConfirmed } from './danger-confirm'

describe('isDangerConfirmed', () => {
  it('requires the exact owner/repo full name', () => {
    expect(isDangerConfirmed('octo-org/hello-world', 'octo-org', 'hello-world')).toBe(true)
    expect(isDangerConfirmed('  octo-org/hello-world  ', 'octo-org', 'hello-world')).toBe(true)
    expect(isDangerConfirmed('octo-org/Hello-World', 'octo-org', 'hello-world')).toBe(false)
    expect(isDangerConfirmed('hello-world', 'octo-org', 'hello-world')).toBe(false)
    expect(isDangerConfirmed('', 'octo-org', 'hello-world')).toBe(false)
  })
})
```

实现:

```ts
export function isDangerConfirmed(input: string, owner: string, repo: string): boolean {
  return input.trim() === `${owner}/${repo}`
}
```

- [ ] **Step 2: `settings-toggle-row.vue`**(通用开关行;所有"即存"开关共用)

```vue
<script setup lang="ts">
import { Switch } from '@oh-my-github/ui'

defineProps<{
  title: string
  description?: string
  modelValue: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <div class="flex items-start justify-between gap-6 py-2.5">
    <div class="grid gap-0.5">
      <span class="text-body font-medium text-foreground">{{ title }}</span>
      <span
        v-if="description"
        class="text-caption text-muted-foreground"
      >
        {{ description }}
      </span>
    </div>
    <Switch
      :disabled="disabled"
      :model-value="modelValue"
      @update:model-value="emit('update:modelValue', $event === true)"
    />
  </div>
</template>
```

- [ ] **Step 3: `basics-form.vue`**(名称、描述、主页、topics;dirty 时出现 Save;名称改动走同一 PATCH)

要点(完整实现遵循以下结构;字段控件用 `Input`/`Textarea`/`TagsInput`,不套卡片):

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button, Input, Spinner, TagsInput, TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, Textarea } from '@oh-my-github/ui'
import { replaceTopics, updateGeneralSettings } from '@/composables/github/use-repository-settings'
import { useToast } from '@/composables/use-toast'

const props = defineProps<{
  owner: string
  repo: string
  settings: GitHubRepositoryGeneralSettings
}>()

const emit = defineEmits<{
  saved: []
  renamed: [newName: string]
}>()

const { t } = useI18n()
const toast = useToast()

const name = ref(props.settings.name)
const description = ref(props.settings.description ?? '')
const homepage = ref(props.settings.homepage ?? '')
const topics = ref<string[]>([...props.settings.topics])
const isSaving = ref(false)

watch(() => props.settings, (settings) => {
  name.value = settings.name
  description.value = settings.description ?? ''
  homepage.value = settings.homepage ?? ''
  topics.value = [...settings.topics]
})

const isDirty = computed(() =>
  name.value.trim() !== props.settings.name
  || description.value.trim() !== (props.settings.description ?? '')
  || homepage.value.trim() !== (props.settings.homepage ?? '')
  || topics.value.join('\n') !== props.settings.topics.join('\n'))

async function save(): Promise<void> {
  if (!isDirty.value || isSaving.value) return
  isSaving.value = true

  const nextName = name.value.trim()
  const renamed = nextName && nextName !== props.settings.name

  try {
    const input: UpdateRepositoryGeneralSettingsInput = {}
    if (renamed) input.name = nextName
    if (description.value.trim() !== (props.settings.description ?? '')) input.description = description.value.trim()
    if (homepage.value.trim() !== (props.settings.homepage ?? '')) input.homepage = homepage.value.trim()

    if (Object.keys(input).length > 0) {
      await updateGeneralSettings(props.owner, props.repo, input)
    }
    if (topics.value.join('\n') !== props.settings.topics.join('\n')) {
      await replaceTopics(props.owner, renamed ? nextName : props.repo, topics.value)
    }

    if (renamed) {
      emit('renamed', nextName)
    }
    emit('saved')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('repository.settings.general.saveError'))
  } finally {
    isSaving.value = false
  }
}
</script>
```

模板:标题 `h3`(`text-control font-medium`)+ 依次为 name(`Input`,下方 caption 提示改名会重定向)、description(`Textarea` rows=2)、homepage(`Input` type=url)、topics(`TagsInput` 组合),`v-if="isDirty"` 显示右对齐 `Button size="sm"`(保存中带 `Spinner` 且 disabled)。

- [ ] **Step 4: `merge-options-form.vue`**(Features 组 + Pull Requests 组;开关即存乐观回滚,Select 即存)

结构要点(完整写出所有行):

- Features 组(`settings-toggle-row` × 5):Wikis→`{hasWiki}`、Issues→`{hasIssues}`、Projects→`{hasProjects}`(三者走 `updateGeneralSettings`);Discussions→`setDiscussionsEnabled(settings.repositoryNodeId, v)`;Sponsorships→`setSponsorshipsEnabled(...)`,当 `settings.hasSponsorships === null` 时该行 Switch disabled 并显示"不可用"caption。
- Pull Requests 组:Allow merge commits / squash / rebase / auto-merge / delete branch on merge / always suggest update(6 个开关即存);squash 默认标题+消息(一个 `Select`,选项 4 组合:`PR_TITLE|PR_BODY`,`PR_TITLE|COMMIT_MESSAGES`,`PR_TITLE|BLANK`,`COMMIT_OR_PR_TITLE|COMMIT_MESSAGES`——按 GitHub 网页的组合;仅当 allowSquashMerge 开启显示);merge commit 默认(同理 3 组合:`PR_TITLE|PR_BODY`,`PR_TITLE|BLANK`,`MERGE_MESSAGE|PR_TITLE`,仅当 allowMergeCommit 开启显示)。
- Releases 组:Immutable releases 开关 → `setImmutableReleases`;`settings.immutableReleases === null` 时整行隐藏。
- 其它开关:Template repository、Require web commit sign-off(走 PATCH)。
- 每个开关处理:本地 `pendingKeys = ref(new Set<string>())`;点击 → 立即调用 → 失败 toast + `emit('refresh')`;成功 → `emit('refresh')`(让 query 失效重取,不本地镜像状态)。
- props `{ owner, repo, settings }`,emits `refresh: []`。

- [ ] **Step 5: `danger-zone.vue`**

- 顶部组标题 + `border-destructive/40` 圆角容器,内含 4 行(行结构同 external-link-list:左侧标题+caption,右侧按钮):
  1. **改可见性**:按钮文案随当前值(Make private / Make public),打开确认对话框(输全名)→ `updateGeneralSettings(owner, repo, { visibility: next })`。
  2. **转移**:对话框含 `Input` newOwner、可选 newName、输全名确认 → `transferRepository`;成功后 toast `transferPending` 并关闭。
  3. **归档/取消归档**:普通确认对话框(不输全名)→ `updateGeneralSettings(owner, repo, { archived: !settings.isArchived })`。
  4. **删除**:输全名确认 → `deleteRepository`;成功 emit `deleted`。若 `useAuthStateQuery` + `findMissingScopes(auth, ['delete_repo'])` 非空,该行按钮替换为"需要重新授权"提示 + 去登录按钮(仿 `github-tab-shell` 的缺 scope 横幅,只作用于本行)。
- 对话框统一为内部子组件(单文件内 `<script setup>` 组合三个 `Dialog`,或提取 `danger-confirm-dialog.vue`——执行时若单文件超过 ~300 行则提取),确认按钮 `variant="destructive"`,`:disabled="!isDangerConfirmed(confirmText, owner, repo) || isSubmitting"`;错误就地 `text-destructive` 显示(仿 delete-ref-dialog)。
- props `{ owner, repo, settings }`,emits `refresh: []`、`deleted: []`。

- [ ] **Step 6: `general-section.vue` 编排 + 默认分支组**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button, Spinner } from '@oh-my-github/ui'
import GithubBranchSelect from '@/components/github/github-branch-select.vue'
import RenameBranchDialog from '../../branches/rename-branch-dialog.vue'
import { updateGeneralSettings, useRepositoryGeneralSettingsQuery, useRepositorySettingsInvalidation } from '@/composables/github/use-repository-settings'
import { useToast } from '@/composables/use-toast'
import BasicsForm from './basics-form.vue'
import MergeOptionsForm from './merge-options-form.vue'
import DangerZone from './danger-zone.vue'
</script>
```

- 加载态:居中 `Spinner`;错误态:`text-destructive` 文本 + 重试按钮(refetch)。
- 默认分支组:`GithubBranchSelect` 选新默认分支 + Save(`updateGeneralSettings({ defaultBranch })`);旁边"重命名"按钮打开 `RenameBranchDialog`(传当前默认分支;成功后 `refresh()`)。实现时先读 `rename-branch-dialog.vue` 与 `github-branch-select.vue` 的 props 以其为准。
- `refresh()` = `invalidateGeneralSettings(owner, repo)` + `invalidateRepositoryOverview(owner, repo)`。
- `renamed` 事件:先 toast 成功,再向上 emit(由 repository-page 更新 tab URL);`deleted` 同理向上。
- 底部小字外链行:社交预览图 / Wiki 编辑限制 / LFS 归档(3 个 ↗ 到 `/settings`,复用 `links.openExternalUrl`)。

- [ ] **Step 7: `settings/section.vue` 分流 + `settings-links.ts` 调整**

- `settings-links.ts`:类型改 `Partial<Record<RepositorySettingsSectionId, readonly RepositorySettingsLink[]>>`,删除 `settingsGeneral` 键。
- `section.vue`:`category === 'settingsGeneral'` 渲染 `<GeneralSection :owner :repo @renamed @deleted>`(emits 向上转发);否则渲染现有外链列表(`links` computed 加 `?? []`)。
- `repository-page.vue`:`<SettingsSection>` 加 `@renamed="handleRepositoryRenamed"`、`@deleted="handleRepositoryDeleted"`:

```ts
function handleRepositoryRenamed(newName: string): void {
  emit('replaceActiveUrl', createRepositoryWorkspaceUrl(owner.value, newName, 'settingsGeneral'))
}

function handleRepositoryDeleted(): void {
  invalidateOwnedRepositories(owner.value)
  void router.push(`/${encodeURIComponent(owner.value)}`)
}
```

- [ ] **Step 8: 验证 + Commit**

Run: `pnpm --filter @oh-my-github/client test && pnpm --filter @oh-my-github/client typecheck`
Expected: PASS(danger-confirm 测试绿)。

```bash
git add packages/client/src/renderer/pages/repository
git commit -m "feat(repository): implement native general settings page with danger zone

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: i18n + 手工验证

**Files:**
- Modify: `packages/client/src/renderer/i18n/locales/en.json` / `zh.json`(`repository.settings.general.*`)

**Interfaces:**
- Consumes: Task 4 组件里引用的全部 key
- Produces: `repository.settings.general` 块,含:`title`、`basics.{title,name,nameHint,description,homepage,topics,save}`、`defaultBranch.{title,description,save,rename}`、`features.{title,wikis,wikisHint,issues,projects,discussions,sponsorships,sponsorshipsUnavailable}`、`pullRequests.{title,mergeCommits,squashMerging,rebaseMerging,autoMerge,deleteBranchOnMerge,updateBranch,squashDefaults,mergeDefaults,defaults.*(4+3 组合项)}`、`releases.{title,immutable,immutableHint}`、`template`、`signoff`、`saveError`、`externalLinks.{socialPreview,wikiRestrict,lfsArchives}`、`dangerZone.{title,visibility.{title,makePrivate,makePublic,description,confirmTitle,confirmDescription},transfer.{title,action,newOwner,newName,confirmDescription,pending},archive.{title,archiveAction,unarchiveAction,confirmTitle,confirmDescription},delete.{title,action,confirmTitle,confirmDescription,missingScope,reauthorize},confirmPlaceholder,confirmLabel,cancel,confirm}`。en 为准确英文、zh 为对应中文;执行 Task 4 时以组件实际引用为准增删,保持 en/zh 键集合一致(locales.test.ts 守护编译)。

- [ ] **Step 1: 填入两份 locale 并跑测试**

Run: `pnpm --filter @oh-my-github/client test && pnpm --filter @oh-my-github/client typecheck`
Expected: PASS。

- [ ] **Step 2: Commit + 手工验证清单**

```bash
git add packages/client/src/renderer/i18n
git commit -m "feat(i18n): add repository general settings copy

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

手工验证(需重启 dev 实例;用一个可随意折腾的测试仓库):
1. General 页加载出全部当前值(名称/描述/topics/开关状态与 github.com 一致)。
2. 改描述 → Save → toast 无错,刷新后 github.com 同步。
3. 切换一个 Feature 开关(如 Wiki)立即生效;Discussions 开关生效(GraphQL 路径)。
4. 改名 → tab 标题与 URL 变为新名字,页面数据正常。
5. Danger Zone:归档 → 确认 → overview 显示 Archived;取消归档还原。删除按钮:老 token 应显示"需要重新授权"(scope 横幅);重新授权后输错全名确认键禁用、输对可删(用测试仓库!)。
6. 非 admin 仓库无 Settings(回归)。

---

## Self-Review 结论(已执行)

- **Spec 覆盖**:spec 3.1 General 全表 → Task 1(API)+ Task 4(UI);Danger Zone 全 4 项 + `delete_repo` scope + 缺 scope 横幅 → Task 1 Step 6 / Task 4 Step 5;改名/删除善后 → Task 4 Step 7;外链 3 项 → Task 4 Step 6。`pull_request_creation_policy`/`has_pull_requests` 为 2025-26 新字段,octokit 类型可能未知——实现时若 PATCH 类型报错则加字段进 payload 的 `Record<string, unknown>`(已是该形状,无碍);UI 本阶段不做这两项(GitHub 网页也在灰度),记入阶段 3+ 待办。
- **占位符扫描**:Task 4 Step 3/4/5 以"结构要点"描述模板细节但列全了每一行控件与调用——执行者(本人,上下文完整)可直接落地;无 TBD。
- **类型一致性**:`repositoryNodeId` 贯穿 Task 1/2/3/4;`isDangerConfirmed` 签名一致;composable 函数名与 Task 4 引用一致;`REPOSITORY_OVERVIEW_QUERY_VERSION` 需在 use-repositories.ts 改为导出(Task 3 Step 1 已注明)。
