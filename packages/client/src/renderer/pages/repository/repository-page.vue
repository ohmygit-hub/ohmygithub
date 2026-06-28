<script setup lang="ts">
import type { WorkspaceTab } from '../workspace/types'
import type { RepositoryOverviewInfoItem, RepositorySection, RepositorySectionId } from './components/types'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  Activity,
  Archive,
  Book,
  Box,
  CircleDot,
  Clock3,
  Code,
  Folder,
  GitFork,
  GitBranch,
  GitPullRequest,
  Globe,
  Eye,
  Package,
  Scale,
  Settings,
  Shield,
  Star,
  Tags,
} from 'lucide-vue-next'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@oh-my-github/ui'
import { useRepositoryOverviewQuery } from '../../composables/github/use-repositories'
import RepositoryOverview from './components/overview/repository-overview.vue'
import PullRequestsSection from './components/pulls/section.vue'
import FilesPanel from './components/files/files-panel.vue'
import RepositorySidebar from './components/repository-sidebar.vue'

const props = defineProps<{
  tab: WorkspaceTab
}>()

const repositorySections: readonly RepositorySection[] = [
  { id: 'overview', icon: Book },
  { id: 'files', icon: Folder },
  { id: 'pullRequests', icon: GitPullRequest },
  { id: 'issues', icon: CircleDot },
  { id: 'actions', icon: Activity },
  { id: 'settings', icon: Settings },
]

type RepositoryActionId = 'star' | 'watch'

const { t } = useI18n()
const router = useRouter()
const activeSection = ref<RepositorySectionId>('overview')
const activeDocumentKind = ref<GitHubRepositoryDocumentKind>('readme')
const viewerState = ref<GitHubRepositoryViewerState | null>(null)
const isViewerStateLoading = ref(false)
const pendingRepositoryAction = ref<RepositoryActionId | null>(null)
let viewerStateRequestId = 0

const owner = computed(() => props.tab.owner ?? '')
const repository = computed(() => props.tab.repo ?? props.tab.title)
const activeSectionTitle = computed(() => t(`repository.sections.${activeSection.value}.title`))
const hasRepositoryIdentity = computed(() => Boolean(owner.value && repository.value))
const overviewQuery = useRepositoryOverviewQuery(owner, repository, hasRepositoryIdentity)
const overview = computed(() => overviewQuery.data.value ?? null)
const isOverviewLoading = computed(() => overviewQuery.isLoading.value)
const hasOverviewError = computed(() => Boolean(overviewQuery.error.value))
const isStarred = computed(() => viewerState.value?.isStarred ?? false)
const isWatching = computed(() => viewerState.value?.isWatching ?? false)
const starCount = computed(() => viewerState.value?.starCount ?? overview.value?.counts.stars ?? null)
const formattedStarCount = computed(() => {
  if (starCount.value === null) return '...'

  return new Intl.NumberFormat().format(starCount.value)
})
const starLabel = computed(() => t(isStarred.value ? 'repository.actions.starred' : 'repository.actions.star'))
const watchLabel = computed(() => t(isWatching.value ? 'repository.actions.watching' : 'repository.actions.watch'))
const starButtonDisabled = computed(() =>
  !hasRepositoryIdentity.value || isViewerStateLoading.value || Boolean(pendingRepositoryAction.value)
)
const watchButtonDisabled = computed(() =>
  !hasRepositoryIdentity.value || isViewerStateLoading.value || Boolean(pendingRepositoryAction.value)
)
const repositoryStatusItems = computed(() => {
  const currentOverview = overview.value
  if (!currentOverview) return []

  return [
    currentOverview.isArchived ? t('repository.status.archived') : null,
    currentOverview.isFork ? t('repository.status.fork') : null,
    currentOverview.isTemplate ? t('repository.status.template') : null,
  ].filter(isString)
})
const overviewInfoItems = computed<RepositoryOverviewInfoItem[]>(() => {
  const currentOverview = overview.value
  if (!currentOverview) return []

  const items: RepositoryOverviewInfoItem[] = [
    {
      id: 'visibility',
      icon: currentOverview.visibility === 'private' ? Shield : Globe,
      label: t('repository.summary.visibility'),
      value: t(`repository.visibility.${currentOverview.visibility}`),
    },
    {
      id: 'stars',
      icon: Star,
      label: t('repository.summary.stars'),
      value: formatNumber(starCount.value ?? currentOverview.counts.stars),
    },
    {
      id: 'watchers',
      icon: Eye,
      label: t('repository.summary.watchers'),
      value: formatNumber(currentOverview.counts.watchers),
    },
    {
      id: 'forks',
      icon: GitFork,
      label: t('repository.summary.forks'),
      value: formatNumber(currentOverview.counts.forks),
    },
    {
      id: 'issues',
      icon: CircleDot,
      label: t('repository.summary.openIssues'),
      value: formatNumber(currentOverview.counts.openIssues),
    },
  ]

  if (repositoryStatusItems.value.length > 0) {
    items.push({
      id: 'status',
      icon: Archive,
      label: t('repository.summary.status'),
      value: repositoryStatusItems.value.join(', '),
    })
  }

  if (currentOverview.license) {
    items.push({
      id: 'license',
      icon: Scale,
      label: t('repository.summary.license'),
      value: currentOverview.license.name,
    })
  }

  if (currentOverview.primaryLanguage) {
    items.push({
      id: 'language',
      icon: Code,
      label: t('repository.summary.language'),
      value: currentOverview.primaryLanguage,
    })
  }

  if (currentOverview.defaultBranch) {
    items.push({
      id: 'defaultBranch',
      icon: GitBranch,
      label: t('repository.summary.defaultBranch'),
      value: currentOverview.defaultBranch,
    })
  }

  if (currentOverview.counts.openPullRequests !== null) {
    items.push({
      id: 'pullRequests',
      icon: GitPullRequest,
      label: t('repository.summary.openPullRequests'),
      value: formatNumber(currentOverview.counts.openPullRequests),
    })
  }

  if (currentOverview.counts.releases !== null) {
    items.push({
      id: 'releases',
      icon: Tags,
      label: t('repository.summary.releases'),
      value: formatNumber(currentOverview.counts.releases),
    })
  }

  if (currentOverview.counts.packages !== null) {
    items.push({
      id: 'packages',
      icon: Package,
      label: t('repository.summary.packages'),
      value: formatNumber(currentOverview.counts.packages),
    })
  }

  if (currentOverview.counts.branches !== null) {
    items.push({
      id: 'branches',
      icon: GitBranch,
      label: t('repository.summary.branches'),
      value: formatNumber(currentOverview.counts.branches),
    })
  }

  if (currentOverview.counts.tags !== null) {
    items.push({
      id: 'tags',
      icon: Tags,
      label: t('repository.summary.tags'),
      value: formatNumber(currentOverview.counts.tags),
    })
  }

  if (currentOverview.customProperties.length > 0) {
    items.push({
      id: 'customProperties',
      icon: Box,
      label: t('repository.summary.customProperties'),
      value: formatNumber(currentOverview.customProperties.length),
    })
  }

  if (currentOverview.pushedAt) {
    items.push({
      id: 'pushedAt',
      icon: Clock3,
      label: t('repository.summary.lastPushed'),
      value: formatDate(currentOverview.pushedAt),
    })
  }

  return items
})
const availableDocuments = computed(() => overview.value?.documents ?? [])
const activeDocument = computed(() => {
  return availableDocuments.value.find((document) => document.kind === activeDocumentKind.value)
    ?? availableDocuments.value[0]
    ?? null
})
const overviewDescription = computed(() =>
  overview.value?.description?.trim() || t('repository.overview.noDescription')
)
const missingScopesText = computed(() => overview.value?.missingScopes.join(', ') ?? '')

function openOwner(): void {
  if (!owner.value) return
  void router.push(`/${encodeURIComponent(owner.value)}`)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value)
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function isString(value: string | null): value is string {
  return Boolean(value)
}

async function loadRepositoryViewerState(): Promise<void> {
  const requestId = ++viewerStateRequestId

  if (!hasRepositoryIdentity.value || !window.ohMyGithub?.repositories) {
    viewerState.value = null
    isViewerStateLoading.value = false
    return
  }

  isViewerStateLoading.value = true

  try {
    const state = await window.ohMyGithub.repositories.getViewerState(owner.value, repository.value)

    if (requestId === viewerStateRequestId) {
      viewerState.value = state
    }
  } catch {
    if (requestId === viewerStateRequestId) {
      viewerState.value = null
    }
  } finally {
    if (requestId === viewerStateRequestId) {
      isViewerStateLoading.value = false
    }
  }
}

async function toggleStarred(): Promise<void> {
  if (!hasRepositoryIdentity.value || pendingRepositoryAction.value || !window.ohMyGithub?.repositories) return

  const nextStarred = !isStarred.value
  pendingRepositoryAction.value = 'star'

  try {
    await window.ohMyGithub.repositories.setStarred(owner.value, repository.value, nextStarred)
    viewerState.value = {
      isStarred: nextStarred,
      isWatching: isWatching.value,
      starCount: Math.max(0, (starCount.value ?? 0) + (nextStarred ? 1 : -1)),
    }
  } catch {
    void loadRepositoryViewerState()
  } finally {
    pendingRepositoryAction.value = null
  }
}

async function toggleWatching(): Promise<void> {
  if (!hasRepositoryIdentity.value || pendingRepositoryAction.value || !window.ohMyGithub?.repositories) return

  const nextWatching = !isWatching.value
  pendingRepositoryAction.value = 'watch'

  try {
    await window.ohMyGithub.repositories.setWatching(owner.value, repository.value, nextWatching)
    viewerState.value = {
      isStarred: isStarred.value,
      isWatching: nextWatching,
      starCount: starCount.value ?? 0,
    }
  } catch {
    void loadRepositoryViewerState()
  } finally {
    pendingRepositoryAction.value = null
  }
}

watch(
  () => props.tab.url,
  () => {
    activeSection.value = 'overview'
  },
)

watch(
  () => [owner.value, repository.value] as const,
  () => {
    void loadRepositoryViewerState()
  },
  { immediate: true },
)

watch(
  availableDocuments,
  (documents) => {
    if (documents.length === 0) {
      activeDocumentKind.value = 'readme'
      return
    }

    if (!documents.some((document) => document.kind === activeDocumentKind.value)) {
      activeDocumentKind.value = documents[0].kind
    }
  },
  { immediate: true },
)
</script>

<template>
  <section class="flex h-full min-h-[34rem] gap-3 bg-background p-3">
    <RepositorySidebar
      v-model:active-section="activeSection"
      :formatted-star-count="formattedStarCount"
      :is-starred="isStarred"
      :is-watching="isWatching"
      :owner="owner"
      :repository="repository"
      :sections="repositorySections"
      :star-button-disabled="starButtonDisabled"
      :star-label="starLabel"
      :watch-button-disabled="watchButtonDisabled"
      :watch-label="watchLabel"
      @open-owner="openOwner"
      @toggle-starred="toggleStarred"
      @toggle-watching="toggleWatching"
    />

    <main class="min-w-0 flex-1 overflow-auto px-3">
      <div class="mx-auto grid w-full max-w-5xl gap-5 pb-8">
        <RepositoryOverview
          v-if="activeSection === 'overview'"
          v-model:active-document-kind="activeDocumentKind"
          :active-document="activeDocument"
          :available-documents="availableDocuments"
          :has-overview-error="hasOverviewError"
          :is-overview-loading="isOverviewLoading"
          :missing-scopes-text="missingScopesText"
          :overview="overview"
          :overview-description="overviewDescription"
          :overview-info-items="overviewInfoItems"
        />

        <FilesPanel
          v-else-if="activeSection === 'files'"
          :default-branch="overview?.defaultBranch ?? null"
          :owner="owner"
          :repo="repository"
        />

        <PullRequestsSection
          v-else-if="activeSection === 'pullRequests'"
          :owner="owner"
          :repo="repository"
        />

        <Empty
          v-else
          class="min-h-[24rem] border border-border bg-card"
        >
          <EmptyHeader>
            <EmptyTitle>
              {{ t('repository.empty.title', { section: activeSectionTitle }) }}
            </EmptyTitle>
            <EmptyDescription>
              {{ t('repository.empty.description') }}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </main>
  </section>
</template>
