<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight, Lock, Plus, Search } from 'lucide-vue-next'
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Skeleton,
} from '@oh-my-github/ui'
import TeamCreateDialog from '@/components/github/team-create-dialog.vue'
import { useOrganizationTeamsQuery } from '@/composables/github/use-organization-teams'

const props = defineProps<{
  login: string
}>()

const emit = defineEmits<{
  selectTeam: [teamSlug: string]
}>()

interface TeamRow {
  team: GitHubTeam
  level: number
  hasChildren: boolean
}

const SEARCH_DEBOUNCE_MS = 300
const SEARCH_VISIBILITY_THRESHOLD = 8

const { t } = useI18n()

const searchInput = ref('')
const search = ref('')
const expandedSlugs = ref(new Set<string>())
const isCreateOpen = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const hasLogin = computed(() => props.login.trim().length > 0)
const teamsQuery = useOrganizationTeamsQuery(() => props.login, hasLogin)
const result = computed(() => teamsQuery.data.value ?? null)
const teams = computed(() => result.value?.teams ?? [])
const canAdminister = computed(() =>
  Boolean(result.value?.viewerCanAdminister) && (result.value?.missingAdminScopes ?? []).length === 0
)
const missingAdminScopes = computed(() =>
  result.value?.viewerCanAdminister ? result.value.missingAdminScopes : []
)
const isLoading = computed(() => teamsQuery.isLoading.value)
const hasError = computed(() => Boolean(teamsQuery.error.value))
const showSearch = computed(() => teams.value.length > SEARCH_VISIBILITY_THRESHOLD)

const teamSlugs = computed(() => new Set(teams.value.map((team) => team.slug)))
const childrenBySlug = computed(() => {
  const map = new Map<string, GitHubTeam[]>()

  for (const team of teams.value) {
    if (!team.parentSlug || !teamSlugs.value.has(team.parentSlug)) continue

    const siblings = map.get(team.parentSlug) ?? []
    siblings.push(team)
    map.set(team.parentSlug, siblings)
  }

  return map
})
// A team whose parent is invisible to the viewer (e.g. a secret ancestor)
// still needs a home, so it renders at the root level.
const rootTeams = computed(() =>
  teams.value.filter((team) => !team.parentSlug || !teamSlugs.value.has(team.parentSlug))
)

const visibleRows = computed<TeamRow[]>(() => {
  const query = search.value.toLowerCase()

  if (query) {
    return teams.value
      .filter((team) =>
        team.name.toLowerCase().includes(query)
        || team.slug.toLowerCase().includes(query)
        || (team.description ?? '').toLowerCase().includes(query))
      .map((team) => ({ team, level: 0, hasChildren: false }))
  }

  const rows: TeamRow[] = []
  const walk = (list: GitHubTeam[], level: number): void => {
    for (const team of list) {
      const children = childrenBySlug.value.get(team.slug) ?? []
      rows.push({ team, level, hasChildren: children.length > 0 })

      if (children.length > 0 && expandedSlugs.value.has(team.slug)) {
        walk(children, level + 1)
      }
    }
  }
  walk(rootTeams.value, 0)

  return rows
})
// The chevron column only earns its width when something can actually expand;
// a flat team list would otherwise carry a dead spacer on every row.
const showTreeControls = computed(() => visibleRows.value.some((row) => row.hasChildren))

watch(
  () => props.login,
  () => {
    searchInput.value = ''
    search.value = ''
    expandedSlugs.value = new Set()
  },
)

watch(searchInput, (value) => {
  clearSearchTimer()

  searchTimer = setTimeout(() => {
    search.value = value.trim()
    searchTimer = null
  }, SEARCH_DEBOUNCE_MS)
})

onBeforeUnmount(() => {
  clearSearchTimer()
})

function clearSearchTimer(): void {
  if (!searchTimer) return

  clearTimeout(searchTimer)
  searchTimer = null
}

function toggleExpanded(slug: string): void {
  const next = new Set(expandedSlugs.value)

  if (next.has(slug)) {
    next.delete(slug)
  } else {
    next.add(slug)
  }

  expandedSlugs.value = next
}

function fallbackInitials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

function onTeamCreated(created: GitHubCreatedTeam): void {
  if (created.slug) {
    emit('selectTeam', created.slug)
  }
}
</script>

<template>
  <section class="grid gap-3">
    <div class="flex min-w-0 flex-wrap items-center justify-between gap-2">
      <p class="select-none text-label font-medium text-foreground">
        {{ t('account.teams.title', { count: result?.totalCount ?? 0 }) }}
      </p>

      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <InputGroup
          v-if="showSearch"
          class="w-56"
          size="sm"
        >
          <InputGroupAddon>
            <Search class="size-3.5 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            v-model="searchInput"
            :placeholder="t('account.teams.searchPlaceholder')"
            type="search"
          />
        </InputGroup>

        <Button
          v-if="canAdminister"
          size="sm"
          type="button"
          @click="isCreateOpen = true"
        >
          <Plus class="size-3.5" />
          {{ t('account.teams.actions.create') }}
        </Button>
      </div>
    </div>

    <div
      v-if="missingAdminScopes.length > 0"
      class="rounded-lg border border-warning/30 bg-warning/10 p-3 text-body text-muted-foreground"
    >
      {{ t('account.teams.missingAdminScope', { scopes: missingAdminScopes.join(', ') }) }}
    </div>

    <div
      v-if="isLoading && !result"
      class="grid gap-2"
    >
      <Skeleton
        v-for="index in 6"
        :key="index"
        class="h-16 rounded-lg"
      />
    </div>

    <Empty
      v-else-if="hasError"
      class="min-h-[18rem] border border-border bg-card"
    >
      <EmptyHeader>
        <EmptyTitle>
          {{ t('account.teams.error.title') }}
        </EmptyTitle>
        <EmptyDescription>
          {{ t('account.teams.error.description') }}
        </EmptyDescription>
        <Button
          class="justify-self-center"
          size="sm"
          type="button"
          variant="outline"
          @click="teamsQuery.refetch()"
        >
          {{ t('account.error.retry') }}
        </Button>
      </EmptyHeader>
    </Empty>

    <Empty
      v-else-if="visibleRows.length === 0"
      class="min-h-[18rem] border border-border bg-card"
    >
      <EmptyHeader>
        <EmptyTitle>
          {{ t(search ? 'account.teams.empty.filtered.title' : 'account.teams.empty.none.title') }}
        </EmptyTitle>
        <EmptyDescription>
          {{ t(search ? 'account.teams.empty.filtered.description' : 'account.teams.empty.none.description') }}
        </EmptyDescription>
        <Button
          v-if="!search && canAdminister"
          class="justify-self-center"
          size="sm"
          type="button"
          variant="outline"
          @click="isCreateOpen = true"
        >
          <Plus class="size-3.5" />
          {{ t('account.teams.actions.create') }}
        </Button>
      </EmptyHeader>
    </Empty>

    <template v-else>
      <p
        v-if="result?.truncated"
        class="text-body text-muted-foreground"
      >
        {{ t('account.teams.truncated') }}
      </p>

      <ul class="grid gap-2">
        <li
          v-for="row in visibleRows"
          :key="row.team.slug"
          :style="{ paddingLeft: `${row.level * 1.75}rem` }"
        >
          <div
            class="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card p-3 outline-hidden transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/30"
            role="button"
            tabindex="0"
            @click="emit('selectTeam', row.team.slug)"
            @keydown.enter.self.prevent="emit('selectTeam', row.team.slug)"
            @keydown.space.self.prevent="emit('selectTeam', row.team.slug)"
          >
            <Button
              v-if="row.hasChildren"
              :aria-label="t(expandedSlugs.has(row.team.slug)
                ? 'account.teams.actions.collapse'
                : 'account.teams.actions.expand')"
              size="icon-sm"
              type="button"
              variant="ghost"
              @click.stop="toggleExpanded(row.team.slug)"
            >
              <ChevronRight
                class="size-4 transition-transform"
                :class="expandedSlugs.has(row.team.slug) ? 'rotate-90' : ''"
              />
            </Button>
            <span
              v-else-if="showTreeControls"
              class="size-7 shrink-0"
            />

            <Avatar class="size-10 shrink-0">
              <AvatarImage
                :alt="row.team.name"
                :src="row.team.avatarUrl ?? ''"
              />
              <AvatarFallback class="text-label">
                {{ fallbackInitials(row.team.name) }}
              </AvatarFallback>
            </Avatar>

            <div class="grid min-w-0 flex-1 gap-0.5">
              <div class="flex min-w-0 items-center gap-2">
                <span class="truncate text-label font-medium text-foreground">
                  {{ row.team.name }}
                </span>
                <span class="truncate text-body text-muted-foreground">
                  {{ row.team.slug }}
                </span>
                <Badge
                  v-if="row.team.privacy === 'secret'"
                  variant="outline"
                >
                  <Lock class="size-3" />
                  {{ t('teams.privacy.secret') }}
                </Badge>
              </div>
              <p
                v-if="row.team.description"
                class="truncate text-body text-muted-foreground"
              >
                {{ row.team.description }}
              </p>
            </div>

            <span class="shrink-0 select-none text-body text-muted-foreground">
              {{ t('account.teams.meta', {
                members: row.team.membersCount,
                repos: row.team.reposCount,
              }) }}
            </span>
          </div>
        </li>
      </ul>
    </template>

    <TeamCreateDialog
      v-model:open="isCreateOpen"
      :org="login"
      :teams="teams"
      @created="onTeamCreated"
    />
  </section>
</template>
