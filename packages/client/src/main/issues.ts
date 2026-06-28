import {
  createGitHubApi,
  type GitHubIssueCategory,
  type GitHubIssueSearchState,
  type SearchRepositoryIssuesOptions,
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
  ipcMain.handle('issues:create-comment', (_event, owner: string, repo: string, number: number, body: string) =>
    createIssueComment(owner, repo, number, body)
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

function normalizeIssueSearchState(state: GitHubIssueSearchState | undefined): GitHubIssueSearchState {
  if (state === 'closed' || state === 'all') return state

  return 'open'
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
