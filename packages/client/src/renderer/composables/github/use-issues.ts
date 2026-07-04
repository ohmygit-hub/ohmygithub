import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useQuery, useQueryCache } from '@pinia/colada'

export function useIssueCategoryQuery(
  category: MaybeRefOrGetter<GitHubIssueCategory>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubIssue[]>({
    key: () => ['github', 'issue-category', toValue(category)],
    enabled: () => toValue(enabled),
    query: async () => {
      if (!window.ohMyGithub?.issues) {
        throw new Error('GitHub issues bridge is unavailable')
      }

      return window.ohMyGithub.issues.listIssueCategory(toValue(category))
    },
  })
}

export function useViewerIssuesQuery(enabled: MaybeRefOrGetter<boolean>) {
  return useQuery<GitHubIssue[]>({
    key: ['github', 'viewer-issues'],
    enabled: () => toValue(enabled),
    query: async () => {
      if (!window.ohMyGithub?.issues) {
        throw new Error('GitHub issues bridge is unavailable')
      }

      return window.ohMyGithub.issues.listViewerIssues()
    },
  })
}

export function useRepositoryIssuesQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubIssue[]>({
    key: () => ['github', 'repository-issues', toValue(owner), toValue(repo)],
    enabled: () => Boolean(toValue(owner)) && Boolean(toValue(repo)) && toValue(enabled),
    query: async () => {
      if (!window.ohMyGithub?.issues) {
        throw new Error('GitHub issues bridge is unavailable')
      }

      return window.ohMyGithub.issues.listRepositoryIssues(toValue(owner), toValue(repo))
    },
  })
}

export function useRepositoryIssueSearchQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  state: MaybeRefOrGetter<GitHubIssueSearchState>,
  search: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
  perPage: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubIssueSearchResult>({
    key: () => [
      'github',
      'repository-issue-search',
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
      if (!window.ohMyGithub?.issues) {
        throw new Error('GitHub issues bridge is unavailable')
      }

      return window.ohMyGithub.issues.searchRepositoryIssues({
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

export function useIssueDetailQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  issueNumber: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubIssueDetail>({
    key: () => ['github', 'issue-detail', toValue(owner), toValue(repo), toValue(issueNumber)],
    enabled: () => {
      const number = toValue(issueNumber)

      return Boolean(toValue(owner))
        && Boolean(toValue(repo))
        && Number.isInteger(number)
        && number > 0
        && toValue(enabled)
    },
    query: async () => {
      if (!window.ohMyGithub?.issues) {
        throw new Error('GitHub issues bridge is unavailable')
      }

      return window.ohMyGithub.issues.getIssueDetail(
        toValue(owner),
        toValue(repo),
        toValue(issueNumber),
      )
    },
  })
}

export async function createIssueComment(
  owner: string,
  repo: string,
  issueNumber: number,
  body: string,
): Promise<GitHubIssueComment> {
  if (!window.ohMyGithub?.issues) {
    throw new Error('GitHub issues bridge is unavailable')
  }

  return window.ohMyGithub.issues.createIssueComment(owner, repo, issueNumber, body)
}

export function useRepositoryLabelsQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubLabel[]>({
    key: () => ['github', 'repo-labels', toValue(owner), toValue(repo)],
    enabled: () => Boolean(toValue(owner)) && Boolean(toValue(repo)) && toValue(enabled),
    query: async () => {
      if (!window.ohMyGithub?.issues) {
        throw new Error('GitHub issues bridge is unavailable')
      }

      return window.ohMyGithub.issues.listRepositoryLabels(toValue(owner), toValue(repo))
    },
  })
}

export function useRepositoryMilestonesQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubIssueMilestone[]>({
    key: () => ['github', 'repo-milestones', toValue(owner), toValue(repo)],
    enabled: () => Boolean(toValue(owner)) && Boolean(toValue(repo)) && toValue(enabled),
    query: async () => {
      if (!window.ohMyGithub?.issues) {
        throw new Error('GitHub issues bridge is unavailable')
      }

      return window.ohMyGithub.issues.listRepositoryMilestones(toValue(owner), toValue(repo))
    },
  })
}

export function useAssignableUsersQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubActor[]>({
    key: () => ['github', 'assignable-users', toValue(owner), toValue(repo)],
    enabled: () => Boolean(toValue(owner)) && Boolean(toValue(repo)) && toValue(enabled),
    query: async () => {
      if (!window.ohMyGithub?.issues) {
        throw new Error('GitHub issues bridge is unavailable')
      }

      return window.ohMyGithub.issues.listAssignableUsers(toValue(owner), toValue(repo))
    },
  })
}

export async function updateIssue(
  owner: string,
  repo: string,
  issueNumber: number,
  changes: {
    title?: string
    body?: string
    state?: 'open' | 'closed'
    stateReason?: 'completed' | 'not_planned'
    assignees?: string[]
    labels?: string[]
    milestone?: number | null
  },
): Promise<void> {
  if (!window.ohMyGithub?.issues) {
    throw new Error('GitHub issues bridge is unavailable')
  }

  return window.ohMyGithub.issues.updateIssue(owner, repo, issueNumber, changes)
}

export async function updateIssueComment(
  owner: string,
  repo: string,
  commentId: string | number,
  body: string,
): Promise<void> {
  if (!window.ohMyGithub?.issues) {
    throw new Error('GitHub issues bridge is unavailable')
  }

  return window.ohMyGithub.issues.updateIssueComment(owner, repo, commentId, body)
}

export async function setIssueSubscription(subscribableId: string, subscribed: boolean): Promise<void> {
  if (!window.ohMyGithub?.issues) {
    throw new Error('GitHub issues bridge is unavailable')
  }

  return window.ohMyGithub.issues.setIssueSubscription(subscribableId, subscribed)
}

export async function setIssueLock(owner: string, repo: string, issueNumber: number, locked: boolean): Promise<void> {
  if (!window.ohMyGithub?.issues) {
    throw new Error('GitHub issues bridge is unavailable')
  }

  return window.ohMyGithub.issues.setIssueLock(owner, repo, issueNumber, locked)
}

export async function setIssuePinned(issueId: string, pinned: boolean): Promise<void> {
  if (!window.ohMyGithub?.issues) {
    throw new Error('GitHub issues bridge is unavailable')
  }

  return window.ohMyGithub.issues.setIssuePinned(issueId, pinned)
}

export async function deleteIssue(issueId: string): Promise<void> {
  if (!window.ohMyGithub?.issues) {
    throw new Error('GitHub issues bridge is unavailable')
  }

  return window.ohMyGithub.issues.deleteIssue(issueId)
}

// Issue mutations (close/reopen/title/labels/assignees/delete) happen on the
// detail page while the issue lists are unmounted, so a bare detail refetch
// leaves them stale — and `repository-issue-search` has refetchOnMount:false, so
// it stays frozen even on navigate-back. Force refetchActive:'all' to refresh the
// unmounted list caches too. See usePullRequestListInvalidation for the same shape.
export function useIssueListInvalidation() {
  const queryCache = useQueryCache()

  return {
    invalidateIssueLists(owner: string, repo: string): void {
      void queryCache.invalidateQueries({ key: ['github', 'issue-category'] }, 'all')
      void queryCache.invalidateQueries({ key: ['github', 'repository-issues', owner, repo] }, 'all')
      void queryCache.invalidateQueries({ key: ['github', 'repository-issue-search', owner, repo] }, 'all')
    },
  }
}
