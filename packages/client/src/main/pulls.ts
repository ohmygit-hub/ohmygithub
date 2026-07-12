import {
  createGitHubApi,
  type CreatePullRequestCommentOptions,
  type GetPullRequestDetailOptions,
  type GitHubPullRequestCategory,
  type GitHubPullRequestMergeMethod,
  type GitHubPullRequestReviewEvent,
  type GitHubPullRequestSearchState,
  type SearchRepositoryPullRequestsOptions,
  type UpdatePullRequestOptions,
} from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken } from './auth'
import { resolveGitHubTransport } from './proxy'

export function registerPullsIpc(): void {
  ipcMain.handle('pulls:list-category', (_event, category: GitHubPullRequestCategory) =>
    listPullRequestCategory(category)
  )
  ipcMain.handle('pulls:list-viewer', () => listViewerPullRequests())
  ipcMain.handle('pulls:list-repository', (_event, owner: string, repo: string) =>
    listRepositoryPullRequests(owner, repo)
  )
  ipcMain.handle('pulls:search-repository', (_event, options: SearchRepositoryPullRequestsOptions) =>
    searchRepositoryPullRequests(options)
  )
  ipcMain.handle('pulls:get-detail', (_event, owner: string, repo: string, number: number) =>
    getPullRequestDetail(owner, repo, number)
  )
  ipcMain.handle('pulls:create-comment', (_event, owner: string, repo: string, number: number, body: string) =>
    createPullRequestComment(owner, repo, number, body)
  )
  ipcMain.handle('pulls:update', (_event, owner: string, repo: string, number: number, changes: unknown) =>
    updatePullRequest(owner, repo, number, changes)
  )
  ipcMain.handle('pulls:close', (_event, owner: string, repo: string, number: number) =>
    closePullRequest(owner, repo, number)
  )
  ipcMain.handle('pulls:request-reviewers', (_event, owner: string, repo: string, number: number, reviewers: string[], removeReviewers: string[]) =>
    requestPullRequestReviewers(owner, repo, number, reviewers, removeReviewers)
  )
  ipcMain.handle('pulls:mark-ready-for-review', (_event, owner: string, repo: string, number: number, id: string) =>
    markPullRequestReadyForReview(owner, repo, number, id)
  )
  ipcMain.handle('pulls:merge', (_event, owner: string, repo: string, number: number, options: unknown) =>
    mergePullRequest(owner, repo, number, options)
  )
  ipcMain.handle('pulls:update-comment', (_event, owner: string, repo: string, commentId: string | number, body: string) =>
    updatePullRequestComment(owner, repo, commentId, body)
  )
  ipcMain.handle('pulls:list-files', (_event, owner: string, repo: string, number: number) =>
    listPullRequestFiles(owner, repo, number)
  )
  ipcMain.handle('pulls:list-commits', (_event, owner: string, repo: string, number: number, page?: number, perPage?: number) =>
    listPullRequestCommits(owner, repo, number, page, perPage)
  )
  ipcMain.handle('pulls:submit-review', (_event, owner: string, repo: string, number: number, options: unknown) =>
    submitPullRequestReview(owner, repo, number, options)
  )
}

async function listPullRequestCategory(category: GitHubPullRequestCategory) {
  if (!isPullRequestCategory(category)) {
    throw new Error('Unknown pull request category')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.pulls.listPullRequestCategory({ category })
}

async function listViewerPullRequests() {
  const api = await createAuthenticatedGitHubApi()

  return api.pulls.listViewerPullRequests()
}

function isPullRequestCategory(value: string): value is GitHubPullRequestCategory {
  return value === 'created-by-me'
    || value === 'needs-review'
    || value === 'inbox'
    || value === 'mentioned-me'
}

async function listRepositoryPullRequests(owner: string, repo: string) {
  const normalizedOwner = owner.trim()
  const normalizedRepo = repo.trim()

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.pulls.listRepositoryPullRequests({
    owner: normalizedOwner,
    repo: normalizedRepo
  })
}

async function searchRepositoryPullRequests(options: SearchRepositoryPullRequestsOptions) {
  const normalizedOptions = normalizeSearchRepositoryPullRequestsOptions(options)
  const api = await createAuthenticatedGitHubApi()

  return api.pulls.searchRepositoryPullRequests(normalizedOptions)
}

async function getPullRequestDetail(owner: string, repo: string, number: number) {
  const normalizedOptions = normalizePullRequestDetailOptions({ owner, repo, number })
  const api = await createAuthenticatedGitHubApi()

  return api.pulls.getPullRequestDetail(normalizedOptions)
}

async function createPullRequestComment(owner: string, repo: string, number: number, body: string) {
  const normalizedOptions = normalizePullRequestCommentOptions({ owner, repo, number, body })
  const api = await createAuthenticatedGitHubApi()

  return api.pulls.createPullRequestComment(normalizedOptions)
}

async function updatePullRequest(owner: string, repo: string, number: number, changes: unknown) {
  const normalizedOptions = normalizePullRequestDetailOptions({ owner, repo, number })
  const update = (changes ?? {}) as {
    title?: string
    body?: string
    state?: 'open' | 'closed'
    assignees?: string[]
    labels?: string[]
    milestone?: number | null
  }
  const api = await createAuthenticatedGitHubApi()
  const title = update.title?.trim()

  return api.pulls.updatePullRequest({
    ...normalizedOptions,
    ...(update.title !== undefined ? { title: requireNonEmpty(title, 'Pull request title is required') } : {}),
    ...(update.body !== undefined ? { body: String(update.body) } : {}),
    ...(update.state !== undefined ? { state: normalizePullRequestUpdateState(update.state) } : {}),
    ...(update.assignees !== undefined ? { assignees: update.assignees } : {}),
    ...(update.labels !== undefined ? { labels: update.labels } : {}),
    ...(update.milestone !== undefined ? { milestone: update.milestone } : {}),
  })
}

async function closePullRequest(owner: string, repo: string, number: number) {
  const normalizedOptions = normalizePullRequestDetailOptions({ owner, repo, number })
  const api = await createAuthenticatedGitHubApi()

  return api.pulls.closePullRequest(normalizedOptions)
}

async function requestPullRequestReviewers(owner: string, repo: string, number: number, reviewers: string[], removeReviewers: string[]) {
  const normalizedOptions = normalizePullRequestDetailOptions({ owner, repo, number })
  const api = await createAuthenticatedGitHubApi()

  return api.pulls.requestPullRequestReviewers({
    ...normalizedOptions,
    reviewers: Array.isArray(reviewers) ? reviewers : [],
    removeReviewers: Array.isArray(removeReviewers) ? removeReviewers : []
  })
}

async function markPullRequestReadyForReview(owner: string, repo: string, number: number, id: string) {
  const normalizedOptions = normalizePullRequestDetailOptions({ owner, repo, number })
  const api = await createAuthenticatedGitHubApi()

  return api.pulls.markPullRequestReadyForReview({
    ...normalizedOptions,
    id: requireNonEmpty(id.trim(), 'Pull request id is required')
  })
}

async function mergePullRequest(owner: string, repo: string, number: number, options: unknown) {
  const normalizedOptions = normalizePullRequestDetailOptions({ owner, repo, number })
  const payload = (options ?? {}) as {
    method?: GitHubPullRequestMergeMethod
    expectedHeadSha?: string | null
    commitTitle?: string
    commitMessage?: string
  }
  const api = await createAuthenticatedGitHubApi()

  return api.pulls.mergePullRequest({
    ...normalizedOptions,
    method: normalizeMergeMethod(payload.method),
    expectedHeadSha: typeof payload.expectedHeadSha === 'string' ? payload.expectedHeadSha : null,
    ...(payload.commitTitle ? { commitTitle: payload.commitTitle.trim() } : {}),
    ...(payload.commitMessage ? { commitMessage: payload.commitMessage.trim() } : {}),
  })
}

async function listPullRequestFiles(owner: string, repo: string, number: number) {
  const normalizedOptions = normalizePullRequestDetailOptions({ owner, repo, number })
  const api = await createAuthenticatedGitHubApi()

  return api.pulls.listPullRequestFiles(normalizedOptions)
}

async function listPullRequestCommits(owner: string, repo: string, number: number, page?: number, perPage?: number) {
  const normalizedOptions = normalizePullRequestDetailOptions({ owner, repo, number })
  const api = await createAuthenticatedGitHubApi()

  return api.pulls.listPullRequestCommits({
    ...normalizedOptions,
    page: normalizePositiveInteger(page, 1),
    perPage: normalizePositiveInteger(perPage, 30),
  })
}

async function submitPullRequestReview(owner: string, repo: string, number: number, options: unknown) {
  const normalizedOptions = normalizePullRequestDetailOptions({ owner, repo, number })
  const payload = (options ?? {}) as {
    event?: GitHubPullRequestReviewEvent
    body?: string
  }
  const event = normalizeReviewEvent(payload.event)
  const body = typeof payload.body === 'string' ? payload.body.trim() : ''

  if (!body && event !== 'APPROVE') {
    throw new Error('Review body is required for comment and request changes reviews')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.pulls.submitPullRequestReview({
    ...normalizedOptions,
    event,
    ...(body ? { body } : {}),
  })
}

function normalizeReviewEvent(value: GitHubPullRequestReviewEvent | undefined): GitHubPullRequestReviewEvent {
  if (value === 'APPROVE' || value === 'COMMENT' || value === 'REQUEST_CHANGES') return value

  throw new Error('Unknown pull request review event')
}

async function updatePullRequestComment(owner: string, repo: string, commentId: string | number, body: string) {
  const normalizedOwner = owner.trim()
  const normalizedRepo = repo.trim()
  const normalizedBody = body.trim()

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  if (!normalizedBody) {
    throw new Error('Comment body is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.pulls.updatePullRequestComment({
    owner: normalizedOwner,
    repo: normalizedRepo,
    commentId,
    body: normalizedBody
  })
}

function normalizeSearchRepositoryPullRequestsOptions(
  options: SearchRepositoryPullRequestsOptions
): SearchRepositoryPullRequestsOptions {
  const normalizedOwner = options.owner.trim()
  const normalizedRepo = options.repo.trim()

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  return {
    owner: normalizedOwner,
    repo: normalizedRepo,
    state: normalizePullRequestSearchState(options.state),
    search: typeof options.search === 'string' ? options.search.trim() : '',
    page: normalizePositiveInteger(options.page, 1),
    perPage: normalizePositiveInteger(options.perPage, 20),
  }
}

function normalizePullRequestSearchState(
  state: GitHubPullRequestSearchState | undefined
): GitHubPullRequestSearchState {
  if (state === 'closed' || state === 'all') return state

  return 'open'
}

function normalizePullRequestDetailOptions(options: GetPullRequestDetailOptions): GetPullRequestDetailOptions {
  const normalizedOwner = options.owner.trim()
  const normalizedRepo = options.repo.trim()

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  return {
    owner: normalizedOwner,
    repo: normalizedRepo,
    number: normalizePullRequestNumber(options.number)
  }
}

function normalizePullRequestCommentOptions(
  options: CreatePullRequestCommentOptions
): CreatePullRequestCommentOptions {
  const body = options.body.trim()

  if (!body) {
    throw new Error('Comment body is required')
  }

  return {
    ...normalizePullRequestDetailOptions(options),
    body
  }
}

function normalizePullRequestUpdateState(value: UpdatePullRequestOptions['state']): 'open' | 'closed' {
  if (value === 'closed') return 'closed'

  return 'open'
}

function normalizeMergeMethod(value: GitHubPullRequestMergeMethod | undefined): GitHubPullRequestMergeMethod {
  if (value === 'merge' || value === 'rebase') return value

  return 'squash'
}

function normalizePullRequestNumber(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('Pull request number must be a positive integer')
  }

  return value
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback

  return Math.max(1, Math.round(value))
}

function requireNonEmpty(value: string | undefined, message: string): string {
  if (!value) throw new Error(message)

  return value
}

async function createAuthenticatedGitHubApi() {
  return createGitHubApi({
    token: getAuthenticatedAccessToken(),
    ...(await resolveGitHubTransport())
  })
}
