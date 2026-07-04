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
    listFollowers: (login: string) => ipcRenderer.invoke('accounts:list-followers', login),
    listFollowing: (login: string) => ipcRenderer.invoke('accounts:list-following', login),
    getSponsorsSummary: (login: string) => ipcRenderer.invoke('accounts:get-sponsors-summary', login),
    listSponsorships: (options: unknown) => ipcRenderer.invoke('accounts:list-sponsorships', options),
    listOrganizations: () => ipcRenderer.invoke('accounts:list-organizations'),
    listOrganizationRepositories: (owner: string) =>
      ipcRenderer.invoke('accounts:list-organization-repositories', owner)
  },
  organizationPeople: {
    getPeople: (org: string) => ipcRenderer.invoke('organization-people:get', org),
    listInvitations: (org: string) => ipcRenderer.invoke('organization-people:list-invitations', org),
    inviteMember: (options: unknown) => ipcRenderer.invoke('organization-people:invite', options),
    setMemberRole: (options: unknown) => ipcRenderer.invoke('organization-people:set-role', options),
    removeMember: (options: unknown) => ipcRenderer.invoke('organization-people:remove-member', options),
    cancelInvitation: (options: unknown) => ipcRenderer.invoke('organization-people:cancel-invitation', options),
    setMembershipVisibility: (options: unknown) => ipcRenderer.invoke('organization-people:set-visibility', options)
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
    getWorkflowJobLog: (owner: string, repo: string, jobId: number, job?: unknown) =>
      ipcRenderer.invoke('actions:get-job-log', owner, repo, jobId, job),
    rerunWorkflowRun: (owner: string, repo: string, runId: number) =>
      ipcRenderer.invoke('actions:rerun-run', owner, repo, runId),
    rerunFailedWorkflowRunJobs: (owner: string, repo: string, runId: number) =>
      ipcRenderer.invoke('actions:rerun-failed-run-jobs', owner, repo, runId),
    rerunWorkflowJob: (owner: string, repo: string, jobId: number) =>
      ipcRenderer.invoke('actions:rerun-job', owner, repo, jobId),
    dispatchWorkflow: (owner: string, repo: string, workflowId: number, ref: string) =>
      ipcRenderer.invoke('actions:dispatch-workflow', owner, repo, workflowId, ref)
  },
  deployments: {
    listEnvironments: (options: unknown) =>
      ipcRenderer.invoke('deployments:list-environments', options),
    listDeployments: (options: unknown) =>
      ipcRenderer.invoke('deployments:list-deployments', options),
    listStatuses: (options: unknown) =>
      ipcRenderer.invoke('deployments:list-statuses', options),
    markInactive: (options: unknown) =>
      ipcRenderer.invoke('deployments:mark-inactive', options),
    deleteDeployment: (options: unknown) =>
      ipcRenderer.invoke('deployments:delete-deployment', options),
    deleteEnvironment: (options: unknown) =>
      ipcRenderer.invoke('deployments:delete-environment', options)
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
      ipcRenderer.invoke('issues:delete', issueId),
    setReaction: (subjectId: string, content: string, reacted: boolean) =>
      ipcRenderer.invoke('issues:set-reaction', subjectId, content, reacted)
  },
  packages: {
    listPackages: (options: unknown) =>
      ipcRenderer.invoke('packages:list-packages', options),
    listVersions: (options: unknown) =>
      ipcRenderer.invoke('packages:list-versions', options),
    deletePackage: (options: unknown) =>
      ipcRenderer.invoke('packages:delete-package', options),
    deleteVersion: (options: unknown) =>
      ipcRenderer.invoke('packages:delete-version', options),
    restorePackage: (options: unknown) =>
      ipcRenderer.invoke('packages:restore-package', options),
    restoreVersion: (options: unknown) =>
      ipcRenderer.invoke('packages:restore-version', options)
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
      ipcRenderer.invoke('pulls:create-comment', owner, repo, number, body),
    updatePullRequest: (owner: string, repo: string, number: number, changes: unknown) =>
      ipcRenderer.invoke('pulls:update', owner, repo, number, changes),
    closePullRequest: (owner: string, repo: string, number: number) =>
      ipcRenderer.invoke('pulls:close', owner, repo, number),
    requestPullRequestReviewers: (owner: string, repo: string, number: number, reviewers: string[], removeReviewers: string[]) =>
      ipcRenderer.invoke('pulls:request-reviewers', owner, repo, number, reviewers, removeReviewers),
    markPullRequestReadyForReview: (owner: string, repo: string, number: number, id: string) =>
      ipcRenderer.invoke('pulls:mark-ready-for-review', owner, repo, number, id),
    mergePullRequest: (owner: string, repo: string, number: number, options: unknown) =>
      ipcRenderer.invoke('pulls:merge', owner, repo, number, options),
    updatePullRequestComment: (owner: string, repo: string, commentId: string | number, body: string) =>
      ipcRenderer.invoke('pulls:update-comment', owner, repo, commentId, body),
    listPullRequestFiles: (owner: string, repo: string, number: number) =>
      ipcRenderer.invoke('pulls:list-files', owner, repo, number),
    listPullRequestCommits: (owner: string, repo: string, number: number, page?: number, perPage?: number) =>
      ipcRenderer.invoke('pulls:list-commits', owner, repo, number, page, perPage),
    submitPullRequestReview: (owner: string, repo: string, number: number, options: unknown) =>
      ipcRenderer.invoke('pulls:submit-review', owner, repo, number, options)
  },
  inbox: {
    listNotifications: (options?: { all?: boolean, participating?: boolean, limit?: number }) =>
      ipcRenderer.invoke('inbox:list-notifications', options),
    markThreadAsRead: (threadId: string) => ipcRenderer.invoke('inbox:mark-thread-read', threadId),
    markAllAsRead: () => ipcRenderer.invoke('inbox:mark-all-read'),
    markThreadAsDone: (threadId: string) => ipcRenderer.invoke('inbox:mark-thread-done', threadId),
    unsubscribe: (threadId: string) => ipcRenderer.invoke('inbox:unsubscribe', threadId),
  },
  releases: {
    listRepositoryReleases: (options: unknown) =>
      ipcRenderer.invoke('releases:list', options),
    createRelease: (options: unknown) =>
      ipcRenderer.invoke('releases:create', options),
    updateRelease: (owner: string, repo: string, releaseId: number, changes: unknown) =>
      ipcRenderer.invoke('releases:update', owner, repo, releaseId, changes),
    deleteRelease: (owner: string, repo: string, releaseId: number) =>
      ipcRenderer.invoke('releases:delete', owner, repo, releaseId)
  },
  repositories: {
    getViewerState: (owner: string, repo: string) =>
      ipcRenderer.invoke('repositories:get-viewer-state', owner, repo),
    getNavigationCounts: (owner: string, repo: string) =>
      ipcRenderer.invoke('repositories:get-navigation-counts', owner, repo),
    getOverview: (owner: string, repo: string) =>
      ipcRenderer.invoke('repositories:get-overview', owner, repo),
    getContributorStats: (owner: string, repo: string) =>
      ipcRenderer.invoke('repositories:get-contributor-stats', owner, repo),
    listContributors: (owner: string, repo: string, perPage?: number) =>
      ipcRenderer.invoke('repositories:list-contributors', owner, repo, perPage),
    listStargazers: (owner: string, repo: string) =>
      ipcRenderer.invoke('repositories:list-stargazers', owner, repo),
    listWatchers: (owner: string, repo: string) =>
      ipcRenderer.invoke('repositories:list-watchers', owner, repo),
    listForks: (owner: string, repo: string) =>
      ipcRenderer.invoke('repositories:list-forks', owner, repo),
    listFiles: (owner: string, repo: string, ref?: string | null) =>
      ipcRenderer.invoke('repositories:list-files', owner, repo, ref),
    listCommits: (owner: string, repo: string, ref?: string | null, page?: number, perPage?: number) =>
      ipcRenderer.invoke('repositories:list-commits', owner, repo, ref, page, perPage),
    listBranches: (owner: string, repo: string) =>
      ipcRenderer.invoke('repositories:list-branches', owner, repo),
    listBranchesDetailed: (owner: string, repo: string, options?: unknown) =>
      ipcRenderer.invoke('repositories:list-branches-detailed', owner, repo, options),
    listTags: (owner: string, repo: string, options?: unknown) =>
      ipcRenderer.invoke('repositories:list-tags', owner, repo, options),
    createBranch: (owner: string, repo: string, name: string, fromRef: string) =>
      ipcRenderer.invoke('repositories:create-branch', owner, repo, name, fromRef),
    renameBranch: (owner: string, repo: string, name: string, newName: string) =>
      ipcRenderer.invoke('repositories:rename-branch', owner, repo, name, newName),
    deleteBranch: (owner: string, repo: string, name: string) =>
      ipcRenderer.invoke('repositories:delete-branch', owner, repo, name),
    createTag: (owner: string, repo: string, name: string, fromRef: string, message?: string | null) =>
      ipcRenderer.invoke('repositories:create-tag', owner, repo, name, fromRef, message),
    deleteTag: (owner: string, repo: string, name: string) =>
      ipcRenderer.invoke('repositories:delete-tag', owner, repo, name),
    getCommit: (owner: string, repo: string, sha: string) =>
      ipcRenderer.invoke('repositories:get-commit', owner, repo, sha),
    getFilePreview: (owner: string, repo: string, path: string, ref?: string | null) =>
      ipcRenderer.invoke('repositories:get-file-preview', owner, repo, path, ref),
    setStarred: (owner: string, repo: string, starred: boolean) =>
      ipcRenderer.invoke('repositories:set-starred', owner, repo, starred),
    setSubscription: (owner: string, repo: string, subscription: string) =>
      ipcRenderer.invoke('repositories:set-subscription', owner, repo, subscription),
    fork: (owner: string, repo: string, options?: unknown) =>
      ipcRenderer.invoke('repositories:fork', owner, repo, options),
    create: (options: unknown) => ipcRenderer.invoke('repositories:create', options),
    listGitignoreTemplates: () => ipcRenderer.invoke('repositories:list-gitignore-templates'),
    listLicenses: () => ipcRenderer.invoke('repositories:list-licenses')
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
  userSettings: {
    getProfile: () => ipcRenderer.invoke('user-settings:get-profile'),
    updateProfile: (input: unknown) => ipcRenderer.invoke('user-settings:update-profile', input),
    listSocialAccounts: () => ipcRenderer.invoke('user-settings:list-social-accounts'),
    addSocialAccounts: (urls: string[]) => ipcRenderer.invoke('user-settings:add-social-accounts', urls),
    deleteSocialAccounts: (urls: string[]) =>
      ipcRenderer.invoke('user-settings:delete-social-accounts', urls),
    listEmails: () => ipcRenderer.invoke('user-settings:list-emails'),
    addEmail: (email: string) => ipcRenderer.invoke('user-settings:add-email', email),
    deleteEmail: (email: string) => ipcRenderer.invoke('user-settings:delete-email', email),
    setPrimaryEmailVisibility: (visibility: string) =>
      ipcRenderer.invoke('user-settings:set-primary-email-visibility', visibility),
    listSshKeys: () => ipcRenderer.invoke('user-settings:list-ssh-keys'),
    addSshKey: (title: string, key: string) =>
      ipcRenderer.invoke('user-settings:add-ssh-key', title, key),
    deleteSshKey: (keyId: number) => ipcRenderer.invoke('user-settings:delete-ssh-key', keyId),
    listGpgKeys: () => ipcRenderer.invoke('user-settings:list-gpg-keys'),
    addGpgKey: (key: string, name?: string) =>
      ipcRenderer.invoke('user-settings:add-gpg-key', key, name),
    deleteGpgKey: (keyId: number) => ipcRenderer.invoke('user-settings:delete-gpg-key', keyId),
    listSshSigningKeys: () => ipcRenderer.invoke('user-settings:list-ssh-signing-keys'),
    addSshSigningKey: (title: string, key: string) =>
      ipcRenderer.invoke('user-settings:add-ssh-signing-key', title, key),
    deleteSshSigningKey: (keyId: number) =>
      ipcRenderer.invoke('user-settings:delete-ssh-signing-key', keyId),
    listBlockedUsers: () => ipcRenderer.invoke('user-settings:list-blocked-users'),
    blockUser: (username: string) => ipcRenderer.invoke('user-settings:block-user', username),
    unblockUser: (username: string) => ipcRenderer.invoke('user-settings:unblock-user', username),
    getInteractionLimits: () => ipcRenderer.invoke('user-settings:get-interaction-limits'),
    setInteractionLimits: (limit: string, expiry?: string) =>
      ipcRenderer.invoke('user-settings:set-interaction-limits', limit, expiry),
    clearInteractionLimits: () => ipcRenderer.invoke('user-settings:clear-interaction-limits'),
    listOrganizationMemberships: () =>
      ipcRenderer.invoke('user-settings:list-organization-memberships'),
    acceptOrganizationInvitation: (org: string) =>
      ipcRenderer.invoke('user-settings:accept-organization-invitation', org),
    setOrganizationMembershipVisibility: (org: string, isPublic: boolean) =>
      ipcRenderer.invoke('user-settings:set-organization-membership-visibility', org, isPublic),
    listCodespacesSecrets: () => ipcRenderer.invoke('user-settings:list-codespaces-secrets'),
    upsertCodespacesSecret: (input: unknown) =>
      ipcRenderer.invoke('user-settings:upsert-codespaces-secret', input),
    deleteCodespacesSecret: (name: string) =>
      ipcRenderer.invoke('user-settings:delete-codespaces-secret', name),
    listSavedReplies: () => ipcRenderer.invoke('user-settings:list-saved-replies')
  },
  links: {
    openGitHubUrl: (url: string) => ipcRenderer.invoke('links:open-github-url', url),
    openExternalUrl: (url: string) => ipcRenderer.invoke('links:open-external-url', url)
  },
  updates: {
    getInfo: () => ipcRenderer.invoke('app:get-info'),
    getState: () => ipcRenderer.invoke('updates:get-state'),
    checkForUpdate: () => ipcRenderer.invoke('updates:check'),
    downloadUpdate: () => ipcRenderer.invoke('updates:download'),
    installUpdate: () => ipcRenderer.invoke('updates:install'),
    onStatusChange: (listener: (state: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, state: unknown): void => {
        listener(state)
      }

      ipcRenderer.on('updates:state-change', handler)

      return () => {
        ipcRenderer.removeListener('updates:state-change', handler)
      }
    }
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
