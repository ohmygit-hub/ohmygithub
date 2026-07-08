import { AccountsApi } from './modules/accounts'
import { ActionsApi } from './modules/actions'
import { ActivityApi } from './modules/activity'
import { AuthApi } from './modules/auth'
import { DeploymentsApi } from './modules/deployments'
import { InboxApi } from './modules/inbox'
import { IssuesApi } from './modules/issues'
import { OrganizationPeopleApi } from './modules/organization-people'
import { PackagesApi } from './modules/packages'
import { PullsApi } from './modules/pulls'
import { ReleasesApi } from './modules/releases'
import { RepositoriesApi } from './modules/repositories'
import { RepositorySettingsApi } from './modules/repository-settings.general'
import { RepositorySettingsAccessApi } from './modules/repository-settings.access'
import { RepositorySettingsAutomationApi } from './modules/repository-settings.automation'
import { RepositorySettingsSecurityApi } from './modules/repository-settings.security'
import { RepositorySettingsIntegrationsApi } from './modules/repository-settings.integrations'
import { SearchApi } from './modules/search'
import { UserSettingsApi } from './modules/user-settings'
import { createOctokit, type GitHubOctokit } from './transport'
import type {
  GitHubApiOptions,
  GitHubAccountContributionYear,
  GitHubAccountOverview,
  GitHubAccountProfile,
  GitHubAccountRepository,
  GitHubAccountRepositoryPage,
  GitHubAccountViewerState,
  GitHubActionJob,
  GitHubActionJobLog,
  GitHubActionRun,
  GitHubActionRunPage,
  GitHubActionWorkflow,
  GitHubClient,
  GitHubDeployment,
  GitHubDeploymentPage,
  GitHubDeploymentState,
  GitHubDeploymentStatus,
  GitHubEnvironment,
  GitHubEnvironmentPage,
  GitHubEnvironmentProtectionRule,
  GitHubWorkspaceGotoResult,
  GitHubIssue,
  GitHubIssueSearchResult,
  GitHubIssueComment,
  GitHubIssueDetail,
  GitHubOrganization,
  GitHubPackage,
  GitHubPackagePage,
  GitHubPackageType,
  GitHubPackageVersion,
  GitHubPackageVersionPage,
  GitHubPackageVisibility,
  GitHubPullRequest,
  GitHubPullRequestComment,
  GitHubPullRequestCommitSummary,
  GitHubPullRequestDetail,
  GitHubPullRequestMergeMethod,
  GitHubPullRequestSearchResult,
  GitHubRepository,
  GitHubRepositoryFilePreview,
  GitHubRepositoryFileTree,
  GitHubRepositoryOverview,
  GitHubRepositoryReferenceResolution,
  GitHubWorkspaceSearchResult,
  GitHubWorkspaceItem
} from './types'

export interface GitHubApi extends GitHubClient {
  readonly octokit: GitHubOctokit
  readonly accounts: AccountsApi
  readonly actions: ActionsApi
  readonly activity: ActivityApi
  readonly auth: AuthApi
  readonly deployments: DeploymentsApi
  readonly inbox: InboxApi
  readonly issues: IssuesApi
  readonly organizationPeople: OrganizationPeopleApi
  readonly packages: PackagesApi
  readonly pulls: PullsApi
  readonly releases: ReleasesApi
  readonly repositories: RepositoriesApi
  readonly repositorySettings: RepositorySettingsApi
  readonly repositorySettingsAccess: RepositorySettingsAccessApi
  readonly repositorySettingsAutomation: RepositorySettingsAutomationApi
  readonly repositorySettingsSecurity: RepositorySettingsSecurityApi
  readonly repositorySettingsIntegrations: RepositorySettingsIntegrationsApi
  readonly search: SearchApi
  readonly userSettings: UserSettingsApi
}

export function createGitHubApi(options: GitHubApiOptions): GitHubApi {
  const octokit = createOctokit(options)
  const accounts = new AccountsApi(octokit)
  const actions = new ActionsApi(octokit)
  const activity = new ActivityApi(octokit)
  const auth = new AuthApi({ octokit, proxyUrl: options.proxyUrl })
  const deployments = new DeploymentsApi(octokit)
  const inbox = new InboxApi(octokit)
  const issues = new IssuesApi(octokit)
  const organizationPeople = new OrganizationPeopleApi(octokit)
  const packages = new PackagesApi(octokit)
  const pulls = new PullsApi(octokit)
  const releases = new ReleasesApi(octokit)
  const repositories = new RepositoriesApi(octokit)
  const repositorySettings = new RepositorySettingsApi(octokit)
  const repositorySettingsAccess = new RepositorySettingsAccessApi(octokit)
  const repositorySettingsAutomation = new RepositorySettingsAutomationApi(octokit)
  const repositorySettingsSecurity = new RepositorySettingsSecurityApi(octokit)
  const repositorySettingsIntegrations = new RepositorySettingsIntegrationsApi(octokit)
  const search = new SearchApi(octokit)
  const userSettings = new UserSettingsApi(octokit)

  return {
    octokit,
    accounts,
    actions,
    activity,
    auth,
    deployments,
    inbox,
    issues,
    organizationPeople,
    packages,
    pulls,
    releases,
    repositories,
    repositorySettings,
    repositorySettingsAccess,
    repositorySettingsAutomation,
    repositorySettingsSecurity,
    repositorySettingsIntegrations,
    search,
    userSettings,
    getAccountProfile: (login) => accounts.getProfile(login),
    getAccountOverview: (login) => accounts.getOverview(login),
    getAccountContributions: (options) => accounts.getContributions(options),
    listAccountRepositories: (options) => accounts.listRepositories(options),
    listAccountStarredRepositories: (options) => accounts.listStarredRepositories(options),
    listAccountStarredLists: (login) => accounts.listStarredLists(login),
    getAccountViewerState: (login) => accounts.getViewerState(login),
    setAccountFollowed: (options) => accounts.setFollowed(options),
    listViewerOrganizations: () => accounts.listViewerOrganizations(),
    listOrganizationRepositories: (owner) => accounts.listOrganizationRepositories(owner),
    listAllViewerRepositories: () => accounts.listAllViewerRepositories(),
    resolveWorkspaceGoto: (input) => search.resolveWorkspaceGoto(input),
    resolveRepositoryReference: (options) => search.resolveRepositoryReference(options),
    searchWorkspace: (options) => search.searchWorkspace(options),
    getRepositoryViewerState: (options) => repositories.getViewerState(options),
    getRepositoryNavigationCounts: (options) => repositories.getNavigationCounts(options),
    getRepositoryOverview: (options) => repositories.getOverview(options),
    getRepositoryContributorStats: (options) => repositories.getContributorStats(options),
    listRepositoryContributors: (options) => repositories.listContributors(options),
    listRepositoryFiles: (options) => repositories.listFiles(options),
    listRepositoryCommits: (options) => repositories.listCommits(options),
    listRepositoryBranches: (options) => repositories.listBranches(options),
    listRepositoryBranchesDetailed: (options) => repositories.listBranchesDetailed(options),
    listRepositoryTags: (options) => repositories.listTags(options),
    createRepositoryBranch: (options) => repositories.createBranch(options),
    renameRepositoryBranch: (options) => repositories.renameBranch(options),
    deleteRepositoryBranch: (options) => repositories.deleteBranch(options),
    createRepositoryTag: (options) => repositories.createTag(options),
    deleteRepositoryTag: (options) => repositories.deleteTag(options),
    getRepositoryCommit: (options) => repositories.getCommit(options),
    getRepositoryFilePreview: (options) => repositories.getFilePreview(options),
    setRepositoryStarred: (options) => repositories.setStarred(options),
    setRepositorySubscription: (options) => repositories.setSubscription(options),
    forkRepository: (options) => repositories.fork(options),
    createRepository: (options) => repositories.create(options),
    listGitignoreTemplates: () => repositories.listGitignoreTemplates(),
    listLicenses: () => repositories.listLicenses(),
    listRepositoryWorkflows: (options) => actions.listRepositoryWorkflows(options),
    listRepositoryWorkflowRuns: (options) => actions.listRepositoryWorkflowRuns(options),
    getWorkflowRun: (options) => actions.getWorkflowRun(options),
    listWorkflowRunJobs: (options) => actions.listWorkflowRunJobs(options),
    getWorkflowJobLog: (options) => actions.getWorkflowJobLog(options),
    rerunWorkflowRun: (options) => actions.rerunWorkflowRun(options),
    rerunFailedWorkflowRunJobs: (options) => actions.rerunFailedWorkflowRunJobs(options),
    rerunWorkflowJob: (options) => actions.rerunWorkflowJob(options),
    dispatchWorkflow: (options) => actions.dispatchWorkflow(options),
    listRepositoryEnvironments: (options) => deployments.listRepositoryEnvironments(options),
    listRepositoryDeployments: (options) => deployments.listRepositoryDeployments(options),
    listDeploymentStatuses: (options) => deployments.listDeploymentStatuses(options),
    markDeploymentInactive: (options) => deployments.markDeploymentInactive(options),
    deleteDeployment: (options) => deployments.deleteDeployment(options),
    deleteEnvironment: (options) => deployments.deleteEnvironment(options),
    listRepositoryReleases: (options) => releases.listRepositoryReleases(options),
    createRelease: (options) => releases.createRelease(options),
    updateRelease: (options) => releases.updateRelease(options),
    deleteRelease: (options) => releases.deleteRelease(options),
    listRepositoryPackages: (options) => packages.listRepositoryPackages(options),
    listPackageVersions: (options) => packages.listPackageVersions(options),
    deletePackage: (options) => packages.deletePackage(options),
    deletePackageVersion: (options) => packages.deletePackageVersion(options),
    restorePackage: (options) => packages.restorePackage(options),
    restorePackageVersion: (options) => packages.restorePackageVersion(options),
    listNotifications: () => inbox.listNotifications(),
    listPullRequests: () => inbox.listPullRequests(),
    listIssues: () => inbox.listIssues(),
    listPullRequestCategory: (options) => pulls.listPullRequestCategory(options),
    listViewerPullRequests: (options) => pulls.listViewerPullRequests(options),
    listRepositoryPullRequests: (options) => pulls.listRepositoryPullRequests(options),
    searchRepositoryPullRequests: (options) => pulls.searchRepositoryPullRequests(options),
    getPullRequestDetail: (options) => pulls.getPullRequestDetail(options),
    createPullRequestComment: (options) => pulls.createPullRequestComment(options),
    updatePullRequest: (options) => pulls.updatePullRequest(options),
    closePullRequest: (options) => pulls.closePullRequest(options),
    requestPullRequestReviewers: (options) => pulls.requestPullRequestReviewers(options),
    markPullRequestReadyForReview: (options) => pulls.markPullRequestReadyForReview(options),
    mergePullRequest: (options) => pulls.mergePullRequest(options),
    updatePullRequestComment: (options) => pulls.updatePullRequestComment(options),
    listPullRequestFiles: (options) => pulls.listPullRequestFiles(options),
    listPullRequestCommits: (options) => pulls.listPullRequestCommits(options),
    submitPullRequestReview: (options) => pulls.submitPullRequestReview(options),
    listIssueCategory: (options) => issues.listIssueCategory(options),
    listViewerIssues: (options) => issues.listViewerIssues(options),
    listRepositoryIssues: (options) => issues.listRepositoryIssues(options),
    searchRepositoryIssues: (options) => issues.searchRepositoryIssues(options),
    getIssueDetail: (options) => issues.getIssueDetail(options),
    createIssueComment: (options) => issues.createIssueComment(options),
    listRepositoryLabels: (options) => issues.listRepositoryLabels(options),
    listRepositoryMilestones: (options) => issues.listRepositoryMilestones(options),
    listAssignableUsers: (options) => issues.listAssignableUsers(options),
    updateIssue: (options) => issues.updateIssue(options),
    updateIssueComment: (options) => issues.updateIssueComment(options),
    setIssueSubscription: (options) => issues.setIssueSubscription(options),
    setIssueLock: (options) => issues.setIssueLock(options),
    setIssuePinned: (options) => issues.setIssuePinned(options),
    deleteIssue: (options) => issues.deleteIssue(options),
    setReaction: (options) => issues.setReaction(options)
  }
}

export type {
  GitHubAccountContributionYear,
  GitHubAccountOverview,
  GitHubAccountProfile,
  GitHubAccountRepository,
  GitHubAccountRepositoryPage,
  GitHubAccountViewerState,
  GitHubActionJob,
  GitHubActionJobLog,
  GitHubActionRun,
  GitHubActionRunPage,
  GitHubActionWorkflow,
  GitHubDeployment,
  GitHubDeploymentPage,
  GitHubDeploymentState,
  GitHubDeploymentStatus,
  GitHubEnvironment,
  GitHubEnvironmentPage,
  GitHubEnvironmentProtectionRule,
  GitHubIssue,
  GitHubIssueSearchResult,
  GitHubIssueComment,
  GitHubIssueDetail,
  GitHubOrganization,
  GitHubPackage,
  GitHubPackagePage,
  GitHubPackageType,
  GitHubPackageVersion,
  GitHubPackageVersionPage,
  GitHubPackageVisibility,
  GitHubPullRequest,
  GitHubPullRequestComment,
  GitHubPullRequestCommitSummary,
  GitHubPullRequestDetail,
  GitHubPullRequestMergeMethod,
  GitHubPullRequestSearchResult,
  GitHubRepository,
  GitHubRepositoryFilePreview,
  GitHubRepositoryFileTree,
  GitHubRepositoryOverview,
  GitHubRepositoryReferenceResolution,
  GitHubWorkspaceGotoResult,
  GitHubWorkspaceSearchResult,
  GitHubWorkspaceItem
}
