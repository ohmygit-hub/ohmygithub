import { createGitHubApi, defaultGitHubOAuthScopes } from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken, getAuthenticatedAuthMetadata } from './auth'
import { resolveGitHubProxyUrl } from './proxy'

export function registerRepositoriesIpc(): void {
  ipcMain.handle('repositories:get-viewer-state', (_event, owner: string, repo: string) =>
    getRepositoryViewerState(owner, repo)
  )
  ipcMain.handle('repositories:get-overview', (_event, owner: string, repo: string) =>
    getRepositoryOverview(owner, repo)
  )
  ipcMain.handle('repositories:list-files', (_event, owner: string, repo: string, ref?: string | null) =>
    listRepositoryFiles(owner, repo, ref)
  )
  ipcMain.handle('repositories:get-file-preview', (_event, owner: string, repo: string, path: string, ref?: string | null) =>
    getRepositoryFilePreview(owner, repo, path, ref)
  )
  ipcMain.handle('repositories:set-starred', (_event, owner: string, repo: string, starred: boolean) =>
    setRepositoryStarred(owner, repo, starred)
  )
  ipcMain.handle('repositories:set-watching', (_event, owner: string, repo: string, watching: boolean) =>
    setRepositoryWatching(owner, repo, watching)
  )
}

async function getRepositoryViewerState(owner: string, repo: string) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.getViewerState(repository)
}

async function getRepositoryOverview(owner: string, repo: string) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()
  const overview = await api.repositories.getOverview(repository)

  return {
    ...overview,
    missingScopes: listMissingOAuthScopes()
  }
}

async function listRepositoryFiles(owner: string, repo: string, ref?: string | null) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.listFiles({
    ...repository,
    ref: normalizeRepositoryRef(ref),
  })
}

async function getRepositoryFilePreview(owner: string, repo: string, path: string, ref?: string | null) {
  const repository = normalizeRepository(owner, repo)
  const normalizedPath = path.trim()

  if (!normalizedPath) {
    throw new Error('Repository file path is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.repositories.getFilePreview({
    ...repository,
    path: normalizedPath,
    ref: normalizeRepositoryRef(ref),
  })
}

async function setRepositoryStarred(owner: string, repo: string, starred: boolean) {
  if (typeof starred !== 'boolean') {
    throw new Error('Repository starred state is required')
  }

  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.setStarred({
    ...repository,
    starred,
  })
}

async function setRepositoryWatching(owner: string, repo: string, watching: boolean) {
  if (typeof watching !== 'boolean') {
    throw new Error('Repository watching state is required')
  }

  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.setWatching({
    ...repository,
    watching,
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

function normalizeRepositoryRef(ref: string | null | undefined): string | null {
  return ref?.trim() || null
}

async function createAuthenticatedGitHubApi() {
  return createGitHubApi({
    token: getAuthenticatedAccessToken(),
    proxyUrl: await resolveGitHubProxyUrl()
  })
}

function listMissingOAuthScopes(): string[] {
  const auth = getAuthenticatedAuthMetadata()

  if (!auth || auth.method !== 'oauth_device') return []

  return defaultGitHubOAuthScopes.filter((scope) => !hasScope(auth.scopes, scope))
}

function hasScope(scopes: string[], requiredScope: string): boolean {
  if (scopes.includes(requiredScope)) return true

  if ((requiredScope === 'read:user' || requiredScope === 'user:email') && scopes.includes('user')) {
    return true
  }

  if (requiredScope === 'read:org' && scopes.includes('admin:org')) {
    return true
  }

  if (requiredScope === 'read:project' && scopes.includes('project')) {
    return true
  }

  if (requiredScope === 'read:packages' && (scopes.includes('write:packages') || scopes.includes('delete:packages'))) {
    return true
  }

  return false
}
