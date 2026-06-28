<script setup lang="ts">
import { AlertTriangle, ExternalLink, Globe } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { Skeleton } from '@oh-my-github/ui'
import type { RepositoryOverviewInfoItem } from '../types'
import OverviewInfoGrid from './overview-info-grid.vue'

defineProps<{
  hasOverviewError: boolean
  isOverviewLoading: boolean
  missingScopesText: string
  overview: GitHubRepositoryOverview | null
  overviewDescription: string
  overviewInfoItems: RepositoryOverviewInfoItem[]
}>()

const { t } = useI18n()
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-border bg-card">
    <div class="grid gap-4 p-4">
      <div class="flex min-w-0 items-center justify-between gap-3">
        <h2 class="truncate text-label font-medium text-foreground">
          {{ t('repository.overview.title') }}
        </h2>
        <a
          v-if="overview?.url"
          class="inline-flex shrink-0 items-center gap-1 text-body text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          :href="overview.url"
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink class="size-3.5" />
          {{ t('repository.overview.openOnGitHub') }}
        </a>
      </div>

      <div
        v-if="isOverviewLoading && !overview"
        class="grid gap-4 rounded-lg border border-border p-4"
      >
        <div class="grid gap-2">
          <Skeleton class="h-4 w-4/5 rounded-md" />
          <Skeleton class="h-4 w-3/5 rounded-md" />
        </div>
        <div class="flex gap-2">
          <Skeleton class="h-6 w-20 rounded-full" />
          <Skeleton class="h-6 w-24 rounded-full" />
          <Skeleton class="h-6 w-16 rounded-full" />
        </div>
        <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="index in 9"
            :key="index"
            class="flex items-center gap-2 rounded-lg border border-border p-3"
          >
            <Skeleton class="size-4 rounded-md" />
            <div class="grid min-w-0 flex-1 gap-1.5">
              <Skeleton class="h-3 w-20 rounded-md" />
              <Skeleton class="h-4 w-28 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="hasOverviewError && !overview"
        class="rounded-lg border border-dashed border-border p-4 text-body text-muted-foreground"
      >
        {{ t('repository.overview.error') }}
      </div>

      <template v-else-if="overview">
        <div
          v-if="overview.missingScopes.length > 0"
          class="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-body text-foreground"
        >
          <AlertTriangle class="mt-0.5 size-4 shrink-0 text-warning" />
          <div class="grid gap-1">
            <div class="font-medium">
              {{ t('repository.overview.missingScopes.title') }}
            </div>
            <p class="text-muted-foreground">
              {{ t('repository.overview.missingScopes.description', { scopes: missingScopesText }) }}
            </p>
          </div>
        </div>

        <div class="grid gap-3">
          <p
            class="text-control leading-relaxed"
            :class="overview.description ? 'text-foreground' : 'text-muted-foreground'"
          >
            {{ overviewDescription }}
          </p>

          <a
            v-if="overview.homepageUrl"
            class="inline-flex min-w-0 items-center gap-2 justify-self-start text-body font-medium text-primary underline-offset-4 hover:underline"
            :href="overview.homepageUrl"
            target="_blank"
            rel="noreferrer"
          >
            <Globe class="size-4 shrink-0" />
            <span class="truncate">{{ overview.homepageUrl }}</span>
          </a>

          <div
            v-if="overview.topics.length > 0"
            class="flex flex-wrap gap-1.5"
          >
            <span
              v-for="topic in overview.topics"
              :key="topic"
              class="rounded-full bg-muted px-2 py-1 text-body font-medium text-muted-foreground"
            >
              {{ topic }}
            </span>
          </div>
        </div>

        <div class="h-px bg-border" />

        <OverviewInfoGrid :items="overviewInfoItems" />

        <div
          v-if="overview.customProperties.length > 0"
          class="grid gap-2 rounded-lg border border-border p-3"
        >
          <div class="text-body font-medium text-muted-foreground">
            {{ t('repository.overview.customProperties') }}
          </div>
          <div class="grid gap-1 sm:grid-cols-2">
            <div
              v-for="property in overview.customProperties"
              :key="property.name"
              class="min-w-0 text-body"
            >
              <span class="text-muted-foreground">{{ property.name }}:</span>
              <span class="ml-1 text-foreground">{{ property.value }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
