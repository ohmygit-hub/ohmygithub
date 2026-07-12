import {
  createGitHubApi,
  type GitHubIssueCategory,
  type GitHubIssueSearchState,
  type GitHubReactionContent,
  type SearchRepositoryIssuesOptions,
} from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken } from './auth'
import { resolveGitHubTransport } from './proxy'

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
  ipcMain.handle('issues:create-comment', (_event, owner: string, repo: string, number: number, body: string) =>
    createIssueComment(owner, repo, number, body)
  )
  ipcMain.handle('issues:list-repository-labels', (_event, owner: string, repo: string) =>
    listRepositoryLabels(owner, repo)
  )
  ipcMain.handle('issues:list-repository-milestones', (_event, owner: string, repo: string) =>
    listRepositoryMilestones(owner, repo)
  )
  ipcMain.handle('issues:list-assignable-users', (_event, owner: string, repo: string) =>
    listAssignableUsers(owner, repo)
  )
  ipcMain.handle('issues:update', (_event, owner: string, repo: string, number: number, changes: unknown) =>
    updateIssue(owner, repo, number, changes)
  )
  ipcMain.handle('issues:update-comment', (_event, owner: string, repo: string, commentId: string | number, body: string) =>
    updateIssueComment(owner, repo, commentId, body)
  )
  ipcMain.handle('issues:set-subscription', (_event, subscribableId: string, subscribed: boolean) =>
    setIssueSubscription(subscribableId, subscribed)
  )
  ipcMain.handle('issues:set-lock', (_event, owner: string, repo: string, number: number, locked: boolean) =>
    setIssueLock(owner, repo, number, locked)
  )
  ipcMain.handle('issues:set-pinned', (_event, issueId: string, pinned: boolean) =>
    setIssuePinned(issueId, pinned)
  )
  ipcMain.handle('issues:delete', (_event, issueId: string) =>
    deleteIssue(issueId)
  )
  ipcMain.handle('issues:set-reaction', (_event, subjectId: string, content: GitHubReactionContent, reacted: boolean) =>
    setReaction(subjectId, content, reacted)
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

async function listRepositoryLabels(owner: string, repo: string) {
  const normalizedOwner = owner.trim()
  const normalizedRepo = repo.trim()

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.issues.listRepositoryLabels({ owner: normalizedOwner, repo: normalizedRepo })
}

async function listRepositoryMilestones(owner: string, repo: string) {
  const normalizedOwner = owner.trim()
  const normalizedRepo = repo.trim()

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.issues.listRepositoryMilestones({ owner: normalizedOwner, repo: normalizedRepo })
}

async function listAssignableUsers(owner: string, repo: string) {
  const normalizedOwner = owner.trim()
  const normalizedRepo = repo.trim()

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.issues.listAssignableUsers({ owner: normalizedOwner, repo: normalizedRepo })
}

async function updateIssue(owner: string, repo: string, number: number, changes: unknown) {
  const normalizedOwner = owner.trim()
  const normalizedRepo = repo.trim()
  const normalizedNumber = Number(number)

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  if (!Number.isInteger(normalizedNumber) || normalizedNumber <= 0) {
    throw new Error('Issue number must be a positive integer')
  }

  const update = (changes ?? {}) as {
    title?: string
    body?: string
    state?: 'open' | 'closed'
    stateReason?: 'completed' | 'not_planned'
    assignees?: string[]
    labels?: string[]
    milestone?: number | null
  }
  const api = await createAuthenticatedGitHubApi()
  const title = update.title?.trim()

  return api.issues.updateIssue({
    owner: normalizedOwner,
    repo: normalizedRepo,
    number: normalizedNumber,
    ...(update.title !== undefined ? { title: requireNonEmpty(title, 'Issue title is required') } : {}),
    ...(update.body !== undefined ? { body: String(update.body) } : {}),
    ...(update.state !== undefined ? { state: normalizeIssueUpdateState(update.state) } : {}),
    ...(update.stateReason !== undefined ? { stateReason: normalizeIssueStateReason(update.stateReason) } : {}),
    ...(update.assignees !== undefined ? { assignees: update.assignees } : {}),
    ...(update.labels !== undefined ? { labels: update.labels } : {}),
    ...(update.milestone !== undefined ? { milestone: update.milestone } : {})
  })
}

async function updateIssueComment(owner: string, repo: string, commentId: string | number, body: string) {
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

  return api.issues.updateIssueComment({
    owner: normalizedOwner,
    repo: normalizedRepo,
    commentId,
    body: normalizedBody
  })
}

async function setIssueSubscription(subscribableId: string, subscribed: boolean) {
  const normalizedId = subscribableId.trim()

  if (!normalizedId) {
    throw new Error('Subscribable id is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.issues.setIssueSubscription({ subscribableId: normalizedId, subscribed })
}

async function setIssueLock(owner: string, repo: string, number: number, locked: boolean) {
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

  return api.issues.setIssueLock({ owner: normalizedOwner, repo: normalizedRepo, number: normalizedNumber, locked })
}

async function setIssuePinned(issueId: string, pinned: boolean) {
  const normalizedId = issueId.trim()

  if (!normalizedId) {
    throw new Error('Issue id is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.issues.setIssuePinned({ issueId: normalizedId, pinned })
}

async function deleteIssue(issueId: string) {
  const normalizedId = issueId.trim()

  if (!normalizedId) {
    throw new Error('Issue id is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.issues.deleteIssue({ issueId: normalizedId })
}

async function setReaction(subjectId: string, content: GitHubReactionContent, reacted: boolean) {
  const normalizedSubjectId = subjectId.trim()

  if (!normalizedSubjectId) {
    throw new Error('Reaction subject id is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.issues.setReaction({ subjectId: normalizedSubjectId, content, reacted: Boolean(reacted) })
}

function normalizeIssueSearchState(state: GitHubIssueSearchState | undefined): GitHubIssueSearchState {
  if (state === 'closed' || state === 'all') return state

  return 'open'
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback

  return Math.max(1, Math.round(value))
}

function normalizeIssueUpdateState(value: string): 'open' | 'closed' {
  if (value === 'closed') return 'closed'

  return 'open'
}

function normalizeIssueStateReason(value: string): 'completed' | 'not_planned' {
  if (value === 'not_planned') return 'not_planned'

  return 'completed'
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
