<script setup lang="ts">
import type {
  IssueActorSummary,
  IssueAssignableUserOption,
  IssueAssigneesUpdatePayload,
  IssueDetail,
  IssueLabelOption,
  IssueLabelSummary,
  IssueLabelsUpdatePayload,
  IssueLinkedWorkSummary,
  IssueMilestoneOption,
  IssueMilestoneSummary,
  IssueMilestoneUpdatePayload,
} from './types'
import type { Component } from 'vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@oh-my-github/ui'
import { CalendarDays, GitBranch, GitCommitHorizontal, GitPullRequest, Pencil } from 'lucide-vue-next'
import {
  GitHubActorLink,
  GitHubReferenceLink,
  WorkItemSidebarSection,
  parseGitHubReferenceUrl,
} from '../../../components'

const NO_MILESTONE_VALUE = '__no_milestone__'

const props = withDefaults(defineProps<{
  issue: IssueDetail
  labelOptions?: IssueLabelOption[] | null
  assigneeOptions?: IssueAssignableUserOption[] | null
  milestoneOptions?: IssueMilestoneOption[] | null
  isUpdatingLabels?: boolean
  isUpdatingAssignees?: boolean
  isUpdatingMilestone?: boolean
}>(), {
  labelOptions: null,
  assigneeOptions: null,
  milestoneOptions: null,
  isUpdatingLabels: false,
  isUpdatingAssignees: false,
  isUpdatingMilestone: false,
})

const emit = defineEmits<{
  updateLabels: [payload: IssueLabelsUpdatePayload]
  updateAssignees: [payload: IssueAssigneesUpdatePayload]
  updateMilestone: [payload: IssueMilestoneUpdatePayload]
}>()

interface DevelopmentItem {
  id: string
  icon: Component
  label: string
  value: string
}

interface DateItem {
  id: string
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

const assignees = computed(() => props.issue.assignees ?? [])
const assigneeOptions = computed(() =>
  (props.assigneeOptions ?? []).flatMap((assignee) => {
    const normalized = normalizeAssignableUserOption(assignee)

    return normalized ? [normalized] : []
  })
)
const hasAssigneeOptions = computed(() => props.assigneeOptions !== null && props.assigneeOptions !== undefined)
const canOpenAssigneeOptions = computed(() => hasAssigneeOptions.value && !props.isUpdatingAssignees)
const assigneeEditTitle = computed(() =>
  hasAssigneeOptions.value
    ? t('issue.actions.editAssignees')
    : t('issue.sidebar.empty.assigneeOptionsUnavailable')
)
const selectedAssigneeKeys = computed(() =>
  new Set(assignees.value.map((assignee) => loginKey(assignee.login)))
)

const rawLabels = computed(() => normalizeLabels(props.issue.labels))
const labelOptions = computed(() =>
  (props.labelOptions ?? []).flatMap((label) => {
    const normalized = normalizeLabelOption(label)

    return normalized ? [normalized] : []
  })
)
const labelOptionByName = computed(() => {
  const options = new Map<string, IssueLabelOption>()

  for (const label of labelOptions.value) {
    options.set(labelNameKey(label.name), label)
  }

  return options
})
const labels = computed(() =>
  rawLabels.value.map((label) => {
    const option = labelOptionByName.value.get(labelNameKey(label.name))
    if (!option) return label

    return {
      ...option,
      ...label,
      id: label.id ?? option.id,
      color: label.color ?? option.color ?? null,
      description: label.description ?? option.description ?? null,
    }
  })
)
const hasLabelOptions = computed(() => props.labelOptions !== null && props.labelOptions !== undefined)
const canOpenLabelOptions = computed(() => hasLabelOptions.value && !props.isUpdatingLabels)
const labelEditTitle = computed(() =>
  hasLabelOptions.value
    ? t('issue.actions.editLabels')
    : t('issue.sidebar.empty.labelOptionsUnavailable')
)
const selectedLabelKeys = computed(() =>
  new Set(labels.value.map((label) => labelNameKey(label.name)))
)

const milestoneOptions = computed(() =>
  (props.milestoneOptions ?? []).flatMap((milestone) => {
    const normalized = normalizeMilestoneOption(milestone)

    return normalized ? [normalized] : []
  })
)
const hasMilestoneOptions = computed(() => props.milestoneOptions !== null && props.milestoneOptions !== undefined)
const canOpenMilestoneOptions = computed(() => hasMilestoneOptions.value && !props.isUpdatingMilestone)
const milestoneEditTitle = computed(() =>
  hasMilestoneOptions.value
    ? t('issue.actions.editMilestone')
    : t('issue.sidebar.empty.milestoneOptionsUnavailable')
)
const selectedMilestoneValue = computed(() => {
  const milestone = props.issue.milestone
  if (!milestone) return NO_MILESTONE_VALUE

  const matchingOption = milestoneOptions.value.find((option) => isSameMilestone(option, milestone))

  return matchingOption ? milestoneOptionValue(matchingOption) : currentMilestoneValue(milestone)
})

const participants = computed(() => props.issue.participants ?? [])
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
const dates = computed<DateItem[]>(() => [
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
  return labels.flatMap((label) => {
    const normalized = normalizeLabelSummary(label)

    return normalized ? [normalized] : []
  })
}

function normalizeLabelSummary(label: IssueLabelSummary | string): IssueLabelSummary | null {
  if (typeof label === 'string') {
    const name = label.trim()
    if (!name) return null

    return {
      id: name,
      name,
    }
  }

  const name = label.name.trim()
  if (!name) return null

  return {
    ...label,
    name,
  }
}

function normalizeLabelOption(label: IssueLabelOption): IssueLabelOption | null {
  const name = label.name.trim()
  if (!name) return null

  return {
    ...label,
    name,
  }
}

function labelNameKey(name: string): string {
  return name.trim().toLocaleLowerCase()
}

function labelKey(label: IssueLabelSummary | IssueLabelOption): string {
  return String(label.id ?? label.name)
}

function normalizeLabelColor(color: string | null | undefined): string | null {
  const value = color?.trim().replace(/^#/, '')
  if (!value || !/^[\da-f]{3}([\da-f]{3})?$/i.test(value)) return null

  return `#${value}`
}

function labelColorStyle(label: IssueLabelSummary | IssueLabelOption): Record<string, string> | undefined {
  const color = normalizeLabelColor(label.color)

  return color ? { backgroundColor: color } : undefined
}

function isLabelSelected(label: IssueLabelOption): boolean {
  return selectedLabelKeys.value.has(labelNameKey(label.name))
}

function updateLabelSelection(label: IssueLabelOption, checked: boolean): void {
  const normalizedLabel = normalizeLabelOption(label)
  if (!normalizedLabel) return

  const nextLabels = new Map<string, IssueLabelOption>()

  for (const currentLabel of labels.value) {
    nextLabels.set(labelNameKey(currentLabel.name), currentLabel)
  }

  if (checked) {
    nextLabels.set(labelNameKey(normalizedLabel.name), normalizedLabel)
  } else {
    nextLabels.delete(labelNameKey(normalizedLabel.name))
  }

  const labelsPayload = Array.from(nextLabels.values())

  emit('updateLabels', {
    labels: labelsPayload,
    labelNames: labelsPayload.map((item) => item.name),
  })
}

function normalizeAssignableUserOption(user: IssueAssignableUserOption | IssueActorSummary): IssueAssignableUserOption | null {
  const login = user.login.trim()
  if (!login) return null

  return {
    ...user,
    login,
  }
}

function loginKey(login: string): string {
  return login.trim().toLocaleLowerCase()
}

function assigneeKey(assignee: IssueAssignableUserOption): string {
  return String(assignee.id ?? assignee.login)
}

function isAssigneeSelected(assignee: IssueAssignableUserOption): boolean {
  return selectedAssigneeKeys.value.has(loginKey(assignee.login))
}

function updateAssigneeSelection(assignee: IssueAssignableUserOption, checked: boolean): void {
  const normalizedAssignee = normalizeAssignableUserOption(assignee)
  if (!normalizedAssignee) return

  const nextAssignees = new Map<string, IssueAssignableUserOption>()

  for (const currentAssignee of assignees.value) {
    const normalizedCurrentAssignee = normalizeAssignableUserOption(currentAssignee)
    if (normalizedCurrentAssignee) {
      nextAssignees.set(loginKey(normalizedCurrentAssignee.login), normalizedCurrentAssignee)
    }
  }

  if (checked) {
    nextAssignees.set(loginKey(normalizedAssignee.login), normalizedAssignee)
  } else {
    nextAssignees.delete(loginKey(normalizedAssignee.login))
  }

  const assigneesPayload = Array.from(nextAssignees.values())

  emit('updateAssignees', {
    assignees: assigneesPayload,
    assigneeLogins: assigneesPayload.map((item) => item.login),
  })
}

function normalizeMilestoneOption(milestone: IssueMilestoneOption): IssueMilestoneOption | null {
  const title = milestone.title.trim()
  if (!title) return null

  return {
    ...milestone,
    title,
  }
}

function milestoneOptionValue(milestone: IssueMilestoneOption): string {
  return String(milestone.id ?? milestone.number ?? milestone.title)
}

function currentMilestoneValue(milestone: IssueMilestoneSummary): string {
  const currentMilestone = milestone as IssueMilestoneOption

  return String(currentMilestone.id ?? currentMilestone.number ?? currentMilestone.title)
}

function isSameMilestone(option: IssueMilestoneOption, milestone: IssueMilestoneSummary): boolean {
  const currentMilestone = milestone as IssueMilestoneOption

  if (option.id !== undefined && currentMilestone.id !== undefined) {
    return String(option.id) === String(currentMilestone.id)
  }

  if (option.number !== undefined && option.number !== null && currentMilestone.number !== undefined && currentMilestone.number !== null) {
    return option.number === currentMilestone.number
  }

  return option.title.trim() === milestone.title.trim()
}

function updateMilestoneSelection(value: unknown): void {
  const nextValue = String(value ?? '')

  if (nextValue === NO_MILESTONE_VALUE) {
    emit('updateMilestone', {
      milestone: null,
      milestoneNumber: null,
    })
    return
  }

  const milestone = milestoneOptions.value.find((option) => milestoneOptionValue(option) === nextValue)
  if (!milestone) return

  emit('updateMilestone', {
    milestone,
    milestoneNumber: milestone.number ?? null,
  })
}

function isDateItem(value: DateItem | null): value is DateItem {
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
</script>

<template>
  <aside class="grid">
    <WorkItemSidebarSection :title="t('issue.sidebar.sections.assignees')">
      <template #action>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              :aria-label="t('issue.actions.editAssignees')"
              class="size-7 text-muted-foreground"
              :disabled="!canOpenAssigneeOptions"
              :loading="isUpdatingAssignees"
              size="icon-sm"
              :title="assigneeEditTitle"
              type="button"
              variant="ghost"
            >
              <Pencil class="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            class="w-64"
          >
            <DropdownMenuLabel>
              {{ t('issue.sidebar.sections.assignees') }}
            </DropdownMenuLabel>
            <template v-if="assigneeOptions.length > 0">
              <DropdownMenuCheckboxItem
                v-for="assignee in assigneeOptions"
                :key="assigneeKey(assignee)"
                :checked="isAssigneeSelected(assignee)"
                class="min-w-0"
                @select.prevent
                @update:checked="updateAssigneeSelection(assignee, $event === true)"
              >
                <GitHubActorLink
                  class="min-w-0 text-control"
                  :avatar-url="assignee.avatarUrl"
                  :interactive="false"
                  :login="assignee.login"
                />
              </DropdownMenuCheckboxItem>
            </template>
            <DropdownMenuItem
              v-else
              disabled
            >
              {{ t('issue.sidebar.empty.assigneeOptions') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
      <template #action>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              :aria-label="t('issue.actions.editLabels')"
              class="size-7 text-muted-foreground"
              :disabled="!canOpenLabelOptions"
              :loading="isUpdatingLabels"
              size="icon-sm"
              :title="labelEditTitle"
              type="button"
              variant="ghost"
            >
              <Pencil class="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            class="w-64"
          >
            <DropdownMenuLabel>
              {{ t('issue.sidebar.sections.labels') }}
            </DropdownMenuLabel>
            <template v-if="labelOptions.length > 0">
              <DropdownMenuCheckboxItem
                v-for="label in labelOptions"
                :key="labelKey(label)"
                :checked="isLabelSelected(label)"
                class="min-w-0"
                @select.prevent
                @update:checked="updateLabelSelection(label, $event === true)"
              >
                <span
                  v-if="labelColorStyle(label)"
                  aria-hidden="true"
                  class="size-2.5 shrink-0 rounded-full border border-border"
                  :style="labelColorStyle(label)"
                />
                <span class="min-w-0 truncate">{{ label.name }}</span>
              </DropdownMenuCheckboxItem>
            </template>
            <DropdownMenuItem
              v-else
              disabled
            >
              {{ t('issue.sidebar.empty.labelOptions') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>

      <div
        v-if="labels.length > 0"
        class="flex min-w-0 flex-wrap items-center gap-1.5"
      >
        <Badge
          v-for="label in labels"
          :key="labelKey(label)"
          class="max-w-full gap-1.5"
          size="sm"
          variant="secondary"
        >
          <span
            v-if="labelColorStyle(label)"
            aria-hidden="true"
            class="size-2 shrink-0 rounded-full border border-border"
            :style="labelColorStyle(label)"
          />
          <span class="truncate">{{ label.name }}</span>
        </Badge>
      </div>
      <p
        v-else
        class="text-body text-muted-foreground"
      >
        {{ t('issue.sidebar.empty.labels') }}
      </p>
    </WorkItemSidebarSection>

    <WorkItemSidebarSection :title="t('issue.sidebar.sections.milestone')">
      <template #action>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              :aria-label="t('issue.actions.editMilestone')"
              class="size-7 text-muted-foreground"
              :disabled="!canOpenMilestoneOptions"
              :loading="isUpdatingMilestone"
              size="icon-sm"
              :title="milestoneEditTitle"
              type="button"
              variant="ghost"
            >
              <Pencil class="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            class="w-64"
          >
            <DropdownMenuLabel>
              {{ t('issue.sidebar.sections.milestone') }}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              :model-value="selectedMilestoneValue"
              @update:model-value="updateMilestoneSelection"
            >
              <DropdownMenuRadioItem :value="NO_MILESTONE_VALUE">
                {{ t('issue.sidebar.values.noMilestone') }}
              </DropdownMenuRadioItem>
              <DropdownMenuSeparator v-if="milestoneOptions.length > 0" />
              <DropdownMenuRadioItem
                v-for="milestone in milestoneOptions"
                :key="milestoneOptionValue(milestone)"
                :value="milestoneOptionValue(milestone)"
                class="min-w-0"
              >
                <span class="grid min-w-0 gap-0.5">
                  <span class="min-w-0 truncate">{{ milestone.title }}</span>
                  <span
                    v-if="milestone.dueOn"
                    class="min-w-0 truncate text-body text-muted-foreground"
                  >
                    {{ t('issue.sidebar.dates.due', { date: formatDate(milestone.dueOn) }) }}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuItem
              v-if="milestoneOptions.length === 0"
              disabled
            >
              {{ t('issue.sidebar.empty.milestoneOptions') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            class="text-body"
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
