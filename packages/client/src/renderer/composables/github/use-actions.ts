import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useQuery, useQueryCache } from '@pinia/colada'

export interface CommitActionRun {
  jobs: GitHubActionJob[]
  jobsError: string | null
  run: GitHubActionRun
}

export function useRepositoryWorkflowsQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubActionWorkflow[]>({
    key: () => ['github', 'actions', 'workflows', toValue(owner), toValue(repo)],
    enabled: () => Boolean(toValue(owner)) && Boolean(toValue(repo)) && toValue(enabled),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.actions) {
        throw new Error('GitHub actions bridge is unavailable')
      }

      return window.ohMyGithub.actions.listRepositoryWorkflows(toValue(owner), toValue(repo))
    },
  })
}

export function useRepositoryWorkflowRunsQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  workflowId: MaybeRefOrGetter<number | null>,
  page: MaybeRefOrGetter<number>,
  perPage: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubActionRunPage>({
    key: () => [
      'github',
      'actions',
      'workflow-runs',
      toValue(owner),
      toValue(repo),
      toValue(workflowId) ?? 'all',
      toValue(page),
      toValue(perPage),
    ],
    enabled: () => Boolean(toValue(owner)) && Boolean(toValue(repo)) && toValue(enabled),
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.actions) {
        throw new Error('GitHub actions bridge is unavailable')
      }

      return window.ohMyGithub.actions.listRepositoryWorkflowRuns({
        owner: toValue(owner),
        repo: toValue(repo),
        workflowId: toValue(workflowId) ?? undefined,
        page: toValue(page),
        perPage: toValue(perPage),
      })
    },
  })
}

export function useWorkflowRunQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  runId: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubActionRun>({
    key: () => ['github', 'actions', 'workflow-run', toValue(owner), toValue(repo), toValue(runId)],
    enabled: () => isValidRepositoryRun(owner, repo, runId) && toValue(enabled),
    staleTime: 1000 * 10,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.actions) {
        throw new Error('GitHub actions bridge is unavailable')
      }

      return window.ohMyGithub.actions.getWorkflowRun(toValue(owner), toValue(repo), toValue(runId))
    },
  })
}

export function useWorkflowRunJobsQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  runId: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<GitHubActionJob[]>({
    key: () => ['github', 'actions', 'workflow-run-jobs', toValue(owner), toValue(repo), toValue(runId)],
    enabled: () => isValidRepositoryRun(owner, repo, runId) && toValue(enabled),
    staleTime: 1000 * 10,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.actions) {
        throw new Error('GitHub actions bridge is unavailable')
      }

      return window.ohMyGithub.actions.listWorkflowRunJobs({
        owner: toValue(owner),
        repo: toValue(repo),
        runId: toValue(runId),
      })
    },
  })
}

export function useWorkflowJobLogQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  jobId: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean>,
  job?: MaybeRefOrGetter<GitHubActionJob | null>,
) {
  return useQuery<GitHubActionJobLog>({
    key: () => ['github', 'actions', 'workflow-job-log', toValue(owner), toValue(repo), toValue(jobId)],
    enabled: () => {
      const id = toValue(jobId)

      return Boolean(toValue(owner))
        && Boolean(toValue(repo))
        && Number.isInteger(id)
        && id > 0
        && toValue(enabled)
    },
    staleTime: 1000 * 5,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      if (!window.ohMyGithub?.actions) {
        throw new Error('GitHub actions bridge is unavailable')
      }

      return window.ohMyGithub.actions.getWorkflowJobLog(
        toValue(owner),
        toValue(repo),
        toValue(jobId),
        createWorkflowJobLogHint(toValue(job) ?? null, toValue(jobId)),
      )
    },
  })
}

function createWorkflowJobLogHint(job: GitHubActionJob | null, jobId: number): WorkflowJobLogHint | undefined {
  if (!job || job.id !== jobId) return undefined

  return {
    runId: job.runId,
    runAttempt: job.runAttempt,
    name: job.name,
    status: job.status,
  }
}

export function useCommitActionRunsQuery(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  sha: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useQuery<CommitActionRun[]>({
    key: () => ['github', 'actions', 'commit-runs', toValue(owner), toValue(repo), toValue(sha)],
    enabled: () => {
      return Boolean(toValue(owner))
        && Boolean(toValue(repo))
        && Boolean(toValue(sha))
        && toValue(enabled)
    },
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    query: async () => {
      assertActionsBridge()

      const result = await window.ohMyGithub.actions.listRepositoryWorkflowRuns({
        owner: toValue(owner),
        repo: toValue(repo),
        headSha: toValue(sha),
        page: 1,
        perPage: 100,
      })

      return Promise.all(
        result.items.map(async (run): Promise<CommitActionRun> => {
          try {
            const jobs = await window.ohMyGithub.actions.listWorkflowRunJobs({
              owner: toValue(owner),
              repo: toValue(repo),
              runId: run.id,
            })

            return { jobs, jobsError: null, run }
          } catch (error) {
            return {
              jobs: [],
              jobsError: error instanceof Error && error.message ? error.message : '',
              run,
            }
          }
        }),
      )
    },
  })
}

export async function rerunWorkflowRun(
  owner: string,
  repo: string,
  runId: number,
): Promise<void> {
  assertActionsBridge()

  await window.ohMyGithub.actions.rerunWorkflowRun(owner, repo, runId)
}

export async function rerunFailedWorkflowRunJobs(
  owner: string,
  repo: string,
  runId: number,
): Promise<void> {
  assertActionsBridge()

  await window.ohMyGithub.actions.rerunFailedWorkflowRunJobs(owner, repo, runId)
}

export async function rerunWorkflowJob(
  owner: string,
  repo: string,
  jobId: number,
): Promise<void> {
  assertActionsBridge()

  await window.ohMyGithub.actions.rerunWorkflowJob(owner, repo, jobId)
}

// Reruns happen on the action-run detail route while the run lists are unmounted,
// so refetching only the detail queries leaves them stale. Worse, the runs list
// polling is gated on hasLiveRuns derived from the (stale, all-completed) cache,
// so it never restarts on its own. Force refetchActive:'all' to refresh the
// unmounted run-list caches. See usePullRequestListInvalidation for the shape.
export function useActionRunListInvalidation() {
  const queryCache = useQueryCache()

  return {
    invalidateActionRunLists(owner: string, repo: string): void {
      void queryCache.invalidateQueries({ key: ['github', 'actions', 'workflow-runs', owner, repo] }, 'all')
      void queryCache.invalidateQueries({ key: ['github', 'actions', 'commit-runs', owner, repo] }, 'all')
      void queryCache.invalidateQueries({ key: ['github', 'deployments', 'runs', owner, repo] }, 'all')
    },
  }
}

function isValidRepositoryRun(
  owner: MaybeRefOrGetter<string>,
  repo: MaybeRefOrGetter<string>,
  runId: MaybeRefOrGetter<number>,
): boolean {
  const id = toValue(runId)

  return Boolean(toValue(owner))
    && Boolean(toValue(repo))
    && Number.isInteger(id)
    && id > 0
}

function assertActionsBridge(): void {
  if (!window.ohMyGithub?.actions) {
    throw new Error('GitHub actions bridge is unavailable')
  }
}
