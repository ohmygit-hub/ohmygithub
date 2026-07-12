<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Spinner,
} from '@oh-my-github/ui'
import { useAssignableUsersQuery } from '@/composables/github/use-issues'
import {
  mergeMentionCandidates,
  type MentionCandidate,
} from './mention-query'

const props = defineProps<{
  open: boolean
  query: string
  owner?: string | null
  repo?: string | null
  top: number
  left: number
  activeIndex: number
}>()

const emit = defineEmits<{
  (event: 'select', candidate: MentionCandidate): void
  (event: 'update:activeIndex', index: number): void
  (event: 'candidates', candidates: MentionCandidate[]): void
}>()

const SEARCH_DEBOUNCE_MS = 300
const MAX_SUGGESTIONS = 8

const { t } = useI18n()

const remote = ref<MentionCandidate[]>([])
const isSearching = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null
let searchSequence = 0

const hasRepo = computed(() => Boolean(props.owner && props.repo))
const assignableQuery = useAssignableUsersQuery(
  () => props.owner ?? '',
  () => props.repo ?? '',
  () => props.open && hasRepo.value,
)

const localCandidates = computed<MentionCandidate[]>(() =>
  (assignableQuery.data.value ?? []).map((actor) => ({
    login: actor.login,
    avatarUrl: actor.avatarUrl,
  })),
)

const candidates = computed(() =>
  mergeMentionCandidates(
    localCandidates.value,
    remote.value,
    props.query,
    MAX_SUGGESTIONS,
  ),
)

const isLoading = computed(() =>
  (props.open && hasRepo.value && assignableQuery.isLoading.value)
  || isSearching.value,
)

watch(candidates, (next) => {
  emit('candidates', next)
  if (next.length === 0) {
    emit('update:activeIndex', 0)
    return
  }
  if (props.activeIndex >= next.length) {
    emit('update:activeIndex', next.length - 1)
  }
})

watch(
  () => [props.open, props.query] as const,
  ([open, query]) => {
    if (!open) {
      clearRemote()
      return
    }
    scheduleRemoteSearch(query)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearSearchTimer()
})

function scheduleRemoteSearch(query: string): void {
  clearSearchTimer()

  const trimmed = query.trim()
  if (trimmed.length < 2) {
    remote.value = []
    isSearching.value = false
    return
  }

  searchTimer = setTimeout(() => {
    searchTimer = null
    void runRemoteSearch(trimmed)
  }, SEARCH_DEBOUNCE_MS)
}

async function runRemoteSearch(query: string): Promise<void> {
  if (!window.ohMyGithub?.search) return

  const sequence = ++searchSequence
  isSearching.value = true

  try {
    const result = await window.ohMyGithub.search.searchWorkspace({
      mode: 'users',
      query,
      page: 1,
      perPage: MAX_SUGGESTIONS,
    })
    if (sequence !== searchSequence) return

    remote.value = result.items.map((item) => ({
      login: item.title,
      avatarUrl: item.avatarUrl,
    }))
  } catch {
    if (sequence !== searchSequence) return
    remote.value = []
  } finally {
    if (sequence === searchSequence) {
      isSearching.value = false
    }
  }
}

function clearRemote(): void {
  clearSearchTimer()
  searchSequence += 1
  remote.value = []
  isSearching.value = false
}

function clearSearchTimer(): void {
  if (!searchTimer) return
  clearTimeout(searchTimer)
  searchTimer = null
}

function fallbackInitials(login: string): string {
  return login.slice(0, 2).toUpperCase()
}
</script>

<template>
  <div
    v-if="open"
    class="absolute z-50 w-64 overflow-hidden rounded-[var(--radius-menu-shell)] border border-border bg-popover text-popover-foreground shadow-[var(--shadow-dropdown)]"
    :style="{ top: `${top}px`, left: `${left}px` }"
  >
    <!-- The listbox role lives on the options container so it only exists
         while it holds role="option" children; loading/empty are status text. -->
    <div
      v-if="candidates.length > 0"
      class="max-h-64 overflow-auto py-1"
      role="listbox"
      :aria-label="t('conversation.mention.label')"
    >
      <button
        v-for="(candidate, index) in candidates"
        :key="candidate.login"
        class="flex w-full select-none items-center gap-2 px-2.5 py-1.5 text-left text-body outline-none"
        :class="index === activeIndex ? 'bg-[color:var(--ui-selected)]' : 'hover:bg-[color:var(--ui-hover)]'"
        role="option"
        type="button"
        :aria-selected="index === activeIndex"
        @mousedown.prevent="emit('select', candidate)"
        @mouseenter="emit('update:activeIndex', index)"
      >
        <Avatar class="size-5 shrink-0">
          <AvatarImage
            :alt="candidate.login"
            :src="candidate.avatarUrl ?? ''"
          />
          <AvatarFallback class="text-caption">
            {{ fallbackInitials(candidate.login) }}
          </AvatarFallback>
        </Avatar>
        <span class="min-w-0 truncate">{{ candidate.login }}</span>
      </button>
    </div>

    <p
      v-else-if="isLoading"
      class="flex items-center gap-2 px-3 py-2.5 text-body text-muted-foreground"
      role="status"
    >
      <Spinner class="size-3.5" />
      {{ t('conversation.mention.searching') }}
    </p>

    <p
      v-else
      class="px-3 py-2.5 text-body text-muted-foreground"
      role="status"
    >
      {{ t('conversation.mention.empty') }}
    </p>
  </div>
</template>
