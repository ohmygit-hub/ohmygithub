export type GitHubItemKind = 'notification' | 'pull_request' | 'issue' | 'action'

export type GitHubItemState = 'open' | 'closed' | 'merged' | 'failed' | 'success' | 'unread'

export interface GitHubActor {
  login: string
  avatarUrl?: string
  isBot?: boolean
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

export type GitHubAccountProfileType = 'User' | 'Organization' | 'Bot' | (string & {})

export interface GitHubAccountProfile {
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

export interface GitHubAccountSocialAccount {
  provider: string
  displayName: string
  url: string
}

export interface GitHubAccountRepository {
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

export interface GitHubAccountRepositoryPage {
  items: GitHubAccountRepository[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
  incompleteResults: boolean
}

export interface GitHubAccountStarList {
  name: string
  slug: string
  description: string | null
  isPrivate: boolean
  itemsCount: number
}

export interface GitHubAccountContributionDay {
  date: string
  contributionCount: number
  color: string
  weekday: number
}

export interface GitHubAccountContributionWeek {
  firstDay: string
  days: GitHubAccountContributionDay[]
}

export interface GitHubAccountContributionYear {
  year: number
  totalContributions: number
  restrictedContributionsCount: number
  commitContributions: number
  issueContributions: number
  pullRequestContributions: number
  pullRequestReviewContributions: number
  weeks: GitHubAccountContributionWeek[]
}

export interface GitHubAccountOverview {
  profile: GitHubAccountProfile
  organizations: GitHubOrganization[]
  socialAccounts: GitHubAccountSocialAccount[]
  pinnedRepositories: GitHubAccountRepository[]
  readme: GitHubRepositoryDocument | null
  contributionYears: number[]
}

export interface GitHubAccountViewerState {
  isFollowing: boolean
  missingScopes: string[]
}

export interface GitHubAccountFollowUser {
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

export interface GitHubAccountFollowList {
  items: GitHubAccountFollowUser[]
  totalCount: number
  truncated: boolean
}

export type GitHubSponsorshipRole = 'maintainer' | 'sponsor'

export interface GitHubSponsorshipTier {
  name: string
  monthlyPriceInDollars: number
  isOneTime: boolean
}

export interface GitHubAccountSponsorship {
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

export interface GitHubAccountSponsorshipPage {
  items: GitHubAccountSponsorship[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
}

export interface GitHubAccountSponsorsSummary {
  hasSponsorsListing: boolean
  sponsorsCount: number
  sponsoringCount: number
}

export type GitHubOrganizationMemberRole = 'member' | 'admin'

export interface GitHubOrganizationMember {
  id: number
  login: string
  name: string | null
  avatarUrl: string
  role: GitHubOrganizationMemberRole
  hasTwoFactorEnabled: boolean | null
  isPublic: boolean
}

export interface GitHubOrganizationPeople {
  members: GitHubOrganizationMember[]
  totalCount: number
  truncated: boolean
  viewerCanAdminister: boolean
}

export type GitHubOrganizationInvitationRole = 'direct_member' | 'admin' | 'billing_manager' | (string & {})

export interface GitHubOrganizationInvitation {
  id: number
  login: string | null
  email: string | null
  role: GitHubOrganizationInvitationRole
  createdAt: string | null
  inviterLogin: string | null
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
  starCount?: number
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

export type GitHubRepositorySubscription = 'participating' | 'all' | 'ignore'

export interface GitHubRepositoryViewerState {
  isStarred: boolean
  isWatching: boolean
  subscription: GitHubRepositorySubscription
  starCount: number
}

export interface GitHubForkedRepository {
  owner: string
  name: string
  nameWithOwner: string
  url: string
  ready: boolean
}

export interface GitHubCreatedRepository {
  owner: string
  name: string
  nameWithOwner: string
  url: string
}

export interface GitHubLicenseTemplate {
  key: string
  name: string
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

export interface GitHubRepositoryForkItem {
  id: number
  owner: string
  ownerAvatarUrl: string
  name: string
  fullName: string
  description: string | null
  stars: number
  pushedAt: string | null
}

export interface GitHubRepositoryForkList {
  items: GitHubRepositoryForkItem[]
  totalCount: number
  truncated: boolean
}

export interface GitHubRepositoryOverviewCounts {
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

export type GitHubRepositoryNavigationCounts = Pick<
  GitHubRepositoryOverviewCounts,
  'commits' | 'openIssues' | 'openPullRequests'
>

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

export type GitHubSquashMergeCommitTitle = 'PR_TITLE' | 'COMMIT_OR_PR_TITLE'
export type GitHubSquashMergeCommitMessage = 'PR_BODY' | 'COMMIT_MESSAGES' | 'BLANK'
export type GitHubMergeCommitTitle = 'PR_TITLE' | 'MERGE_MESSAGE'
export type GitHubMergeCommitMessage = 'PR_BODY' | 'PR_TITLE' | 'BLANK'

export interface GitHubRepositoryGeneralSettings {
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

export interface UpdateRepositoryGeneralSettingsInput {
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

export interface TransferRepositoryOptions extends RepositoryOptions {
  newOwner: string
  newName?: string
}

export interface SetRepositoryFeatureNodeOptions {
  repositoryNodeId: string
  enabled: boolean
}

export type GitHubRepositoryCollaboratorRole = 'pull' | 'triage' | 'push' | 'maintain' | 'admin'

export interface GitHubRepositoryCollaborator {
  login: string
  avatarUrl: string
  roleName: string
  htmlUrl: string
}

export interface GitHubRepositoryInvitation {
  id: number
  inviteeLogin: string | null
  inviteeAvatarUrl: string | null
  permissions: string
  createdAt: string | null
  htmlUrl: string
}

export interface GitHubRepositoryTeamAccess {
  slug: string
  name: string
  permission: string
  org: string
}

export interface GitHubRepositoryAccessOverview {
  ownerType: 'User' | 'Organization'
  collaborators: GitHubRepositoryCollaborator[]
  invitations: GitHubRepositoryInvitation[]
  teams: GitHubRepositoryTeamAccess[]
}

export interface GitHubBranchProtectionSummary {
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

export type GitHubRulesetEnforcement = 'active' | 'evaluate' | 'disabled'

export interface GitHubRepositoryRuleset {
  id: number
  name: string
  target: string
  enforcement: GitHubRulesetEnforcement
  rules: string[]
  refConditions: string[]
}

export interface GitHubActionsSelectedActions {
  githubOwnedAllowed: boolean
  verifiedAllowed: boolean
  patternsAllowed: string[]
}

export interface GitHubActionsSettings {
  enabled: boolean
  allowedActions: 'all' | 'local_only' | 'selected' | null
  shaPinningRequired: boolean | null
  defaultWorkflowPermissions: 'read' | 'write' | null
  canApprovePullRequestReviews: boolean | null
  accessLevel: 'none' | 'user' | 'organization' | null
  retentionDays: number | null
  selectedActions: GitHubActionsSelectedActions | null
}

export interface GitHubSelfHostedRunner {
  id: number
  name: string
  os: string
  status: string
  busy: boolean
  labels: string[]
}

export interface GitHubRepositoryWebhook {
  id: number
  url: string
  contentType: string
  insecureSsl: boolean
  events: string[]
  active: boolean
  lastResponseStatus: string | null
}

export interface UpsertRepositoryWebhookInput {
  url: string
  contentType: 'json' | 'form'
  secret?: string
  insecureSsl: boolean
  events: string[]
  active: boolean
}

export interface GitHubEnvironmentReviewer {
  type: 'User' | 'Team'
  id: number
  name: string
}

export interface GitHubEnvironmentBranchPolicyItem {
  id: number
  name: string
  type: 'branch' | 'tag'
}

export interface GitHubEnvironmentSettings {
  name: string
  waitTimer: number
  preventSelfReview: boolean
  reviewers: GitHubEnvironmentReviewer[]
  branchPolicy: 'protected' | 'custom' | 'all'
  customPolicies: GitHubEnvironmentBranchPolicyItem[]
}

export interface UpsertEnvironmentInput {
  waitTimer: number
  preventSelfReview: boolean
  reviewers: Array<{ type: 'User' | 'Team'; id: number }>
  branchPolicy: 'protected' | 'custom' | 'all'
}

export interface GitHubPagesSettings {
  enabled: boolean
  buildType: 'legacy' | 'workflow' | null
  sourceBranch: string | null
  sourcePath: string | null
  cname: string | null
  httpsEnforced: boolean
  url: string | null
  latestBuildStatus: string | null
}

export interface GitHubRepositoryCustomPropertyValue {
  propertyName: string
  value: string | string[] | null
}

export type GitHubSecurityFeatureStatus = 'enabled' | 'disabled' | 'unavailable'

export interface GitHubRepositorySecurityOverview {
  advancedSecurity: GitHubSecurityFeatureStatus
  secretScanning: GitHubSecurityFeatureStatus
  secretScanningPushProtection: GitHubSecurityFeatureStatus
  vulnerabilityAlerts: boolean | null
  automatedSecurityFixes: boolean | null
  privateVulnerabilityReporting: boolean | null
}

export interface UpdateSecurityAndAnalysisInput {
  advancedSecurity?: 'enabled' | 'disabled'
  secretScanning?: 'enabled' | 'disabled'
  secretScanningPushProtection?: 'enabled' | 'disabled'
}

export interface GitHubDeployKey {
  id: number
  title: string
  key: string
  readOnly: boolean
  createdAt: string | null
}

export type GitHubRepositorySecretScope = 'actions' | 'codespaces' | 'dependabot'

export interface GitHubRepositorySecret {
  name: string
  updatedAt: string | null
}

export interface GitHubRepositoryVariable {
  name: string
  value: string
}

export interface GitHubRepositoryAutolink {
  id: number
  keyPrefix: string
  urlTemplate: string
  isAlphanumeric: boolean
}

export interface GitHubRepositoryContributorSummary {
  id: number
  login: string
  avatarUrl: string | null
  contributions: number
  type: string
}

export interface GitHubContributorStatsAuthor {
  id: number
  login: string
  avatarUrl: string | null
  type: string
}

/** Sparse: only weeks with activity are included. w = unix seconds, week start (Sunday UTC). */
export interface GitHubContributorStatsWeek {
  w: number
  a: number
  d: number
  c: number
}

export interface GitHubRepositoryContributorStats {
  author: GitHubContributorStatsAuthor
  /** Commits on the default branch, excluding merge and empty commits. */
  total: number
  weeks: GitHubContributorStatsWeek[]
}

export interface GitHubRepositoryContributorStatsResult {
  /** Sorted descending by total. Max 100 entries (GitHub API limit); anonymous authors are dropped. */
  contributors: GitHubRepositoryContributorStats[]
  firstWeek: number | null
  lastWeek: number | null
  /** false when GitHub omits line counts (repositories with 10,000+ commits report 0 additions/deletions). */
  hasLineStats: boolean
}

/** Thrown (as Error message) when GitHub still responds 202 after polling; callers should retry later. */
export const CONTRIBUTOR_STATS_PENDING = 'github_contributor_stats_pending'

export type GitHubRepositoryFileNodeType = 'tree' | 'file'

export interface GitHubRepositoryFileNode {
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

export type GitHubActionWorkflowState =
  | 'active'
  | 'deleted'
  | 'disabled_fork'
  | 'disabled_inactivity'
  | 'disabled_manually'
  | (string & {})

export type GitHubActionRunStatus =
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'waiting'
  | 'requested'
  | 'pending'
  | (string & {})

export type GitHubActionConclusion =
  | 'success'
  | 'failure'
  | 'neutral'
  | 'cancelled'
  | 'skipped'
  | 'timed_out'
  | 'action_required'
  | 'stale'
  | (string & {})

export interface GitHubActionWorkflow {
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

export interface GitHubActionRun {
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

export interface GitHubActionRunPage {
  items: GitHubActionRun[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
}

export interface GitHubActionStep {
  number: number
  name: string
  status: GitHubActionRunStatus | null
  conclusion: GitHubActionConclusion | null
  startedAt: string | null
  completedAt: string | null
}

export interface GitHubActionJob {
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

export interface GitHubActionJobLogStep {
  number: number | null
  title: string
  content: string
}

export interface GitHubActionJobLog {
  jobId: number
  content: string
  fetchedAt: string
  isAvailable: boolean
  steps?: GitHubActionJobLogStep[]
}

export type GitHubDeploymentState =
  | 'error'
  | 'failure'
  | 'inactive'
  | 'in_progress'
  | 'queued'
  | 'pending'
  | 'success'

export interface GitHubDeploymentStatus {
  id: number
  state: GitHubDeploymentState
  description: string
  environmentUrl: string | null
  logUrl: string | null
  creator: GitHubActor | null
  createdAt: string
}

export interface GitHubDeployment {
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

export interface GitHubEnvironmentProtectionRule {
  id: number
  type: string
  waitTimer: number | null
  reviewerCount: number | null
}

export interface GitHubEnvironment {
  id: number
  name: string
  htmlUrl: string | null
  createdAt: string | null
  updatedAt: string | null
  protectionRules: GitHubEnvironmentProtectionRule[]
}

export interface GitHubDeploymentPage {
  items: GitHubDeployment[]
  totalCount: number | null
  page: number
  perPage: number
  hasNextPage: boolean
}

export interface GitHubEnvironmentPage {
  items: GitHubEnvironment[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
}

export type GitHubPackageType = 'npm' | 'maven' | 'rubygems' | 'docker' | 'nuget' | 'container'
export type GitHubPackageVisibility = 'public' | 'private' | 'internal'

export interface GitHubPackage {
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

export interface GitHubPackageVersion {
  id: number
  name: string
  htmlUrl: string | null
  description: string | null
  containerTags: string[]
  createdAt: string
  updatedAt: string
}

export interface GitHubPackagePage {
  items: GitHubPackage[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
  failedTypes: GitHubPackageType[]
  truncated: boolean
}

export interface GitHubPackageVersionPage {
  items: GitHubPackageVersion[]
  totalCount: number | null
  page: number
  perPage: number
  hasNextPage: boolean
}

export interface ListRepositoryPackagesOptions extends RepositoryOptions {
  page?: number
  perPage?: number
}

export interface ListPackageVersionsOptions {
  owner: string
  packageType: GitHubPackageType
  packageName: string
  page?: number
  perPage?: number
}

export interface PackageTargetOptions {
  owner: string
  packageType: GitHubPackageType
  packageName: string
}

export interface PackageVersionTargetOptions extends PackageTargetOptions {
  versionId: number
}

export type GitHubPullRequestState =
  | 'draft'
  | 'merged'
  | 'open'
  | 'closed'

export type GitHubPullRequestSearchState = 'open' | 'closed' | 'all'

export type GitHubPullRequestReviewDecision =
  | 'approved'
  | 'changes_requested'
  | 'review_required'

export type GitHubPullRequestReviewState =
  | 'approved'
  | 'changes_requested'
  | 'commented'
  | 'dismissed'
  | 'pending'

export type GitHubPullRequestReviewerType =
  | 'user'
  | 'team'
  | 'mannequin'
  | 'unknown'

export type GitHubPullRequestMergeMethod =
  | 'merge'
  | 'squash'
  | 'rebase'

export type GitHubIssueState =
  | 'open'
  | 'completed'
  | 'not_planned'

export type GitHubIssueUpdateState = 'open' | 'closed'

export type GitHubIssueStateReason =
  | 'completed'
  | 'not_planned'

export type GitHubIssueSearchState = 'open' | 'closed' | 'all'

export type GitHubRepositoryReferenceKind = 'issue' | 'pull-request'

export type GitHubRepositoryReferenceState = GitHubIssueState | GitHubPullRequestState

export type GitHubRepositoryReferenceResolution =
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

export type GitHubPullRequestCategory =
  | 'created-by-me'
  | 'needs-review'
  | 'inbox'
  | 'mentioned-me'

export type GitHubIssueCategory =
  | 'created-by-me'
  | 'inbox'
  | 'mentioned-me'

export interface GitHubLabel {
  name: string
  color: string
  description: string | null
}

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
  labels: GitHubLabel[]
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

export interface GitHubPullRequestBranch {
  name: string
  repository: string | null
  url: string | null
}

export interface GitHubPullRequestDiffStats {
  additions: number
  deletions: number
  changedFiles: number
}

export interface GitHubPullRequestStatusSummary {
  ciState: GitHubCiState | null
  checksUrl: string | null
  mergeStateStatus: string | null
  mergeable: string | null
}

export interface GitHubPullRequestMergePolicy {
  methods: GitHubPullRequestMergeMethod[]
  defaultMethod: GitHubPullRequestMergeMethod | null
}

export interface GitHubPullRequestReviewRequest {
  id: string
  reviewer: GitHubActor
  reviewerType: GitHubPullRequestReviewerType
  asCodeOwner: boolean
}

export interface GitHubPullRequestReviewSummary {
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

export interface GitHubPullRequestLinkedIssue {
  id: string
  owner: string
  repo: string
  repository: string
  number: number
  title: string
  state: GitHubIssueState
  url: string
}

export interface GitHubPullRequestCommitSummary {
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
  labels: GitHubLabel[]
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

export type GitHubReactionContent =
  | 'thumbs-up'
  | 'thumbs-down'
  | 'laugh'
  | 'hooray'
  | 'confused'
  | 'heart'
  | 'rocket'
  | 'eyes'

export interface GitHubReactionUser {
  login: string
  name?: string | null
  avatarUrl?: string | null
}

export interface GitHubIssueReaction {
  content: string
  count: number
  viewerHasReacted?: boolean
  /** First reactors for hover previews; may be shorter than count. */
  reactors?: GitHubReactionUser[]
}

export interface SetReactionOptions {
  subjectId: string
  content: GitHubReactionContent
  reacted: boolean
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

export interface GitHubIssueType {
  name: string
  color: string | null
  description: string | null
}

export interface GitHubIssueLinkedRef {
  id: string
  number: number
  title: string | null
  state: string | null
  url: string | null
}

export interface GitHubIssueDevelopment {
  branches: number | null
  commits: number | null
  pullRequests: GitHubIssueLinkedRef[]
}

export interface GitHubIssueRelationships {
  parent: GitHubIssueLinkedRef | null
  subIssues: GitHubIssueLinkedRef[]
  tracked: GitHubIssueLinkedRef[]
}

export interface GitHubIssueProjectField {
  name: string
  value: string
}

export interface GitHubIssueProjectItem {
  id: string
  title: string
  url: string | null
  fields: GitHubIssueProjectField[]
}

export type GitHubIssueSubscription = 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'IGNORED'

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
  labels: GitHubLabel[]
  issueType: GitHubIssueType | null
  relationships: GitHubIssueRelationships
  projects: GitHubIssueProjectItem[]
  assignees: GitHubActor[]
  milestone: GitHubIssueMilestone | null
  participants: GitHubActor[]
  comments: GitHubIssueComment[]
  timelineEvents: GitHubIssueTimelineEvent[]
  reactions: GitHubIssueReaction[]
  development: GitHubIssueDevelopment | null
  url: string
  hasUpdates: boolean
  viewerCanUpdate: boolean
  viewerCanClose: boolean
  viewerCanReopen: boolean
  nodeId: string
  locked: boolean
  isPinned: boolean
  viewerSubscription: GitHubIssueSubscription | null
}

export type GitHubPullRequestTimelineEventType =
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

export interface GitHubPullRequestTimelineReference {
  type: string
  repository?: string
  number?: number
  title?: string
  url?: string | null
}

export interface GitHubPullRequestReviewComment {
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

export interface GitHubPullRequestTimelineEvent {
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

export type GitHubPullRequestComment = GitHubIssueComment

export interface GitHubPullRequestDetail {
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
  viewerSubscription: GitHubIssueSubscription | null
  projects: GitHubIssueProjectItem[]
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
  labels: GitHubLabel[]
  summary: string
  url?: string
}

export type GitHubNotificationReason =
  | 'assign'
  | 'author'
  | 'comment'
  | 'ci_activity'
  | 'invitation'
  | 'manual'
  | 'mention'
  | 'review_requested'
  | 'security_alert'
  | 'security_advisory_credit'
  | 'state_change'
  | 'subscribed'
  | 'team_mention'
  | 'approval_requested'
  | (string & {})

export interface GitHubNotification {
  id: string
  unread: boolean
  reason: GitHubNotificationReason
  updatedAt: string
  subjectType: string
  subjectTitle: string
  repositoryFullName: string
  repositoryHtmlUrl: string
  number?: number
  htmlUrl: string
}

export interface ListNotificationsOptions {
  all?: boolean
  participating?: boolean
  limit?: number
}

export interface GitHubClient {
  listNotifications(): Promise<GitHubWorkspaceItem[]>
  listPullRequests(): Promise<GitHubWorkspaceItem[]>
  listIssues(): Promise<GitHubWorkspaceItem[]>
  listPullRequestCategory(options: ListPullRequestCategoryOptions): Promise<GitHubPullRequest[]>
  listViewerPullRequests(options?: ListWorkspaceItemsOptions): Promise<GitHubPullRequest[]>
  listRepositoryPullRequests(options: ListRepositoryWorkspaceItemsOptions): Promise<GitHubPullRequest[]>
  searchRepositoryPullRequests(options: SearchRepositoryPullRequestsOptions): Promise<GitHubPullRequestSearchResult>
  getPullRequestDetail(options: GetPullRequestDetailOptions): Promise<GitHubPullRequestDetail>
  createPullRequestComment(options: CreatePullRequestCommentOptions): Promise<GitHubPullRequestComment>
  updatePullRequest(options: UpdatePullRequestOptions): Promise<void>
  closePullRequest(options: ClosePullRequestOptions): Promise<void>
  requestPullRequestReviewers(options: RequestPullRequestReviewersOptions): Promise<void>
  markPullRequestReadyForReview(options: MarkPullRequestReadyForReviewOptions): Promise<void>
  mergePullRequest(options: MergePullRequestOptions): Promise<void>
  updatePullRequestComment(options: UpdatePullRequestCommentOptions): Promise<void>
  listPullRequestFiles(options: GetPullRequestDetailOptions): Promise<GitHubCommitFile[]>
  listPullRequestCommits(options: ListPullRequestCommitsOptions): Promise<GitHubRepositoryCommitPage>
  submitPullRequestReview(options: SubmitPullRequestReviewOptions): Promise<void>
  listIssueCategory(options: ListIssueCategoryOptions): Promise<GitHubIssue[]>
  listViewerIssues(options?: ListWorkspaceItemsOptions): Promise<GitHubIssue[]>
  listRepositoryIssues(options: ListRepositoryWorkspaceItemsOptions): Promise<GitHubIssue[]>
  searchRepositoryIssues(options: SearchRepositoryIssuesOptions): Promise<GitHubIssueSearchResult>
  getIssueDetail(options: GetIssueDetailOptions): Promise<GitHubIssueDetail>
  createIssueComment(options: CreateIssueCommentOptions): Promise<GitHubIssueComment>
  listRepositoryLabels(options: RepositoryOptions): Promise<GitHubLabel[]>
  listRepositoryMilestones(options: RepositoryOptions): Promise<GitHubIssueMilestone[]>
  listAssignableUsers(options: RepositoryOptions): Promise<GitHubActor[]>
  updateIssue(options: UpdateIssueOptions): Promise<void>
  updateIssueComment(options: UpdateIssueCommentOptions): Promise<void>
  setIssueSubscription(options: SetIssueSubscriptionOptions): Promise<void>
  setIssueLock(options: SetIssueLockOptions): Promise<void>
  setIssuePinned(options: SetIssuePinnedOptions): Promise<void>
  deleteIssue(options: DeleteIssueOptions): Promise<void>
  setReaction(options: SetReactionOptions): Promise<void>
  getAccountProfile(login: string): Promise<GitHubAccountProfile>
  getAccountOverview(login: string): Promise<GitHubAccountOverview>
  getAccountContributions(options: AccountContributionsOptions): Promise<GitHubAccountContributionYear>
  listAccountRepositories(options: ListAccountRepositoriesOptions): Promise<GitHubAccountRepositoryPage>
  listAccountStarredRepositories(options: ListAccountRepositoriesOptions): Promise<GitHubAccountRepositoryPage>
  listAccountStarredLists(login: string): Promise<GitHubAccountStarList[]>
  getAccountViewerState(login: string): Promise<GitHubAccountViewerState>
  setAccountFollowed(options: SetAccountFollowedOptions): Promise<void>
  listViewerOrganizations(): Promise<GitHubOrganization[]>
  listOrganizationRepositories(owner: string): Promise<GitHubRepository[]>
  listAllViewerRepositories(): Promise<GitHubRepository[]>
  resolveWorkspaceGoto(input: string): Promise<GitHubWorkspaceGotoResult>
  resolveRepositoryReference(options: ResolveRepositoryReferenceOptions): Promise<GitHubRepositoryReferenceResolution>
  searchWorkspace(options: SearchWorkspaceOptions): Promise<GitHubWorkspaceSearchResult>
  getRepositoryViewerState(options: RepositoryOptions): Promise<GitHubRepositoryViewerState>
  getRepositoryNavigationCounts(options: RepositoryOptions): Promise<GitHubRepositoryNavigationCounts>
  getRepositoryOverview(options: RepositoryOptions): Promise<GitHubRepositoryOverview>
  getRepositoryContributorStats(options: RepositoryContributorStatsOptions): Promise<GitHubRepositoryContributorStatsResult>
  listRepositoryContributors(options: ListRepositoryContributorsOptions): Promise<GitHubRepositoryContributorSummary[]>
  listRepositoryFiles(options: RepositoryFilesOptions): Promise<GitHubRepositoryFileTree>
  listRepositoryCommits(options: RepositoryCommitsOptions): Promise<GitHubRepositoryCommitPage>
  listRepositoryBranches(options: RepositoryBranchesOptions): Promise<GitHubRepositoryBranch[]>
  listRepositoryBranchesDetailed(options: ListRepositoryBranchesDetailedOptions): Promise<GitHubBranchPage>
  listRepositoryTags(options: ListRepositoryTagsOptions): Promise<GitHubTagPage>
  createRepositoryBranch(options: CreateRepositoryBranchOptions): Promise<GitHubCreatedRef>
  renameRepositoryBranch(options: RenameRepositoryBranchOptions): Promise<void>
  deleteRepositoryBranch(options: DeleteRepositoryBranchOptions): Promise<void>
  createRepositoryTag(options: CreateRepositoryTagOptions): Promise<GitHubCreatedRef>
  deleteRepositoryTag(options: DeleteRepositoryTagOptions): Promise<void>
  getRepositoryCommit(options: RepositoryCommitOptions): Promise<GitHubCommitDetail>
  getRepositoryFilePreview(options: RepositoryFilePreviewOptions): Promise<GitHubRepositoryFilePreview>
  setRepositoryStarred(options: SetRepositoryStarredOptions): Promise<void>
  setRepositorySubscription(options: SetRepositorySubscriptionOptions): Promise<void>
  forkRepository(options: ForkRepositoryOptions): Promise<GitHubForkedRepository>
  createRepository(options: CreateRepositoryOptions): Promise<GitHubCreatedRepository>
  listGitignoreTemplates(): Promise<string[]>
  listLicenses(): Promise<GitHubLicenseTemplate[]>
  listRepositoryWorkflows(options: RepositoryOptions): Promise<GitHubActionWorkflow[]>
  listRepositoryWorkflowRuns(options: ListRepositoryWorkflowRunsOptions): Promise<GitHubActionRunPage>
  getWorkflowRun(options: GetWorkflowRunOptions): Promise<GitHubActionRun>
  listWorkflowRunJobs(options: ListWorkflowRunJobsOptions): Promise<GitHubActionJob[]>
  getWorkflowJobLog(options: GetWorkflowJobLogOptions): Promise<GitHubActionJobLog>
  rerunWorkflowRun(options: RerunWorkflowRunOptions): Promise<void>
  rerunFailedWorkflowRunJobs(options: RerunWorkflowRunOptions): Promise<void>
  rerunWorkflowJob(options: RerunWorkflowJobOptions): Promise<void>
  dispatchWorkflow(options: DispatchWorkflowOptions): Promise<void>
  listRepositoryEnvironments(options: ListRepositoryEnvironmentsOptions): Promise<GitHubEnvironmentPage>
  listRepositoryDeployments(options: ListRepositoryDeploymentsOptions): Promise<GitHubDeploymentPage>
  listDeploymentStatuses(options: ListDeploymentStatusesOptions): Promise<GitHubDeploymentStatus[]>
  markDeploymentInactive(options: DeploymentTargetOptions): Promise<void>
  deleteDeployment(options: DeleteDeploymentOptions): Promise<void>
  deleteEnvironment(options: DeleteEnvironmentOptions): Promise<void>
  listRepositoryReleases(options: ListRepositoryReleasesOptions): Promise<GitHubReleasePage>
  createRelease(options: CreateReleaseOptions): Promise<GitHubRelease>
  updateRelease(options: UpdateReleaseOptions): Promise<GitHubRelease>
  deleteRelease(options: DeleteReleaseOptions): Promise<void>
  listRepositoryPackages(options: ListRepositoryPackagesOptions): Promise<GitHubPackagePage>
  listPackageVersions(options: ListPackageVersionsOptions): Promise<GitHubPackageVersionPage>
  deletePackage(options: PackageTargetOptions): Promise<void>
  deletePackageVersion(options: PackageVersionTargetOptions): Promise<void>
  restorePackage(options: PackageTargetOptions): Promise<void>
  restorePackageVersion(options: PackageVersionTargetOptions): Promise<void>
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

export interface UpdateIssueOptions extends GetIssueDetailOptions {
  title?: string
  body?: string
  state?: GitHubIssueUpdateState
  stateReason?: GitHubIssueStateReason
  assignees?: string[]
  labels?: string[]
  milestone?: number | null
}

export interface UpdateIssueCommentOptions extends RepositoryOptions {
  commentId: string | number
  body: string
}

export interface SetIssueSubscriptionOptions {
  subscribableId: string
  subscribed: boolean
}

export interface SetIssueLockOptions extends GetIssueDetailOptions {
  locked: boolean
}

export interface SetIssuePinnedOptions {
  issueId: string
  pinned: boolean
}

export interface DeleteIssueOptions {
  issueId: string
}

export interface GetPullRequestDetailOptions extends RepositoryOptions {
  number: number
}

export interface CreatePullRequestCommentOptions extends GetPullRequestDetailOptions {
  body: string
}

export interface UpdatePullRequestOptions extends GetPullRequestDetailOptions {
  title?: string
  body?: string
  state?: 'open' | 'closed'
  assignees?: string[]
  labels?: string[]
  milestone?: number | null
}

export interface ClosePullRequestOptions extends GetPullRequestDetailOptions {}

export interface RequestPullRequestReviewersOptions extends GetPullRequestDetailOptions {
  reviewers: string[]
  removeReviewers: string[]
}

export interface MarkPullRequestReadyForReviewOptions extends GetPullRequestDetailOptions {
  id: string
}

export interface MergePullRequestOptions extends GetPullRequestDetailOptions {
  method: GitHubPullRequestMergeMethod
  expectedHeadSha?: string | null
  commitTitle?: string
  commitMessage?: string
}

export interface UpdatePullRequestCommentOptions extends RepositoryOptions {
  commentId: string | number
  body: string
}

export interface ListPullRequestCommitsOptions extends GetPullRequestDetailOptions {
  page?: number
  perPage?: number
}

export type GitHubPullRequestReviewEvent = 'APPROVE' | 'COMMENT' | 'REQUEST_CHANGES'

export interface SubmitPullRequestReviewOptions extends GetPullRequestDetailOptions {
  event: GitHubPullRequestReviewEvent
  body?: string
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

export interface ListRepositoryWorkflowRunsOptions extends RepositoryOptions {
  headSha?: string | null
  workflowId?: number | 'all' | null
  page?: number
  perPage?: number
}

export interface GetWorkflowRunOptions extends RepositoryOptions {
  runId: number
}

export interface ListWorkflowRunJobsOptions extends GetWorkflowRunOptions {
  filter?: 'latest' | 'all'
}

export interface GetWorkflowJobLogOptions extends RepositoryOptions {
  jobId: number
  job?: WorkflowJobLogHint
}

export interface WorkflowJobLogHint {
  runId: number
  runAttempt: number
  name: string
  status: GitHubActionRunStatus | null
}

export interface RerunWorkflowRunOptions extends GetWorkflowRunOptions {
  enableDebugLogging?: boolean
}

export interface DispatchWorkflowOptions extends RepositoryOptions {
  workflowId: number
  ref: string
}

export interface RerunWorkflowJobOptions extends GetWorkflowJobLogOptions {
  enableDebugLogging?: boolean
  enableDebugger?: boolean
}

export interface ListRepositoryEnvironmentsOptions extends RepositoryOptions {
  page?: number
  perPage?: number
}

export interface ListRepositoryDeploymentsOptions extends RepositoryOptions {
  environment?: string | null
  ref?: string | null
  sha?: string | null
  task?: string | null
  page?: number
  perPage?: number
}

export interface ListDeploymentStatusesOptions extends RepositoryOptions {
  deploymentId: number
}

export interface DeploymentTargetOptions extends RepositoryOptions {
  deploymentId: number
}

export interface DeleteDeploymentOptions extends RepositoryOptions {
  deploymentId: number
  deactivateFirst?: boolean
}

export interface DeleteEnvironmentOptions extends RepositoryOptions {
  environmentName: string
}

export interface SearchWorkspaceOptions {
  mode: GitHubWorkspaceSearchMode
  query: string
  page?: number
  perPage?: number
}

export interface ListAccountRepositoriesOptions {
  login: string
  page?: number
  perPage?: number
  search?: string
  /** Star list slug; scopes starred-repository listings to that list. */
  list?: string
}

export interface AccountContributionsOptions {
  login: string
  year?: number
}

export interface SetAccountFollowedOptions {
  login: string
  followed: boolean
}

export interface ListAccountSponsorshipsOptions {
  login: string
  role: GitHubSponsorshipRole
  page?: number
  perPage?: number
}

export interface InviteOrganizationMemberOptions {
  org: string
  identifier: string
  role: GitHubOrganizationMemberRole
}

export interface SetOrganizationMemberRoleOptions {
  org: string
  login: string
  role: GitHubOrganizationMemberRole
}

export interface OrganizationMemberOptions {
  org: string
  login: string
}

export interface CancelOrganizationInvitationOptions {
  org: string
  invitationId: number
}

export interface SetOrganizationMembershipVisibilityOptions {
  org: string
  login: string
  publicized: boolean
}

export interface RepositoryOptions {
  owner: string
  repo: string
}

export interface ResolveRepositoryReferenceOptions extends RepositoryOptions {
  number: number
  kindHint?: GitHubRepositoryReferenceKind
}

export interface RepositoryFilesOptions extends RepositoryOptions {
  ref?: string | null
}

export interface ListRepositoryContributorsOptions extends RepositoryOptions {
  /** Number of contributors to fetch. Defaults to 30, capped at 100. */
  perPage?: number
}

export interface RepositoryContributorStatsOptions extends RepositoryOptions {
  /** Polling attempts while GitHub computes stats (202). Defaults to 6. */
  maxAttempts?: number
  /** Delay between polling attempts in milliseconds. Defaults to 2000. */
  retryDelayMs?: number
}

export interface RepositoryFilePreviewOptions extends RepositoryFilesOptions {
  path: string
}

export interface GitHubRepositoryCommitAuthor {
  login: string | null
  name: string | null
  avatarUrl: string | null
}

export interface GitHubRepositoryCommit {
  sha: string
  shortSha: string
  message: string
  headline: string
  author: GitHubRepositoryCommitAuthor
  committedDate: string
  htmlUrl: string
  ciState: GitHubCiState | null
}

export interface GitHubRepositoryCommitPage {
  items: GitHubRepositoryCommit[]
  page: number
  perPage: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface GitHubRepositoryBranch {
  name: string
  commitSha: string
}

export interface RepositoryCommitsOptions extends RepositoryOptions {
  ref?: string | null
  page?: number
  perPage?: number
}

export type RepositoryBranchesOptions = RepositoryOptions

export interface ListRepositoryRefsOptions extends RepositoryOptions {
  query?: string
  page?: number
  perPage?: number
}

export interface ListRepositoryBranchesDetailedOptions extends ListRepositoryRefsOptions {
  defaultBranch?: string | null
}

export type ListRepositoryTagsOptions = ListRepositoryRefsOptions

export interface GitHubBranchAssociatedPullRequest {
  number: number
  title: string
  url: string
}

export interface GitHubBranchListItem {
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

export interface GitHubBranchPage {
  items: GitHubBranchListItem[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
  defaultBranch: string | null
}

export interface GitHubTagListItem {
  name: string
  commitSha: string
  shortSha: string
  date: string | null
  message: string | null
  isAnnotated: boolean
}

export interface GitHubTagPage {
  items: GitHubTagListItem[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
}

export interface CreateRepositoryBranchOptions extends RepositoryOptions {
  name: string
  fromRef: string
}

export interface RenameRepositoryBranchOptions extends RepositoryOptions {
  name: string
  newName: string
}

export interface DeleteRepositoryBranchOptions extends RepositoryOptions {
  name: string
}

export interface CreateRepositoryTagOptions extends RepositoryOptions {
  name: string
  fromRef: string
  message?: string
}

export interface DeleteRepositoryTagOptions extends RepositoryOptions {
  name: string
}

export interface GitHubCreatedRef {
  ref: string
  sha: string
}

export interface GitHubReleaseAsset {
  id: number
  name: string
  size: number
  downloadCount: number
  contentType: string | null
  browserDownloadUrl: string
  updatedAt: string | null
}

export interface GitHubRelease {
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

export interface GitHubReleasePage {
  items: GitHubRelease[]
  page: number
  perPage: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface ListRepositoryReleasesOptions extends RepositoryOptions {
  page?: number
  perPage?: number
}

export interface CreateReleaseOptions extends RepositoryOptions {
  tagName: string
  targetCommitish?: string | null
  name?: string | null
  body?: string | null
  draft?: boolean
  prerelease?: boolean
}

export interface UpdateReleaseChanges {
  tagName?: string
  targetCommitish?: string | null
  name?: string | null
  body?: string | null
  draft?: boolean
  prerelease?: boolean
}

export interface UpdateReleaseOptions extends RepositoryOptions, UpdateReleaseChanges {
  releaseId: number
}

export interface DeleteReleaseOptions extends RepositoryOptions {
  releaseId: number
}

export interface GitHubCommitActor {
  login: string | null
  name: string | null
  avatarUrl: string | null
  date: string | null
}

export interface GitHubCommitFile {
  filename: string
  previousFilename?: string
  status: 'added' | 'modified' | 'removed' | 'renamed' | 'changed'
  additions: number
  deletions: number
  patch?: string
}

export interface GitHubCommitParent {
  sha: string
  shortSha: string
}

export interface GitHubCommitVerification {
  verified: boolean
  reason: string | null
}

export interface GitHubCommitStats {
  additions: number
  deletions: number
  total: number
}

export interface GitHubCommitDetail {
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

export interface RepositoryCommitOptions extends RepositoryOptions {
  sha: string
}

export interface SetRepositoryStarredOptions extends RepositoryOptions {
  starred: boolean
}

export interface SetRepositorySubscriptionOptions extends RepositoryOptions {
  subscription: GitHubRepositorySubscription
}

export interface CreateRepositoryOptions {
  organization?: string | null
  name: string
  description?: string | null
  visibility: 'public' | 'private'
  autoInit?: boolean
  gitignoreTemplate?: string | null
  licenseTemplate?: string | null
}

export interface ForkRepositoryOptions extends RepositoryOptions {
  organization?: string | null
  name?: string | null
  defaultBranchOnly?: boolean
}

export interface GitHubUserSettingsProfile {
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

export interface UpdateUserSettingsProfileInput {
  name?: string
  email?: string
  bio?: string
  company?: string
  location?: string
  blog?: string
  twitterUsername?: string
  hireable?: boolean
}

export interface GitHubSocialAccount {
  provider: string
  url: string
}

export interface GitHubUserEmail {
  email: string
  primary: boolean
  verified: boolean
  visibility: string | null
}

export interface GitHubSshKey {
  id: number
  title: string
  key: string
  createdAt: string | null
}

export interface GitHubGpgKeyEmail {
  email: string
  verified: boolean
}

export interface GitHubGpgKey {
  id: number
  keyId: string
  name: string | null
  emails: GitHubGpgKeyEmail[]
  createdAt: string | null
  expiresAt: string | null
}

export interface GitHubSshSigningKey {
  id: number
  title: string
  key: string
  createdAt: string | null
}

export interface GitHubBlockedUser {
  login: string
  avatarUrl: string
  htmlUrl: string
}

export type GitHubInteractionLimitGroup =
  | 'existing_users'
  | 'contributors_only'
  | 'collaborators_only'

export type GitHubInteractionLimitExpiry =
  | 'one_day'
  | 'three_days'
  | 'one_week'
  | 'one_month'
  | 'six_months'

export interface GitHubInteractionLimits {
  limit: GitHubInteractionLimitGroup
  origin: string | null
  expiresAt: string | null
}

export interface GitHubOrganizationMembership {
  orgLogin: string
  orgAvatarUrl: string
  orgDescription: string | null
  role: string
  state: 'active' | 'pending'
  isPublic: boolean
}

export interface GitHubCodespacesSecret {
  name: string
  createdAt: string | null
  updatedAt: string | null
  selectedRepositoryIds: number[]
}

export interface UpsertCodespacesSecretInput {
  name: string
  value: string
  selectedRepositoryIds: number[]
}

export interface GitHubSavedReply {
  id: string
  databaseId: number | null
  title: string
  body: string
}
