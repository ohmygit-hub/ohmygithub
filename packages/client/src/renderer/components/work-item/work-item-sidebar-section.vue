<script setup lang="ts">
defineProps<{
  title: string
  emptyLabel?: string
}>()
</script>

<template>
  <section class="grid min-w-0 gap-2 border-b border-border py-3 last:border-b-0">
    <header class="flex min-w-0 items-center justify-between gap-2">
      <h2 class="min-w-0 truncate text-label font-medium text-foreground">
        {{ title }}
      </h2>

      <div
        v-if="$slots.action"
        class="flex shrink-0 items-center gap-1"
      >
        <slot name="action" />
      </div>
    </header>

    <div
      v-if="$slots.default"
      class="min-w-0"
    >
      <slot />
    </div>
    <p
      v-else-if="emptyLabel"
      class="text-body text-muted-foreground"
    >
      {{ emptyLabel }}
    </p>
  </section>
</template>
