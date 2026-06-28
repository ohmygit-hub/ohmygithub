<script setup lang="ts">
import type { IssueDetail } from './types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@oh-my-github/ui'
import { Copy, ExternalLink, MoreHorizontal } from 'lucide-vue-next'
import { WorkItemStateBadge } from '../../../components'

const props = defineProps<{
  issue: IssueDetail
  repository: string
}>()

const { t } = useI18n()

const issueNumber = computed(() => `#${props.issue.number}`)
const createdAt = computed(() => formatDate(props.issue.createdAt))
const updatedAt = computed(() => formatDate(props.issue.updatedAt))
const stateLabel = computed(() => {
  const state = normalizeState(props.issue.state)

  return t(`issue.states.${state}`)
})
const authorLogin = computed(() => props.issue.author.login)
const createdMeta = computed(() =>
  t('issue.meta.createdBy', {
    author: authorLogin.value,
    date: createdAt.value,
  })
)
const updatedMeta = computed(() =>
  t('issue.meta.updated', {
    date: updatedAt.value,
  })
)

async function copyIssueUrl(): Promise<void> {
  if (!props.issue.url || !navigator.clipboard) return

  await navigator.clipboard.writeText(props.issue.url)
}

function formatDate(value: string | null | undefined): string {
  if (!value) return t('issue.values.unknown')

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return t('issue.values.unknown')

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function normalizeState(state: string): 'open' | 'completed' | 'not_planned' | 'unknown' {
  if (state === 'open' || state === 'completed' || state === 'not_planned') return state

  return 'unknown'
}
</script>

<template>
  <header class="grid gap-3 border-b border-border pb-4">
    <div class="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div class="grid min-w-0 gap-2">
        <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <WorkItemStateBadge
            :label="stateLabel"
            :state="issue.state"
          />
          <span class="truncate text-body text-muted-foreground">
            {{ repository }} {{ issueNumber }}
          </span>
        </div>

        <h1 class="min-w-0 text-heading font-semibold leading-tight text-foreground">
          {{ issue.title }}
        </h1>
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <Button
          v-if="issue.url"
          as="a"
          :href="issue.url"
          rel="noreferrer"
          size="sm"
          target="_blank"
          type="button"
          variant="outline"
        >
          <ExternalLink class="size-3.5" />
          <span>{{ t('issue.actions.openOnGitHub') }}</span>
        </Button>

        <DropdownMenu v-if="issue.url">
          <DropdownMenuTrigger as-child>
            <Button
              :aria-label="t('issue.actions.more')"
              class="size-8 text-muted-foreground"
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <MoreHorizontal class="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @select="copyIssueUrl">
              <Copy class="size-3.5" />
              <span>{{ t('issue.actions.copyUrl') }}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-body text-muted-foreground">
      <span class="truncate">{{ createdMeta }}</span>
      <span aria-hidden="true">·</span>
      <span class="truncate">{{ updatedMeta }}</span>
    </div>
  </header>
</template>
