import {
  createGitHubApi,
  type GitHubIssueCategory,
  type GitHubIssueSearchState,
  type GitHubIssueUpdateState,
  type SearchRepositoryIssuesOptions,
  type UpdateIssueOptions,
} from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken } from './auth'
import { resolveGitHubProxyUrl } from './proxy'

export function registerIssuesIpc(): void {
  ipcMain.handle('issues:list-category', (_event, category: GitHubIssueCategory) =>
    listIssueCategory(category)
  )
  ipcMain.handle('issues:list-viewer', () => listViewerIssues())
  ipcMain.handle('issues:list-repository', (_event, owner: string, repo: string) =>
    listRepositoryIssues(owner, repo)
  )
  ipcMain.handle('issues:search-repository', (_event, options: SearchRepositoryIssuesOptions) =>
    searchRepositoryIssues(options)
  )
  ipcMain.handle('issues:get-detail', (_event, owner: string, repo: string, number: number) =>
    getIssueDetail(owner, repo, number)
  )
  ipcMain.handle('issues:update', (_event, options: UpdateIssueOptions) =>
    updateIssue(options)
  )
  ipcMain.handle('issues:list-repository-labels', (_event, owner: string, repo: string) =>
    listRepositoryIssueLabels(owner, repo)
  )
  ipcMain.handle('issues:list-repository-assignable-users', (_event, owner: string, repo: string) =>
    listRepositoryAssignableUsers(owner, repo)
  )
  ipcMain.handle('issues:list-repository-milestones', (_event, owner: string, repo: string) =>
    listRepositoryIssueMilestones(owner, repo)
  )
  ipcMain.handle('issues:create-comment', (_event, owner: string, repo: string, number: number, body: string) =>
    createIssueComment(owner, repo, number, body)
  )
  ipcMain.handle('issues:edit-comment', (_event, owner: string, repo: string, commentId: number, body: string) =>
    editIssueComment(owner, repo, commentId, body)
  )
  ipcMain.handle('issues:delete-comment', (_event, owner: string, repo: string, commentId: number) =>
    deleteIssueComment(owner, repo, commentId)
  )
}

async function listIssueCategory(category: GitHubIssueCategory) {
  if (!isIssueCategory(category)) {
    throw new Error('Unknown issue category')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.issues.listIssueCategory({ category })
}

async function listViewerIssues() {
  const api = await createAuthenticatedGitHubApi()

  return api.issues.listViewerIssues()
}

function isIssueCategory(value: string): value is GitHubIssueCategory {
  return value === 'created-by-me'
    || value === 'inbox'
    || value === 'mentioned-me'
}

async function listRepositoryIssues(owner: string, repo: string) {
  const normalizedOwner = owner.trim()
  const normalizedRepo = repo.trim()

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.issues.listRepositoryIssues({
    owner: normalizedOwner,
    repo: normalizedRepo
  })
}

async function searchRepositoryIssues(options: SearchRepositoryIssuesOptions) {
  const normalizedOptions = normalizeSearchRepositoryIssuesOptions(options)
  const api = await createAuthenticatedGitHubApi()

  return api.issues.searchRepositoryIssues(normalizedOptions)
}

function normalizeSearchRepositoryIssuesOptions(
  options: SearchRepositoryIssuesOptions
): SearchRepositoryIssuesOptions {
  const normalizedOwner = options.owner.trim()
  const normalizedRepo = options.repo.trim()

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  return {
    owner: normalizedOwner,
    repo: normalizedRepo,
    state: normalizeIssueSearchState(options.state),
    search: typeof options.search === 'string' ? options.search.trim() : '',
    page: normalizePositiveInteger(options.page, 1),
    perPage: normalizePositiveInteger(options.perPage, 20),
  }
}

async function getIssueDetail(owner: string, repo: string, number: number) {
  const normalizedOwner = owner.trim()
  const normalizedRepo = repo.trim()
  const normalizedNumber = Number(number)

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  if (!Number.isInteger(normalizedNumber) || normalizedNumber <= 0) {
    throw new Error('Issue number must be a positive integer')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.issues.getIssueDetail({
    owner: normalizedOwner,
    repo: normalizedRepo,
    number: normalizedNumber
  })
}

async function updateIssue(options: UpdateIssueOptions) {
  const normalizedOptions = normalizeUpdateIssueOptions(options)
  const api = await createAuthenticatedGitHubApi()

  return api.issues.updateIssue(normalizedOptions)
}

async function listRepositoryIssueLabels(owner: string, repo: string) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.issues.listRepositoryIssueLabels(repository)
}

async function listRepositoryAssignableUsers(owner: string, repo: string) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.issues.listRepositoryAssignableUsers(repository)
}

async function listRepositoryIssueMilestones(owner: string, repo: string) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.issues.listRepositoryIssueMilestones(repository)
}

async function createIssueComment(owner: string, repo: string, number: number, body: string) {
  const normalizedOwner = owner.trim()
  const normalizedRepo = repo.trim()
  const normalizedNumber = Number(number)
  const normalizedBody = body.trim()

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  if (!Number.isInteger(normalizedNumber) || normalizedNumber <= 0) {
    throw new Error('Issue number must be a positive integer')
  }

  if (!normalizedBody) {
    throw new Error('Comment body is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.issues.createIssueComment({
    owner: normalizedOwner,
    repo: normalizedRepo,
    number: normalizedNumber,
    body: normalizedBody
  })
}

async function editIssueComment(owner: string, repo: string, commentId: number, body: string) {
  const repository = normalizeRepository(owner, repo)
  const normalizedCommentId = normalizeRequiredPositiveInteger(commentId, 'Comment id must be a positive integer')
  const normalizedBody = body.trim()

  if (!normalizedBody) {
    throw new Error('Comment body is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.issues.editIssueComment({
    ...repository,
    commentId: normalizedCommentId,
    body: normalizedBody
  })
}

async function deleteIssueComment(owner: string, repo: string, commentId: number) {
  const repository = normalizeRepository(owner, repo)
  const normalizedCommentId = normalizeRequiredPositiveInteger(commentId, 'Comment id must be a positive integer')
  const api = await createAuthenticatedGitHubApi()

  return api.issues.deleteIssueComment({
    ...repository,
    commentId: normalizedCommentId
  })
}

function normalizeIssueSearchState(state: GitHubIssueSearchState | undefined): GitHubIssueSearchState {
  if (state === 'closed' || state === 'all') return state

  return 'open'
}

function normalizeIssueUpdateState(state: unknown): GitHubIssueUpdateState {
  if (state === 'open' || state === 'closed') return state

  throw new Error('Issue state must be open or closed')
}

function normalizeUpdateIssueOptions(options: UpdateIssueOptions): UpdateIssueOptions {
  if (!isRecord(options)) {
    throw new Error('Issue update options are required')
  }

  const repository = normalizeRepositoryValue(options.owner, options.repo)
  const number = normalizeRequiredPositiveInteger(options.number, 'Issue number must be a positive integer')
  const normalized: UpdateIssueOptions = {
    ...repository,
    number
  }
  let hasUpdate = false

  if (hasOwn(options, 'title') && options.title !== undefined) {
    if (typeof options.title !== 'string') {
      throw new Error('Issue title must be a string')
    }

    const title = options.title.trim()
    if (!title) {
      throw new Error('Issue title is required')
    }

    normalized.title = title
    hasUpdate = true
  }

  if (hasOwn(options, 'body') && options.body !== undefined) {
    if (typeof options.body !== 'string') {
      throw new Error('Issue body must be a string')
    }

    normalized.body = options.body
    hasUpdate = true
  }

  if (hasOwn(options, 'state') && options.state !== undefined) {
    normalized.state = normalizeIssueUpdateState(options.state)
    hasUpdate = true
  }

  if (hasOwn(options, 'labels') && options.labels !== undefined) {
    normalized.labels = normalizeStringList(options.labels, 'Issue labels must be strings')
    hasUpdate = true
  }

  if (hasOwn(options, 'assignees') && options.assignees !== undefined) {
    normalized.assignees = normalizeStringList(options.assignees, 'Issue assignees must be strings')
    hasUpdate = true
  }

  if (hasOwn(options, 'milestone') && options.milestone !== undefined) {
    normalized.milestone = options.milestone === null
      ? null
      : normalizeRequiredPositiveInteger(options.milestone, 'Issue milestone must be a positive integer or null')
    hasUpdate = true
  }

  if (!hasUpdate) {
    throw new Error('At least one issue update field is required')
  }

  return normalized
}

function normalizeRepository(owner: string, repo: string) {
  return normalizeRepositoryValue(owner, repo)
}

function normalizeRepositoryValue(owner: unknown, repo: unknown): { owner: string, repo: string } {
  const normalizedOwner = typeof owner === 'string' ? owner.trim() : ''
  const normalizedRepo = typeof repo === 'string' ? repo.trim() : ''

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  return {
    owner: normalizedOwner,
    repo: normalizedRepo
  }
}

function normalizeStringList(value: unknown, message: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(message)
  }

  return value.map((item) => {
    if (typeof item !== 'string') {
      throw new Error(message)
    }

    return item.trim()
  }).filter(Boolean)
}

function normalizeRequiredPositiveInteger(value: unknown, message: string): number {
  const normalized = Number(value)

  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new Error(message)
  }

  return normalized
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasOwn<T extends object>(value: T, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback

  return Math.max(1, Math.round(value))
}

async function createAuthenticatedGitHubApi() {
  return createGitHubApi({
    token: getAuthenticatedAccessToken(),
    proxyUrl: await resolveGitHubProxyUrl()
  })
}
