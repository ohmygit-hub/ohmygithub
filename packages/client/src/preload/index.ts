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
  actions: {
    listRepositoryWorkflows: (owner: string, repo: string) =>
      ipcRenderer.invoke('actions:list-workflows', owner, repo),
    listRepositoryWorkflowRuns: (options: unknown) =>
      ipcRenderer.invoke('actions:list-runs', options),
    getWorkflowRun: (owner: string, repo: string, runId: number) =>
      ipcRenderer.invoke('actions:get-run', owner, repo, runId),
    listWorkflowRunJobs: (options: unknown) =>
      ipcRenderer.invoke('actions:list-run-jobs', options),
    getWorkflowJobLog: (owner: string, repo: string, jobId: number) =>
      ipcRenderer.invoke('actions:get-job-log', owner, repo, jobId),
    rerunWorkflowRun: (owner: string, repo: string, runId: number) =>
      ipcRenderer.invoke('actions:rerun-run', owner, repo, runId),
    rerunFailedWorkflowRunJobs: (owner: string, repo: string, runId: number) =>
      ipcRenderer.invoke('actions:rerun-failed-run-jobs', owner, repo, runId),
    rerunWorkflowJob: (owner: string, repo: string, jobId: number) =>
      ipcRenderer.invoke('actions:rerun-job', owner, repo, jobId)
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
    createIssueComment: (owner: string, repo: string, number: number, body: string) =>
      ipcRenderer.invoke('issues:create-comment', owner, repo, number, body),
    listRepositoryLabels: (owner: string, repo: string) =>
      ipcRenderer.invoke('issues:list-repository-labels', owner, repo),
    listRepositoryMilestones: (owner: string, repo: string) =>
      ipcRenderer.invoke('issues:list-repository-milestones', owner, repo),
    listAssignableUsers: (owner: string, repo: string) =>
      ipcRenderer.invoke('issues:list-assignable-users', owner, repo),
    updateIssue: (owner: string, repo: string, number: number, changes: unknown) =>
      ipcRenderer.invoke('issues:update', owner, repo, number, changes),
    updateIssueComment: (owner: string, repo: string, commentId: string | number, body: string) =>
      ipcRenderer.invoke('issues:update-comment', owner, repo, commentId, body),
    setIssueSubscription: (subscribableId: string, subscribed: boolean) =>
      ipcRenderer.invoke('issues:set-subscription', subscribableId, subscribed),
    setIssueLock: (owner: string, repo: string, number: number, locked: boolean) =>
      ipcRenderer.invoke('issues:set-lock', owner, repo, number, locked),
    setIssuePinned: (issueId: string, pinned: boolean) =>
      ipcRenderer.invoke('issues:set-pinned', issueId, pinned),
    deleteIssue: (issueId: string) =>
      ipcRenderer.invoke('issues:delete', issueId)
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
    listCommits: (owner: string, repo: string, ref?: string | null, page?: number, perPage?: number) =>
      ipcRenderer.invoke('repositories:list-commits', owner, repo, ref, page, perPage),
    listBranches: (owner: string, repo: string) =>
      ipcRenderer.invoke('repositories:list-branches', owner, repo),
    getCommit: (owner: string, repo: string, sha: string) =>
      ipcRenderer.invoke('repositories:get-commit', owner, repo, sha),
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
