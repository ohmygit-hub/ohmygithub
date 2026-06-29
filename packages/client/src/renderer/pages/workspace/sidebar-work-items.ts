import type { Component } from 'vue'
import type {
  WorkspaceSidebarTreeItem,
  WorkspaceSidebarWorkItemIconTone,
  WorkspaceSidebarWorkItemReference,
} from './types'
import {
  AtSign,
  CircleCheck,
  CircleDot,
  CircleSlash,
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
  GitPullRequestDraft,
  Inbox,
  UserRound,
} from 'lucide-vue-next'

export const PULL_REQUEST_CATEGORIES: readonly GitHubPullRequestCategory[] = [
  'created-by-me',
  'needs-review',
  'inbox',
  'mentioned-me',
]

export const ISSUE_CATEGORIES: readonly GitHubIssueCategory[] = [
  'created-by-me',
  'inbox',
  'mentioned-me',
]

type FoundRepositoryReference = Extract<GitHubRepositoryReferenceResolution, { status: 'found' }>

interface WorkItemTreeItemOptions {
  actionContext?: WorkspaceSidebarTreeItem['actionContext']
  activeItemId: string | null
  activeUrl: string
  fallbackLabel?: string
  id?: string
  scope?: string
}

type SidebarWorkItem =
  | {
      type: 'pull-request'
      owner: string
      repo: string
      repository: string
      number: number
      title: string
      state: GitHubPullRequestState
      ciState?: GitHubCiState | null
      hasUpdates?: boolean
    }
  | {
      type: 'issue'
      owner: string
      repo: string
      repository: string
      number: number
      title: string
      state: GitHubIssueState
      hasUpdates?: boolean
    }

export function pullRequestCategoryUrl(category: GitHubPullRequestCategory): string {
  return `/pull-requests/${category}`
}

export function issueCategoryUrl(category: GitHubIssueCategory): string {
  return `/issues/${category}`
}

export function pullRequestCategoryToTreeItem(
  category: GitHubPullRequestCategory,
  label: string,
  activeItemId: string | null,
  activeUrl: string,
): WorkspaceSidebarTreeItem {
  const url = pullRequestCategoryUrl(category)
  const id = `pull-request-category:${category}`

  return {
    id,
    label,
    url,
    actionContext: {
      kind: 'group',
      githubUrl: null,
    },
    icon: pullRequestCategoryIcon(category),
    isActive: isActiveItem(id, url, activeItemId, activeUrl),
    canExpand: true,
    childrenLoader: {
      type: 'pull-request-category',
      pullRequestCategory: category,
      scope: id,
    },
  }
}

export function issueCategoryToTreeItem(
  category: GitHubIssueCategory,
  label: string,
  activeItemId: string | null,
  activeUrl: string,
): WorkspaceSidebarTreeItem {
  const url = issueCategoryUrl(category)
  const id = `issue-category:${category}`

  return {
    id,
    label,
    url,
    actionContext: {
      kind: 'group',
      githubUrl: null,
    },
    icon: issueCategoryIcon(category),
    isActive: isActiveItem(id, url, activeItemId, activeUrl),
    canExpand: true,
    childrenLoader: {
      type: 'issue-category',
      issueCategory: category,
      scope: id,
    },
  }
}

export function pullRequestUrl(pullRequest: Pick<GitHubPullRequest, 'number' | 'owner' | 'repo'>): string {
  return `/${pullRequest.owner}/${pullRequest.repo}/pull/${pullRequest.number}`
}

export function issueUrl(issue: Pick<GitHubIssue, 'number' | 'owner' | 'repo'>): string {
  return `/${issue.owner}/${issue.repo}/issues/${issue.number}`
}

export function pullRequestToTreeItem(
  pullRequest: GitHubPullRequest,
  activeUrl: string,
  activeItemId: string | null,
  scope?: string,
): WorkspaceSidebarTreeItem {
  return workItemToTreeItem(
    {
      type: 'pull-request',
      owner: pullRequest.owner,
      repo: pullRequest.repo,
      repository: pullRequest.repository,
      number: pullRequest.number,
      title: pullRequest.title,
      state: pullRequest.state,
      ciState: pullRequest.ciState,
      hasUpdates: pullRequest.hasUpdates,
    },
    { activeItemId, activeUrl, scope },
  )
}

export function issueToTreeItem(
  issue: GitHubIssue,
  activeUrl: string,
  activeItemId: string | null,
  scope?: string,
): WorkspaceSidebarTreeItem {
  return workItemToTreeItem(
    {
      type: 'issue',
      owner: issue.owner,
      repo: issue.repo,
      repository: issue.repository,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      hasUpdates: issue.hasUpdates,
    },
    { activeItemId, activeUrl, scope },
  )
}

export function workItemReferenceToTreeItem(
  reference: WorkspaceSidebarWorkItemReference,
  options: WorkItemTreeItemOptions,
): WorkspaceSidebarTreeItem {
  const repository = `${reference.owner}/${reference.repo}`
  const item = workItemToTreeItem(
    reference.kind === 'pull-request'
      ? {
          type: 'pull-request',
          owner: reference.owner,
          repo: reference.repo,
          repository,
          number: reference.number,
          title: '',
          state: 'open',
          ciState: null,
          hasUpdates: false,
        }
      : {
          type: 'issue',
          owner: reference.owner,
          repo: reference.repo,
          repository,
          number: reference.number,
          title: '',
          state: 'open',
          hasUpdates: false,
        },
    options,
  )

  return {
    ...item,
    label: options.fallbackLabel?.trim() || item.label,
    workItemReference: reference,
  }
}

export function resolvedReferenceToTreeItem(
  reference: FoundRepositoryReference,
  options: WorkItemTreeItemOptions,
): WorkspaceSidebarTreeItem {
  return workItemToTreeItem(
    reference.kind === 'pull-request'
      ? {
          type: 'pull-request',
          owner: reference.owner,
          repo: reference.repo,
          repository: reference.repository,
          number: reference.number,
          title: reference.title,
          state: reference.state as GitHubPullRequestState,
          ciState: null,
          hasUpdates: false,
        }
      : {
          type: 'issue',
          owner: reference.owner,
          repo: reference.repo,
          repository: reference.repository,
          number: reference.number,
          title: reference.title,
          state: reference.state as GitHubIssueState,
          hasUpdates: false,
        },
    options,
  )
}

function workItemToTreeItem(
  workItem: SidebarWorkItem,
  options: WorkItemTreeItemOptions,
): WorkspaceSidebarTreeItem {
  const url = workItem.type === 'pull-request'
    ? pullRequestUrl(workItem)
    : issueUrl(workItem)
  const id = options.id ?? scopedId(options.scope, `${workItem.type}:${workItem.repository}:${workItem.number}`)
  const title = workItem.title.trim()
  const label = title ? `#${workItem.number} ${title}` : `#${workItem.number}`

  return {
    id,
    label,
    url,
    actionContext: options.actionContext ?? workItemActionContext(workItem),
    icon: workItem.type === 'pull-request'
      ? pullRequestIcon(workItem.state)
      : issueIcon(workItem.state),
    isActive: isActiveItem(id, url, options.activeItemId, options.activeUrl),
    workItem: workItem.type === 'pull-request'
      ? {
          type: 'pull-request',
          state: workItem.state,
          iconTone: pullRequestIconTone(workItem.state),
          ciState: workItem.ciState ?? null,
          hasUpdates: workItem.hasUpdates ?? false,
        }
      : {
          type: 'issue',
          state: workItem.state,
          iconTone: issueIconTone(workItem.state),
          hasUpdates: workItem.hasUpdates ?? false,
        },
  }
}

function pullRequestCategoryIcon(category: GitHubPullRequestCategory): Component {
  if (category === 'created-by-me') return UserRound
  if (category === 'inbox') return Inbox
  if (category === 'mentioned-me') return AtSign

  return GitPullRequest
}

function issueCategoryIcon(category: GitHubIssueCategory): Component {
  if (category === 'created-by-me') return UserRound
  if (category === 'inbox') return Inbox
  if (category === 'mentioned-me') return AtSign

  return CircleDot
}

function pullRequestIcon(state: GitHubPullRequestState): Component {
  if (state === 'draft') return GitPullRequestDraft
  if (state === 'merged') return GitMerge
  if (state === 'closed') return GitPullRequestClosed

  return GitPullRequest
}

function pullRequestIconTone(state: GitHubPullRequestState): WorkspaceSidebarWorkItemIconTone {
  if (state === 'draft') return 'muted'
  if (state === 'merged') return 'merged'
  if (state === 'closed') return 'destructive'

  return 'success'
}

function scopedId(scope: string | undefined, id: string): string {
  return scope ? `${scope}:${id}` : id
}

function workItemActionContext(workItem: SidebarWorkItem): WorkspaceSidebarTreeItem['actionContext'] {
  const githubUrl = workItem.type === 'pull-request'
    ? `https://github.com/${encodeURIComponent(workItem.owner)}/${encodeURIComponent(workItem.repo)}/pull/${workItem.number}`
    : `https://github.com/${encodeURIComponent(workItem.owner)}/${encodeURIComponent(workItem.repo)}/issues/${workItem.number}`

  return workItem.type === 'pull-request'
    ? {
        kind: 'pull-request',
        owner: workItem.owner,
        repo: workItem.repo,
        number: workItem.number,
        githubUrl,
      }
    : {
        kind: 'issue',
        owner: workItem.owner,
        repo: workItem.repo,
        number: workItem.number,
        githubUrl,
      }
}

function isActiveItem(
  itemId: string,
  url: string,
  activeItemId: string | null,
  activeUrl: string,
): boolean {
  return activeItemId ? activeItemId === itemId : activeUrl === url
}

function issueIcon(state: GitHubIssueState): Component {
  if (state === 'completed') return CircleCheck
  if (state === 'not_planned') return CircleSlash

  return CircleDot
}

function issueIconTone(state: GitHubIssueState): WorkspaceSidebarWorkItemIconTone {
  if (state === 'completed') return 'merged'
  if (state === 'not_planned') return 'muted'

  return 'success'
}
