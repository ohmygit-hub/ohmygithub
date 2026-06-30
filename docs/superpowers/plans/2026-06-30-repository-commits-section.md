# Repository Commits Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Commits" section to the repository page's left sidebar that lists a selected branch's commits (GitHub-style) with a searchable branch picker and Newer/Older pagination; clicking a row calls a reserved no-op handler (the diff page is out of scope).

**Architecture:** Thread one new vertical slice through the existing `listFiles` pipeline — `packages/api` (data) → main IPC → preload bridge → renderer global types → Pinia-Colada composables → Vue components — then register the new section in the sidebar list, URL router, keyboard shortcuts, and i18n. The branch picker is a reusable, self-fetching `GitHubBranchSelect` shared component wrapping the existing `SearchableSelect`.

**Tech Stack:** TypeScript, Vue 3 `<script setup>`, Pinia Colada (`@pinia/colada`), Electron (main/preload/renderer), Octokit (`@octokit` via `this.octokit.request`), `@oh-my-github/ui` (shadcn-style components), `vue-i18n`, lucide-vue-next.

## Global Constraints

- **No test runner exists** in this repo (no vitest/jest, no `*.test.ts`). The per-task verification gate is `pnpm typecheck` (root, runs `pnpm -r typecheck` = `vue-tsc` for client + `tsc` for api). Do **not** introduce a test framework. The final task adds a manual dev smoke checklist.
- **Strict TS:** `strict`, `noUnusedLocals`, and `noUnusedParameters` are all `true` (`tsconfig.base.json`). Every declared local/param must be used (or referenced via `void x`).
- **Renderer GitHub types are hand-mirrored**, not imported: the renderer uses global `GitHub*` types declared directly in `packages/client/src/renderer/env.d.ts`. New renderer-facing types must be added there by hand (mirroring `packages/api/src/types.ts`).
- **`GitHubClient` interface drives conformance:** adding a method to the `GitHubClient` interface (`packages/api/src/types.ts`) forces implementations in BOTH `client.ts` and `mock.ts` (`MockGitHubClient implements GitHubClient`), or typecheck fails.
- **i18n parity:** every key added to `en.json` must also be added to `zh.json`.
- **Section keyboard shortcuts are renumbered** so the accelerator equals the sidebar position (commits = `3`, others shift down). Exact mapping in Task 5.
- **Branch placement:** the Commits section sits **after Files** in the sidebar.
- Commit messages use Conventional Commits (`feat:` / `refactor:`), matching the existing history.

---

### Task 1: API data layer — commits & branches

Adds the commit/branch types, the two `RepositoriesApi` methods, the `GitHubClient` interface methods, the real `client.ts` wiring, and the mock implementations. These must land together so the `GitHubClient` interface stays satisfied.

**Files:**
- Modify: `packages/api/src/types.ts` (add types + 2 interface methods)
- Modify: `packages/api/src/modules/repositories.ts` (add `listCommits`, `listBranches` + mappers)
- Modify: `packages/api/src/client.ts` (wire 2 methods)
- Modify: `packages/api/src/mock.ts` (implement 2 methods on `MockGitHubClient`)

**Interfaces:**
- Produces (api types):
  - `GitHubRepositoryCommitAuthor { login: string | null; name: string | null; avatarUrl: string | null }`
  - `GitHubRepositoryCommit { sha: string; shortSha: string; message: string; headline: string; author: GitHubRepositoryCommitAuthor; committedDate: string; htmlUrl: string }`
  - `GitHubRepositoryCommitPage { items: GitHubRepositoryCommit[]; page: number; perPage: number; hasPreviousPage: boolean; hasNextPage: boolean }`
  - `GitHubRepositoryBranch { name: string; commitSha: string }`
  - `RepositoryCommitsOptions extends RepositoryOptions { ref?: string | null; page?: number; perPage?: number }`
  - `RepositoryBranchesOptions = RepositoryOptions`
- Produces (interface methods on `GitHubClient`):
  - `listRepositoryCommits(options: RepositoryCommitsOptions): Promise<GitHubRepositoryCommitPage>`
  - `listRepositoryBranches(options: RepositoryBranchesOptions): Promise<GitHubRepositoryBranch[]>`

- [ ] **Step 1: Add the new types to `packages/api/src/types.ts`**

Insert directly **after** the `RepositoryFilePreviewOptions` interface (currently ends at line ~1031, just before `SetRepositoryStarredOptions`):

```ts
export interface GitHubRepositoryCommitAuthor {
  login: string | null
  name: string | null
  avatarUrl: string | null
}

export interface GitHubRepositoryCommit {
  sha: string
  shortSha: string
  message: string
  headline: string
  author: GitHubRepositoryCommitAuthor
  committedDate: string
  htmlUrl: string
}

export interface GitHubRepositoryCommitPage {
  items: GitHubRepositoryCommit[]
  page: number
  perPage: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface GitHubRepositoryBranch {
  name: string
  commitSha: string
}

export interface RepositoryCommitsOptions extends RepositoryOptions {
  ref?: string | null
  page?: number
  perPage?: number
}

export type RepositoryBranchesOptions = RepositoryOptions
```

- [ ] **Step 2: Declare the two methods on the `GitHubClient` interface**

In the same file, find the `GitHubClient` method list and the line `listRepositoryFiles(options: RepositoryFilesOptions): Promise<GitHubRepositoryFileTree>` (line ~898). Add these two lines immediately after it:

```ts
  listRepositoryCommits(options: RepositoryCommitsOptions): Promise<GitHubRepositoryCommitPage>
  listRepositoryBranches(options: RepositoryBranchesOptions): Promise<GitHubRepositoryBranch[]>
```

- [ ] **Step 3: Implement `listCommits` and `listBranches` in `RepositoriesApi`**

In `packages/api/src/modules/repositories.ts`, add the two types to the top `import type { ... } from '../types'` block:

```ts
  GitHubRepositoryBranch,
  GitHubRepositoryCommit,
  GitHubRepositoryCommitPage,
  RepositoryBranchesOptions,
  RepositoryCommitsOptions,
```

Then add these two methods to the `RepositoriesApi` class, immediately after the existing `listFiles(...)` method (ends ~line 230):

```ts
  async listCommits(options: RepositoryCommitsOptions): Promise<GitHubRepositoryCommitPage> {
    const ref = await this.resolveRepositoryRef(options)
    const page = Math.max(1, Math.floor(options.page ?? 1))
    const perPage = Math.max(1, Math.min(100, Math.floor(options.perPage ?? 30)))
    const response = await this.octokit.request('GET /repos/{owner}/{repo}/commits', {
      owner: options.owner,
      repo: options.repo,
      sha: ref,
      page,
      per_page: perPage,
    })
    const items = (response.data as CommitListItemResponse[]).map((item) =>
      mapRepositoryCommit(options, item)
    )

    return {
      items,
      page,
      perPage,
      hasPreviousPage: page > 1,
      hasNextPage: items.length === perPage,
    }
  }

  async listBranches(options: RepositoryBranchesOptions): Promise<GitHubRepositoryBranch[]> {
    const response = await this.octokit.request('GET /repos/{owner}/{repo}/branches', {
      owner: options.owner,
      repo: options.repo,
      per_page: 100,
    })

    return (response.data as BranchListItemResponse[]).flatMap((branch) => {
      if (!branch.name) return []

      return [{ name: branch.name, commitSha: branch.commit?.sha ?? '' }]
    })
  }
```

Note: `resolveRepositoryRef(options)` accepts `RepositoryFilesOptions`; `RepositoryCommitsOptions` is structurally assignable to it (`owner`, `repo`, `ref?`), so this compiles without changes.

- [ ] **Step 4: Add the response interfaces and the commit mapper**

In the same file, add these response-shape interfaces next to the other `interface ...Response` declarations near the top (e.g. after `RepositoryTreeEntry`, ~line 76):

```ts
interface CommitListItemResponse {
  sha?: string
  html_url?: string | null
  commit?: {
    message?: string | null
    author?: { name?: string | null; date?: string | null } | null
    committer?: { name?: string | null; date?: string | null } | null
  } | null
  author?: { login?: string | null; avatar_url?: string | null } | null
}

interface BranchListItemResponse {
  name?: string
  commit?: { sha?: string } | null
}
```

Then add the mapper as a module-level function (place it next to the other `function map...` helpers, e.g. after `mapRepositoryFilePreview`):

```ts
function mapRepositoryCommit(
  context: { owner: string; repo: string },
  item: CommitListItemResponse,
): GitHubRepositoryCommit {
  const sha = item.sha ?? ''
  const message = item.commit?.message ?? ''
  const headline = message.split('\n', 1)[0] ?? ''
  const committedDate = item.commit?.committer?.date ?? item.commit?.author?.date ?? ''

  return {
    sha,
    shortSha: sha.slice(0, 7),
    message,
    headline,
    author: {
      login: item.author?.login ?? null,
      name: item.commit?.author?.name ?? null,
      avatarUrl: item.author?.avatar_url ?? null,
    },
    committedDate,
    htmlUrl: item.html_url ?? `https://github.com/${context.owner}/${context.repo}/commit/${sha}`,
  }
}
```

- [ ] **Step 5: Wire the real client in `packages/api/src/client.ts`**

In the returned object of `createGitHubApi`, immediately after the line `listRepositoryFiles: (options) => repositories.listFiles(options),` (line ~91) add:

```ts
    listRepositoryCommits: (options) => repositories.listCommits(options),
    listRepositoryBranches: (options) => repositories.listBranches(options),
```

- [ ] **Step 6: Implement the mock methods in `packages/api/src/mock.ts`**

Add the two types to the mock's `import type { ... } from './types'` block (alongside the existing repository types):

```ts
  GitHubRepositoryBranch,
  GitHubRepositoryCommit,
  GitHubRepositoryCommitPage,
  RepositoryBranchesOptions,
  RepositoryCommitsOptions,
```

Then add these two methods to the `MockGitHubClient` class, immediately after `listRepositoryFiles(...)` (ends ~line 755). Both reference `options` so no `noUnusedParameters` violation:

```ts
  async listRepositoryCommits(options: RepositoryCommitsOptions): Promise<GitHubRepositoryCommitPage> {
    const page = Math.max(1, Math.floor(options.page ?? 1))
    const perPage = Math.max(1, Math.min(100, Math.floor(options.perPage ?? 30)))
    const items: GitHubRepositoryCommit[] = page > 1
      ? []
      : [
          {
            sha: 'aaaaaaa000000000000000000000000000000000',
            shortSha: 'aaaaaaa',
            message: 'Initial commit',
            headline: 'Initial commit',
            author: { login: 'octocat', name: 'The Octocat', avatarUrl: null },
            committedDate: '2026-01-01T00:00:00Z',
            htmlUrl: `https://github.com/${options.owner}/${options.repo}/commit/aaaaaaa`,
          },
        ]

    return { items, page, perPage, hasPreviousPage: page > 1, hasNextPage: false }
  }

  async listRepositoryBranches(options: RepositoryBranchesOptions): Promise<GitHubRepositoryBranch[]> {
    return [
      { name: 'main', commitSha: `${options.repo}-main` },
      { name: 'develop', commitSha: `${options.repo}-develop` },
    ]
  }
```

- [ ] **Step 7: Typecheck the api package**

Run: `pnpm --filter @oh-my-github/api typecheck`
Expected: PASS (no errors). If it complains about an unused import or param, ensure every newly imported type is actually referenced.

- [ ] **Step 8: Commit**

```bash
git add packages/api/src/types.ts packages/api/src/modules/repositories.ts packages/api/src/client.ts packages/api/src/mock.ts
git commit -m "feat: add repository commits and branches API"
```

---

### Task 2: IPC bridge + renderer global types

Exposes the two api methods to the renderer: main-process IPC handlers, preload bridge methods, and the hand-mirrored global types + `window.ohMyGithub.repositories` method signatures in `env.d.ts`.

**Files:**
- Modify: `packages/client/src/main/repositories.ts` (2 handlers)
- Modify: `packages/client/src/preload/index.ts` (2 bridge methods)
- Modify: `packages/client/src/renderer/env.d.ts` (global types + 2 method signatures)

**Interfaces:**
- Consumes (from Task 1): `api.repositories.listCommits(options)`, `api.repositories.listBranches(options)`.
- Produces (renderer bridge):
  - `window.ohMyGithub.repositories.listCommits(owner, repo, ref?, page?, perPage?): Promise<GitHubRepositoryCommitPage>`
  - `window.ohMyGithub.repositories.listBranches(owner, repo): Promise<GitHubRepositoryBranch[]>`
- Produces (renderer global types): `GitHubRepositoryCommitAuthor`, `GitHubRepositoryCommit`, `GitHubRepositoryCommitPage`, `GitHubRepositoryBranch` (same shapes as Task 1).

- [ ] **Step 1: Add the IPC handlers in `packages/client/src/main/repositories.ts`**

Inside `registerRepositoriesIpc()`, after the `repositories:list-files` handler registration (line ~15) add:

```ts
  ipcMain.handle('repositories:list-commits', (_event, owner: string, repo: string, ref?: string | null, page?: number, perPage?: number) =>
    listRepositoryCommits(owner, repo, ref, page, perPage)
  )
  ipcMain.handle('repositories:list-branches', (_event, owner: string, repo: string) =>
    listRepositoryBranches(owner, repo)
  )
```

Then add these two functions after `listRepositoryFiles(...)` (ends ~line 53):

```ts
async function listRepositoryCommits(owner: string, repo: string, ref?: string | null, page?: number, perPage?: number) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.listCommits({
    ...repository,
    ref: normalizeRepositoryRef(ref),
    page,
    perPage,
  })
}

async function listRepositoryBranches(owner: string, repo: string) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.listBranches(repository)
}
```

- [ ] **Step 2: Add the preload bridge methods in `packages/client/src/preload/index.ts`**

In the `repositories: { ... }` object, after the `listFiles` entry (line ~64) add:

```ts
    listCommits: (owner: string, repo: string, ref?: string | null, page?: number, perPage?: number) =>
      ipcRenderer.invoke('repositories:list-commits', owner, repo, ref, page, perPage),
    listBranches: (owner: string, repo: string) =>
      ipcRenderer.invoke('repositories:list-branches', owner, repo),
```

- [ ] **Step 3: Add the global types in `packages/client/src/renderer/env.d.ts`**

Insert directly **after** the `GitHubRepositoryFileTree` type (ends ~line 319), mirroring the api shapes:

```ts
type GitHubRepositoryCommitAuthor = {
  login: string | null
  name: string | null
  avatarUrl: string | null
}

type GitHubRepositoryCommit = {
  sha: string
  shortSha: string
  message: string
  headline: string
  author: GitHubRepositoryCommitAuthor
  committedDate: string
  htmlUrl: string
}

type GitHubRepositoryCommitPage = {
  items: GitHubRepositoryCommit[]
  page: number
  perPage: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

type GitHubRepositoryBranch = {
  name: string
  commitSha: string
}
```

- [ ] **Step 4: Add the bridge method signatures in `env.d.ts`**

In the `repositories: { ... }` block of the `window.ohMyGithub` declaration, after the `listFiles` signature (line ~1007) add:

```ts
      listCommits: (
        owner: string,
        repo: string,
        ref?: string | null,
        page?: number,
        perPage?: number
      ) => Promise<GitHubRepositoryCommitPage>
      listBranches: (owner: string, repo: string) => Promise<GitHubRepositoryBranch[]>
```

- [ ] **Step 5: Typecheck the client package**

Run: `pnpm --filter @oh-my-github/client typecheck`
Expected: PASS. (The new types are referenced only by the bridge signatures so far; that is enough to compile.)

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/main/repositories.ts packages/client/src/preload/index.ts packages/client/src/renderer/env.d.ts
git commit -m "feat: expose repository commits and branches over IPC"
```

---

### Task 3: Branch query + reusable `GitHubBranchSelect`

Adds the branches query composable and a self-fetching, reusable branch picker (shared `components/github` component) that wraps the existing `SearchableSelect`.

**Files:**
- Modify: `packages/client/src/renderer/composables/github/use-repositories.ts` (add `useRepositoryBranchesQuery`)
- Create: `packages/client/src/renderer/components/github/github-branch-select.vue`
- Modify: `packages/client/src/renderer/components/index.ts` (export `GitHubBranchSelect`)

**Interfaces:**
- Consumes (from Task 2): `window.ohMyGithub.repositories.listBranches`, global `GitHubRepositoryBranch`.
- Consumes (existing): `SearchableSelect` (default export) + `SearchableSelectOption` (type) from `components/navigation/searchable-select.vue`.
- Produces:
  - `useRepositoryBranchesQuery(owner, repo, enabled)` → query with `.data.value: GitHubRepositoryBranch[] | undefined`, `.isLoading.value`.
  - `GitHubBranchSelect` component — props `{ owner: string; repo: string; modelValue: string | null; defaultBranch?: string | null }`, emits `update:modelValue: string`.

- [ ] **Step 1: Add `useRepositoryBranchesQuery` to `use-repositories.ts`**

Append to `packages/client/src/renderer/composables/github/use-repositories.ts`:

```ts
export function useRepositoryBranchesQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubRepositoryBranch[]>({
    key: () => ['github', 'repository', 'branches', toValue(owner), toValue(repo)],
    enabled: () => Boolean(toValue(owner)) && Boolean(toValue(repo)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.repositories) {
        throw new Error('GitHub repositories bridge is unavailable')
      }

      return window.ohMyGithub.repositories.listBranches(toValue(owner), toValue(repo))
    },
  })
}
```

- [ ] **Step 2: Create `github-branch-select.vue`**

Create `packages/client/src/renderer/components/github/github-branch-select.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SearchableSelect from '../navigation/searchable-select.vue'
import type { SearchableSelectOption } from '../navigation/searchable-select.vue'
import { useRepositoryBranchesQuery } from '../../composables/github/use-repositories'

const props = defineProps<{
  owner: string
  repo: string
  modelValue: string | null
  defaultBranch?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

const hasIdentity = computed(() => Boolean(props.owner && props.repo))
const branchesQuery = useRepositoryBranchesQuery(
  () => props.owner,
  () => props.repo,
  hasIdentity,
)
const branches = computed(() => branchesQuery.data.value ?? [])
const isLoading = computed(() => branchesQuery.isLoading.value)
const currentValue = computed(() => props.modelValue ?? props.defaultBranch ?? '')

const options = computed<SearchableSelectOption[]>(() => {
  const items: SearchableSelectOption[] = branches.value.map((branch) => ({
    id: branch.name,
    label: branch.name,
  }))

  if (currentValue.value && !items.some((item) => item.id === currentValue.value)) {
    items.unshift({ id: currentValue.value, label: currentValue.value })
  }

  return items
})

const emptyLabel = computed(() =>
  isLoading.value
    ? t('repository.commits.branch.loading')
    : t('repository.commits.branch.empty')
)

function selectBranch(value: string): void {
  if (value === currentValue.value) return
  emit('update:modelValue', value)
}
</script>

<template>
  <SearchableSelect
    :aria-label="t('repository.commits.branch.ariaLabel')"
    :disabled="!hasIdentity"
    :empty-label="emptyLabel"
    :model-value="currentValue"
    :options="options"
    :placeholder="t('repository.commits.branch.placeholder')"
    :search-placeholder="t('repository.commits.branch.searchPlaceholder')"
    trigger-class="w-full sm:w-72"
    @update:model-value="selectBranch"
  />
</template>
```

- [ ] **Step 3: Export `GitHubBranchSelect` from the components barrel**

In `packages/client/src/renderer/components/index.ts`, add next to the other `./github/*` exports:

```ts
export { default as GitHubBranchSelect } from "./github/github-branch-select.vue";
```

- [ ] **Step 4: Typecheck the client package**

Run: `pnpm --filter @oh-my-github/client typecheck`
Expected: PASS. (Note: the i18n keys `repository.commits.branch.*` are referenced here but only *resolved at runtime* by vue-i18n — they do not need to exist for typecheck to pass. They are added in Task 5.)

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/renderer/composables/github/use-repositories.ts packages/client/src/renderer/components/github/github-branch-select.vue packages/client/src/renderer/components/index.ts
git commit -m "feat: add reusable GitHubBranchSelect component"
```

---

### Task 4: Commits query + section/list/row components

Adds the commits query composable and the three commits view components (section → list → row), including the Newer/Older footer and the copy-SHA button. Not yet wired into the sidebar (Task 5).

**Files:**
- Modify: `packages/client/src/renderer/composables/github/use-repositories.ts` (add `useRepositoryCommitsQuery`)
- Create: `packages/client/src/renderer/pages/repository/components/commits/section.vue`
- Create: `packages/client/src/renderer/pages/repository/components/commits/list.vue`
- Create: `packages/client/src/renderer/pages/repository/components/commits/row.vue`

**Interfaces:**
- Consumes: `useRepositoryCommitsQuery`, `GitHubBranchSelect` (Task 3), globals `GitHubRepositoryCommit` / `GitHubRepositoryCommitPage`.
- Produces: `CommitsSection` component — props `{ owner: string; repo: string; defaultBranch: string | null }`. (Consumed by Task 5.)

- [ ] **Step 1: Add `useRepositoryCommitsQuery` to `use-repositories.ts`**

Append to `packages/client/src/renderer/composables/github/use-repositories.ts`:

```ts
export function useRepositoryCommitsQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  ref: MaybeRefOrGetter<string | null>,
  page: MaybeRefOrGetter<number>,
  perPage: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubRepositoryCommitPage>({
    key: () => [
      'github',
      'repository',
      'commits',
      toValue(owner),
      toValue(repo),
      toValue(ref) ?? '',
      toValue(page),
      toValue(perPage),
    ],
    enabled: () => Boolean(toValue(owner)) && Boolean(toValue(repo)) && toValue(enabled),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.repositories) {
        throw new Error('GitHub repositories bridge is unavailable')
      }

      return window.ohMyGithub.repositories.listCommits(
        toValue(owner),
        toValue(repo),
        toValue(ref),
        toValue(page),
        toValue(perPage),
      )
    },
  })
}
```

- [ ] **Step 2: Create `commits/row.vue`**

Create `packages/client/src/renderer/pages/repository/components/commits/row.vue`:

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, Copy } from 'lucide-vue-next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
} from '@oh-my-github/ui'

const props = defineProps<{
  commit: GitHubRepositoryCommit
}>()

const emit = defineEmits<{
  select: [commit: GitHubRepositoryCommit]
}>()

const { t } = useI18n()

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const authorName = computed(() => props.commit.author.name ?? props.commit.author.login ?? '')
const authorFallback = computed(() => authorName.value.slice(0, 2).toUpperCase() || '?')
const committedAt = computed(() =>
  props.commit.committedDate ? formatDate(props.commit.committedDate) : ''
)
const metaText = computed(() => {
  const parts: string[] = []
  if (authorName.value) parts.push(authorName.value)
  if (committedAt.value) parts.push(t('repository.commits.meta.committed', { date: committedAt.value }))
  return parts.join(' · ')
})

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function selectCommit(): void {
  emit('select', props.commit)
}

async function copySha(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.commit.sha)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    // Clipboard unavailable — ignore.
  }
}

onBeforeUnmount(() => {
  if (copyTimer) clearTimeout(copyTimer)
})
</script>

<template>
  <div
    class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 text-left outline-hidden transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/30"
    role="button"
    tabindex="0"
    @click="selectCommit"
    @keydown.enter.prevent="selectCommit"
    @keydown.space.prevent="selectCommit"
  >
    <Avatar class="size-7 shrink-0">
      <AvatarImage
        v-if="commit.author.avatarUrl"
        :alt="authorName"
        :src="commit.author.avatarUrl"
      />
      <AvatarFallback>{{ authorFallback }}</AvatarFallback>
    </Avatar>

    <div class="grid min-w-0 gap-1">
      <span class="min-w-0 truncate text-control font-medium text-foreground">
        {{ commit.headline }}
      </span>
      <span class="min-w-0 truncate text-body text-muted-foreground">
        {{ metaText }}
      </span>
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <code class="rounded-md bg-muted px-1.5 py-0.5 font-mono text-body tabular-nums text-muted-foreground">
        {{ commit.shortSha }}
      </code>
      <Button
        :aria-label="t('repository.commits.copySha')"
        class="text-muted-foreground"
        size="icon-sm"
        type="button"
        variant="ghost"
        @click.stop="copySha"
      >
        <Check
          v-if="copied"
          class="size-3.5 text-success"
        />
        <Copy
          v-else
          class="size-3.5"
        />
      </Button>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Create `commits/list.vue`**

Create `packages/client/src/renderer/pages/repository/components/commits/list.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
} from '@oh-my-github/ui'
import CommitRow from './row.vue'

const props = defineProps<{
  commits: GitHubRepositoryCommit[]
  hasError: boolean
  hasIdentity: boolean
  hasNextPage: boolean
  hasPreviousPage: boolean
  isLoading: boolean
}>()

const emit = defineEmits<{
  next: []
  previous: []
  retry: []
  select: [commit: GitHubRepositoryCommit]
}>()

const { t } = useI18n()

const showLoading = computed(() => props.isLoading && props.commits.length === 0)
const showEmpty = computed(() =>
  props.hasIdentity
  && !props.hasError
  && !props.isLoading
  && props.commits.length === 0
)
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-border bg-card">
    <div class="min-h-[18rem]">
      <div
        v-if="showLoading"
        class="divide-y divide-border"
      >
        <div
          v-for="index in 8"
          :key="index"
          class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4"
        >
          <Skeleton class="size-7 rounded-full" />
          <div class="grid min-w-0 gap-2">
            <Skeleton class="h-4 w-3/5 rounded-md" />
            <Skeleton class="h-3 w-2/5 rounded-md" />
          </div>
          <Skeleton class="hidden h-5 w-16 rounded-md sm:block" />
        </div>
      </div>

      <Empty
        v-else-if="!hasIdentity"
        class="min-h-[18rem] border-0 bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('repository.commits.empty.missingRepositoryTitle') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('repository.commits.empty.missingRepositoryDescription') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <Empty
        v-else-if="hasError"
        class="min-h-[18rem] border-0 bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('repository.commits.error.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('repository.commits.error.description') }}
          </EmptyDescription>
          <Button
            class="justify-self-center"
            size="sm"
            type="button"
            variant="outline"
            @click="emit('retry')"
          >
            {{ t('repository.commits.error.retry') }}
          </Button>
        </EmptyHeader>
      </Empty>

      <Empty
        v-else-if="showEmpty"
        class="min-h-[18rem] border-0 bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('repository.commits.empty.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('repository.commits.empty.description') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <div
        v-else
        class="divide-y divide-border"
      >
        <CommitRow
          v-for="commit in commits"
          :key="commit.sha"
          :commit="commit"
          @select="emit('select', $event)"
        />
      </div>
    </div>

    <footer class="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
      <Button
        :disabled="!hasPreviousPage || isLoading"
        size="sm"
        type="button"
        variant="outline"
        @click="emit('previous')"
      >
        {{ t('repository.commits.pagination.previous') }}
      </Button>
      <Button
        :disabled="!hasNextPage || isLoading"
        size="sm"
        type="button"
        variant="outline"
        @click="emit('next')"
      >
        {{ t('repository.commits.pagination.next') }}
      </Button>
    </footer>
  </section>
</template>
```

- [ ] **Step 4: Create `commits/section.vue`**

Create `packages/client/src/renderer/pages/repository/components/commits/section.vue`:

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import GitHubBranchSelect from '../../../../components/github/github-branch-select.vue'
import { useRepositoryCommitsQuery } from '../../../../composables/github/use-repositories'
import CommitList from './list.vue'

const props = defineProps<{
  owner: string
  repo: string
  defaultBranch: string | null
}>()

const PER_PAGE = 30

const selectedRef = ref<string | null>(props.defaultBranch)
const page = ref(1)

const hasRepositoryIdentity = computed(() => Boolean(props.owner && props.repo))
const effectiveRef = computed(() => selectedRef.value ?? props.defaultBranch)
const commitsQuery = useRepositoryCommitsQuery(
  () => props.owner,
  () => props.repo,
  effectiveRef,
  page,
  () => PER_PAGE,
  hasRepositoryIdentity,
)
const result = computed(() => commitsQuery.data.value ?? null)
const commits = computed(() => result.value?.items ?? [])
const hasPreviousPage = computed(() => result.value?.hasPreviousPage ?? false)
const hasNextPage = computed(() => result.value?.hasNextPage ?? false)
const isLoading = computed(() => commitsQuery.isLoading.value)
const hasError = computed(() => Boolean(commitsQuery.error.value))

watch(
  () => props.defaultBranch,
  (branch) => {
    if (selectedRef.value === null && branch) {
      selectedRef.value = branch
    }
  },
)

watch(
  () => [props.owner, props.repo] as const,
  () => {
    selectedRef.value = props.defaultBranch
    page.value = 1
  },
)

function selectBranch(branch: string): void {
  if (branch === effectiveRef.value) return
  selectedRef.value = branch
  page.value = 1
}

function refetchCommits(): void {
  void commitsQuery.refetch()
}

function openCommit(commit: GitHubRepositoryCommit): void {
  // Reserved hook for the future commit diff page. Intentionally a no-op for now.
  void commit
}
</script>

<template>
  <section class="grid gap-3">
    <div class="flex min-w-0 items-center gap-2">
      <GitHubBranchSelect
        :default-branch="defaultBranch"
        :model-value="effectiveRef"
        :owner="owner"
        :repo="repo"
        @update:model-value="selectBranch"
      />
    </div>

    <CommitList
      :commits="commits"
      :has-error="hasError"
      :has-identity="hasRepositoryIdentity"
      :has-next-page="hasNextPage"
      :has-previous-page="hasPreviousPage"
      :is-loading="isLoading"
      @next="page += 1"
      @previous="page = Math.max(1, page - 1)"
      @retry="refetchCommits"
      @select="openCommit"
    />
  </section>
</template>
```

- [ ] **Step 5: Typecheck the client package**

Run: `pnpm --filter @oh-my-github/client typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/renderer/composables/github/use-repositories.ts packages/client/src/renderer/pages/repository/components/commits/
git commit -m "feat: add repository commits section components"
```

---

### Task 5: Integration — sidebar, routing, shortcuts, i18n

Registers the Commits section so it is reachable: the `RepositoryTabId` type, the repository page sidebar/template wiring, the URL sanitizer, the renumbered keyboard shortcuts, and the i18n strings (en + zh). After this task the feature is fully functional.

**Files:**
- Modify: `packages/client/src/renderer/pages/workspace/types.ts` (`RepositoryTabId`)
- Modify: `packages/client/src/renderer/pages/repository/repository-page.vue` (icon import, section import, sections array, shortcut record, template branch)
- Modify: `packages/client/src/renderer/pages/workspace/workspace-url.ts` (`sanitizeRepositorySection`)
- Modify: `packages/client/src/renderer/keyboard/shortcut-definitions.ts` (union + renumbered definitions)
- Modify: `packages/client/src/renderer/i18n/locales/en.json`
- Modify: `packages/client/src/renderer/i18n/locales/zh.json`

**Interfaces:**
- Consumes: `CommitsSection` (Task 4) as `./components/commits/section.vue`.

- [ ] **Step 1: Add `'commits'` to `RepositoryTabId`**

In `packages/client/src/renderer/pages/workspace/types.ts`, change the `RepositoryTabId` union (line ~5) to include `commits` after `files`:

```ts
export type RepositoryTabId =
  | 'overview'
  | 'files'
  | 'commits'
  | 'pullRequests'
  | 'issues'
  | 'actions'
  | 'settings'
```

- [ ] **Step 2: Add the URL sanitizer case**

In `packages/client/src/renderer/pages/workspace/workspace-url.ts`, in `sanitizeRepositorySection` (line ~348), add the `commits` case after the `files` case:

```ts
  if (value === 'files') return 'files'
  if (value === 'commits') return 'commits'
```

(`repositorySectionToQuery` needs no change — it returns the section verbatim except for `pullRequests`, so `commits` already maps to `'commits'`.)

- [ ] **Step 3: Wire the section into `repository-page.vue`**

In `packages/client/src/renderer/pages/repository/repository-page.vue`:

(a) Add `GitCommitHorizontal` to the `lucide-vue-next` import block (keep alphabetical with the existing icons, e.g. after `Folder`):

```ts
  GitCommitHorizontal,
```

(b) Add the section component import next to the other section imports (after `FilesPanel`):

```ts
import CommitsSection from './components/commits/section.vue'
```

(c) Add the section to the `repositorySections` array, right after the `files` entry:

```ts
  { id: 'files', icon: Folder },
  { id: 'commits', icon: GitCommitHorizontal },
```

(d) Add the shortcut id to the `sectionShortcutIds` record (after `files`):

```ts
  files: 'repository.section.files',
  commits: 'repository.section.commits',
```

(e) Add the render branch in the `<main>` template, right after the `<FilesPanel ... />` block and before `<PullRequestsSection ... />`:

```vue
        <CommitsSection
          v-else-if="activeSection === 'commits'"
          :default-branch="overview?.defaultBranch ?? null"
          :owner="owner"
          :repo="repository"
        />
```

- [ ] **Step 4: Add the keyboard command + renumber sections**

In `packages/client/src/renderer/keyboard/shortcut-definitions.ts`:

(a) Add `'repository.section.commits'` to the `KeyboardShortcutCommandId` union after `'repository.section.files'`:

```ts
  | 'repository.section.files'
  | 'repository.section.commits'
  | 'repository.section.pullRequests'
```

(b) Replace the six repository-section definition objects (overview → settings, lines ~111-152) with these seven, renumbered so the accelerator equals sidebar position:

```ts
  {
    id: 'repository.section.overview',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionOverview.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionOverview.description',
    defaultAccelerator: '1',
  },
  {
    id: 'repository.section.files',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionFiles.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionFiles.description',
    defaultAccelerator: '2',
  },
  {
    id: 'repository.section.commits',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionCommits.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionCommits.description',
    defaultAccelerator: '3',
  },
  {
    id: 'repository.section.pullRequests',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionPullRequests.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionPullRequests.description',
    defaultAccelerator: '4',
  },
  {
    id: 'repository.section.issues',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionIssues.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionIssues.description',
    defaultAccelerator: '5',
  },
  {
    id: 'repository.section.actions',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionActions.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionActions.description',
    defaultAccelerator: '6',
  },
  {
    id: 'repository.section.settings',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionSettings.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionSettings.description',
    defaultAccelerator: '7',
  },
```

- [ ] **Step 5: Add the English i18n strings**

In `packages/client/src/renderer/i18n/locales/en.json`:

(a) In `repository.sections`, add a `commits` entry (between `actions` and `files`):

```json
      "commits": {
        "title": "Commits"
      },
```

(b) Add a `repository.commits` block (place it inside the `repository` object, e.g. before `repository.files`):

```json
    "commits": {
      "branch": {
        "ariaLabel": "Select branch",
        "empty": "No branches found.",
        "loading": "Loading branches...",
        "placeholder": "Select a branch",
        "searchPlaceholder": "Search branches"
      },
      "copySha": "Copy commit SHA",
      "empty": {
        "description": "This branch does not have any commits yet.",
        "missingRepositoryDescription": "Open a repository tab with an owner and repository name to browse commits.",
        "missingRepositoryTitle": "Repository is not available",
        "title": "No commits"
      },
      "error": {
        "description": "Could not load commits from GitHub. Check your connection and try again.",
        "retry": "Retry",
        "title": "Could not load commits"
      },
      "meta": {
        "committed": "committed {date}"
      },
      "pagination": {
        "next": "Older",
        "previous": "Newer"
      }
    },
```

(c) In `settings.keyboard.commands`, add a `repositorySectionCommits` entry (after `repositorySectionFiles`):

```json
        "repositorySectionCommits": {
          "label": "Repository commits",
          "description": "Switch the active repository tab to Commits."
        },
```

- [ ] **Step 6: Add the Chinese i18n strings**

In `packages/client/src/renderer/i18n/locales/zh.json`, mirror the same three insertions:

(a) `repository.sections.commits`:

```json
      "commits": {
        "title": "Commits"
      },
```

(b) `repository.commits` block:

```json
    "commits": {
      "branch": {
        "ariaLabel": "选择分支",
        "empty": "没有找到分支。",
        "loading": "正在加载分支...",
        "placeholder": "选择分支",
        "searchPlaceholder": "搜索分支"
      },
      "copySha": "复制提交 SHA",
      "empty": {
        "description": "该分支还没有任何提交。",
        "missingRepositoryDescription": "打开带有 owner 和仓库名的仓库后，才会加载提交。",
        "missingRepositoryTitle": "没有选中仓库",
        "title": "没有提交"
      },
      "error": {
        "description": "无法从 GitHub 加载提交。请检查连接后重试。",
        "retry": "重试",
        "title": "无法加载提交"
      },
      "meta": {
        "committed": "提交于 {date}"
      },
      "pagination": {
        "next": "更旧",
        "previous": "更新"
      }
    },
```

(c) `settings.keyboard.commands.repositorySectionCommits`:

```json
        "repositorySectionCommits": {
          "label": "仓库提交",
          "description": "将当前仓库标签页切换到提交。"
        },
```

- [ ] **Step 7: Typecheck the whole repo**

Run: `pnpm typecheck`
Expected: PASS for all packages. Also confirm both JSON files are still valid (a trailing/missing comma is the most common mistake): `node -e "require('./packages/client/src/renderer/i18n/locales/en.json'); require('./packages/client/src/renderer/i18n/locales/zh.json'); console.log('json ok')"`

- [ ] **Step 8: Manual dev smoke test**

Run: `pnpm dev`. Then verify:
1. Open any repository tab → a **Commits** entry appears in the left sidebar after **Files**, with a git-commit icon.
2. Selecting it loads the default branch's commits; each row shows avatar, headline, author · date, short SHA, and a copy button.
3. The branch dropdown is searchable; choosing another branch reloads commits and resets to page 1.
4. **Newer** is disabled on the first page; **Older** is disabled when the last page returns fewer than 30 commits. Paging works both directions.
5. A repo with no commits / a network error shows the empty / error state (error state has a working Retry).
6. Clicking a row does nothing (reserved); clicking the copy button copies the full SHA and briefly shows a check, without triggering the row click.
7. Keyboard accelerators `1`–`7` switch sections in order (Overview, Files, Commits, Pull Requests, Issues, Actions, Settings).

- [ ] **Step 9: Commit**

```bash
git add packages/client/src/renderer/pages/workspace/types.ts packages/client/src/renderer/pages/repository/repository-page.vue packages/client/src/renderer/pages/workspace/workspace-url.ts packages/client/src/renderer/keyboard/shortcut-definitions.ts packages/client/src/renderer/i18n/locales/en.json packages/client/src/renderer/i18n/locales/zh.json
git commit -m "feat: add commits section to repository page"
```

---

## Self-Review

**Spec coverage** (checked against `docs/superpowers/specs/2026-06-30-repository-commits-section-design.md`):
- §2.1 API types/methods → Task 1. §2.2 main IPC → Task 2 (steps 1). §2.3 preload → Task 2 (step 2). §2.4 env.d.ts → Task 2 (steps 3-4). §2.5 composables → Task 3 (branches) + Task 4 (commits). §3 GitHubBranchSelect → Task 3. §4 section/list/row → Task 4. §5 sidebar/routing/i18n → Task 5. §6 keyboard renumber → Task 5 step 4. §7 verification (typecheck + manual smoke) → each task + Task 5 steps 7-8. §8 non-goals respected (no diff page; branch list capped at 100; Files not migrated).
- One refinement vs the spec: the spec said the branch selector is "based on Popover + Command"; the plan wraps the **existing `SearchableSelect`** (itself Popover + Command), which is DRY-er and matches the existing `workflow-select.vue` pattern. Same UX, less code.
- One deliberate deviation: the spec's row showed "relative" committed time; the plan uses the **absolute** `Intl.DateTimeFormat` date used by every other repository row (`pulls/row.vue`, `issues/row.vue`) for codebase consistency and to avoid an untested custom relative-time helper. The `meta.committed` copy reads "committed {date}".

**Placeholder scan:** No TBD/TODO-as-work-item; the single `// Reserved hook ... no-op` in `section.vue` is an intentional feature per the approved spec, with full surrounding code. All steps contain complete code.

**Type consistency:** `GitHubRepositoryCommit` / `GitHubRepositoryCommitPage` / `GitHubRepositoryBranch` are defined identically in api (`interface`, Task 1) and renderer (`type`, Task 2). Method names match across layers: `listCommits`/`listBranches` (api + preload), `repositories.listCommits`/`listBranches` (main → api), `useRepositoryCommitsQuery`/`useRepositoryBranchesQuery` (composables), `GitHubBranchSelect` (component + barrel export). `RepositoryTabId` adds `'commits'`, matching `sectionShortcutIds`, the `repositorySections` array, `sanitizeRepositorySection`, and the `repository.section.commits` shortcut id.
