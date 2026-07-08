import { createGitHubApi } from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken, getAuthenticatedAuthMetadata } from './auth'
import { resolveGitHubProxyUrl } from './proxy'

export function registerAccountsIpc(): void {
  ipcMain.handle('accounts:get-profile', (_event, login: string) => getAccountProfile(login))
  ipcMain.handle('accounts:get-overview', (_event, login: string) => getAccountOverview(login))
  ipcMain.handle('accounts:get-contributions', (_event, options: unknown) => getAccountContributions(options))
  ipcMain.handle('accounts:list-repositories', (_event, options: unknown) => listAccountRepositories(options))
  ipcMain.handle('accounts:list-starred-repositories', (_event, options: unknown) =>
    listAccountStarredRepositories(options)
  )
  ipcMain.handle('accounts:list-starred-lists', (_event, login: string) =>
    listAccountStarredLists(login)
  )
  ipcMain.handle('accounts:get-viewer-state', (_event, login: string) => getAccountViewerState(login))
  ipcMain.handle('accounts:set-followed', (_event, options: unknown) => setAccountFollowed(options))
  ipcMain.handle('accounts:list-followers', (_event, login: string) => listAccountFollowers(login))
  ipcMain.handle('accounts:list-following', (_event, login: string) => listAccountFollowing(login))
  ipcMain.handle('accounts:get-sponsors-summary', (_event, login: string) => getAccountSponsorsSummary(login))
  ipcMain.handle('accounts:list-sponsorships', (_event, options: unknown) => listAccountSponsorships(options))
  ipcMain.handle('accounts:list-organizations', () => listViewerOrganizations())
  ipcMain.handle('accounts:list-organization-repositories', (_event, owner: string) =>
    listOrganizationRepositories(owner)
  )
  ipcMain.handle('accounts:list-all-viewer-repositories', () => listAllViewerRepositories())
}

async function getAccountProfile(login: string) {
  const normalizedLogin = String(login ?? '').trim()

  if (!normalizedLogin) {
    throw new Error('Account login is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.accounts.getProfile(normalizedLogin)
}

async function getAccountOverview(login: string) {
  const normalizedLogin = normalizeLogin(login)
  const api = await createAuthenticatedGitHubApi()

  return api.accounts.getOverview(normalizedLogin)
}

async function getAccountContributions(options: unknown) {
  const normalizedOptions = normalizeAccountContributionsOptions(options)
  const api = await createAuthenticatedGitHubApi()

  return api.accounts.getContributions(normalizedOptions)
}

async function listAccountRepositories(options: unknown) {
  const normalizedOptions = normalizeAccountRepositoriesOptions(options)
  const api = await createAuthenticatedGitHubApi()

  return api.accounts.listRepositories(normalizedOptions)
}

async function listAccountStarredRepositories(options: unknown) {
  const normalizedOptions = normalizeAccountRepositoriesOptions(options)
  const api = await createAuthenticatedGitHubApi()

  return api.accounts.listStarredRepositories(normalizedOptions)
}

async function listAccountStarredLists(login: string) {
  const normalizedLogin = normalizeLogin(login)
  const api = await createAuthenticatedGitHubApi()

  return api.accounts.listStarredLists(normalizedLogin)
}

async function getAccountViewerState(login: string) {
  const normalizedLogin = normalizeLogin(login)
  const missingScopes = listMissingFollowScopes()

  if (missingScopes.length > 0) {
    return {
      isFollowing: false,
      missingScopes,
    }
  }

  const api = await createAuthenticatedGitHubApi()

  return api.accounts.getViewerState(normalizedLogin)
}

async function setAccountFollowed(options: unknown) {
  const normalizedOptions = normalizeSetAccountFollowedOptions(options)
  const missingScopes = listMissingFollowScopes()

  if (missingScopes.length > 0) {
    throw new Error(`GitHub OAuth token is missing required scope: ${missingScopes.join(', ')}`)
  }

  const api = await createAuthenticatedGitHubApi()

  return api.accounts.setFollowed(normalizedOptions)
}

async function listAccountFollowers(login: string) {
  const normalizedLogin = normalizeLogin(login)
  const api = await createAuthenticatedGitHubApi()

  return api.accounts.listFollowers(normalizedLogin)
}

async function listAccountFollowing(login: string) {
  const normalizedLogin = normalizeLogin(login)
  const api = await createAuthenticatedGitHubApi()

  return api.accounts.listFollowing(normalizedLogin)
}

async function getAccountSponsorsSummary(login: string) {
  const normalizedLogin = normalizeLogin(login)
  const api = await createAuthenticatedGitHubApi()

  return api.accounts.getSponsorsSummary(normalizedLogin)
}

async function listAccountSponsorships(options: unknown) {
  const input = options as Partial<{ login: string; role: string; page: number; perPage: number }>
  const login = normalizeLogin(String(input?.login ?? ''))
  const role = input.role === 'sponsor' ? 'sponsor' : 'maintainer'
  const api = await createAuthenticatedGitHubApi()

  return api.accounts.listSponsorships({
    login,
    role,
    page: normalizePositiveInteger(input.page, 1),
    perPage: normalizePositiveInteger(input.perPage, 20),
  })
}

async function listViewerOrganizations() {
  const api = await createAuthenticatedGitHubApi()

  return api.accounts.listViewerOrganizations()
}

async function listOrganizationRepositories(owner: string) {
  const normalizedOwner = owner.trim()

  if (!normalizedOwner) {
    throw new Error('Organization owner is required')
  }

  const api = await createAuthenticatedGitHubApi()

  return api.accounts.listOrganizationRepositories(normalizedOwner)
}

async function listAllViewerRepositories() {
  const api = await createAuthenticatedGitHubApi()

  return api.accounts.listAllViewerRepositories()
}

function normalizeLogin(login: string): string {
  const normalizedLogin = String(login ?? '').trim()

  if (!normalizedLogin) {
    throw new Error('Account login is required')
  }

  return normalizedLogin
}

function normalizeAccountRepositoriesOptions(options: unknown) {
  const input = options as Partial<{ login: string; page: number; perPage: number; search: string; list: string }>
  const login = normalizeLogin(String(input?.login ?? ''))

  return {
    login,
    page: normalizePositiveInteger(input.page, 1),
    perPage: normalizePositiveInteger(input.perPage, 12),
    search: String(input.search ?? '').trim(),
    list: String(input.list ?? '').trim(),
  }
}

function normalizeAccountContributionsOptions(options: unknown) {
  const input = options as Partial<{ login: string; year: number }>
  const login = normalizeLogin(String(input?.login ?? ''))
  const year = input.year === undefined ? undefined : normalizePositiveInteger(input.year, new Date().getFullYear())

  return {
    login,
    year,
  }
}

function normalizeSetAccountFollowedOptions(options: unknown) {
  const input = options as Partial<{ login: string; followed: boolean }>
  const login = normalizeLogin(String(input?.login ?? ''))

  if (typeof input.followed !== 'boolean') {
    throw new Error('Account follow state is required')
  }

  return {
    login,
    followed: input.followed,
  }
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

async function createAuthenticatedGitHubApi() {
  return createGitHubApi({
    token: getAuthenticatedAccessToken(),
    proxyUrl: await resolveGitHubProxyUrl()
  })
}

function listMissingFollowScopes(): string[] {
  const auth = getAuthenticatedAuthMetadata()

  if (!auth || auth.method !== 'oauth_device') return []

  return hasScope(auth.scopes, 'user:follow') ? [] : ['user:follow']
}

function hasScope(scopes: string[], requiredScope: string): boolean {
  if (scopes.includes(requiredScope)) return true

  if (requiredScope === 'user:follow' && scopes.includes('user')) return true

  return false
}
