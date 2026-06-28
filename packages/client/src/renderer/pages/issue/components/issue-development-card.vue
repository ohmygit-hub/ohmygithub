<script setup lang="ts">
import type { IssueDevelopmentSummary, IssueLinkedWorkSummary } from './types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge } from '@oh-my-github/ui'
import { GitBranch, GitCommitHorizontal, GitPullRequest, Link2 } from 'lucide-vue-next'

const props = defineProps<{
  development?: IssueDevelopmentSummary | null
  linkedWork?: IssueLinkedWorkSummary[]
}>()

const { t } = useI18n()

const linkedPullRequests = computed(() => props.development?.pullRequests ?? props.linkedWork ?? [])
const summaryItems = computed(() => [
  {
    id: 'pullRequests',
    icon: GitPullRequest,
    label: t('issue.development.summary.pullRequests'),
    value: formatCount(linkedPullRequests.value.length),
  },
  {
    id: 'branches',
    icon: GitBranch,
    label: t('issue.development.summary.branches'),
    value: formatNullableCount(props.development?.branches),
  },
  {
    id: 'commits',
    icon: GitCommitHorizontal,
    label: t('issue.development.summary.commits'),
    value: formatNullableCount(props.development?.commits),
  },
])
const hasLinkedWork = computed(() => linkedPullRequests.value.length > 0)

function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value)
}

function formatNullableCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return t('issue.values.notAvailable')

  return formatCount(value)
}
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-border bg-card">
    <header class="flex min-w-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
      <div class="min-w-0">
        <h2 class="truncate text-control font-semibold text-foreground">
          {{ t('issue.development.title') }}
        </h2>
        <p class="truncate text-body text-muted-foreground">
          {{ t('issue.development.description') }}
        </p>
      </div>
      <Badge
        class="shrink-0"
        size="sm"
        variant="secondary"
      >
        {{ t('issue.development.readOnly') }}
      </Badge>
    </header>

    <div class="grid gap-3 p-4">
      <div class="grid gap-2 sm:grid-cols-3">
        <div
          v-for="item in summaryItems"
          :key="item.id"
          class="grid min-w-0 grid-cols-[1rem_minmax(0,1fr)] gap-x-2 rounded-md border border-border bg-background/60 p-2.5"
        >
          <component
            :is="item.icon"
            class="mt-0.5 size-3.5 text-muted-foreground"
          />
          <div class="min-w-0">
            <div class="truncate text-caption text-muted-foreground">
              {{ item.label }}
            </div>
            <div class="truncate text-control font-semibold text-foreground">
              {{ item.value }}
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="hasLinkedWork"
        class="divide-y divide-border rounded-md border border-border"
      >
        <a
          v-for="work in linkedPullRequests"
          :key="work.id"
          class="grid min-w-0 grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-body outline-hidden transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/30"
          :href="work.url ?? undefined"
          rel="noreferrer"
          target="_blank"
        >
          <GitPullRequest class="size-3.5 text-muted-foreground" />
          <span class="truncate text-foreground">{{ work.title }}</span>
          <span
            v-if="work.number"
            class="shrink-0 text-muted-foreground"
          >
            #{{ work.number }}
          </span>
        </a>
      </div>

      <div
        v-else
        class="flex min-w-0 items-start gap-2 rounded-md border border-dashed border-border bg-background/60 p-3 text-body text-muted-foreground"
      >
        <Link2 class="mt-0.5 size-4 shrink-0" />
        <p>{{ t('issue.development.empty') }}</p>
      </div>
    </div>
  </section>
</template>
