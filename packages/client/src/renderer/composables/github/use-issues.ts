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
