import {
  createGitHubApi,
  type GitHubInteractionLimitExpiry,
  type GitHubInteractionLimitGroup,
  type UpdateUserSettingsProfileInput,
  type UpsertCodespacesSecretInput,
} from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken, getAuthenticatedViewerLogin } from './auth'
import { resolveGitHubTransport } from './proxy'

export function registerUserSettingsIpc(): void {
  ipcMain.handle('user-settings:get-profile', async () =>
    (await createAuthenticatedGitHubApi()).userSettings.getProfile()
  )
  ipcMain.handle(
    'user-settings:update-profile',
    async (_event, input: UpdateUserSettingsProfileInput) =>
      (await createAuthenticatedGitHubApi()).userSettings.updateProfile(normalizeProfileInput(input))
  )
  ipcMain.handle('user-settings:list-social-accounts', async () =>
    (await createAuthenticatedGitHubApi()).userSettings.listSocialAccounts()
  )
  ipcMain.handle('user-settings:add-social-accounts', async (_event, urls: string[]) =>
    (await createAuthenticatedGitHubApi()).userSettings.addSocialAccounts(normalizeStringArray(urls))
  )
  ipcMain.handle('user-settings:delete-social-accounts', async (_event, urls: string[]) =>
    (await createAuthenticatedGitHubApi()).userSettings.deleteSocialAccounts(normalizeStringArray(urls))
  )

  ipcMain.handle('user-settings:list-emails', async () =>
    (await createAuthenticatedGitHubApi()).userSettings.listEmails()
  )
  ipcMain.handle('user-settings:add-email', async (_event, email: string) =>
    (await createAuthenticatedGitHubApi()).userSettings.addEmail(normalizeRequiredString(email, 'email'))
  )
  ipcMain.handle('user-settings:delete-email', async (_event, email: string) =>
    (await createAuthenticatedGitHubApi()).userSettings.deleteEmail(normalizeRequiredString(email, 'email'))
  )
  ipcMain.handle(
    'user-settings:set-primary-email-visibility',
    async (_event, visibility: 'public' | 'private') =>
      (await createAuthenticatedGitHubApi()).userSettings.setPrimaryEmailVisibility(
        visibility === 'public' ? 'public' : 'private'
      )
  )

  ipcMain.handle('user-settings:list-ssh-keys', async () =>
    (await createAuthenticatedGitHubApi()).userSettings.listSshKeys()
  )
  ipcMain.handle('user-settings:add-ssh-key', async (_event, title: string, key: string) =>
    (await createAuthenticatedGitHubApi()).userSettings.addSshKey(
      normalizeRequiredString(title, 'title'),
      normalizeRequiredString(key, 'key')
    )
  )
  ipcMain.handle('user-settings:delete-ssh-key', async (_event, keyId: number) =>
    (await createAuthenticatedGitHubApi()).userSettings.deleteSshKey(normalizeId(keyId))
  )
  ipcMain.handle('user-settings:list-gpg-keys', async () =>
    (await createAuthenticatedGitHubApi()).userSettings.listGpgKeys()
  )
  ipcMain.handle('user-settings:add-gpg-key', async (_event, key: string, name?: string) =>
    (await createAuthenticatedGitHubApi()).userSettings.addGpgKey(
      normalizeRequiredString(key, 'key'),
      name?.trim() || undefined
    )
  )
  ipcMain.handle('user-settings:delete-gpg-key', async (_event, keyId: number) =>
    (await createAuthenticatedGitHubApi()).userSettings.deleteGpgKey(normalizeId(keyId))
  )
  ipcMain.handle('user-settings:list-ssh-signing-keys', async () =>
    (await createAuthenticatedGitHubApi()).userSettings.listSshSigningKeys()
  )
  ipcMain.handle('user-settings:add-ssh-signing-key', async (_event, title: string, key: string) =>
    (await createAuthenticatedGitHubApi()).userSettings.addSshSigningKey(
      normalizeRequiredString(title, 'title'),
      normalizeRequiredString(key, 'key')
    )
  )
  ipcMain.handle('user-settings:delete-ssh-signing-key', async (_event, keyId: number) =>
    (await createAuthenticatedGitHubApi()).userSettings.deleteSshSigningKey(normalizeId(keyId))
  )

  ipcMain.handle('user-settings:list-blocked-users', async () =>
    (await createAuthenticatedGitHubApi()).userSettings.listBlockedUsers()
  )
  ipcMain.handle('user-settings:block-user', async (_event, username: string) =>
    (await createAuthenticatedGitHubApi()).userSettings.blockUser(
      normalizeRequiredString(username, 'username')
    )
  )
  ipcMain.handle('user-settings:unblock-user', async (_event, username: string) =>
    (await createAuthenticatedGitHubApi()).userSettings.unblockUser(
      normalizeRequiredString(username, 'username')
    )
  )

  ipcMain.handle('user-settings:get-interaction-limits', async () =>
    (await createAuthenticatedGitHubApi()).userSettings.getInteractionLimits()
  )
  ipcMain.handle(
    'user-settings:set-interaction-limits',
    async (_event, limit: GitHubInteractionLimitGroup, expiry?: GitHubInteractionLimitExpiry) =>
      (await createAuthenticatedGitHubApi()).userSettings.setInteractionLimits(limit, expiry)
  )
  ipcMain.handle('user-settings:clear-interaction-limits', async () =>
    (await createAuthenticatedGitHubApi()).userSettings.clearInteractionLimits()
  )

  ipcMain.handle('user-settings:list-organization-memberships', async () =>
    (await createAuthenticatedGitHubApi()).userSettings.listOrganizationMemberships(
      getAuthenticatedViewerLogin()
    )
  )
  ipcMain.handle('user-settings:accept-organization-invitation', async (_event, org: string) =>
    (await createAuthenticatedGitHubApi()).userSettings.acceptOrganizationInvitation(
      normalizeRequiredString(org, 'org')
    )
  )
  ipcMain.handle(
    'user-settings:set-organization-membership-visibility',
    async (_event, org: string, isPublic: boolean) =>
      (await createAuthenticatedGitHubApi()).userSettings.setOrganizationMembershipVisibility(
        normalizeRequiredString(org, 'org'),
        getAuthenticatedViewerLogin(),
        Boolean(isPublic)
      )
  )

  ipcMain.handle('user-settings:list-codespaces-secrets', async () =>
    (await createAuthenticatedGitHubApi()).userSettings.listCodespacesSecrets()
  )
  ipcMain.handle(
    'user-settings:upsert-codespaces-secret',
    async (_event, input: UpsertCodespacesSecretInput) =>
      (await createAuthenticatedGitHubApi()).userSettings.upsertCodespacesSecret({
        name: normalizeRequiredString(input?.name, 'name'),
        value: normalizeRequiredString(input?.value, 'value'),
        selectedRepositoryIds: Array.isArray(input?.selectedRepositoryIds)
          ? input.selectedRepositoryIds.filter((id) => typeof id === 'number')
          : [],
      })
  )
  ipcMain.handle('user-settings:delete-codespaces-secret', async (_event, name: string) =>
    (await createAuthenticatedGitHubApi()).userSettings.deleteCodespacesSecret(
      normalizeRequiredString(name, 'name')
    )
  )

  ipcMain.handle('user-settings:list-saved-replies', async () =>
    (await createAuthenticatedGitHubApi()).userSettings.listSavedReplies()
  )
}

function normalizeProfileInput(input: UpdateUserSettingsProfileInput): UpdateUserSettingsProfileInput {
  return {
    name: normalizeOptionalString(input?.name),
    email: normalizeOptionalString(input?.email),
    bio: normalizeOptionalString(input?.bio),
    company: normalizeOptionalString(input?.company),
    location: normalizeOptionalString(input?.location),
    blog: normalizeOptionalString(input?.blog),
    twitterUsername: normalizeOptionalString(input?.twitterUsername),
    hireable: typeof input?.hireable === 'boolean' ? input.hireable : undefined,
  }
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function normalizeRequiredString(value: string | undefined, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : ''

  if (!normalized) {
    throw new Error(`A non-empty ${field} is required`)
  }

  return normalized
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeId(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error('A valid id is required')
  }

  return value
}

async function createAuthenticatedGitHubApi() {
  return createGitHubApi({
    token: getAuthenticatedAccessToken(),
    ...(await resolveGitHubTransport())
  })
}
