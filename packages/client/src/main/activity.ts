import { createGitHubApi } from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken, getAuthenticatedViewerLogin } from './auth'
import { resolveGitHubProxyUrl } from './proxy'

interface ListReceivedEventsIpcOptions {
  page?: number
}

export function registerActivityIpc(): void {
  ipcMain.handle('activity:list-received-events', (_event, options?: ListReceivedEventsIpcOptions) =>
    listReceivedEvents(options),
  )
  ipcMain.handle('activity:get-repository-cards', (_event, fullNames: string[]) =>
    getRepositoryCards(fullNames),
  )
}

async function getRepositoryCards(fullNames: string[]) {
  const api = await createAuthenticatedGitHubApi()
  return api.activity.getRepositoryCards(Array.isArray(fullNames) ? fullNames : [])
}

async function listReceivedEvents(options?: ListReceivedEventsIpcOptions) {
  const api = await createAuthenticatedGitHubApi()
  return api.activity.listReceivedEvents({
    username: getAuthenticatedViewerLogin(),
    page: options?.page,
  })
}

async function createAuthenticatedGitHubApi() {
  return createGitHubApi({
    token: getAuthenticatedAccessToken(),
    proxyUrl: await resolveGitHubProxyUrl(),
  })
}
