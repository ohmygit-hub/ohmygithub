import type { WorkspaceTab, WorkspaceTabView } from './types'
import {
  Bell,
  Building2,
  FileText,
  GitPullRequest,
  Inbox,
  Package,
  UserRound,
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
      icon: Bell,
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

  if (tab.type === 'repo') {
    return createResourceView(tab, {
      icon: Package,
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

  if (tab.type === 'org') {
    return createResourceView(tab, {
      icon: Building2,
      eyebrowKey: 'workspace.panel.eyebrows.org',
      headingKey: 'workspace.panel.headings.org',
      descriptionKey: 'workspace.panel.descriptions.org',
      stats: [
        { id: 'owner', labelKey: 'workspace.panel.stats.organization', value: tab.owner ?? '' },
        { id: 'type', labelKey: 'workspace.panel.stats.type', valueKey: 'workspace.panel.values.org' },
        { id: 'status', labelKey: 'workspace.panel.stats.status', valueKey: 'workspace.panel.values.placeholder' },
      ],
    })
  }

  if (tab.type === 'account') {
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

  return {
    tab,
    icon: FileText,
    titleKey: 'workspace.tabs.items.draft',
    titleParams: { number: tab.draftId ?? '1' },
    title: tab.title,
    eyebrowKey: 'workspace.panel.eyebrows.draft',
    headingKey: 'workspace.panel.headings.draft',
    descriptionKey: 'workspace.panel.descriptions.draft',
    stats: [
      { id: 'scope', labelKey: 'workspace.panel.stats.scope', valueKey: 'workspace.panel.values.scope' },
      { id: 'source', labelKey: 'workspace.panel.stats.source', valueKey: 'workspace.panel.values.source' },
      { id: 'status', labelKey: 'workspace.panel.stats.status', valueKey: 'workspace.panel.values.status' },
    ],
    blocks: [
      {
        id: 'draft-outline',
        titleKey: 'workspace.panel.blocks.draftOutline.title',
        descriptionKey: 'workspace.panel.blocks.draftOutline.description',
        metaKey: 'workspace.panel.blocks.draftOutline.meta',
      },
      {
        id: 'next-step',
        titleKey: 'workspace.panel.blocks.nextStep.title',
        descriptionKey: 'workspace.panel.blocks.nextStep.description',
        metaKey: 'workspace.panel.blocks.nextStep.meta',
      },
    ],
  }
}

function createResourceView(
  tab: WorkspaceTab,
  details: Pick<WorkspaceTabView, 'descriptionKey' | 'eyebrowKey' | 'headingKey' | 'icon' | 'stats'>,
): WorkspaceTabView {
  return {
    tab,
    ...details,
    title: tab.title,
    headingParams: {
      owner: tab.owner ?? '',
      repo: tab.repo ?? '',
      title: tab.title,
    },
    descriptionParams: {
      owner: tab.owner ?? '',
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
