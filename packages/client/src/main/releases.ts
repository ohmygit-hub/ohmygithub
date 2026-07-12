import {
  createGitHubApi,
  type ListRepositoryReleasesOptions,
  type UpdateReleaseChanges,
} from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken } from './auth'
import { resolveGitHubTransport } from './proxy'

export function registerReleasesIpc(): void {
  ipcMain.handle('releases:list', (_event, options: ListRepositoryReleasesOptions) =>
    listRepositoryReleases(options)
  )
  ipcMain.handle('releases:create', (_event, options: unknown) =>
    createRelease(options)
  )
  ipcMain.handle('releases:update', (_event, owner: string, repo: string, releaseId: number, changes: unknown) =>
    updateRelease(owner, repo, releaseId, changes)
  )
  ipcMain.handle('releases:delete', (_event, owner: string, repo: string, releaseId: number) =>
    deleteRelease(owner, repo, releaseId)
  )
}

async function listRepositoryReleases(options: ListRepositoryReleasesOptions) {
  const repository = normalizeRepository(options.owner, options.repo)
  const api = await createAuthenticatedGitHubApi()

  return api.releases.listRepositoryReleases({
    ...repository,
    page: normalizePositiveInteger(options.page, 1),
    perPage: normalizePositiveInteger(options.perPage, 20),
  })
}

async function createRelease(options: unknown) {
  const payload = normalizeReleasePayload(options)
  const owner = typeof (options as { owner?: unknown })?.owner === 'string' ? (options as { owner: string }).owner : ''
  const repo = typeof (options as { repo?: unknown })?.repo === 'string' ? (options as { repo: string }).repo : ''
  const repository = normalizeRepository(owner, repo)

  if (!payload.tagName) {
    throw new Error('Release tag name is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.releases.createRelease({
    ...repository,
    tagName: payload.tagName,
    ...payload.changes,
  })
}

async function updateRelease(owner: string, repo: string, releaseId: number, changes: unknown) {
  const repository = normalizeRepository(owner, repo)
  const payload = normalizeReleasePayload(changes)
  const api = await createAuthenticatedGitHubApi()

  return api.releases.updateRelease({
    ...repository,
    releaseId: normalizePositiveInteger(releaseId, 1),
    ...(payload.tagName ? { tagName: payload.tagName } : {}),
    ...payload.changes,
  })
}

async function deleteRelease(owner: string, repo: string, releaseId: number) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  await api.releases.deleteRelease({
    ...repository,
    releaseId: normalizePositiveInteger(releaseId, 1),
  })
}

function normalizeReleasePayload(value: unknown): { tagName: string | null; changes: UpdateReleaseChanges } {
  if (!value || typeof value !== 'object') {
    return { tagName: null, changes: {} }
  }

  const payload = value as Record<string, unknown>
  const tagName = typeof payload.tagName === 'string' ? payload.tagName.trim() : ''
  const changes: UpdateReleaseChanges = {}

  if (typeof payload.targetCommitish === 'string' && payload.targetCommitish.trim()) {
    changes.targetCommitish = payload.targetCommitish.trim()
  }
  if (typeof payload.name === 'string') {
    changes.name = payload.name
  }
  if (typeof payload.body === 'string') {
    changes.body = payload.body
  }
  if (typeof payload.draft === 'boolean') {
    changes.draft = payload.draft
  }
  if (typeof payload.prerelease === 'boolean') {
    changes.prerelease = payload.prerelease
  }

  return { tagName: tagName || null, changes }
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
