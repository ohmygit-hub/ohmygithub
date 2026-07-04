import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useQuery, useQueryCache } from '@pinia/colada'

export function usePullRequestCategoryQuery(
  category: MaybeRefOrGetter<GitHubPullRequestCategory>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubPullRequest[]>({
    key: () => ['github', 'pull-request-category', toValue(category)],
    enabled: () => toValue(enabled),
    query: async () => {
      if (!window.ohMyGithub?.pulls) {
        throw new Error('GitHub pulls bridge is unavailable')
      }

      return window.ohMyGithub.pulls.listPullRequestCategory(toValue(category))
    },
  })
}

export function useViewerPullRequestsQuery(enabled: MaybeRefOrGetter<boolean>) {
  return useQuery<GitHubPullRequest[]>({
    key: ['github', 'viewer-pull-requests'],
    enabled: () => toValue(enabled),
    query: async () => {
      if (!window.ohMyGithub?.pulls) {
        throw new Error('GitHub pulls bridge is unavailable')
      }

      return window.ohMyGithub.pulls.listViewerPullRequests()
    },
  })
}

export function useRepositoryPullRequestsQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubPullRequest[]>({
    key: () => ['github', 'repository-pull-requests', toValue(owner), toValue(repo)],
    enabled: () => Boolean(toValue(owner)) && Boolean(toValue(repo)) && toValue(enabled),
    query: async () => {
      if (!window.ohMyGithub?.pulls) {
        throw new Error('GitHub pulls bridge is unavailable')
      }

      return window.ohMyGithub.pulls.listRepositoryPullRequests(toValue(owner), toValue(repo))
    },
  })
}

export function useRepositoryPullRequestSearchQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  state: MaybeRefOrGetter<GitHubPullRequestSearchState>,
  search: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
  perPage: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubPullRequestSearchResult>({
    key: () => [
      'github',
      'repository-pull-request-search',
      toValue(owner),
      toValue(repo),
      toValue(state),
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
      if (!window.ohMyGithub?.pulls) {
        throw new Error('GitHub pulls bridge is unavailable')
      }

      return window.ohMyGithub.pulls.searchRepositoryPullRequests({
        owner: toValue(owner),
        repo: toValue(repo),
        state: toValue(state),
        search: toValue(search),
        page: toValue(page),
        perPage: toValue(perPage),
      })
    },
  })
}

export function usePullRequestDetailQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  pullRequestNumber: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubPullRequestDetail>({
    key: () => ['github', 'pull-request-detail', toValue(owner), toValue(repo), toValue(pullRequestNumber)],
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

      return window.ohMyGithub.pulls.getPullRequestDetail(
        toValue(owner),
        toValue(repo),
        toValue(pullRequestNumber),
      )
    },
  })
}

export function usePullRequestFilesQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  pullRequestNumber: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubCommitFile[]>({
    key: () => ['github', 'pull-request-files', toValue(owner), toValue(repo), toValue(pullRequestNumber)],
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

      return window.ohMyGithub.pulls.listPullRequestFiles(
        toValue(owner),
        toValue(repo),
        toValue(pullRequestNumber),
      )
    },
  })
}

export function usePullRequestCommitsQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  pullRequestNumber: MaybeRefOrGetter<number>,
  page: MaybeRefOrGetter<number>,
  perPage: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubRepositoryCommitPage>({
    key: () => [
      'github',
      'pull-request-commits',
      toValue(owner),
      toValue(repo),
      toValue(pullRequestNumber),
      toValue(page),
      toValue(perPage),
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

      return window.ohMyGithub.pulls.listPullRequestCommits(
        toValue(owner),
        toValue(repo),
        toValue(pullRequestNumber),
        toValue(page),
        toValue(perPage),
      )
    },
  })
}

export async function createPullRequestComment(
  owner: string,
  repo: string,
  pullRequestNumber: number,
  body: string,
): Promise<GitHubPullRequestComment> {
  if (!window.ohMyGithub?.pulls) {
    throw new Error('GitHub pulls bridge is unavailable')
  }

  return window.ohMyGithub.pulls.createPullRequestComment(owner, repo, pullRequestNumber, body)
}

export async function updatePullRequest(
  owner: string,
  repo: string,
  pullRequestNumber: number,
  changes: { title?: string, body?: string, state?: 'open' | 'closed', assignees?: string[], labels?: string[], milestone?: number | null },
): Promise<void> {
  if (!window.ohMyGithub?.pulls) {
    throw new Error('GitHub pulls bridge is unavailable')
  }

  return window.ohMyGithub.pulls.updatePullRequest(owner, repo, pullRequestNumber, changes)
}

export async function closePullRequest(
  owner: string,
  repo: string,
  pullRequestNumber: number,
): Promise<void> {
  if (!window.ohMyGithub?.pulls) {
    throw new Error('GitHub pulls bridge is unavailable')
  }

  return window.ohMyGithub.pulls.closePullRequest(owner, repo, pullRequestNumber)
}

export async function requestPullRequestReviewers(
  owner: string, repo: string, pullRequestNumber: number, reviewers: string[], removeReviewers: string[],
): Promise<void> {
  if (!window.ohMyGithub?.pulls) throw new Error('GitHub pull requests bridge is unavailable')
  return window.ohMyGithub.pulls.requestPullRequestReviewers(owner, repo, pullRequestNumber, reviewers, removeReviewers)
}

export async function markPullRequestReadyForReview(
  owner: string,
  repo: string,
  pullRequestNumber: number,
  id: string,
): Promise<void> {
  if (!window.ohMyGithub?.pulls) {
    throw new Error('GitHub pulls bridge is unavailable')
  }

  return window.ohMyGithub.pulls.markPullRequestReadyForReview(owner, repo, pullRequestNumber, id)
}

export async function mergePullRequest(
  owner: string,
  repo: string,
  pullRequestNumber: number,
  options: {
    method: GitHubPullRequestMergeMethod
    expectedHeadSha?: string | null
    commitTitle?: string
    commitMessage?: string
  },
): Promise<void> {
  if (!window.ohMyGithub?.pulls) {
    throw new Error('GitHub pulls bridge is unavailable')
  }

  return window.ohMyGithub.pulls.mergePullRequest(owner, repo, pullRequestNumber, options)
}

// PR list surfaces are cached under several key prefixes, and merge/close/reopen
// happen on the detail page while those lists are unmounted (not "active"). The
// default invalidateQueries only refetches active entries, so we force
// refetchActive: 'all' to refresh the unmounted list caches too — otherwise the
// merged PR keeps showing as open until a manual retry.
export function usePullRequestListInvalidation() {
  const queryCache = useQueryCache()

  return {
    invalidatePullRequestLists(owner: string, repo: string): void {
      void queryCache.invalidateQueries({ key: ['github', 'pull-request-category'] }, 'all')
      void queryCache.invalidateQueries({ key: ['github', 'viewer-pull-requests'] }, 'all')
      void queryCache.invalidateQueries({ key: ['github', 'repository-pull-requests', owner, repo] }, 'all')
      void queryCache.invalidateQueries({ key: ['github', 'repository-pull-request-search', owner, repo] }, 'all')
    },
  }
}

export async function submitPullRequestReview(
  owner: string,
  repo: string,
  pullRequestNumber: number,
  options: {
    event: GitHubPullRequestReviewEvent
    body?: string
  },
): Promise<void> {
  if (!window.ohMyGithub?.pulls) {
    throw new Error('GitHub pulls bridge is unavailable')
  }

  return window.ohMyGithub.pulls.submitPullRequestReview(owner, repo, pullRequestNumber, options)
}

export async function updatePullRequestComment(
  owner: string,
  repo: string,
  commentId: string | number,
  body: string,
): Promise<void> {
  if (!window.ohMyGithub?.pulls) {
    throw new Error('GitHub pulls bridge is unavailable')
  }

  return window.ohMyGithub.pulls.updatePullRequestComment(owner, repo, commentId, body)
}
