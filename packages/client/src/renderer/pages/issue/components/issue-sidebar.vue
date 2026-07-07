<script setup lang="ts">
import type {
  IssueDetail,
  IssueLabelSummary,
  IssueLinkedWorkSummary,
} from './types'
import type { Component, Ref } from 'vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  CalendarDays,
  CheckCircle2,
  CircleSlash,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  RotateCcw,
} from 'lucide-vue-next'
import { Avatar, AvatarFallback, AvatarImage, Button, Spinner } from '@oh-my-github/ui'
import {
  GitHubActorLink,
  GitHubReferenceLink,
  LabelBadge,
  MultiSelectPicker,
  WorkItemLabelList,
  WorkItemSidebarSection,
  WorkItemStateBadge,
  createGitHubAvatarUrl,
  parseGitHubReferenceUrl,
} from '@/components'
import {
  updateIssue,
  useAssignableUsersQuery,
  useIssueListInvalidation,
  useRepositoryLabelsQuery,
  useRepositoryMilestonesQuery,
} from '@/composables/github/use-issues'

const props = defineProps<{
  issue: IssueDetail
  refetch: () => Promise<unknown>
}>()

interface DevelopmentItem {
  id: string
  icon: Component
  label: string
  value: string
}

interface LinkedPullRequestReference {
  id: string
  owner: string
  repo: string
  number: number
  title: string | null
  state: GitHubRepositoryReferenceState | null
  url: string | null
}

const { t } = useI18n()
const { invalidateIssueLists } = useIssueListInvalidation()

const assignees = computed(() => props.issue.assignees ?? [])
const labels = computed(() => normalizeLabels(props.issue.labels))
const participants = computed(() => props.issue.participants ?? [])
const canCloseIssue = computed(() =>
  props.issue.state === 'open' && props.issue.viewerCanClose
)
const canReopenIssue = computed(() =>
  props.issue.state !== 'open' && props.issue.viewerCanReopen
)
const hasIssueStateAction = computed(() => canCloseIssue.value || canReopenIssue.value)

const assigneePickerOpen = ref(false)
const labelPickerOpen = ref(false)
const isSavingField = ref(false)
const pendingAssigneeIds = ref<string[]>([])
const pendingLabelIds = ref<string[]>([])
const pendingMilestoneIds = ref<string[]>([])

const assignableUsersQuery = useAssignableUsersQuery(
  () => props.issue.owner,
  () => props.issue.repo,
  assigneePickerOpen,
)
const repositoryLabelsQuery = useRepositoryLabelsQuery(
  () => props.issue.owner,
  () => props.issue.repo,
  labelPickerOpen,
)
const repositoryMilestonesQuery = useRepositoryMilestonesQuery(
  () => props.issue.owner,
  () => props.issue.repo,
  () => Boolean(props.issue.owner && props.issue.repo),
)

const assigneesLoading = computed(() => assignableUsersQuery.isLoading.value)
const labelsLoading = computed(() => repositoryLabelsQuery.isLoading.value)
const assigneeLogins = computed(() => assignees.value.map((assignee) => assignee.login))
const assigneeOptions = computed(() =>
  (assignableUsersQuery.data.value ?? []).map((user) => ({ id: user.login, label: user.login, avatarUrl: user.avatarUrl })),
)
const labelNames = computed(() => labels.value.map((label) => label.name))
const repositoryLabels = computed(() => repositoryLabelsQuery.data.value ?? [])
const labelOptions = computed(() =>
  repositoryLabels.value.map((label) => ({ id: label.name, label: label.name, description: label.description })),
)
const labelColorByName = computed(() => {
  const map = new Map<string, string>()
  for (const label of repositoryLabels.value) map.set(label.name, label.color)
  return map
})
const milestoneOptions = computed(() => [
  { id: '', label: t('issue.sidebar.empty.milestone') },
  ...(repositoryMilestonesQuery.data.value ?? []).map((milestone) => ({
    id: String(milestone.number),
    label: milestone.title,
  })),
])
const currentMilestoneId = computed(() =>
  props.issue.milestone?.number != null ? String(props.issue.milestone.number) : '',
)
const milestoneIds = computed(() => (currentMilestoneId.value ? [currentMilestoneId.value] : []))

function changedIds(current: string[], next: string[]): string[] {
  const cur = new Set(current)
  const nxt = new Set(next)
  return [...current.filter((id) => !nxt.has(id)), ...next.filter((id) => !cur.has(id))]
}

async function applyIssueUpdate(
  changes: {
    state?: 'open' | 'closed'
    stateReason?: 'completed' | 'not_planned'
    assignees?: string[]
    labels?: string[]
    milestone?: number | null
  },
  pendingIds?: Ref<string[]>,
  pending: string[] = [],
): Promise<void> {
  if (isSavingField.value) return
  isSavingField.value = true
  if (pendingIds) pendingIds.value = pending
  try {
    await updateIssue(props.issue.owner, props.issue.repo, props.issue.number, changes)
    await props.refetch()
    invalidateIssueLists(props.issue.owner, props.issue.repo)
  } finally {
    isSavingField.value = false
    if (pendingIds) pendingIds.value = []
  }
}

function onAssigneesChange(next: string[]): void {
  void applyIssueUpdate({ assignees: next }, pendingAssigneeIds, changedIds(assigneeLogins.value, next))
}

function onLabelsChange(next: string[]): void {
  void applyIssueUpdate({ labels: next }, pendingLabelIds, changedIds(labelNames.value, next))
}

function onMilestoneSelect(next: string[]): void {
  const value = next[0] ?? ''
  void applyIssueUpdate({ milestone: value === '' ? null : Number(value) }, pendingMilestoneIds, changedIds(milestoneIds.value, next))
}

function closeAsCompleted(): void {
  void applyIssueUpdate({ state: 'closed', stateReason: 'completed' })
}

function closeAsNotPlanned(): void {
  void applyIssueUpdate({ state: 'closed', stateReason: 'not_planned' })
}

function reopenIssue(): void {
  void applyIssueUpdate({ state: 'open' })
}

const issueStateLabel = computed(() => {
  const state = props.issue.state === 'open' || props.issue.state === 'completed' || props.issue.state === 'not_planned'
    ? props.issue.state
    : 'unknown'

  return t(`issue.states.${state}`)
})
const relationshipGroups = computed(() => {
  const rel = props.issue.relationships ?? { parent: null, subIssues: [], tracked: [] }
  return [
    { key: 'parent', label: t('issue.sidebar.relationships.parent'), items: rel.parent ? [rel.parent] : [] },
    { key: 'subIssues', label: t('issue.sidebar.relationships.subIssues'), items: rel.subIssues ?? [] },
    { key: 'tracked', label: t('issue.sidebar.relationships.tracked'), items: rel.tracked ?? [] },
  ]
    .map((group) => ({ key: group.key, label: group.label, refs: group.items.flatMap((item) => toIssueReference(item)) }))
    .filter((group) => group.refs.length > 0)
})
const hasRelationships = computed(() => relationshipGroups.value.length > 0)
const projects = computed(() => props.issue.projects ?? [])
const linkedPullRequests = computed(() =>
  props.issue.development?.pullRequests ?? props.issue.linkedWork ?? []
)
const linkedPullRequestReferences = computed(() =>
  linkedPullRequests.value.flatMap((item) => toLinkedPullRequestReference(item, props.issue))
)
const developmentItems = computed<DevelopmentItem[]>(() => {
  const branches = props.issue.development?.branches
  const commits = props.issue.development?.commits
  const items: DevelopmentItem[] = []

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
const shouldShowDevelopment = computed(() =>
  linkedPullRequestReferences.value.length > 0 || developmentItems.value.length > 0
)
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
        color: '',
        description: null,
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

function toLinkedPullRequestReference(
  item: IssueLinkedWorkSummary,
  issue: IssueDetail,
): LinkedPullRequestReference[] {
  const parsed = item.url ? parseGitHubReferenceUrl(item.url) : null
  const number = parsed?.number ?? item.number
  const owner = parsed?.owner ?? issue.owner
  const repo = parsed?.repo ?? issue.repo

  if (!owner || !repo || !number || number <= 0) return []

  return [{
    id: String(item.id ?? `${owner}/${repo}#${number}`),
    owner,
    repo,
    number,
    title: item.title || null,
    state: normalizePullRequestState(item.state),
    url: item.url ?? parsed?.url ?? null,
  }]
}

function normalizePullRequestState(value: string | null | undefined): GitHubRepositoryReferenceState | null {
  if (value === 'open' || value === 'draft' || value === 'merged' || value === 'closed') {
    return value
  }

  return null
}

function normalizeIssueReferenceState(value: string | null | undefined): GitHubRepositoryReferenceState | null {
  const normalized = value?.toLowerCase()
  if (normalized === 'open' || normalized === 'closed') return normalized
  return null
}

function toIssueReference(item: IssueLinkedWorkSummary): LinkedPullRequestReference[] {
  const parsed = item.url ? parseGitHubReferenceUrl(item.url) : null
  const number = parsed?.number ?? item.number
  const owner = parsed?.owner ?? props.issue.owner
  const repo = parsed?.repo ?? props.issue.repo

  if (!owner || !repo || !number || number <= 0) return []

  return [{
    id: String(item.id ?? `${owner}/${repo}#${number}`),
    owner,
    repo,
    number,
    title: item.title || null,
    state: normalizeIssueReferenceState(item.state),
    url: item.url ?? parsed?.url ?? null,
  }]
}

</script>

<template>
  <aside class="grid">
    <WorkItemSidebarSection :title="t('issue.sidebar.sections.status')">
      <div class="grid gap-3">
        <div class="flex min-w-0 items-center justify-between gap-3">
          <span class="text-body text-muted-foreground">{{ t('issue.sidebar.status.current') }}</span>
          <WorkItemStateBadge
            kind="issue"
            :label="issueStateLabel"
            :state="issue.state"
          />
        </div>

        <div
          v-if="hasIssueStateAction"
          class="grid gap-2"
        >
          <Button
            v-if="canReopenIssue"
            :disabled="isSavingField"
            :loading="isSavingField"
            loading-mode="manual"
            size="sm"
            type="button"
            variant="outline"
            @click="reopenIssue"
          >
            <Spinner
              v-if="isSavingField"
              class="size-3.5"
            />
            <RotateCcw
              v-else
              class="size-3.5"
            />
            <span>{{ t('issue.actions.reopen') }}</span>
          </Button>

          <template v-if="canCloseIssue">
            <Button
              :disabled="isSavingField"
              :loading="isSavingField"
              loading-mode="manual"
              size="sm"
              type="button"
              variant="outline"
              @click="closeAsCompleted"
            >
              <Spinner
                v-if="isSavingField"
                class="size-3.5"
              />
              <CheckCircle2
                v-else
                class="size-3.5"
              />
              <span>{{ t('issue.actions.closeCompleted') }}</span>
            </Button>
            <Button
              :disabled="isSavingField"
              :loading="isSavingField"
              loading-mode="manual"
              size="sm"
              type="button"
              variant="outline"
              @click="closeAsNotPlanned"
            >
              <Spinner
                v-if="isSavingField"
                class="size-3.5"
              />
              <CircleSlash
                v-else
                class="size-3.5"
              />
              <span>{{ t('issue.actions.closeNotPlanned') }}</span>
            </Button>
          </template>
        </div>
        <p
          v-else
          class="text-body text-muted-foreground"
        >
          {{ t('issue.sidebar.status.noActions') }}
        </p>
      </div>
    </WorkItemSidebarSection>

    <WorkItemSidebarSection :title="t('issue.sidebar.sections.assignees')">
      <template
        v-if="issue.viewerCanUpdate"
        #action
      >
        <MultiSelectPicker
          v-model:open="assigneePickerOpen"
          :empty-label="t('issue.sidebar.noMatches')"
          :loading="assigneesLoading"
          :loading-label="t('issue.sidebar.loading')"
          :model-value="assigneeLogins"
          :options="assigneeOptions"
          :pending-ids="pendingAssigneeIds"
          :search-placeholder="t('issue.sidebar.searchAssignees')"
          :trigger-label="t('issue.sidebar.edit')"
          @update:model-value="onAssigneesChange"
        >
          <template #option="{ option }">
            <span class="flex min-w-0 items-center gap-2">
              <Avatar class="size-5 shrink-0">
                <AvatarImage
                  :alt="option.label"
                  :src="option.avatarUrl || createGitHubAvatarUrl(option.label)"
                />
                <AvatarFallback>{{ option.label.slice(0, 1).toUpperCase() }}</AvatarFallback>
              </Avatar>
              <span class="min-w-0 truncate">{{ option.label }}</span>
            </span>
          </template>
        </MultiSelectPicker>
      </template>
      <div
        v-if="assignees.length > 0"
        class="grid gap-2"
      >
        <div
          v-for="assignee in assignees"
          :key="assignee.login"
          class="flex min-w-0 text-body"
        >
          <GitHubActorLink
            :avatar-url="assignee.avatarUrl"
            :login="assignee.login"
          />
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
      <template
        v-if="issue.viewerCanUpdate"
        #action
      >
        <MultiSelectPicker
          v-model:open="labelPickerOpen"
          :empty-label="t('issue.sidebar.noMatches')"
          :loading="labelsLoading"
          :loading-label="t('issue.sidebar.loading')"
          :model-value="labelNames"
          :options="labelOptions"
          :pending-ids="pendingLabelIds"
          :search-placeholder="t('issue.sidebar.searchLabels')"
          :trigger-label="t('issue.sidebar.edit')"
          @update:model-value="onLabelsChange"
        >
          <template #option="{ option }">
            <LabelBadge :label="{ name: option.label, color: labelColorByName.get(option.id) ?? '' }" />
          </template>
        </MultiSelectPicker>
      </template>
      <WorkItemLabelList
        :empty-label="t('issue.sidebar.empty.labels')"
        :labels="labels"
      />
    </WorkItemSidebarSection>

    <WorkItemSidebarSection :title="t('issue.sidebar.sections.type')">
      <span
        v-if="issue.issueType"
        class="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-body font-medium text-foreground"
        :title="issue.issueType.description ?? undefined"
      >
        {{ issue.issueType.name }}
      </span>
      <p
        v-else
        class="text-body text-muted-foreground"
      >
        {{ t('issue.sidebar.empty.type') }}
      </p>
    </WorkItemSidebarSection>

    <WorkItemSidebarSection :title="t('issue.sidebar.sections.milestone')">
      <template
        v-if="issue.viewerCanUpdate"
        #action
      >
        <MultiSelectPicker
          :empty-label="t('issue.sidebar.noMatches')"
          :model-value="milestoneIds"
          :options="milestoneOptions"
          :pending-ids="pendingMilestoneIds"
          :search-placeholder="t('issue.sidebar.searchMilestones')"
          :trigger-label="t('issue.sidebar.edit')"
          single
          @update:model-value="onMilestoneSelect"
        />
      </template>
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

    <WorkItemSidebarSection :title="t('issue.sidebar.sections.relationships')">
      <div
        v-if="hasRelationships"
        class="grid gap-3"
      >
        <div
          v-for="group in relationshipGroups"
          :key="group.key"
          class="grid min-w-0 gap-1.5"
        >
          <span class="text-body text-muted-foreground">{{ group.label }}</span>
          <GitHubReferenceLink
            v-for="reference in group.refs"
            :key="reference.id"
            class="text-body justify-self-start"
            :current-owner="issue.owner"
            :current-repo="issue.repo"
            :fallback-href="reference.url"
            initial-kind="issue"
            :initial-state="reference.state"
            :initial-title="reference.title"
            kind-hint="issue"
            :number="reference.number"
            :owner="reference.owner"
            :repo="reference.repo"
          />
        </div>
      </div>
      <p
        v-else
        class="text-body text-muted-foreground"
      >
        {{ t('issue.sidebar.empty.relationships') }}
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
        <GitHubActorLink
          v-for="participant in participants"
          :key="participant.login"
          avatar-size="md"
          :avatar-url="participant.avatarUrl"
          :login="participant.login"
          :show-username="false"
        />
      </div>
      <p
        v-else
        class="text-body text-muted-foreground"
      >
        {{ t('issue.sidebar.empty.participants') }}
      </p>
    </WorkItemSidebarSection>

    <WorkItemSidebarSection :title="t('issue.sidebar.sections.projects')">
      <div
        v-if="projects.length > 0"
        class="grid gap-3"
      >
        <div
          v-for="project in projects"
          :key="project.id"
          class="grid min-w-0 gap-1"
        >
          <a
            v-if="project.url"
            class="truncate text-body font-medium text-foreground underline-offset-4 outline-hidden hover:underline focus-visible:underline"
            :href="project.url"
            rel="noreferrer"
            target="_blank"
          >
            {{ project.title }}
          </a>
          <span
            v-else
            class="truncate text-body font-medium text-foreground"
          >
            {{ project.title }}
          </span>
          <div
            v-for="field in project.fields"
            :key="field.name"
            class="flex min-w-0 items-center justify-between gap-3 text-body text-muted-foreground"
          >
            <span class="truncate">{{ field.name }}</span>
            <span class="shrink-0 text-foreground">{{ field.value }}</span>
          </div>
        </div>
      </div>
      <p
        v-else
        class="text-body text-muted-foreground"
      >
        {{ t('issue.sidebar.empty.projects') }}
      </p>
    </WorkItemSidebarSection>

    <WorkItemSidebarSection
      v-if="shouldShowDevelopment"
      :title="t('issue.sidebar.sections.development')"
    >
      <div class="grid gap-2.5">
        <div
          v-if="linkedPullRequestReferences.length > 0"
          class="grid min-w-0 gap-1.5"
        >
          <span class="inline-flex min-w-0 items-center gap-2 text-body text-muted-foreground">
            <GitPullRequest class="size-3.5 shrink-0" />
            <span class="truncate">{{ t('issue.sidebar.development.pullRequests') }}</span>
          </span>
          <GitHubReferenceLink
            v-for="reference in linkedPullRequestReferences"
            :key="reference.id"
            class="text-body justify-self-start"
            :current-owner="issue.owner"
            :current-repo="issue.repo"
            :fallback-href="reference.url"
            initial-kind="pull-request"
            :initial-state="reference.state"
            :initial-title="reference.title"
            kind-hint="pull-request"
            :number="reference.number"
            :owner="reference.owner"
            :repo="reference.repo"
          />
        </div>

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
