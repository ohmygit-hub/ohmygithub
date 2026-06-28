import type {
  CreateIssueCommentOptions,
  GetIssueDetailOptions,
  GitHubClient,
  GitHubIssue,
  GitHubIssueSearchResult,
  GitHubIssueComment,
  GitHubIssueDetail,
  GitHubOrganization,
  GitHubPullRequest,
  GitHubPullRequestSearchResult,
  GitHubRepository,
  GitHubRepositoryFileNode,
  GitHubRepositoryFilePreview,
  GitHubRepositoryFileTree,
  GitHubRepositoryOverview,
  GitHubRepositoryViewerState,
  GitHubWorkspaceGotoResult,
  GitHubWorkspaceSearchItem,
  GitHubWorkspaceSearchResult,
  GitHubWorkspaceItem,
  ListIssueCategoryOptions,
  ListPullRequestCategoryOptions,
  ListRepositoryWorkspaceItemsOptions,
  RepositoryFilePreviewOptions,
  RepositoryFilesOptions,
  RepositoryOptions,
  SearchRepositoryIssuesOptions,
  SearchRepositoryPullRequestsOptions,
  SearchWorkspaceOptions,
  SetRepositoryStarredOptions,
  SetRepositoryWatchingOptions
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
const mockIssueCommentsByIssue = new Map<string, GitHubIssueComment[]>()

export class MockGitHubClient implements GitHubClient {
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
        type: 'org',
        title: organization.login,
        url: `/${encodeURIComponent(organization.login)}?type=org`,
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
        workspaceUrl: `/${encodeURIComponent(organization.login)}?type=org`,
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

  async createIssueComment(options: CreateIssueCommentOptions): Promise<GitHubIssueComment> {
    const body = options.body.trim()

    if (!body) {
      throw new Error('Comment body is required')
    }

    const key = issueThreadKey(options)
    const createdAt = new Date().toISOString()
    const comment: GitHubIssueComment = {
      id: `mock-comment:${repositoryKey(options)}:${options.number}:created:${Date.now()}`,
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

function mockRepositoryStarCount(options: RepositoryOptions): number {
  return Array.from(repositoryKey(options)).reduce((count, character) => count + character.charCodeAt(0), 0)
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

function createMockIssueDetail(options: GetIssueDetailOptions, issue?: GitHubIssue): GitHubIssueDetail {
  const key = repositoryKey(options)
  const title = issue?.title ?? `Follow up on ${options.repo} issue detail`
  const author = issue?.author ?? { login: 'acbox', avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=80&v=4' }
  const updatedAt = issue?.updatedAt ?? new Date(Date.UTC(2026, 5, 26, 10)).toISOString()
  const createdAt = new Date(Date.UTC(2026, 5, 24, 9, 30)).toISOString()
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
    body: [
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
    assignees: [
      { login: 'octo-lina', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?s=80&v=4' },
      { login: 'maya', avatarUrl: 'https://avatars.githubusercontent.com/u/69631?s=80&v=4' },
    ],
    milestone: {
      id: `mock-milestone:${key}:1`,
      number: 1,
      title: 'Issue detail beta',
      description: 'Read-only issue detail data for the desktop workspace.',
      dueOn: '2026-07-10T00:00:00.000Z',
      state: 'open',
      url: `https://github.com/${key}/milestone/1`,
    },
    participants: [
      author,
      { login: 'octo-lina', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?s=80&v=4' },
      { login: 'arden', avatarUrl: 'https://avatars.githubusercontent.com/u/810438?s=80&v=4' },
    ],
    comments: [
      {
        id: `mock-comment:${key}:${options.number}:1`,
        author: { login: 'octo-lina', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?s=80&v=4' },
        body: 'I can reproduce this from the repository issue list. The detail route should be able to render without extra renderer-side GitHub calls.',
        createdAt: new Date(Date.UTC(2026, 5, 25, 13, 15)).toISOString(),
        updatedAt: new Date(Date.UTC(2026, 5, 25, 13, 15)).toISOString(),
        authorAssociation: 'MEMBER',
        reactions: [
          { content: 'thumbs-up', count: 3, viewerHasReacted: true },
          { content: 'eyes', count: 1 },
        ],
        url: `https://github.com/${key}/issues/${options.number}#issuecomment-1`,
      },
      {
        id: `mock-comment:${key}:${options.number}:2`,
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
      ...(mockIssueCommentsByIssue.get(issueThreadKey(options)) ?? []),
    ],
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
