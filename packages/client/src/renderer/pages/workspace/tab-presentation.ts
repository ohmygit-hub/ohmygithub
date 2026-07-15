import type { WorkspaceTab, WorkspaceTabView } from './types'
import {
  Activity,
  Book,
  Bot,
  CircleDot,
  GitCommitHorizontal,
  GitPullRequest,
  Inbox,
  Plus,
  Search,
  SearchX,
  UserRound,
  UsersRound,
  Workflow,
} from 'lucide-vue-next'

export function getWorkspaceTabView(tab: WorkspaceTab): WorkspaceTabView {
  if (tab.type === 'inbox') {
    return {
      tab,
      icon: Inbox,
      titleKey: 'workspace.tabs.items.inbox',
      title: tab.title,
      eyebrowKey: 'workspace.panel.eyebrows.triage',
      headingKey: 'workspace.panel.headings.inbox',
      descriptionKey: 'workspace.panel.descriptions.inbox',
      stats: [
        { id: 'unread', labelKey: 'workspace.panel.stats.unread', valueKey: 'workspace.panel.values.unread' },
        { id: 'reviews', labelKey: 'workspace.panel.stats.reviews', valueKey: 'workspace.panel.values.reviews' },
        { id: 'mentions', labelKey: 'workspace.panel.stats.mentions', valueKey: 'workspace.panel.values.mentions' },
      ],
      blocks: [
        {
          id: 'review-queue',
          titleKey: 'workspace.panel.blocks.reviewQueue.title',
          descriptionKey: 'workspace.panel.blocks.reviewQueue.description',
          metaKey: 'workspace.panel.blocks.reviewQueue.meta',
        },
        {
          id: 'release-watch',
          titleKey: 'workspace.panel.blocks.releaseWatch.title',
          descriptionKey: 'workspace.panel.blocks.releaseWatch.description',
          metaKey: 'workspace.panel.blocks.releaseWatch.meta',
        },
      ],
    }
  }

  if (tab.type === 'reviews') {
    return {
      tab,
      icon: GitPullRequest,
      titleKey: 'workspace.tabs.items.reviews',
      title: tab.title,
      eyebrowKey: 'workspace.panel.eyebrows.review',
      headingKey: 'workspace.panel.headings.reviews',
      descriptionKey: 'workspace.panel.descriptions.reviews',
      stats: [
        { id: 'assigned', labelKey: 'workspace.panel.stats.assigned', valueKey: 'workspace.panel.values.assigned' },
        { id: 'waiting', labelKey: 'workspace.panel.stats.waiting', valueKey: 'workspace.panel.values.waiting' },
        { id: 'drafts', labelKey: 'workspace.panel.stats.drafts', valueKey: 'workspace.panel.values.drafts' },
      ],
      blocks: [
        {
          id: 'review-stack',
          titleKey: 'workspace.panel.blocks.reviewStack.title',
          descriptionKey: 'workspace.panel.blocks.reviewStack.description',
          metaKey: 'workspace.panel.blocks.reviewStack.meta',
        },
        {
          id: 'merge-readiness',
          titleKey: 'workspace.panel.blocks.mergeReadiness.title',
          descriptionKey: 'workspace.panel.blocks.mergeReadiness.description',
          metaKey: 'workspace.panel.blocks.mergeReadiness.meta',
        },
      ],
    }
  }

  if (tab.type === 'activity') {
    return {
      tab,
      icon: Activity,
      titleKey: 'workspace.tabs.items.activity',
      title: tab.title,
      eyebrowKey: 'workspace.panel.eyebrows.activity',
      headingKey: 'workspace.panel.headings.activity',
      descriptionKey: 'workspace.panel.descriptions.activity',
      stats: [
        { id: 'runs', labelKey: 'workspace.panel.stats.runs', valueKey: 'workspace.panel.values.runs' },
        { id: 'alerts', labelKey: 'workspace.panel.stats.alerts', valueKey: 'workspace.panel.values.alerts' },
        { id: 'repos', labelKey: 'workspace.panel.stats.repos', valueKey: 'workspace.panel.values.repos' },
      ],
      blocks: [
        {
          id: 'workflow-feed',
          titleKey: 'workspace.panel.blocks.workflowFeed.title',
          descriptionKey: 'workspace.panel.blocks.workflowFeed.description',
          metaKey: 'workspace.panel.blocks.workflowFeed.meta',
        },
        {
          id: 'repository-focus',
          titleKey: 'workspace.panel.blocks.repositoryFocus.title',
          descriptionKey: 'workspace.panel.blocks.repositoryFocus.description',
          metaKey: 'workspace.panel.blocks.repositoryFocus.meta',
        },
      ],
    }
  }

  if (tab.type === 'new-repository') {
    return {
      tab,
      icon: Plus,
      titleKey: 'workspace.tabs.items.newRepository',
      title: tab.title,
      eyebrowKey: 'workspace.panel.eyebrows.create',
      headingKey: 'workspace.panel.headings.newRepository',
      descriptionKey: 'workspace.panel.descriptions.newRepository',
      stats: [],
      blocks: [],
    }
  }

  if (tab.type === 'pull-request') {
    return createResourceView(tab, {
      icon: GitPullRequest,
      eyebrowKey: 'workspace.panel.eyebrows.pullRequest',
      headingKey: 'workspace.panel.headings.pullRequest',
      descriptionKey: 'workspace.panel.descriptions.pullRequest',
      stats: [
        { id: 'repository', labelKey: 'workspace.panel.stats.repository', value: `${tab.owner ?? ''}/${tab.repo ?? ''}` },
        { id: 'number', labelKey: 'workspace.panel.stats.number', value: `#${tab.number ?? ''}` },
        { id: 'status', labelKey: 'workspace.panel.stats.status', valueKey: 'workspace.panel.values.placeholder' },
      ],
    })
  }

  if (tab.type === 'pull-request-list') {
    return createResourceView(tab, {
      icon: GitPullRequest,
      titleKey: pullRequestCategoryTitleKey(tab.pullRequestCategory),
      eyebrowKey: 'workspace.panel.eyebrows.pullRequestList',
      headingKey: 'workspace.panel.headings.pullRequestList',
      descriptionKey: 'workspace.panel.descriptions.pullRequestList',
      stats: [
        { id: 'category', labelKey: 'workspace.panel.stats.category', valueKey: pullRequestCategoryValueKey(tab.pullRequestCategory) },
        { id: 'source', labelKey: 'workspace.panel.stats.source', valueKey: 'workspace.panel.values.githubSearch' },
        { id: 'status', labelKey: 'workspace.panel.stats.status', valueKey: 'workspace.panel.values.placeholder' },
      ],
    })
  }

  if (tab.type === 'issue') {
    return createResourceView(tab, {
      icon: CircleDot,
      eyebrowKey: 'workspace.panel.eyebrows.issue',
      headingKey: 'workspace.panel.headings.issue',
      descriptionKey: 'workspace.panel.descriptions.issue',
      stats: [
        { id: 'repository', labelKey: 'workspace.panel.stats.repository', value: `${tab.owner ?? ''}/${tab.repo ?? ''}` },
        { id: 'number', labelKey: 'workspace.panel.stats.number', value: `#${tab.number ?? ''}` },
        { id: 'status', labelKey: 'workspace.panel.stats.status', valueKey: 'workspace.panel.values.placeholder' },
      ],
    })
  }

  if (tab.type === 'action-run') {
    return createResourceView(tab, {
      icon: Workflow,
      eyebrowKey: 'workspace.panel.eyebrows.actionRun',
      headingKey: 'workspace.panel.headings.actionRun',
      headingParams: {
        owner: tab.owner ?? '',
        repo: tab.repo ?? '',
        run: tab.runId ?? '',
      },
      descriptionKey: 'workspace.panel.descriptions.actionRun',
      stats: [
        { id: 'repository', labelKey: 'workspace.panel.stats.repository', value: `${tab.owner ?? ''}/${tab.repo ?? ''}` },
        { id: 'run', labelKey: 'workspace.panel.stats.run', value: `${tab.runId ?? ''}` },
        { id: 'status', labelKey: 'workspace.panel.stats.status', valueKey: 'workspace.panel.values.placeholder' },
      ],
    })
  }

  if (tab.type === 'issue-list') {
    return createResourceView(tab, {
      icon: CircleDot,
      titleKey: issueCategoryTitleKey(tab.issueCategory),
      eyebrowKey: 'workspace.panel.eyebrows.issueList',
      headingKey: 'workspace.panel.headings.issueList',
      descriptionKey: 'workspace.panel.descriptions.issueList',
      stats: [
        { id: 'category', labelKey: 'workspace.panel.stats.category', valueKey: issueCategoryValueKey(tab.issueCategory) },
        { id: 'source', labelKey: 'workspace.panel.stats.source', valueKey: 'workspace.panel.values.githubSearch' },
        { id: 'status', labelKey: 'workspace.panel.stats.status', valueKey: 'workspace.panel.values.placeholder' },
      ],
    })
  }

  if (tab.type === 'team') {
    return createResourceView(tab, {
      icon: UsersRound,
      eyebrowKey: 'workspace.panel.eyebrows.team',
      headingKey: 'workspace.panel.headings.team',
      descriptionKey: 'workspace.panel.descriptions.team',
      stats: [
        { id: 'organization', labelKey: 'workspace.panel.stats.organization', value: tab.owner ?? '' },
        { id: 'team', labelKey: 'workspace.panel.stats.team', value: tab.teamSlug ?? '' },
        { id: 'status', labelKey: 'workspace.panel.stats.status', valueKey: 'workspace.panel.values.placeholder' },
      ],
    })
  }

  if (tab.type === 'repo') {
    return createResourceView(tab, {
      icon: Book,
      eyebrowKey: 'workspace.panel.eyebrows.repo',
      headingKey: 'workspace.panel.headings.repo',
      descriptionKey: 'workspace.panel.descriptions.repo',
      stats: [
        { id: 'owner', labelKey: 'workspace.panel.stats.owner', value: tab.owner ?? '' },
        { id: 'repository', labelKey: 'workspace.panel.stats.repository', value: tab.repo ?? '' },
        { id: 'status', labelKey: 'workspace.panel.stats.status', valueKey: 'workspace.panel.values.placeholder' },
      ],
    })
  }

  if (tab.type === 'search-result') {
    return createResourceView(tab, {
      icon: Search,
      eyebrowKey: 'workspace.panel.eyebrows.searchResult',
      headingKey: 'workspace.panel.headings.searchResult',
      descriptionKey: 'workspace.panel.descriptions.searchResult',
      stats: [
        { id: 'query', labelKey: 'workspace.panel.stats.query', value: tab.searchQuery ?? '' },
        { id: 'mode', labelKey: 'workspace.panel.stats.type', valueKey: searchModeValueKey(tab.searchMode) },
        { id: 'source', labelKey: 'workspace.panel.stats.source', valueKey: 'workspace.panel.values.githubSearch' },
      ],
    })
  }

  if (tab.type === 'not-found') {
    return createResourceView(tab, {
      icon: SearchX,
      eyebrowKey: 'workspace.panel.eyebrows.notFound',
      headingKey: 'workspace.panel.headings.notFound',
      descriptionKey: 'workspace.panel.descriptions.notFound',
      stats: [
        { id: 'query', labelKey: 'workspace.panel.stats.query', value: tab.notFoundInput ?? '' },
        { id: 'source', labelKey: 'workspace.panel.stats.source', valueKey: 'workspace.panel.values.githubSearch' },
        { id: 'status', labelKey: 'workspace.panel.stats.status', valueKey: 'workspace.panel.values.notFound' },
      ],
    })
  }

  if (tab.type === 'commit') {
    return createResourceView(tab, {
      icon: GitCommitHorizontal,
      eyebrowKey: 'workspace.panel.eyebrows.commit',
      headingKey: 'workspace.panel.headings.commit',
      descriptionKey: 'workspace.panel.descriptions.commit',
      stats: [
        { id: 'repository', labelKey: 'workspace.panel.stats.repository', value: `${tab.owner ?? ''}/${tab.repo ?? ''}` },
        { id: 'commit', labelKey: 'workspace.panel.stats.commit', value: tab.commitSha?.slice(0, 7) ?? '' },
        { id: 'status', labelKey: 'workspace.panel.stats.status', valueKey: 'workspace.panel.values.placeholder' },
      ],
    })
  }

  if (tab.type === 'app') {
    return createResourceView(tab, {
      icon: Bot,
      eyebrowKey: 'app.eyebrow',
      headingKey: 'workspace.panel.headings.account',
      descriptionKey: 'app.description',
      stats: [
        { id: 'app', labelKey: 'workspace.panel.stats.account', value: tab.appSlug ?? '' },
        { id: 'type', labelKey: 'workspace.panel.stats.type', valueKey: 'app.eyebrow' },
        { id: 'status', labelKey: 'workspace.panel.stats.status', valueKey: 'workspace.panel.values.placeholder' },
      ],
    })
  }

  return createResourceView(tab, {
    icon: UserRound,
    eyebrowKey: 'workspace.panel.eyebrows.account',
    headingKey: 'workspace.panel.headings.account',
    descriptionKey: 'workspace.panel.descriptions.account',
    stats: [
      { id: 'owner', labelKey: 'workspace.panel.stats.account', value: tab.owner ?? '' },
      { id: 'type', labelKey: 'workspace.panel.stats.type', valueKey: 'workspace.panel.values.account' },
      { id: 'status', labelKey: 'workspace.panel.stats.status', valueKey: 'workspace.panel.values.placeholder' },
    ],
  })
}

function createResourceView(
  tab: WorkspaceTab,
  details: Pick<WorkspaceTabView, 'descriptionKey' | 'eyebrowKey' | 'headingKey' | 'icon' | 'stats'>
    & Partial<Pick<WorkspaceTabView, 'headingParams' | 'titleKey' | 'titleParams'>>,
): WorkspaceTabView {
  return {
    tab,
    ...details,
    title: tab.title,
    headingParams: {
      owner: tab.owner ?? '',
      number: tab.number ?? '',
      repo: tab.repo ?? '',
      title: tab.title,
    },
    descriptionParams: {
      owner: tab.owner ?? '',
      number: tab.number ?? '',
      repo: tab.repo ?? '',
      title: tab.title,
    },
    blocks: [
      {
        id: 'resource-placeholder',
        titleKey: 'workspace.panel.blocks.resourcePlaceholder.title',
        descriptionKey: 'workspace.panel.blocks.resourcePlaceholder.description',
        metaKey: 'workspace.panel.blocks.resourcePlaceholder.meta',
      },
      {
        id: 'resource-routing',
        titleKey: 'workspace.panel.blocks.resourceRouting.title',
        descriptionKey: 'workspace.panel.blocks.resourceRouting.description',
        metaKey: 'workspace.panel.blocks.resourceRouting.meta',
      },
    ],
  }
}

function pullRequestCategoryTitleKey(category: GitHubPullRequestCategory | undefined): string {
  return `workspace.sidebar.pullRequestCategories.${category ?? 'created-by-me'}`
}

function issueCategoryTitleKey(category: GitHubIssueCategory | undefined): string {
  return `workspace.sidebar.issueCategories.${category ?? 'created-by-me'}`
}

function pullRequestCategoryValueKey(category: GitHubPullRequestCategory | undefined): string {
  if (category === 'needs-review') return 'workspace.panel.values.needsReview'
  if (category === 'mentioned-me') return 'workspace.panel.values.mentionedMe'
  return 'workspace.panel.values.createdByMe'
}

function issueCategoryValueKey(category: GitHubIssueCategory | undefined): string {
  if (category === 'mentioned-me') return 'workspace.panel.values.mentionedMe'
  return 'workspace.panel.values.createdByMe'
}

function searchModeValueKey(mode: GitHubWorkspaceSearchMode | undefined): string {
  if (mode === 'users') return 'workspace.panel.values.searchUsers'
  if (mode === 'orgs') return 'workspace.panel.values.searchOrgs'
  if (mode === 'repos') return 'workspace.panel.values.searchRepos'
  return 'workspace.panel.values.searchAll'
}
