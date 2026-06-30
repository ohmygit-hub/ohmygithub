import { AccountsApi } from './modules/accounts'
import { ActionsApi } from './modules/actions'
import { AuthApi } from './modules/auth'
import { InboxApi } from './modules/inbox'
import { IssuesApi } from './modules/issues'
import { PullsApi } from './modules/pulls'
import { RepositoriesApi } from './modules/repositories'
import { SearchApi } from './modules/search'
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
  GitHubWorkspaceGotoResult,
  GitHubIssue,
  GitHubIssueSearchResult,
  GitHubIssueComment,
  GitHubIssueDetail,
  GitHubOrganization,
  GitHubPullRequest,
  GitHubPullRequestComment,
  GitHubPullRequestCommitSummary,
  GitHubPullRequestDetail,
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
  readonly auth: AuthApi
  readonly inbox: InboxApi
  readonly issues: IssuesApi
  readonly pulls: PullsApi
  readonly repositories: RepositoriesApi
  readonly search: SearchApi
}

export function createGitHubApi(options: GitHubApiOptions): GitHubApi {
  const octokit = createOctokit(options)
  const accounts = new AccountsApi(octokit)
  const actions = new ActionsApi(octokit)
  const auth = new AuthApi({ octokit, proxyUrl: options.proxyUrl })
  const inbox = new InboxApi(octokit)
  const issues = new IssuesApi(octokit)
  const pulls = new PullsApi(octokit)
  const repositories = new RepositoriesApi(octokit)
  const search = new SearchApi(octokit)

  return {
    octokit,
    accounts,
    actions,
    auth,
    inbox,
    issues,
    pulls,
    repositories,
    search,
    getAccountProfile: (login) => accounts.getProfile(login),
    getAccountOverview: (login) => accounts.getOverview(login),
    getAccountContributions: (options) => accounts.getContributions(options),
    listAccountRepositories: (options) => accounts.listRepositories(options),
    listAccountStarredRepositories: (options) => accounts.listStarredRepositories(options),
    getAccountViewerState: (login) => accounts.getViewerState(login),
    setAccountFollowed: (options) => accounts.setFollowed(options),
    listViewerOrganizations: () => accounts.listViewerOrganizations(),
    listOrganizationRepositories: (owner) => accounts.listOrganizationRepositories(owner),
    resolveWorkspaceGoto: (input) => search.resolveWorkspaceGoto(input),
    resolveRepositoryReference: (options) => search.resolveRepositoryReference(options),
    searchWorkspace: (options) => search.searchWorkspace(options),
    getRepositoryViewerState: (options) => repositories.getViewerState(options),
    getRepositoryOverview: (options) => repositories.getOverview(options),
    listRepositoryFiles: (options) => repositories.listFiles(options),
    listRepositoryCommits: (options) => repositories.listCommits(options),
    listRepositoryBranches: (options) => repositories.listBranches(options),
    getRepositoryCommit: (options) => repositories.getCommit(options),
    getRepositoryFilePreview: (options) => repositories.getFilePreview(options),
    setRepositoryStarred: (options) => repositories.setStarred(options),
    setRepositoryWatching: (options) => repositories.setWatching(options),
    listRepositoryWorkflows: (options) => actions.listRepositoryWorkflows(options),
    listRepositoryWorkflowRuns: (options) => actions.listRepositoryWorkflowRuns(options),
    getWorkflowRun: (options) => actions.getWorkflowRun(options),
    listWorkflowRunJobs: (options) => actions.listWorkflowRunJobs(options),
    getWorkflowJobLog: (options) => actions.getWorkflowJobLog(options),
    rerunWorkflowRun: (options) => actions.rerunWorkflowRun(options),
    rerunFailedWorkflowRunJobs: (options) => actions.rerunFailedWorkflowRunJobs(options),
    rerunWorkflowJob: (options) => actions.rerunWorkflowJob(options),
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
    deleteIssue: (options) => issues.deleteIssue(options)
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
  GitHubIssue,
  GitHubIssueSearchResult,
  GitHubIssueComment,
  GitHubIssueDetail,
  GitHubOrganization,
  GitHubPullRequest,
  GitHubPullRequestComment,
  GitHubPullRequestCommitSummary,
  GitHubPullRequestDetail,
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
