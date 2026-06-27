<script setup lang="ts">
import type { WorkspaceMessageParams, WorkspaceTab } from '../types'
import { useI18n } from 'vue-i18n'
import { Badge } from '@oh-my-github/ui'

const props = defineProps<{
  tab: WorkspaceTab
}>()

const { t } = useI18n()

function translate(key: string, params?: WorkspaceMessageParams): string {
  return t(key, params ?? {})
}
</script>

<template>
  <section class="min-h-full bg-background">
    <div class="mx-auto grid w-full max-w-4xl gap-5 px-6 py-6">
      <div class="grid max-w-3xl gap-2">
        <Badge
          class="justify-self-start"
          variant="secondary"
        >
          <component :is="props.tab.icon" />
          {{ translate(props.tab.eyebrowKey) }}
        </Badge>
        <h1 class="truncate text-heading font-semibold text-foreground">
          {{ translate(props.tab.headingKey, props.tab.titleParams) }}
        </h1>
        <p class="max-w-2xl text-label text-muted-foreground">
          {{ translate(props.tab.descriptionKey) }}
        </p>
      </div>

      <div class="grid gap-2 sm:grid-cols-3">
        <div
          v-for="stat in props.tab.stats"
          :key="stat.id"
          class="grid gap-1 rounded-lg border border-border bg-card p-3"
        >
          <div class="text-body font-medium text-muted-foreground">
            {{ translate(stat.labelKey) }}
          </div>
          <div class="truncate text-control font-semibold text-foreground">
            {{ translate(stat.valueKey) }}
          </div>
        </div>
      </div>

      <div class="grid gap-2">
        <div
          v-for="block in props.tab.blocks"
          :key="block.id"
          class="grid gap-1 rounded-lg border border-border bg-card p-3"
        >
          <div class="flex min-w-0 items-center gap-2">
            <div class="min-w-0 flex-1 truncate text-label font-medium text-foreground">
              {{ translate(block.titleKey) }}
            </div>
            <div class="shrink-0 text-body text-muted-foreground">
              {{ translate(block.metaKey) }}
            </div>
          </div>
          <p class="text-body text-muted-foreground">
            {{ translate(block.descriptionKey) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
