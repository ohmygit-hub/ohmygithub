import type {
  GitHubClient,
  GitHubIssue,
  GitHubOrganization,
  GitHubPullRequest,
  GitHubPullRequestSearchResult,
  GitHubRepository,
  GitHubRepositoryFileNode,
  GitHubRepositoryFilePreview,
  GitHubRepositoryFileTree,
  GitHubRepositoryOverview,
  GitHubRepositoryViewerState,
  GitHubWorkspaceItem,
  ListIssueCategoryOptions,
  ListPullRequestCategoryOptions,
  ListRepositoryWorkspaceItemsOptions,
  RepositoryFilePreviewOptions,
  RepositoryFilesOptions,
  RepositoryOptions,
  SearchRepositoryPullRequestsOptions,
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

export class MockGitHubClient implements GitHubClient {
  async listViewerOrganizations(): Promise<GitHubOrganization[]> {
    return organizations
  }

  async listOrganizationRepositories(owner: string): Promise<GitHubRepository[]> {
    return repositoriesByOrganization[owner] ?? []
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
    return issuesByRepository[`${options.owner}/${options.repo}`] ?? []
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

function repositoryKey(options: RepositoryOptions): string {
  return `${options.owner}/${options.repo}`
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
  if (path.endsWith('.css')) return 'css'
  if (path.endsWith('.json')) return 'json'
  if (path.endsWith('.vue')) return 'vue'
  if (path.endsWith('.ts')) return 'typescript'

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
    state: 'open',
    author: { login: index % 2 === 0 ? 'acbox' : 'arden' },
    updatedAt: new Date(Date.UTC(2026, 5, 26 - index, 10)).toISOString(),
    labels: index === 0 ? ['bug'] : ['triage'],
    url: `https://github.com/${owner}/${repo}/issues/${index + 31}`,
    hasUpdates: index === 1,
  }))
}
