<script setup lang="ts">
import type { RepositoryOverviewInfoItem } from '../types'

defineProps<{
  items: RepositoryOverviewInfoItem[]
}>()
</script>

<template>
  <div class="grid overflow-hidden rounded-lg border border-border sm:grid-cols-2 xl:grid-cols-3">
    <div
      v-for="item in items"
      :key="item.id"
      class="flex min-w-0 items-start gap-2 border-b border-r border-border p-3 last:border-b-0 sm:[&:nth-child(2n)]:border-r-0 xl:[&:nth-child(2n)]:border-r xl:[&:nth-child(3n)]:border-r-0"
    >
      <component
        :is="item.icon"
        class="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <div class="grid min-w-0 gap-1">
        <div class="truncate text-body text-muted-foreground">
          {{ item.label }}
        </div>
        <a
          v-if="item.href"
          class="truncate text-body font-medium text-primary underline-offset-4 hover:underline"
          :href="item.href"
          target="_blank"
          rel="noreferrer"
        >
          {{ item.value }}
        </a>
        <div
          v-else
          class="truncate text-body font-medium text-foreground"
        >
          {{ item.value }}
        </div>
      </div>
    </div>
  </div>
</template>
