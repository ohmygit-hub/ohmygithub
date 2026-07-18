<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { usePullRequestReviewThreadsQuery } from '@/composables/github/use-pull-requests'
import { useReviewSelection } from '@/composables/use-review-selection'
import ReviewDiff, { type ReviewDiffMarker } from './review-diff.vue'
import type { ReviewDiffRange } from './review-diff-selection'

const props = defineProps<{
  owner: string
  repo: string
  number: number
  path: string
  patch: string
}>()

const threadsQuery = usePullRequestReviewThreadsQuery(
  () => props.owner,
  () => props.repo,
  () => props.number,
  () => true,
)

const { selection, setSelection, clearSelection, locateThread } = useReviewSelection()

// Outdated threads report line: null and cannot be anchored in the current diff.
const markers = computed<ReviewDiffMarker[]>(() => {
  const threads = threadsQuery.data.value?.threads ?? []

  return threads.flatMap((thread) => {
    if (thread.path !== props.path || thread.line === null) return []

    return [{
      threadId: thread.id,
      side: thread.side,
      line: thread.line,
      count: thread.comments.length,
      isResolved: thread.isResolved,
      isPending: thread.isPending,
    }]
  })
})

const activeSelection = computed<ReviewDiffRange | null>(() => {
  const value = selection.value
  if (!value) return null
  if (
    value.owner !== props.owner
    || value.repo !== props.repo
    || value.number !== props.number
    || value.path !== props.path
  ) return null

  return { side: value.side, startLine: value.startLine, line: value.line }
})

function onSelect(range: ReviewDiffRange): void {
  setSelection({
    owner: props.owner,
    repo: props.repo,
    number: props.number,
    path: props.path,
    side: range.side,
    startLine: range.startLine,
    line: range.line,
  })
}

watch(
  () => [props.owner, props.repo, props.number, props.path] as const,
  () => {
    clearSelection()
  },
)

onBeforeUnmount(() => {
  clearSelection()
})
</script>

<template>
  <div class="min-h-full overflow-x-auto py-2">
    <ReviewDiff
      class="w-max min-w-full"
      :filename="props.path"
      :markers="markers"
      :patch="props.patch"
      :selection="activeSelection"
      @locate-thread="locateThread"
      @select="onSelect"
    />
  </div>
</template>
