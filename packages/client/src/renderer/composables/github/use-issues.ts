import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useQuery } from '@pinia/colada'

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
