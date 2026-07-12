import { createGitHubApi, defaultGitHubOAuthScopes } from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken, getAuthenticatedAuthMetadata } from './auth'
import { resolveGitHubTransport } from './proxy'

export function registerRepositoriesIpc(): void {
  ipcMain.handle('repositories:get-viewer-state', (_event, owner: string, repo: string) =>
    getRepositoryViewerState(owner, repo)
  )
  ipcMain.handle('repositories:get-viewer-admin', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositories.getViewerAdmin(normalizeRepository(owner, repo))
  )
  ipcMain.handle('repositories:get-viewer-push', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositories.getViewerPush(normalizeRepository(owner, repo))
  )
  ipcMain.handle('repositories:get-navigation-counts', (_event, owner: string, repo: string) =>
    getRepositoryNavigationCounts(owner, repo)
  )
  ipcMain.handle('repositories:get-overview', (_event, owner: string, repo: string) =>
    getRepositoryOverview(owner, repo)
  )
  ipcMain.handle('repositories:get-contributor-stats', (_event, owner: string, repo: string) =>
    getRepositoryContributorStats(owner, repo)
  )
  ipcMain.handle('repositories:list-contributors', (_event, owner: string, repo: string, perPage?: number) =>
    listRepositoryContributors(owner, repo, perPage)
  )
  ipcMain.handle('repositories:list-stargazers', (_event, owner: string, repo: string) =>
    listRepositoryStargazers(owner, repo)
  )
  ipcMain.handle('repositories:list-watchers', (_event, owner: string, repo: string) =>
    listRepositoryWatchers(owner, repo)
  )
  ipcMain.handle('repositories:list-forks', (_event, owner: string, repo: string) =>
    listRepositoryForks(owner, repo)
  )
  ipcMain.handle('repositories:list-files', (_event, owner: string, repo: string, ref?: string | null) =>
    listRepositoryFiles(owner, repo, ref)
  )
  ipcMain.handle('repositories:list-commits', (_event, owner: string, repo: string, ref?: string | null, page?: number, perPage?: number) =>
    listRepositoryCommits(owner, repo, ref, page, perPage)
  )
  ipcMain.handle('repositories:list-branches', (_event, owner: string, repo: string) =>
    listRepositoryBranches(owner, repo)
  )
  ipcMain.handle('repositories:list-branches-detailed', (_event, owner: string, repo: string, options?: ListRefsIpcOptions) =>
    listRepositoryBranchesDetailed(owner, repo, options)
  )
  ipcMain.handle('repositories:list-tags', (_event, owner: string, repo: string, options?: ListRefsIpcOptions) =>
    listRepositoryTags(owner, repo, options)
  )
  ipcMain.handle('repositories:create-branch', (_event, owner: string, repo: string, name: string, fromRef: string) =>
    createRepositoryBranch(owner, repo, name, fromRef)
  )
  ipcMain.handle('repositories:rename-branch', (_event, owner: string, repo: string, name: string, newName: string) =>
    renameRepositoryBranch(owner, repo, name, newName)
  )
  ipcMain.handle('repositories:delete-branch', (_event, owner: string, repo: string, name: string) =>
    deleteRepositoryBranch(owner, repo, name)
  )
  ipcMain.handle('repositories:create-tag', (_event, owner: string, repo: string, name: string, fromRef: string, message?: string | null) =>
    createRepositoryTag(owner, repo, name, fromRef, message)
  )
  ipcMain.handle('repositories:delete-tag', (_event, owner: string, repo: string, name: string) =>
    deleteRepositoryTag(owner, repo, name)
  )
  ipcMain.handle('repositories:get-commit', (_event, owner: string, repo: string, sha: string) =>
    getRepositoryCommit(owner, repo, sha)
  )
  ipcMain.handle('repositories:get-file-preview', (_event, owner: string, repo: string, path: string, ref?: string | null) =>
    getRepositoryFilePreview(owner, repo, path, ref)
  )
  ipcMain.handle('repositories:set-starred', (_event, owner: string, repo: string, starred: boolean) =>
    setRepositoryStarred(owner, repo, starred)
  )
  ipcMain.handle('repositories:set-subscription', (_event, owner: string, repo: string, subscription: string) =>
    setRepositorySubscription(owner, repo, subscription)
  )
  ipcMain.handle('repositories:fork', (_event, owner: string, repo: string, options?: ForkRepositoryIpcOptions) =>
    forkRepository(owner, repo, options)
  )
  ipcMain.handle('repositories:create', (_event, options: CreateRepositoryIpcOptions) =>
    createRepository(options)
  )
  ipcMain.handle('repositories:list-gitignore-templates', () => listGitignoreTemplates())
  ipcMain.handle('repositories:list-licenses', () => listLicenses())
}

interface ForkRepositoryIpcOptions {
  organization?: string | null
  name?: string | null
  defaultBranchOnly?: boolean
}

interface CreateRepositoryIpcOptions {
  organization?: string | null
  name: string
  description?: string | null
  visibility?: string
  autoInit?: boolean
  gitignoreTemplate?: string | null
  licenseTemplate?: string | null
}

const repositorySubscriptions = ['participating', 'all', 'ignore'] as const

type RepositorySubscription = (typeof repositorySubscriptions)[number]

function isRepositorySubscription(value: string): value is RepositorySubscription {
  return (repositorySubscriptions as readonly string[]).includes(value)
}

async function getRepositoryViewerState(owner: string, repo: string) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.getViewerState(repository)
}

async function getRepositoryNavigationCounts(owner: string, repo: string) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.getNavigationCounts(repository)
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

async function getRepositoryContributorStats(owner: string, repo: string) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.getContributorStats(repository)
}

async function listRepositoryStargazers(owner: string, repo: string) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.listStargazers(repository)
}

async function listRepositoryWatchers(owner: string, repo: string) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.listWatchers(repository)
}

async function listRepositoryForks(owner: string, repo: string) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.listForks(repository)
}

async function listRepositoryContributors(owner: string, repo: string, perPage?: number) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.listContributors({
    ...repository,
    perPage,
  })
}

async function listRepositoryFiles(owner: string, repo: string, ref?: string | null) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.listFiles({
    ...repository,
    ref: normalizeRepositoryRef(ref),
  })
}

async function listRepositoryCommits(owner: string, repo: string, ref?: string | null, page?: number, perPage?: number) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.listCommits({
    ...repository,
    ref: normalizeRepositoryRef(ref),
    page,
    perPage,
  })
}

async function listRepositoryBranches(owner: string, repo: string) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.listBranches(repository)
}

interface ListRefsIpcOptions {
  query?: string | null
  page?: number | null
  perPage?: number | null
  defaultBranch?: string | null
}

async function listRepositoryBranchesDetailed(owner: string, repo: string, options?: ListRefsIpcOptions) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.listBranchesDetailed({
    ...repository,
    query: options?.query?.trim() || undefined,
    page: options?.page ?? undefined,
    perPage: options?.perPage ?? undefined,
    defaultBranch: options?.defaultBranch ?? null,
  })
}

async function listRepositoryTags(owner: string, repo: string, options?: ListRefsIpcOptions) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.listTags({
    ...repository,
    query: options?.query?.trim() || undefined,
    page: options?.page ?? undefined,
    perPage: options?.perPage ?? undefined,
  })
}

async function createRepositoryBranch(owner: string, repo: string, name: string, fromRef: string) {
  const repository = normalizeRepository(owner, repo)
  const normalizedName = name?.trim()
  const normalizedFromRef = fromRef?.trim()

  if (!normalizedName) {
    throw new Error('Branch name is required')
  }
  if (!normalizedFromRef) {
    throw new Error('Base branch is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.repositories.createBranch({
    ...repository,
    name: normalizedName,
    fromRef: normalizedFromRef,
  })
}

async function renameRepositoryBranch(owner: string, repo: string, name: string, newName: string) {
  const repository = normalizeRepository(owner, repo)
  const normalizedName = name?.trim()
  const normalizedNewName = newName?.trim()

  if (!normalizedName || !normalizedNewName) {
    throw new Error('Branch name is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.repositories.renameBranch({
    ...repository,
    name: normalizedName,
    newName: normalizedNewName,
  })
}

async function deleteRepositoryBranch(owner: string, repo: string, name: string) {
  const repository = normalizeRepository(owner, repo)
  const normalizedName = name?.trim()

  if (!normalizedName) {
    throw new Error('Branch name is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.repositories.deleteBranch({
    ...repository,
    name: normalizedName,
  })
}

async function createRepositoryTag(owner: string, repo: string, name: string, fromRef: string, message?: string | null) {
  const repository = normalizeRepository(owner, repo)
  const normalizedName = name?.trim()
  const normalizedFromRef = fromRef?.trim()

  if (!normalizedName) {
    throw new Error('Tag name is required')
  }
  if (!normalizedFromRef) {
    throw new Error('Base branch is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.repositories.createTag({
    ...repository,
    name: normalizedName,
    fromRef: normalizedFromRef,
    message: message?.trim() || undefined,
  })
}

async function deleteRepositoryTag(owner: string, repo: string, name: string) {
  const repository = normalizeRepository(owner, repo)
  const normalizedName = name?.trim()

  if (!normalizedName) {
    throw new Error('Tag name is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.repositories.deleteTag({
    ...repository,
    name: normalizedName,
  })
}

async function getRepositoryCommit(owner: string, repo: string, sha: string) {
  const repository = normalizeRepository(owner, repo)
  const normalizedSha = sha.trim()

  if (!normalizedSha) {
    throw new Error('Commit sha is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.repositories.getCommit({
    ...repository,
    sha: normalizedSha,
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

async function setRepositorySubscription(owner: string, repo: string, subscription: string) {
  if (typeof subscription !== 'string' || !isRepositorySubscription(subscription)) {
    throw new Error('Repository subscription must be participating, all or ignore')
  }

  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.setSubscription({
    ...repository,
    subscription,
  })
}

async function forkRepository(owner: string, repo: string, options?: ForkRepositoryIpcOptions) {
  const repository = normalizeRepository(owner, repo)
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.fork({
    ...repository,
    organization: options?.organization?.trim() || null,
    name: options?.name?.trim() || null,
    defaultBranchOnly: options?.defaultBranchOnly ?? true,
  })
}

async function createRepository(options: CreateRepositoryIpcOptions) {
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.create({
    organization: options?.organization?.trim() || null,
    name: String(options?.name ?? '').trim(),
    description: options?.description?.trim() || null,
    visibility: options?.visibility === 'private' ? 'private' : 'public',
    autoInit: options?.autoInit ?? false,
    gitignoreTemplate: options?.gitignoreTemplate?.trim() || null,
    licenseTemplate: options?.licenseTemplate?.trim() || null,
  })
}

async function listGitignoreTemplates() {
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.listGitignoreTemplates()
}

async function listLicenses() {
  const api = await createAuthenticatedGitHubApi()

  return api.repositories.listLicenses()
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
    ...(await resolveGitHubTransport())
  })
}

function listMissingOAuthScopes(): string[] {
  const auth = getAuthenticatedAuthMetadata()

  if (!auth || auth.method !== 'oauth_device') return []

  return defaultGitHubOAuthScopes.filter((scope) => !hasScope(auth.scopes, scope))
}

function hasScope(scopes: string[], requiredScope: string): boolean {
  if (scopes.includes(requiredScope)) return true

  // GitHub collapses granted child scopes into the parent: requesting
  // `user user:follow` stores just `user`, which covers all user:* children.
  if (
    (requiredScope === 'read:user' || requiredScope === 'user:email' || requiredScope === 'user:follow')
    && scopes.includes('user')
  ) {
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
