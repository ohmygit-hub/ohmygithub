import { createGitHubApi } from '@oh-my-github/api'
import type { GitHubTeamMemberRole, GitHubTeamPrivacy } from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken, getAuthenticatedAuthMetadata } from './auth'
import { resolveGitHubTransport } from './proxy'

export function registerOrganizationTeamsIpc(): void {
  ipcMain.handle('organization-teams:get', (_event, org: string) => getOrganizationTeams(org))
  ipcMain.handle('organization-teams:get-detail', (_event, options: unknown) => getTeamDetail(options))
  ipcMain.handle('organization-teams:create', (_event, options: unknown) => createTeam(options))
  ipcMain.handle('organization-teams:update', (_event, options: unknown) => updateTeam(options))
  ipcMain.handle('organization-teams:delete', (_event, options: unknown) => deleteTeam(options))
  ipcMain.handle('organization-teams:set-membership', (_event, options: unknown) => setTeamMembership(options))
  ipcMain.handle('organization-teams:remove-member', (_event, options: unknown) => removeTeamMember(options))
  ipcMain.handle('organization-teams:add-repository', (_event, options: unknown) => addOrUpdateTeamRepository(options))
  ipcMain.handle('organization-teams:remove-repository', (_event, options: unknown) => removeTeamRepository(options))
}

async function getOrganizationTeams(org: string) {
  const normalizedOrg = normalizeRequired(org, 'Organization login')
  const api = await createAuthenticatedGitHubApi()
  const teams = await api.organizationTeams.getTeams(normalizedOrg)

  return {
    ...teams,
    missingAdminScopes: listMissingOrgAdminScopes(),
  }
}

async function getTeamDetail(options: unknown) {
  const input = options as Partial<{ org: string; teamSlug: string }>
  const api = await createAuthenticatedGitHubApi()

  return api.organizationTeams.getTeamDetail({
    org: normalizeRequired(String(input?.org ?? ''), 'Organization login'),
    teamSlug: normalizeRequired(String(input?.teamSlug ?? ''), 'Team slug'),
  })
}

async function createTeam(options: unknown) {
  const input = options as Partial<{
    org: string
    name: string
    description: string
    privacy: string
    parentTeamId: number
  }>
  const parentTeamId = Number(input?.parentTeamId)

  assertOrgAdminScopes()
  const api = await createAuthenticatedGitHubApi()

  return api.organizationTeams.createTeam({
    org: normalizeRequired(String(input?.org ?? ''), 'Organization login'),
    name: normalizeRequired(String(input?.name ?? ''), 'Team name'),
    ...(typeof input?.description === 'string' && input.description.trim()
      ? { description: input.description.trim() }
      : {}),
    privacy: normalizeTeamPrivacy(input?.privacy),
    ...(Number.isInteger(parentTeamId) && parentTeamId > 0 ? { parentTeamId } : {}),
  })
}

async function updateTeam(options: unknown) {
  const input = options as Partial<{
    org: string
    teamSlug: string
    name: string
    description: string
    privacy: string
  }>

  assertOrgAdminScopes()
  const api = await createAuthenticatedGitHubApi()

  return api.organizationTeams.updateTeam({
    org: normalizeRequired(String(input?.org ?? ''), 'Organization login'),
    teamSlug: normalizeRequired(String(input?.teamSlug ?? ''), 'Team slug'),
    ...(typeof input?.name === 'string' && input.name.trim() ? { name: input.name.trim() } : {}),
    ...(typeof input?.description === 'string' ? { description: input.description.trim() } : {}),
    ...(input?.privacy ? { privacy: normalizeTeamPrivacy(input.privacy) } : {}),
  })
}

async function deleteTeam(options: unknown) {
  const input = options as Partial<{ org: string; teamSlug: string }>

  assertOrgAdminScopes()
  const api = await createAuthenticatedGitHubApi()

  await api.organizationTeams.deleteTeam({
    org: normalizeRequired(String(input?.org ?? ''), 'Organization login'),
    teamSlug: normalizeRequired(String(input?.teamSlug ?? ''), 'Team slug'),
  })
}

async function setTeamMembership(options: unknown) {
  const input = options as Partial<{ org: string; teamSlug: string; login: string; role: string }>

  assertOrgAdminScopes()
  const api = await createAuthenticatedGitHubApi()

  await api.organizationTeams.setTeamMembership({
    org: normalizeRequired(String(input?.org ?? ''), 'Organization login'),
    teamSlug: normalizeRequired(String(input?.teamSlug ?? ''), 'Team slug'),
    login: normalizeRequired(String(input?.login ?? ''), 'Account login'),
    role: normalizeTeamMemberRole(input?.role),
  })
}

async function removeTeamMember(options: unknown) {
  const input = options as Partial<{ org: string; teamSlug: string; login: string }>

  assertOrgAdminScopes()
  const api = await createAuthenticatedGitHubApi()

  await api.organizationTeams.removeTeamMember({
    org: normalizeRequired(String(input?.org ?? ''), 'Organization login'),
    teamSlug: normalizeRequired(String(input?.teamSlug ?? ''), 'Team slug'),
    login: normalizeRequired(String(input?.login ?? ''), 'Account login'),
  })
}

async function addOrUpdateTeamRepository(options: unknown) {
  const input = options as Partial<{
    org: string
    teamSlug: string
    owner: string
    repo: string
    permission: string
  }>

  assertOrgAdminScopes()
  const api = await createAuthenticatedGitHubApi()

  await api.organizationTeams.addOrUpdateTeamRepository({
    org: normalizeRequired(String(input?.org ?? ''), 'Organization login'),
    teamSlug: normalizeRequired(String(input?.teamSlug ?? ''), 'Team slug'),
    owner: normalizeRequired(String(input?.owner ?? ''), 'Repository owner'),
    repo: normalizeRequired(String(input?.repo ?? ''), 'Repository name'),
    permission: normalizeRequired(String(input?.permission ?? ''), 'Repository permission'),
  })
}

async function removeTeamRepository(options: unknown) {
  const input = options as Partial<{ org: string; teamSlug: string; owner: string; repo: string }>

  assertOrgAdminScopes()
  const api = await createAuthenticatedGitHubApi()

  await api.organizationTeams.removeTeamRepository({
    org: normalizeRequired(String(input?.org ?? ''), 'Organization login'),
    teamSlug: normalizeRequired(String(input?.teamSlug ?? ''), 'Team slug'),
    owner: normalizeRequired(String(input?.owner ?? ''), 'Repository owner'),
    repo: normalizeRequired(String(input?.repo ?? ''), 'Repository name'),
  })
}

function normalizeRequired(value: string, label: string): string {
  const normalized = String(value ?? '').trim()

  if (!normalized) {
    throw new Error(`${label} is required`)
  }

  return normalized
}

function normalizeTeamPrivacy(privacy: string | undefined): GitHubTeamPrivacy {
  return privacy === 'secret' ? 'secret' : 'visible'
}

function normalizeTeamMemberRole(role: string | undefined): GitHubTeamMemberRole {
  return role === 'maintainer' ? 'maintainer' : 'member'
}

async function createAuthenticatedGitHubApi() {
  return createGitHubApi({
    token: getAuthenticatedAccessToken(),
    ...(await resolveGitHubTransport())
  })
}

function assertOrgAdminScopes(): void {
  const missingScopes = listMissingOrgAdminScopes()

  if (missingScopes.length > 0) {
    throw new Error(`GitHub OAuth token is missing required scope: ${missingScopes.join(', ')}`)
  }
}

function listMissingOrgAdminScopes(): string[] {
  const auth = getAuthenticatedAuthMetadata()

  if (!auth || auth.method !== 'oauth_device') return []

  return auth.scopes.includes('admin:org') ? [] : ['admin:org']
}
