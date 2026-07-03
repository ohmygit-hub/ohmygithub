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

type GitHubRepositorySubscription = 'participating' | 'all' | 'ignore'

type GitHubRepositoryViewerState = {
  isStarred: boolean
  isWatching: boolean
  subscription: GitHubRepositorySubscription
  starCount: number
}

type GitHubForkedRepository = {
  owner: string
  name: string
  nameWithOwner: string
  url: string
  ready: boolean
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
  commits: number | null
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

type GitHubRepositoryNavigationCounts = Pick<
  GitHubRepositoryOverviewCounts,
  'commits' | 'openIssues' | 'openPullRequests'
>

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

type GitHubContributorStatsAuthor = {
  id: number
  login: string
  avatarUrl: string | null
  type: string
}

type GitHubContributorStatsWeek = {
  w: number
  a: number
  d: number
  c: number
}

type GitHubRepositoryContributorStats = {
  author: GitHubContributorStatsAuthor
  total: number
  weeks: GitHubContributorStatsWeek[]
}

type GitHubRepositoryContributorStatsResult = {
  contributors: GitHubRepositoryContributorStats[]
  firstWeek: number | null
  lastWeek: number | null
  hasLineStats: boolean
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
  additions?: number
  deletions?: number
  children: GitHubRepositoryFileNode[]
}

type GitHubRepositoryFileTree = {
  ref: string
  truncated: boolean
  items: GitHubRepositoryFileNode[]
}

type GitHubRepositoryCommitAuthor = {
  login: string | null
  name: string | null
  avatarUrl: string | null
}

type GitHubRepositoryCommit = {
  sha: string
  shortSha: string
  message: string
  headline: string
  author: GitHubRepositoryCommitAuthor
  committedDate: string
  htmlUrl: string
  ciState: GitHubCiState | null
}

type GitHubRepositoryCommitPage = {
  items: GitHubRepositoryCommit[]
  page: number
  perPage: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

type GitHubRepositoryBranch = {
  name: string
  commitSha: string
}

type GitHubBranchAssociatedPullRequest = {
  number: number
  title: string
  url: string
}

type GitHubBranchListItem = {
  name: string
  commitSha: string
  shortSha: string
  committedDate: string | null
  author: GitHubRepositoryCommitAuthor
  aheadBy: number | null
  behindBy: number | null
  isDefault: boolean
  isProtected: boolean
  associatedPullRequest: GitHubBranchAssociatedPullRequest | null
}

type GitHubBranchPage = {
  items: GitHubBranchListItem[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
  defaultBranch: string | null
}

type GitHubTagListItem = {
  name: string
  commitSha: string
  shortSha: string
  date: string | null
  message: string | null
  isAnnotated: boolean
}

type GitHubTagPage = {
  items: GitHubTagListItem[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
}

type GitHubListRefsOptions = {
  query?: string | null
  page?: number | null
  perPage?: number | null
  defaultBranch?: string | null
}

type GitHubCreatedRef = {
  ref: string
  sha: string
}

type GitHubReleaseAsset = {
  id: number
  name: string
  size: number
  downloadCount: number
  contentType: string | null
  browserDownloadUrl: string
  updatedAt: string | null
}

type GitHubRelease = {
  id: number
  tagName: string
  targetCommitish: string
  name: string | null
  body: string | null
  draft: boolean
  prerelease: boolean
  createdAt: string | null
  publishedAt: string | null
  htmlUrl: string
  author: GitHubActor | null
  assets: GitHubReleaseAsset[]
  tarballUrl: string | null
  zipballUrl: string | null
}

type GitHubReleasePage = {
  items: GitHubRelease[]
  page: number
  perPage: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

type ListRepositoryReleasesOptions = {
  owner: string
  repo: string
  page?: number
  perPage?: number
}

type CreateReleaseOptions = {
  owner: string
  repo: string
  tagName: string
  targetCommitish?: string | null
  name?: string | null
  body?: string | null
  draft?: boolean
  prerelease?: boolean
}

type UpdateReleaseChanges = {
  tagName?: string
  targetCommitish?: string | null
  name?: string | null
  body?: string | null
  draft?: boolean
  prerelease?: boolean
}

type GitHubCommitActor = {
  login: string | null
  name: string | null
  avatarUrl: string | null
  date: string | null
}

type GitHubCommitFile = {
  filename: string
  previousFilename?: string
  status: 'added' | 'modified' | 'removed' | 'renamed' | 'changed'
  additions: number
  deletions: number
  patch?: string
}

type GitHubCommitParent = {
  sha: string
  shortSha: string
}

type GitHubCommitVerification = {
  verified: boolean
  reason: string | null
}

type GitHubCommitStats = {
  additions: number
  deletions: number
  total: number
}

type GitHubCommitDetail = {
  sha: string
  shortSha: string
  headline: string
  message: string
  htmlUrl: string
  author: GitHubCommitActor
  committer: GitHubCommitActor
  parents: GitHubCommitParent[]
  verification: GitHubCommitVerification | null
  stats: GitHubCommitStats
  files: GitHubCommitFile[]
  ciState: GitHubCiState | null
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

type GitHubActionWorkflowState =
  | 'active'
  | 'deleted'
  | 'disabled_fork'
  | 'disabled_inactivity'
  | 'disabled_manually'
  | (string & {})

type GitHubActionRunStatus =
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'waiting'
  | 'requested'
  | 'pending'
  | (string & {})

type GitHubActionConclusion =
  | 'success'
  | 'failure'
  | 'neutral'
  | 'cancelled'
  | 'skipped'
  | 'timed_out'
  | 'action_required'
  | 'stale'
  | (string & {})

type GitHubActionWorkflow = {
  id: number
  nodeId: string | null
  name: string
  path: string
  state: GitHubActionWorkflowState
  createdAt: string | null
  updatedAt: string | null
  url: string
  htmlUrl: string
  badgeUrl: string | null
}

type GitHubActionRun = {
  id: number
  runNumber: number
  runAttempt: number
  name: string | null
  displayTitle: string
  workflowId: number
  workflowName: string | null
  event: string
  status: GitHubActionRunStatus | null
  conclusion: GitHubActionConclusion | null
  headBranch: string | null
  headSha: string
  actor: GitHubActor
  triggeringActor: GitHubActor | null
  checkSuiteId: number | null
  createdAt: string | null
  updatedAt: string | null
  runStartedAt: string | null
  completedAt: string | null
  url: string
  htmlUrl: string
  jobsUrl: string | null
  logsUrl: string | null
}

type GitHubActionRunPage = {
  items: GitHubActionRun[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
}

type GitHubActionStep = {
  number: number
  name: string
  status: GitHubActionRunStatus | null
  conclusion: GitHubActionConclusion | null
  startedAt: string | null
  completedAt: string | null
}

type GitHubActionJob = {
  id: number
  runId: number
  runAttempt: number
  name: string
  status: GitHubActionRunStatus | null
  conclusion: GitHubActionConclusion | null
  startedAt: string | null
  completedAt: string | null
  htmlUrl: string | null
  runnerName: string | null
  labels: string[]
  steps: GitHubActionStep[]
}

type GitHubActionJobLogStep = {
  number: number | null
  title: string
  content: string
}

type GitHubActionJobLog = {
  jobId: number
  content: string
  fetchedAt: string
  isAvailable: boolean
  steps?: GitHubActionJobLogStep[]
}

type WorkflowJobLogHint = {
  runId: number
  runAttempt: number
  name: string
  status: GitHubActionRunStatus | null
}

type ListRepositoryWorkflowRunsOptions = {
  owner: string
  repo: string
  headSha?: string | null
  workflowId?: number | 'all' | null
  page?: number
  perPage?: number
}

type ListWorkflowRunJobsOptions = {
  owner: string
  repo: string
  runId: number
  filter?: 'latest' | 'all'
}

type GitHubDeploymentState =
  | 'error'
  | 'failure'
  | 'inactive'
  | 'in_progress'
  | 'queued'
  | 'pending'
  | 'success'

type GitHubDeploymentStatus = {
  id: number
  state: GitHubDeploymentState
  description: string
  environmentUrl: string | null
  logUrl: string | null
  creator: GitHubActor | null
  createdAt: string
}

type GitHubDeployment = {
  id: number
  sha: string
  ref: string
  task: string
  environment: string
  description: string | null
  transientEnvironment: boolean
  productionEnvironment: boolean
  creator: GitHubActor | null
  latestStatus: GitHubDeploymentStatus | null
  createdAt: string
  updatedAt: string
}

type GitHubEnvironmentProtectionRule = {
  id: number
  type: string
  waitTimer: number | null
  reviewerCount: number | null
}

type GitHubEnvironment = {
  id: number
  name: string
  htmlUrl: string | null
  createdAt: string | null
  updatedAt: string | null
  protectionRules: GitHubEnvironmentProtectionRule[]
}

type GitHubDeploymentPage = {
  items: GitHubDeployment[]
  totalCount: number | null
  page: number
  perPage: number
  hasNextPage: boolean
}

type GitHubEnvironmentPage = {
  items: GitHubEnvironment[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
}

type ListRepositoryEnvironmentsOptions = {
  owner: string
  repo: string
  page?: number
  perPage?: number
}

type ListRepositoryDeploymentsOptions = {
  owner: string
  repo: string
  environment?: string | null
  ref?: string | null
  sha?: string | null
  task?: string | null
  page?: number
  perPage?: number
}

type ListDeploymentStatusesOptions = {
  owner: string
  repo: string
  deploymentId: number
}

type DeploymentTargetOptions = {
  owner: string
  repo: string
  deploymentId: number
}

type DeleteDeploymentOptions = {
  owner: string
  repo: string
  deploymentId: number
  deactivateFirst?: boolean
}

type DeleteEnvironmentOptions = {
  owner: string
  repo: string
  environmentName: string
}

type GitHubPackageType = 'npm' | 'maven' | 'rubygems' | 'docker' | 'nuget' | 'container'
type GitHubPackageVisibility = 'public' | 'private' | 'internal'

type GitHubPackage = {
  id: number
  name: string
  packageType: GitHubPackageType
  visibility: GitHubPackageVisibility
  versionCount: number
  ownerLogin: string
  htmlUrl: string | null
  createdAt: string
  updatedAt: string
}

type GitHubPackageVersion = {
  id: number
  name: string
  htmlUrl: string | null
  description: string | null
  containerTags: string[]
  createdAt: string
  updatedAt: string
}

type GitHubPackagePage = {
  items: GitHubPackage[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
  failedTypes: GitHubPackageType[]
  truncated: boolean
}

type GitHubPackageVersionPage = {
  items: GitHubPackageVersion[]
  totalCount: number | null
  page: number
  perPage: number
  hasNextPage: boolean
}

type ListRepositoryPackagesOptions = {
  owner: string
  repo: string
  page?: number
  perPage?: number
}

type ListPackageVersionsOptions = {
  owner: string
  packageType: GitHubPackageType
  packageName: string
  page?: number
  perPage?: number
}

type PackageTargetOptions = {
  owner: string
  packageType: GitHubPackageType
  packageName: string
}

type PackageVersionTargetOptions = PackageTargetOptions & {
  versionId: number
}

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

type GitHubPullRequestMergeMethod = 'merge' | 'squash' | 'rebase'

type GitHubPullRequestReviewEvent = 'APPROVE' | 'COMMENT' | 'REQUEST_CHANGES'

type GitHubIssueState = 'open' | 'completed' | 'not_planned'

type GitHubIssueSearchState = 'open' | 'closed' | 'all'

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
  isBot?: boolean
}

type GitHubLabel = {
  name: string
  color: string
  description: string | null
}

type GitHubIssueType = {
  name: string
  color: string | null
  description: string | null
}

type GitHubIssueLinkedRef = {
  id: string
  number: number
  title: string | null
  state: string | null
  url: string | null
}

type GitHubNotification = {
  id: string
  unread: boolean
  reason: string
  updatedAt: string
  subjectType: string
  subjectTitle: string
  repositoryFullName: string
  repositoryHtmlUrl: string
  number?: number
  htmlUrl: string
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
  labels: GitHubLabel[]
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
  mergeable: string | null
}

type GitHubPullRequestMergePolicy = {
  methods: GitHubPullRequestMergeMethod[]
  defaultMethod: GitHubPullRequestMergeMethod | null
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
  labels: GitHubLabel[]
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

type GitHubIssueSearchResult = {
  items: GitHubIssue[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
  incompleteResults: boolean
}

type GitHubReactionContent =
  | 'thumbs-up'
  | 'thumbs-down'
  | 'laugh'
  | 'hooray'
  | 'confused'
  | 'heart'
  | 'rocket'
  | 'eyes'

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
  nodeId: string
  author: GitHubActor
  body: string
  createdAt: string
  updatedAt: string
  authorAssociation: string
  reactions: GitHubIssueReaction[]
  url: string
  viewerCanUpdate: boolean
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
  labels: GitHubLabel[]
  issueType: GitHubIssueType | null
  relationships: {
    parent: GitHubIssueLinkedRef | null
    subIssues: GitHubIssueLinkedRef[]
    tracked: GitHubIssueLinkedRef[]
  }
  projects: Array<{ id: string, title: string, url: string | null, fields: Array<{ name: string, value: string }> }>
  assignees: GitHubActor[]
  milestone: GitHubIssueMilestone | null
  participants: GitHubActor[]
  comments: GitHubIssueComment[]
  timelineEvents: GitHubIssueTimelineEvent[]
  reactions: GitHubIssueReaction[]
  development: {
    branches: number | null
    commits: number | null
    pullRequests: Array<{ id: string, number: number, title: string | null, state: string | null, url: string | null }>
  } | null
  url: string
  hasUpdates: boolean
  viewerCanUpdate: boolean
  viewerCanClose: boolean
  viewerCanReopen: boolean
  nodeId: string
  locked: boolean
  isPinned: boolean
  viewerSubscription: 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'IGNORED' | null
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
  | 'locked'
  | 'unlocked'
  | 'pinned'
  | 'unpinned'
  | 'transferred'
  | 'marked-as-duplicate'
  | 'unmarked-as-duplicate'
  | 'deployed'
  | 'deployment-environment-changed'
  | 'converted-to-discussion'
  | 'added-to-project'
  | 'removed-from-project'
  | 'project-status-changed'
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

type GitHubPullRequestReviewComment = {
  id: string
  nodeId: string
  author: GitHubActor
  body: string
  createdAt: string
  updatedAt: string
  url: string | null
  path: string
  diffHunk: string | null
  line: number | null
  originalLine: number | null
  startLine: number | null
  outdated: boolean
  isReply: boolean
  reactions: GitHubIssueReaction[]
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
  reviewComments?: GitHubPullRequestReviewComment[]
  source?: GitHubPullRequestTimelineReference
}

type GitHubPullRequestComment = GitHubIssueComment

type GitHubPullRequestDetail = {
  id: string
  nodeId: string
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
  labels: GitHubLabel[]
  assignees: GitHubActor[]
  milestone: GitHubIssueMilestone | null
  participants: GitHubActor[]
  reviewRequests: GitHubPullRequestReviewRequest[]
  latestReviews: GitHubPullRequestReviewSummary[]
  reviewDecision: GitHubPullRequestReviewDecision | null
  baseBranch: GitHubPullRequestBranch
  headBranch: GitHubPullRequestBranch
  headSha: string | null
  isCrossRepository: boolean
  maintainerCanModify: boolean
  diffStats: GitHubPullRequestDiffStats
  status: GitHubPullRequestStatusSummary
  mergePolicy: GitHubPullRequestMergePolicy
  linkedIssues: GitHubPullRequestLinkedIssue[]
  comments: GitHubPullRequestComment[]
  timelineEvents: GitHubPullRequestTimelineEvent[]
  reactions: GitHubIssueReaction[]
  url: string
  hasUpdates: boolean
  viewerCanUpdate: boolean
  viewerCanClose: boolean
  viewerCanReopen: boolean
  viewerCanMergeAsAdmin: boolean
  locked: boolean
  viewerSubscription: 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'IGNORED' | null
  projects: Array<{ id: string, title: string, url: string | null, fields: Array<{ name: string, value: string }> }>
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
  number?: number
  runId?: number
  jobId?: number
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
    actions: {
      listRepositoryWorkflows: (owner: string, repo: string) => Promise<GitHubActionWorkflow[]>
      listRepositoryWorkflowRuns: (options: ListRepositoryWorkflowRunsOptions) => Promise<GitHubActionRunPage>
      getWorkflowRun: (owner: string, repo: string, runId: number) => Promise<GitHubActionRun>
      listWorkflowRunJobs: (options: ListWorkflowRunJobsOptions) => Promise<GitHubActionJob[]>
      getWorkflowJobLog: (owner: string, repo: string, jobId: number, job?: WorkflowJobLogHint) => Promise<GitHubActionJobLog>
      rerunWorkflowRun: (owner: string, repo: string, runId: number) => Promise<void>
      rerunFailedWorkflowRunJobs: (owner: string, repo: string, runId: number) => Promise<void>
      rerunWorkflowJob: (owner: string, repo: string, jobId: number) => Promise<void>
    }
    deployments: {
      listEnvironments: (options: ListRepositoryEnvironmentsOptions) => Promise<GitHubEnvironmentPage>
      listDeployments: (options: ListRepositoryDeploymentsOptions) => Promise<GitHubDeploymentPage>
      listStatuses: (options: ListDeploymentStatusesOptions) => Promise<GitHubDeploymentStatus[]>
      markInactive: (options: DeploymentTargetOptions) => Promise<void>
      deleteDeployment: (options: DeleteDeploymentOptions) => Promise<void>
      deleteEnvironment: (options: DeleteEnvironmentOptions) => Promise<void>
    }
    issues: {
      listIssueCategory: (category: GitHubIssueCategory) => Promise<GitHubIssue[]>
      listViewerIssues: () => Promise<GitHubIssue[]>
      listRepositoryIssues: (owner: string, repo: string) => Promise<GitHubIssue[]>
      searchRepositoryIssues: (options: SearchRepositoryIssuesOptions) => Promise<GitHubIssueSearchResult>
      getIssueDetail: (owner: string, repo: string, number: number) => Promise<GitHubIssueDetail>
      createIssueComment: (
        owner: string,
        repo: string,
        number: number,
        body: string
      ) => Promise<GitHubIssueComment>
      listRepositoryLabels: (owner: string, repo: string) => Promise<GitHubLabel[]>
      listRepositoryMilestones: (owner: string, repo: string) => Promise<GitHubIssueMilestone[]>
      listAssignableUsers: (owner: string, repo: string) => Promise<GitHubActor[]>
      updateIssue: (
        owner: string,
        repo: string,
        number: number,
        changes: {
          title?: string
          body?: string
          state?: 'open' | 'closed'
          stateReason?: 'completed' | 'not_planned'
          assignees?: string[]
          labels?: string[]
          milestone?: number | null
        }
      ) => Promise<void>
      updateIssueComment: (
        owner: string,
        repo: string,
        commentId: string | number,
        body: string
      ) => Promise<void>
      setIssueSubscription: (subscribableId: string, subscribed: boolean) => Promise<void>
      setIssueLock: (owner: string, repo: string, number: number, locked: boolean) => Promise<void>
      setIssuePinned: (issueId: string, pinned: boolean) => Promise<void>
      deleteIssue: (issueId: string) => Promise<void>
      setReaction: (subjectId: string, content: GitHubReactionContent, reacted: boolean) => Promise<void>
    }
    packages: {
      listPackages: (options: ListRepositoryPackagesOptions) => Promise<GitHubPackagePage>
      listVersions: (options: ListPackageVersionsOptions) => Promise<GitHubPackageVersionPage>
      deletePackage: (options: PackageTargetOptions) => Promise<void>
      deleteVersion: (options: PackageVersionTargetOptions) => Promise<void>
      restorePackage: (options: PackageTargetOptions) => Promise<void>
      restoreVersion: (options: PackageVersionTargetOptions) => Promise<void>
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
      updatePullRequest: (
        owner: string,
        repo: string,
        number: number,
        changes: { title?: string, body?: string, state?: 'open' | 'closed', assignees?: string[], labels?: string[], milestone?: number | null }
      ) => Promise<void>
      closePullRequest: (owner: string, repo: string, number: number) => Promise<void>
      requestPullRequestReviewers: (owner: string, repo: string, number: number, reviewers: string[], removeReviewers: string[]) => Promise<void>
      markPullRequestReadyForReview: (
        owner: string,
        repo: string,
        number: number,
        id: string
      ) => Promise<void>
      mergePullRequest: (
        owner: string,
        repo: string,
        number: number,
        options: {
          method: GitHubPullRequestMergeMethod
          expectedHeadSha?: string | null
          commitTitle?: string
          commitMessage?: string
        }
      ) => Promise<void>
      updatePullRequestComment: (
        owner: string,
        repo: string,
        commentId: string | number,
        body: string
      ) => Promise<void>
      listPullRequestFiles: (owner: string, repo: string, number: number) => Promise<GitHubCommitFile[]>
      listPullRequestCommits: (
        owner: string,
        repo: string,
        number: number,
        page?: number,
        perPage?: number
      ) => Promise<GitHubRepositoryCommitPage>
      submitPullRequestReview: (
        owner: string,
        repo: string,
        number: number,
        options: {
          event: GitHubPullRequestReviewEvent
          body?: string
        }
      ) => Promise<void>
    }
    inbox: {
      listNotifications: (options?: { all?: boolean, participating?: boolean, limit?: number }) => Promise<GitHubNotification[]>
      markThreadAsRead: (threadId: string) => Promise<void>
      markAllAsRead: () => Promise<void>
      markThreadAsDone: (threadId: string) => Promise<void>
      unsubscribe: (threadId: string) => Promise<void>
    }
    releases: {
      listRepositoryReleases: (options: ListRepositoryReleasesOptions) => Promise<GitHubReleasePage>
      createRelease: (options: CreateReleaseOptions) => Promise<GitHubRelease>
      updateRelease: (
        owner: string,
        repo: string,
        releaseId: number,
        changes: UpdateReleaseChanges
      ) => Promise<GitHubRelease>
      deleteRelease: (owner: string, repo: string, releaseId: number) => Promise<void>
    }
    repositories: {
      getViewerState: (owner: string, repo: string) => Promise<GitHubRepositoryViewerState>
      getNavigationCounts: (owner: string, repo: string) => Promise<GitHubRepositoryNavigationCounts>
      getOverview: (owner: string, repo: string) => Promise<GitHubRepositoryOverview>
      getContributorStats: (owner: string, repo: string) => Promise<GitHubRepositoryContributorStatsResult>
      listFiles: (owner: string, repo: string, ref?: string | null) => Promise<GitHubRepositoryFileTree>
      listCommits: (
        owner: string,
        repo: string,
        ref?: string | null,
        page?: number,
        perPage?: number
      ) => Promise<GitHubRepositoryCommitPage>
      listBranches: (owner: string, repo: string) => Promise<GitHubRepositoryBranch[]>
      listBranchesDetailed: (
        owner: string,
        repo: string,
        options?: GitHubListRefsOptions
      ) => Promise<GitHubBranchPage>
      listTags: (
        owner: string,
        repo: string,
        options?: Omit<GitHubListRefsOptions, 'defaultBranch'>
      ) => Promise<GitHubTagPage>
      createBranch: (owner: string, repo: string, name: string, fromRef: string) => Promise<GitHubCreatedRef>
      renameBranch: (owner: string, repo: string, name: string, newName: string) => Promise<void>
      deleteBranch: (owner: string, repo: string, name: string) => Promise<void>
      createTag: (
        owner: string,
        repo: string,
        name: string,
        fromRef: string,
        message?: string | null
      ) => Promise<GitHubCreatedRef>
      deleteTag: (owner: string, repo: string, name: string) => Promise<void>
      getCommit: (owner: string, repo: string, sha: string) => Promise<GitHubCommitDetail>
      getFilePreview: (
        owner: string,
        repo: string,
        path: string,
        ref?: string | null
      ) => Promise<GitHubRepositoryFilePreview>
      setStarred: (owner: string, repo: string, starred: boolean) => Promise<void>
      setSubscription: (
        owner: string,
        repo: string,
        subscription: GitHubRepositorySubscription
      ) => Promise<void>
      fork: (
        owner: string,
        repo: string,
        options?: {
          organization?: string | null
          name?: string | null
          defaultBranchOnly?: boolean
        }
      ) => Promise<GitHubForkedRepository>
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
