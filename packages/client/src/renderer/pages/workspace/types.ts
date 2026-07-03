import type { Component } from 'vue'

export type WorkspaceMessageParams = Record<string, string | number>

export type RepositoryTabId =
  | 'overview'
  | 'files'
  | 'commits'
  | 'branches'
  | 'pullRequests'
  | 'issues'
  | 'actions'
  | 'releases'
  | 'contributors'
  | 'packages'
  | 'deployments'
  | 'settings'

export type AccountTabId =
  | 'overview'
  | 'repositories'
  | 'stars'

export type WorkspaceTabType =
  | 'inbox'
  | 'reviews'
  | 'activity'
  | 'account'
  | 'repo'
  | 'pull-request-list'
  | 'issue-list'
  | 'pull-request'
  | 'issue'
  | 'action-run'
  | 'commit'
  | 'search-result'
  | 'not-found'

export interface WorkspacePanelStat {
  id: string
  labelKey: string
  value?: string
  valueKey?: string
}

export interface WorkspacePanelBlock {
  id: string
  titleKey: string
  descriptionKey: string
  metaKey: string
}

export interface WorkspaceTab {
  url: string
  type: WorkspaceTabType
  title: string
  owner?: string
  repo?: string
  number?: number
  runId?: number
  jobId?: number
  commitSha?: string
  accountSection?: AccountTabId
  repositorySection?: RepositoryTabId
  pullRequestCategory?: GitHubPullRequestCategory
  issueCategory?: GitHubIssueCategory
  searchMode?: GitHubWorkspaceSearchMode
  searchQuery?: string
  notFoundInput?: string
}

export interface WorkspaceBookmarkFolder {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface WorkspaceBookmark {
  id: string
  url: string
  type: WorkspaceTabType
  title: string
  folderId: string | null
  owner?: string
  repo?: string
  number?: number
  runId?: number
  jobId?: number
  commitSha?: string
  accountSection?: AccountTabId
  repositorySection?: RepositoryTabId
  pullRequestCategory?: GitHubPullRequestCategory
  issueCategory?: GitHubIssueCategory
  searchMode?: GitHubWorkspaceSearchMode
  searchQuery?: string
  notFoundInput?: string
  avatarUrl?: string
  avatarFallback?: string
}

export interface WorkspaceSidebarTreeItemLoader {
  type:
    | 'account-repositories'
    | 'organization-repositories'
    | 'pull-request-category'
    | 'issue-category'
    | 'repository-pull-requests'
    | 'repository-issues'
  owner?: string
  repo?: string
  pullRequestCategory?: GitHubPullRequestCategory
  issueCategory?: GitHubIssueCategory
  scope?: string
}

export type WorkspaceSidebarWorkItem =
  | {
      type: 'pull-request'
      state: GitHubPullRequestState
      iconTone: WorkspaceSidebarWorkItemIconTone
      ciState: GitHubCiState | null
      hasUpdates: boolean
    }
  | {
      type: 'issue'
      state: GitHubIssueState
      iconTone: WorkspaceSidebarWorkItemIconTone
      hasUpdates: boolean
    }

export type WorkspaceSidebarWorkItemIconTone =
  | 'success'
  | 'destructive'
  | 'merged'
  | 'muted'

export interface WorkspaceSidebarWorkItemReference {
  kind: GitHubRepositoryReferenceKind
  owner: string
  repo: string
  number: number
}

export interface WorkspaceSidebarTreeItemStateText {
  emptyKey: string
  errorKey: string
}

export type WorkspaceSidebarTreeItemActionContext =
  | {
      kind: 'bookmark'
      bookmarkId: string
      bookmarkFolderId: string | null
      githubUrl: string | null
    }
  | {
      kind: 'bookmark-folder'
      folderId: string
    }
  | {
      kind: 'account'
      login: string
      githubUrl: string
    }
  | {
      kind: 'organization'
      login: string
      githubUrl: string
    }
  | {
      kind: 'repository'
      owner: string
      repo: string
      githubUrl: string
    }
  | {
      kind: 'pull-request'
      owner: string
      repo: string
      number: number
      githubUrl: string
    }
  | {
      kind: 'issue'
      owner: string
      repo: string
      number: number
      githubUrl: string
    }
  | {
      kind: 'group'
      githubUrl: string | null
    }

export type WorkspaceSidebarTreeMenuAction =
  | { type: 'open-new-tab'; item: WorkspaceSidebarTreeItem }
  | { type: 'copy-github-url'; item: WorkspaceSidebarTreeItem; url: string }
  | { type: 'open-github-url'; item: WorkspaceSidebarTreeItem; url: string }
  | { type: 'rename-bookmark'; item: WorkspaceSidebarTreeItem; bookmarkId: string }
  | { type: 'delete-bookmark'; item: WorkspaceSidebarTreeItem; bookmarkId: string }
  | { type: 'move-bookmark'; item: WorkspaceSidebarTreeItem; bookmarkId: string; folderId: string | null }
  | { type: 'open-bookmark-folder'; item: WorkspaceSidebarTreeItem; folderId: string }
  | { type: 'rename-bookmark-folder'; item: WorkspaceSidebarTreeItem; folderId: string }
  | { type: 'delete-bookmark-folder'; item: WorkspaceSidebarTreeItem; folderId: string }
  | { type: 'toggle-organization-pin'; item: WorkspaceSidebarTreeItem; login: string }

export interface WorkspaceSidebarTreeSortInput {
  listId: string
  itemIds: string[]
}

export interface WorkspaceSidebarTreeItem {
  id: string
  label: string
  url?: string
  actionContext?: WorkspaceSidebarTreeItemActionContext
  icon?: Component
  avatarUrl?: string
  avatarFallback?: string
  avatarShape?: 'circle' | 'square'
  isActive?: boolean
  canExpand?: boolean
  workItem?: WorkspaceSidebarWorkItem
  workItemReference?: WorkspaceSidebarWorkItemReference
  children?: WorkspaceSidebarTreeItem[]
  childrenLoader?: WorkspaceSidebarTreeItemLoader
}

export interface WorkspaceTabView {
  tab: WorkspaceTab
  icon: Component
  titleKey?: string
  titleParams?: WorkspaceMessageParams
  title: string
  eyebrowKey: string
  headingKey: string
  headingParams?: WorkspaceMessageParams
  descriptionKey: string
  descriptionParams?: WorkspaceMessageParams
  stats: WorkspacePanelStat[]
  blocks: WorkspacePanelBlock[]
}
