export type GitHubItemKind = 'notification' | 'pull_request' | 'issue' | 'action'

export type GitHubItemState = 'open' | 'closed' | 'merged' | 'failed' | 'success' | 'unread'

export interface GitHubActor {
  login: string
  avatarUrl?: string
}

export interface GitHubAuthViewer {
  id: number
  login: string
  name: string | null
  avatarUrl: string
}

export interface GitHubOrganization {
  id: number
  login: string
  avatarUrl: string
  description: string | null
}

export interface GitHubRepository {
  id: number
  name: string
  nameWithOwner: string
  owner: string
  description: string | null
  isPrivate: boolean
  updatedAt: string
  url: string
}

export type GitHubWorkspaceSearchMode = 'users' | 'orgs' | 'repos' | 'all'

export type GitHubWorkspaceSearchItemKind = 'user' | 'org' | 'repo'

export interface GitHubWorkspaceSearchItem {
  id: number
  kind: GitHubWorkspaceSearchItemKind
  title: string
  description: string | null
  url: string
  workspaceUrl: string
  avatarUrl?: string
  owner?: string
  repo?: string
  nameWithOwner?: string
  isPrivate?: boolean
  updatedAt?: string | null
}

export interface GitHubWorkspaceSearchResult {
  mode: GitHubWorkspaceSearchMode
  query: string
  items: GitHubWorkspaceSearchItem[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
  incompleteResults: boolean
}

export type GitHubWorkspaceGotoResult =
  | {
      status: 'found'
      input: string
      type: 'account' | 'org' | 'repo'
      title: string
      url: string
    }
  | {
      status: 'not_found'
      input: string
      reason: 'invalid' | 'not_found'
      url: string
    }

export interface GitHubRepositoryViewerState {
  isStarred: boolean
  isWatching: boolean
  starCount: number
}

export type GitHubRepositoryVisibility = 'public' | 'private' | 'internal'

export type GitHubRepositoryDocumentKind =
  | 'readme'
  | 'contributing'
  | 'license'
  | 'codeOfConduct'
  | 'security'
  | 'citation'
  | 'funding'
  | 'issueTemplate'
  | 'pullRequestTemplate'

export type GitHubRepositoryDocumentFormat = 'markdown' | 'text'

export interface GitHubRepositoryLanguage {
  name: string
  bytes: number
}

export interface GitHubRepositoryLicense {
  key: string
  name: string
  spdxId: string | null
  url: string | null
}

export interface GitHubRepositoryDocument {
  kind: GitHubRepositoryDocumentKind
  title: string
  path: string
  url: string | null
  format: GitHubRepositoryDocumentFormat
  content: string
}

export interface GitHubRepositoryCustomProperty {
  name: string
  value: string
}

export interface GitHubRepositoryOverviewCounts {
  stars: number
  watchers: number
  forks: number
  openIssues: number
  openPullRequests: number | null
  releases: number | null
  branches: number | null
  tags: number | null
  packages: number | null
}

export interface GitHubRepositoryOverview {
  id: number
  name: string
  nameWithOwner: string
  owner: string
  description: string | null
  homepageUrl: string | null
  url: string
  visibility: GitHubRepositoryVisibility
  isFork: boolean
  isArchived: boolean
  isTemplate: boolean
  defaultBranch: string | null
  primaryLanguage: string | null
  languages: GitHubRepositoryLanguage[]
  topics: string[]
  license: GitHubRepositoryLicense | null
  counts: GitHubRepositoryOverviewCounts
  pushedAt: string | null
  updatedAt: string | null
  documents: GitHubRepositoryDocument[]
  customProperties: GitHubRepositoryCustomProperty[]
  missingScopes: string[]
  warnings: string[]
}

export type GitHubRepositoryFileNodeType = 'tree' | 'file'

export interface GitHubRepositoryFileNode {
  type: GitHubRepositoryFileNodeType
  name: string
  path: string
  sha: string
  size: number | null
  downloadUrl: string | null
  htmlUrl: string | null
  children: GitHubRepositoryFileNode[]
}

export interface GitHubRepositoryFileTree {
  ref: string
  truncated: boolean
  items: GitHubRepositoryFileNode[]
}

export type GitHubRepositoryFilePreview =
  | {
      type: 'markdown'
      path: string
      name: string
      title: string
      content: string
      downloadUrl: string | null
      htmlUrl: string | null
    }
  | {
      type: 'code'
      path: string
      name: string
      title: string
      content: string
      language: string
      downloadUrl: string | null
      htmlUrl: string | null
    }
  | {
      type: 'image'
      path: string
      name: string
      title: string
      url: string
      downloadUrl: string | null
      htmlUrl: string | null
    }
  | {
      type: 'video'
      path: string
      name: string
      title: string
      url: string
      posterUrl: string | null
      downloadUrl: string | null
      htmlUrl: string | null
    }
  | {
      type: 'download'
      path: string
      name: string
      title: string
      description: string | null
      url: string
      downloadUrl: string | null
      htmlUrl: string | null
    }

export type GitHubCiState = 'pending' | 'success' | 'failure'

export type GitHubPullRequestState =
  | 'draft'
  | 'merged'
  | 'open'
  | 'closed'

export type GitHubPullRequestSearchState = 'open' | 'closed' | 'all'

export type GitHubIssueState =
  | 'open'
  | 'completed'
  | 'not_planned'

export type GitHubIssueSearchState = 'open' | 'closed' | 'all'

export type GitHubPullRequestCategory =
  | 'created-by-me'
  | 'needs-review'
  | 'inbox'
  | 'mentioned-me'

export type GitHubIssueCategory =
  | 'created-by-me'
  | 'inbox'
  | 'mentioned-me'

export interface GitHubPullRequest {
  id: string
  owner: string
  repo: string
  repository: string
  number: number
  title: string
  state: GitHubPullRequestState
  ciState: GitHubCiState | null
  author: GitHubActor
  updatedAt: string
  labels: string[]
  url: string
  hasUpdates: boolean
}

export interface GitHubPullRequestSearchResult {
  items: GitHubPullRequest[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
  incompleteResults: boolean
}

export interface GitHubIssue {
  id: string
  owner: string
  repo: string
  repository: string
  number: number
  title: string
  state: GitHubIssueState
  author: GitHubActor
  updatedAt: string
  labels: string[]
  url: string
  hasUpdates: boolean
}

export interface GitHubIssueSearchResult {
  items: GitHubIssue[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
  incompleteResults: boolean
}

export interface GitHubIssueReaction {
  content: string
  count: number
  viewerHasReacted?: boolean
}

export interface GitHubIssueMilestone {
  id: string
  number: number
  title: string
  description: string | null
  dueOn: string | null
  state: 'open' | 'closed'
  url: string
}

export interface GitHubIssueComment {
  id: string
  author: GitHubActor
  body: string
  createdAt: string
  updatedAt: string
  authorAssociation: string
  reactions: GitHubIssueReaction[]
  url: string
}

export type GitHubIssueTimelineEventType =
  | 'assigned'
  | 'unassigned'
  | 'labeled'
  | 'unlabeled'
  | 'closed'
  | 'reopened'
  | 'renamed'
  | 'cross-referenced'
  | 'mentioned'
  | 'generic'

export interface GitHubIssueTimelineReference {
  type: string
  repository?: string
  number?: number
  title?: string
  url?: string | null
}

export interface GitHubIssueTimelineEvent {
  id: string
  type: GitHubIssueTimelineEventType
  actor: GitHubActor
  createdAt: string
  body?: string | null
  text?: string | null
  label?: string | null
  from?: string | null
  to?: string | null
  url?: string | null
  assignee?: GitHubActor
  source?: GitHubIssueTimelineReference
}

export interface GitHubIssueDetail {
  id: string
  owner: string
  repo: string
  repository: string
  number: number
  title: string
  state: GitHubIssueState
  author: GitHubActor
  createdAt: string
  updatedAt: string
  closedAt: string | null
  body: string
  labels: string[]
  assignees: GitHubActor[]
  milestone: GitHubIssueMilestone | null
  participants: GitHubActor[]
  comments: GitHubIssueComment[]
  timelineEvents: GitHubIssueTimelineEvent[]
  reactions: GitHubIssueReaction[]
  url: string
  hasUpdates: boolean
}

export interface GitHubDeviceAuthorization {
  deviceCode: string
  userCode: string
  verificationUri: string
  verificationUriComplete?: string
  expiresIn: number
  interval: number
}

export type GitHubDeviceTokenPendingState =
  | 'authorization_pending'
  | 'slow_down'

export type GitHubDeviceTokenFailureState =
  | 'access_denied'
  | 'expired_token'
  | 'incorrect_client_credentials'
  | 'incorrect_device_code'
  | 'unknown_error'

export type GitHubDeviceTokenResult =
  | {
      status: 'success'
      accessToken: string
      tokenType: string
      scopes: string[]
    }
  | {
      status: 'pending'
      reason: GitHubDeviceTokenPendingState
      interval?: number
    }
  | {
      status: 'failure'
      reason: GitHubDeviceTokenFailureState
      description?: string
    }

export interface GitHubWorkspaceItem {
  id: string
  kind: GitHubItemKind
  title: string
  repository: string
  number?: number
  state: GitHubItemState
  author: GitHubActor
  updatedAt: string
  labels: string[]
  summary: string
  url?: string
}

export interface GitHubClient {
  listNotifications(): Promise<GitHubWorkspaceItem[]>
  listPullRequests(): Promise<GitHubWorkspaceItem[]>
  listIssues(): Promise<GitHubWorkspaceItem[]>
  listPullRequestCategory(options: ListPullRequestCategoryOptions): Promise<GitHubPullRequest[]>
  listViewerPullRequests(options?: ListWorkspaceItemsOptions): Promise<GitHubPullRequest[]>
  listRepositoryPullRequests(options: ListRepositoryWorkspaceItemsOptions): Promise<GitHubPullRequest[]>
  searchRepositoryPullRequests(options: SearchRepositoryPullRequestsOptions): Promise<GitHubPullRequestSearchResult>
  listIssueCategory(options: ListIssueCategoryOptions): Promise<GitHubIssue[]>
  listViewerIssues(options?: ListWorkspaceItemsOptions): Promise<GitHubIssue[]>
  listRepositoryIssues(options: ListRepositoryWorkspaceItemsOptions): Promise<GitHubIssue[]>
  searchRepositoryIssues(options: SearchRepositoryIssuesOptions): Promise<GitHubIssueSearchResult>
  getIssueDetail(options: GetIssueDetailOptions): Promise<GitHubIssueDetail>
  createIssueComment(options: CreateIssueCommentOptions): Promise<GitHubIssueComment>
  listViewerOrganizations(): Promise<GitHubOrganization[]>
  listOrganizationRepositories(owner: string): Promise<GitHubRepository[]>
  resolveWorkspaceGoto(input: string): Promise<GitHubWorkspaceGotoResult>
  searchWorkspace(options: SearchWorkspaceOptions): Promise<GitHubWorkspaceSearchResult>
  getRepositoryViewerState(options: RepositoryOptions): Promise<GitHubRepositoryViewerState>
  getRepositoryOverview(options: RepositoryOptions): Promise<GitHubRepositoryOverview>
  listRepositoryFiles(options: RepositoryFilesOptions): Promise<GitHubRepositoryFileTree>
  getRepositoryFilePreview(options: RepositoryFilePreviewOptions): Promise<GitHubRepositoryFilePreview>
  setRepositoryStarred(options: SetRepositoryStarredOptions): Promise<void>
  setRepositoryWatching(options: SetRepositoryWatchingOptions): Promise<void>
}

export interface GitHubApiOptions {
  token: string
  baseUrl?: string
  proxyUrl?: string
  userAgent?: string
}

export interface StartDeviceAuthorizationOptions {
  clientId: string
  scopes: string[]
}

export interface PollDeviceAccessTokenOptions {
  clientId: string
  deviceCode: string
}

export interface ListWorkspaceItemsOptions {
  limit?: number
}

export interface ListPullRequestCategoryOptions extends ListWorkspaceItemsOptions {
  category: GitHubPullRequestCategory
}

export interface ListIssueCategoryOptions extends ListWorkspaceItemsOptions {
  category: GitHubIssueCategory
}

export interface ListRepositoryWorkspaceItemsOptions extends ListWorkspaceItemsOptions {
  owner: string
  repo: string
}

export interface GetIssueDetailOptions extends RepositoryOptions {
  number: number
}

export interface CreateIssueCommentOptions extends GetIssueDetailOptions {
  body: string
}

export interface SearchRepositoryPullRequestsOptions extends RepositoryOptions {
  page?: number
  perPage?: number
  search?: string
  state?: GitHubPullRequestSearchState
}

export interface SearchRepositoryIssuesOptions extends RepositoryOptions {
  page?: number
  perPage?: number
  search?: string
  state?: GitHubIssueSearchState
}

export interface SearchWorkspaceOptions {
  mode: GitHubWorkspaceSearchMode
  query: string
  page?: number
  perPage?: number
}

export interface RepositoryOptions {
  owner: string
  repo: string
}

export interface RepositoryFilesOptions extends RepositoryOptions {
  ref?: string | null
}

export interface RepositoryFilePreviewOptions extends RepositoryFilesOptions {
  path: string
}

export interface SetRepositoryStarredOptions extends RepositoryOptions {
  starred: boolean
}

export interface SetRepositoryWatchingOptions extends RepositoryOptions {
  watching: boolean
}
