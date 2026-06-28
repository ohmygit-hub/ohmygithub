import type { Component } from 'vue'
import type { WorkspaceSidebarTreeItem, WorkspaceSidebarWorkItemIconTone } from './types'
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
    icon: pullRequestCategoryIcon(category),
    isActive: isActiveItem(id, url, activeItemId, activeUrl),
    canExpand: true,
    forceExpanded: shouldForceExpand(id, activeUrl === url, activeItemId),
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
    icon: issueCategoryIcon(category),
    isActive: isActiveItem(id, url, activeItemId, activeUrl),
    canExpand: true,
    forceExpanded: shouldForceExpand(id, activeUrl === url, activeItemId),
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
  const url = pullRequestUrl(pullRequest)
  const id = scopedId(scope, `pull-request:${pullRequest.repository}:${pullRequest.number}`)

  return {
    id,
    label: `#${pullRequest.number} ${pullRequest.title}`,
    url,
    icon: pullRequestIcon(pullRequest.state),
    isActive: isActiveItem(id, url, activeItemId, activeUrl),
    workItem: {
      type: 'pull-request',
      state: pullRequest.state,
      iconTone: pullRequestIconTone(pullRequest.state),
      ciState: pullRequest.ciState,
      hasUpdates: pullRequest.hasUpdates,
    },
  }
}

export function issueToTreeItem(
  issue: GitHubIssue,
  activeUrl: string,
  activeItemId: string | null,
  scope?: string,
): WorkspaceSidebarTreeItem {
  const url = issueUrl(issue)
  const id = scopedId(scope, `issue:${issue.repository}:${issue.number}`)

  return {
    id,
    label: `#${issue.number} ${issue.title}`,
    url,
    icon: issueIcon(issue.state),
    isActive: isActiveItem(id, url, activeItemId, activeUrl),
    workItem: {
      type: 'issue',
      state: issue.state,
      iconTone: issueIconTone(issue.state),
      hasUpdates: issue.hasUpdates,
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

function isActiveItem(
  itemId: string,
  url: string,
  activeItemId: string | null,
  activeUrl: string,
): boolean {
  return activeItemId ? activeItemId === itemId : activeUrl === url
}

function shouldForceExpand(itemId: string, fallback: boolean, activeItemId: string | null): boolean {
  return activeItemId ? activeItemId.startsWith(`${itemId}:`) : fallback
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
