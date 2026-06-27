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
