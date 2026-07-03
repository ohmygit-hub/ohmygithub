import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useQuery, useQueryCache } from '@pinia/colada'

const REPOSITORY_OVERVIEW_QUERY_VERSION = 'resource-rendering-v3'

export function useRepositoryOverviewQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubRepositoryOverview>({
    key: () => [
      'github',
      'repository',
      'overview',
      REPOSITORY_OVERVIEW_QUERY_VERSION,
      toValue(owner),
      toValue(repo),
    ],
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

      return window.ohMyGithub.repositories.getOverview(toValue(owner), toValue(repo))
    },
  })
}

// Mirrors CONTRIBUTOR_STATS_PENDING in packages/api/src/types.ts; the renderer cannot
// import runtime values from @oh-my-github/api, and Electron wraps IPC rejection messages.
const CONTRIBUTOR_STATS_PENDING_SENTINEL = 'github_contributor_stats_pending'

export function isContributorStatsPendingError(error: unknown): boolean {
  return error instanceof Error && error.message.includes(CONTRIBUTOR_STATS_PENDING_SENTINEL)
}

export function useRepositoryContributorStatsQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubRepositoryContributorStatsResult>({
    key: () => ['github', 'repository', 'contributor-stats', toValue(owner), toValue(repo)],
    enabled: () => Boolean(toValue(owner)) && Boolean(toValue(repo)) && toValue(enabled),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.repositories) {
        throw new Error('GitHub repositories bridge is unavailable')
      }

      return window.ohMyGithub.repositories.getContributorStats(toValue(owner), toValue(repo))
    },
  })
}

export function useRepositoryNavigationCountsQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubRepositoryNavigationCounts>({
    key: () => ['github', 'repository', 'navigation-counts', toValue(owner), toValue(repo)],
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

      return window.ohMyGithub.repositories.getNavigationCounts(toValue(owner), toValue(repo))
    },
  })
}

export function useRepositoryFilesQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  ref: MaybeRefOrGetter<string | null | undefined>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubRepositoryFileTree>({
    key: () => ['github', 'repository', 'files', toValue(owner), toValue(repo), toValue(ref) ?? ''],
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

      return window.ohMyGithub.repositories.listFiles(
        toValue(owner),
        toValue(repo),
        toValue(ref) ?? null,
      )
    },
  })
}

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

export function useRepositoryBranchesDetailedQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  search: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
  perPage: MaybeRefOrGetter<number>,
  defaultBranch: MaybeRefOrGetter<string | null>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubBranchPage>({
    key: () => [
      'github',
      'repository',
      'branches-detailed',
      toValue(owner),
      toValue(repo),
      toValue(search),
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
      assertRepositoriesBridge()

      return window.ohMyGithub.repositories.listBranchesDetailed(toValue(owner), toValue(repo), {
        query: toValue(search) || null,
        page: toValue(page),
        perPage: toValue(perPage),
        defaultBranch: toValue(defaultBranch),
      })
    },
  })
}

export function useRepositoryTagsQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  search: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
  perPage: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubTagPage>({
    key: () => [
      'github',
      'repository',
      'tags',
      toValue(owner),
      toValue(repo),
      toValue(search),
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
      assertRepositoriesBridge()

      return window.ohMyGithub.repositories.listTags(toValue(owner), toValue(repo), {
        query: toValue(search) || null,
        page: toValue(page),
        perPage: toValue(perPage),
      })
    },
  })
}

// Branch/tag caches span one entry per (search, page) combination, so a plain
// refetch() only refreshes the current page — invalidate by key prefix instead.
export function useRepositoryRefsInvalidation() {
  const queryCache = useQueryCache()

  return {
    invalidateBranches(owner: string, repo: string): void {
      void queryCache.invalidateQueries({ key: ['github', 'repository', 'branches-detailed', owner, repo] })
      void queryCache.invalidateQueries({ key: ['github', 'repository', 'branches', owner, repo] })
    },
    invalidateTags(owner: string, repo: string): void {
      void queryCache.invalidateQueries({ key: ['github', 'repository', 'tags', owner, repo] })
    },
  }
}

export async function createBranch(owner: string, repo: string, name: string, fromRef: string): Promise<GitHubCreatedRef> {
  assertRepositoriesBridge()

  return window.ohMyGithub.repositories.createBranch(owner, repo, name, fromRef)
}

export async function renameBranch(owner: string, repo: string, name: string, newName: string): Promise<void> {
  assertRepositoriesBridge()

  await window.ohMyGithub.repositories.renameBranch(owner, repo, name, newName)
}

export async function deleteBranch(owner: string, repo: string, name: string): Promise<void> {
  assertRepositoriesBridge()

  await window.ohMyGithub.repositories.deleteBranch(owner, repo, name)
}

export async function createTag(
  owner: string,
  repo: string,
  name: string,
  fromRef: string,
  message?: string | null,
): Promise<GitHubCreatedRef> {
  assertRepositoriesBridge()

  return window.ohMyGithub.repositories.createTag(owner, repo, name, fromRef, message)
}

export async function deleteTag(owner: string, repo: string, name: string): Promise<void> {
  assertRepositoriesBridge()

  await window.ohMyGithub.repositories.deleteTag(owner, repo, name)
}

function assertRepositoriesBridge(): void {
  if (!window.ohMyGithub?.repositories) {
    throw new Error('GitHub repositories bridge is unavailable')
  }
}

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

export function useRepositoryCommitQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  sha: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubCommitDetail>({
    key: () => ['github', 'repository', 'commit', toValue(owner), toValue(repo), toValue(sha)],
    enabled: () =>
      Boolean(toValue(owner)) && Boolean(toValue(repo)) && Boolean(toValue(sha)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.repositories) {
        throw new Error('GitHub repositories bridge is unavailable')
      }

      return window.ohMyGithub.repositories.getCommit(toValue(owner), toValue(repo), toValue(sha))
    },
  })
}
