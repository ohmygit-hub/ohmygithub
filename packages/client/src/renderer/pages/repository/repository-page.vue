<script setup lang="ts">
import type { WorkspaceTab } from '@/pages/workspace/types'
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
  GitCommitHorizontal,
  GitFork,
  GitBranch,
  GitPullRequest,
  Globe,
  Eye,
  Package,
  Rocket,
  Scale,
  Settings,
  Shield,
  Star,
  Tags,
  Users,
} from 'lucide-vue-next'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@oh-my-github/ui'
import {
  useRepositoryNavigationCountsQuery,
  useRepositoryOverviewQuery,
} from '@/composables/github/use-repositories'
import { useAccountListInvalidation } from '@/composables/github/use-accounts'
import { createRepositoryWorkspaceUrl } from '@/pages/workspace/workspace-url'
import RepositoryOverview from './components/overview/repository-overview.vue'
import PullRequestsSection from './components/pulls/section.vue'
import IssuesSection from './components/issues/section.vue'
import FilesPanel from './components/files/files-panel.vue'
import CommitsSection from './components/commits/section.vue'
import RepositorySidebar from './components/repository-sidebar.vue'
import RepositoryForkDialog from './components/repository-fork-dialog.vue'
import { resolveRepositorySidebarCounts } from './components/repository-section-counts'
import ActionsSection from './components/actions/section.vue'
import ReleasesSection from './components/releases/section.vue'
import BranchesSection from './components/branches/section.vue'
import ContributorsSection from './components/contributors/section.vue'
import PackagesSection from './components/packages/section.vue'
import DeploymentsSection from './components/deployments/section.vue'
import { useToast } from '@/composables/use-toast'

const props = defineProps<{
  isActive: boolean
  tab: WorkspaceTab
}>()

const emit = defineEmits<{
  replaceActiveUrl: [url: string]
}>()

const repositorySections: readonly RepositorySection[] = [
  { id: 'overview', icon: Book },
  { id: 'files', icon: Folder },
  { id: 'commits', icon: GitCommitHorizontal },
  { id: 'branches', icon: GitBranch },
  { id: 'pullRequests', icon: GitPullRequest },
  { id: 'issues', icon: CircleDot },
  { id: 'actions', icon: Activity },
  { id: 'releases', icon: Tags },
  { id: 'contributors', icon: Users },
  { id: 'packages', icon: Package },
  { id: 'deployments', icon: Rocket },
  { id: 'settings', icon: Settings },
]

type RepositoryActionId = 'star' | 'watch'

const { t } = useI18n()
const toast = useToast()
const router = useRouter()
const { invalidateStarredRepositories, invalidateOwnedRepositories } = useAccountListInvalidation()
const activeSection = ref<RepositorySectionId>(props.tab.repositorySection ?? 'overview')
const isForkDialogOpen = ref(false)
const activeDocumentKind = ref<GitHubRepositoryDocumentKind>('readme')
const viewerState = ref<GitHubRepositoryViewerState | null>(null)
const isViewerStateLoading = ref(false)
const pendingRepositoryAction = ref<RepositoryActionId | null>(null)
let viewerStateRequestId = 0

const owner = computed(() => props.tab.owner ?? '')
const repository = computed(() => props.tab.repo ?? props.tab.title)
const activeSectionTitle = computed(() => t(`repository.sections.${activeSection.value}.title`))
const hasRepositoryIdentity = computed(() => Boolean(owner.value && repository.value))
const navigationCountsQuery = useRepositoryNavigationCountsQuery(owner, repository, hasRepositoryIdentity)
const overviewQuery = useRepositoryOverviewQuery(owner, repository, hasRepositoryIdentity)
const overview = computed(() => overviewQuery.data.value ?? null)
const repositorySidebarCounts = computed(() =>
  resolveRepositorySidebarCounts(navigationCountsQuery.data.value ?? null, overview.value?.counts ?? null)
)
const isOverviewLoading = computed(() => overviewQuery.isLoading.value)
const hasOverviewError = computed(() => Boolean(overviewQuery.error.value))
const isStarred = computed(() => viewerState.value?.isStarred ?? false)
const subscription = computed<GitHubRepositorySubscription>(() => viewerState.value?.subscription ?? 'participating')
const starCount = computed(() => viewerState.value?.starCount ?? overview.value?.counts.stars ?? null)
const formattedStarCount = computed(() => {
  if (starCount.value === null) return '...'

  return new Intl.NumberFormat().format(starCount.value)
})
const starLabel = computed(() => t(isStarred.value ? 'repository.actions.starred' : 'repository.actions.star'))
const watchLabel = computed(() =>
  t(subscription.value === 'all' ? 'repository.actions.watching' : 'repository.actions.watch')
)
const starButtonDisabled = computed(() =>
  !hasRepositoryIdentity.value || isViewerStateLoading.value || Boolean(pendingRepositoryAction.value)
)
const watchButtonDisabled = computed(() =>
  !hasRepositoryIdentity.value || isViewerStateLoading.value || Boolean(pendingRepositoryAction.value)
)
const forkButtonDisabled = computed(() => !hasRepositoryIdentity.value)
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

function setActiveSection(section: RepositorySectionId): void {
  activeSection.value = section

  if (!hasRepositoryIdentity.value) return

  const nextUrl = createRepositoryWorkspaceUrl(owner.value, repository.value, section)
  if (nextUrl === props.tab.url) return

  emit('replaceActiveUrl', nextUrl)
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
      isWatching: subscription.value === 'all',
      subscription: subscription.value,
      starCount: Math.max(0, (starCount.value ?? 0) + (nextStarred ? 1 : -1)),
    }
    invalidateStarredRepositories()
  } catch {
    void loadRepositoryViewerState()
  } finally {
    pendingRepositoryAction.value = null
  }
}

async function setSubscription(nextSubscription: GitHubRepositorySubscription): Promise<void> {
  if (!hasRepositoryIdentity.value || pendingRepositoryAction.value || !window.ohMyGithub?.repositories) return
  if (nextSubscription === subscription.value) return

  pendingRepositoryAction.value = 'watch'

  try {
    await window.ohMyGithub.repositories.setSubscription(owner.value, repository.value, nextSubscription)
    viewerState.value = {
      isStarred: isStarred.value,
      isWatching: nextSubscription === 'all',
      subscription: nextSubscription,
      starCount: starCount.value ?? 0,
    }
  } catch {
    toast.error(t('repository.watch.error'))
    void loadRepositoryViewerState()
  } finally {
    pendingRepositoryAction.value = null
  }
}

function openForkDialog(): void {
  if (!hasRepositoryIdentity.value) return
  isForkDialogOpen.value = true
}

function handleForked(fork: GitHubForkedRepository): void {
  isForkDialogOpen.value = false

  if (fork.ready) {
    toast.success(t('repository.fork.success', { repo: fork.nameWithOwner }))
    invalidateOwnedRepositories(fork.owner)
    void router.push(createRepositoryWorkspaceUrl(fork.owner, fork.name))
    return
  }

  toast.info(t('repository.fork.pending', { repo: fork.nameWithOwner }))
}

watch(
  () => props.tab.repositorySection,
  (section) => {
    activeSection.value = section ?? 'overview'
  },
  { immediate: true },
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
      :active-section="activeSection"
      :fork-button-disabled="forkButtonDisabled"
      :formatted-star-count="formattedStarCount"
      :is-starred="isStarred"
      :owner="owner"
      :repository="repository"
      :repository-counts="repositorySidebarCounts"
      :sections="repositorySections"
      :star-button-disabled="starButtonDisabled"
      :star-label="starLabel"
      :subscription="subscription"
      :watch-button-disabled="watchButtonDisabled"
      :watch-label="watchLabel"
      @fork="openForkDialog"
      @open-owner="openOwner"
      @set-subscription="setSubscription"
      @toggle-starred="toggleStarred"
      @update:active-section="setActiveSection"
    />

    <RepositoryForkDialog
      v-model:open="isForkDialogOpen"
      :owner="owner"
      :repository="repository"
      @forked="handleForked"
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
          :owner="owner"
          :overview="overview"
          :overview-description="overviewDescription"
          :overview-info-items="overviewInfoItems"
          :repo="repository"
          @view-all-contributors="setActiveSection('contributors')"
        />

        <FilesPanel
          v-else-if="activeSection === 'files'"
          :default-branch="overview?.defaultBranch ?? null"
          :owner="owner"
          :repo="repository"
        />

        <CommitsSection
          v-else-if="activeSection === 'commits'"
          :default-branch="overview?.defaultBranch ?? null"
          :owner="owner"
          :repo="repository"
        />

        <BranchesSection
          v-else-if="activeSection === 'branches'"
          :default-branch="overview?.defaultBranch ?? null"
          :owner="owner"
          :repo="repository"
        />

        <PullRequestsSection
          v-else-if="activeSection === 'pullRequests'"
          :owner="owner"
          :repo="repository"
        />

        <IssuesSection
          v-else-if="activeSection === 'issues'"
          :owner="owner"
          :repo="repository"
        />

        <ActionsSection
          v-else-if="activeSection === 'actions'"
          :is-active="isActive"
          :owner="owner"
          :repo="repository"
        />

        <ReleasesSection
          v-else-if="activeSection === 'releases'"
          :default-branch="overview?.defaultBranch ?? null"
          :owner="owner"
          :repo="repository"
        />

        <ContributorsSection
          v-else-if="activeSection === 'contributors'"
          :default-branch="overview?.defaultBranch ?? null"
          :owner="owner"
          :repo="repository"
        />

        <PackagesSection
          v-else-if="activeSection === 'packages'"
          :is-active="isActive"
          :owner="owner"
          :repo="repository"
        />

        <DeploymentsSection
          v-else-if="activeSection === 'deployments'"
          :is-active="isActive"
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
