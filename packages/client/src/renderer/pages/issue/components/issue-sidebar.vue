<script setup lang="ts">
import type {
  IssueActorSummary,
  IssueDetail,
  IssueLabelSummary,
} from './types'
import type { Component } from 'vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@oh-my-github/ui'
import { CalendarDays, GitBranch, GitCommitHorizontal, GitPullRequest } from 'lucide-vue-next'
import { WorkItemLabelList, WorkItemSidebarSection } from '../../../components'

const props = defineProps<{
  issue: IssueDetail
}>()

interface DevelopmentItem {
  id: string
  icon: Component
  label: string
  value: string
}

const { t } = useI18n()

const assignees = computed(() => props.issue.assignees ?? [])
const labels = computed(() => normalizeLabels(props.issue.labels))
const labelNames = computed(() => labels.value.map((label) => label.name))
const participants = computed(() => props.issue.participants ?? [])
const linkedPullRequests = computed(() =>
  props.issue.development?.pullRequests ?? props.issue.linkedWork ?? []
)
const developmentItems = computed<DevelopmentItem[]>(() => {
  const branches = props.issue.development?.branches
  const commits = props.issue.development?.commits
  const items: DevelopmentItem[] = []

  if (linkedPullRequests.value.length > 0) {
    items.push({
      id: 'pullRequests',
      icon: GitPullRequest,
      label: t('issue.sidebar.development.pullRequests'),
      value: formatCount(linkedPullRequests.value.length),
    })
  }

  if (isLinkedCount(branches)) {
    items.push({
      id: 'branches',
      icon: GitBranch,
      label: t('issue.sidebar.development.branches'),
      value: formatCount(branches),
    })
  }

  if (isLinkedCount(commits)) {
    items.push({
      id: 'commits',
      icon: GitCommitHorizontal,
      label: t('issue.sidebar.development.commits'),
      value: formatCount(commits),
    })
  }

  return items
})
const shouldShowDevelopment = computed(() => developmentItems.value.length > 0)
const dates = computed(() => [
  {
    id: 'created',
    label: t('issue.sidebar.dates.created'),
    value: formatDate(props.issue.createdAt),
  },
  {
    id: 'updated',
    label: t('issue.sidebar.dates.updated'),
    value: formatDate(props.issue.updatedAt),
  },
  props.issue.closedAt
    ? {
        id: 'closed',
        label: t('issue.sidebar.dates.closed'),
        value: formatDate(props.issue.closedAt),
      }
    : null,
].filter(isDateItem))

function actorFallback(actor: IssueActorSummary): string {
  return actor.login.slice(0, 2).toUpperCase()
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

function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value)
}

function isLinkedCount(value: number | null | undefined): value is number {
  return typeof value === 'number' && value > 0
}

function normalizeLabels(labels: Array<IssueLabelSummary | string>): IssueLabelSummary[] {
  return labels.map((label) => {
    if (typeof label === 'string') {
      return {
        id: label,
        name: label,
      }
    }

    return label
  })
}

function isDateItem(
  value: { id: string, label: string, value: string } | null,
): value is { id: string, label: string, value: string } {
  return value !== null
}

</script>

<template>
  <aside class="grid">
    <WorkItemSidebarSection :title="t('issue.sidebar.sections.assignees')">
      <div
        v-if="assignees.length > 0"
        class="grid gap-2"
      >
        <div
          v-for="assignee in assignees"
          :key="assignee.login"
          class="flex min-w-0 items-center gap-2 text-body text-foreground"
        >
          <Avatar class="size-5">
            <AvatarImage
              v-if="assignee.avatarUrl"
              :alt="assignee.login"
              :src="assignee.avatarUrl"
            />
            <AvatarFallback class="text-[10px]">
              {{ actorFallback(assignee) }}
            </AvatarFallback>
          </Avatar>
          <span class="truncate">{{ assignee.login }}</span>
        </div>
      </div>
      <p
        v-else
        class="text-body text-muted-foreground"
      >
        {{ t('issue.sidebar.empty.assignees') }}
      </p>
    </WorkItemSidebarSection>

    <WorkItemSidebarSection :title="t('issue.sidebar.sections.labels')">
      <WorkItemLabelList
        :empty-label="t('issue.sidebar.empty.labels')"
        :labels="labelNames"
      />
    </WorkItemSidebarSection>

    <WorkItemSidebarSection :title="t('issue.sidebar.sections.milestone')">
      <div
        v-if="issue.milestone"
        class="grid gap-1 text-body"
      >
        <a
          v-if="issue.milestone.url"
          class="truncate font-medium text-foreground underline-offset-4 outline-hidden hover:underline focus-visible:underline"
          :href="issue.milestone.url"
          rel="noreferrer"
          target="_blank"
        >
          {{ issue.milestone.title }}
        </a>
        <span
          v-else
          class="truncate font-medium text-foreground"
        >
          {{ issue.milestone.title }}
        </span>
        <span
          v-if="issue.milestone.dueOn"
          class="text-muted-foreground"
        >
          {{ t('issue.sidebar.dates.due', { date: formatDate(issue.milestone.dueOn) }) }}
        </span>
      </div>
      <p
        v-else
        class="text-body text-muted-foreground"
      >
        {{ t('issue.sidebar.empty.milestone') }}
      </p>
    </WorkItemSidebarSection>

    <WorkItemSidebarSection :title="t('issue.sidebar.sections.dates')">
      <div class="grid gap-2.5">
        <div
          v-for="date in dates"
          :key="date.id"
          class="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-2 text-body"
        >
          <CalendarDays class="mt-0.5 size-3.5 text-muted-foreground" />
          <div class="min-w-0">
            <div class="truncate text-muted-foreground">
              {{ date.label }}
            </div>
            <div class="truncate font-medium text-foreground">
              {{ date.value }}
            </div>
          </div>
        </div>
      </div>
    </WorkItemSidebarSection>

    <WorkItemSidebarSection :title="t('issue.sidebar.sections.participants')">
      <div
        v-if="participants.length > 0"
        class="flex min-w-0 flex-wrap gap-2"
      >
        <Avatar
          v-for="participant in participants"
          :key="participant.login"
          class="size-6"
          :title="participant.login"
        >
          <AvatarImage
            v-if="participant.avatarUrl"
            :alt="participant.login"
            :src="participant.avatarUrl"
          />
          <AvatarFallback class="text-[10px]">
            {{ actorFallback(participant) }}
          </AvatarFallback>
        </Avatar>
      </div>
      <p
        v-else
        class="text-body text-muted-foreground"
      >
        {{ t('issue.sidebar.empty.participants') }}
      </p>
    </WorkItemSidebarSection>

    <WorkItemSidebarSection
      v-if="shouldShowDevelopment"
      :title="t('issue.sidebar.sections.development')"
    >
      <div class="grid gap-2.5">
        <div
          v-for="item in developmentItems"
          :key="item.id"
          class="flex min-w-0 items-center justify-between gap-3 text-body"
        >
          <span class="inline-flex min-w-0 items-center gap-2 text-muted-foreground">
            <component
              :is="item.icon"
              class="size-3.5 shrink-0"
            />
            <span class="truncate">{{ item.label }}</span>
          </span>
          <span class="shrink-0 font-medium tabular-nums text-foreground">{{ item.value }}</span>
        </div>
      </div>
    </WorkItemSidebarSection>
  </aside>
</template>
