/// <reference types="vite/client" />

type LocalConfig = {
  schemaVersion: 1
  github: {
    activeAccountLogin: string | null
  }
  network: {
    proxyUrl: string | null
  }
  ui: {
    locale: 'en' | 'zh'
    theme: 'auto' | 'light' | 'dark'
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

type GitHubIssueState = 'open' | 'completed' | 'not_planned'

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

type GitHubPullRequestSearchResult = {
  items: GitHubPullRequest[]
  totalCount: number
  page: number
  perPage: number
  hasNextPage: boolean
  incompleteResults: boolean
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

interface Window {
  ohMyGithub: {
    app: {
      name: string
      version: string
    }
    accounts: {
      listOrganizations: () => Promise<GitHubOrganization[]>
      listOrganizationRepositories: (owner: string) => Promise<GitHubRepository[]>
    }
    issues: {
      listIssueCategory: (category: GitHubIssueCategory) => Promise<GitHubIssue[]>
      listViewerIssues: () => Promise<GitHubIssue[]>
      listRepositoryIssues: (owner: string, repo: string) => Promise<GitHubIssue[]>
    }
    pulls: {
      listPullRequestCategory: (category: GitHubPullRequestCategory) => Promise<GitHubPullRequest[]>
      listViewerPullRequests: () => Promise<GitHubPullRequest[]>
      listRepositoryPullRequests: (owner: string, repo: string) => Promise<GitHubPullRequest[]>
      searchRepositoryPullRequests: (
        options: SearchRepositoryPullRequestsOptions
      ) => Promise<GitHubPullRequestSearchResult>
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
    windowControls: {
      getState: () => Promise<WindowControlsState>
      onFullscreenChange: (listener: (state: WindowControlsState) => void) => () => void
    }
  }
}
