import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useQuery, useQueryCache } from '@pinia/colada'

export function useAccountProfileQuery(
  login: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountProfile>({
    key: () => ['github', 'account-profile', toValue(login)],
    enabled: () => Boolean(toValue(login)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.getProfile(toValue(login))
    },
  })
}

export function useAccountOverviewQuery(
  login: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountOverview>({
    key: () => ['github', 'account-overview', toValue(login)],
    enabled: () => Boolean(toValue(login)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.getOverview(toValue(login))
    },
  })
}

export function useAccountContributionsQuery(
  login: MaybeRefOrGetter<string>,
  year: MaybeRefOrGetter<number | null>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountContributionYear>({
    key: () => ['github', 'account-contributions', toValue(login), toValue(year) ?? 'current'],
    enabled: () => Boolean(toValue(login)) && Boolean(toValue(year)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.getContributions({
        login: toValue(login),
        year: toValue(year) ?? undefined,
      })
    },
  })
}

export function useViewerRepositoriesQuery(enabled: MaybeRefOrGetter<boolean> = true) {
  return useQuery<GitHubRepository[]>({
    key: ['github', 'viewer-repositories'],
    enabled: () => toValue(enabled),
    // Backs the Ctrl-K palette's local fuzzy search. Fetched once and kept warm for the
    // session (long stale/gc, no focus refetch); a single cold fetch after launch is fine.
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.listAllViewerRepositories()
    },
  })
}

export function useAccountRepositoriesQuery(
  login: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
  perPage: MaybeRefOrGetter<number>,
  search: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountRepositoryPage>({
    key: () => [
      'github',
      'account-repositories',
      toValue(login),
      toValue(page),
      toValue(perPage),
      toValue(search).trim(),
    ],
    enabled: () => Boolean(toValue(login)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.listRepositories({
        login: toValue(login),
        page: toValue(page),
        perPage: toValue(perPage),
        search: toValue(search).trim(),
      })
    },
  })
}

export function useAccountStarredRepositoriesQuery(
  login: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
  perPage: MaybeRefOrGetter<number>,
  search: MaybeRefOrGetter<string>,
  list: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountRepositoryPage>({
    key: () => [
      'github',
      'account-starred-repositories',
      toValue(login),
      toValue(page),
      toValue(perPage),
      toValue(search).trim(),
      toValue(list).trim(),
    ],
    enabled: () => Boolean(toValue(login)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.listStarredRepositories({
        login: toValue(login),
        page: toValue(page),
        perPage: toValue(perPage),
        search: toValue(search).trim(),
        list: toValue(list).trim(),
      })
    },
  })
}

export function useAccountStarredListsQuery(
  login: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountStarList[]>({
    key: () => ['github', 'account-starred-lists', toValue(login)],
    enabled: () => Boolean(toValue(login)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.listStarredLists(toValue(login))
    },
  })
}

export function useAccountFollowersQuery(
  login: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountFollowList>({
    key: () => ['github', 'account-followers', toValue(login)],
    enabled: () => Boolean(toValue(login)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.listFollowers(toValue(login))
    },
  })
}

export function useAccountFollowingQuery(
  login: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountFollowList>({
    key: () => ['github', 'account-following', toValue(login)],
    enabled: () => Boolean(toValue(login)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.listFollowing(toValue(login))
    },
  })
}

export function useAccountSponsorsSummaryQuery(
  login: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountSponsorsSummary>({
    key: () => ['github', 'account-sponsors-summary', toValue(login)],
    enabled: () => Boolean(toValue(login)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.getSponsorsSummary(toValue(login))
    },
  })
}

export function useAccountSponsorshipsQuery(
  login: MaybeRefOrGetter<string>,
  role: MaybeRefOrGetter<GitHubSponsorshipRole>,
  page: MaybeRefOrGetter<number>,
  perPage: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountSponsorshipPage>({
    key: () => ['github', 'account-sponsorships', toValue(login), toValue(role), toValue(page), toValue(perPage)],
    enabled: () => Boolean(toValue(login)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.listSponsorships({
        login: toValue(login),
        role: toValue(role),
        page: toValue(page),
        perPage: toValue(perPage),
      })
    },
  })
}

export function useAccountViewerStateQuery(
  login: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubAccountViewerState>({
    key: () => ['github', 'account-viewer-state', toValue(login)],
    enabled: () => Boolean(toValue(login)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.accounts) {
        throw new Error('GitHub accounts bridge is unavailable')
      }

      return window.ohMyGithub.accounts.getViewerState(toValue(login))
    },
  })
}

export async function setAccountFollowed(login: string, followed: boolean): Promise<void> {
  if (!window.ohMyGithub?.accounts) {
    throw new Error('GitHub accounts bridge is unavailable')
  }

  await window.ohMyGithub.accounts.setFollowed({ login, followed })
}

// Star/fork/follow mutate data shown in account lists that live on a different
// (usually unmounted) route and set refetchOnMount:false, so they freeze. Force
// refetchActive:'all'. See usePullRequestListInvalidation for the same shape.
export function useAccountListInvalidation() {
  const queryCache = useQueryCache()

  return {
    // Starring a repo changes the viewer's "Stars" list (keyed by viewer login);
    // invalidate the whole prefix rather than guess the login.
    invalidateStarredRepositories(): void {
      void queryCache.invalidateQueries({ key: ['github', 'account-starred-repositories'] }, 'all')
      void queryCache.invalidateQueries({ key: ['github', 'account-starred-lists'] }, 'all')
    },
    // A new fork lands under `owner` (viewer account or org); only one list matches.
    invalidateOwnedRepositories(owner: string): void {
      void queryCache.invalidateQueries({ key: ['github', 'account-repositories', owner] }, 'all')
      void queryCache.invalidateQueries({ key: ['github', 'organization-repositories', owner] }, 'all')
    },
    // Following someone changes their follower/following counts on the profile.
    invalidateAccountProfile(login: string): void {
      void queryCache.invalidateQueries({ key: ['github', 'account-profile', login] }, 'all')
      void queryCache.invalidateQueries({ key: ['github', 'account-overview', login] }, 'all')
    },
    // Follow/unfollow changes the viewer's following list and any follower
    // list that includes the viewer; invalidate both prefixes.
    invalidateFollowLists(): void {
      void queryCache.invalidateQueries({ key: ['github', 'account-followers'] }, 'all')
      void queryCache.invalidateQueries({ key: ['github', 'account-following'] }, 'all')
    },
  }
}
