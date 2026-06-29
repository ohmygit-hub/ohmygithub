<script setup lang="ts">
import type { Component } from 'vue'

export interface SectionSidebarItem {
  id: string
  label: string
  icon: Component
  disabled?: boolean
}

defineProps<{
  activeId: string
  items: readonly SectionSidebarItem[]
  navigationLabel: string
}>()

const emit = defineEmits<{
  'update:activeId': [value: string]
}>()
</script>

<template>
  <aside class="flex h-full w-56 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
    <slot name="header" />

    <nav
      class="grid gap-1 px-2 py-1.5"
      :aria-label="navigationLabel"
    >
      <button
        v-for="item in items"
        :key="item.id"
        :class="[
          'grid h-9 w-full grid-cols-[0.25rem_1rem_minmax(0,1fr)] items-center gap-x-1 rounded-lg pr-2 text-left text-body font-normal outline-hidden transition-colors hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50',
          activeId === item.id ? 'text-foreground' : 'text-muted-foreground',
        ]"
        :aria-current="activeId === item.id ? 'page' : undefined"
        :disabled="item.disabled"
        type="button"
        @click="emit('update:activeId', item.id)"
      >
        <span
          class="h-4 w-0.5 justify-self-center rounded-full"
          :class="activeId === item.id ? 'bg-muted-foreground' : 'bg-transparent'"
        />
        <component
          :is="item.icon"
          class="size-3.5 justify-self-center"
          :stroke-width="1.75"
        />
        <span class="ml-1 truncate select-none">{{ item.label }}</span>
      </button>
    </nav>
  </aside>
</template>
