<script setup lang="ts">
import type { WorkspaceTab } from '@/pages/workspace/types'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFuse } from '@vueuse/integrations/useFuse'
import {
  ArrowRight,
  Building2,
  Book,
  Lock,
  Search,
  UserRound,
} from 'lucide-vue-next'
import {
  Badge,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Spinner,
  useCommand,
} from '@oh-my-github/ui'
import { useViewerRepositoriesQuery } from '@/composables/github/use-accounts'
import { getWorkspaceTabView } from '@/pages/workspace/tab-presentation'
import { createRepositoryWorkspaceUrl } from '@/pages/workspace/workspace-url'

const props = defineProps<{
  isResolving: boolean
  open: boolean
  resolveError: boolean
  tabs: WorkspaceTab[]
}>()

const emit = defineEmits<{
  goto: [query: string]
  search: [mode: GitHubWorkspaceSearchMode, query: string]
  navigate: [url: string]
}>()

const { t } = useI18n()
const { filterState } = useCommand()
const latestQuery = ref('')
const query = computed(() => filterState.search.trim())
const hasQuery = computed(() => query.value.length > 0)
const openTabUrls = computed(() => new Set(props.tabs.map((tab) => tab.url)))
const openTabs = computed(() => props.tabs.map((tab) => {
  const view = getWorkspaceTabView(tab)
  const title = view.titleKey ? t(view.titleKey, view.titleParams ?? {}) : view.title

  return {
    icon: view.icon,
    searchText: [title, tab.url, tab.owner, tab.repo, tab.type].filter(Boolean).join(' '),
    tab,
    title,
  }
}))

const MAX_OPEN_TAB_MATCHES = 6
const { results: openTabFuseResults } = useFuse(query, openTabs, {
  matchAllWhenSearchEmpty: false,
  fuseOptions: {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'searchText', weight: 1 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
  },
})
const openTabMatches = computed(() =>
  hasQuery.value
    ? openTabFuseResults.value.slice(0, MAX_OPEN_TAB_MATCHES).map((result) => result.item)
    : [],
)

// Local cache of every repo the viewer can reach, for instant fuzzy navigation. Shares
// the session-warm Colada query prefetched by the workspace shell, so opening the palette
// reads the list without a round-trip.
const repositoriesQuery = useViewerRepositoriesQuery()
const repositories = computed(() => repositoriesQuery.data.value ?? [])

const MAX_REPO_MATCHES = 6
const { results: fuseResults } = useFuse(query, repositories, {
  matchAllWhenSearchEmpty: false,
  fuseOptions: {
    keys: [
      { name: 'nameWithOwner', weight: 2 },
      { name: 'description', weight: 1 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
  },
})
const repoMatches = computed(() =>
  hasQuery.value
    ? fuseResults.value
        .map((result) => result.item)
        .filter((repository) => !openTabUrls.value.has(createRepositoryWorkspaceUrl(repository.owner, repository.name)))
        .slice(0, MAX_REPO_MATCHES)
    : [],
)

watch(query, (value) => {
  if (value) {
    latestQuery.value = value
  }
})

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      filterState.search = ''
      latestQuery.value = ''
    }
  },
)

function emitSearch(mode: GitHubWorkspaceSearchMode): void {
  const value = query.value || latestQuery.value
  if (!value) return

  emit('search', mode, value)
}

function emitGoto(): void {
  const value = query.value || latestQuery.value
  if (!value || props.isResolving) return

  emit('goto', value)
}

function openRepository(repository: GitHubRepository): void {
  emit('navigate', createRepositoryWorkspaceUrl(repository.owner, repository.name))
}
</script>

<template>
  <CommandInput
    :placeholder="t('workspace.search.placeholder')"
    size="md"
  />

  <CommandList
    v-if="hasQuery"
    :key="query"
  >
    <CommandGroup
      v-if="openTabMatches.length"
      force-render
    >
      <CommandItem
        v-for="item in openTabMatches"
        :key="item.tab.url"
        force-render
        :value="`tab:${item.searchText}`"
        @select="emit('navigate', item.tab.url)"
      >
        <component
          :is="item.icon"
          class="size-3.5"
        />
        <span class="min-w-0 flex-1 truncate">{{ item.title }}</span>
        <Badge
          class="select-none shrink-0"
          variant="secondary"
        >
          {{ t('workspace.search.openTab') }}
        </Badge>
      </CommandItem>
    </CommandGroup>

    <CommandSeparator v-if="openTabMatches.length" />

    <!-- Repositories matched against the local cache: pressing Enter jumps straight to the
      top match, which is what most Ctrl-K users want. Rendered first so it stays the
      default; when nothing matches, the repository-search action below is the fallback. -->
    <CommandGroup
      v-if="repoMatches.length"
      force-render
    >
      <CommandItem
        v-for="repository in repoMatches"
        :key="repository.id"
        force-render
        :value="`repo:${repository.nameWithOwner}`"
        @select="openRepository(repository)"
      >
        <Book class="size-3.5" />
        <span class="min-w-0 flex-1 truncate">{{ repository.nameWithOwner }}</span>
        <Lock
          v-if="repository.isPrivate"
          class="size-3 shrink-0 text-muted-foreground"
        />
      </CommandItem>
    </CommandGroup>

    <CommandSeparator v-if="repoMatches.length" />

    <CommandGroup force-render>
      <!-- Repository search is the default fallback action: most users type to search, not
        to navigate, so with no cached match Enter should search repos rather than jump to a
        URL (a bare "Go to" default caused unexpected 404s). "Go to" remains just below. -->
      <CommandItem
        force-render
        :value="`repos:${query}`"
        @select="emitSearch('repos')"
      >
        <Book class="size-3.5" />
        <span class="min-w-0 flex-1 truncate">
          {{ t('workspace.search.actions.repos', { query }) }}
        </span>
      </CommandItem>

      <CommandItem
        :disabled="isResolving"
        force-render
        :value="`goto:${query}`"
        @select="emitGoto"
      >
        <Spinner v-if="isResolving" />
        <ArrowRight
          v-else
          class="size-3.5"
        />
        <span class="min-w-0 flex-1 truncate">
          {{ t('workspace.search.actions.goto', { query }) }}
        </span>
      </CommandItem>

      <CommandItem
        force-render
        :value="`users:${query}`"
        @select="emitSearch('users')"
      >
        <UserRound class="size-3.5" />
        <span class="min-w-0 flex-1 truncate">
          {{ t('workspace.search.actions.users', { query }) }}
        </span>
      </CommandItem>

      <CommandItem
        force-render
        :value="`orgs:${query}`"
        @select="emitSearch('orgs')"
      >
        <Building2 class="size-3.5" />
        <span class="min-w-0 flex-1 truncate">
          {{ t('workspace.search.actions.orgs', { query }) }}
        </span>
      </CommandItem>

      <CommandItem
        force-render
        :value="`all:${query}`"
        @select="emitSearch('all')"
      >
        <Search class="size-3.5" />
        <span class="min-w-0 flex-1 truncate">
          {{ t('workspace.search.actions.all', { query }) }}
        </span>
      </CommandItem>
    </CommandGroup>

    <p
      v-if="resolveError"
      class="border-t border-border/40 px-3.5 py-2 text-body text-muted-foreground"
    >
      {{ t('workspace.search.resolveError') }}
    </p>
  </CommandList>

</template>
