import { AuthApi } from './modules/auth'
import { InboxApi } from './modules/inbox'
import { createOctokit, type GitHubOctokit } from './transport'
import type { GitHubApiOptions, GitHubClient, GitHubWorkspaceItem } from './types'

export interface GitHubApi extends GitHubClient {
  readonly octokit: GitHubOctokit
  readonly auth: AuthApi
  readonly inbox: InboxApi
}

export function createGitHubApi(options: GitHubApiOptions): GitHubApi {
  const octokit = createOctokit(options)
  const auth = new AuthApi({ octokit, proxyUrl: options.proxyUrl })
  const inbox = new InboxApi(octokit)

  return {
    octokit,
    auth,
    inbox,
    listNotifications: () => inbox.listNotifications(),
    listPullRequests: () => inbox.listPullRequests(),
    listIssues: () => inbox.listIssues()
  }
}

export type { GitHubWorkspaceItem }
