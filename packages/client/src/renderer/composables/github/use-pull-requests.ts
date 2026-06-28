import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useQuery } from '@pinia/colada'

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
