import type { WorkspaceBookmark, WorkspaceSidebarTreeItem } from './types'
import {
  Book,
  Building2,
  CircleDot,
  GitPullRequest,
} from 'lucide-vue-next'
import { workItemReferenceToTreeItem } from './sidebar-work-items'
import { getWorkspaceTabView } from './tab-presentation'
import { createRepositoryWorkspaceUrl } from './workspace-url'

export interface WorkspaceSidebarTreeLabels {
  issues: string
  pullRequests: string
}

interface TreeItemContext {
  activeItemId: string | null
  activeUrl: string
  labels: WorkspaceSidebarTreeLabels
  scope: string
}

interface RepositoryLike {
  name: string
  nameWithOwner: string
  owner: string
}

interface RepositoryTreeItemOptions extends TreeItemContext {
  id?: string
  label?: string
  url?: string
}

export function organizationUrl(login: string): string {
  return `/${login}?type=org`
}

export function organizationFallback(login: string): string {
  return login.slice(0, 1).toUpperCase()
}

export function organizationToTreeItem(
  organization: GitHubOrganization,
  context: TreeItemContext,
): WorkspaceSidebarTreeItem {
  const url = organizationUrl(organization.login)
  const itemId = scopedId(context.scope, `org:${organization.login}`)

  return {
    id: itemId,
    label: organization.login,
    url,
    avatarUrl: organization.avatarUrl,
    avatarFallback: organizationFallback(organization.login),
    isActive: isActiveItem(itemId, url, context),
    canExpand: true,
    childrenLoader: {
      type: 'organization-repositories',
      owner: organization.login,
      scope: itemId,
    },
  }
}

export function bookmarkToTreeItem(
  bookmark: WorkspaceBookmark,
  context: Omit<TreeItemContext, 'scope'>,
): WorkspaceSidebarTreeItem {
  if (bookmark.type === 'org' && bookmark.owner) {
    const itemId = bookmarkItemId(bookmark)

    return {
      id: itemId,
      label: bookmark.title,
      url: bookmark.url,
      icon: bookmark.avatarUrl ? undefined : Building2,
      avatarUrl: bookmark.avatarUrl,
      avatarFallback: bookmark.avatarFallback ?? organizationFallback(bookmark.owner),
      isActive: isActiveItem(itemId, bookmark.url, context),
      canExpand: true,
      childrenLoader: {
        type: 'organization-repositories',
        owner: bookmark.owner,
        scope: itemId,
      },
    }
  }

  if (bookmark.type === 'repo' && bookmark.owner && bookmark.repo) {
    return repositoryToTreeItem(
      {
        name: bookmark.repo,
        nameWithOwner: `${bookmark.owner}/${bookmark.repo}`,
        owner: bookmark.owner,
      },
      {
        ...context,
        id: bookmarkItemId(bookmark),
        label: bookmark.title,
        scope: bookmarkItemId(bookmark),
        url: bookmark.url,
      },
    )
  }

  if (isBookmarkWorkItem(bookmark)) {
    return workItemReferenceToTreeItem(
      {
        kind: bookmark.type === 'pull-request' ? 'pull-request' : 'issue',
        owner: bookmark.owner,
        repo: bookmark.repo,
        number: bookmark.number,
      },
      {
        ...context,
        id: bookmarkItemId(bookmark),
        fallbackLabel: bookmark.title,
      },
    )
  }

  const view = getWorkspaceTabView(bookmark)

  return {
    id: bookmarkItemId(bookmark),
    label: bookmark.title,
    url: bookmark.url,
    icon: bookmark.avatarUrl ? undefined : view.icon,
    avatarUrl: bookmark.avatarUrl,
    avatarFallback: bookmark.avatarFallback,
    isActive: isActiveItem(bookmarkItemId(bookmark), bookmark.url, context),
  }
}

export function repositoryToTreeItem(
  repository: RepositoryLike,
  options: RepositoryTreeItemOptions,
): WorkspaceSidebarTreeItem {
  const url = options.url ?? repositoryUrl(repository.owner, repository.name)
  const itemId = options.id ?? scopedId(options.scope, `repo:${repository.nameWithOwner}`)

  return {
    id: itemId,
    label: options.label ?? repository.name,
    url,
    icon: Book,
    isActive: isActiveItem(itemId, url, options),
    children: createRepositoryChildren({
      activeItemId: options.activeItemId,
      activeUrl: options.activeUrl,
      labels: options.labels,
      nameWithOwner: repository.nameWithOwner,
      owner: repository.owner,
      repo: repository.name,
      scope: itemId,
    }),
  }
}

function createRepositoryChildren(options: {
  activeItemId: string | null
  activeUrl: string
  labels: WorkspaceSidebarTreeLabels
  nameWithOwner: string
  owner: string
  repo: string
  scope: string
}): WorkspaceSidebarTreeItem[] {
  const pullRequestsItemId = scopedId(options.scope, `repo-pull-requests:${options.nameWithOwner}`)
  const pullRequestsUrl = createRepositoryWorkspaceUrl(options.owner, options.repo, 'pullRequests')
  const issuesItemId = scopedId(options.scope, `repo-issues:${options.nameWithOwner}`)
  const issuesUrl = createRepositoryWorkspaceUrl(options.owner, options.repo, 'issues')

  return [
    {
      id: pullRequestsItemId,
      label: options.labels.pullRequests,
      url: pullRequestsUrl,
      icon: GitPullRequest,
      isActive: isActiveItem(pullRequestsItemId, pullRequestsUrl, options),
      canExpand: true,
      childrenLoader: {
        type: 'repository-pull-requests',
        owner: options.owner,
        repo: options.repo,
        scope: pullRequestsItemId,
      },
    },
    {
      id: issuesItemId,
      label: options.labels.issues,
      url: issuesUrl,
      icon: CircleDot,
      isActive: isActiveItem(issuesItemId, issuesUrl, options),
      canExpand: true,
      childrenLoader: {
        type: 'repository-issues',
        owner: options.owner,
        repo: options.repo,
        scope: issuesItemId,
      },
    },
  ]
}

function bookmarkItemId(bookmark: WorkspaceBookmark): string {
  return `bookmark:${bookmark.id}`
}

function isBookmarkWorkItem(
  bookmark: WorkspaceBookmark,
): bookmark is WorkspaceBookmark & {
  owner: string
  repo: string
  number: number
  type: 'issue' | 'pull-request'
} {
  const number = bookmark.number

  return (bookmark.type === 'issue' || bookmark.type === 'pull-request')
    && Boolean(bookmark.owner)
    && Boolean(bookmark.repo)
    && typeof number === 'number'
    && Number.isInteger(number)
    && number > 0
}

function repositoryUrl(owner: string, repo: string): string {
  return `/${owner}/${repo}`
}

function scopedId(scope: string, id: string): string {
  return `${scope}:${id}`
}

function isActiveItem(
  itemId: string,
  url: string,
  context: { activeItemId: string | null; activeUrl: string },
): boolean {
  if (context.activeUrl === url) return true
  if (context.activeItemId) return context.activeItemId === itemId

  return isBaseRepositoryUrlForActiveTab(context.activeUrl, url)
}

function isBaseRepositoryUrlForActiveTab(activeUrl: string, url: string): boolean {
  const [activePath, activeQuery = ''] = activeUrl.split('?')
  const [path, query = ''] = url.split('?')
  const tab = new URLSearchParams(activeQuery).get('tab')

  return !query
    && activePath === path
    && Boolean(tab)
    && tab !== 'pull-requests'
    && tab !== 'issues'
}
