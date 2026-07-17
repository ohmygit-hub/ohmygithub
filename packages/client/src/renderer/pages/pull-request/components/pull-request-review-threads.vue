<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from '@oh-my-github/ui'
import { AlertCircle } from 'lucide-vue-next'
import { useReviewSelection } from '@/composables/use-review-selection'
import PullRequestReviewThreadCard from './pull-request-review-thread-card.vue'

const props = defineProps<{
  owner: string
  repo: string
  number: number
  threads: GitHubPullRequestReviewThread[]
  isLoading: boolean
  hasError: boolean
}>()

const emit = defineEmits<{
  retry: []
  changed: []
}>()

const { t } = useI18n()
const { locatedThreadId, clearLocatedThread } = useReviewSelection()

const groups = computed(() => {
  const byPath = new Map<string, GitHubPullRequestReviewThread[]>()
  for (const thread of props.threads) {
    const list = byPath.get(thread.path) ?? []
    list.push(thread)
    byPath.set(thread.path, list)
  }
  return [...byPath.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, threads]) => ({ path, threads }))
})

const highlightedThreadId = ref<string | null>(null)
let highlightTimer: ReturnType<typeof setTimeout> | null = null

watch(
  locatedThreadId,
  async (threadId) => {
    if (!threadId) return
    await nextTick()
    const element = document.querySelector(`[data-thread-id="${threadId}"]`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightedThreadId.value = threadId
    if (highlightTimer) clearTimeout(highlightTimer)
    highlightTimer = setTimeout(() => {
      highlightedThreadId.value = null
    }, 1600)
    clearLocatedThread()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (highlightTimer) clearTimeout(highlightTimer)
})
</script>

<template>
  <!-- A secondary, conditional section: it vanishes entirely when there are no threads. -->
  <section
    v-if="isLoading || hasError || threads.length > 0"
    class="grid gap-2"
  >
    <h2 class="select-none text-title font-medium text-foreground">
      {{ t('pullRequest.review.threads.title') }}
    </h2>

    <div
      v-if="isLoading"
      class="grid gap-2"
    >
      <Skeleton
        v-for="index in 3"
        :key="index"
        class="h-20 rounded-xl"
      />
    </div>

    <Empty
      v-else-if="hasError"
      class="border border-border bg-card"
    >
      <EmptyHeader>
        <EmptyMedia>
          <AlertCircle class="size-5" />
        </EmptyMedia>
        <EmptyTitle>{{ t('pullRequest.review.threads.errorTitle') }}</EmptyTitle>
        <EmptyDescription>{{ t('pullRequest.review.threads.errorDescription') }}</EmptyDescription>
        <Button
          class="justify-self-center"
          size="sm"
          type="button"
          variant="outline"
          @click="emit('retry')"
        >
          {{ t('pullRequest.review.retry') }}
        </Button>
      </EmptyHeader>
    </Empty>

    <div
      v-else
      class="grid gap-4"
    >
      <div
        v-for="group in groups"
        :key="group.path"
        class="grid gap-2"
      >
        <h3 class="select-none truncate font-mono text-body text-muted-foreground">
          {{ group.path }}
        </h3>
        <PullRequestReviewThreadCard
          v-for="thread in group.threads"
          :key="thread.id"
          :highlighted="highlightedThreadId === thread.id"
          :number="number"
          :owner="owner"
          :repo="repo"
          :thread="thread"
          @changed="emit('changed')"
        />
      </div>
    </div>
  </section>
</template>
