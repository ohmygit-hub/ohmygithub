import type {
  CreateIssueCommentOptions,
  CreatePullRequestCommentOptions,
  AccountContributionsOptions,
  DeleteIssueCommentOptions,
  EditIssueCommentOptions,
  GetIssueDetailOptions,
  GetPullRequestDetailOptions,
  GitHubAccountContributionYear,
  GitHubAccountOverview,
  GitHubAccountProfile,
  GitHubAccountRepository,
  GitHubAccountRepositoryPage,
  GitHubAccountViewerState,
  GitHubAssignableUser,
  GitHubClient,
  GitHubIssue,
  GitHubIssueSearchResult,
  GitHubIssueComment,
  GitHubIssueDetail,
  GitHubIssueLabel,
  GitHubIssueMilestone,
  GitHubOrganization,
  GitHubPullRequest,
  GitHubPullRequestComment,
  GitHubPullRequestDetail,
  GitHubPullRequestSearchResult,
  GitHubRepository,
  GitHubRepositoryFileNode,
  GitHubRepositoryFilePreview,
  GitHubRepositoryFileTree,
  GitHubRepositoryOverview,
  GitHubRepositoryReferenceResolution,
  GitHubRepositoryViewerState,
  GitHubWorkspaceGotoResult,
  GitHubWorkspaceSearchItem,
  GitHubWorkspaceSearchResult,
  GitHubWorkspaceItem,
  ListAccountRepositoriesOptions,
  ListIssueCategoryOptions,
  ListPullRequestCategoryOptions,
  ListRepositoryWorkspaceItemsOptions,
  RepositoryFilePreviewOptions,
  RepositoryFilesOptions,
  RepositoryOptions,
  ResolveRepositoryReferenceOptions,
  SearchRepositoryIssuesOptions,
  SearchRepositoryPullRequestsOptions,
  SearchWorkspaceOptions,
  SetAccountFollowedOptions,
  SetRepositoryStarredOptions,
  SetRepositoryWatchingOptions,
  UpdateIssueOptions
} from './types'

const items: GitHubWorkspaceItem[] = [
  {
    id: 'notif-1',
    kind: 'notification',
    title: 'Review requested on electron shell navigation',
    repository: 'oh-my-github/client',
    number: 18,
    state: 'unread',
    author: { login: 'octo-lina' },
    updatedAt: '2026-06-27T08:42:00.000Z',
    labels: ['review', 'desktop'],
    summary: 'A reviewer asked for tighter keyboard behavior in the workspace sidebar.'
  },
  {
    id: 'pr-1',
    kind: 'pull_request',
    title: 'Add notification grouping model',
    repository: 'oh-my-github/api',
    number: 21,
    state: 'open',
    author: { login: 'maya' },
    updatedAt: '2026-06-27T07:10:00.000Z',
    labels: ['api', 'inbox'],
    summary: 'Introduces an inbox-oriented shape for notifications, issues, and pull requests.'
  },
  {
    id: 'issue-1',
    kind: 'issue',
    title: 'Design empty state for first-run workspace',
    repository: 'oh-my-github/ui',
    number: 7,
    state: 'open',
    author: { login: 'arden' },
    updatedAt: '2026-06-26T22:18:00.000Z',
    labels: ['design', 'good first issue'],
    summary: 'The first-run screen needs a concise state before GitHub OAuth is wired in.'
  },
  {
    id: 'action-1',
    kind: 'action',
    title: 'Renderer build failed on macOS',
    repository: 'oh-my-github/client',
    state: 'failed',
    author: { login: 'github-actions' },
    updatedAt: '2026-06-26T18:03:00.000Z',
    labels: ['ci', 'renderer'],
    summary: 'The app shell build failed during renderer type checking.'
  }
]

const organizations: GitHubOrganization[] = [
  {
    id: 1,
    login: 'oh-my-github',
    avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=80&v=4',
    description: 'Desktop GitHub workspace'
  },
  {
    id: 2,
    login: 'electron',
    avatarUrl: 'https://avatars.githubusercontent.com/u/13409222?s=80&v=4',
    description: 'Build cross-platform desktop apps'
  },
  {
    id: 3,
    login: 'vuejs',
    avatarUrl: 'https://avatars.githubusercontent.com/u/6128107?s=80&v=4',
    description: 'The progressive JavaScript framework'
  },
  {
    id: 4,
    login: 'github',
    avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=80&v=4',
    description: 'GitHub'
  },
  {
    id: 5,
    login: 'octokit',
    avatarUrl: 'https://avatars.githubusercontent.com/u/3430433?s=80&v=4',
    description: 'GitHub API clients'
  }
]

const users = [
  {
    id: 100,
    login: 'acbox',
    avatarUrl: 'https://avatars.githubusercontent.com/u/583231?s=80&v=4',
    description: 'Oh My GitHub maintainer',
  },
  {
    id: 101,
    login: 'octocat',
    avatarUrl: 'https://avatars.githubusercontent.com/u/583231?s=80&v=4',
    description: 'GitHub mascot account',
  },
  {
    id: 102,
    login: 'maya',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1?s=80&v=4',
    description: 'Reviewer account',
  },
]

const accountOrganizations: Record<string, GitHubOrganization[]> = {
  acbox: organizations.slice(0, 3),
  octocat: organizations.slice(2, 5),
  maya: organizations.slice(0, 1),
}

const accountSocialAccounts: Record<string, GitHubAccountOverview['socialAccounts']> = {
  acbox: [
    {
      provider: 'x',
      displayName: '@AcboxLiu',
      url: 'https://x.com/AcboxLiu',
    },
    {
      provider: 'generic',
      displayName: 'Telegram',
      url: 'https://t.me/acboxawa',
    },
  ],
  octocat: [
    {
      provider: 'mastodon',
      displayName: '@octocat@github.social',
      url: 'https://github.social/@octocat',
    },
  ],
}

const repositoriesByOrganization: Record<string, GitHubRepository[]> = {
  'oh-my-github': createMockRepositories('oh-my-github', [
    'client',
    'api',
    'ui',
    'desktop-shell',
    'workspace',
    'notifications',
    'reviews',
    'actions',
    'settings',
    'design-system',
    'oauth',
    'release',
  ]),
  electron: createMockRepositories('electron', ['electron', 'forge', 'fiddle']),
  vuejs: createMockRepositories('vuejs', ['core', 'router', 'pinia', 'vitepress']),
  github: createMockRepositories('github', ['docs', 'hub', 'training-kit']),
  octokit: createMockRepositories('octokit', ['octokit.js', 'rest.js', 'graphql.js']),
}

const repositoriesByAccount: Record<string, GitHubAccountRepository[]> = {
  acbox: createMockAccountRepositories('acbox', [
    'profile',
    'oh-my-github-labs',
    'desktop-workbench',
    'api-playground',
    'vue-rendering-notes',
    'electron-auth-device-flow',
    'github-activity-sandbox',
    'private-notes',
    'markdown-rich-content',
    'workflow-snapshots',
    'repository-cards',
    'contribution-visualizer',
    'oauth-scope-lab',
    'tiny-utilities',
  ]),
  octocat: createMockAccountRepositories('octocat', [
    'Hello-World',
    'Spoon-Knife',
    'linguist',
    'hubot',
    'training-kit',
  ]),
  maya: createMockAccountRepositories('maya', [
    'review-notes',
    'desktop-triage',
    'mock-api-fixtures',
  ]),
}

const starredRepositoriesByAccount: Record<string, GitHubAccountRepository[]> = {
  acbox: [
    ...createMockAccountRepositories('vuejs', ['core', 'router', 'pinia']),
    ...createMockAccountRepositories('electron', ['electron', 'fiddle']),
    ...createMockAccountRepositories('octokit', ['octokit.js', 'graphql.js', 'rest.js']),
    ...createMockAccountRepositories('github', ['docs', 'hub']),
  ],
  octocat: [
    ...createMockAccountRepositories('github', ['docs', 'training-kit']),
    ...createMockAccountRepositories('octokit', ['octokit.js']),
  ],
  maya: [
    ...createMockAccountRepositories('oh-my-github', ['client', 'api', 'ui']),
  ],
}

const pullRequestsByRepository: Record<string, GitHubPullRequest[]> = {
  'oh-my-github/client': createMockPullRequests('oh-my-github', 'client', ['Wire workspace sidebar states', 'Polish Electron titlebar', 'Draft issue detail routes']),
  'oh-my-github/api': createMockPullRequests('oh-my-github', 'api', ['Add typed GitHub modules', 'Normalize notification updates']),
  'vuejs/core': createMockPullRequests('vuejs', 'core', ['Improve scheduler traces', 'Draft compiler warning copy']),
}

const issuesByRepository: Record<string, GitHubIssue[]> = {
  'oh-my-github/client': createMockIssues('oh-my-github', 'client', ['Sidebar active item is too tall', 'Bookmark menu needs keyboard polish']),
  'oh-my-github/ui': createMockIssues('oh-my-github', 'ui', ['Document compact menu sizing']),
  'vuejs/core': createMockIssues('vuejs', 'core', ['Regression in suspense hydration']),
}

const viewerStateByRepository = new Map<string, GitHubRepositoryViewerState>()
const followedAccounts = new Set(['octocat'])
const mockIssueCommentsByIssue = new Map<string, GitHubIssueComment[]>()
const mockIssueCommentEdits = new Map<number, { body: string, updatedAt: string }>()
const mockDeletedIssueComments = new Set<number>()
const mockIssueDetailOverridesByIssue = new Map<
  string,
  Partial<Pick<GitHubIssueDetail, 'body' | 'assignees' | 'milestone'>>
>()
const mockPullRequestCommentsByPullRequest = new Map<string, GitHubPullRequestComment[]>()

export class MockGitHubClient implements GitHubClient {
  async getAccountProfile(login: string): Promise<GitHubAccountProfile> {
    const normalizedLogin = login.trim()
    const user = users.find((item) => item.login.toLowerCase() === normalizedLogin.toLowerCase())
    const organization = organizations.find((item) => item.login.toLowerCase() === normalizedLogin.toLowerCase())
    const account = user ?? organization

    if (!account) {
      throw new Error('Account not found')
    }

    return {
      id: account.id,
      login: account.login,
      name: account.login,
      avatarUrl: account.avatarUrl,
      bio: 'Mock GitHub account profile for local development.',
      company: organization ? 'GitHub' : null,
      location: 'Local workspace',
      blog: `https://github.com/${account.login}`,
      email: user ? `${account.login}@example.dev` : null,
      twitterUsername: user ? `${account.login}_dev` : null,
      url: `https://github.com/${account.login}`,
      followers: account.id * 2,
      following: account.id,
      publicRepos: repositoriesByOrganization[account.login]?.length ?? 12,
      publicGists: user ? 8 : 0,
      createdAt: new Date(Date.UTC(2020, 0, 10 + account.id % 20)).toISOString(),
      updatedAt: new Date(Date.UTC(2026, 5, 27)).toISOString(),
      hireable: user ? account.login === 'maya' : null,
      type: organization ? 'Organization' : 'User',
    }
  }

  async getAccountOverview(login: string): Promise<GitHubAccountOverview> {
    const profile = await this.getAccountProfile(login)
    const isOrganization = profile.type === 'Organization'

    return {
      profile,
      organizations: isOrganization ? [] : accountOrganizations[profile.login] ?? [],
      socialAccounts: isOrganization ? [] : accountSocialAccounts[profile.login] ?? [],
      pinnedRepositories: getMockAccountRepositories(profile.login).slice(0, profile.login === 'maya' ? 0 : 6),
      readme: profile.login === 'maya'
        ? null
        : isOrganization
          ? createMockOrganizationReadme(profile.login)
          : createMockAccountReadme(profile.login),
      contributionYears: isOrganization ? [] : [2026, 2025, 2024, 2023, 2022],
    }
  }

  async getAccountContributions(options: AccountContributionsOptions): Promise<GitHubAccountContributionYear> {
    return createMockContributionYear(options.year ?? 2026, options.login)
  }

  async listAccountRepositories(options: ListAccountRepositoriesOptions): Promise<GitHubAccountRepositoryPage> {
    return createMockAccountRepositoryPage(
      filterAccountRepositories(getMockAccountRepositories(options.login), options.search),
      options.page ?? 1,
      options.perPage ?? 12,
    )
  }

  async listAccountStarredRepositories(options: ListAccountRepositoriesOptions): Promise<GitHubAccountRepositoryPage> {
    return createMockAccountRepositoryPage(
      filterAccountRepositories(starredRepositoriesByAccount[options.login] ?? [], options.search),
      options.page ?? 1,
      options.perPage ?? 12,
    )
  }

  async getAccountViewerState(login: string): Promise<GitHubAccountViewerState> {
    return {
      isFollowing: followedAccounts.has(login),
      missingScopes: [],
    }
  }

  async setAccountFollowed(options: SetAccountFollowedOptions): Promise<void> {
    if (options.followed) {
      followedAccounts.add(options.login)
      return
    }

    followedAccounts.delete(options.login)
  }

  async listViewerOrganizations(): Promise<GitHubOrganization[]> {
    return organizations
  }

  async listOrganizationRepositories(owner: string): Promise<GitHubRepository[]> {
    return repositoriesByOrganization[owner] ?? []
  }

  async resolveWorkspaceGoto(input: string): Promise<GitHubWorkspaceGotoResult> {
    const normalizedInput = input.trim()
    const parsed = parseMockGotoInput(normalizedInput)

    if (!parsed) {
      return createMockNotFoundResult(normalizedInput, 'invalid')
    }

    if (parsed.repo) {
      const repository = (repositoriesByOrganization[parsed.owner] ?? [])
        .find((item) => item.name.toLowerCase() === parsed.repo?.toLowerCase())

      if (!repository) {
        return createMockNotFoundResult(normalizedInput, 'not_found')
      }

      return {
        status: 'found',
        input: normalizedInput,
        type: 'repo',
        title: repository.nameWithOwner,
        url: `/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`,
      }
    }

    const organization = organizations.find((item) => item.login.toLowerCase() === parsed.owner.toLowerCase())
    if (organization) {
      return {
        status: 'found',
        input: normalizedInput,
        type: 'account',
        title: organization.login,
        url: `/${encodeURIComponent(organization.login)}`,
      }
    }

    const user = users.find((item) => item.login.toLowerCase() === parsed.owner.toLowerCase())
    if (user) {
      return {
        status: 'found',
        input: normalizedInput,
        type: 'account',
        title: user.login,
        url: `/${encodeURIComponent(user.login)}`,
      }
    }

    return createMockNotFoundResult(normalizedInput, 'not_found')
  }

  async searchWorkspace(options: SearchWorkspaceOptions): Promise<GitHubWorkspaceSearchResult> {
    const mode = options.mode
    const query = options.query.trim()
    const page = Math.max(1, Math.floor(options.page ?? 1))
    const perPage = Math.max(1, Math.min(100, Math.floor(options.perPage ?? 20)))

    if (!query) {
      return createMockSearchResult(mode, query, [], page, perPage)
    }

    const userItems = users
      .filter((user) => matchesSearch(user.login, user.description, query))
      .map<GitHubWorkspaceSearchItem>((user) => ({
        id: user.id,
        kind: 'user',
        title: user.login,
        description: user.description,
        url: `https://github.com/${user.login}`,
        workspaceUrl: `/${encodeURIComponent(user.login)}`,
        avatarUrl: user.avatarUrl,
      }))
    const orgItems = organizations
      .filter((organization) => matchesSearch(organization.login, organization.description, query))
      .map<GitHubWorkspaceSearchItem>((organization) => ({
        id: organization.id,
        kind: 'org',
        title: organization.login,
        description: organization.description,
        url: `https://github.com/${organization.login}`,
        workspaceUrl: `/${encodeURIComponent(organization.login)}`,
        avatarUrl: organization.avatarUrl,
      }))
    const repoItems = Object.values(repositoriesByOrganization)
      .flat()
      .filter((repository) => matchesSearch(repository.nameWithOwner, repository.description, query))
      .map<GitHubWorkspaceSearchItem>((repository) => ({
        id: repository.id,
        kind: 'repo',
        title: repository.nameWithOwner,
        description: repository.description,
        url: repository.url,
        workspaceUrl: `/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`,
        owner: repository.owner,
        repo: repository.name,
        nameWithOwner: repository.nameWithOwner,
        isPrivate: repository.isPrivate,
        updatedAt: repository.updatedAt,
      }))

    if (mode === 'users') {
      return createMockSearchResult(mode, query, userItems, page, perPage)
    }

    if (mode === 'orgs') {
      return createMockSearchResult(mode, query, orgItems, page, perPage)
    }

    if (mode === 'repos') {
      return createMockSearchResult(mode, query, repoItems, page, perPage)
    }

    return createMockSearchResult('all', query, [
      ...userItems.slice(0, 8),
      ...orgItems.slice(0, 8),
      ...repoItems.slice(0, 8),
    ], page, perPage)
  }

  async resolveRepositoryReference(
    options: ResolveRepositoryReferenceOptions,
  ): Promise<GitHubRepositoryReferenceResolution> {
    const key = repositoryKey(options)
    const number = options.number
    const pullRequest = (pullRequestsByRepository[key] ?? []).find((item) => item.number === number)

    if (pullRequest) {
      return {
        status: 'found',
        owner: options.owner,
        repo: options.repo,
        repository: key,
        number,
        kind: 'pull-request',
        state: pullRequest.state,
        title: pullRequest.title,
        url: pullRequest.url,
        workspaceUrl: `/${encodeURIComponent(options.owner)}/${encodeURIComponent(options.repo)}/pull/${number}`,
      }
    }

    const issue = (issuesByRepository[key] ?? []).find((item) => item.number === number)

    if (issue) {
      return {
        status: 'found',
        owner: options.owner,
        repo: options.repo,
        repository: key,
        number,
        kind: 'issue',
        state: issue.state,
        title: issue.title,
        url: issue.url,
        workspaceUrl: `/${encodeURIComponent(options.owner)}/${encodeURIComponent(options.repo)}/issues/${number}`,
      }
    }

    return {
      status: 'not_found',
      owner: options.owner,
      repo: options.repo,
      repository: key,
      number,
    }
  }

  async listViewerPullRequests(): Promise<GitHubPullRequest[]> {
    return Object.values(pullRequestsByRepository).flat().slice(0, 8)
  }

  async listPullRequestCategory(options: ListPullRequestCategoryOptions): Promise<GitHubPullRequest[]> {
    const pullRequests = Object.values(pullRequestsByRepository).flat()

    if (options.category === 'created-by-me') {
      return pullRequests.filter((pullRequest) => pullRequest.author.login === 'acbox')
    }

    if (options.category === 'needs-review') {
      return pullRequests.filter((pullRequest) => pullRequest.state !== 'draft')
    }

    if (options.category === 'inbox') {
      return pullRequests.filter((pullRequest) => pullRequest.hasUpdates)
    }

    return pullRequests.filter((pullRequest) => pullRequest.labels.includes('review'))
  }

  async listRepositoryPullRequests(options: ListRepositoryWorkspaceItemsOptions): Promise<GitHubPullRequest[]> {
    return (pullRequestsByRepository[`${options.owner}/${options.repo}`] ?? [])
      .filter((pullRequest) => pullRequest.state === 'open' || pullRequest.state === 'draft')
  }

  async searchRepositoryPullRequests(options: SearchRepositoryPullRequestsOptions): Promise<GitHubPullRequestSearchResult> {
    const pullRequests = pullRequestsByRepository[`${options.owner}/${options.repo}`] ?? []
    const search = options.search?.trim().toLowerCase() ?? ''
    const state = options.state ?? 'open'
    const page = options.page ?? 1
    const perPage = options.perPage ?? 20
    const filtered = pullRequests.filter((pullRequest) => {
      const matchesSearch = !search || pullRequest.title.toLowerCase().includes(search)
      const matchesState = state === 'all'
        || pullRequest.state === state
        || (state === 'closed' && pullRequest.state === 'merged')

      return matchesSearch && matchesState
    })
    const offset = Math.max(0, page - 1) * perPage

    return {
      items: filtered.slice(offset, offset + perPage),
      totalCount: filtered.length,
      page,
      perPage,
      hasNextPage: offset + perPage < filtered.length,
      incompleteResults: false,
    }
  }

  async getPullRequestDetail(options: GetPullRequestDetailOptions): Promise<GitHubPullRequestDetail> {
    const pullRequest = pullRequestsByRepository[repositoryKey(options)]
      ?.find((item) => item.number === options.number)

    return createMockPullRequestDetail(options, pullRequest)
  }

  async createPullRequestComment(options: CreatePullRequestCommentOptions): Promise<GitHubPullRequestComment> {
    const body = options.body.trim()

    if (!body) {
      throw new Error('Comment body is required')
    }

    const key = pullRequestThreadKey(options)
    const createdAt = new Date().toISOString()
    const comment: GitHubPullRequestComment = {
      id: `mock-pr-comment:${repositoryKey(options)}:${options.number}:created:${Date.now()}`,
      author: {
        login: 'acbox',
        avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=80&v=4',
      },
      body,
      createdAt,
      updatedAt: createdAt,
      authorAssociation: 'OWNER',
      reactions: [],
      url: `https://github.com/${repositoryKey(options)}/pull/${options.number}#issuecomment-mock`,
    }

    mockPullRequestCommentsByPullRequest.set(key, [
      ...(mockPullRequestCommentsByPullRequest.get(key) ?? []),
      comment,
    ])

    return comment
  }

  async listViewerIssues(): Promise<GitHubIssue[]> {
    return Object.values(issuesByRepository).flat().slice(0, 8)
  }

  async listIssueCategory(options: ListIssueCategoryOptions): Promise<GitHubIssue[]> {
    const issues = Object.values(issuesByRepository).flat()

    if (options.category === 'created-by-me') {
      return issues.filter((issue) => issue.author.login === 'acbox')
    }

    if (options.category === 'inbox') {
      return issues.filter((issue) => issue.hasUpdates)
    }

    return issues.filter((issue) => issue.labels.includes('triage'))
  }

  async listRepositoryIssues(options: ListRepositoryWorkspaceItemsOptions): Promise<GitHubIssue[]> {
    return (issuesByRepository[`${options.owner}/${options.repo}`] ?? [])
      .filter((issue) => issue.state === 'open')
  }

  async searchRepositoryIssues(options: SearchRepositoryIssuesOptions): Promise<GitHubIssueSearchResult> {
    const issues = issuesByRepository[`${options.owner}/${options.repo}`] ?? []
    const search = options.search?.trim().toLowerCase() ?? ''
    const state = options.state ?? 'open'
    const page = options.page ?? 1
    const perPage = options.perPage ?? 20
    const filtered = issues.filter((issue) => {
      const matchesSearch = !search || issue.title.toLowerCase().includes(search)
      const matchesState = state === 'all'
        || issue.state === state
        || (state === 'closed' && issue.state !== 'open')

      return matchesSearch && matchesState
    })
    const offset = Math.max(0, page - 1) * perPage

    return {
      items: filtered.slice(offset, offset + perPage),
      totalCount: filtered.length,
      page,
      perPage,
      hasNextPage: offset + perPage < filtered.length,
      incompleteResults: false,
    }
  }

  async getIssueDetail(options: GetIssueDetailOptions): Promise<GitHubIssueDetail> {
    const issue = issuesByRepository[repositoryKey(options)]
      ?.find((item) => item.number === options.number)

    return createMockIssueDetail(options, issue)
  }

  async updateIssue(options: UpdateIssueOptions): Promise<GitHubIssueDetail> {
    const key = repositoryKey(options)
    const updatedAt = new Date().toISOString()
    const issues = issuesByRepository[key] ?? []
    let issue = issues.find((item) => item.number === options.number)

    if (!issue) {
      issue = {
        id: `mock-issue:${key}:${options.number}`,
        owner: options.owner,
        repo: options.repo,
        repository: key,
        number: options.number,
        title: options.title?.trim() || `Issue ${options.number}`,
        state: 'open',
        author: {
          login: 'acbox',
          avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=80&v=4',
        },
        updatedAt,
        labels: [],
        url: `https://github.com/${key}/issues/${options.number}`,
        hasUpdates: false,
      }
      issuesByRepository[key] = [...issues, issue]
    }

    issue.title = options.title?.trim() || issue.title
    issue.state = options.state === 'closed' ? 'completed' : options.state === 'open' ? 'open' : issue.state
    issue.labels = options.labels ? [...options.labels] : issue.labels
    issue.updatedAt = updatedAt

    const overrides = mockIssueDetailOverridesByIssue.get(issueThreadKey(options)) ?? {}
    if (options.body !== undefined) {
      overrides.body = options.body
    }
    if (options.assignees !== undefined) {
      overrides.assignees = options.assignees.map((login) => mockAssignableUserActor(login))
    }
    if (options.milestone !== undefined) {
      overrides.milestone = options.milestone === null
        ? null
        : mockMilestoneForNumber(options, options.milestone)
    }
    mockIssueDetailOverridesByIssue.set(issueThreadKey(options), overrides)

    return createMockIssueDetail(options, issue)
  }

  async listRepositoryIssueLabels(options: ListRepositoryWorkspaceItemsOptions): Promise<GitHubIssueLabel[]> {
    return createMockIssueLabels(options)
  }

  async listRepositoryAssignableUsers(_options: ListRepositoryWorkspaceItemsOptions): Promise<GitHubAssignableUser[]> {
    return createMockAssignableUsers()
  }

  async listRepositoryIssueMilestones(options: ListRepositoryWorkspaceItemsOptions): Promise<GitHubIssueMilestone[]> {
    return createMockIssueMilestones(options)
  }

  async createIssueComment(options: CreateIssueCommentOptions): Promise<GitHubIssueComment> {
    const body = options.body.trim()

    if (!body) {
      throw new Error('Comment body is required')
    }

    const key = issueThreadKey(options)
    const createdAt = new Date().toISOString()
    const databaseId = mockDatabaseId(`${key}:created:${createdAt}`)
    const comment: GitHubIssueComment = {
      id: `mock-comment:${databaseId}`,
      databaseId,
      author: {
        login: 'acbox',
        avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=80&v=4',
      },
      body,
      createdAt,
      updatedAt: createdAt,
      authorAssociation: 'OWNER',
      reactions: [],
      url: `https://github.com/${repositoryKey(options)}/issues/${options.number}#issuecomment-mock`,
    }

    mockIssueCommentsByIssue.set(key, [
      ...(mockIssueCommentsByIssue.get(key) ?? []),
      comment,
    ])

    return comment
  }

  async editIssueComment(options: EditIssueCommentOptions): Promise<GitHubIssueComment> {
    const body = options.body.trim()

    if (!body) {
      throw new Error('Comment body is required')
    }

    const updatedAt = new Date().toISOString()
    const existingComment = findMockIssueComment(options.commentId)

    if (existingComment) {
      existingComment.body = body
      existingComment.updatedAt = updatedAt
      return existingComment
    }

    mockIssueCommentEdits.set(options.commentId, { body, updatedAt })

    return {
      id: `mock-comment:${options.commentId}`,
      databaseId: options.commentId,
      author: {
        login: 'acbox',
        avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=80&v=4',
      },
      body,
      createdAt: updatedAt,
      updatedAt,
      authorAssociation: 'OWNER',
      reactions: [],
      url: `https://github.com/${repositoryKey(options)}#issuecomment-${options.commentId}`,
    }
  }

  async deleteIssueComment(options: DeleteIssueCommentOptions): Promise<void> {
    for (const [key, comments] of mockIssueCommentsByIssue.entries()) {
      mockIssueCommentsByIssue.set(
        key,
        comments.filter((comment) => comment.databaseId !== options.commentId),
      )
    }

    mockDeletedIssueComments.add(options.commentId)
  }

  async getRepositoryViewerState(options: RepositoryOptions): Promise<GitHubRepositoryViewerState> {
    return readRepositoryViewerState(options)
  }

  async getRepositoryOverview(options: RepositoryOptions): Promise<GitHubRepositoryOverview> {
    return createMockRepositoryOverview(options)
  }

  async listRepositoryFiles(options: RepositoryFilesOptions): Promise<GitHubRepositoryFileTree> {
    return createMockRepositoryFileTree(options)
  }

  async getRepositoryFilePreview(options: RepositoryFilePreviewOptions): Promise<GitHubRepositoryFilePreview> {
    return createMockRepositoryFilePreview(options)
  }

  async setRepositoryStarred(options: SetRepositoryStarredOptions): Promise<void> {
    const current = readRepositoryViewerState(options)
    const starDelta = options.starred === current.isStarred ? 0 : options.starred ? 1 : -1

    viewerStateByRepository.set(repositoryKey(options), {
      ...current,
      isStarred: options.starred,
      starCount: Math.max(0, current.starCount + starDelta),
    })
  }

  async setRepositoryWatching(options: SetRepositoryWatchingOptions): Promise<void> {
    viewerStateByRepository.set(repositoryKey(options), {
      ...readRepositoryViewerState(options),
      isWatching: options.watching,
    })
  }

  async listNotifications(): Promise<GitHubWorkspaceItem[]> {
    return items
  }

  async listPullRequests(): Promise<GitHubWorkspaceItem[]> {
    return items.filter((item) => item.kind === 'pull_request')
  }

  async listIssues(): Promise<GitHubWorkspaceItem[]> {
    return items.filter((item) => item.kind === 'issue')
  }
}

function readRepositoryViewerState(options: RepositoryOptions): GitHubRepositoryViewerState {
  return viewerStateByRepository.get(repositoryKey(options)) ?? {
    isStarred: false,
    isWatching: false,
    starCount: mockRepositoryStarCount(options),
  }
}

function parseMockGotoInput(input: string): { owner: string, repo?: string } | null {
  const normalized = input.trim()
  if (!normalized) return null

  const urlInput = normalized.match(/^https?:\/\//i) ? normalized : `https://${normalized}`

  try {
    const url = new URL(urlInput)
    if (url.hostname.toLowerCase() === 'github.com') {
      const segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
      return mockSegmentsToGotoInput(segments)
    }
  } catch {
    // Fall back to plain owner/repo parsing.
  }

  return mockSegmentsToGotoInput(normalized.split('/').filter(Boolean))
}

function mockSegmentsToGotoInput(segments: string[]): { owner: string, repo?: string } | null {
  const owner = segments[0]?.trim()
  const repo = segments[1]?.trim()

  if (!owner) return null

  return repo ? { owner, repo } : { owner }
}

function createMockNotFoundResult(
  input: string,
  reason: 'invalid' | 'not_found',
): GitHubWorkspaceGotoResult {
  const query = encodeURIComponent(input)

  return {
    status: 'not_found',
    input,
    reason,
    url: query ? `/not-found?q=${query}` : '/not-found',
  }
}

function createMockSearchResult(
  mode: SearchWorkspaceOptions['mode'],
  query: string,
  items: GitHubWorkspaceSearchItem[],
  page: number,
  perPage: number,
): GitHubWorkspaceSearchResult {
  const offset = (page - 1) * perPage
  const pageItems = mode === 'all' ? items : items.slice(offset, offset + perPage)

  return {
    mode,
    query,
    items: pageItems,
    totalCount: items.length,
    page,
    perPage,
    hasNextPage: offset + perPage < items.length,
    incompleteResults: false,
  }
}

function matchesSearch(title: string, description: string | null, query: string): boolean {
  const normalizedQuery = query.toLowerCase()

  return title.toLowerCase().includes(normalizedQuery)
    || Boolean(description?.toLowerCase().includes(normalizedQuery))
}

function repositoryKey(options: RepositoryOptions): string {
  return `${options.owner}/${options.repo}`
}

function issueThreadKey(options: GetIssueDetailOptions): string {
  return `${repositoryKey(options)}#${options.number}`
}

function pullRequestThreadKey(options: GetPullRequestDetailOptions): string {
  return `${repositoryKey(options)}#${options.number}`
}

function createMockIssueLabels(options: RepositoryOptions): GitHubIssueLabel[] {
  const key = repositoryKey(options)
  const baseLabels: Array<Pick<GitHubIssueLabel, 'name' | 'color' | 'description'>> = [
    { name: 'bug', color: 'd73a4a', description: 'Something is not working' },
    { name: 'triage', color: 'ededed', description: 'Needs initial review' },
    { name: 'detail', color: '5319e7', description: 'Issue detail surface work' },
    { name: 'good first issue', color: '7057ff', description: 'Friendly for first-time contributors' },
    { name: 'design', color: 'f9d0c4', description: 'User interface and interaction work' },
  ]
  const labels = new Map<string, GitHubIssueLabel>(
    baseLabels.map((label) => [
      label.name,
      {
        id: mockDatabaseId(`${key}:label:${label.name}`),
        name: label.name,
        color: label.color,
        description: label.description,
      },
    ]),
  )

  for (const label of (issuesByRepository[key] ?? []).flatMap((issue) => issue.labels)) {
    if (labels.has(label)) continue

    labels.set(label, {
      id: mockDatabaseId(`${key}:label:${label}`),
      name: label,
      color: 'ededed',
      description: null,
    })
  }

  return Array.from(labels.values())
}

function createMockAssignableUsers(): GitHubAssignableUser[] {
  const assignableUsers = [
    ...users.map((user) => ({
      id: user.id,
      login: user.login,
      avatarUrl: user.avatarUrl,
    })),
    {
      id: mockDatabaseId('assignable:arden'),
      login: 'arden',
      avatarUrl: 'https://avatars.githubusercontent.com/u/810438?s=80&v=4',
    },
    {
      id: mockDatabaseId('assignable:octo-lina'),
      login: 'octo-lina',
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231?s=80&v=4',
    },
  ]
  const seen = new Set<string>()

  return assignableUsers.filter((user) => {
    const login = user.login.toLowerCase()
    if (seen.has(login)) return false

    seen.add(login)
    return true
  })
}

function mockAssignableUserActor(login: string): GitHubIssueDetail['assignees'][number] {
  const user = createMockAssignableUsers()
    .find((item) => item.login.toLowerCase() === login.toLowerCase())

  return {
    login,
    avatarUrl: user?.avatarUrl,
  }
}

function createMockIssueMilestones(options: RepositoryOptions): GitHubIssueMilestone[] {
  const key = repositoryKey(options)

  return [
    {
      id: `mock-milestone:${key}:1`,
      number: 1,
      title: 'Issue detail beta',
      description: 'Read-only issue detail data for the desktop workspace.',
      dueOn: '2026-07-10T00:00:00.000Z',
      state: 'open',
      url: `https://github.com/${key}/milestone/1`,
    },
    {
      id: `mock-milestone:${key}:2`,
      number: 2,
      title: 'Issue management actions',
      description: 'Editing, labeling, assignment, milestones, and comments.',
      dueOn: '2026-07-24T00:00:00.000Z',
      state: 'open',
      url: `https://github.com/${key}/milestone/2`,
    },
  ]
}

function mockMilestoneForNumber(options: RepositoryOptions, number: number): GitHubIssueMilestone {
  return createMockIssueMilestones(options).find((milestone) => milestone.number === number) ?? {
    id: `mock-milestone:${repositoryKey(options)}:${number}`,
    number,
    title: `Milestone ${number}`,
    description: null,
    dueOn: null,
    state: 'open',
    url: `https://github.com/${repositoryKey(options)}/milestone/${number}`,
  }
}

function findMockIssueComment(commentId: number): GitHubIssueComment | undefined {
  for (const comments of mockIssueCommentsByIssue.values()) {
    const comment = comments.find((item) => item.databaseId === commentId)
    if (comment) return comment
  }

  return undefined
}

function applyMockIssueCommentOverrides(comments: GitHubIssueComment[]): GitHubIssueComment[] {
  return comments.flatMap((comment) => {
    const databaseId = comment.databaseId
    if (databaseId !== undefined && mockDeletedIssueComments.has(databaseId)) return []

    const edit = databaseId !== undefined ? mockIssueCommentEdits.get(databaseId) : undefined

    return [
      {
        ...comment,
        body: edit?.body ?? comment.body,
        updatedAt: edit?.updatedAt ?? comment.updatedAt,
      },
    ]
  })
}

function mockRepositoryStarCount(options: RepositoryOptions): number {
  return Array.from(repositoryKey(options)).reduce((count, character) => count + character.charCodeAt(0), 0)
}

function mockDatabaseId(value: string): number {
  return Array.from(value)
    .reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 0) + 1
}

function createMockAccountRepositories(owner: string, names: string[]): GitHubAccountRepository[] {
  const languages = ['TypeScript', 'Vue', 'Go', 'Rust', 'Markdown']

  return names.map((name, index) => {
    const key = `${owner}/${name}`
    const isPrivate = name.includes('private') || index % 9 === 0

    return {
      id: Array.from(key).reduce((sum, character) => sum + character.charCodeAt(0), 0),
      name,
      nameWithOwner: key,
      owner,
      ownerAvatarUrl: `https://github.com/${encodeURIComponent(owner)}.png?size=64`,
      description: `${name} workspace notes, GitHub API fixtures, and desktop client experiments.`,
      isPrivate,
      visibility: isPrivate ? 'private' : 'public',
      isFork: name.includes('fork') || index % 7 === 0,
      isArchived: index % 11 === 0,
      isTemplate: name.includes('template'),
      primaryLanguage: languages[index % languages.length],
      primaryLanguageColor: ['#3178c6', '#41b883', '#00add8', '#dea584', '#083fa1'][index % 5],
      stars: 32 + (index + 1) * 17,
      forks: 4 + index * 3,
      topics: ['desktop', 'github', 'workflow'].slice(0, 1 + (index % 3)),
      homepageUrl: index % 3 === 0 ? `https://${name}.example.dev` : null,
      pushedAt: new Date(Date.UTC(2026, 5, 27 - index, 8)).toISOString(),
      updatedAt: new Date(Date.UTC(2026, 5, 27 - index, 10)).toISOString(),
      url: `https://github.com/${key}`,
    }
  })
}

function getMockAccountRepositories(login: string): GitHubAccountRepository[] {
  return repositoriesByAccount[login]
    ?? (repositoriesByOrganization[login] ?? []).map(mapMockOrganizationRepository)
}

function mapMockOrganizationRepository(repository: GitHubRepository): GitHubAccountRepository {
  return {
    id: repository.id,
    name: repository.name,
    nameWithOwner: repository.nameWithOwner,
    owner: repository.owner,
    ownerAvatarUrl: `https://github.com/${encodeURIComponent(repository.owner)}.png?size=64`,
    description: repository.description,
    isPrivate: repository.isPrivate,
    visibility: repository.isPrivate ? 'private' : 'public',
    isFork: false,
    isArchived: false,
    isTemplate: false,
    primaryLanguage: null,
    primaryLanguageColor: null,
    stars: 0,
    forks: 0,
    topics: [],
    homepageUrl: null,
    pushedAt: repository.updatedAt,
    updatedAt: repository.updatedAt,
    url: repository.url,
  }
}

function createMockAccountRepositoryPage(
  repositories: GitHubAccountRepository[],
  rawPage: number,
  rawPerPage: number,
): GitHubAccountRepositoryPage {
  const page = Math.max(1, Math.floor(rawPage))
  const perPage = Math.max(1, Math.min(100, Math.floor(rawPerPage)))
  const offset = (page - 1) * perPage

  return {
    items: repositories.slice(offset, offset + perPage),
    totalCount: repositories.length,
    page,
    perPage,
    hasNextPage: offset + perPage < repositories.length,
    incompleteResults: false,
  }
}

function filterAccountRepositories(
  repositories: GitHubAccountRepository[],
  search: string | undefined,
): GitHubAccountRepository[] {
  const terms = String(search ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return repositories

  return repositories.filter((repository) => {
    const haystack = [
      repository.name,
      repository.nameWithOwner,
      repository.owner,
      repository.description ?? '',
      repository.primaryLanguage ?? '',
      ...repository.topics,
    ].join(' ').toLowerCase()

    return terms.every((term) => haystack.includes(term))
  })
}

function createMockAccountReadme(login: string): GitHubAccountOverview['readme'] {
  return {
    kind: 'readme',
    title: 'README',
    path: 'README.md',
    url: `https://github.com/${login}/${login}/blob/main/README.md`,
    format: 'markdown',
    content: [
      `# ${login}`,
      '',
      'Building a focused desktop GitHub workspace.',
      '',
      '- Reads repository and account data through the main-process bridge.',
      '- Keeps renderer state typed and cacheable.',
      '- Uses shared cards, navigation, and Markdown rendering.',
    ].join('\n'),
  }
}

function createMockOrganizationReadme(login: string): GitHubAccountOverview['readme'] {
  return {
    kind: 'readme',
    title: 'README',
    path: 'profile/README.md',
    url: `https://github.com/${login}/.github/blob/main/profile/README.md`,
    format: 'markdown',
    content: [
      `# ${login}`,
      '',
      'Organization profile README rendered from `.github/profile/README.md`.',
      '',
      '- Organization accounts keep repository browsing and follow actions.',
      '- Stars and contribution heatmaps are intentionally hidden for organizations.',
    ].join('\n'),
  }
}

function createMockContributionYear(year: number, login: string): GitHubAccountContributionYear {
  const weeks: GitHubAccountContributionYear['weeks'] = []
  const start = new Date(Date.UTC(year, 0, 1))
  start.setUTCDate(start.getUTCDate() - start.getUTCDay())
  const end = new Date(Date.UTC(year, 11, 31))
  end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()))
  const current = new Date(start)
  let totalContributions = 0

  while (current <= end) {
    const firstDay = current.toISOString().slice(0, 10)
    const days: GitHubAccountContributionYear['weeks'][number]['days'] = []

    for (let index = 0; index < 7; index += 1) {
      const date = current.toISOString().slice(0, 10)
      const count = current.getUTCFullYear() === year
        ? mockContributionCount(login, current)
        : 0

      totalContributions += count
      days.push({
        date,
        contributionCount: count,
        color: mockContributionColor(count),
        weekday: current.getUTCDay(),
      })
      current.setUTCDate(current.getUTCDate() + 1)
    }

    weeks.push({ firstDay, days })
  }

  return {
    year,
    totalContributions,
    restrictedContributionsCount: year === 2026 ? 42 : 0,
    commitContributions: Math.round(totalContributions * 0.74),
    issueContributions: Math.round(totalContributions * 0.04),
    pullRequestContributions: Math.round(totalContributions * 0.13),
    pullRequestReviewContributions: Math.round(totalContributions * 0.09),
    weeks,
  }
}

function mockContributionCount(login: string, date: Date): number {
  const seed = login.length + date.getUTCDate() + (date.getUTCMonth() + 1) * 3
  if (date.getUTCDay() === 0 || seed % 11 === 0) return 0
  if (seed % 7 === 0) return 9
  if (seed % 5 === 0) return 5
  if (seed % 3 === 0) return 2
  return 1
}

function mockContributionColor(count: number): string {
  if (count <= 0) return '#161b22'
  if (count <= 2) return '#0e4429'
  if (count <= 4) return '#006d32'
  if (count <= 8) return '#26a641'
  return '#39d353'
}

function createMockRepositoryOverview(options: RepositoryOptions): GitHubRepositoryOverview {
  const key = repositoryKey(options)
  const viewerState = readRepositoryViewerState(options)
  const now = new Date(Date.UTC(2026, 5, 27, 10)).toISOString()

  return {
    id: mockRepositoryStarCount(options),
    name: options.repo,
    nameWithOwner: key,
    owner: options.owner,
    description: `${options.repo} is a GitHub desktop workspace surface with repository metadata, work items, and documents.`,
    homepageUrl: `https://${options.repo}.example.dev`,
    url: `https://github.com/${key}`,
    visibility: options.repo.includes('private') ? 'private' : 'public',
    isFork: options.repo.includes('fork'),
    isArchived: false,
    isTemplate: options.repo.includes('template'),
    defaultBranch: 'main',
    primaryLanguage: 'TypeScript',
    languages: [
      { name: 'TypeScript', bytes: 164000 },
      { name: 'Vue', bytes: 82000 },
      { name: 'CSS', bytes: 21000 },
    ],
    topics: ['desktop', 'github', 'electron', 'vue'],
    license: {
      key: 'mit',
      name: 'MIT License',
      spdxId: 'MIT',
      url: `https://api.github.com/repos/${key}/license`,
    },
    counts: {
      stars: viewerState.starCount,
      watchers: 12,
      forks: 184,
      openIssues: 7,
      openPullRequests: 3,
      releases: 5,
      branches: 4,
      tags: 12,
      packages: 2,
    },
    pushedAt: now,
    updatedAt: now,
    documents: [
      {
        kind: 'readme',
        title: 'README',
        path: 'README.md',
        url: `https://github.com/${key}/blob/main/README.md`,
        format: 'markdown',
        content: `# ${options.repo}\n\nThis mock README is rendered through the shared Markdown renderer.\n\n- Real repository metadata is loaded through the main-process GitHub API bridge.\n- Markdown code blocks, tables, and links should render inside this panel.\n\n\`\`\`ts\nconsole.log('${key}')\n\`\`\`\n`,
      },
      {
        kind: 'contributing',
        title: 'Contributing',
        path: 'CONTRIBUTING.md',
        url: `https://github.com/${key}/blob/main/CONTRIBUTING.md`,
        format: 'markdown',
        content: '# Contributing\n\nOpen an issue or pull request with a focused description and reproduction steps.\n',
      },
      {
        kind: 'license',
        title: 'License',
        path: 'LICENSE',
        url: `https://github.com/${key}/blob/main/LICENSE`,
        format: 'text',
        content: 'MIT License\n\nCopyright (c) 2026 Oh My GitHub\n\nPermission is hereby granted...',
      },
    ],
    customProperties: [
      { name: 'Product area', value: 'Repository workspace' },
    ],
    missingScopes: [],
    warnings: [],
  }
}

function createMockRepositoryFileTree(options: RepositoryFilesOptions): GitHubRepositoryFileTree {
  const ref = options.ref?.trim() || 'main'

  return {
    ref,
    truncated: false,
    items: [
      mockFolder(options, ref, 'src', [
        mockFolder(options, ref, 'src/main', [
          mockFile(options, ref, 'src/main/index.ts', 492),
          mockFile(options, ref, 'src/main/repositories.ts', 2190),
        ]),
        mockFolder(options, ref, 'src/renderer', [
          mockFolder(options, ref, 'src/renderer/pages', [
            mockFile(options, ref, 'src/renderer/pages/repository-page.vue', 5840),
          ]),
          mockFile(options, ref, 'src/renderer/app.css', 1840),
        ]),
      ]),
      mockFolder(options, ref, 'public', [
        mockFile(options, ref, 'public/preview.png', 32768),
        mockFile(options, ref, 'public/demo.mp4', 2097152),
      ]),
      mockFile(options, ref, 'README.md', 860),
      mockFile(options, ref, 'package.json', 640),
      mockFile(options, ref, 'release.bin', 4194304),
    ],
  }
}

function createMockRepositoryFilePreview(options: RepositoryFilePreviewOptions): GitHubRepositoryFilePreview {
  const key = repositoryKey(options)
  const ref = options.ref?.trim() || 'main'
  const path = options.path.replace(/^\/+/, '')
  const name = path.split('/').pop() ?? path
  const htmlUrl = mockBlobUrl(key, ref, path)
  const downloadUrl = mockRawUrl(key, ref, path)
  const base = {
    downloadUrl,
    htmlUrl,
    name,
    path,
    title: path,
  }

  if (path.endsWith('.md')) {
    return {
      ...base,
      type: 'markdown',
      content: `# ${name}\n\nThis mock repository file is rendered in the right panel.\n\n- Folders expand in place.\n- Files open previews without changing routes.\n\n\`\`\`ts\nconsole.log('${key}:${path}')\n\`\`\`\n`,
    }
  }

  if (path.endsWith('.png')) {
    return {
      ...base,
      type: 'image',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="%23f4f4f5"/><circle cx="320" cy="180" r="72" fill="%2318181b"/><text x="320" y="286" font-family="system-ui" font-size="28" text-anchor="middle" fill="%2318181b">Oh My GitHub</text></svg>',
    }
  }

  if (path.endsWith('.mp4')) {
    return {
      ...base,
      type: 'video',
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      posterUrl: null,
    }
  }

  if (path.endsWith('.bin')) {
    return {
      ...base,
      type: 'download',
      description: 'This file type is not supported for preview.',
      url: downloadUrl,
    }
  }

  return {
    ...base,
    type: 'code',
    content: mockFileContent(path, key),
    language: mockLanguageForPath(path),
  }
}

function mockFolder(
  options: RepositoryOptions,
  ref: string,
  path: string,
  children: GitHubRepositoryFileNode[],
): GitHubRepositoryFileNode {
  return {
    type: 'tree',
    name: path.split('/').pop() ?? path,
    path,
    sha: mockSha(`${repositoryKey(options)}:${ref}:${path}`),
    size: null,
    downloadUrl: null,
    htmlUrl: mockTreeUrl(repositoryKey(options), ref, path),
    children,
  }
}

function mockFile(
  options: RepositoryOptions,
  ref: string,
  path: string,
  size: number,
): GitHubRepositoryFileNode {
  return {
    type: 'file',
    name: path.split('/').pop() ?? path,
    path,
    sha: mockSha(`${repositoryKey(options)}:${ref}:${path}`),
    size,
    downloadUrl: mockRawUrl(repositoryKey(options), ref, path),
    htmlUrl: mockBlobUrl(repositoryKey(options), ref, path),
    children: [],
  }
}

function mockFileContent(path: string, key: string): string {
  if (path.endsWith('.json')) {
    return JSON.stringify({ name: key, private: true, scripts: { dev: 'electron-vite dev' } }, null, 2)
  }

  if (path.endsWith('.css')) {
    return ':root {\n  color-scheme: light dark;\n}\n\n.repository-file-row {\n  display: grid;\n}\n'
  }

  if (path.endsWith('.vue')) {
    return '<script setup lang="ts">\nconst title = "Repository"\n</script>\n\n<template>\n  <section>{{ title }}</section>\n</template>\n'
  }

  return `export function describeRepositoryFile(): string {\n  return '${key}:${path}'\n}\n`
}

function mockLanguageForPath(path: string): string {
  const normalizedPath = path.toLowerCase()

  if (normalizedPath.endsWith('cargo.lock')) return 'toml'
  if (normalizedPath.endsWith('.css')) return 'css'
  if (normalizedPath.endsWith('.json')) return 'json'
  if (normalizedPath.endsWith('.toml')) return 'toml'
  if (normalizedPath.endsWith('.vue')) return 'vue'
  if (normalizedPath.endsWith('.ts')) return 'typescript'

  return 'plaintext'
}

function mockSha(value: string): string {
  return Array.from(value)
    .reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 0)
    .toString(16)
    .padStart(8, '0')
}

function mockBlobUrl(key: string, ref: string, path: string): string {
  return `https://github.com/${key}/blob/${ref}/${encodeMockPath(path)}`
}

function mockTreeUrl(key: string, ref: string, path: string): string {
  return `https://github.com/${key}/tree/${ref}/${encodeMockPath(path)}`
}

function mockRawUrl(key: string, ref: string, path: string): string {
  return `https://raw.githubusercontent.com/${key}/${ref}/${encodeMockPath(path)}`
}

function encodeMockPath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

function createMockRepositories(owner: string, names: string[]): GitHubRepository[] {
  return names.map((name, index) => ({
    id: Number(`${organizations.find((organization) => organization.login === owner)?.id ?? 9}${index + 1}`),
    name,
    nameWithOwner: `${owner}/${name}`,
    owner,
    description: `${name} workspace placeholder`,
    isPrivate: index % 5 === 0,
    updatedAt: new Date(Date.UTC(2026, 5, 27 - index)).toISOString(),
    url: `https://github.com/${owner}/${name}`,
  }))
}

function createMockPullRequests(owner: string, repo: string, titles: string[]): GitHubPullRequest[] {
  return titles.map((title, index) => ({
    id: `mock-pr:${owner}/${repo}:${index + 1}`,
    owner,
    repo,
    repository: `${owner}/${repo}`,
    number: index + 11,
    title,
    state: index === 3 ? 'merged' : index === 2 ? 'draft' : index === 1 ? 'closed' : 'open',
    ciState: index === 0 ? 'success' : index === 1 ? 'failure' : 'pending',
    author: { login: index % 2 === 0 ? 'acbox' : 'octo-lina' },
    updatedAt: new Date(Date.UTC(2026, 5, 27 - index, 8)).toISOString(),
    labels: index === 0 ? ['workspace'] : ['review'],
    url: `https://github.com/${owner}/${repo}/pull/${index + 11}`,
    hasUpdates: index === 0,
  }))
}

function createMockIssues(owner: string, repo: string, titles: string[]): GitHubIssue[] {
  return titles.map((title, index) => ({
    id: `mock-issue:${owner}/${repo}:${index + 1}`,
    owner,
    repo,
    repository: `${owner}/${repo}`,
    number: index + 31,
    title,
    state: index === 2 ? 'not_planned' : index === 1 ? 'completed' : 'open',
    author: { login: index % 2 === 0 ? 'acbox' : 'arden' },
    updatedAt: new Date(Date.UTC(2026, 5, 26 - index, 10)).toISOString(),
    labels: index === 0 ? ['bug'] : ['triage'],
    url: `https://github.com/${owner}/${repo}/issues/${index + 31}`,
    hasUpdates: index === 1,
  }))
}

function createMockPullRequestDetail(
  options: GetPullRequestDetailOptions,
  pullRequest?: GitHubPullRequest
): GitHubPullRequestDetail {
  const key = repositoryKey(options)
  const title = pullRequest?.title ?? `Implement pull request conversations for ${options.repo}`
  const author = pullRequest?.author ?? { login: 'acbox', avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=80&v=4' }
  const updatedAt = pullRequest?.updatedAt ?? new Date(Date.UTC(2026, 5, 27, 8)).toISOString()
  const createdAt = new Date(Date.UTC(2026, 5, 24, 9, 30)).toISOString()
  const firstCommentAt = new Date(Date.UTC(2026, 5, 25, 13, 15)).toISOString()
  const reviewAt = new Date(Date.UTC(2026, 5, 26, 8, 45)).toISOString()
  const commitAuthor = author

  return {
    id: pullRequest?.id ?? `mock-pr:${key}:${options.number}`,
    owner: options.owner,
    repo: options.repo,
    repository: key,
    number: options.number,
    title,
    state: pullRequest?.state ?? 'open',
    ciState: pullRequest?.ciState ?? 'success',
    author,
    createdAt,
    updatedAt,
    closedAt: pullRequest?.state === 'closed' || pullRequest?.state === 'merged' ? updatedAt : null,
    mergedAt: pullRequest?.state === 'merged' ? updatedAt : null,
    mergedBy: pullRequest?.state === 'merged'
      ? { login: 'maya', avatarUrl: 'https://avatars.githubusercontent.com/u/69631?s=80&v=4' }
      : null,
    body: [
      `This pull request wires the first conversation-focused detail surface for ${key}.`,
      '',
      'Included in the first slice:',
      '',
      '- PR body and comments',
      '- review/request timeline rows',
      '- branch and diff summary metadata',
      '- linked issues in the sidebar',
    ].join('\n'),
    labels: pullRequest?.labels ?? ['workspace', 'review'],
    assignees: [
      { login: 'octo-lina', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?s=80&v=4' },
    ],
    milestone: {
      id: `mock-milestone:${key}:2`,
      number: 2,
      title: 'Pull request detail beta',
      description: 'Conversation-first pull request detail data for the desktop workspace.',
      dueOn: '2026-07-17T00:00:00.000Z',
      state: 'open',
      url: `https://github.com/${key}/milestone/2`,
    },
    participants: [
      author,
      { login: 'octo-lina', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?s=80&v=4' },
      { login: 'maya', avatarUrl: 'https://avatars.githubusercontent.com/u/69631?s=80&v=4' },
    ],
    reviewRequests: [
      {
        id: `mock-review-request:${key}:${options.number}:1`,
        reviewer: { login: 'maya', avatarUrl: 'https://avatars.githubusercontent.com/u/69631?s=80&v=4' },
        reviewerType: 'user',
        asCodeOwner: false,
      },
    ],
    latestReviews: [
      {
        id: `mock-review:${key}:${options.number}:1`,
        author: { login: 'octo-lina', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?s=80&v=4' },
        state: 'commented',
        body: 'The conversation layout matches the issue surface. Leaving one timeline note so the first version has realistic review data.',
        createdAt: reviewAt,
        updatedAt: reviewAt,
        submittedAt: reviewAt,
        authorAssociation: 'MEMBER',
        url: `https://github.com/${key}/pull/${options.number}#pullrequestreview-1`,
      },
    ],
    reviewDecision: 'review_required',
    baseBranch: {
      name: 'main',
      repository: key,
      url: `https://github.com/${key}`,
    },
    headBranch: {
      name: 'codex/pr-conversations',
      repository: key,
      url: `https://github.com/${key}/tree/codex/pr-conversations`,
    },
    isCrossRepository: false,
    maintainerCanModify: true,
    diffStats: {
      additions: 428,
      deletions: 36,
      changedFiles: 11,
    },
    status: {
      ciState: pullRequest?.ciState ?? 'success',
      checksUrl: `https://github.com/${key}/pull/${options.number}/checks`,
      mergeStateStatus: 'CLEAN',
    },
    linkedIssues: [
      {
        id: `mock-linked-issue:${key}:31`,
        owner: options.owner,
        repo: options.repo,
        repository: key,
        number: 31,
        title: 'Sidebar active item is too tall',
        state: 'open',
        url: `https://github.com/${key}/issues/31`,
      },
    ],
    comments: [
      {
        id: `mock-pr-comment:${key}:${options.number}:1`,
        author: { login: 'octo-lina', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?s=80&v=4' },
        body: 'The first conversation slice should reuse the issue timeline and keep commits/checks/review as explicit future entry points.',
        createdAt: firstCommentAt,
        updatedAt: firstCommentAt,
        authorAssociation: 'MEMBER',
        reactions: [
          { content: 'thumbs-up', count: 4, viewerHasReacted: true },
          { content: 'eyes', count: 1 },
        ],
        url: `https://github.com/${key}/pull/${options.number}#issuecomment-1`,
      },
      ...(mockPullRequestCommentsByPullRequest.get(pullRequestThreadKey(options)) ?? []),
    ],
    timelineEvents: [
      {
        id: `mock-pr-event:${key}:${options.number}:requested`,
        type: 'review-requested',
        actor: { login: 'acbox', avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=80&v=4' },
        createdAt: new Date(Date.UTC(2026, 5, 24, 9, 45)).toISOString(),
        reviewer: { login: 'maya', avatarUrl: 'https://avatars.githubusercontent.com/u/69631?s=80&v=4' },
        reviewerType: 'user',
      },
      {
        id: `mock-pr-event:${key}:${options.number}:branch`,
        type: 'base-ref-changed',
        actor: { login: 'acbox', avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=80&v=4' },
        createdAt: new Date(Date.UTC(2026, 5, 24, 10, 15)).toISOString(),
        from: 'develop',
        to: 'main',
      },
      {
        id: `mock-pr-event:${key}:${options.number}:commit-1`,
        type: 'committed',
        actor: commitAuthor,
        createdAt: new Date(Date.UTC(2026, 5, 24, 10, 30)).toISOString(),
        afterCommit: '11a72ba',
        url: `https://github.com/${key}/commit/11a72ba`,
        commit: {
          id: `mock-pr-commit:${key}:${options.number}:1`,
          oid: '11a72ba9a7b1e724e7f72693e3f2c9fa12e54321',
          abbreviatedOid: '11a72ba',
          messageHeadline: 'feat: add context frag phase one',
          authoredDate: new Date(Date.UTC(2026, 5, 24, 10, 30)).toISOString(),
          committedDate: new Date(Date.UTC(2026, 5, 24, 10, 30)).toISOString(),
          author: commitAuthor,
          authorIsGitHubUser: true,
          ciState: null,
          url: `https://github.com/${key}/commit/11a72ba`,
        },
      },
      {
        id: `mock-pr-event:${key}:${options.number}:commit-2`,
        type: 'committed',
        actor: commitAuthor,
        createdAt: new Date(Date.UTC(2026, 5, 24, 10, 32)).toISOString(),
        afterCommit: 'fe427d5',
        url: `https://github.com/${key}/commit/fe427d5`,
        commit: {
          id: `mock-pr-commit:${key}:${options.number}:2`,
          oid: 'fe427d5a7b1e724e7f72693e3f2c9fa12e54322',
          abbreviatedOid: 'fe427d5',
          messageHeadline: 'feat: harden context frag contracts',
          authoredDate: new Date(Date.UTC(2026, 5, 24, 10, 32)).toISOString(),
          committedDate: new Date(Date.UTC(2026, 5, 24, 10, 32)).toISOString(),
          author: commitAuthor,
          authorIsGitHubUser: true,
          ciState: 'pending',
          url: `https://github.com/${key}/commit/fe427d5`,
        },
      },
      {
        id: `mock-pr-event:${key}:${options.number}:commit-3`,
        type: 'committed',
        actor: commitAuthor,
        createdAt: new Date(Date.UTC(2026, 5, 24, 10, 34)).toISOString(),
        afterCommit: 'f5f1b3b',
        url: `https://github.com/${key}/commit/f5f1b3b`,
        commit: {
          id: `mock-pr-commit:${key}:${options.number}:3`,
          oid: 'f5f1b3ba7b1e724e7f72693e3f2c9fa12e54323',
          abbreviatedOid: 'f5f1b3b',
          messageHeadline: 'fix: clarify context frag ref durability with a deliberately long headline',
          authoredDate: new Date(Date.UTC(2026, 5, 24, 10, 34)).toISOString(),
          committedDate: new Date(Date.UTC(2026, 5, 24, 10, 34)).toISOString(),
          author: commitAuthor,
          authorIsGitHubUser: true,
          ciState: 'success',
          url: `https://github.com/${key}/commit/f5f1b3b`,
        },
      },
      {
        id: `mock-pr-event:${key}:${options.number}:force-push`,
        type: 'head-ref-force-pushed',
        actor: commitAuthor,
        createdAt: new Date(Date.UTC(2026, 5, 24, 10, 45)).toISOString(),
        ref: 'codex/pr-conversations',
        beforeCommit: 'fe427d5',
        afterCommit: 'f5f1b3b',
        url: `https://github.com/${key}/commit/f5f1b3b`,
      },
      {
        id: `mock-pr-event:${key}:${options.number}:review`,
        type: 'reviewed',
        actor: { login: 'octo-lina', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?s=80&v=4' },
        createdAt: reviewAt,
        body: 'The API shape looks good for a read-only v1.',
        reviewState: 'commented',
        url: `https://github.com/${key}/pull/${options.number}#pullrequestreview-1`,
      },
      {
        id: `mock-pr-event:${key}:${options.number}:linked`,
        type: 'connected',
        actor: { login: 'maya', avatarUrl: 'https://avatars.githubusercontent.com/u/69631?s=80&v=4' },
        createdAt: new Date(Date.UTC(2026, 5, 26, 9)).toISOString(),
        source: {
          type: 'issue',
          repository: key,
          number: 31,
          title: 'Sidebar active item is too tall',
          url: `https://github.com/${key}/issues/31`,
        },
      },
      {
        id: `mock-pr-event:${key}:${options.number}:merged`,
        type: 'merged',
        actor: { login: 'maya', avatarUrl: 'https://avatars.githubusercontent.com/u/69631?s=80&v=4' },
        createdAt: new Date(Date.UTC(2026, 5, 26, 10)).toISOString(),
        ref: 'main',
        afterCommit: '71c683f',
        url: `https://github.com/${key}/commit/71c683f`,
      },
    ],
    reactions: [
      { content: 'rocket', count: 2 },
      { content: 'heart', count: 1 },
    ],
    url: pullRequest?.url ?? `https://github.com/${key}/pull/${options.number}`,
    hasUpdates: pullRequest?.hasUpdates ?? false,
  }
}

function createMockIssueDetail(options: GetIssueDetailOptions, issue?: GitHubIssue): GitHubIssueDetail {
  const key = repositoryKey(options)
  const threadKey = issueThreadKey(options)
  const overrides = mockIssueDetailOverridesByIssue.get(threadKey) ?? {}
  const hasMilestoneOverride = Object.prototype.hasOwnProperty.call(overrides, 'milestone')
  const title = issue?.title ?? `Follow up on ${options.repo} issue detail`
  const author = issue?.author ?? { login: 'acbox', avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=80&v=4' }
  const updatedAt = issue?.updatedAt ?? new Date(Date.UTC(2026, 5, 26, 10)).toISOString()
  const createdAt = new Date(Date.UTC(2026, 5, 24, 9, 30)).toISOString()
  const firstCommentAt = new Date(Date.UTC(2026, 5, 25, 13, 15)).toISOString()
  const secondCommentAt = new Date(Date.UTC(2026, 5, 26, 8, 45)).toISOString()

  return {
    id: issue?.id ?? `mock-issue:${key}:${options.number}`,
    owner: options.owner,
    repo: options.repo,
    repository: key,
    number: options.number,
    title,
    state: issue?.state ?? 'open',
    author,
    createdAt,
    updatedAt,
    closedAt: issue?.state === 'open' || !issue ? null : updatedAt,
    body: overrides.body ?? [
      `The issue detail surface needs a reliable read-only contract for ${key}.`,
      '',
      'Expected data:',
      '',
      '- issue body and metadata',
      '- labels, assignees, milestone, and participants',
      '- comments with reactions',
      '- core timeline events for triage and state changes',
    ].join('\n'),
    labels: issue?.labels ?? ['triage', 'detail'],
    assignees: overrides.assignees ?? [
      { login: 'octo-lina', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?s=80&v=4' },
      { login: 'maya', avatarUrl: 'https://avatars.githubusercontent.com/u/69631?s=80&v=4' },
    ],
    milestone: hasMilestoneOverride ? overrides.milestone ?? null : mockMilestoneForNumber(options, 1),
    participants: [
      author,
      { login: 'octo-lina', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?s=80&v=4' },
      { login: 'arden', avatarUrl: 'https://avatars.githubusercontent.com/u/810438?s=80&v=4' },
    ],
    comments: applyMockIssueCommentOverrides([
      {
        id: `mock-comment:${key}:${options.number}:1`,
        databaseId: mockDatabaseId(`${threadKey}:comment:1`),
        author: { login: 'octo-lina', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?s=80&v=4' },
        body: 'I can reproduce this from the repository issue list. The detail route should be able to render without extra renderer-side GitHub calls.',
        createdAt: firstCommentAt,
        updatedAt: firstCommentAt,
        authorAssociation: 'MEMBER',
        reactions: [
          { content: 'thumbs-up', count: 3, viewerHasReacted: true },
          { content: 'eyes', count: 1 },
        ],
        url: `https://github.com/${key}/issues/${options.number}#issuecomment-1`,
      },
      {
        id: `mock-comment:${key}:${options.number}:2`,
        databaseId: mockDatabaseId(`${threadKey}:comment:2`),
        author: { login: 'arden', avatarUrl: 'https://avatars.githubusercontent.com/u/810438?s=80&v=4' },
        body: 'Mock data should include at least one cross-reference and one rename event so the activity list can be designed against real shapes.',
        createdAt: secondCommentAt,
        updatedAt: secondCommentAt,
        authorAssociation: 'CONTRIBUTOR',
        reactions: [
          { content: 'heart', count: 2 },
        ],
        url: `https://github.com/${key}/issues/${options.number}#issuecomment-2`,
      },
      ...(mockIssueCommentsByIssue.get(threadKey) ?? []),
    ]),
    timelineEvents: [
      {
        id: `mock-event:${key}:${options.number}:mentioned`,
        type: 'mentioned',
        actor: { login: 'github-actions', avatarUrl: 'https://avatars.githubusercontent.com/u/44036562?s=80&v=4' },
        createdAt: new Date(Date.UTC(2026, 5, 24, 10)).toISOString(),
      },
      {
        id: `mock-event:${key}:${options.number}:labeled`,
        type: 'labeled',
        actor: { login: 'acbox', avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=80&v=4' },
        createdAt: new Date(Date.UTC(2026, 5, 24, 10, 6)).toISOString(),
        label: issue?.labels[0] ?? 'triage',
      },
      {
        id: `mock-event:${key}:${options.number}:assigned`,
        type: 'assigned',
        actor: { login: 'acbox', avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=80&v=4' },
        createdAt: new Date(Date.UTC(2026, 5, 24, 10, 12)).toISOString(),
        assignee: { login: 'octo-lina', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?s=80&v=4' },
      },
      {
        id: `mock-event:${key}:${options.number}:renamed`,
        type: 'renamed',
        actor: { login: 'octo-lina', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?s=80&v=4' },
        createdAt: new Date(Date.UTC(2026, 5, 25, 9)).toISOString(),
        from: 'Draft issue detail routes',
        to: title,
      },
      {
        id: `mock-event:${key}:${options.number}:cross-reference`,
        type: 'cross-referenced',
        actor: { login: 'maya', avatarUrl: 'https://avatars.githubusercontent.com/u/69631?s=80&v=4' },
        createdAt: new Date(Date.UTC(2026, 5, 26, 8)).toISOString(),
        url: `https://github.com/${key}/pull/42`,
        source: {
          type: 'pull-request',
          repository: key,
          number: 42,
          title: 'Wire issue detail data bridge',
          url: `https://github.com/${key}/pull/42`,
        },
      },
    ],
    reactions: [
      { content: 'thumbs-up', count: 5 },
      { content: 'rocket', count: 1 },
    ],
    url: issue?.url ?? `https://github.com/${key}/issues/${options.number}`,
    hasUpdates: issue?.hasUpdates ?? false,
  }
}
