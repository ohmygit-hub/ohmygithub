import { inflateRawSync } from 'node:zlib'
import type { GitHubOctokit } from '../transport'
import type {
  GetWorkflowJobLogOptions,
  GetWorkflowRunOptions,
  GitHubActionConclusion,
  GitHubActionJob,
  GitHubActionJobLog,
  GitHubActionJobLogStep,
  GitHubActionRun,
  GitHubActionRunPage,
  GitHubActionRunStatus,
  GitHubActionStep,
  GitHubActionWorkflow,
  GitHubActionWorkflowState,
  GitHubActor,
  ListRepositoryWorkflowRunsOptions,
  ListWorkflowRunJobsOptions,
  RepositoryOptions,
  RerunWorkflowJobOptions,
  RerunWorkflowRunOptions,
  WorkflowJobLogHint,
} from '../types'

interface WorkflowResponse {
  id?: number
  node_id?: string | null
  name?: string | null
  path?: string | null
  state?: string | null
  created_at?: string | null
  updated_at?: string | null
  url?: string | null
  html_url?: string | null
  badge_url?: string | null
}

interface WorkflowListResponse {
  total_count?: number
  workflows?: WorkflowResponse[]
}

interface WorkflowRunResponse {
  id?: number
  run_number?: number
  run_attempt?: number
  name?: string | null
  display_title?: string | null
  workflow_id?: number
  workflow_url?: string | null
  event?: string | null
  status?: string | null
  conclusion?: string | null
  head_branch?: string | null
  head_sha?: string | null
  actor?: ActorResponse | null
  triggering_actor?: ActorResponse | null
  check_suite_id?: number | null
  created_at?: string | null
  updated_at?: string | null
  run_started_at?: string | null
  html_url?: string | null
  url?: string | null
  jobs_url?: string | null
  logs_url?: string | null
}

interface WorkflowRunListResponse {
  total_count?: number
  workflow_runs?: WorkflowRunResponse[]
}

interface WorkflowJobResponse {
  id?: number
  run_id?: number
  run_attempt?: number
  name?: string | null
  status?: string | null
  conclusion?: string | null
  started_at?: string | null
  completed_at?: string | null
  html_url?: string | null
  runner_name?: string | null
  labels?: string[] | null
  steps?: WorkflowStepResponse[] | null
}

interface ZipTextFile {
  content: string
  name: string
}

interface WorkflowJobsResponse {
  total_count?: number
  jobs?: WorkflowJobResponse[]
}

interface WorkflowStepResponse {
  number?: number
  name?: string | null
  status?: string | null
  conclusion?: string | null
  started_at?: string | null
  completed_at?: string | null
}

interface ActorResponse {
  login?: string | null
  avatar_url?: string | null
}

const DEFAULT_RUNS_PER_PAGE = 20
const MAX_PER_PAGE = 100

export class ActionsApi {
  constructor(private readonly octokit: GitHubOctokit) {}

  async listRepositoryWorkflows(options: RepositoryOptions): Promise<GitHubActionWorkflow[]> {
    const workflows: WorkflowResponse[] = []
    let page = 1

    while (true) {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/actions/workflows', {
        owner: options.owner,
        repo: options.repo,
        page,
        per_page: MAX_PER_PAGE,
      })
      const payload = response.data as WorkflowListResponse
      const currentWorkflows = payload.workflows ?? []

      workflows.push(...currentWorkflows)

      if (isLastPage(workflows.length, currentWorkflows.length, payload.total_count)) {
        break
      }

      page += 1
    }

    return workflows
      .map((workflow) => mapWorkflow(options, workflow))
      .sort((left, right) => left.name.localeCompare(right.name))
  }

  async listRepositoryWorkflowRuns(
    options: ListRepositoryWorkflowRunsOptions,
  ): Promise<GitHubActionRunPage> {
    const page = normalizePositiveInteger(options.page, 1)
    const perPage = normalizePerPage(options.perPage)
    const workflowId = options.workflowId && options.workflowId !== 'all' ? options.workflowId : null
    const headSha = normalizeOptionalString(options.headSha)
    const requestOptions = {
      owner: options.owner,
      repo: options.repo,
      page,
      per_page: perPage,
      ...(headSha ? { head_sha: headSha } : {}),
    }
    const response = workflowId
      ? await this.octokit.request('GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs', {
        ...requestOptions,
        workflow_id: workflowId,
      })
      : await this.octokit.request('GET /repos/{owner}/{repo}/actions/runs', {
        ...requestOptions,
      })
    const payload = response.data as WorkflowRunListResponse
    const totalCount = payload.total_count ?? 0

    return {
      items: (payload.workflow_runs ?? []).map((run) => mapRun(options, run)),
      totalCount,
      page,
      perPage,
      hasNextPage: page * perPage < totalCount,
    }
  }

  async getWorkflowRun(options: GetWorkflowRunOptions): Promise<GitHubActionRun> {
    const response = await this.octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}', {
      owner: options.owner,
      repo: options.repo,
      run_id: options.runId,
    })

    return mapRun(options, response.data as WorkflowRunResponse)
  }

  async listWorkflowRunJobs(options: ListWorkflowRunJobsOptions): Promise<GitHubActionJob[]> {
    const jobs: WorkflowJobResponse[] = []
    let page = 1

    while (true) {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs', {
        owner: options.owner,
        repo: options.repo,
        run_id: options.runId,
        filter: options.filter ?? 'latest',
        page,
        per_page: MAX_PER_PAGE,
      })
      const payload = response.data as WorkflowJobsResponse
      const currentJobs = payload.jobs ?? []

      jobs.push(...currentJobs)

      if (isLastPage(jobs.length, currentJobs.length, payload.total_count)) {
        break
      }

      page += 1
    }

    return jobs.map((job) => mapJob(job, options.runId))
  }

  async getWorkflowJobLog(options: GetWorkflowJobLogOptions): Promise<GitHubActionJobLog> {
    if (options.job?.status === 'completed') {
      const archiveLog = await this.getWorkflowJobLogFromArchive(options, options.job)
      if (archiveLog) return archiveLog
    }

    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs', {
        owner: options.owner,
        repo: options.repo,
        job_id: options.jobId,
      })

      return {
        jobId: options.jobId,
        content: normalizeLogContent(response.data),
        fetchedAt: new Date().toISOString(),
        isAvailable: true,
      }
    } catch (error) {
      if (isTransientJobLogUnavailableError(error)) {
        const fallbackLog = await this.getWorkflowJobLogFromRunAttempt(options)
        if (fallbackLog) return fallbackLog

        return {
          jobId: options.jobId,
          content: '',
          fetchedAt: new Date().toISOString(),
          isAvailable: false,
        }
      }

      throw error
    }
  }

  private async getWorkflowJobLogFromRunAttempt(
    options: GetWorkflowJobLogOptions,
  ): Promise<GitHubActionJobLog | null> {
    try {
      const jobResponse = await this.octokit.request('GET /repos/{owner}/{repo}/actions/jobs/{job_id}', {
        owner: options.owner,
        repo: options.repo,
        job_id: options.jobId,
      })
      const job = jobResponse.data as WorkflowJobResponse
      const runId = job.run_id
      const runAttempt = job.run_attempt ?? 1
      const jobName = job.name?.trim()

      if (!runId || !jobName) return null

      return await this.getWorkflowJobLogFromArchive(options, {
        runId,
        runAttempt,
        name: jobName,
        status: null,
      })
    } catch {
      return null
    }
  }

  private async getWorkflowJobLogFromArchive(
    options: GetWorkflowJobLogOptions,
    job: WorkflowJobLogHint,
  ): Promise<GitHubActionJobLog | null> {
    try {
      const archiveResponse = await this.octokit.request(
        'GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/logs',
        {
          owner: options.owner,
          repo: options.repo,
          run_id: job.runId,
          attempt_number: job.runAttempt,
        },
      )
      const files = extractZipTextFiles(archiveResponse.data)
      const archive = findJobLogArchiveContent(files, job.name)

      if (!archive) return null

      return {
        jobId: options.jobId,
        content: archive.content,
        fetchedAt: new Date().toISOString(),
        isAvailable: true,
        ...(archive.steps ? { steps: archive.steps } : {}),
      }
    } catch {
      return null
    }
  }

  async rerunWorkflowRun(options: RerunWorkflowRunOptions): Promise<void> {
    await this.octokit.request('POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun', {
      owner: options.owner,
      repo: options.repo,
      run_id: options.runId,
      ...debugLoggingParams(options),
    })
  }

  async rerunFailedWorkflowRunJobs(options: RerunWorkflowRunOptions): Promise<void> {
    await this.octokit.request('POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun-failed-jobs', {
      owner: options.owner,
      repo: options.repo,
      run_id: options.runId,
      ...debugLoggingParams(options),
    })
  }

  async rerunWorkflowJob(options: RerunWorkflowJobOptions): Promise<void> {
    await this.octokit.request('POST /repos/{owner}/{repo}/actions/jobs/{job_id}/rerun', {
      owner: options.owner,
      repo: options.repo,
      job_id: options.jobId,
      ...debugLoggingParams(options),
      ...(options.enableDebugger ? { enable_debugger: true } : {}),
    })
  }
}

function debugLoggingParams(options: { enableDebugLogging?: boolean }) {
  return options.enableDebugLogging ? { enable_debug_logging: true } : {}
}

function mapWorkflow(context: RepositoryOptions, workflow: WorkflowResponse): GitHubActionWorkflow {
  const id = workflow.id ?? 0

  return {
    id,
    nodeId: workflow.node_id ?? null,
    name: workflow.name?.trim() || workflow.path?.split('/').pop() || `Workflow ${id}`,
    path: workflow.path ?? '',
    state: normalizeWorkflowState(workflow.state),
    createdAt: workflow.created_at ?? null,
    updatedAt: workflow.updated_at ?? null,
    url: workflow.url ?? `https://api.github.com/repos/${context.owner}/${context.repo}/actions/workflows/${id}`,
    htmlUrl: workflow.html_url ?? `https://github.com/${context.owner}/${context.repo}/actions/workflows/${id}`,
    badgeUrl: workflow.badge_url ?? null,
  }
}

function mapRun(context: RepositoryOptions, run: WorkflowRunResponse): GitHubActionRun {
  const id = run.id ?? 0
  const workflowId = run.workflow_id ?? 0
  const name = run.name ?? null
  const displayTitle = run.display_title?.trim() || name || `Run ${id}`

  return {
    id,
    runNumber: run.run_number ?? 0,
    runAttempt: run.run_attempt ?? 1,
    name,
    displayTitle,
    workflowId,
    workflowName: name,
    event: run.event ?? '',
    status: normalizeActionStatus(run.status),
    conclusion: normalizeConclusion(run.conclusion),
    headBranch: run.head_branch ?? null,
    headSha: run.head_sha ?? '',
    actor: normalizeActor(run.actor),
    triggeringActor: run.triggering_actor ? normalizeActor(run.triggering_actor) : null,
    checkSuiteId: run.check_suite_id ?? null,
    createdAt: run.created_at ?? null,
    updatedAt: run.updated_at ?? null,
    runStartedAt: run.run_started_at ?? null,
    completedAt: run.status === 'completed' ? run.updated_at ?? null : null,
    url: run.url ?? `https://api.github.com/repos/${context.owner}/${context.repo}/actions/runs/${id}`,
    htmlUrl: run.html_url ?? `https://github.com/${context.owner}/${context.repo}/actions/runs/${id}`,
    jobsUrl: run.jobs_url ?? null,
    logsUrl: run.logs_url ?? null,
  }
}

function mapJob(job: WorkflowJobResponse, fallbackRunId: number): GitHubActionJob {
  const id = job.id ?? 0

  return {
    id,
    runId: job.run_id ?? fallbackRunId,
    runAttempt: job.run_attempt ?? 1,
    name: job.name?.trim() || `Job ${id}`,
    status: normalizeActionStatus(job.status),
    conclusion: normalizeConclusion(job.conclusion),
    startedAt: job.started_at ?? null,
    completedAt: job.completed_at ?? null,
    htmlUrl: job.html_url ?? null,
    runnerName: job.runner_name ?? null,
    labels: job.labels ?? [],
    steps: (job.steps ?? []).map(mapStep),
  }
}

function mapStep(step: WorkflowStepResponse): GitHubActionStep {
  return {
    number: step.number ?? 0,
    name: step.name?.trim() || `Step ${step.number ?? ''}`.trim(),
    status: normalizeActionStatus(step.status),
    conclusion: normalizeConclusion(step.conclusion),
    startedAt: step.started_at ?? null,
    completedAt: step.completed_at ?? null,
  }
}

function normalizeActor(actor: ActorResponse | null | undefined): GitHubActor {
  return {
    login: actor?.login ?? 'github-actions',
    avatarUrl: actor?.avatar_url ?? undefined,
  }
}

function normalizeWorkflowState(value: string | null | undefined): GitHubActionWorkflowState {
  return value?.trim() as GitHubActionWorkflowState || 'active'
}

function normalizeActionStatus(value: string | null | undefined): GitHubActionRunStatus | null {
  const normalized = value?.trim()

  return normalized ? normalized as GitHubActionRunStatus : null
}

function normalizeConclusion(value: string | null | undefined): GitHubActionConclusion | null {
  const normalized = value?.trim()

  return normalized ? normalized as GitHubActionConclusion : null
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  const normalized = value?.trim()

  return normalized || null
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback

  return Math.max(1, Math.round(value))
}

function normalizePerPage(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_RUNS_PER_PAGE

  return Math.min(MAX_PER_PAGE, Math.max(1, Math.round(value)))
}

function isLastPage(itemCount: number, currentPageCount: number, totalCount: number | undefined): boolean {
  if (typeof totalCount === 'number' && itemCount >= totalCount) return true

  return currentPageCount < MAX_PER_PAGE
}

function normalizeLogContent(data: unknown): string {
  if (typeof data === 'string') return data
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data)
  if (ArrayBuffer.isView(data)) return new TextDecoder().decode(data)
  if (data === null || data === undefined) return ''

  return String(data)
}

function extractZipTextFiles(data: unknown): ZipTextFile[] {
  const bytes = normalizeBinaryContent(data)
  if (!bytes.length) return []

  return extractZipFilesFromCentralDirectory(bytes)
    ?? extractZipFilesFromLocalHeaders(bytes)
}

function extractZipFilesFromCentralDirectory(bytes: Uint8Array): ZipTextFile[] | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const eocdOffset = findZipEndOfCentralDirectory(view)
  if (eocdOffset < 0) return null

  const entryCount = view.getUint16(eocdOffset + 10, true)
  let offset = view.getUint32(eocdOffset + 16, true)
  const files: ZipTextFile[] = []

  for (let index = 0; index < entryCount && offset + 46 <= bytes.byteLength; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) break

    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const uncompressedSize = view.getUint32(offset + 24, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localHeaderOffset = view.getUint32(offset + 42, true)
    const nameStart = offset + 46
    const name = decodeUtf8(bytes.subarray(nameStart, nameStart + nameLength))

    const file = readZipLocalFile(bytes, localHeaderOffset, name, method, compressedSize, uncompressedSize)
    if (file) files.push(file)

    offset = nameStart + nameLength + extraLength + commentLength
  }

  return files
}

function extractZipFilesFromLocalHeaders(bytes: Uint8Array): ZipTextFile[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const files: ZipTextFile[] = []
  let offset = 0

  while (offset + 30 <= bytes.byteLength && view.getUint32(offset, true) === 0x04034b50) {
    const flags = view.getUint16(offset + 6, true)
    const method = view.getUint16(offset + 8, true)
    const compressedSize = view.getUint32(offset + 18, true)
    const uncompressedSize = view.getUint32(offset + 22, true)
    const nameLength = view.getUint16(offset + 26, true)
    const extraLength = view.getUint16(offset + 28, true)
    const nameStart = offset + 30
    const dataStart = nameStart + nameLength + extraLength
    const name = decodeUtf8(bytes.subarray(nameStart, nameStart + nameLength))

    if (flags & 0x08) break

    const file = readZipFileContent(bytes, dataStart, name, method, compressedSize, uncompressedSize)
    if (file) files.push(file)

    offset = dataStart + compressedSize
  }

  return files
}

function findZipEndOfCentralDirectory(view: DataView): number {
  const minOffset = Math.max(0, view.byteLength - 65557)

  for (let offset = view.byteLength - 22; offset >= minOffset; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset
  }

  return -1
}

function readZipLocalFile(
  bytes: Uint8Array,
  offset: number,
  name: string,
  method: number,
  compressedSize: number,
  uncompressedSize: number,
): ZipTextFile | null {
  if (offset + 30 > bytes.byteLength) return null

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (view.getUint32(offset, true) !== 0x04034b50) return null

  const localNameLength = view.getUint16(offset + 26, true)
  const localExtraLength = view.getUint16(offset + 28, true)
  const dataStart = offset + 30 + localNameLength + localExtraLength

  return readZipFileContent(bytes, dataStart, name, method, compressedSize, uncompressedSize)
}

function readZipFileContent(
  bytes: Uint8Array,
  dataStart: number,
  name: string,
  method: number,
  compressedSize: number,
  uncompressedSize: number,
): ZipTextFile | null {
  if (name.endsWith('/') || dataStart + compressedSize > bytes.byteLength) return null

  const compressed = bytes.subarray(dataStart, dataStart + compressedSize)
  const contentBytes = method === 0
    ? compressed
    : method === 8
      ? inflateRawSync(compressed)
      : null

  if (!contentBytes || contentBytes.byteLength !== uncompressedSize) return null

  return {
    name,
    content: decodeUtf8(contentBytes),
  }
}

interface JobLogArchive {
  content: string
  steps?: GitHubActionJobLogStep[]
}

function findJobLogArchiveContent(files: ZipTextFile[], jobName: string): JobLogArchive | null {
  const normalizedJobName = normalizeLogArchiveName(jobName)
  const stepFiles = files
    .filter((file) => {
      const separatorIndex = file.name.indexOf('/')
      if (separatorIndex < 0) return false

      const fileName = file.name.slice(separatorIndex + 1)

      return normalizeLogArchiveName(file.name.slice(0, separatorIndex)) === normalizedJobName
        && /^\d+_.+\.txt$/.test(fileName)
    })
    .sort((left, right) => archiveStepOrder(left.name) - archiveStepOrder(right.name))

  if (stepFiles.length) {
    const steps = stepFiles.map((file) => {
      const fileName = file.name.split('/').pop() ?? file.name
      const numberMatch = /^(\d+)_/.exec(fileName)

      return {
        number: numberMatch ? Number(numberMatch[1]) : null,
        title: stripLogArchiveJobPrefix(stripTextExtension(fileName)),
        content: file.content.trimEnd(),
      }
    })

    return {
      content: steps.map((step) => step.content).filter(Boolean).join('\n'),
      steps,
    }
  }

  const fullJobLog = files.find((file) =>
    !file.name.includes('/')
    && file.name.endsWith('.txt')
    && normalizeLogArchiveName(stripLogArchiveJobPrefix(stripTextExtension(file.name))) === normalizedJobName
  )

  return fullJobLog ? { content: fullJobLog.content } : null
}

function archiveStepOrder(path: string): number {
  const fileName = path.split('/').pop() ?? path
  const match = /^(\d+)_/.exec(fileName)

  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
}

function stripLogArchiveJobPrefix(value: string): string {
  return value.replace(/^\d+_/, '')
}

function stripTextExtension(value: string): string {
  return value.endsWith('.txt') ? value.slice(0, -4) : value
}

function normalizeLogArchiveName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function normalizeBinaryContent(data: unknown): Uint8Array {
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  }
  if (typeof data === 'string') return new TextEncoder().encode(data)

  return new Uint8Array()
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

function isTransientJobLogUnavailableError(error: unknown): boolean {
  if (!isHttpErrorLike(error) || error.status !== 404) return false

  const responseUrl = error.response?.url ?? ''
  const blobErrorCode = headerValue(error.response?.headers, 'x-ms-error-code')

  return blobErrorCode === 'BlobNotFound'
    || responseUrl.includes('.blob.core.windows.net/')
}

function isHttpErrorLike(error: unknown): error is {
  status: number
  response?: {
    url?: string
    headers?: Record<string, string | string[] | undefined>
  }
} {
  return typeof error === 'object'
    && error !== null
    && typeof (error as { status?: unknown }).status === 'number'
}

function headerValue(
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined

  const match = Object.entries(headers)
    .find(([key]) => key.toLowerCase() === name.toLowerCase())
    ?.[1]

  return Array.isArray(match) ? match[0] : match
}
