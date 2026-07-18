import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useQuery, useQueryCache } from '@pinia/colada'

function requireBridge() {
  const bridge = window.ohMyGithub?.organizationTeams

  if (!bridge) {
    throw new Error('GitHub organization teams bridge is unavailable')
  }

  return bridge
}

export function useOrganizationTeamsQuery(
  org: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubOrganizationTeams>({
    key: () => ['github', 'organization-teams', toValue(org)],
    enabled: () => Boolean(toValue(org)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => requireBridge().getTeams(toValue(org)),
  })
}

export function useTeamDetailQuery(
  org: MaybeRefOrGetter<string>,
  teamSlug: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubTeamDetail>({
    key: () => ['github', 'team-detail', toValue(org), toValue(teamSlug)],
    enabled: () => Boolean(toValue(org)) && Boolean(toValue(teamSlug)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => requireBridge().getTeamDetail({ org: toValue(org), teamSlug: toValue(teamSlug) }),
  })
}

export async function createTeam(options: CreateTeamOptions): Promise<GitHubCreatedTeam> {
  return requireBridge().createTeam(options)
}

export async function updateTeam(options: UpdateTeamOptions): Promise<GitHubCreatedTeam> {
  return requireBridge().updateTeam(options)
}

export async function deleteTeam(options: OrganizationTeamOptions): Promise<void> {
  await requireBridge().deleteTeam(options)
}

export async function setTeamMembership(options: SetTeamMembershipOptions): Promise<void> {
  await requireBridge().setTeamMembership(options)
}

export async function removeTeamMember(options: TeamMemberOptions): Promise<void> {
  await requireBridge().removeTeamMember(options)
}

export async function addOrUpdateTeamRepository(options: AddOrUpdateTeamRepositoryOptions): Promise<void> {
  await requireBridge().addOrUpdateTeamRepository(options)
}

export async function removeTeamRepository(options: TeamRepositoryOptions): Promise<void> {
  await requireBridge().removeTeamRepository(options)
}

// Mutations land on lists rendered by a possibly unmounted route with
// refetchOnMount:false; force refetchActive:'all' like the other modules.
export function useTeamInvalidation() {
  const queryCache = useQueryCache()

  return {
    invalidateTeams(org: string): void {
      void queryCache.invalidateQueries({ key: ['github', 'organization-teams', org] }, 'all')
    },
    invalidateTeamDetail(org: string, teamSlug: string): void {
      void queryCache.invalidateQueries({ key: ['github', 'team-detail', org, teamSlug] }, 'all')
    },
    invalidateAllTeamDetails(org: string): void {
      void queryCache.invalidateQueries({ key: ['github', 'team-detail', org] }, 'all')
    },
  }
}
