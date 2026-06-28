<script setup lang="ts">
import type { WorkItemLabelInput } from './types'
import { computed } from 'vue'
import { Badge } from '@oh-my-github/ui'

const props = defineProps<{
  labels: WorkItemLabelInput[]
  emptyLabel?: string
}>()

const visibleLabels = computed(() =>
  props.labels
    .map((label, index) => ({
      id: labelKey(label, index),
      name: labelName(label),
    }))
    .filter((label) => label.name.length > 0)
)

function labelName(label: WorkItemLabelInput): string {
  return typeof label === 'string' ? label.trim() : label.name.trim()
}

function labelKey(label: WorkItemLabelInput, index: number): string {
  if (typeof label === 'string') return `${label}-${index}`

  return String(label.id ?? `${label.name}-${index}`)
}
</script>

<template>
  <div
    v-if="visibleLabels.length > 0"
    class="flex min-w-0 flex-wrap items-center gap-1.5"
  >
    <Badge
      v-for="label in visibleLabels"
      :key="label.id"
      class="max-w-full"
      size="sm"
      variant="secondary"
    >
      <span class="truncate">{{ label.name }}</span>
    </Badge>
  </div>
  <p
    v-else-if="emptyLabel"
    class="text-body text-muted-foreground"
  >
    {{ emptyLabel }}
  </p>
</template>
