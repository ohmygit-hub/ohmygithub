<script setup lang="ts">
import type { WorkspaceTab } from '@/pages/workspace/types'
import type { ActivityFilterKey } from './activity-helpers'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge, Button, Empty, EmptyDescription, EmptyHeader, EmptyTitle, ScrollArea, Skeleton } from '@oh-my-github/ui'
import { Activity as ActivityIcon } from 'lucide-vue-next'
import { fetchActivityFeedPage, fetchActivityPushCounts, fetchActivityRepoCards, useActivityFeedQuery } from '@/composables/github/use-activity'
import { useToast } from '@/composables/use-toast'
import {
  ACTIVITY_FILTER_KEYS,
  collectPushCountRefs,
  collectRepoCardNames,
  groupFeedEvents,
  matchesActivityFilter,
  mergeFeedEvents,
} from './activity-helpers'
import ActivityEventRow from './components/activity-event-row.vue'
import ActivityGroupRow from './components/activity-group-row.vue'

defineProps<{
  tab: WorkspaceTab
}>()

const { t } = useI18n()
const { error: toastError } = useToast()

const filter = ref<ActivityFilterKey | null>(null)
const extraPages = ref<GitHubFeedEventPage[]>([])
const isLoadingMore = ref(false)

const feedQuery = useActivityFeedQuery()
const isLoading = computed(() => feedQuery.isLoading.value)
const hasError = computed(() => Boolean(feedQuery.error.value))

const events = computed(() => mergeFeedEvents([
  feedQuery.data.value?.events ?? [],
  ...extraPages.value.map((page) => page.events),
]))
const groups = computed(() =>
  groupFeedEvents(events.value.filter((event) => matchesActivityFilter(event, filter.value))),
)
const hasMore = computed(() => {
  const lastPage = extraPages.value[extraPages.value.length - 1] ?? feedQuery.data.value
  return lastPage?.hasMore ?? false
})

// 仓库卡数据是渐进增强：按需批量补拉，失败静默降级为纯名字卡片
const repoCards = reactive(new Map<string, GitHubFeedRepoCard | null>())
const pendingCardNames = new Set<string>()

watch(events, async (list) => {
  const missing = collectRepoCardNames(list)
    .filter((name) => !repoCards.has(name) && !pendingCardNames.has(name))
  if (missing.length === 0) return

  for (const name of missing) pendingCardNames.add(name)
  try {
    const cards = await fetchActivityRepoCards(missing)
    for (const name of missing) repoCards.set(name, cards[name] ?? null)
  } catch {
    // 保留 pending 之外的状态即可；下次事件列表变化会重试缺失项
  } finally {
    for (const name of missing) pendingCardNames.delete(name)
  }
}, { immediate: true })

// PushEvent payloads no longer carry commit counts; resolve them per push group via the
// compare API as progressive enhancement, mirroring the repo-card enrichment above.
const pushCounts = reactive(new Map<string, number | null>())
const pendingPushKeys = new Set<string>()

watch(groups, async (list) => {
  const missing = collectPushCountRefs(list)
    .filter((ref) => !pushCounts.has(ref.key) && !pendingPushKeys.has(ref.key))
  if (missing.length === 0) return

  for (const ref of missing) pendingPushKeys.add(ref.key)
  try {
    const counts = await fetchActivityPushCounts(missing)
    for (const ref of missing) pushCounts.set(ref.key, counts[ref.key] ?? null)
  } catch {
    // 静默降级：无法解析的推送保持无计数文案，下次分组变化会重试缺失项
  } finally {
    for (const ref of missing) pendingPushKeys.delete(ref.key)
  }
}, { immediate: true })

function toggleFilter(key: ActivityFilterKey): void {
  filter.value = filter.value === key ? null : key
}

function refresh(): void {
  void feedQuery.refetch()
}

async function loadMore(): Promise<void> {
  if (isLoadingMore.value) return

  isLoadingMore.value = true
  const nextPage = (extraPages.value[extraPages.value.length - 1]?.page ?? feedQuery.data.value?.page ?? 1) + 1

  try {
    extraPages.value = [...extraPages.value, await fetchActivityFeedPage(nextPage)]
  } catch {
    toastError(t('workspace.activity.error.title'))
  } finally {
    isLoadingMore.value = false
  }
}
</script>

<template>
  <section class="flex min-h-full flex-col bg-background">
    <header class="border-b border-border px-6 py-4">
      <div class="mx-auto grid w-full max-w-3xl gap-3">
        <h1 class="select-none text-heading font-semibold text-foreground">
          {{ t('workspace.activity.title') }}
        </h1>

        <div class="flex flex-wrap items-center gap-2">
          <Badge
            v-for="key in ACTIVITY_FILTER_KEYS"
            :key="key"
            :variant="filter === key ? 'info' : 'secondary'"
            class="cursor-pointer"
            @click="toggleFilter(key)"
          >
            {{ t(`workspace.activity.filters.${key}`) }}
          </Badge>
        </div>
      </div>
    </header>

    <ScrollArea class="flex-1">
      <div class="mx-auto w-full max-w-3xl px-6 py-4">
        <div
          v-if="isLoading"
          class="grid gap-3"
        >
          <Skeleton
            v-for="index in 6"
            :key="index"
            class="h-24 w-full rounded-lg"
          />
        </div>

        <div
          v-else-if="hasError"
          class="grid place-items-center gap-3 p-10 text-center"
        >
          <p class="text-label text-muted-foreground">{{ t('workspace.activity.error.title') }}</p>
          <Button
            variant="secondary"
            size="sm"
            @click="refresh"
          >
            {{ t('workspace.activity.error.retry') }}
          </Button>
        </div>

        <Empty
          v-else-if="groups.length === 0"
          class="p-10"
        >
          <EmptyHeader>
            <ActivityIcon class="size-6 text-muted-foreground" />
            <EmptyTitle>{{ t('workspace.activity.empty.title') }}</EmptyTitle>
            <EmptyDescription>{{ t('workspace.activity.empty.description') }}</EmptyDescription>
          </EmptyHeader>
        </Empty>

        <div
          v-else
          class="grid gap-3"
        >
          <template
            v-for="group in groups"
            :key="group.id"
          >
            <ActivityEventRow
              v-if="group.kind === 'single'"
              :event="group.events[0]"
              :repo-cards="repoCards"
              :push-counts="pushCounts"
            />
            <ActivityGroupRow
              v-else
              :group="group"
              :repo-cards="repoCards"
              :push-counts="pushCounts"
            />
          </template>

          <div
            v-if="hasMore"
            class="flex justify-center py-1"
          >
            <Button
              variant="secondary"
              size="sm"
              :disabled="isLoadingMore"
              @click="loadMore"
            >
              {{ isLoadingMore ? t('workspace.activity.loadingMore') : t('workspace.activity.loadMore') }}
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  </section>
</template>
