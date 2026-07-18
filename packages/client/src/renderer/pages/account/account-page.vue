<script setup lang="ts">
import type { AccountTabId, WorkspaceTab } from '@/pages/workspace/types'
import type { Component } from 'vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  AtSign,
  BookOpen,
  Building2,
  Clock3,
  FileText,
  Heart,
  LinkIcon,
  Mail,
  MapPin,
  Network,
  Star,
  UserRound,
  Users,
  UsersRound,
} from 'lucide-vue-next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  ButtonGroup,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
} from '@oh-my-github/ui'
import {
  setAccountFollowed,
  useAccountContributionsQuery,
  useAccountListInvalidation,
  useAccountOverviewQuery,
  useAccountRepositoriesQuery,
  useAccountStarredListsQuery,
  useAccountStarredRepositoriesQuery,
  useAccountViewerStateQuery,
} from '@/composables/github/use-accounts'
import SectionSidebar from '@/components/navigation/section-sidebar.vue'
import GitHubOrganizationAvatar from '@/components/github/github-organization-avatar.vue'
import { createAccountWorkspaceUrl, createRepositoryWorkspaceUrl, createTeamWorkspaceUrl } from '@/pages/workspace/workspace-url'
import AccountOverviewSection from './components/account-overview-section.vue'
import AccountRepositoryGrid from './components/account-repository-grid.vue'
import AccountFollowersSection from './components/account-followers-section.vue'
import AccountSponsorsSection from './components/account-sponsors-section.vue'
import AccountPeopleSection from './components/account-people-section.vue'
import AccountTeamsSection from './components/account-teams-section.vue'

const props = defineProps<{
  tab: WorkspaceTab
  viewer: AuthViewer | null
}>()

const emit = defineEmits<{
  replaceActiveUrl: [url: string]
}>()

interface AccountHeaderMetaItem {
  id: string
  icon: Component
  value: string
  href?: string | null
  section?: AccountTabId
  followTab?: 'followers' | 'following'
}

const PER_PAGE = 12
const SEARCH_DEBOUNCE_MS = 300
const accountSections: Array<{ id: AccountTabId; icon: Component }> = [
  { id: 'overview', icon: BookOpen },
  { id: 'repositories', icon: FileText },
  { id: 'stars', icon: Star },
  { id: 'people', icon: UsersRound },
  { id: 'teams', icon: Network },
  { id: 'followers', icon: Users },
  { id: 'sponsors', icon: Heart },
]

const { t } = useI18n()
const { invalidateAccountProfile } = useAccountListInvalidation()
const router = useRouter()
const login = computed(() => props.tab.owner ?? props.tab.title)
const hasLogin = computed(() => login.value.trim().length > 0)
const activeSection = ref<AccountTabId>(props.tab.accountSection ?? 'overview')
const followersInitialTab = ref<'followers' | 'following'>('followers')
const selectedContributionYear = ref<number | null>(null)
const repositoryPage = ref(1)
const starsPage = ref(1)
const repositorySearchInput = ref('')
const repositorySearch = ref('')
const starsSearchInput = ref('')
const starsSearch = ref('')
const starsList = ref('')
const viewerState = ref<GitHubAccountViewerState | null>(null)
const pendingFollow = ref(false)
let repositorySearchTimer: ReturnType<typeof setTimeout> | null = null
let starsSearchTimer: ReturnType<typeof setTimeout> | null = null

const overviewQuery = useAccountOverviewQuery(login, hasLogin)
const overview = computed(() => overviewQuery.data.value ?? null)
const profile = computed(() => overview.value?.profile ?? null)
const isLoading = computed(() => hasLogin.value && overviewQuery.isLoading.value && !overview.value)
const hasError = computed(() => Boolean(overviewQuery.error.value))
const displayName = computed(() => profile.value?.name?.trim() || profile.value?.login || login.value)
const fallback = computed(() => login.value.slice(0, 2).toUpperCase())
const isViewerAccount = computed(() =>
  Boolean(
    profile.value?.login
      && props.viewer?.login
      && profile.value.login.toLowerCase() === props.viewer.login.toLowerCase(),
  )
)
const isOrganizationProfile = computed(() => profile.value?.type === 'Organization')
const canFollowProfile = computed(() =>
  profile.value?.type === 'User' || profile.value?.type === 'Organization'
)
const showFollowButton = computed(() =>
  Boolean(canFollowProfile.value && !isViewerAccount.value)
)
const viewerStateQuery = useAccountViewerStateQuery(login, showFollowButton)
const missingFollowScopes = computed(() => viewerState.value?.missingScopes ?? [])
const isFollowing = computed(() => viewerState.value?.isFollowing ?? false)
const followLabel = computed(() => t(isFollowing.value ? 'account.actions.unfollow' : 'account.actions.follow'))
const followDisabled = computed(() =>
  pendingFollow.value || viewerStateQuery.isLoading.value || missingFollowScopes.value.length > 0
)
const selectedYear = computed(() => selectedContributionYear.value)
const contributionsQuery = useAccountContributionsQuery(
  login,
  selectedYear,
  () => hasLogin.value && !isOrganizationProfile.value && selectedContributionYear.value !== null,
)
const contributions = computed(() => contributionsQuery.data.value ?? null)
const repositoriesEnabled = computed(() => hasLogin.value && activeSection.value === 'repositories')
const starsEnabled = computed(() => hasLogin.value && !isOrganizationProfile.value && activeSection.value === 'stars')
const repositoriesQuery = useAccountRepositoriesQuery(
  login,
  repositoryPage,
  () => PER_PAGE,
  repositorySearch,
  repositoriesEnabled,
)
const starsQuery = useAccountStarredRepositoriesQuery(
  login,
  starsPage,
  () => PER_PAGE,
  starsSearch,
  starsList,
  starsEnabled,
)
const starsListsQuery = useAccountStarredListsQuery(login, starsEnabled)
const repositoryResult = computed(() => repositoriesQuery.data.value ?? null)
const starsResult = computed(() => starsQuery.data.value ?? null)
const starsLists = computed(() => starsListsQuery.data.value ?? [])
const visibleAccountSections = computed(() =>
  accountSections.filter((section) => {
    if (isOrganizationProfile.value) return section.id !== 'stars'
    return section.id !== 'people' && section.id !== 'teams'
  })
)
const sidebarItems = computed(() =>
  visibleAccountSections.value.map((section) => ({
    id: section.id,
    icon: section.icon,
    label: t(`account.sections.${section.id}`),
  }))
)
const metadataItems = computed<AccountHeaderMetaItem[]>(() => {
  const currentProfile = profile.value
  const currentOverview = overview.value
  if (!currentProfile || !currentOverview) return []

  const items: AccountHeaderMetaItem[] = [
    {
      id: 'followers',
      icon: Users,
      value: t('account.profile.followersValue', { count: formatNumber(currentProfile.followers) }),
      section: 'followers',
      followTab: 'followers',
    },
    {
      id: 'following',
      icon: UserRound,
      value: isOrganizationProfile.value
        ? ''
        : t('account.profile.followingValue', { count: formatNumber(currentProfile.following) }),
      section: 'followers',
      followTab: 'following',
    },
    {
      id: 'publicRepos',
      icon: BookOpen,
      value: t('account.profile.publicReposValue', { count: formatNumber(currentProfile.publicRepos) }),
      section: 'repositories',
    },
    {
      id: 'publicGists',
      icon: FileText,
      value: isOrganizationProfile.value
        ? ''
        : t('account.profile.publicGistsValue', { count: formatNumber(currentProfile.publicGists) }),
    },
    {
      id: 'company',
      icon: Building2,
      value: currentProfile.company ?? '',
    },
    {
      id: 'location',
      icon: MapPin,
      value: currentProfile.location ?? '',
    },
    {
      id: 'email',
      icon: Mail,
      value: currentProfile.email ?? '',
      href: currentProfile.email ? `mailto:${currentProfile.email}` : null,
    },
    {
      id: 'blog',
      icon: LinkIcon,
      value: currentProfile.blog ?? '',
      href: normalizeExternalUrl(currentProfile.blog),
    },
    {
      id: 'twitter',
      icon: AtSign,
      value: currentProfile.twitterUsername ? `@${currentProfile.twitterUsername}` : '',
      href: currentProfile.twitterUsername ? `https://x.com/${currentProfile.twitterUsername}` : null,
    },
    {
      id: 'hireable',
      icon: UserRound,
      value: currentProfile.hireable ? t('account.profile.hireable') : '',
    },
    {
      id: 'createdAt',
      icon: Clock3,
      value: currentProfile.createdAt
        ? t('account.profile.joinedAt', { date: formatDate(currentProfile.createdAt) })
        : '',
    },
    ...currentOverview.socialAccounts.map((account) => ({
      id: `social:${account.provider}:${account.url}`,
      icon: LinkIcon,
      value: account.displayName,
      href: account.url,
    })),
  ]

  return items.filter((item) => item.value.trim().length > 0)
})

watch(
  () => props.tab.accountSection,
  (section) => {
    activeSection.value = section ?? 'overview'
  },
  { immediate: true },
)

watch(
  [profile, activeSection],
  ([currentProfile, section]) => {
    if (!currentProfile) return

    const isOrganization = currentProfile.type === 'Organization'
    if (
      (isOrganization && section === 'stars')
      || (!isOrganization && (section === 'people' || section === 'teams'))
    ) {
      setActiveSection('overview')
    }
  },
  { immediate: true },
)

watch(
  () => login.value,
  () => {
    repositoryPage.value = 1
    starsPage.value = 1
    repositorySearchInput.value = ''
    repositorySearch.value = ''
    starsSearchInput.value = ''
    starsSearch.value = ''
    starsList.value = ''
    selectedContributionYear.value = null
    viewerState.value = null
  },
)

watch(starsList, () => {
  starsPage.value = 1
})

watch(repositorySearchInput, (value) => {
  clearRepositorySearchTimer()

  repositorySearchTimer = setTimeout(() => {
    repositorySearch.value = value.trim()
    repositoryPage.value = 1
    repositorySearchTimer = null
  }, SEARCH_DEBOUNCE_MS)
})

watch(starsSearchInput, (value) => {
  clearStarsSearchTimer()

  starsSearchTimer = setTimeout(() => {
    starsSearch.value = value.trim()
    starsPage.value = 1
    starsSearchTimer = null
  }, SEARCH_DEBOUNCE_MS)
})

watch(
  [() => overview.value?.contributionYears ?? [], isOrganizationProfile],
  ([years, isOrganization]) => {
    if (isOrganization || years.length === 0) {
      selectedContributionYear.value = null
      return
    }

    if (!selectedContributionYear.value || !years.includes(selectedContributionYear.value)) {
      selectedContributionYear.value = years[0]
    }
  },
  { immediate: true },
)

watch(
  () => viewerStateQuery.data.value,
  (state) => {
    if (state) {
      viewerState.value = state
    }
  },
  { immediate: true },
)

watch(repositoryResult, (currentResult) => {
  if (currentResult && currentResult.items.length === 0 && currentResult.totalCount > 0 && repositoryPage.value > 1) {
    repositoryPage.value = 1
  }
})

watch(starsResult, (currentResult) => {
  if (currentResult && currentResult.items.length === 0 && currentResult.totalCount > 0 && starsPage.value > 1) {
    starsPage.value = 1
  }
})

onBeforeUnmount(() => {
  clearRepositorySearchTimer()
  clearStarsSearchTimer()
})

function setActiveSection(section: string): void {
  const nextSection = section as AccountTabId
  followersInitialTab.value = 'followers'
  activeSection.value = nextSection

  if (!hasLogin.value) return

  const nextUrl = createAccountWorkspaceUrl(login.value, nextSection)
  if (nextUrl === props.tab.url) return

  emit('replaceActiveUrl', nextUrl)
}

function onMetaItemClick(item: AccountHeaderMetaItem): void {
  if (!item.section) return
  setActiveSection(item.section)
  if (item.section === 'followers') {
    followersInitialTab.value = item.followTab ?? 'followers'
  }
}

function retry(): void {
  void overviewQuery.refetch()
}

function clearRepositorySearchTimer(): void {
  if (!repositorySearchTimer) return

  clearTimeout(repositorySearchTimer)
  repositorySearchTimer = null
}

function clearStarsSearchTimer(): void {
  if (!starsSearchTimer) return

  clearTimeout(starsSearchTimer)
  starsSearchTimer = null
}

async function toggleFollow(): Promise<void> {
  const currentProfile = profile.value
  if (!currentProfile || pendingFollow.value || followDisabled.value) return

  const previousState = viewerState.value
  const nextFollowing = !isFollowing.value
  pendingFollow.value = true
  viewerState.value = {
    isFollowing: nextFollowing,
    missingScopes: [],
  }

  try {
    await setAccountFollowed(currentProfile.login, nextFollowing)
    invalidateAccountProfile(currentProfile.login)
  } catch {
    viewerState.value = previousState
    void viewerStateQuery.refetch()
  } finally {
    pendingFollow.value = false
  }
}

function selectRepository(repository: GitHubAccountRepository): void {
  void router.push(createRepositoryWorkspaceUrl(repository.owner, repository.name))
}

function selectAccount(accountLogin: string): void {
  void router.push(createAccountWorkspaceUrl(accountLogin))
}

function selectTeam(teamSlug: string): void {
  if (!hasLogin.value) return

  void router.push(createTeamWorkspaceUrl(login.value, teamSlug))
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

function normalizeExternalUrl(value: string | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}
</script>

<template>
  <section class="flex h-full min-h-[34rem] flex-col overflow-hidden bg-background">
    <div class="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-4 p-3">
      <div
        v-if="isLoading"
        class="grid gap-4 rounded-lg border border-border bg-card p-4"
      >
        <div class="flex min-w-0 items-center gap-4">
          <Skeleton class="size-16 rounded-full" />
          <div class="grid min-w-0 flex-1 gap-2">
            <Skeleton class="h-6 w-48 rounded-md" />
            <Skeleton class="h-4 w-32 rounded-md" />
            <Skeleton class="h-4 w-3/5 rounded-md" />
          </div>
          <Skeleton class="h-8 w-36 rounded-md" />
        </div>
        <div class="flex flex-wrap gap-2">
          <Skeleton
            v-for="index in 8"
            :key="index"
            class="h-7 w-32 rounded-md"
          />
        </div>
      </div>

      <Empty
        v-else-if="!hasLogin || hasError || !overview || !profile"
        class="min-h-[24rem] border border-border bg-card"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t(hasError ? 'account.error.title' : 'account.empty.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t(hasError ? 'account.error.description' : 'account.empty.description') }}
          </EmptyDescription>
          <Button
            v-if="hasError"
            class="justify-self-center"
            size="sm"
            type="button"
            variant="outline"
            @click="retry"
          >
            {{ t('account.error.retry') }}
          </Button>
        </EmptyHeader>
      </Empty>

      <template v-else>
        <header class="grid shrink-0 gap-4 rounded-lg border border-border bg-card p-4">
          <div class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
            <GitHubOrganizationAvatar
              v-if="isOrganizationProfile"
              :avatar-url="profile.avatarUrl"
              :interactive="false"
              :login="profile.login"
              size="xl"
            />
            <Avatar
              v-else
              class="size-20 shrink-0"
            >
              <AvatarImage
                :alt="profile.login"
                :src="profile.avatarUrl"
              />
              <AvatarFallback class="text-label">
                {{ fallback }}
              </AvatarFallback>
            </Avatar>

            <div class="grid min-w-0 flex-1 gap-2">
              <div class="grid min-w-0 gap-1">
                <h1 class="truncate text-heading font-semibold text-foreground">
                  {{ displayName }}
                </h1>
                <div class="min-w-0 text-body text-muted-foreground">
                  <span class="select-text truncate">@{{ profile.login }}</span>
                </div>
              </div>

              <p
                v-if="profile.bio"
                class="max-w-3xl text-label text-muted-foreground"
              >
                {{ profile.bio }}
              </p>
            </div>

            <ButtonGroup
              v-if="showFollowButton"
              class="shrink-0 self-start"
            >
              <Button
                :aria-pressed="isFollowing"
                :disabled="followDisabled"
                size="sm"
                type="button"
                variant="outline"
                @click="toggleFollow"
              >
                <UserRound class="size-3.5" />
                <span>{{ followLabel }}</span>
              </Button>
            </ButtonGroup>
          </div>

          <div
            v-if="metadataItems.length > 0"
            class="flex flex-wrap gap-x-4 gap-y-2"
          >
            <div
              v-for="item in metadataItems"
              :key="item.id"
              class="inline-flex max-w-full items-center gap-2 text-body text-muted-foreground"
            >
              <component
                :is="item.icon"
                class="size-3.5 shrink-0"
              />
              <a
                v-if="item.href"
                class="min-w-0 truncate font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline"
                :href="item.href"
                rel="noreferrer"
                target="_blank"
              >
                {{ item.value }}
              </a>
              <button
                v-else-if="item.section"
                type="button"
                class="min-w-0 truncate font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline"
                @click="onMetaItemClick(item)"
              >
                {{ item.value }}
              </button>
              <span
                v-else
                class="min-w-0 truncate font-medium text-foreground"
              >
                {{ item.value }}
              </span>
            </div>
          </div>

          <div
            v-if="overview.organizations.length > 0"
            class="flex min-w-0 flex-wrap items-center gap-2"
          >
            <div class="inline-flex select-none items-center gap-2 text-body text-muted-foreground">
              <Building2 class="size-3.5" />
              <span>{{ t('account.profile.organizations') }}</span>
            </div>
            <GitHubOrganizationAvatar
              v-for="organization in overview.organizations"
              :key="organization.id || organization.login"
              :avatar-url="organization.avatarUrl"
              :login="organization.login"
            />
          </div>

          <div
            v-if="missingFollowScopes.length > 0"
            class="rounded-lg border border-warning/30 bg-warning/10 p-3 text-body text-muted-foreground"
          >
            {{ t('account.actions.missingFollowScope', { scopes: missingFollowScopes.join(', ') }) }}
          </div>
        </header>

        <div class="flex min-h-0 min-w-0 flex-1 items-stretch gap-3">
          <SectionSidebar
            :active-id="activeSection"
            :items="sidebarItems"
            :navigation-label="t('account.sidebar.navigation')"
            @update:active-id="setActiveSection"
          />

          <main class="min-h-0 min-w-0 flex-1 overflow-auto pr-1">
            <AccountOverviewSection
              v-if="activeSection === 'overview'"
              :contributions="contributions"
              :contributions-has-error="Boolean(contributionsQuery.error.value)"
              :contributions-loading="contributionsQuery.isLoading.value"
              :is-viewer-account="isViewerAccount"
              :overview="overview"
              :selected-year="selectedContributionYear"
              @select-repository="selectRepository"
              @update:selected-year="selectedContributionYear = $event"
            />

            <AccountRepositoryGrid
              v-else-if="activeSection === 'repositories'"
              :disabled="!hasLogin"
              :has-error="Boolean(repositoriesQuery.error.value)"
              :is-loading="repositoriesQuery.isLoading.value"
              mode="repositories"
              :page="repositoryPage"
              :per-page="PER_PAGE"
              :repositories="repositoryResult?.items ?? []"
              :search="repositorySearchInput"
              :total-count="repositoryResult?.totalCount ?? 0"
              @retry="repositoriesQuery.refetch()"
              @select="selectRepository"
              @update:page="repositoryPage = $event"
              @update:search="repositorySearchInput = $event"
            />

            <AccountFollowersSection
              v-else-if="activeSection === 'followers'"
              :followers-count="profile.followers"
              :following-count="profile.following"
              :initial-tab="followersInitialTab"
              :is-organization="isOrganizationProfile"
              :login="login"
              @select-account="selectAccount"
            />

            <AccountSponsorsSection
              v-else-if="activeSection === 'sponsors'"
              :is-viewer-account="isViewerAccount"
              :login="login"
              @select-account="selectAccount"
            />

            <AccountPeopleSection
              v-else-if="activeSection === 'people' && isOrganizationProfile"
              :login="login"
              :viewer-login="viewer?.login ?? null"
              @select-account="selectAccount"
            />

            <AccountTeamsSection
              v-else-if="activeSection === 'teams' && isOrganizationProfile"
              :login="login"
              @select-team="selectTeam"
            />

            <AccountRepositoryGrid
              v-else-if="activeSection === 'stars' && !isOrganizationProfile"
              :disabled="!hasLogin"
              :has-error="Boolean(starsQuery.error.value)"
              :is-loading="starsQuery.isLoading.value"
              :list="starsList"
              :lists="starsLists"
              mode="stars"
              :page="starsPage"
              :per-page="PER_PAGE"
              :repositories="starsResult?.items ?? []"
              :search="starsSearchInput"
              :total-count="starsResult?.totalCount ?? 0"
              @retry="starsQuery.refetch()"
              @select="selectRepository"
              @update:list="starsList = $event"
              @update:page="starsPage = $event"
              @update:search="starsSearchInput = $event"
            />
          </main>
        </div>
      </template>
    </div>
  </section>
</template>
