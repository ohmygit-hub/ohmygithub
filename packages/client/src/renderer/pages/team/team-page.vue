<script setup lang="ts">
import type { TeamTabId, WorkspaceTab } from '@/pages/workspace/types'
import type { Component } from 'vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Book, Lock, Network, Settings2, UsersRound } from 'lucide-vue-next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
} from '@oh-my-github/ui'
import SectionSidebar from '@/components/navigation/section-sidebar.vue'
import { useTeamDetailQuery, useTeamInvalidation } from '@/composables/github/use-organization-teams'
import {
  createAccountWorkspaceUrl,
  createRepositoryWorkspaceUrl,
  createTeamWorkspaceUrl,
} from '@/pages/workspace/workspace-url'
import TeamMembersSection from './components/team-members-section.vue'
import TeamRepositoriesSection from './components/team-repositories-section.vue'
import TeamChildTeamsSection from './components/team-child-teams-section.vue'
import TeamSettingsSection from './components/team-settings-section.vue'

const props = defineProps<{
  tab: WorkspaceTab
  viewer: AuthViewer | null
}>()

const emit = defineEmits<{
  replaceActiveUrl: [url: string]
}>()

const { t } = useI18n()
const router = useRouter()
const { invalidateTeams, invalidateTeamDetail } = useTeamInvalidation()

const org = computed(() => props.tab.owner ?? '')
const teamSlug = computed(() => props.tab.teamSlug ?? '')
const hasTarget = computed(() => org.value.trim().length > 0 && teamSlug.value.trim().length > 0)
const activeSection = ref<TeamTabId>(props.tab.teamSection ?? 'members')

const detailQuery = useTeamDetailQuery(org, teamSlug, hasTarget)
const detail = computed(() => detailQuery.data.value ?? null)
const team = computed(() => detail.value?.team ?? null)
const canAdminister = computed(() => Boolean(detail.value?.viewerCanAdminister))
const isLoading = computed(() => hasTarget.value && detailQuery.isLoading.value && !detail.value)
const hasError = computed(() => Boolean(detailQuery.error.value))
const fallback = computed(() => (team.value?.name ?? teamSlug.value).slice(0, 2).toUpperCase())

const teamSections: Array<{ id: TeamTabId; icon: Component }> = [
  { id: 'members', icon: UsersRound },
  { id: 'repositories', icon: Book },
  { id: 'teams', icon: Network },
  { id: 'settings', icon: Settings2 },
]
const sidebarItems = computed(() =>
  teamSections
    .filter((section) => section.id !== 'settings' || canAdminister.value)
    .map((section) => ({
      id: section.id,
      icon: section.icon,
      label: t(`teams.sections.${section.id}`),
    }))
)

watch(
  () => props.tab.teamSection,
  (section) => {
    activeSection.value = section ?? 'members'
  },
  { immediate: true },
)

watch([canAdminister, activeSection], ([administer, section]) => {
  if (!administer && section === 'settings') {
    setActiveSection('members')
  }
})

function setActiveSection(section: string): void {
  const nextSection = section as TeamTabId
  activeSection.value = nextSection

  if (!hasTarget.value) return

  const nextUrl = createTeamWorkspaceUrl(org.value, teamSlug.value, nextSection)
  if (nextUrl === props.tab.url) return

  emit('replaceActiveUrl', nextUrl)
}

function refresh(): void {
  invalidateTeamDetail(org.value, teamSlug.value)
  invalidateTeams(org.value)
}

function retry(): void {
  void detailQuery.refetch()
}

function selectAccount(login: string): void {
  void router.push(createAccountWorkspaceUrl(login))
}

function selectRepository(owner: string, repo: string): void {
  void router.push(createRepositoryWorkspaceUrl(owner, repo))
}

function selectTeam(slug: string): void {
  void router.push(createTeamWorkspaceUrl(org.value, slug))
}

function openOrganization(): void {
  void router.push(createAccountWorkspaceUrl(org.value))
}

function openParentTeam(): void {
  const parentSlug = team.value?.parentSlug
  if (parentSlug) selectTeam(parentSlug)
}

// A rename changes the slug, so the tab must renavigate to stay attached.
function onRenamed(nextSlug: string): void {
  invalidateTeams(org.value)

  if (nextSlug && nextSlug !== teamSlug.value) {
    emit('replaceActiveUrl', createTeamWorkspaceUrl(org.value, nextSlug, 'settings'))
    return
  }

  refresh()
}

function onDeleted(): void {
  invalidateTeams(org.value)
  emit('replaceActiveUrl', createAccountWorkspaceUrl(org.value, 'teams'))
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
        </div>
      </div>

      <Empty
        v-else-if="!hasTarget || hasError || !team"
        class="min-h-[24rem] border border-border bg-card"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t(hasError ? 'teams.error.title' : 'teams.empty.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t(hasError ? 'teams.error.description' : 'teams.empty.description') }}
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
        <header class="grid shrink-0 gap-3 rounded-lg border border-border bg-card p-4">
          <div class="flex min-w-0 items-start gap-4">
            <Avatar class="size-16 shrink-0">
              <AvatarImage
                :alt="team.name"
                :src="team.avatarUrl ?? ''"
              />
              <AvatarFallback class="text-heading">
                {{ fallback }}
              </AvatarFallback>
            </Avatar>

            <div class="grid min-w-0 flex-1 gap-1">
              <div class="flex min-w-0 flex-wrap items-center gap-2">
                <h1 class="truncate text-heading font-semibold text-foreground">
                  {{ team.name }}
                </h1>
                <Badge
                  v-if="team.privacy === 'secret'"
                  variant="outline"
                >
                  <Lock class="size-3" />
                  {{ t('teams.privacy.secret') }}
                </Badge>
              </div>

              <div class="flex min-w-0 flex-wrap items-center gap-1 text-body text-muted-foreground">
                <button
                  class="truncate underline-offset-4 hover:underline"
                  type="button"
                  @click="openOrganization"
                >
                  {{ org }}
                </button>
                <span aria-hidden="true">/</span>
                <span class="truncate">{{ team.slug }}</span>
                <template v-if="team.parentSlug">
                  <span
                    aria-hidden="true"
                    class="px-1"
                  >·</span>
                  <span class="select-none">{{ t('teams.header.parent') }}</span>
                  <button
                    class="truncate font-medium text-foreground underline-offset-4 hover:underline"
                    type="button"
                    @click="openParentTeam"
                  >
                    {{ team.parentName ?? team.parentSlug }}
                  </button>
                </template>
              </div>

              <p
                v-if="team.description"
                class="text-label text-muted-foreground"
              >
                {{ team.description }}
              </p>
            </div>
          </div>
        </header>

        <div class="flex min-h-0 min-w-0 flex-1 items-stretch gap-3">
          <SectionSidebar
            :active-id="activeSection"
            :items="sidebarItems"
            :navigation-label="t('teams.sidebar.navigation')"
            @update:active-id="setActiveSection"
          />

          <main class="min-h-0 min-w-0 flex-1 overflow-auto pr-1">
            <TeamMembersSection
              v-if="activeSection === 'members'"
              :can-administer="canAdminister"
              :members="detail?.members ?? []"
              :members-truncated="detail?.membersTruncated ?? false"
              :org="org"
              :team-slug="teamSlug"
              :viewer-login="viewer?.login ?? null"
              @refresh="refresh"
              @select-account="selectAccount"
            />

            <TeamRepositoriesSection
              v-else-if="activeSection === 'repositories'"
              :can-administer="canAdminister"
              :org="org"
              :repositories="detail?.repositories ?? []"
              :repositories-truncated="detail?.repositoriesTruncated ?? false"
              :team-slug="teamSlug"
              @refresh="refresh"
              @select-repository="selectRepository"
            />

            <TeamChildTeamsSection
              v-else-if="activeSection === 'teams'"
              :can-administer="canAdminister"
              :child-teams="detail?.childTeams ?? []"
              :org="org"
              :team-slug="teamSlug"
              @select-team="selectTeam"
            />

            <TeamSettingsSection
              v-else-if="activeSection === 'settings' && canAdminister"
              :org="org"
              :team="team"
              @deleted="onDeleted"
              @renamed="onRenamed"
            />
          </main>
        </div>
      </template>
    </div>
  </section>
</template>
