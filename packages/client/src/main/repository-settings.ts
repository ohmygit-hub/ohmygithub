import {
  createGitHubApi,
  type UpdateRepositoryGeneralSettingsInput,
} from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken } from './auth'
import { resolveGitHubProxyUrl } from './proxy'

export function registerRepositorySettingsIpc(): void {
  ipcMain.handle('repository-settings:get-general', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettings.getGeneralSettings(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:update-general',
    async (_event, owner: string, repo: string, input: UpdateRepositoryGeneralSettingsInput) =>
      (await createAuthenticatedGitHubApi()).repositorySettings.updateGeneralSettings({
        ...normalizeRepository(owner, repo),
        input,
      })
  )
  ipcMain.handle('repository-settings:replace-topics', async (_event, owner: string, repo: string, names: string[]) =>
    (await createAuthenticatedGitHubApi()).repositorySettings.replaceTopics({
      ...normalizeRepository(owner, repo),
      names: Array.isArray(names) ? names.map((name) => String(name).trim()).filter(Boolean) : [],
    })
  )
  ipcMain.handle('repository-settings:set-discussions', async (_event, repositoryNodeId: string, enabled: boolean) =>
    (await createAuthenticatedGitHubApi()).repositorySettings.setDiscussionsEnabled({
      repositoryNodeId: String(repositoryNodeId),
      enabled: Boolean(enabled),
    })
  )
  ipcMain.handle('repository-settings:set-sponsorships', async (_event, repositoryNodeId: string, enabled: boolean) =>
    (await createAuthenticatedGitHubApi()).repositorySettings.setSponsorshipsEnabled({
      repositoryNodeId: String(repositoryNodeId),
      enabled: Boolean(enabled),
    })
  )
  ipcMain.handle(
    'repository-settings:set-immutable-releases',
    async (_event, owner: string, repo: string, enabled: boolean) =>
      (await createAuthenticatedGitHubApi()).repositorySettings.setImmutableReleases({
        ...normalizeRepository(owner, repo),
        enabled: Boolean(enabled),
      })
  )
  ipcMain.handle(
    'repository-settings:transfer',
    async (_event, owner: string, repo: string, newOwner: string, newName?: string) =>
      (await createAuthenticatedGitHubApi()).repositorySettings.transferRepository({
        ...normalizeRepository(owner, repo),
        newOwner: String(newOwner ?? '').trim(),
        newName: newName ? String(newName).trim() : undefined,
      })
  )
  ipcMain.handle('repository-settings:delete', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettings.deleteRepository(normalizeRepository(owner, repo))
  )
}

async function createAuthenticatedGitHubApi() {
  return createGitHubApi({
    token: getAuthenticatedAccessToken(),
    proxyUrl: await resolveGitHubProxyUrl()
  })
}

function normalizeRepository(owner: string, repo: string) {
  const normalizedOwner = String(owner ?? '').trim()
  const normalizedRepo = String(repo ?? '').trim()

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  return {
    owner: normalizedOwner,
    repo: normalizedRepo,
  }
}
