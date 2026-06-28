<script setup lang="ts">
import type { ConversationTimelineItem } from './types'
import { computed, useSlots } from 'vue'
import { Skeleton } from '@oh-my-github/ui'

const props = defineProps<{
  items?: ConversationTimelineItem[]
  isLoading?: boolean
  emptyLabel?: string
}>()

const slots = useSlots()
const timelineItems = computed(() => props.items ?? [])
const shouldShowEmpty = computed(() => {
  if (props.isLoading || !props.emptyLabel) return false
  if (!slots.default) return timelineItems.value.length === 0

  return props.items !== undefined && timelineItems.value.length === 0
})
const shouldRenderSlot = computed(() => !props.isLoading && !shouldShowEmpty.value && Boolean(slots.default))
</script>

<template>
  <section
    class="relative min-w-0"
    :aria-busy="isLoading ? 'true' : undefined"
  >
    <div
      class="absolute bottom-0 left-7 top-4 w-px bg-border"
      aria-hidden="true"
    />

    <div class="relative grid min-w-0 gap-3">
      <template v-if="isLoading">
        <div
          v-for="index in 3"
          :key="index"
          class="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-3 px-3"
        >
          <div class="flex justify-center pt-0.5">
            <Skeleton class="size-8 rounded-full" />
          </div>
          <div class="grid gap-2 rounded-lg border border-border bg-card p-3">
            <Skeleton class="h-4 w-40 max-w-full" />
            <Skeleton class="h-3 w-full" />
            <Skeleton class="h-3 w-2/3" />
          </div>
        </div>
      </template>

      <slot
        v-else-if="shouldRenderSlot"
        :items="timelineItems"
      />

      <div
        v-else-if="shouldShowEmpty"
        class="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-3 px-3"
      >
        <div class="flex justify-center pt-0.5">
          <span class="flex size-8 items-center justify-center rounded-full border border-dashed border-border bg-background" />
        </div>
        <p class="min-w-0 py-1.5 text-body text-muted-foreground">
          {{ emptyLabel }}
        </p>
      </div>
    </div>
  </section>
</template>
