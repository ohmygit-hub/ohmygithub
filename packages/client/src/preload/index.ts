import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  app: {
    name: 'Oh My GitHub',
    version: '0.1.0'
  },
  accounts: {
    getProfile: (login: string) => ipcRenderer.invoke('accounts:get-profile', login),
    getOverview: (login: string) => ipcRenderer.invoke('accounts:get-overview', login),
    getContributions: (options: unknown) => ipcRenderer.invoke('accounts:get-contributions', options),
    listRepositories: (options: unknown) => ipcRenderer.invoke('accounts:list-repositories', options),
    listStarredRepositories: (options: unknown) =>
      ipcRenderer.invoke('accounts:list-starred-repositories', options),
    getViewerState: (login: string) => ipcRenderer.invoke('accounts:get-viewer-state', login),
    setFollowed: (options: unknown) => ipcRenderer.invoke('accounts:set-followed', options),
    listOrganizations: () => ipcRenderer.invoke('accounts:list-organizations'),
    listOrganizationRepositories: (owner: string) =>
      ipcRenderer.invoke('accounts:list-organization-repositories', owner)
  },
  issues: {
    listIssueCategory: (category: string) => ipcRenderer.invoke('issues:list-category', category),
    listViewerIssues: () => ipcRenderer.invoke('issues:list-viewer'),
    listRepositoryIssues: (owner: string, repo: string) =>
      ipcRenderer.invoke('issues:list-repository', owner, repo),
    searchRepositoryIssues: (options: unknown) =>
      ipcRenderer.invoke('issues:search-repository', options),
    getIssueDetail: (owner: string, repo: string, number: number) =>
      ipcRenderer.invoke('issues:get-detail', owner, repo, number),
    updateIssue: (options: unknown) => ipcRenderer.invoke('issues:update', options),
    listRepositoryIssueLabels: (owner: string, repo: string) =>
      ipcRenderer.invoke('issues:list-repository-labels', owner, repo),
    listRepositoryAssignableUsers: (owner: string, repo: string) =>
      ipcRenderer.invoke('issues:list-repository-assignable-users', owner, repo),
    listRepositoryIssueMilestones: (owner: string, repo: string) =>
      ipcRenderer.invoke('issues:list-repository-milestones', owner, repo),
    createIssueComment: (owner: string, repo: string, number: number, body: string) =>
      ipcRenderer.invoke('issues:create-comment', owner, repo, number, body),
    editIssueComment: (owner: string, repo: string, commentId: number, body: string) =>
      ipcRenderer.invoke('issues:edit-comment', owner, repo, commentId, body),
    deleteIssueComment: (owner: string, repo: string, commentId: number) =>
      ipcRenderer.invoke('issues:delete-comment', owner, repo, commentId)
  },
  pulls: {
    listPullRequestCategory: (category: string) => ipcRenderer.invoke('pulls:list-category', category),
    listViewerPullRequests: () => ipcRenderer.invoke('pulls:list-viewer'),
    listRepositoryPullRequests: (owner: string, repo: string) =>
      ipcRenderer.invoke('pulls:list-repository', owner, repo),
    searchRepositoryPullRequests: (options: unknown) =>
      ipcRenderer.invoke('pulls:search-repository', options),
    getPullRequestDetail: (owner: string, repo: string, number: number) =>
      ipcRenderer.invoke('pulls:get-detail', owner, repo, number),
    createPullRequestComment: (owner: string, repo: string, number: number, body: string) =>
      ipcRenderer.invoke('pulls:create-comment', owner, repo, number, body)
  },
  repositories: {
    getViewerState: (owner: string, repo: string) =>
      ipcRenderer.invoke('repositories:get-viewer-state', owner, repo),
    getOverview: (owner: string, repo: string) =>
      ipcRenderer.invoke('repositories:get-overview', owner, repo),
    listFiles: (owner: string, repo: string, ref?: string | null) =>
      ipcRenderer.invoke('repositories:list-files', owner, repo, ref),
    getFilePreview: (owner: string, repo: string, path: string, ref?: string | null) =>
      ipcRenderer.invoke('repositories:get-file-preview', owner, repo, path, ref),
    setStarred: (owner: string, repo: string, starred: boolean) =>
      ipcRenderer.invoke('repositories:set-starred', owner, repo, starred),
    setWatching: (owner: string, repo: string, watching: boolean) =>
      ipcRenderer.invoke('repositories:set-watching', owner, repo, watching)
  },
  search: {
    resolveGoto: (input: string) => ipcRenderer.invoke('search:resolve-goto', input),
    resolveRepositoryReference: (options: unknown) =>
      ipcRenderer.invoke('search:resolve-repository-reference', options),
    searchWorkspace: (options: unknown) => ipcRenderer.invoke('search:workspace', options)
  },
  auth: {
    get: () => ipcRenderer.invoke('auth:get'),
    startDeviceFlow: async (onStarted?: (details: unknown) => void) => {
      const details = await ipcRenderer.invoke('auth:start-device-flow')
      onStarted?.(details)
      return ipcRenderer.invoke('auth:complete-device-flow', details.sessionId)
    },
    copyCodeAndOpenDeviceFlow: (sessionId: string) =>
      ipcRenderer.invoke('auth:copy-code-and-open-device-flow', sessionId),
    savePersonalToken: (token: string) => ipcRenderer.invoke('auth:save-personal-token', token),
    logout: () => ipcRenderer.invoke('auth:logout')
  },
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    update: (patch: unknown) => ipcRenderer.invoke('config:update', patch)
  },
  bookmarks: {
    get: () => ipcRenderer.invoke('bookmarks:get'),
    update: (payload: unknown) => ipcRenderer.invoke('bookmarks:update', payload)
  },
  links: {
    openGitHubUrl: (url: string) => ipcRenderer.invoke('links:open-github-url', url)
  },
  windowControls: {
    getState: () => ipcRenderer.invoke('window:get-state'),
    onFullscreenChange: (listener: (state: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, state: unknown): void => {
        listener(state)
      }

      ipcRenderer.on('window:fullscreen-change', handler)

      return () => {
        ipcRenderer.removeListener('window:fullscreen-change', handler)
      }
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('ohMyGithub', api)
  } catch (error) {
    console.error(error)
  }
} else {
  Object.assign(window, { electron: electronAPI, ohMyGithub: api })
}
