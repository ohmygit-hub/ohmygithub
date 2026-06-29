import type { Component } from 'vue'

export type WorkspaceMessageParams = Record<string, string | number>

export type RepositoryTabId =
  | 'overview'
  | 'files'
  | 'pullRequests'
  | 'issues'
  | 'actions'
  | 'settings'

export type WorkspaceTabType =
  | 'inbox'
  | 'reviews'
  | 'activity'
  | 'draft'
  | 'account'
  | 'org'
  | 'repo'
  | 'pull-request-list'
  | 'issue-list'
  | 'pull-request'
  | 'issue'
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
  draftId?: string
  number?: number
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
  draftId?: string
  number?: number
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

export interface WorkspaceSidebarTreeItem {
  id: string
  label: string
  url?: string
  icon?: Component
  avatarUrl?: string
  avatarFallback?: string
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
