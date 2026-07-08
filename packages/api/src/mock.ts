import type {
  CreateIssueCommentOptions,
  CreatePullRequestCommentOptions,
  CreateReleaseOptions,
  DeleteDeploymentOptions,
  DeleteEnvironmentOptions,
  DeleteReleaseOptions,
  DeploymentTargetOptions,
  AccountContributionsOptions,
  DispatchWorkflowOptions,
  GetIssueDetailOptions,
  GetPullRequestDetailOptions,
  GetWorkflowJobLogOptions,
  GetWorkflowRunOptions,
  GitHubAccountContributionYear,
  GitHubAccountOverview,
  GitHubAccountProfile,
  GitHubAccountRepository,
  GitHubAccountRepositoryPage,
  GitHubAccountStarList,
  GitHubAccountViewerState,
  GitHubActionJob,
  GitHubActionJobLog,
  GitHubActionRun,
  GitHubActionRunPage,
  GitHubActionStep,
  GitHubActionWorkflow,
  GitHubClient,
  GitHubDeployment,
  GitHubDeploymentPage,
  GitHubDeploymentState,
  GitHubDeploymentStatus,
  GitHubEnvironment,
  GitHubEnvironmentPage,
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
  GitHubPullRequest,
  GitHubPullRequestComment,
  GitHubPullRequestDetail,
  GitHubPullRequestSearchResult,
  GitHubRelease,
  GitHubReleasePage,
  GitHubCommitDetail,
  GitHubCommitFile,
  GitHubRepository,
  GitHubRepositoryBranch,
  GitHubRepositoryCommit,
  GitHubRepositoryCommitPage,
  GitHubRepositoryContributorStatsResult,
  GitHubRepositoryContributorSummary,
  GitHubRepositoryFileNode,
  GitHubRepositoryFilePreview,
  GitHubRepositoryFileTree,
  GitHubRepositoryNavigationCounts,
  GitHubRepositoryOverview,
  GitHubRepositoryReferenceResolution,
  GitHubRepositoryViewerState,
  GitHubWorkspaceGotoResult,
  GitHubWorkspaceSearchItem,
  GitHubWorkspaceSearchResult,
  GitHubWorkspaceItem,
  ListAccountRepositoriesOptions,
  ListDeploymentStatusesOptions,
  ListIssueCategoryOptions,
  ListPackageVersionsOptions,
  ListPullRequestCategoryOptions,
  ListPullRequestCommitsOptions,
  ListRepositoryDeploymentsOptions,
  ListRepositoryEnvironmentsOptions,
  ListRepositoryPackagesOptions,
  ListRepositoryReleasesOptions,
  ListRepositoryWorkspaceItemsOptions,
  ListRepositoryWorkflowRunsOptions,
  ListWorkflowRunJobsOptions,
  CreateRepositoryBranchOptions,
  CreateRepositoryTagOptions,
  DeleteRepositoryBranchOptions,
  DeleteRepositoryTagOptions,
  GitHubBranchListItem,
  GitHubBranchPage,
  GitHubCreatedRef,
  GitHubTagListItem,
  GitHubTagPage,
  ListRepositoryBranchesDetailedOptions,
  ListRepositoryTagsOptions,
  PackageTargetOptions,
  PackageVersionTargetOptions,
  RenameRepositoryBranchOptions,
  RepositoryBranchesOptions,
  RepositoryCommitOptions,
  RepositoryCommitsOptions,
  RepositoryFilePreviewOptions,
  RepositoryFilesOptions,
  RepositoryOptions,
  ResolveRepositoryReferenceOptions,
  RerunWorkflowJobOptions,
  RerunWorkflowRunOptions,
  SearchRepositoryIssuesOptions,
  SearchRepositoryPullRequestsOptions,
  SearchWorkspaceOptions,
  SetAccountFollowedOptions,
  SetRepositoryStarredOptions,
  SetRepositorySubscriptionOptions,
  UpdateReleaseOptions,
  CreateRepositoryOptions,
  ForkRepositoryOptions,
  GitHubCreatedRepository,
  GitHubForkedRepository,
  GitHubLicenseTemplate,
  GitHubActor,
  GitHubIssueMilestone,
  GitHubLabel
} from './types'

const MOCK_LABEL_COLORS: Record<string, string> = {
  review: '0e8a16',
  desktop: '5319e7',
  api: '1d76db',
  inbox: 'fbca04',
  design: 'd93f0b',
  'good first issue': '7057ff',
  ci: '0052cc',
  renderer: 'c2e0c6',
  workspace: 'bfdadc',
  bug: 'd73a4a',
  triage: 'fbca04',
  detail: 'c5def5'
}

function mockLabels(...names: string[]): GitHubLabel[] {
  return names.map((name) => ({
    name,
    color: MOCK_LABEL_COLORS[name] ?? '8b949e',
    description: null
  }))
}

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
    labels: mockLabels('review', 'desktop'),
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
    labels: mockLabels('api', 'inbox'),
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
    labels: mockLabels('design', 'good first issue'),
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
    labels: mockLabels('ci', 'renderer'),
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

const workflowsByRepository: Record<string, GitHubActionWorkflow[]> = {
  'oh-my-github/client': createMockActionWorkflows('oh-my-github', 'client'),
  'oh-my-github/api': createMockActionWorkflows('oh-my-github', 'api'),
  'oh-my-github/ui': createMockActionWorkflows('oh-my-github', 'ui'),
  'vuejs/core': createMockActionWorkflows('vuejs', 'core'),
}

const runsByRepository: Record<string, GitHubActionRun[]> = Object.fromEntries(
  Object.entries(workflowsByRepository).map(([repository, workflows]) => {
    const [owner, repo] = repository.split('/')
    return [repository, createMockActionRuns(owner, repo, workflows)]
  })
)

const jobsByRun = new Map<number, GitHubActionJob[]>()
const logsByJob = new Map<number, string>()

for (const runs of Object.values(runsByRepository)) {
  for (const run of runs) {
    const jobs = createMockActionJobs(run)
    jobsByRun.set(run.id, jobs)

    for (const job of jobs) {
      logsByJob.set(job.id, createMockActionLog(run, job))
    }
  }
}

const environmentsByRepository: Record<string, GitHubEnvironment[]> = {
  'oh-my-github/client': createMockEnvironments('oh-my-github', 'client'),
  'oh-my-github/api': createMockEnvironments('oh-my-github', 'api'),
  'oh-my-github/ui': createMockEnvironments('oh-my-github', 'ui'),
  'vuejs/core': createMockEnvironments('vuejs', 'core'),
}

const deploymentsByRepository: Record<string, GitHubDeployment[]> = Object.fromEntries(
  Object.entries(environmentsByRepository).map(([repository, environments]) => {
    const [owner, repo] = repository.split('/')
    return [repository, createMockDeployments(owner, repo, environments)]
  })
)

const statusesByDeployment = new Map<number, GitHubDeploymentStatus[]>()

for (const deployments of Object.values(deploymentsByRepository)) {
  for (const deployment of deployments) {
    statusesByDeployment.set(deployment.id, createMockDeploymentStatusHistory(deployment))
  }
}

const releasesByRepository = new Map<string, GitHubRelease[]>()
let nextMockReleaseId = 9000

function createMockReleaseAssets(repository: string, tag: string, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: nextMockReleaseId += 1,
    name: index === 0 ? `${tag}-darwin-arm64.dmg` : `${tag}-win-x64.exe`,
    size: 24 * 1024 * 1024 + index * 3 * 1024 * 1024,
    downloadCount: 128 - index * 40,
    contentType: 'application/octet-stream',
    browserDownloadUrl: `https://github.com/${repository}/releases/download/${tag}/asset-${index}`,
    updatedAt: '2026-05-20T10:00:00Z',
  }))
}

function createMockReleases(owner: string, repo: string): GitHubRelease[] {
  const repository = `${owner}/${repo}`
  const entries: Array<Partial<GitHubRelease> & { tagName: string }> = [
    { tagName: 'v2.1.0', name: 'v2.1.0 (draft)', draft: true, body: '## Unreleased\n- WIP changes', publishedAt: null },
    { tagName: 'v2.0.0-beta.1', name: 'v2.0.0 Beta 1', prerelease: true, body: '## Beta\n- Preview features' },
    { tagName: 'v1.2.0', name: 'v1.2.0', body: '## Features\n- Added releases panel\n\n## Fixes\n- Assorted fixes' },
    { tagName: 'v1.1.0', name: 'v1.1.0', body: '## Features\n- Improved sidebar' },
    { tagName: 'v1.0.0', name: 'v1.0.0', body: 'First stable release' },
  ]

  return entries.map((entry, index) => ({
    id: nextMockReleaseId += 1,
    tagName: entry.tagName,
    targetCommitish: 'main',
    name: entry.name ?? entry.tagName,
    body: entry.body ?? null,
    draft: entry.draft ?? false,
    prerelease: entry.prerelease ?? false,
    createdAt: `2026-0${Math.min(9, 6 - index)}-01T09:00:00Z`,
    publishedAt: entry.draft ? null : entry.publishedAt ?? `2026-0${Math.min(9, 6 - index)}-02T09:00:00Z`,
    htmlUrl: `https://github.com/${repository}/releases/tag/${entry.tagName}`,
    author: { login: 'octocat', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4' },
    assets: createMockReleaseAssets(repository, entry.tagName, entry.draft ? 0 : (index % 3)),
    tarballUrl: `https://api.github.com/repos/${repository}/tarball/${entry.tagName}`,
    zipballUrl: `https://api.github.com/repos/${repository}/zipball/${entry.tagName}`,
  }))
}

function getMockReleases(options: RepositoryOptions): GitHubRelease[] {
  const key = repositoryKey(options)
  let releases = releasesByRepository.get(key)

  if (!releases) {
    releases = createMockReleases(options.owner, options.repo)
    releasesByRepository.set(key, releases)
  }

  return releases
}

interface MockPackageRecord extends GitHubPackage {
  repository: { owner: string; name: string }
}

const packagesByRepository = new Map<string, MockPackageRecord[]>()
const deletedPackagesByRepository = new Map<string, MockPackageRecord[]>()
const packageVersionsByPackageId = new Map<number, GitHubPackageVersion[]>()
const deletedPackageVersionsByPackageId = new Map<number, GitHubPackageVersion[]>()
let nextMockPackageId = 8000

function createMockPackages(owner: string, repo: string): MockPackageRecord[] {
  const repository = { owner, name: repo }

  return [
    {
      id: nextMockPackageId += 1,
      name: `${repo}-server`,
      packageType: 'npm',
      visibility: 'public',
      versionCount: 3,
      ownerLogin: owner,
      htmlUrl: `https://github.com/${owner}/${repo}/pkgs/npm/${repo}-server`,
      createdAt: '2026-04-01T09:00:00Z',
      updatedAt: '2026-06-20T09:00:00Z',
      repository,
    },
    {
      id: nextMockPackageId += 1,
      name: repo,
      packageType: 'docker',
      visibility: 'private',
      versionCount: 3,
      ownerLogin: owner,
      htmlUrl: `https://github.com/${owner}/${repo}/pkgs/container/${repo}`,
      createdAt: '2026-03-01T09:00:00Z',
      updatedAt: '2026-06-25T09:00:00Z',
      repository,
    },
    {
      id: nextMockPackageId += 1,
      name: `${repo}-runtime`,
      packageType: 'container',
      visibility: 'public',
      versionCount: 2,
      ownerLogin: owner,
      htmlUrl: `https://github.com/${owner}/${repo}/pkgs/container/${repo}-runtime`,
      createdAt: '2026-02-01T09:00:00Z',
      updatedAt: '2026-06-28T09:00:00Z',
      repository,
    },
  ]
}

function createMockPackageVersions(pkg: MockPackageRecord): GitHubPackageVersion[] {
  if (pkg.packageType === 'container') {
    return [
      {
        id: pkg.id * 10 + 1,
        name: 'sha256:mockdigest01',
        htmlUrl: `${pkg.htmlUrl}/1`,
        description: null,
        containerTags: ['latest', 'v1.2.0'],
        createdAt: '2026-06-28T09:00:00Z',
        updatedAt: '2026-06-28T09:00:00Z',
      },
      {
        id: pkg.id * 10 + 2,
        name: 'sha256:mockdigest02',
        htmlUrl: `${pkg.htmlUrl}/2`,
        description: null,
        containerTags: ['v1.1.0'],
        createdAt: '2026-05-15T09:00:00Z',
        updatedAt: '2026-05-15T09:00:00Z',
      },
    ]
  }

  return [
    {
      id: pkg.id * 10 + 1,
      name: '1.2.0',
      htmlUrl: null,
      description: 'Latest release',
      containerTags: [],
      createdAt: '2026-06-20T09:00:00Z',
      updatedAt: '2026-06-20T09:00:00Z',
    },
    {
      id: pkg.id * 10 + 2,
      name: '1.1.0',
      htmlUrl: null,
      description: null,
      containerTags: [],
      createdAt: '2026-05-10T09:00:00Z',
      updatedAt: '2026-05-10T09:00:00Z',
    },
    {
      id: pkg.id * 10 + 3,
      name: '1.0.0',
      htmlUrl: null,
      description: null,
      containerTags: [],
      createdAt: '2026-04-01T09:00:00Z',
      updatedAt: '2026-04-01T09:00:00Z',
    },
  ]
}

function getMockPackages(options: RepositoryOptions): MockPackageRecord[] {
  const key = repositoryKey(options)
  let packages = packagesByRepository.get(key)

  if (!packages) {
    packages = createMockPackages(options.owner, options.repo)
    packagesByRepository.set(key, packages)

    for (const pkg of packages) {
      packageVersionsByPackageId.set(pkg.id, createMockPackageVersions(pkg))
    }
  }

  return packages
}

function toGitHubPackage(pkg: MockPackageRecord): GitHubPackage {
  const { repository: _repository, ...rest } = pkg

  return rest
}

function locateMockPackage(
  owner: string,
  packageType: GitHubPackageType,
  packageName: string,
): { key: string; pkg: MockPackageRecord } | null {
  for (const [key, packages] of packagesByRepository.entries()) {
    const pkg = packages.find((item) =>
      item.ownerLogin.toLowerCase() === owner.toLowerCase()
      && item.packageType === packageType
      && item.name === packageName)

    if (pkg) return { key, pkg }
  }

  return null
}

function findMockPackageRecord(owner: string, packageType: GitHubPackageType, packageName: string): MockPackageRecord {
  const located = locateMockPackage(owner, packageType, packageName)

  if (!located) {
    throw new Error('Package not found')
  }

  return located.pkg
}

const MOCK_AUTHOR = {
  login: 'octocat',
  name: 'The Octocat',
  avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
}

function createMockBranches(owner: string, repo: string): GitHubBranchListItem[] {
  return [
    {
      name: 'main',
      commitSha: `${repo}-main`,
      shortSha: `${repo}-main`.slice(0, 7),
      committedDate: '2026-06-28T10:00:00Z',
      author: MOCK_AUTHOR,
      aheadBy: 0,
      behindBy: 0,
      isDefault: true,
      isProtected: true,
      associatedPullRequest: null,
    },
    {
      name: 'develop',
      commitSha: `${repo}-develop`,
      shortSha: `${repo}-develop`.slice(0, 7),
      committedDate: '2026-06-25T15:30:00Z',
      author: MOCK_AUTHOR,
      aheadBy: 2,
      behindBy: 1,
      isDefault: false,
      isProtected: false,
      associatedPullRequest: {
        number: 12,
        title: 'Develop integration branch',
        url: `https://github.com/${owner}/${repo}/pull/12`,
      },
    },
    {
      name: 'feature/login',
      commitSha: `${repo}-feature-login`,
      shortSha: `${repo}-feature-login`.slice(0, 7),
      committedDate: '2026-06-20T08:45:00Z',
      author: { login: 'hubot', name: 'Hubot', avatarUrl: null },
      aheadBy: 5,
      behindBy: 3,
      isDefault: false,
      isProtected: false,
      associatedPullRequest: null,
    },
  ]
}

function createMockTags(repo: string): GitHubTagListItem[] {
  return [
    {
      name: 'v1.2.0',
      commitSha: `${repo}-v1.2.0`,
      shortSha: `${repo}-v1.2.0`.slice(0, 7),
      date: '2026-06-01T09:00:00Z',
      message: 'Release v1.2.0',
      isAnnotated: true,
    },
    {
      name: 'v1.1.0',
      commitSha: `${repo}-v1.1.0`,
      shortSha: `${repo}-v1.1.0`.slice(0, 7),
      date: '2026-05-01T09:00:00Z',
      message: null,
      isAnnotated: false,
    },
    {
      name: 'v1.0.0',
      commitSha: `${repo}-v1.0.0`,
      shortSha: `${repo}-v1.0.0`.slice(0, 7),
      date: '2026-04-01T09:00:00Z',
      message: 'First stable release',
      isAnnotated: true,
    },
  ]
}

function getMockBranches(options: RepositoryOptions): GitHubBranchListItem[] {
  const key = repositoryKey(options)
  let branches = branchesByRepository.get(key)

  if (!branches) {
    branches = createMockBranches(options.owner, options.repo)
    branchesByRepository.set(key, branches)
  }

  return branches
}

function getMockTags(options: RepositoryOptions): GitHubTagListItem[] {
  const key = repositoryKey(options)
  let tags = tagsByRepository.get(key)

  if (!tags) {
    tags = createMockTags(options.repo)
    tagsByRepository.set(key, tags)
  }

  return tags
}

function paginateMockRefs<T extends { name: string }>(
  entries: T[],
  options: { query?: string; page?: number; perPage?: number }
): { items: T[]; totalCount: number; page: number; perPage: number; hasNextPage: boolean } {
  const query = options.query?.trim().toLowerCase()
  const filtered = query ? entries.filter((entry) => entry.name.toLowerCase().includes(query)) : entries
  const page = Math.max(1, Math.floor(options.page ?? 1))
  const perPage = Math.max(1, Math.min(50, Math.floor(options.perPage ?? 20)))
  const start = (page - 1) * perPage
  const items = filtered.slice(start, start + perPage)

  return {
    items,
    totalCount: filtered.length,
    page,
    perPage,
    hasNextPage: start + items.length < filtered.length,
  }
}

const branchesByRepository = new Map<string, GitHubBranchListItem[]>()
const tagsByRepository = new Map<string, GitHubTagListItem[]>()
const viewerStateByRepository = new Map<string, GitHubRepositoryViewerState>()
const followedAccounts = new Set(['octocat'])
const mockIssueCommentsByIssue = new Map<string, GitHubIssueComment[]>()
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
    const slug = String(options.list ?? '').trim().toLowerCase()
    const starred = slug
      ? getMockStarLists(options.login).find((entry) => entry.list.slug === slug)?.repositories ?? []
      : starredRepositoriesByAccount[options.login] ?? []

    return createMockAccountRepositoryPage(
      filterAccountRepositories(starred, options.search),
      options.page ?? 1,
      options.perPage ?? 12,
    )
  }

  async listAccountStarredLists(login: string): Promise<GitHubAccountStarList[]> {
    return getMockStarLists(login).map((entry) => entry.list)
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

  async listAllViewerRepositories(): Promise<GitHubRepository[]> {
    return Object.values(repositoriesByOrganization).flat()
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
        // Fixtures carry no star count; derive a stable illustrative value so the
        // dev search results render a plausible ⭐ figure.
        starCount: (repository.name.length * 137) % 4200,
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

    return pullRequests.filter((pullRequest) => pullRequest.labels.some((label) => label.name === 'review'))
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
      nodeId: `mock-pr-comment-node:${Date.now()}`,
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
      viewerCanUpdate: true,
    }

    mockPullRequestCommentsByPullRequest.set(key, [
      ...(mockPullRequestCommentsByPullRequest.get(key) ?? []),
      comment,
    ])

    return comment
  }

  async updatePullRequest(): Promise<void> {
    return
  }

  async closePullRequest(): Promise<void> {
    return
  }

  async requestPullRequestReviewers(): Promise<void> {
    return
  }

  async markPullRequestReadyForReview(): Promise<void> {
    return
  }

  async mergePullRequest(): Promise<void> {
    return
  }

  async updatePullRequestComment(): Promise<void> {
    return
  }

  async listPullRequestFiles(): Promise<GitHubCommitFile[]> {
    return [
      {
        filename: 'README.md',
        status: 'modified',
        additions: 2,
        deletions: 1,
        patch: '@@ -1,2 +1,3 @@\n title\n-old line\n+new line\n+added line',
      },
      {
        filename: 'src/index.ts',
        status: 'added',
        additions: 5,
        deletions: 0,
        patch: '@@ -0,0 +1,5 @@\n+export function main(): void {\n+  console.log(\'hello\')\n+}\n+\n+main()',
      },
    ]
  }

  async listPullRequestCommits(options: ListPullRequestCommitsOptions): Promise<GitHubRepositoryCommitPage> {
    const page = Math.max(1, Math.floor(options.page ?? 1))
    const perPage = Math.max(1, Math.min(100, Math.floor(options.perPage ?? 30)))
    const items: GitHubRepositoryCommit[] = page > 1
      ? []
      : [
          {
            sha: 'bbbbbbb000000000000000000000000000000000',
            shortSha: 'bbbbbbb',
            message: 'Add pull request feature',
            headline: 'Add pull request feature',
            author: { login: 'octocat', name: 'The Octocat', avatarUrl: null },
            committedDate: '2026-01-02T00:00:00Z',
            htmlUrl: `https://github.com/${options.owner}/${options.repo}/commit/bbbbbbb`,
            ciState: 'success',
          },
        ]

    return { items, page, perPage, hasPreviousPage: page > 1, hasNextPage: false }
  }

  async submitPullRequestReview(): Promise<void> {
    return
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

    return issues.filter((issue) => issue.labels.some((label) => label.name === 'triage'))
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
      nodeId: `mock-comment-node:${Date.now()}`,
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
      viewerCanUpdate: true,
    }

    mockIssueCommentsByIssue.set(key, [
      ...(mockIssueCommentsByIssue.get(key) ?? []),
      comment,
    ])

    return comment
  }

  async listRepositoryLabels(): Promise<GitHubLabel[]> {
    return mockLabels('bug', 'enhancement', 'good first issue', 'triage')
  }

  async listRepositoryMilestones(): Promise<GitHubIssueMilestone[]> {
    return [
      {
        id: 'mock-milestone:1',
        number: 1,
        title: 'v1.0',
        description: null,
        dueOn: null,
        state: 'open',
        url: 'https://github.com/oh-my-github/client/milestone/1'
      }
    ]
  }

  async listAssignableUsers(): Promise<GitHubActor[]> {
    return [
      { login: 'octo-lina', avatarUrl: undefined },
      { login: 'maya', avatarUrl: undefined }
    ]
  }

  async updateIssue(): Promise<void> {
    return
  }

  async updateIssueComment(): Promise<void> {
    return
  }

  async setIssueSubscription(): Promise<void> {
    return
  }

  async setIssueLock(): Promise<void> {
    return
  }

  async setIssuePinned(): Promise<void> {
    return
  }

  async deleteIssue(): Promise<void> {
    return
  }

  async setReaction(): Promise<void> {
    return
  }

  async getRepositoryViewerState(options: RepositoryOptions): Promise<GitHubRepositoryViewerState> {
    return readRepositoryViewerState(options)
  }

  async getRepositoryNavigationCounts(): Promise<GitHubRepositoryNavigationCounts> {
    return {
      commits: 238,
      openIssues: 7,
      openPullRequests: 3,
    }
  }

  async getRepositoryOverview(options: RepositoryOptions): Promise<GitHubRepositoryOverview> {
    return createMockRepositoryOverview(options)
  }

  async getRepositoryContributorStats(): Promise<GitHubRepositoryContributorStatsResult> {
    return createMockRepositoryContributorStats()
  }

  async listRepositoryContributors(): Promise<GitHubRepositoryContributorSummary[]> {
    return createMockRepositoryContributorStats().contributors.map((contributor) => ({
      id: contributor.author.id,
      login: contributor.author.login,
      avatarUrl: contributor.author.avatarUrl,
      contributions: contributor.total,
      type: contributor.author.type,
    }))
  }

  async listRepositoryFiles(options: RepositoryFilesOptions): Promise<GitHubRepositoryFileTree> {
    return createMockRepositoryFileTree(options)
  }

  async listRepositoryCommits(options: RepositoryCommitsOptions): Promise<GitHubRepositoryCommitPage> {
    const page = Math.max(1, Math.floor(options.page ?? 1))
    const perPage = Math.max(1, Math.min(100, Math.floor(options.perPage ?? 30)))
    const items: GitHubRepositoryCommit[] = page > 1
      ? []
      : [
          {
            sha: 'aaaaaaa000000000000000000000000000000000',
            shortSha: 'aaaaaaa',
            message: 'Initial commit',
            headline: 'Initial commit',
            author: { login: 'octocat', name: 'The Octocat', avatarUrl: null },
            committedDate: '2026-01-01T00:00:00Z',
            htmlUrl: `https://github.com/${options.owner}/${options.repo}/commit/aaaaaaa`,
            ciState: 'success',
          },
        ]

    return { items, page, perPage, hasPreviousPage: page > 1, hasNextPage: false }
  }

  async listRepositoryBranches(options: RepositoryBranchesOptions): Promise<GitHubRepositoryBranch[]> {
    return getMockBranches(options).map((branch) => ({
      name: branch.name,
      commitSha: branch.commitSha,
    }))
  }

  async listRepositoryBranchesDetailed(options: ListRepositoryBranchesDetailedOptions): Promise<GitHubBranchPage> {
    return {
      ...paginateMockRefs(getMockBranches(options), options),
      defaultBranch: options.defaultBranch ?? 'main',
    }
  }

  async listRepositoryTags(options: ListRepositoryTagsOptions): Promise<GitHubTagPage> {
    return paginateMockRefs(getMockTags(options), options)
  }

  async createRepositoryBranch(options: CreateRepositoryBranchOptions): Promise<GitHubCreatedRef> {
    const name = options.name.trim()
    const fromRef = options.fromRef.trim()
    if (!name) {
      throw new Error('Branch name is required')
    }

    const branches = getMockBranches(options)
    if (branches.some((branch) => branch.name === name)) {
      throw new Error(`Branch "${name}" already exists`)
    }

    const base = branches.find((branch) => branch.name === fromRef)
    if (!base) {
      throw new Error(`Unable to resolve ref "heads/${fromRef}"`)
    }

    branches.push({
      ...base,
      name,
      isDefault: false,
      isProtected: false,
      aheadBy: 0,
      behindBy: 0,
      associatedPullRequest: null,
    })

    return { ref: `refs/heads/${name}`, sha: base.commitSha }
  }

  async renameRepositoryBranch(options: RenameRepositoryBranchOptions): Promise<void> {
    const branch = getMockBranches(options).find((entry) => entry.name === options.name.trim())
    if (!branch) {
      throw new Error(`Branch "${options.name}" not found`)
    }

    branch.name = options.newName.trim()
  }

  async deleteRepositoryBranch(options: DeleteRepositoryBranchOptions): Promise<void> {
    const key = repositoryKey(options)
    const branches = getMockBranches(options)
    branchesByRepository.set(key, branches.filter((branch) => branch.name !== options.name.trim()))
  }

  async createRepositoryTag(options: CreateRepositoryTagOptions): Promise<GitHubCreatedRef> {
    const name = options.name.trim()
    if (!name) {
      throw new Error('Tag name is required')
    }

    const tags = getMockTags(options)
    if (tags.some((tag) => tag.name === name)) {
      throw new Error(`Tag "${name}" already exists`)
    }

    const base = getMockBranches(options).find((branch) => branch.name === options.fromRef.trim())
    if (!base) {
      throw new Error(`Unable to resolve ref "heads/${options.fromRef}"`)
    }

    const message = options.message?.trim() || null
    tags.unshift({
      name,
      commitSha: base.commitSha,
      shortSha: base.commitSha.slice(0, 7),
      date: '2026-07-01T09:00:00Z',
      message,
      isAnnotated: Boolean(message),
    })

    return { ref: `refs/tags/${name}`, sha: base.commitSha }
  }

  async deleteRepositoryTag(options: DeleteRepositoryTagOptions): Promise<void> {
    const key = repositoryKey(options)
    const tags = getMockTags(options)
    tagsByRepository.set(key, tags.filter((tag) => tag.name !== options.name.trim()))
  }

  async getRepositoryCommit(options: RepositoryCommitOptions): Promise<GitHubCommitDetail> {
    return {
      sha: options.sha,
      shortSha: options.sha.slice(0, 7),
      headline: 'Initial commit',
      message: 'Initial commit',
      htmlUrl: `https://github.com/${options.owner}/${options.repo}/commit/${options.sha}`,
      author: { login: 'octocat', name: 'The Octocat', avatarUrl: null, date: '2026-01-01T00:00:00Z' },
      committer: { login: 'octocat', name: 'The Octocat', avatarUrl: null, date: '2026-01-01T00:00:00Z' },
      parents: [],
      verification: { verified: false, reason: 'unsigned' },
      stats: { additions: 2, deletions: 1, total: 3 },
      files: [
        {
          filename: 'README.md',
          status: 'modified',
          additions: 2,
          deletions: 1,
          patch: '@@ -1,2 +1,3 @@\n title\n-old line\n+new line\n+added line',
        },
      ],
      ciState: 'success',
    }
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

  async setRepositorySubscription(options: SetRepositorySubscriptionOptions): Promise<void> {
    viewerStateByRepository.set(repositoryKey(options), {
      ...readRepositoryViewerState(options),
      isWatching: options.subscription === 'all',
      subscription: options.subscription,
    })
  }

  async forkRepository(options: ForkRepositoryOptions): Promise<GitHubForkedRepository> {
    const owner = options.organization?.trim() || 'octocat'
    const name = options.name?.trim() || options.repo

    return {
      owner,
      name,
      nameWithOwner: `${owner}/${name}`,
      url: `https://github.com/${owner}/${name}`,
      ready: true,
    }
  }

  async createRepository(options: CreateRepositoryOptions): Promise<GitHubCreatedRepository> {
    const owner = options.organization?.trim() || 'octocat'
    const name = options.name.trim()

    return {
      owner,
      name,
      nameWithOwner: `${owner}/${name}`,
      url: `https://github.com/${owner}/${name}`,
    }
  }

  async listGitignoreTemplates(): Promise<string[]> {
    return ['Node', 'Python', 'Go']
  }

  async listLicenses(): Promise<GitHubLicenseTemplate[]> {
    return [
      { key: 'mit', name: 'MIT License' },
      { key: 'apache-2.0', name: 'Apache License 2.0' },
    ]
  }

  async listRepositoryWorkflows(options: RepositoryOptions): Promise<GitHubActionWorkflow[]> {
    return workflowsByRepository[repositoryKey(options)] ?? []
  }

  async listRepositoryWorkflowRuns(options: ListRepositoryWorkflowRunsOptions): Promise<GitHubActionRunPage> {
    const page = Math.max(1, Math.floor(options.page ?? 1))
    const perPage = Math.max(1, Math.min(100, Math.floor(options.perPage ?? 20)))
    const workflowId = options.workflowId && options.workflowId !== 'all' ? options.workflowId : null
    const headSha = options.headSha?.trim().toLowerCase() || null
    const runs = (runsByRepository[repositoryKey(options)] ?? [])
      .filter((run) => workflowId === null || run.workflowId === workflowId)
      .filter((run) => headSha === null || run.headSha.toLowerCase() === headSha)
    const offset = (page - 1) * perPage

    return {
      items: runs.slice(offset, offset + perPage),
      totalCount: runs.length,
      page,
      perPage,
      hasNextPage: offset + perPage < runs.length,
    }
  }

  async getWorkflowRun(options: GetWorkflowRunOptions): Promise<GitHubActionRun> {
    const run = (runsByRepository[repositoryKey(options)] ?? [])
      .find((item) => item.id === options.runId)

    if (!run) {
      throw new Error('Workflow run not found')
    }

    return run
  }

  async listWorkflowRunJobs(options: ListWorkflowRunJobsOptions): Promise<GitHubActionJob[]> {
    return jobsByRun.get(options.runId) ?? []
  }

  async getWorkflowJobLog(options: GetWorkflowJobLogOptions): Promise<GitHubActionJobLog> {
    return {
      jobId: options.jobId,
      content: logsByJob.get(options.jobId) ?? '',
      fetchedAt: new Date().toISOString(),
      isAvailable: true,
    }
  }

  async rerunWorkflowRun(options: RerunWorkflowRunOptions): Promise<void> {
    const run = findMockWorkflowRun(options)
    markRunRerunning(run)

    for (const job of jobsByRun.get(run.id) ?? []) {
      markJobRerunning(run, job)
    }
  }

  async rerunFailedWorkflowRunJobs(options: RerunWorkflowRunOptions): Promise<void> {
    const run = findMockWorkflowRun(options)
    markRunRerunning(run)

    for (const job of jobsByRun.get(run.id) ?? []) {
      if (job.conclusion !== 'success') {
        markJobRerunning(run, job)
      }
    }
  }

  async rerunWorkflowJob(options: RerunWorkflowJobOptions): Promise<void> {
    const { run, job } = findMockWorkflowJob(options)

    markRunRerunning(run)
    markJobRerunning(run, job)
  }

  async dispatchWorkflow(options: DispatchWorkflowOptions): Promise<void> {
    const key = repositoryKey(options)
    const workflow = (workflowsByRepository[key] ?? []).find((item) => item.id === options.workflowId)

    if (!workflow) {
      throw new Error('Workflow not found')
    }

    const runs = runsByRepository[key] ?? (runsByRepository[key] = [])
    const id = runs.reduce((max, run) => Math.max(max, run.id), workflow.id * 100) + 1
    const now = new Date().toISOString()
    const run: GitHubActionRun = {
      id,
      runNumber: runs.reduce((max, item) => Math.max(max, item.runNumber), 0) + 1,
      runAttempt: 1,
      name: workflow.name,
      displayTitle: workflow.name,
      workflowId: workflow.id,
      workflowName: workflow.name,
      event: 'workflow_dispatch',
      status: 'queued',
      conclusion: null,
      headBranch: options.ref,
      headSha: mockSha(`${key}:run:${id}`).padEnd(40, '0').slice(0, 40),
      actor: {
        login: 'acbox',
        avatarUrl: 'https://github.com/acbox.png?size=64',
      },
      triggeringActor: null,
      checkSuiteId: id + 5000,
      createdAt: now,
      updatedAt: now,
      runStartedAt: null,
      completedAt: null,
      url: `https://api.github.com/repos/${key}/actions/runs/${id}`,
      htmlUrl: `https://github.com/${key}/actions/runs/${id}`,
      jobsUrl: `https://api.github.com/repos/${key}/actions/runs/${id}/jobs`,
      logsUrl: `https://api.github.com/repos/${key}/actions/runs/${id}/logs`,
    }

    runs.unshift(run)

    const jobs = createMockActionJobs(run)
    jobsByRun.set(run.id, jobs)

    for (const job of jobs) {
      logsByJob.set(job.id, createMockActionLog(run, job))
    }
  }

  async listRepositoryEnvironments(options: ListRepositoryEnvironmentsOptions): Promise<GitHubEnvironmentPage> {
    const page = Math.max(1, Math.floor(options.page ?? 1))
    const perPage = Math.max(1, Math.min(100, Math.floor(options.perPage ?? 20)))
    const environments = environmentsByRepository[repositoryKey(options)] ?? []
    const offset = (page - 1) * perPage

    return {
      items: environments.slice(offset, offset + perPage),
      totalCount: environments.length,
      page,
      perPage,
      hasNextPage: offset + perPage < environments.length,
    }
  }

  async listRepositoryDeployments(options: ListRepositoryDeploymentsOptions): Promise<GitHubDeploymentPage> {
    const page = Math.max(1, Math.floor(options.page ?? 1))
    const perPage = Math.max(1, Math.min(100, Math.floor(options.perPage ?? 20)))
    const environment = options.environment?.trim() || null
    const ref = options.ref?.trim() || null
    const sha = options.sha?.trim() || null
    const task = options.task?.trim() || null
    const deployments = (deploymentsByRepository[repositoryKey(options)] ?? [])
      .filter((deployment) => !environment || deployment.environment === environment)
      .filter((deployment) => !ref || deployment.ref === ref)
      .filter((deployment) => !sha || deployment.sha === sha)
      .filter((deployment) => !task || deployment.task === task)
    const offset = (page - 1) * perPage

    return {
      items: deployments.slice(offset, offset + perPage),
      totalCount: null,
      page,
      perPage,
      hasNextPage: offset + perPage < deployments.length,
    }
  }

  async listDeploymentStatuses(options: ListDeploymentStatusesOptions): Promise<GitHubDeploymentStatus[]> {
    return statusesByDeployment.get(options.deploymentId) ?? []
  }

  async markDeploymentInactive(options: DeploymentTargetOptions): Promise<void> {
    const deployment = findMockDeployment(options)
    const inactiveStatus: GitHubDeploymentStatus = {
      id: deployment.id * 10 + 9,
      state: 'inactive',
      description: '',
      environmentUrl: deployment.latestStatus?.environmentUrl ?? null,
      logUrl: deployment.latestStatus?.logUrl ?? null,
      creator: { login: 'acbox', avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=80&v=4' },
      createdAt: new Date().toISOString(),
    }

    deployment.latestStatus = inactiveStatus
    statusesByDeployment.set(deployment.id, [inactiveStatus, ...(statusesByDeployment.get(deployment.id) ?? [])])
  }

  async deleteDeployment(options: DeleteDeploymentOptions): Promise<void> {
    const key = repositoryKey(options)
    const deployments = deploymentsByRepository[key] ?? []
    const deployment = deployments.find((item) => item.id === options.deploymentId)

    if (!deployment) {
      throw new Error('Deployment not found')
    }

    const isOnlyDeployment = deployments.length === 1
    const isInactive = deployment.latestStatus?.state === 'inactive'

    if (!options.deactivateFirst && !isInactive && !isOnlyDeployment) {
      throw new Error('Deployment is still active. Deactivate it before deleting, or pass deactivateFirst.')
    }

    if (options.deactivateFirst) {
      await this.markDeploymentInactive(options)
    }

    deploymentsByRepository[key] = deployments.filter((item) => item.id !== options.deploymentId)
    statusesByDeployment.delete(options.deploymentId)
  }

  async deleteEnvironment(options: DeleteEnvironmentOptions): Promise<void> {
    const key = repositoryKey(options)

    environmentsByRepository[key] = (environmentsByRepository[key] ?? [])
      .filter((environment) => environment.name !== options.environmentName)
  }

  async listRepositoryReleases(options: ListRepositoryReleasesOptions): Promise<GitHubReleasePage> {
    const page = Math.max(1, Math.floor(options.page ?? 1))
    const perPage = Math.max(1, Math.min(100, Math.floor(options.perPage ?? 20)))
    const releases = getMockReleases(options)
    const offset = (page - 1) * perPage

    return {
      items: releases.slice(offset, offset + perPage),
      page,
      perPage,
      hasPreviousPage: page > 1,
      hasNextPage: offset + perPage < releases.length,
    }
  }

  async createRelease(options: CreateReleaseOptions): Promise<GitHubRelease> {
    const tagName = options.tagName.trim()
    if (!tagName) {
      throw new Error('Release tag name is required')
    }

    const releases = getMockReleases(options)
    const release: GitHubRelease = {
      id: nextMockReleaseId += 1,
      tagName,
      targetCommitish: options.targetCommitish ?? 'main',
      name: options.name ?? null,
      body: options.body ?? null,
      draft: options.draft ?? false,
      prerelease: options.prerelease ?? false,
      createdAt: new Date().toISOString(),
      publishedAt: options.draft ? null : new Date().toISOString(),
      htmlUrl: `https://github.com/${repositoryKey(options)}/releases/tag/${tagName}`,
      author: { login: 'octocat' },
      assets: [],
      tarballUrl: null,
      zipballUrl: null,
    }

    releases.unshift(release)
    return release
  }

  async updateRelease(options: UpdateReleaseOptions): Promise<GitHubRelease> {
    const release = getMockReleases(options).find((item) => item.id === options.releaseId)
    if (!release) {
      throw new Error('Release not found')
    }

    if (options.tagName?.trim()) {
      release.tagName = options.tagName.trim()
    }
    if (options.targetCommitish) {
      release.targetCommitish = options.targetCommitish
    }
    if (options.name != null) {
      release.name = options.name
    }
    if (options.body != null) {
      release.body = options.body
    }
    if (options.prerelease !== undefined) {
      release.prerelease = options.prerelease
    }
    if (options.draft !== undefined) {
      if (release.draft && !options.draft) {
        release.publishedAt = new Date().toISOString()
      }
      release.draft = options.draft
    }

    return release
  }

  async deleteRelease(options: DeleteReleaseOptions): Promise<void> {
    const releases = getMockReleases(options)
    const index = releases.findIndex((item) => item.id === options.releaseId)

    if (index === -1) {
      throw new Error('Release not found')
    }

    releases.splice(index, 1)
  }

  async listRepositoryPackages(options: ListRepositoryPackagesOptions): Promise<GitHubPackagePage> {
    const page = Math.max(1, Math.floor(options.page ?? 1))
    const perPage = Math.max(1, Math.min(100, Math.floor(options.perPage ?? 20)))
    const packages = getMockPackages(options)
    const sorted = [...packages].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
    const totalCount = sorted.length
    const offset = (page - 1) * perPage

    return {
      items: sorted.slice(offset, offset + perPage).map((pkg) => toGitHubPackage(pkg)),
      totalCount,
      page,
      perPage,
      hasNextPage: page * perPage < totalCount,
      failedTypes: [],
      truncated: false,
    }
  }

  async listPackageVersions(options: ListPackageVersionsOptions): Promise<GitHubPackageVersionPage> {
    const page = Math.max(1, Math.floor(options.page ?? 1))
    const perPage = Math.max(1, Math.min(100, Math.floor(options.perPage ?? 30)))
    const pkg = findMockPackageRecord(options.owner, options.packageType, options.packageName)
    const versions = packageVersionsByPackageId.get(pkg.id) ?? []
    const offset = (page - 1) * perPage
    const items = versions.slice(offset, offset + perPage)

    return {
      items,
      totalCount: null,
      page,
      perPage,
      hasNextPage: items.length === perPage,
    }
  }

  async deletePackage(options: PackageTargetOptions): Promise<void> {
    const located = locateMockPackage(options.owner, options.packageType, options.packageName)

    if (!located) {
      throw new Error('Package not found')
    }

    const { key, pkg } = located
    packagesByRepository.set(key, (packagesByRepository.get(key) ?? []).filter((item) => item.id !== pkg.id))
    deletedPackagesByRepository.set(key, [...(deletedPackagesByRepository.get(key) ?? []), pkg])
  }

  async restorePackage(options: PackageTargetOptions): Promise<void> {
    for (const [key, deleted] of deletedPackagesByRepository.entries()) {
      const pkg = deleted.find((item) =>
        item.ownerLogin.toLowerCase() === options.owner.toLowerCase()
        && item.packageType === options.packageType
        && item.name === options.packageName)

      if (pkg) {
        deletedPackagesByRepository.set(key, deleted.filter((item) => item.id !== pkg.id))
        packagesByRepository.set(key, [...(packagesByRepository.get(key) ?? []), pkg])
        return
      }
    }

    throw new Error('Deleted package not found')
  }

  async deletePackageVersion(options: PackageVersionTargetOptions): Promise<void> {
    const pkg = findMockPackageRecord(options.owner, options.packageType, options.packageName)
    const versions = packageVersionsByPackageId.get(pkg.id) ?? []
    const version = versions.find((item) => item.id === options.versionId)

    if (!version) {
      throw new Error('Package version not found')
    }

    packageVersionsByPackageId.set(pkg.id, versions.filter((item) => item.id !== options.versionId))
    deletedPackageVersionsByPackageId.set(pkg.id, [
      ...(deletedPackageVersionsByPackageId.get(pkg.id) ?? []),
      version,
    ])
  }

  async restorePackageVersion(options: PackageVersionTargetOptions): Promise<void> {
    const pkg = findMockPackageRecord(options.owner, options.packageType, options.packageName)
    const deleted = deletedPackageVersionsByPackageId.get(pkg.id) ?? []
    const version = deleted.find((item) => item.id === options.versionId)

    if (!version) {
      throw new Error('Deleted package version not found')
    }

    deletedPackageVersionsByPackageId.set(pkg.id, deleted.filter((item) => item.id !== options.versionId))
    packageVersionsByPackageId.set(pkg.id, [version, ...(packageVersionsByPackageId.get(pkg.id) ?? [])])
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

function findMockWorkflowRun(options: GetWorkflowRunOptions): GitHubActionRun {
  const run = (runsByRepository[repositoryKey(options)] ?? [])
    .find((item) => item.id === options.runId)

  if (!run) {
    throw new Error('Workflow run not found')
  }

  return run
}

function findMockWorkflowJob(options: RerunWorkflowJobOptions): { run: GitHubActionRun, job: GitHubActionJob } {
  for (const run of runsByRepository[repositoryKey(options)] ?? []) {
    const job = (jobsByRun.get(run.id) ?? []).find((item) => item.id === options.jobId)

    if (job) {
      return { run, job }
    }
  }

  throw new Error('Workflow job not found')
}

function findMockDeployment(options: DeploymentTargetOptions): GitHubDeployment {
  for (const deployments of Object.values(deploymentsByRepository)) {
    const deployment = deployments.find((item) => item.id === options.deploymentId)

    if (deployment) {
      return deployment
    }
  }

  throw new Error('Deployment not found')
}

function markRunRerunning(run: GitHubActionRun): void {
  run.status = 'queued'
  run.conclusion = null
  run.runAttempt += 1
  run.runStartedAt = null
  run.completedAt = null
  run.updatedAt = new Date().toISOString()
}

function markJobRerunning(run: GitHubActionRun, job: GitHubActionJob): void {
  job.status = 'queued'
  job.conclusion = null
  job.runAttempt = run.runAttempt
  job.startedAt = null
  job.completedAt = null
  job.steps = job.steps.map((step) => ({
    ...step,
    status: 'queued',
    conclusion: null,
    startedAt: null,
    completedAt: null,
  }))
  logsByJob.set(job.id, '')
}

function readRepositoryViewerState(options: RepositoryOptions): GitHubRepositoryViewerState {
  return viewerStateByRepository.get(repositoryKey(options)) ?? {
    isStarred: false,
    isWatching: false,
    subscription: 'participating',
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

function mockRepositoryStarCount(options: RepositoryOptions): number {
  return Array.from(repositoryKey(options)).reduce((count, character) => count + character.charCodeAt(0), 0)
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

// Two demo lists carved out of the starred fixtures so the stars category
// tabs have something to show.
function getMockStarLists(login: string): Array<{ list: GitHubAccountStarList; repositories: GitHubAccountRepository[] }> {
  const starred = starredRepositoriesByAccount[login] ?? []
  const groups = [
    { name: 'Favorites', slug: 'favorites', repositories: starred.filter((_, index) => index % 2 === 0) },
    { name: 'Tools', slug: 'tools', repositories: starred.filter((_, index) => index % 2 === 1) },
  ]

  return groups
    .filter((group) => group.repositories.length > 0)
    .map((group) => ({
      list: {
        name: group.name,
        slug: group.slug,
        description: null,
        isPrivate: false,
        itemsCount: group.repositories.length,
      },
      repositories: group.repositories,
    }))
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

function createMockRepositoryContributorStats(): GitHubRepositoryContributorStatsResult {
  const weekSeconds = 7 * 24 * 60 * 60
  const lastWeek = Math.floor(Date.UTC(2026, 5, 28) / 1000)
  const weekCount = 52
  const firstWeek = lastWeek - (weekCount - 1) * weekSeconds
  const logins = ['octocat', 'hubot', 'monalisa', 'nanobot', 'railgun', 'sailboat', 'teapot', 'zenith']

  const contributors = logins.map((login, index) => {
    const weeks = []
    let total = 0
    for (let weekIndex = 0; weekIndex < weekCount; weekIndex += 1) {
      const commits = (weekIndex + index * 3) % (index + 4) === 0 ? ((weekIndex + index) % 5) + 1 : 0
      if (commits === 0) continue
      total += commits
      weeks.push({
        w: firstWeek + weekIndex * weekSeconds,
        a: commits * (12 + index),
        d: commits * (4 + index),
        c: commits,
      })
    }

    return {
      author: {
        id: 9000 + index,
        login,
        avatarUrl: null,
        type: 'User',
      },
      total,
      weeks,
    }
  })

  contributors.sort((left, right) => right.total - left.total)

  return { contributors, firstWeek, lastWeek, hasLineStats: true }
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
    viewerCanAdminister: true,
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
      commits: 238,
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

function createMockActionWorkflows(owner: string, repo: string): GitHubActionWorkflow[] {
  const key = `${owner}/${repo}`
  const base = Math.abs(Array.from(key).reduce((sum, character) => sum + character.charCodeAt(0), 0))

  return [
    {
      id: base + 101,
      nodeId: `W_${base}_ci`,
      name: 'CI',
      path: '.github/workflows/ci.yml',
      state: 'active',
      createdAt: new Date(Date.UTC(2026, 4, 20, 8)).toISOString(),
      updatedAt: new Date(Date.UTC(2026, 5, 27, 8)).toISOString(),
      url: `https://api.github.com/repos/${key}/actions/workflows/${base + 101}`,
      htmlUrl: `https://github.com/${key}/actions/workflows/ci.yml`,
      badgeUrl: `https://github.com/${key}/actions/workflows/ci.yml/badge.svg`,
    },
    {
      id: base + 102,
      nodeId: `W_${base}_release`,
      name: 'Release',
      path: '.github/workflows/release.yml',
      state: 'active',
      createdAt: new Date(Date.UTC(2026, 4, 21, 8)).toISOString(),
      updatedAt: new Date(Date.UTC(2026, 5, 25, 8)).toISOString(),
      url: `https://api.github.com/repos/${key}/actions/workflows/${base + 102}`,
      htmlUrl: `https://github.com/${key}/actions/workflows/release.yml`,
      badgeUrl: `https://github.com/${key}/actions/workflows/release.yml/badge.svg`,
    },
    {
      id: base + 103,
      nodeId: `W_${base}_nightly`,
      name: 'Nightly',
      path: '.github/workflows/nightly.yml',
      state: 'disabled_manually',
      createdAt: new Date(Date.UTC(2026, 4, 22, 8)).toISOString(),
      updatedAt: new Date(Date.UTC(2026, 5, 18, 8)).toISOString(),
      url: `https://api.github.com/repos/${key}/actions/workflows/${base + 103}`,
      htmlUrl: `https://github.com/${key}/actions/workflows/nightly.yml`,
      badgeUrl: null,
    },
  ]
}

function createMockActionRuns(
  owner: string,
  repo: string,
  workflows: GitHubActionWorkflow[],
): GitHubActionRun[] {
  const key = `${owner}/${repo}`
  const now = Date.UTC(2026, 5, 30, 9)
  const statuses: Array<Pick<GitHubActionRun, 'status' | 'conclusion' | 'event'> & { offsetHours: number }> = [
    { status: 'in_progress', conclusion: null, event: 'push', offsetHours: 0 },
    { status: 'completed', conclusion: 'success', event: 'pull_request', offsetHours: 2 },
    { status: 'completed', conclusion: 'failure', event: 'push', offsetHours: 8 },
    { status: 'queued', conclusion: null, event: 'workflow_dispatch', offsetHours: 18 },
    { status: 'completed', conclusion: 'skipped', event: 'schedule', offsetHours: 28 },
    { status: 'completed', conclusion: 'cancelled', event: 'push', offsetHours: 42 },
  ]
  const commitShas = [
    'aaaaaaa000000000000000000000000000000000',
    'fe427d5a7b1e724e7f72693e3f2c9fa12e54322',
    'f5f1b3ba7b1e724e7f72693e3f2c9fa12e54323',
  ]

  return statuses.map((state, index) => {
    const workflow = workflows[index % workflows.length]
    const id = workflow.id * 100 + index + 1
    const createdAt = new Date(now - state.offsetHours * 60 * 60 * 1000).toISOString()
    const runStartedAt = new Date(now - state.offsetHours * 60 * 60 * 1000 + 45 * 1000).toISOString()
    const updatedAt = state.status === 'completed'
      ? new Date(now - state.offsetHours * 60 * 60 * 1000 + (index + 2) * 60 * 1000).toISOString()
      : new Date(now - state.offsetHours * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString()

    return {
      id,
      runNumber: 140 - index,
      runAttempt: index === 2 ? 2 : 1,
      name: workflow.name,
      displayTitle: [
        'Validate repository Actions page',
        'Update pull request detail fixtures',
        'Fix workspace navigation state',
        'Manual desktop smoke test',
        'Nightly cache warmup',
        'Cancel stale renderer build',
      ][index],
      workflowId: workflow.id,
      workflowName: workflow.name,
      event: state.event,
      status: state.status,
      conclusion: state.conclusion,
      headBranch: index % 2 === 0 ? 'main' : `feature/mock-${index}`,
      headSha: commitShas[index] ?? mockSha(`${key}:run:${id}`).padEnd(40, '0').slice(0, 40),
      actor: {
        login: index % 2 === 0 ? 'acbox' : 'maya',
        avatarUrl: `https://github.com/${index % 2 === 0 ? 'acbox' : 'maya'}.png?size=64`,
      },
      triggeringActor: null,
      checkSuiteId: id + 5000,
      createdAt,
      updatedAt,
      runStartedAt,
      completedAt: state.status === 'completed' ? updatedAt : null,
      url: `https://api.github.com/repos/${key}/actions/runs/${id}`,
      htmlUrl: `https://github.com/${key}/actions/runs/${id}`,
      jobsUrl: `https://api.github.com/repos/${key}/actions/runs/${id}/jobs`,
      logsUrl: `https://api.github.com/repos/${key}/actions/runs/${id}/logs`,
    }
  })
}

function createMockActionJobs(run: GitHubActionRun): GitHubActionJob[] {
  const jobNames = run.workflowName === 'Release'
    ? ['Package', 'Publish']
    : ['Lint', 'Typecheck', 'Build']

  return jobNames.map((name, index) => {
    const id = run.id * 10 + index + 1
    const isWaiting = run.status !== 'completed' && index > 0
    const status = isWaiting ? 'queued' : run.status
    const conclusion = run.status === 'completed'
      ? index === 0 ? run.conclusion : run.conclusion === 'failure' ? 'skipped' : run.conclusion
      : null

    return {
      id,
      runId: run.id,
      runAttempt: run.runAttempt,
      name,
      status,
      conclusion,
      startedAt: isWaiting ? null : run.runStartedAt,
      completedAt: status === 'completed' ? run.completedAt : null,
      htmlUrl: `${run.htmlUrl}/job/${id}`,
      runnerName: isWaiting ? null : 'ubuntu-latest',
      labels: ['ubuntu-latest'],
      steps: createMockActionSteps(status, conclusion),
    }
  })
}

function createMockActionSteps(
  status: GitHubActionJob['status'],
  conclusion: GitHubActionJob['conclusion'],
): GitHubActionStep[] {
  const stepNames = ['Set up job', 'Checkout', 'Install dependencies', 'Run command', 'Post job cleanup']

  return stepNames.map((name, index) => {
    const stepStatus = status === 'queued'
      ? 'queued'
      : status === 'in_progress' && index >= 3
        ? index === 3 ? 'in_progress' : 'queued'
        : 'completed'
    const stepConclusion = stepStatus === 'completed'
      ? conclusion === 'failure' && index === 3 ? 'failure' : 'success'
      : null

    return {
      number: index + 1,
      name,
      status: stepStatus,
      conclusion: stepConclusion,
      startedAt: stepStatus === 'queued' ? null : new Date(Date.UTC(2026, 5, 30, 9, index * 2)).toISOString(),
      completedAt: stepStatus === 'completed' ? new Date(Date.UTC(2026, 5, 30, 9, index * 2 + 1)).toISOString() : null,
    }
  })
}

function createMockActionLog(run: GitHubActionRun, job: GitHubActionJob): string {
  return [
    `2026-06-30T09:00:00.000Z Starting ${job.name} for ${run.displayTitle}`,
    '2026-06-30T09:00:03.000Z Checking out repository',
    '2026-06-30T09:00:12.000Z Installing dependencies',
    job.status === 'in_progress'
      ? '2026-06-30T09:01:00.000Z Command still running...'
      : `2026-06-30T09:02:00.000Z Job finished with ${job.conclusion ?? 'no conclusion'}`,
  ].join('\n')
}

function createMockEnvironments(owner: string, repo: string): GitHubEnvironment[] {
  const key = `${owner}/${repo}`
  const base = Math.abs(Array.from(key).reduce((sum, character) => sum + character.charCodeAt(0), 0))

  return [
    {
      id: base + 201,
      name: 'production',
      htmlUrl: `https://github.com/${key}/deployments/activity_log?environment=production`,
      createdAt: new Date(Date.UTC(2026, 3, 1, 8)).toISOString(),
      updatedAt: new Date(Date.UTC(2026, 5, 20, 8)).toISOString(),
      protectionRules: [
        { id: base + 1, type: 'wait_timer', waitTimer: 30, reviewerCount: null },
        { id: base + 2, type: 'required_reviewers', waitTimer: null, reviewerCount: 2 },
      ],
    },
    {
      id: base + 202,
      name: 'staging',
      htmlUrl: `https://github.com/${key}/deployments/activity_log?environment=staging`,
      createdAt: new Date(Date.UTC(2026, 3, 1, 8)).toISOString(),
      updatedAt: new Date(Date.UTC(2026, 5, 18, 8)).toISOString(),
      protectionRules: [],
    },
  ]
}

function createMockDeployments(
  owner: string,
  repo: string,
  environments: GitHubEnvironment[],
): GitHubDeployment[] {
  const key = `${owner}/${repo}`
  const now = Date.UTC(2026, 5, 30, 9)
  const states: GitHubDeploymentState[] = ['success', 'failure', 'in_progress', 'queued']
  const commitShas = [
    'aaaaaaa000000000000000000000000000000000',
    'bbbbbbb000000000000000000000000000000000',
    'ccccccc000000000000000000000000000000000',
    'ddddddd000000000000000000000000000000000',
  ]

  return states.map((state, index) => {
    const environment = environments[index % environments.length]
    const id = environment.id * 100 + index + 1
    const actorLogin = index % 2 === 0 ? 'acbox' : 'maya'
    const createdAt = new Date(now - index * 60 * 60 * 1000).toISOString()
    const updatedAt = new Date(now - index * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString()
    const creator = { login: actorLogin, avatarUrl: `https://github.com/${actorLogin}.png?size=64` }

    return {
      id,
      sha: commitShas[index] ?? mockSha(`${key}:deployment:${id}`).padEnd(40, '0').slice(0, 40),
      ref: index % 2 === 0 ? 'main' : `release/${index}`,
      task: 'deploy',
      environment: environment.name,
      description: null,
      transientEnvironment: false,
      productionEnvironment: environment.name === 'production',
      creator,
      latestStatus: {
        id: id * 10,
        state,
        description: state === 'failure' ? 'Deployment failed health check' : '',
        environmentUrl: `https://${environment.name}.${repo}.example.dev`,
        logUrl: `https://github.com/${key}/actions/runs/${id}`,
        creator,
        createdAt: updatedAt,
      },
      createdAt,
      updatedAt,
    }
  })
}

function createMockDeploymentStatusHistory(deployment: GitHubDeployment): GitHubDeploymentStatus[] {
  const latest = deployment.latestStatus
  if (!latest) return []

  if (latest.state === 'queued' || latest.state === 'pending') {
    return [latest]
  }

  const inProgress: GitHubDeploymentStatus = {
    ...latest,
    id: latest.id - 1,
    state: 'in_progress',
    description: '',
    createdAt: deployment.createdAt,
  }

  return [latest, inProgress]
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
    labels: index === 0 ? mockLabels('workspace') : mockLabels('review'),
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
    labels: index === 0 ? mockLabels('bug') : mockLabels('triage'),
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
    nodeId: pullRequest?.id ?? `mock-pr-node:${key}:${options.number}`,
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
    labels: pullRequest?.labels ?? mockLabels('workspace', 'review'),
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
    headSha: 'f5f1b3ba7b1e724e7f72693e3f2c9fa12e54323',
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
      mergeable: 'MERGEABLE',
    },
    mergePolicy: {
      methods: ['merge', 'squash', 'rebase'],
      defaultMethod: 'squash',
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
        nodeId: `mock-pr-comment-node:${key}:${options.number}:1`,
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
        viewerCanUpdate: true,
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
    viewerCanUpdate: true,
    viewerCanClose: true,
    viewerCanReopen: pullRequest?.state === 'closed',
    viewerCanMergeAsAdmin: true,
    locked: false,
    viewerSubscription: null,
    projects: [],
  }
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
    labels: issue?.labels ?? mockLabels('triage', 'detail'),
    issueType: null,
    relationships: { parent: null, subIssues: [], tracked: [] },
    projects: [],
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
        nodeId: `mock-comment-node:${key}:${options.number}:1`,
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
        viewerCanUpdate: true,
      },
      {
        id: `mock-comment:${key}:${options.number}:2`,
        nodeId: `mock-comment-node:${key}:${options.number}:2`,
        author: { login: 'arden', avatarUrl: 'https://avatars.githubusercontent.com/u/810438?s=80&v=4' },
        body: 'Mock data should include at least one cross-reference and one rename event so the activity list can be designed against real shapes.',
        createdAt: secondCommentAt,
        updatedAt: secondCommentAt,
        authorAssociation: 'CONTRIBUTOR',
        reactions: [
          { content: 'heart', count: 2 },
        ],
        url: `https://github.com/${key}/issues/${options.number}#issuecomment-2`,
        viewerCanUpdate: false,
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
        label: issue?.labels[0]?.name ?? 'triage',
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
    development: null,
    url: issue?.url ?? `https://github.com/${key}/issues/${options.number}`,
    hasUpdates: issue?.hasUpdates ?? false,
    viewerCanUpdate: true,
    viewerCanClose: issue?.state === 'open' || !issue,
    viewerCanReopen: Boolean(issue && issue.state !== 'open'),
    nodeId: `mock-node:${options.number}`,
    locked: false,
    isPinned: false,
    viewerSubscription: null,
  }
}
