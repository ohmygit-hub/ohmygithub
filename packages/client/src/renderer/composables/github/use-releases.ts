import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useQuery } from '@pinia/colada'

export function useRepositoryReleasesQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
  perPage: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubReleasePage>({
    key: () => ['github', 'releases', toValue(owner), toValue(repo), toValue(page), toValue(perPage)],
    enabled: () => Boolean(toValue(owner)) && Boolean(toValue(repo)) && toValue(enabled),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      assertReleasesBridge()

      return window.ohMyGithub.releases.listRepositoryReleases({
        owner: toValue(owner),
        repo: toValue(repo),
        page: toValue(page),
        perPage: toValue(perPage),
      })
    },
  })
}

export async function createRelease(options: CreateReleaseOptions): Promise<GitHubRelease> {
  assertReleasesBridge()

  return window.ohMyGithub.releases.createRelease(options)
}

export async function updateRelease(
  owner: string,
  repo: string,
  releaseId: number,
  changes: UpdateReleaseChanges,
): Promise<GitHubRelease> {
  assertReleasesBridge()

  return window.ohMyGithub.releases.updateRelease(owner, repo, releaseId, changes)
}

export async function publishRelease(
  owner: string,
  repo: string,
  releaseId: number,
): Promise<GitHubRelease> {
  return updateRelease(owner, repo, releaseId, { draft: false })
}

export async function deleteRelease(
  owner: string,
  repo: string,
  releaseId: number,
): Promise<void> {
  assertReleasesBridge()

  await window.ohMyGithub.releases.deleteRelease(owner, repo, releaseId)
}

function assertReleasesBridge(): void {
  if (!window.ohMyGithub?.releases) {
    throw new Error('GitHub releases bridge is unavailable')
  }
}
