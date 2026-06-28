import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useQuery } from '@pinia/colada'

export function useOrganizationsQuery() {
  return useQuery<GitHubOrganization[]>({
    key: ['github', 'organizations'],
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.listOrganizations()
    },
  })
}

export function useOrganizationRepositoriesQuery(
  owner: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubRepository[]>({
    key: () => ['github', 'organization-repositories', toValue(owner)],
    enabled: () => Boolean(toValue(owner)) && toValue(enabled),
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.listOrganizationRepositories(toValue(owner))
    },
  })
}
