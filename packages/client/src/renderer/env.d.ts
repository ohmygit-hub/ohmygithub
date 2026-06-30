/// <reference types="vite/client" />

type KeyboardShortcutOverride = {
  accelerator: string | null
  disabled: boolean
}

type LocalConfig = {
  schemaVersion: 2
  github: {
    activeAccountLogin: string | null
  }
  network: {
    proxyUrl: string | null
  }
  ui: {
    locale: 'en' | 'zh'
    theme: 'auto' | 'light' | 'dark'
    colorScheme: 'default' | 'ocean' | 'forest' | 'rose' | 'amber'
    uiFontSizePx: number
    codeFontSizePx: number
    uiFontFamily: string
    codeFontFamily: string
    shikiThemeLight: string
    shikiThemeDark: string
    mermaidTheme: 'auto' | 'default' | 'dark' | 'forest' | 'neutral'
    keyboardShortcuts: Record<string, KeyboardShortcutOverride>
  }
}

type AuthViewer = {
  id: number
  login: string
  name: string | null
  avatarUrl: string
}

type GitHubOrganization = {
  id: number
  login: string
  avatarUrl: string
  description: string | null
}

type GitHubAccountProfileType = 'User' | 'Organization' | 'Bot' | (string & {})

type GitHubAccountProfile = {
  id: number
  login: string
  name: string | null
  avatarUrl: string
  bio: string | null
  company: string | null
  location: string | null
  blog: string | null
  email: string | null
  twitterUsername: string | null
  url: string
  followers: number
  following: number
  publicRepos: number
  publicGists: number
  createdAt: string | null
  updatedAt: string | null
  hireable: boolean | null
  type: GitHubAccountProfileType
}

type GitHubAccountSocialAccount = {
  provider: string
  displayName: string
  url: string
}

type GitHubAccountRepository = {
  id: number
  name: string
  nameWithOwner: string
  owner: string
  ownerAvatarUrl: string | null
  description: string | null
  isPrivate: boolean
  visibility: GitHubRepositoryVisibility
  isFork: boolean
  isArchived: boolean
  isTemplate: boolean
  primaryLanguage: string | null
  primaryLanguageColor: string | null
  stars: number
  forks: number
  topics: string[]
  homepageUrl: string | null
  pushedAt: string | null
  updatedAt: string | null
  url: string
}

type GitHubAccountRepositoryPage = {
  items: GitHubAccountRepository[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
  incompleteResults: boolean
}

type GitHubAccountContributionDay = {
  date: string
  contributionCount: number
  color: string
  weekday: number
}

type GitHubAccountContributionWeek = {
  firstDay: string
  days: GitHubAccountContributionDay[]
}

type GitHubAccountContributionYear = {
  year: number
  totalContributions: number
  restrictedContributionsCount: number
  commitContributions: number
  issueContributions: number
  pullRequestContributions: number
  pullRequestReviewContributions: number
  weeks: GitHubAccountContributionWeek[]
}

type GitHubAccountOverview = {
  profile: GitHubAccountProfile
  organizations: GitHubOrganization[]
  socialAccounts: GitHubAccountSocialAccount[]
  pinnedRepositories: GitHubAccountRepository[]
  readme: GitHubRepositoryDocument | null
  contributionYears: number[]
}

type GitHubAccountViewerState = {
  isFollowing: boolean
  missingScopes: string[]
}

type ListAccountRepositoriesOptions = {
  login: string
  page?: number
  perPage?: number
  search?: string
}

type AccountContributionsOptions = {
  login: string
  year?: number
}

type SetAccountFollowedOptions = {
  login: string
  followed: boolean
}

type GitHubRepository = {
  id: number
  name: string
  nameWithOwner: string
  owner: string
  description: string | null
  isPrivate: boolean
  updatedAt: string
  url: string
}

type GitHubWorkspaceSearchMode = 'users' | 'orgs' | 'repos' | 'all'

type GitHubWorkspaceSearchItemKind = 'user' | 'org' | 'repo'

type GitHubWorkspaceSearchItem = {
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

type GitHubWorkspaceSearchResult = {
  mode: GitHubWorkspaceSearchMode
  query: string
  items: GitHubWorkspaceSearchItem[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
  incompleteResults: boolean
}

type GitHubWorkspaceGotoResult =
  | {
      status: 'found'
      input: string
      type: 'account' | 'repo'
      title: string
      url: string
    }
  | {
      status: 'not_found'
      input: string
      reason: 'invalid' | 'not_found'
      url: string
    }

type GitHubRepositoryViewerState = {
  isStarred: boolean
  isWatching: boolean
  starCount: number
}

type GitHubRepositoryVisibility = 'public' | 'private' | 'internal'

type GitHubRepositoryDocumentKind =
  | 'readme'
  | 'contributing'
  | 'license'
  | 'codeOfConduct'
  | 'security'
  | 'citation'
  | 'funding'
  | 'issueTemplate'
  | 'pullRequestTemplate'

type GitHubRepositoryDocumentFormat = 'markdown' | 'text'

type GitHubRepositoryLanguage = {
  name: string
  bytes: number
}

type GitHubRepositoryLicense = {
  key: string
  name: string
  spdxId: string | null
  url: string | null
}

type GitHubRepositoryDocument = {
  kind: GitHubRepositoryDocumentKind
  title: string
  path: string
  url: string | null
  format: GitHubRepositoryDocumentFormat
  content: string
}

type GitHubRepositoryCustomProperty = {
  name: string
  value: string
}

type GitHubRepositoryOverviewCounts = {
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

type GitHubRepositoryOverview = {
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

type GitHubRepositoryFileNodeType = 'tree' | 'file'

type GitHubRepositoryFileNode = {
  type: GitHubRepositoryFileNodeType
  name: string
  path: string
  sha: string
  size: number | null
  downloadUrl: string | null
  htmlUrl: string | null
  children: GitHubRepositoryFileNode[]
}

type GitHubRepositoryFileTree = {
  ref: string
  truncated: boolean
  items: GitHubRepositoryFileNode[]
}

type GitHubRepositoryFilePreview =
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

type GitHubCiState = 'pending' | 'success' | 'failure'

type GitHubPullRequestState = 'draft' | 'merged' | 'open' | 'closed'

type GitHubPullRequestSearchState = 'open' | 'closed' | 'all'

type GitHubPullRequestReviewDecision =
  | 'approved'
  | 'changes_requested'
  | 'review_required'

type GitHubPullRequestReviewState =
  | 'approved'
  | 'changes_requested'
  | 'commented'
  | 'dismissed'
  | 'pending'

type GitHubPullRequestReviewerType =
  | 'user'
  | 'team'
  | 'mannequin'
  | 'unknown'

type GitHubIssueState = 'open' | 'completed' | 'not_planned'

type GitHubIssueSearchState = 'open' | 'closed' | 'all'

type GitHubIssueUpdateState = 'open' | 'closed'

type GitHubRepositoryReferenceKind = 'issue' | 'pull-request'

type GitHubRepositoryReferenceState = GitHubIssueState | GitHubPullRequestState

type GitHubRepositoryReferenceResolution =
  | {
      status: 'found'
      owner: string
      repo: string
      repository: string
      number: number
      kind: GitHubRepositoryReferenceKind
      state: GitHubRepositoryReferenceState
      title: string
      url: string
      workspaceUrl: string
    }
  | {
      status: 'not_found'
      owner: string
      repo: string
      repository: string
      number: number
    }

type GitHubPullRequestCategory = 'created-by-me' | 'needs-review' | 'inbox' | 'mentioned-me'

type GitHubIssueCategory = 'created-by-me' | 'inbox' | 'mentioned-me'

type GitHubActor = {
  login: string
  avatarUrl?: string
}

type GitHubPullRequest = {
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

type SearchRepositoryPullRequestsOptions = {
  owner: string
  repo: string
  page?: number
  perPage?: number
  search?: string
  state?: GitHubPullRequestSearchState
}

type SearchWorkspaceOptions = {
  mode: GitHubWorkspaceSearchMode
  query: string
  page?: number
  perPage?: number
}

type ResolveRepositoryReferenceOptions = {
  owner: string
  repo: string
  number: number
  kindHint?: GitHubRepositoryReferenceKind
}

type GitHubPullRequestSearchResult = {
  items: GitHubPullRequest[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
  incompleteResults: boolean
}

type GitHubPullRequestBranch = {
  name: string
  repository: string | null
  url: string | null
}

type GitHubPullRequestDiffStats = {
  additions: number
  deletions: number
  changedFiles: number
}

type GitHubPullRequestStatusSummary = {
  ciState: GitHubCiState | null
  checksUrl: string | null
  mergeStateStatus: string | null
}

type GitHubPullRequestReviewRequest = {
  id: string
  reviewer: GitHubActor
  reviewerType: GitHubPullRequestReviewerType
  asCodeOwner: boolean
}

type GitHubPullRequestReviewSummary = {
  id: string
  author: GitHubActor
  state: GitHubPullRequestReviewState
  body: string
  createdAt: string
  updatedAt: string
  submittedAt: string | null
  authorAssociation: string
  url: string
}

type GitHubPullRequestLinkedIssue = {
  id: string
  owner: string
  repo: string
  repository: string
  number: number
  title: string
  state: GitHubIssueState
  url: string
}

type GitHubIssue = {
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

type SearchRepositoryIssuesOptions = {
  owner: string
  repo: string
  page?: number
  perPage?: number
  search?: string
  state?: GitHubIssueSearchState
}

type UpdateIssueOptions = {
  owner: string
  repo: string
  number: number
  title?: string
  body?: string
  state?: GitHubIssueUpdateState
  labels?: string[]
  assignees?: string[]
  milestone?: number | null
}

type GitHubIssueSearchResult = {
  items: GitHubIssue[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
  incompleteResults: boolean
}

type GitHubIssueLabel = {
  id: number
  name: string
  color: string
  description: string | null
}

type GitHubAssignableUser = {
  id: number
  login: string
  avatarUrl?: string
}

type GitHubIssueReaction = {
  content: string
  count: number
  viewerHasReacted?: boolean
}

type GitHubIssueMilestone = {
  id: string
  number: number
  title: string
  description: string | null
  dueOn: string | null
  state: 'open' | 'closed'
  url: string
}

type GitHubIssueComment = {
  id: string
  databaseId?: number
  author: GitHubActor
  body: string
  createdAt: string
  updatedAt: string
  authorAssociation: string
  reactions: GitHubIssueReaction[]
  url: string
}

type GitHubIssueTimelineEventType =
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

type GitHubIssueTimelineReference = {
  type: string
  repository?: string
  number?: number
  title?: string
  url?: string | null
}

type GitHubIssueTimelineEvent = {
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

type GitHubIssueDetail = {
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

type GitHubPullRequestTimelineEventType =
  | 'assigned'
  | 'unassigned'
  | 'labeled'
  | 'unlabeled'
  | 'closed'
  | 'reopened'
  | 'renamed'
  | 'cross-referenced'
  | 'mentioned'
  | 'reviewed'
  | 'review-requested'
  | 'review-request-removed'
  | 'review-dismissed'
  | 'ready-for-review'
  | 'convert-to-draft'
  | 'committed'
  | 'merged'
  | 'base-ref-changed'
  | 'base-ref-deleted'
  | 'base-ref-force-pushed'
  | 'head-ref-deleted'
  | 'head-ref-force-pushed'
  | 'head-ref-restored'
  | 'automatic-base-change-failed'
  | 'automatic-base-change-succeeded'
  | 'auto-merge-enabled'
  | 'auto-merge-disabled'
  | 'auto-rebase-enabled'
  | 'auto-squash-enabled'
  | 'added-to-merge-queue'
  | 'removed-from-merge-queue'
  | 'milestoned'
  | 'demilestoned'
  | 'connected'
  | 'disconnected'
  | 'comment-deleted'
  | 'referenced'
  | 'generic'

type GitHubPullRequestTimelineReference = {
  type: string
  repository?: string
  number?: number
  title?: string
  url?: string | null
}

type GitHubPullRequestCommitSummary = {
  id: string
  oid: string
  abbreviatedOid: string
  messageHeadline: string
  authoredDate: string
  committedDate: string
  author: GitHubActor
  authorIsGitHubUser: boolean
  ciState: GitHubCiState | null
  url: string
}

type GitHubPullRequestTimelineEvent = {
  id: string
  type: GitHubPullRequestTimelineEventType
  actor: GitHubActor
  createdAt: string
  body?: string | null
  text?: string | null
  label?: string | null
  milestone?: string | null
  from?: string | null
  to?: string | null
  ref?: string | null
  beforeCommit?: string | null
  afterCommit?: string | null
  reason?: string | null
  url?: string | null
  commit?: GitHubPullRequestCommitSummary | null
  assignee?: GitHubActor
  reviewer?: GitHubActor
  reviewerType?: GitHubPullRequestReviewerType
  reviewState?: GitHubPullRequestReviewState
  source?: GitHubPullRequestTimelineReference
}

type GitHubPullRequestComment = GitHubIssueComment

type GitHubPullRequestDetail = {
  id: string
  owner: string
  repo: string
  repository: string
  number: number
  title: string
  state: GitHubPullRequestState
  ciState: GitHubCiState | null
  author: GitHubActor
  createdAt: string
  updatedAt: string
  closedAt: string | null
  mergedAt: string | null
  mergedBy: GitHubActor | null
  body: string
  labels: string[]
  assignees: GitHubActor[]
  milestone: GitHubIssueMilestone | null
  participants: GitHubActor[]
  reviewRequests: GitHubPullRequestReviewRequest[]
  latestReviews: GitHubPullRequestReviewSummary[]
  reviewDecision: GitHubPullRequestReviewDecision | null
  baseBranch: GitHubPullRequestBranch
  headBranch: GitHubPullRequestBranch
  isCrossRepository: boolean
  maintainerCanModify: boolean
  diffStats: GitHubPullRequestDiffStats
  status: GitHubPullRequestStatusSummary
  linkedIssues: GitHubPullRequestLinkedIssue[]
  comments: GitHubPullRequestComment[]
  timelineEvents: GitHubPullRequestTimelineEvent[]
  reactions: GitHubIssueReaction[]
  url: string
  hasUpdates: boolean
}

type AuthState = {
  isAuthenticated: boolean
  path: string
  hasGitHubClientId: boolean
  auth: {
    schemaVersion: 1
    method: 'oauth_device' | 'personal_token'
    tokenType: string
    scopes: string[]
    viewer: AuthViewer
    createdAt: string
    updatedAt: string
  } | null
}

type WindowControlsState = {
  isFullScreen: boolean
}

type StoredWorkspaceBookmarkFolder = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

type StoredWorkspaceBookmark = {
  id: string
  url: string
  type: string
  title: string
  folderId: string | null
  owner?: string
  repo?: string
  draftId?: string
  number?: number
  accountSection?: string
  repositorySection?: string
  pullRequestCategory?: string
  issueCategory?: string
  searchMode?: string
  searchQuery?: string
  notFoundInput?: string
  avatarUrl?: string
  avatarFallback?: string
}

type StoredWorkspaceBookmarks = {
  version: 1
  folders: StoredWorkspaceBookmarkFolder[]
  bookmarks: StoredWorkspaceBookmark[]
}

type StoredWorkspaceBookmarksInfo = {
  path: string
  hasContent: boolean
  bookmarks: StoredWorkspaceBookmarks
}

interface Window {
  ohMyGithub: {
    app: {
      name: string
      version: string
    }
    accounts: {
      getProfile: (login: string) => Promise<GitHubAccountProfile>
      getOverview: (login: string) => Promise<GitHubAccountOverview>
      getContributions: (options: AccountContributionsOptions) => Promise<GitHubAccountContributionYear>
      listRepositories: (options: ListAccountRepositoriesOptions) => Promise<GitHubAccountRepositoryPage>
      listStarredRepositories: (options: ListAccountRepositoriesOptions) => Promise<GitHubAccountRepositoryPage>
      getViewerState: (login: string) => Promise<GitHubAccountViewerState>
      setFollowed: (options: SetAccountFollowedOptions) => Promise<void>
      listOrganizations: () => Promise<GitHubOrganization[]>
      listOrganizationRepositories: (owner: string) => Promise<GitHubRepository[]>
    }
    issues: {
      listIssueCategory: (category: GitHubIssueCategory) => Promise<GitHubIssue[]>
      listViewerIssues: () => Promise<GitHubIssue[]>
      listRepositoryIssues: (owner: string, repo: string) => Promise<GitHubIssue[]>
      searchRepositoryIssues: (options: SearchRepositoryIssuesOptions) => Promise<GitHubIssueSearchResult>
      getIssueDetail: (owner: string, repo: string, number: number) => Promise<GitHubIssueDetail>
      updateIssue: (options: UpdateIssueOptions) => Promise<GitHubIssueDetail>
      listRepositoryIssueLabels: (owner: string, repo: string) => Promise<GitHubIssueLabel[]>
      listRepositoryAssignableUsers: (owner: string, repo: string) => Promise<GitHubAssignableUser[]>
      listRepositoryIssueMilestones: (owner: string, repo: string) => Promise<GitHubIssueMilestone[]>
      createIssueComment: (
        owner: string,
        repo: string,
        number: number,
        body: string
      ) => Promise<GitHubIssueComment>
      editIssueComment: (
        owner: string,
        repo: string,
        commentId: number,
        body: string
      ) => Promise<GitHubIssueComment>
      deleteIssueComment: (owner: string, repo: string, commentId: number) => Promise<void>
    }
    pulls: {
      listPullRequestCategory: (category: GitHubPullRequestCategory) => Promise<GitHubPullRequest[]>
      listViewerPullRequests: () => Promise<GitHubPullRequest[]>
      listRepositoryPullRequests: (owner: string, repo: string) => Promise<GitHubPullRequest[]>
      searchRepositoryPullRequests: (
        options: SearchRepositoryPullRequestsOptions
      ) => Promise<GitHubPullRequestSearchResult>
      getPullRequestDetail: (owner: string, repo: string, number: number) => Promise<GitHubPullRequestDetail>
      createPullRequestComment: (
        owner: string,
        repo: string,
        number: number,
        body: string
      ) => Promise<GitHubPullRequestComment>
    }
    repositories: {
      getViewerState: (owner: string, repo: string) => Promise<GitHubRepositoryViewerState>
      getOverview: (owner: string, repo: string) => Promise<GitHubRepositoryOverview>
      listFiles: (owner: string, repo: string, ref?: string | null) => Promise<GitHubRepositoryFileTree>
      getFilePreview: (
        owner: string,
        repo: string,
        path: string,
        ref?: string | null
      ) => Promise<GitHubRepositoryFilePreview>
      setStarred: (owner: string, repo: string, starred: boolean) => Promise<void>
      setWatching: (owner: string, repo: string, watching: boolean) => Promise<void>
    }
    search: {
      resolveGoto: (input: string) => Promise<GitHubWorkspaceGotoResult>
      resolveRepositoryReference: (
        options: ResolveRepositoryReferenceOptions
      ) => Promise<GitHubRepositoryReferenceResolution>
      searchWorkspace: (options: SearchWorkspaceOptions) => Promise<GitHubWorkspaceSearchResult>
    }
    auth: {
      get: () => Promise<AuthState>
      startDeviceFlow: (onStarted?: (details: {
        auth: AuthState
        sessionId: string
        userCode: string
        verificationUri: string
        verificationUriComplete?: string
      }) => void) => Promise<{
        auth: AuthState
        sessionId: string
        userCode: string
        verificationUri: string
        verificationUriComplete?: string
      }>
      copyCodeAndOpenDeviceFlow: (sessionId: string) => Promise<void>
      savePersonalToken: (token: string) => Promise<AuthState>
      logout: () => Promise<AuthState>
    }
    config: {
      get: () => Promise<{
        path: string
        config: LocalConfig
      }>
      update: (patch: Partial<{
        github: Partial<LocalConfig['github']>
        network: Partial<LocalConfig['network']>
        ui: Partial<LocalConfig['ui']>
      }>) => Promise<{
        path: string
        config: LocalConfig
      }>
    }
    bookmarks: {
      get: () => Promise<StoredWorkspaceBookmarksInfo>
      update: (payload: StoredWorkspaceBookmarks) => Promise<StoredWorkspaceBookmarksInfo>
    }
    links: {
      openGitHubUrl: (url: string) => Promise<void>
    }
    windowControls: {
      getState: () => Promise<WindowControlsState>
      onFullscreenChange: (listener: (state: WindowControlsState) => void) => () => void
    }
  }
}
