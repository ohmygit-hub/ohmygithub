import { createGitHubApi } from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken, getAuthenticatedAuthMetadata } from './auth'
import { resolveGitHubTransport } from './proxy'

export function registerOrganizationPeopleIpc(): void {
  ipcMain.handle('organization-people:get', (_event, org: string) => getOrganizationPeople(org))
  ipcMain.handle('organization-people:list-invitations', (_event, org: string) => listOrganizationInvitations(org))
  ipcMain.handle('organization-people:invite', (_event, options: unknown) => inviteOrganizationMember(options))
  ipcMain.handle('organization-people:set-role', (_event, options: unknown) => setOrganizationMemberRole(options))
  ipcMain.handle('organization-people:remove-member', (_event, options: unknown) => removeOrganizationMember(options))
  ipcMain.handle('organization-people:cancel-invitation', (_event, options: unknown) =>
    cancelOrganizationInvitation(options)
  )
  ipcMain.handle('organization-people:set-visibility', (_event, options: unknown) =>
    setOrganizationMembershipVisibility(options)
  )
}

async function getOrganizationPeople(org: string) {
  const normalizedOrg = normalizeOrg(org)
  const api = await createAuthenticatedGitHubApi()
  const people = await api.organizationPeople.getPeople(normalizedOrg)

  return {
    ...people,
    missingAdminScopes: listMissingOrgAdminScopes(),
  }
}

async function listOrganizationInvitations(org: string) {
  const normalizedOrg = normalizeOrg(org)
  const api = await createAuthenticatedGitHubApi()

  return api.organizationPeople.listInvitations(normalizedOrg)
}

async function inviteOrganizationMember(options: unknown) {
  const input = options as Partial<{ org: string; identifier: string; role: string }>
  const identifier = String(input?.identifier ?? '').trim()

  if (!identifier) {
    throw new Error('Invitee username or email is required')
  }

  assertOrgAdminScopes()
  const api = await createAuthenticatedGitHubApi()

  await api.organizationPeople.inviteMember({
    org: normalizeOrg(String(input?.org ?? '')),
    identifier,
    role: normalizeMemberRole(input?.role),
  })
}

async function setOrganizationMemberRole(options: unknown) {
  const input = options as Partial<{ org: string; login: string; role: string }>

  assertOrgAdminScopes()
  const api = await createAuthenticatedGitHubApi()

  await api.organizationPeople.setMemberRole({
    org: normalizeOrg(String(input?.org ?? '')),
    login: normalizeLogin(String(input?.login ?? '')),
    role: normalizeMemberRole(input?.role),
  })
}

async function removeOrganizationMember(options: unknown) {
  const input = options as Partial<{ org: string; login: string }>

  assertOrgAdminScopes()
  const api = await createAuthenticatedGitHubApi()

  await api.organizationPeople.removeMember({
    org: normalizeOrg(String(input?.org ?? '')),
    login: normalizeLogin(String(input?.login ?? '')),
  })
}

async function cancelOrganizationInvitation(options: unknown) {
  const input = options as Partial<{ org: string; invitationId: number }>
  const invitationId = Number(input?.invitationId)

  if (!Number.isInteger(invitationId) || invitationId <= 0) {
    throw new Error('Invitation id is required')
  }

  assertOrgAdminScopes()
  const api = await createAuthenticatedGitHubApi()

  await api.organizationPeople.cancelInvitation({
    org: normalizeOrg(String(input?.org ?? '')),
    invitationId,
  })
}

async function setOrganizationMembershipVisibility(options: unknown) {
  const input = options as Partial<{ org: string; login: string; publicized: boolean }>

  if (typeof input?.publicized !== 'boolean') {
    throw new Error('Membership visibility is required')
  }

  const api = await createAuthenticatedGitHubApi()

  await api.organizationPeople.setMembershipVisibility({
    org: normalizeOrg(String(input?.org ?? '')),
    login: normalizeLogin(String(input?.login ?? '')),
    publicized: input.publicized,
  })
}

function normalizeOrg(org: string): string {
  const normalized = String(org ?? '').trim()

  if (!normalized) {
    throw new Error('Organization login is required')
  }

  return normalized
}

function normalizeLogin(login: string): string {
  const normalized = String(login ?? '').trim()

  if (!normalized) {
    throw new Error('Account login is required')
  }

  return normalized
}

function normalizeMemberRole(role: string | undefined): 'member' | 'admin' {
  return role === 'admin' ? 'admin' : 'member'
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
