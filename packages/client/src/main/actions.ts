import {
  createGitHubApi,
  type GitHubActionRunStatus,
  type ListRepositoryWorkflowRunsOptions,
  type ListWorkflowRunJobsOptions,
  type WorkflowJobLogHint,
} from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken } from './auth'
import { resolveGitHubTransport } from './proxy'

export function registerActionsIpc(): void {
  ipcMain.handle('actions:list-workflows', (_event, owner: string, repo: string) =>
    listRepositoryWorkflows(owner, repo)
  )
  ipcMain.handle('actions:list-runs', (_event, options: ListRepositoryWorkflowRunsOptions) =>
    listRepositoryWorkflowRuns(options)
  )
  ipcMain.handle('actions:get-run', (_event, owner: string, repo: string, runId: number) =>
    getWorkflowRun(owner, repo, runId)
  )
  ipcMain.handle('actions:list-run-jobs', (_event, options: ListWorkflowRunJobsOptions) =>
    listWorkflowRunJobs(options)
  )
  ipcMain.handle('actions:get-job-log', (_event, owner: string, repo: string, jobId: number, job?: unknown) =>
    getWorkflowJobLog(owner, repo, jobId, job)
  )
  ipcMain.handle('actions:rerun-run', (_event, owner: string, repo: string, runId: number) =>
    rerunWorkflowRun(owner, repo, runId)
  )
  ipcMain.handle('actions:rerun-failed-run-jobs', (_event, owner: string, repo: string, runId: number) =>
    rerunFailedWorkflowRunJobs(owner, repo, runId)
  )
  ipcMain.handle('actions:rerun-job', (_event, owner: string, repo: string, jobId: number) =>
    rerunWorkflowJob(owner, repo, jobId)
  )
  ipcMain.handle('actions:dispatch-workflow', (_event, owner: string, repo: string, workflowId: number, ref: string) =>
    dispatchWorkflow(owner, repo, workflowId, ref)
  )
}

async function listRepositoryWorkflows(owner: string, repo: string) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.actions.listRepositoryWorkflows(repository)
}

async function listRepositoryWorkflowRuns(options: ListRepositoryWorkflowRunsOptions) {
  const repository = normalizeRepository(options.owner, options.repo)
  const api = await createAuthenticatedGitHubApi()

  return api.actions.listRepositoryWorkflowRuns({
    ...repository,
    headSha: normalizeOptionalString(options.headSha),
    workflowId: normalizeWorkflowId(options.workflowId),
    page: normalizePositiveInteger(options.page, 1),
    perPage: normalizePositiveInteger(options.perPage, 20),
  })
}

async function getWorkflowRun(owner: string, repo: string, runId: number) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.actions.getWorkflowRun({
    ...repository,
    runId: normalizePositiveInteger(runId, 1),
  })
}

async function listWorkflowRunJobs(options: ListWorkflowRunJobsOptions) {
  const repository = normalizeRepository(options.owner, options.repo)
  const api = await createAuthenticatedGitHubApi()

  return api.actions.listWorkflowRunJobs({
    ...repository,
    runId: normalizePositiveInteger(options.runId, 1),
    filter: options.filter === 'all' ? 'all' : 'latest',
  })
}

async function getWorkflowJobLog(owner: string, repo: string, jobId: number, job?: unknown) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.actions.getWorkflowJobLog({
    ...repository,
    jobId: normalizePositiveInteger(jobId, 1),
    job: normalizeJobLogHint(job),
  })
}

async function rerunWorkflowRun(owner: string, repo: string, runId: number) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  await api.actions.rerunWorkflowRun({
    ...repository,
    runId: normalizePositiveInteger(runId, 1),
  })
}

async function rerunFailedWorkflowRunJobs(owner: string, repo: string, runId: number) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  await api.actions.rerunFailedWorkflowRunJobs({
    ...repository,
    runId: normalizePositiveInteger(runId, 1),
  })
}

async function rerunWorkflowJob(owner: string, repo: string, jobId: number) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  await api.actions.rerunWorkflowJob({
    ...repository,
    jobId: normalizePositiveInteger(jobId, 1),
  })
}

async function dispatchWorkflow(owner: string, repo: string, workflowId: number, ref: string) {
  const repository = normalizeRepository(owner, repo)
  const normalizedRef = ref.trim()

  if (!normalizedRef) {
    throw new Error('Workflow dispatch ref is required')
  }

  const api = await createAuthenticatedGitHubApi()

  await api.actions.dispatchWorkflow({
    ...repository,
    workflowId: normalizePositiveInteger(workflowId, 1),
    ref: normalizedRef,
  })
}

function normalizeRepository(owner: string, repo: string) {
  const normalizedOwner = owner.trim()
  const normalizedRepo = repo.trim()

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  return {
    owner: normalizedOwner,
    repo: normalizedRepo,
  }
}

function normalizeJobLogHint(value: unknown): WorkflowJobLogHint | undefined {
  if (!value || typeof value !== 'object') return undefined

  const hint = value as Partial<WorkflowJobLogHint>
  const name = typeof hint.name === 'string' ? hint.name.trim() : ''

  if (!name || typeof hint.runId !== 'number' || !Number.isInteger(hint.runId) || hint.runId <= 0) {
    return undefined
  }

  return {
    runId: hint.runId,
    runAttempt: typeof hint.runAttempt === 'number' && Number.isInteger(hint.runAttempt) && hint.runAttempt > 0
      ? hint.runAttempt
      : 1,
    name,
    status: typeof hint.status === 'string' ? hint.status as GitHubActionRunStatus : null,
  }
}

function normalizeWorkflowId(value: ListRepositoryWorkflowRunsOptions['workflowId']): number | 'all' {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value

  return 'all'
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  const normalized = value?.trim()

  return normalized || null
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback

  return Math.max(1, Math.round(value))
}

async function createAuthenticatedGitHubApi() {
  return createGitHubApi({
    token: getAuthenticatedAccessToken(),
    ...(await resolveGitHubTransport())
  })
}
