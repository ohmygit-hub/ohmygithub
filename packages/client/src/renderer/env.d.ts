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

type AuthAccountSummary = {
  id: number
  login: string
  name: string | null
  avatarUrl: string
  method: 'oauth_device' | 'personal_token'
}

type GitHubOrganization = {
  id: number
  login: string
  avatarUrl: string
  description: string | null
}

type GitHubUserSettingsProfile = {
  login: string
  name: string | null
  email: string | null
  bio: string | null
  company: string | null
  location: string | null
  blog: string | null
  twitterUsername: string | null
  hireable: boolean
  avatarUrl: string
  htmlUrl: string
}

type UpdateUserSettingsProfileInput = {
  name?: string
  email?: string
  bio?: string
  company?: string
  location?: string
  blog?: string
  twitterUsername?: string
  hireable?: boolean
}

type GitHubSocialAccount = {
  provider: string
  url: string
}

type GitHubUserEmail = {
  email: string
  primary: boolean
  verified: boolean
  visibility: string | null
}

type GitHubSshKey = {
  id: number
  title: string
  key: string
  createdAt: string | null
}

type GitHubGpgKey = {
  id: number
  keyId: string
  name: string | null
  emails: Array<{ email: string; verified: boolean }>
  createdAt: string | null
  expiresAt: string | null
}

type GitHubBlockedUser = {
  login: string
  avatarUrl: string
  htmlUrl: string
}

type GitHubInteractionLimitGroup = 'existing_users' | 'contributors_only' | 'collaborators_only'

type GitHubInteractionLimitExpiry =
  | 'one_day'
  | 'three_days'
  | 'one_week'
  | 'one_month'
  | 'six_months'

type GitHubInteractionLimits = {
  limit: GitHubInteractionLimitGroup
  origin: string | null
  expiresAt: string | null
}

type GitHubOrganizationMembership = {
  orgLogin: string
  orgAvatarUrl: string
  orgDescription: string | null
  role: string
  state: 'active' | 'pending'
  isPublic: boolean
}

type GitHubCodespacesSecret = {
  name: string
  createdAt: string | null
  updatedAt: string | null
  selectedRepositoryIds: number[]
}

type UpsertCodespacesSecretInput = {
  name: string
  value: string
  selectedRepositoryIds: number[]
}

type GitHubSavedReply = {
  id: string
  databaseId: number | null
  title: string
  body: string
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

type GitHubAccountStarList = {
  name: string
  slug: string
  description: string | null
  isPrivate: boolean
  itemsCount: number
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
  list?: string
}

type AccountContributionsOptions = {
  login: string
  year?: number
}

type SetAccountFollowedOptions = {
  login: string
  followed: boolean
}

type GitHubAccountFollowUser = {
  id: number
  login: string
  name: string | null
  avatarUrl: string
  bio: string | null
  type: GitHubAccountProfileType
  isViewer: boolean
  viewerIsFollowing: boolean
  viewerCanFollow: boolean
  isFollowingViewer: boolean
}

type GitHubAccountFollowList = {
  items: GitHubAccountFollowUser[]
  totalCount: number
  truncated: boolean
}

type GitHubRepositoryForkItem = {
  id: number
  owner: string
  ownerAvatarUrl: string
  name: string
  fullName: string
  description: string | null
  stars: number
  pushedAt: string | null
}

type GitHubRepositoryForkList = {
  items: GitHubRepositoryForkItem[]
  totalCount: number
  truncated: boolean
}

type GitHubSponsorshipRole = 'maintainer' | 'sponsor'

type GitHubSponsorshipTier = {
  name: string
  monthlyPriceInDollars: number
  isOneTime: boolean
}

type GitHubAccountSponsorship = {
  login: string | null
  name: string | null
  avatarUrl: string | null
  bio: string | null
  type: GitHubAccountProfileType
  isPrivate: boolean
  isOneTimePayment: boolean
  createdAt: string | null
  tier: GitHubSponsorshipTier | null
}

type GitHubAccountSponsorshipPage = {
  items: GitHubAccountSponsorship[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
}

type GitHubAccountSponsorsSummary = {
  hasSponsorsListing: boolean
  sponsorsCount: number
  sponsoringCount: number
}

type ListAccountSponsorshipsOptions = {
  login: string
  role: GitHubSponsorshipRole
  page?: number
  perPage?: number
}

type GitHubOrganizationMemberRole = 'member' | 'admin'

type GitHubOrganizationMember = {
  id: number
  login: string
  name: string | null
  avatarUrl: string
  role: GitHubOrganizationMemberRole
  hasTwoFactorEnabled: boolean | null
  isPublic: boolean
}

type GitHubOrganizationPeople = {
  members: GitHubOrganizationMember[]
  totalCount: number
  truncated: boolean
  viewerCanAdminister: boolean
  missingAdminScopes: string[]
}

type GitHubOrganizationInvitationRole = 'direct_member' | 'admin' | 'billing_manager' | (string & {})

type GitHubOrganizationInvitation = {
  id: number
  login: string | null
  email: string | null
  role: GitHubOrganizationInvitationRole
  createdAt: string | null
  inviterLogin: string | null
}

type InviteOrganizationMemberOptions = {
  org: string
  identifier: string
  role: GitHubOrganizationMemberRole
}

type SetOrganizationMemberRoleOptions = {
  org: string
  login: string
  role: GitHubOrganizationMemberRole
}

type OrganizationMemberOptions = {
  org: string
  login: string
}

type CancelOrganizationInvitationOptions = {
  org: string
  invitationId: number
}

type SetOrganizationMembershipVisibilityOptions = {
  org: string
  login: string
  publicized: boolean
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

type GitHubCreatedRepository = {
  owner: string
  name: string
  nameWithOwner: string
  url: string
}

type GitHubLicenseTemplate = {
  key: string
  name: string
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
  viewerCanAdminister: boolean
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

type GitHubSquashMergeCommitTitle = 'PR_TITLE' | 'COMMIT_OR_PR_TITLE'
type GitHubSquashMergeCommitMessage = 'PR_BODY' | 'COMMIT_MESSAGES' | 'BLANK'
type GitHubMergeCommitTitle = 'PR_TITLE' | 'MERGE_MESSAGE'
type GitHubMergeCommitMessage = 'PR_BODY' | 'PR_TITLE' | 'BLANK'

type GitHubRepositoryGeneralSettings = {
  repositoryNodeId: string
  name: string
  description: string | null
  homepage: string | null
  visibility: 'public' | 'private'
  isArchived: boolean
  isTemplate: boolean
  webCommitSignoffRequired: boolean
  defaultBranch: string | null
  topics: string[]
  hasIssues: boolean
  hasWiki: boolean
  hasProjects: boolean
  hasDiscussions: boolean
  hasSponsorships: boolean | null
  allowMergeCommit: boolean
  allowSquashMerge: boolean
  allowRebaseMerge: boolean
  allowAutoMerge: boolean
  deleteBranchOnMerge: boolean
  allowUpdateBranch: boolean
  squashMergeCommitTitle: GitHubSquashMergeCommitTitle | null
  squashMergeCommitMessage: GitHubSquashMergeCommitMessage | null
  mergeCommitTitle: GitHubMergeCommitTitle | null
  mergeCommitMessage: GitHubMergeCommitMessage | null
  immutableReleases: boolean | null
}

type UpdateRepositoryGeneralSettingsInput = {
  name?: string
  description?: string
  homepage?: string
  visibility?: 'public' | 'private'
  archived?: boolean
  isTemplate?: boolean
  webCommitSignoffRequired?: boolean
  defaultBranch?: string
  hasIssues?: boolean
  hasWiki?: boolean
  hasProjects?: boolean
  allowMergeCommit?: boolean
  allowSquashMerge?: boolean
  allowRebaseMerge?: boolean
  allowAutoMerge?: boolean
  deleteBranchOnMerge?: boolean
  allowUpdateBranch?: boolean
  squashMergeCommitTitle?: GitHubSquashMergeCommitTitle
  squashMergeCommitMessage?: GitHubSquashMergeCommitMessage
  mergeCommitTitle?: GitHubMergeCommitTitle
  mergeCommitMessage?: GitHubMergeCommitMessage
}

type GitHubRepositoryCollaboratorRole = 'pull' | 'triage' | 'push' | 'maintain' | 'admin'

type GitHubRepositoryCollaborator = {
  login: string
  avatarUrl: string
  roleName: string
  htmlUrl: string
}

type GitHubRepositoryInvitation = {
  id: number
  inviteeLogin: string | null
  inviteeAvatarUrl: string | null
  permissions: string
  createdAt: string | null
  htmlUrl: string
}

type GitHubRepositoryTeamAccess = {
  slug: string
  name: string
  permission: string
  org: string
}

type GitHubRepositoryAccessOverview = {
  ownerType: 'User' | 'Organization'
  collaborators: GitHubRepositoryCollaborator[]
  invitations: GitHubRepositoryInvitation[]
  teams: GitHubRepositoryTeamAccess[]
}

type GitHubBranchProtectionSummary = {
  branch: string
  requiredReviews: number | null
  requireCodeOwnerReviews: boolean
  requiredStatusChecks: string[] | null
  strictStatusChecks: boolean
  enforceAdmins: boolean
  requiredLinearHistory: boolean
  allowForcePushes: boolean
  allowDeletions: boolean
  requiredConversationResolution: boolean
  lockBranch: boolean
  requiredSignatures: boolean
}

type GitHubRulesetEnforcement = 'active' | 'evaluate' | 'disabled'

type GitHubRepositoryRuleset = {
  id: number
  name: string
  target: string
  enforcement: GitHubRulesetEnforcement
  rules: string[]
  refConditions: string[]
}

type GitHubActionsSelectedActions = {
  githubOwnedAllowed: boolean
  verifiedAllowed: boolean
  patternsAllowed: string[]
}

type GitHubActionsSettings = {
  enabled: boolean
  allowedActions: 'all' | 'local_only' | 'selected' | null
  shaPinningRequired: boolean | null
  defaultWorkflowPermissions: 'read' | 'write' | null
  canApprovePullRequestReviews: boolean | null
  accessLevel: 'none' | 'user' | 'organization' | null
  retentionDays: number | null
  selectedActions: GitHubActionsSelectedActions | null
}

type GitHubSelfHostedRunner = {
  id: number
  name: string
  os: string
  status: string
  busy: boolean
  labels: string[]
}

type GitHubRepositoryWebhook = {
  id: number
  url: string
  contentType: string
  insecureSsl: boolean
  events: string[]
  active: boolean
  lastResponseStatus: string | null
}

type UpsertRepositoryWebhookInput = {
  url: string
  contentType: 'json' | 'form'
  secret?: string
  insecureSsl: boolean
  events: string[]
  active: boolean
}

type GitHubEnvironmentReviewer = {
  type: 'User' | 'Team'
  id: number
  name: string
}

type GitHubEnvironmentBranchPolicyItem = {
  id: number
  name: string
  type: 'branch' | 'tag'
}

type GitHubEnvironmentSettings = {
  name: string
  waitTimer: number
  preventSelfReview: boolean
  reviewers: GitHubEnvironmentReviewer[]
  branchPolicy: 'protected' | 'custom' | 'all'
  customPolicies: GitHubEnvironmentBranchPolicyItem[]
}

type UpsertEnvironmentInput = {
  waitTimer: number
  preventSelfReview: boolean
  reviewers: Array<{ type: 'User' | 'Team'; id: number }>
  branchPolicy: 'protected' | 'custom' | 'all'
}

type GitHubPagesSettings = {
  enabled: boolean
  buildType: 'legacy' | 'workflow' | null
  sourceBranch: string | null
  sourcePath: string | null
  cname: string | null
  httpsEnforced: boolean
  url: string | null
  latestBuildStatus: string | null
}

type GitHubRepositoryCustomPropertyValue = {
  propertyName: string
  value: string | string[] | null
}

type UpdateRepositoryPagesInput = {
  cname?: string | null
  httpsEnforced?: boolean
  buildType?: 'legacy' | 'workflow'
  sourceBranch?: string
  sourcePath?: '/' | '/docs'
}

type GitHubSecurityFeatureStatus = 'enabled' | 'disabled' | 'unavailable'

type GitHubRepositorySecurityOverview = {
  advancedSecurity: GitHubSecurityFeatureStatus
  secretScanning: GitHubSecurityFeatureStatus
  secretScanningPushProtection: GitHubSecurityFeatureStatus
  vulnerabilityAlerts: boolean | null
  automatedSecurityFixes: boolean | null
  privateVulnerabilityReporting: boolean | null
}

type UpdateSecurityAndAnalysisInput = {
  advancedSecurity?: 'enabled' | 'disabled'
  secretScanning?: 'enabled' | 'disabled'
  secretScanningPushProtection?: 'enabled' | 'disabled'
}

type GitHubDeployKey = {
  id: number
  title: string
  key: string
  readOnly: boolean
  createdAt: string | null
}

type GitHubRepositorySecretScope = 'actions' | 'codespaces' | 'dependabot'

type GitHubRepositorySecret = {
  name: string
  updatedAt: string | null
}

type GitHubRepositoryVariable = {
  name: string
  value: string
}

type GitHubRepositoryAutolink = {
  id: number
  keyPrefix: string
  urlTemplate: string
  isAlphanumeric: boolean
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

type GitHubRepositoryContributorSummary = {
  id: number
  login: string
  avatarUrl: string | null
  contributions: number
  type: string
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

type GitHubFeedEventActor = {
  login: string
  avatarUrl: string | null
}

type GitHubFeedEventPayload =
  | { kind: 'star' }
  | { kind: 'fork'; forkFullName: string | null }
  | { kind: 'create'; refType: 'repository' | 'branch' | 'tag'; ref: string | null }
  | { kind: 'delete'; refType: 'branch' | 'tag'; ref: string }
  | { kind: 'push'; branch: string; beforeSha: string; headSha: string; commitCount: number | null; commitMessages: string[] }
  | { kind: 'release'; tagName: string; releaseName: string | null; excerpt: string | null }
  | { kind: 'public' }
  | { kind: 'member'; memberLogin: string | null }
  | { kind: 'issue'; action: string; number: number; title: string; excerpt: string | null }
  | { kind: 'issue-comment'; number: number | null; title: string; isPullRequest: boolean; excerpt: string | null }
  | { kind: 'pull-request'; action: string; number: number; title: string; merged: boolean; excerpt: string | null }
  | { kind: 'pull-request-review'; number: number | null; title: string; excerpt: string | null }
  | { kind: 'pull-request-review-comment'; number: number | null; title: string; excerpt: string | null }
  | { kind: 'commit-comment'; commitSha: string | null; excerpt: string | null }
  | { kind: 'discussion'; title: string | null; excerpt: string | null }
  | { kind: 'wiki'; pageCount: number }
  | { kind: 'sponsorship' }
  | { kind: 'unknown'; type: string }

type GitHubFeedEvent = {
  id: string
  type: string
  actor: GitHubFeedEventActor
  repoFullName: string
  createdAt: string
  payload: GitHubFeedEventPayload
}

type GitHubFeedEventPage = {
  events: GitHubFeedEvent[]
  page: number
  hasMore: boolean
}

type GitHubFeedRepoCard = {
  fullName: string
  description: string | null
  stars: number
  language: string | null
  languageColor: string | null
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

type GitHubReactionUser = {
  login: string
  name?: string | null
  avatarUrl?: string | null
}

type GitHubIssueReaction = {
  content: string
  count: number
  viewerHasReacted?: boolean
  /** First reactors for hover previews; may be shorter than count. */
  reactors?: GitHubReactionUser[]
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
  accounts: AuthAccountSummary[]
  auth: {
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

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error'
  | 'unavailable'

type UpdateState = {
  status: UpdateStatus
  currentVersion: string
  latestVersion: string | null
  progress: number | null
  error: string | null
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

type StoredPins = {
  version: 1
  organizations: Record<string, string[]>
  repositoryPins: Record<string, GitHubAccountRepository[]>
}

type StoredPinsInfo = {
  path: string
  hasContent: boolean
  pins: StoredPins
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
      listStarredLists: (login: string) => Promise<GitHubAccountStarList[]>
      getViewerState: (login: string) => Promise<GitHubAccountViewerState>
      setFollowed: (options: SetAccountFollowedOptions) => Promise<void>
      listFollowers: (login: string) => Promise<GitHubAccountFollowList>
      listFollowing: (login: string) => Promise<GitHubAccountFollowList>
      getSponsorsSummary: (login: string) => Promise<GitHubAccountSponsorsSummary>
      listSponsorships: (options: ListAccountSponsorshipsOptions) => Promise<GitHubAccountSponsorshipPage>
      listOrganizations: () => Promise<GitHubOrganization[]>
      listOrganizationRepositories: (owner: string) => Promise<GitHubRepository[]>
    }
    organizationPeople: {
      getPeople: (org: string) => Promise<GitHubOrganizationPeople>
      listInvitations: (org: string) => Promise<GitHubOrganizationInvitation[]>
      inviteMember: (options: InviteOrganizationMemberOptions) => Promise<void>
      setMemberRole: (options: SetOrganizationMemberRoleOptions) => Promise<void>
      removeMember: (options: OrganizationMemberOptions) => Promise<void>
      cancelInvitation: (options: CancelOrganizationInvitationOptions) => Promise<void>
      setMembershipVisibility: (options: SetOrganizationMembershipVisibilityOptions) => Promise<void>
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
      dispatchWorkflow: (owner: string, repo: string, workflowId: number, ref: string) => Promise<void>
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
    activity: {
      listReceivedEvents: (options?: { page?: number }) => Promise<GitHubFeedEventPage>
      getRepositoryCards: (fullNames: string[]) => Promise<Record<string, GitHubFeedRepoCard | null>>
      getPushCommitCounts: (
        refs: Array<{ key: string; repoFullName: string; before: string; head: string }>,
      ) => Promise<Record<string, number | null>>
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
      getViewerAdmin: (owner: string, repo: string) => Promise<boolean>
      getViewerPush: (owner: string, repo: string) => Promise<boolean>
      getViewerState: (owner: string, repo: string) => Promise<GitHubRepositoryViewerState>
      getNavigationCounts: (owner: string, repo: string) => Promise<GitHubRepositoryNavigationCounts>
      getOverview: (owner: string, repo: string) => Promise<GitHubRepositoryOverview>
      getContributorStats: (owner: string, repo: string) => Promise<GitHubRepositoryContributorStatsResult>
      listContributors: (owner: string, repo: string, perPage?: number) => Promise<GitHubRepositoryContributorSummary[]>
      listStargazers: (owner: string, repo: string) => Promise<GitHubAccountFollowList>
      listWatchers: (owner: string, repo: string) => Promise<GitHubAccountFollowList>
      listForks: (owner: string, repo: string) => Promise<GitHubRepositoryForkList>
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
      create: (options: {
        organization: string | null
        name: string
        description: string | null
        visibility: 'public' | 'private'
        autoInit: boolean
        gitignoreTemplate: string | null
        licenseTemplate: string | null
      }) => Promise<GitHubCreatedRepository>
      listGitignoreTemplates: () => Promise<string[]>
      listLicenses: () => Promise<GitHubLicenseTemplate[]>
    }
    repositorySettings: {
      getGeneral: (owner: string, repo: string) => Promise<GitHubRepositoryGeneralSettings>
      updateGeneral: (
        owner: string,
        repo: string,
        input: UpdateRepositoryGeneralSettingsInput
      ) => Promise<void>
      replaceTopics: (owner: string, repo: string, names: string[]) => Promise<void>
      setDiscussions: (repositoryNodeId: string, enabled: boolean) => Promise<void>
      setSponsorships: (repositoryNodeId: string, enabled: boolean) => Promise<void>
      setImmutableReleases: (owner: string, repo: string, enabled: boolean) => Promise<void>
      transfer: (owner: string, repo: string, newOwner: string, newName?: string) => Promise<void>
      deleteRepository: (owner: string, repo: string) => Promise<void>
      access: {
        getOverview: (owner: string, repo: string) => Promise<GitHubRepositoryAccessOverview>
        addCollaborator: (
          owner: string,
          repo: string,
          username: string,
          permission: GitHubRepositoryCollaboratorRole
        ) => Promise<'invited' | 'added'>
        removeCollaborator: (owner: string, repo: string, username: string) => Promise<void>
        updateInvitation: (
          owner: string,
          repo: string,
          invitationId: number,
          permissions: string
        ) => Promise<void>
        cancelInvitation: (owner: string, repo: string, invitationId: number) => Promise<void>
        setTeam: (
          org: string,
          teamSlug: string,
          owner: string,
          repo: string,
          permission: string
        ) => Promise<void>
        removeTeam: (org: string, teamSlug: string, owner: string, repo: string) => Promise<void>
        getInteractionLimits: (owner: string, repo: string) => Promise<GitHubInteractionLimits | null>
        setInteractionLimits: (
          owner: string,
          repo: string,
          limit: GitHubInteractionLimitGroup,
          expiry?: GitHubInteractionLimitExpiry
        ) => Promise<void>
        clearInteractionLimits: (owner: string, repo: string) => Promise<void>
      }
      automation: {
        listProtectedBranches: (owner: string, repo: string) => Promise<GitHubBranchProtectionSummary[]>
        deleteBranchProtection: (owner: string, repo: string, branch: string) => Promise<void>
        listRulesets: (owner: string, repo: string) => Promise<GitHubRepositoryRuleset[]>
        setRulesetEnforcement: (
          owner: string,
          repo: string,
          rulesetId: number,
          enforcement: GitHubRulesetEnforcement
        ) => Promise<void>
        deleteRuleset: (owner: string, repo: string, rulesetId: number) => Promise<void>
        getActionsSettings: (owner: string, repo: string) => Promise<GitHubActionsSettings>
        updateActionsPermissions: (
          owner: string,
          repo: string,
          enabled: boolean,
          allowedActions?: 'all' | 'local_only' | 'selected'
        ) => Promise<void>
        updateSelectedActions: (
          owner: string,
          repo: string,
          githubOwnedAllowed: boolean,
          verifiedAllowed: boolean,
          patternsAllowed: string[]
        ) => Promise<void>
        updateWorkflowPermissions: (
          owner: string,
          repo: string,
          defaultWorkflowPermissions: 'read' | 'write',
          canApprovePullRequestReviews: boolean
        ) => Promise<void>
        updateAccessLevel: (
          owner: string,
          repo: string,
          accessLevel: 'none' | 'user' | 'organization'
        ) => Promise<void>
        updateRetention: (owner: string, repo: string, days: number) => Promise<void>
        listRunners: (owner: string, repo: string) => Promise<GitHubSelfHostedRunner[]>
        deleteRunner: (owner: string, repo: string, runnerId: number) => Promise<void>
        listWebhooks: (owner: string, repo: string) => Promise<GitHubRepositoryWebhook[]>
        createWebhook: (owner: string, repo: string, input: UpsertRepositoryWebhookInput) => Promise<void>
        updateWebhook: (
          owner: string,
          repo: string,
          hookId: number,
          input: UpsertRepositoryWebhookInput
        ) => Promise<void>
        deleteWebhook: (owner: string, repo: string, hookId: number) => Promise<void>
        pingWebhook: (owner: string, repo: string, hookId: number) => Promise<void>
        listEnvironments: (owner: string, repo: string) => Promise<GitHubEnvironmentSettings[]>
        upsertEnvironment: (
          owner: string,
          repo: string,
          environmentName: string,
          input: UpsertEnvironmentInput
        ) => Promise<void>
        deleteEnvironment: (owner: string, repo: string, environmentName: string) => Promise<void>
        createEnvironmentBranchPolicy: (
          owner: string,
          repo: string,
          environmentName: string,
          name: string,
          type: 'branch' | 'tag'
        ) => Promise<void>
        deleteEnvironmentBranchPolicy: (
          owner: string,
          repo: string,
          environmentName: string,
          branchPolicyId: number
        ) => Promise<void>
        getPages: (owner: string, repo: string) => Promise<GitHubPagesSettings>
        enablePages: (
          owner: string,
          repo: string,
          buildType: 'legacy' | 'workflow',
          sourceBranch?: string,
          sourcePath?: '/' | '/docs'
        ) => Promise<void>
        updatePages: (owner: string, repo: string, input: UpdateRepositoryPagesInput) => Promise<void>
        disablePages: (owner: string, repo: string) => Promise<void>
        requestPagesBuild: (owner: string, repo: string) => Promise<void>
        getCustomProperties: (owner: string, repo: string) => Promise<GitHubRepositoryCustomPropertyValue[]>
        updateCustomProperties: (
          owner: string,
          repo: string,
          values: GitHubRepositoryCustomPropertyValue[]
        ) => Promise<void>
      }
      security: {
        getOverview: (owner: string, repo: string) => Promise<GitHubRepositorySecurityOverview>
        updateAnalysis: (owner: string, repo: string, input: UpdateSecurityAndAnalysisInput) => Promise<void>
        setVulnerabilityAlerts: (owner: string, repo: string, enabled: boolean) => Promise<void>
        setAutomatedSecurityFixes: (owner: string, repo: string, enabled: boolean) => Promise<void>
        setPrivateVulnerabilityReporting: (owner: string, repo: string, enabled: boolean) => Promise<void>
        listDeployKeys: (owner: string, repo: string) => Promise<GitHubDeployKey[]>
        addDeployKey: (
          owner: string,
          repo: string,
          title: string,
          key: string,
          readOnly: boolean
        ) => Promise<void>
        deleteDeployKey: (owner: string, repo: string, keyId: number) => Promise<void>
        listSecrets: (
          owner: string,
          repo: string,
          scope: GitHubRepositorySecretScope
        ) => Promise<GitHubRepositorySecret[]>
        upsertSecret: (
          owner: string,
          repo: string,
          scope: GitHubRepositorySecretScope,
          name: string,
          value: string
        ) => Promise<void>
        deleteSecret: (
          owner: string,
          repo: string,
          scope: GitHubRepositorySecretScope,
          name: string
        ) => Promise<void>
        listVariables: (owner: string, repo: string) => Promise<GitHubRepositoryVariable[]>
        createVariable: (owner: string, repo: string, name: string, value: string) => Promise<void>
        updateVariable: (owner: string, repo: string, name: string, value: string) => Promise<void>
        deleteVariable: (owner: string, repo: string, name: string) => Promise<void>
      }
      integrations: {
        listAutolinks: (owner: string, repo: string) => Promise<GitHubRepositoryAutolink[]>
        createAutolink: (
          owner: string,
          repo: string,
          keyPrefix: string,
          urlTemplate: string,
          isAlphanumeric: boolean
        ) => Promise<void>
        deleteAutolink: (owner: string, repo: string, autolinkId: number) => Promise<void>
      }
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
      switchAccount: (accountId: number) => Promise<AuthState>
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
    pins: {
      get: () => Promise<StoredPinsInfo>
      setOrganizationPins: (payload: {
        login: string
        organizations: string[]
      }) => Promise<StoredPinsInfo>
      setRepositoryPins: (payload: {
        login: string
        repositories: GitHubAccountRepository[]
      }) => Promise<StoredPinsInfo>
    }
    userSettings: {
      getProfile: () => Promise<GitHubUserSettingsProfile>
      updateProfile: (input: UpdateUserSettingsProfileInput) => Promise<GitHubUserSettingsProfile>
      listSocialAccounts: () => Promise<GitHubSocialAccount[]>
      addSocialAccounts: (urls: string[]) => Promise<GitHubSocialAccount[]>
      deleteSocialAccounts: (urls: string[]) => Promise<void>
      listEmails: () => Promise<GitHubUserEmail[]>
      addEmail: (email: string) => Promise<void>
      deleteEmail: (email: string) => Promise<void>
      setPrimaryEmailVisibility: (visibility: 'public' | 'private') => Promise<void>
      listSshKeys: () => Promise<GitHubSshKey[]>
      addSshKey: (title: string, key: string) => Promise<GitHubSshKey>
      deleteSshKey: (keyId: number) => Promise<void>
      listGpgKeys: () => Promise<GitHubGpgKey[]>
      addGpgKey: (key: string, name?: string) => Promise<GitHubGpgKey>
      deleteGpgKey: (keyId: number) => Promise<void>
      listSshSigningKeys: () => Promise<GitHubSshKey[]>
      addSshSigningKey: (title: string, key: string) => Promise<GitHubSshKey>
      deleteSshSigningKey: (keyId: number) => Promise<void>
      listBlockedUsers: () => Promise<GitHubBlockedUser[]>
      blockUser: (username: string) => Promise<void>
      unblockUser: (username: string) => Promise<void>
      getInteractionLimits: () => Promise<GitHubInteractionLimits | null>
      setInteractionLimits: (
        limit: GitHubInteractionLimitGroup,
        expiry?: GitHubInteractionLimitExpiry
      ) => Promise<GitHubInteractionLimits | null>
      clearInteractionLimits: () => Promise<void>
      listOrganizationMemberships: () => Promise<GitHubOrganizationMembership[]>
      acceptOrganizationInvitation: (org: string) => Promise<void>
      setOrganizationMembershipVisibility: (org: string, isPublic: boolean) => Promise<void>
      listCodespacesSecrets: () => Promise<GitHubCodespacesSecret[]>
      upsertCodespacesSecret: (input: UpsertCodespacesSecretInput) => Promise<void>
      deleteCodespacesSecret: (name: string) => Promise<void>
      listSavedReplies: () => Promise<GitHubSavedReply[]>
    }
    links: {
      openGitHubUrl: (url: string) => Promise<void>
      openExternalUrl: (url: string) => Promise<void>
    }
    updates: {
      getInfo: () => Promise<{ version: string; platform: string }>
      getState: () => Promise<UpdateState>
      checkForUpdate: () => Promise<UpdateState>
      downloadUpdate: () => Promise<UpdateState>
      installUpdate: () => Promise<UpdateState>
      onStatusChange: (listener: (state: UpdateState) => void) => () => void
    }
    windowControls: {
      getState: () => Promise<WindowControlsState>
      onFullscreenChange: (listener: (state: WindowControlsState) => void) => () => void
    }
    tray: {
      onNavigate: (listener: (url: string) => void) => () => void
      onOpenNotification: (
        listener: (payload: {
          repositoryFullName: string
          number?: number
          subjectType: string
          htmlUrl: string
        }) => void
      ) => () => void
      onOpenSearch: (listener: () => void) => () => void
    }
  }
}
