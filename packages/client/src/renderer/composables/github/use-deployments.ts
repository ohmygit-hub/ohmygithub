import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useQuery } from '@pinia/colada'

const ACTION_RUN_URL_PATTERN = /\/actions\/runs\/(\d+)/

export interface GitHubDeploymentRunPage {
  items: GitHubActionRun[]
  hasNextPage: boolean
}

export function useRepositoryEnvironmentsQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubEnvironmentPage>({
    key: () => ['github', 'deployments', 'environments', toValue(owner), toValue(repo)],
    enabled: () => Boolean(toValue(owner)) && Boolean(toValue(repo)) && toValue(enabled),
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      assertDeploymentsBridge()

      return window.ohMyGithub.deployments.listEnvironments({
        owner: toValue(owner),
        repo: toValue(repo),
      })
    },
  })
}

export function useRepositoryDeploymentRunsQuery(options: {
  owner: MaybeRefOrGetter<string>
  repo: MaybeRefOrGetter<string>
  environment: MaybeRefOrGetter<string | null>
  page: MaybeRefOrGetter<number>
  perPage: MaybeRefOrGetter<number>
  enabled: MaybeRefOrGetter<boolean>
}) {
  return useQuery<GitHubDeploymentRunPage>({
    key: () => [
      'github',
      'deployments',
      'runs',
      toValue(options.owner),
      toValue(options.repo),
      toValue(options.environment) ?? 'all',
      toValue(options.page),
      toValue(options.perPage),
    ],
    enabled: () =>
      Boolean(toValue(options.owner)) && Boolean(toValue(options.repo)) && toValue(options.enabled),
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      assertDeploymentsBridge()
      assertActionsBridge()

      const owner = toValue(options.owner)
      const repo = toValue(options.repo)
      const deploymentPage = await window.ohMyGithub.deployments.listDeployments({
        owner,
        repo,
        environment: toValue(options.environment),
        page: toValue(options.page),
        perPage: toValue(options.perPage),
      })

      const runIds: number[] = []
      const seenRunIds = new Set<number>()

      for (const deployment of deploymentPage.items) {
        const match = deployment.latestStatus?.logUrl?.match(ACTION_RUN_URL_PATTERN)
        if (!match) continue

        const runId = Number(match[1])
        if (seenRunIds.has(runId)) continue

        seenRunIds.add(runId)
        runIds.push(runId)
      }

      const results = await Promise.allSettled(
        runIds.map((runId) => window.ohMyGithub.actions.getWorkflowRun(owner, repo, runId)),
      )
      const items = results
        .filter((result): result is PromiseFulfilledResult<GitHubActionRun> => result.status === 'fulfilled')
        .map((result) => result.value)

      return {
        items,
        hasNextPage: deploymentPage.hasNextPage,
      }
    },
  })
}

function assertDeploymentsBridge(): void {
  if (!window.ohMyGithub?.deployments) {
    throw new Error('GitHub deployments bridge is unavailable')
  }
}

function assertActionsBridge(): void {
  if (!window.ohMyGithub?.actions) {
    throw new Error('GitHub actions bridge is unavailable')
  }
}
