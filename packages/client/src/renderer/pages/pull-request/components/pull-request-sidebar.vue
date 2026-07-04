<script setup lang="ts">
import type { PullRequestDetail } from './types'
import type { Component, Ref } from 'vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  Textarea,
} from '@oh-my-github/ui'
import {
  CalendarDays,
  Check,
  ChevronDown,
  FileDiff,
  GitBranch,
  GitMerge,
  GitPullRequest,
  XCircle,
} from 'lucide-vue-next'
import {
  GitHubActorLink,
  GitHubReferenceLink,
  LabelBadge,
  MultiSelectPicker,
  WorkItemLabelList,
  WorkItemSidebarSection,
  createGitHubAvatarUrl,
} from '@/components'
import {
  closePullRequest,
  markPullRequestReadyForReview,
  mergePullRequest,
  requestPullRequestReviewers,
  updatePullRequest,
  usePullRequestListInvalidation,
} from '@/composables/github/use-pull-requests'
import {
  useAssignableUsersQuery,
  useRepositoryLabelsQuery,
  useRepositoryMilestonesQuery,
} from '@/composables/github/use-issues'
import {
  canApplyMergeDialogOpenChange,
  type PullRequestMergeDialogOpenChangeReason,
} from './pull-request-merge-dialog-state'
import { shouldShowPullRequestMergeActionIcon } from './pull-request-merge-button-state'
import { createPullRequestMergeDraft } from './pull-request-merge-draft'

const props = defineProps<{
  pullRequest: PullRequestDetail
  refetch: () => Promise<unknown>
}>()

interface SummaryItem {
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

const { t } = useI18n()
const { invalidatePullRequestLists } = usePullRequestListInvalidation()

const isSavingField = ref(false)
const assigneePickerOpen = ref(false)
const labelPickerOpen = ref(false)
const reviewerPickerOpen = ref(false)
const pendingAssigneeIds = ref<string[]>([])
const pendingLabelIds = ref<string[]>([])
const pendingReviewerIds = ref<string[]>([])
const pendingMilestoneIds = ref<string[]>([])

const assignableUsersQuery = useAssignableUsersQuery(() => props.pullRequest.owner, () => props.pullRequest.repo, assigneePickerOpen)
const reviewerUsersQuery = useAssignableUsersQuery(() => props.pullRequest.owner, () => props.pullRequest.repo, reviewerPickerOpen)
const repositoryLabelsQuery = useRepositoryLabelsQuery(() => props.pullRequest.owner, () => props.pullRequest.repo, labelPickerOpen)
const repositoryMilestonesQuery = useRepositoryMilestonesQuery(() => props.pullRequest.owner, () => props.pullRequest.repo, () => Boolean(props.pullRequest.owner && props.pullRequest.repo))

const assigneeLogins = computed(() => (props.pullRequest.assignees ?? []).map((a) => a.login))
const assigneeOptions = computed(() => (assignableUsersQuery.data.value ?? []).map((u) => ({ id: u.login, label: u.login, avatarUrl: u.avatarUrl })))
const reviewerLogins = computed(() =>
  (props.pullRequest.reviewRequests ?? [])
    .filter((r) => r.reviewerType === 'user' || r.reviewerType === 'mannequin')
    .map((r) => r.reviewer.login)
)
const reviewerOptions = computed(() => (reviewerUsersQuery.data.value ?? []).map((u) => ({ id: u.login, label: u.login, avatarUrl: u.avatarUrl })))
const labelNames = computed(() => (props.pullRequest.labels ?? []).map((l) => l.name))
const repositoryLabels = computed(() => repositoryLabelsQuery.data.value ?? [])
const labelOptions = computed(() => repositoryLabels.value.map((l) => ({ id: l.name, label: l.name, description: l.description })))
const labelColorByName = computed(() => { const m = new Map<string, string>(); for (const l of repositoryLabels.value) m.set(l.name, l.color); return m })
const milestoneOptions = computed(() => [{ id: '', label: t('pullRequest.sidebar.empty.milestone') }, ...(repositoryMilestonesQuery.data.value ?? []).map((m) => ({ id: String(m.number), label: m.title }))])
const currentMilestoneId = computed(() => props.pullRequest.milestone?.number != null ? String(props.pullRequest.milestone.number) : '')
const milestoneIds = computed(() => currentMilestoneId.value ? [currentMilestoneId.value] : [])
const projects = computed(() => props.pullRequest.projects ?? [])

function changedIds(current: string[], next: string[]): string[] {
  const cur = new Set(current)
  const nxt = new Set(next)
  return [...current.filter((id) => !nxt.has(id)), ...next.filter((id) => !cur.has(id))]
}

async function applyUpdate(changes: { assignees?: string[], labels?: string[], milestone?: number | null }, pendingIds: Ref<string[]>, pending: string[]): Promise<void> {
  if (isSavingField.value) return
  isSavingField.value = true
  pendingIds.value = pending
  try {
    await updatePullRequest(props.pullRequest.owner, props.pullRequest.repo, props.pullRequest.number, changes)
    await props.refetch()
  } finally {
    isSavingField.value = false
    pendingIds.value = []
  }
}
function onAssigneesChange(next: string[]): void { void applyUpdate({ assignees: next }, pendingAssigneeIds, changedIds(assigneeLogins.value, next)) }
function onLabelsChange(next: string[]): void { void applyUpdate({ labels: next }, pendingLabelIds, changedIds(labelNames.value, next)) }
function onMilestoneSelect(next: string[]): void { const v = next[0] ?? ''; void applyUpdate({ milestone: v === '' ? null : Number(v) }, pendingMilestoneIds, changedIds(milestoneIds.value, next)) }
async function onReviewersChange(next: string[]): Promise<void> {
  if (isSavingField.value) return
  const current = reviewerLogins.value
  const added = next.filter((l) => !current.includes(l))
  const removed = current.filter((l) => !next.includes(l))
  if (added.length === 0 && removed.length === 0) return
  isSavingField.value = true
  pendingReviewerIds.value = [...added, ...removed]
  try {
    await requestPullRequestReviewers(props.pullRequest.owner, props.pullRequest.repo, props.pullRequest.number, added, removed)
    await props.refetch()
  } finally {
    isSavingField.value = false
    pendingReviewerIds.value = []
  }
}

const selectedMergeMethod = ref<GitHubPullRequestMergeMethod | null>(null)
const bypassRules = ref(false)
const actionError = ref<string | null>(null)
const mergeDialogError = ref<string | null>(null)
const isMergeDialogOpen = ref(false)
const isMerging = ref(false)
const isClosing = ref(false)
const isMarkingReady = ref(false)
const pendingMergeMethod = ref<GitHubPullRequestMergeMethod | null>(null)
const mergeCommitTitle = ref('')
const mergeCommitMessage = ref('')

const labels = computed(() => props.pullRequest.labels ?? [])
const assignees = computed(() => props.pullRequest.assignees ?? [])
const participants = computed(() => props.pullRequest.participants ?? [])
const reviewRequests = computed(() => props.pullRequest.reviewRequests ?? [])
const linkedIssues = computed(() => props.pullRequest.linkedIssues ?? [])
const latestReviews = computed(() => props.pullRequest.latestReviews ?? [])
const availableMergeMethods = computed(() => props.pullRequest.mergePolicy?.methods ?? [])
const defaultMergeMethod = computed(() => {
  const defaultMethod = props.pullRequest.mergePolicy?.defaultMethod ?? null
  if (defaultMethod && availableMergeMethods.value.includes(defaultMethod)) return defaultMethod

  return availableMergeMethods.value[0] ?? null
})
const activeMergeMethod = computed(() =>
  selectedMergeMethod.value && availableMergeMethods.value.includes(selectedMergeMethod.value)
    ? selectedMergeMethod.value
    : defaultMergeMethod.value
)
const isOpenPullRequest = computed(() =>
  props.pullRequest.state === 'open'
)
const normalizedMergeable = computed(() =>
  String(props.pullRequest.status.mergeable ?? '').toLowerCase()
)
const normalizedMergeState = computed(() =>
  String(props.pullRequest.status.mergeStateStatus ?? '').toUpperCase()
)
const hasConflicts = computed(() =>
  normalizedMergeable.value === 'conflicting' || normalizedMergeState.value === 'DIRTY'
)
const hasBlockingRequirements = computed(() =>
  props.pullRequest.reviewDecision === 'review_required'
  || props.pullRequest.reviewDecision === 'changes_requested'
  || props.pullRequest.status.ciState === 'failure'
  || props.pullRequest.status.ciState === 'pending'
  || ['BLOCKED', 'BEHIND', 'UNSTABLE', 'HAS_HOOKS'].includes(normalizedMergeState.value)
)
const canBypassRules = computed(() =>
  Boolean(
    props.pullRequest.viewerCanMergeAsAdmin
    && isOpenPullRequest.value
    && hasBlockingRequirements.value
    && !hasConflicts.value,
  )
)
const canMergeNormally = computed(() =>
  Boolean(
    isOpenPullRequest.value
    && !hasConflicts.value
    && !hasBlockingRequirements.value
    && activeMergeMethod.value,
  )
)
const canSubmitMerge = computed(() =>
  Boolean(
    activeMergeMethod.value
    && !isMerging.value
    && (canMergeNormally.value || (canBypassRules.value && bypassRules.value)),
  )
)
const canClosePullRequest = computed(() =>
  (props.pullRequest.state === 'open' || props.pullRequest.state === 'draft') && props.pullRequest.viewerCanClose
)
const canMarkReadyForReview = computed(() =>
  props.pullRequest.state === 'draft' && props.pullRequest.viewerCanUpdate
)
const selectedMergeLabel = computed(() =>
  activeMergeMethod.value
    ? t(`pullRequest.merge.methods.${activeMergeMethod.value}`)
    : t('pullRequest.merge.noMethods')
)
const mergeButtonLabel = computed(() => {
  if (!activeMergeMethod.value) return t('pullRequest.merge.noMethods')
  if (canBypassRules.value && bypassRules.value) {
    return t('pullRequest.merge.bypassButton', {
      method: t(`pullRequest.merge.methodShort.${activeMergeMethod.value}`),
    })
  }

  return selectedMergeLabel.value
})
const mergeDialogConfirmLabel = computed(() => {
  const method = pendingMergeMethod.value ?? activeMergeMethod.value
  const methodLabel = method ? t(`pullRequest.merge.methodShort.${method}`) : ''

  return canBypassRules.value && bypassRules.value
    ? t('pullRequest.merge.confirmBypassButton', { method: methodLabel })
    : t('pullRequest.merge.confirmButton', { method: methodLabel })
})
const showMergeActionIcon = computed(() =>
  shouldShowPullRequestMergeActionIcon({ isMerging: isMerging.value })
)
const diffItems = computed<SummaryItem[]>(() => [
  {
    id: 'files',
    icon: FileDiff,
    label: t('pullRequest.sidebar.diff.files'),
    value: formatCount(props.pullRequest.diffStats.changedFiles),
  },
  {
    id: 'additions',
    icon: FileDiff,
    label: t('pullRequest.sidebar.diff.additions'),
    value: `+${formatCount(props.pullRequest.diffStats.additions)}`,
  },
  {
    id: 'deletions',
    icon: FileDiff,
    label: t('pullRequest.sidebar.diff.deletions'),
    value: `-${formatCount(props.pullRequest.diffStats.deletions)}`,
  },
])
const dates = computed<DateItem[]>(() => [
  {
    id: 'created',
    label: t('pullRequest.sidebar.dates.created'),
    value: formatDate(props.pullRequest.createdAt),
  },
  {
    id: 'updated',
    label: t('pullRequest.sidebar.dates.updated'),
    value: formatDate(props.pullRequest.updatedAt),
  },
  props.pullRequest.closedAt
    ? {
        id: 'closed',
        label: t('pullRequest.sidebar.dates.closed'),
        value: formatDate(props.pullRequest.closedAt),
      }
    : null,
  props.pullRequest.mergedAt
    ? {
        id: 'merged',
        label: t('pullRequest.sidebar.dates.merged'),
        value: formatDate(props.pullRequest.mergedAt),
      }
    : null,
].filter(isDateItem))

watch(
  availableMergeMethods,
  () => {
    selectedMergeMethod.value = defaultMergeMethod.value
  },
  { immediate: true },
)

watch(
  canBypassRules,
  (canBypass) => {
    if (!canBypass) bypassRules.value = false
  },
)

function selectMergeMethod(method: GitHubPullRequestMergeMethod): void {
  selectedMergeMethod.value = method
}

function openMergeDialog(): void {
  if (!activeMergeMethod.value || !canSubmitMerge.value) return

  const draft = createPullRequestMergeDraft({
    method: activeMergeMethod.value,
    number: props.pullRequest.number,
    title: props.pullRequest.title,
    body: props.pullRequest.body,
    headBranch: props.pullRequest.headBranch.name,
  })

  pendingMergeMethod.value = activeMergeMethod.value
  mergeCommitTitle.value = draft.title
  mergeCommitMessage.value = draft.message
  mergeDialogError.value = null
  actionError.value = null
  isMergeDialogOpen.value = true
}

function setMergeDialogOpen(isOpen: boolean, reason: PullRequestMergeDialogOpenChangeReason = 'user'): void {
  if (!canApplyMergeDialogOpenChange({
    isMerging: isMerging.value,
    nextOpen: isOpen,
    reason,
  })) return

  isMergeDialogOpen.value = isOpen

  if (!isOpen) {
    pendingMergeMethod.value = null
    mergeDialogError.value = null
  }
}

async function confirmMerge(): Promise<void> {
  const method = pendingMergeMethod.value ?? activeMergeMethod.value
  const commitTitle = mergeCommitTitle.value.trim()
  const commitMessage = mergeCommitMessage.value.trim()

  if (!method || !canSubmitMerge.value) return

  if (!commitTitle) {
    mergeDialogError.value = t('pullRequest.merge.commitTitleRequired')
    return
  }

  isMerging.value = true
  mergeDialogError.value = null

  try {
    await mergePullRequest(props.pullRequest.owner, props.pullRequest.repo, props.pullRequest.number, {
      method,
      expectedHeadSha: props.pullRequest.headSha,
      commitTitle,
      commitMessage,
    })
    bypassRules.value = false
    setMergeDialogOpen(false, 'merge-success')
    void props.refetch()
    invalidatePullRequestLists(props.pullRequest.owner, props.pullRequest.repo)
  } catch {
    mergeDialogError.value = canBypassRules.value && bypassRules.value
      ? t('pullRequest.merge.bypassError')
      : t('pullRequest.merge.mergeError')
  } finally {
    isMerging.value = false
  }
}

async function closeCurrentPullRequest(): Promise<void> {
  if (!canClosePullRequest.value || isClosing.value) return

  isClosing.value = true
  actionError.value = null

  try {
    await closePullRequest(props.pullRequest.owner, props.pullRequest.repo, props.pullRequest.number)
    void props.refetch()
    invalidatePullRequestLists(props.pullRequest.owner, props.pullRequest.repo)
  } catch {
    actionError.value = t('pullRequest.merge.closeError')
  } finally {
    isClosing.value = false
  }
}

async function markReadyForReview(): Promise<void> {
  if (!canMarkReadyForReview.value || isMarkingReady.value) return

  isMarkingReady.value = true
  actionError.value = null

  try {
    await markPullRequestReadyForReview(
      props.pullRequest.owner,
      props.pullRequest.repo,
      props.pullRequest.number,
      props.pullRequest.nodeId,
    )
    void props.refetch()
    invalidatePullRequestLists(props.pullRequest.owner, props.pullRequest.repo)
  } catch {
    actionError.value = t('pullRequest.merge.readyError')
  } finally {
    isMarkingReady.value = false
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return t('pullRequest.values.unknown')

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return t('pullRequest.values.unknown')

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value)
}

function isDateItem(value: DateItem | null): value is DateItem {
  return value !== null
}
</script>

<template>
  <aside class="grid">
    <WorkItemSidebarSection :title="t('pullRequest.sidebar.sections.merge')">
      <div class="grid gap-3">
        <p
          v-if="actionError"
          class="text-body text-destructive"
          role="alert"
        >
          {{ actionError }}
        </p>

        <label
          v-if="canBypassRules"
          class="flex min-w-0 items-start gap-2 rounded-md border border-border px-2.5 py-2 text-body text-foreground"
        >
          <Checkbox
            v-model="bypassRules"
            class="mt-0.5"
            :disabled="isMerging"
          />
          <span class="min-w-0">
            {{ t('pullRequest.merge.bypassRules') }}
          </span>
        </label>

        <div
          v-if="availableMergeMethods.length > 0 && isOpenPullRequest"
          class="grid gap-2"
        >
          <div class="flex min-w-0">
            <Button
              class="min-w-0 flex-1 justify-start rounded-r-none"
              :disabled="!canSubmitMerge"
              :loading="isMerging"
              loading-mode="leading"
              size="sm"
              type="button"
              :variant="canSubmitMerge ? 'primary' : 'outline'"
              @click="openMergeDialog"
            >
              <GitMerge
                v-if="showMergeActionIcon"
                class="size-3.5"
              />
              <span class="truncate">{{ mergeButtonLabel }}</span>
            </Button>

            <DropdownMenu v-if="availableMergeMethods.length > 1">
              <DropdownMenuTrigger as-child>
                <Button
                  :aria-label="t('pullRequest.merge.chooseMethod')"
                  class="rounded-l-none px-2"
                  :disabled="isMerging"
                  size="sm"
                  type="button"
                  :variant="canSubmitMerge ? 'primary' : 'outline'"
                >
                  <ChevronDown class="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  v-for="method in availableMergeMethods"
                  :key="method"
                  @select="selectMergeMethod(method)"
                >
                  <Check
                    class="size-3.5"
                    :class="activeMergeMethod === method ? 'opacity-100' : 'opacity-0'"
                  />
                  <span>{{ t(`pullRequest.merge.methods.${method}`) }}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p
          v-else-if="isOpenPullRequest"
          class="text-body text-muted-foreground"
        >
          {{ t('pullRequest.merge.noMethodsDescription') }}
        </p>

        <Button
          v-if="canMarkReadyForReview"
          :disabled="isMarkingReady"
          :loading="isMarkingReady"
          loading-mode="leading"
          size="sm"
          type="button"
          variant="primary"
          @click="markReadyForReview"
        >
          <GitPullRequest class="size-3.5" />
          <span>{{ t('pullRequest.actions.readyForReview') }}</span>
        </Button>

        <Button
          v-if="canClosePullRequest"
          :disabled="isClosing"
          :loading="isClosing"
          loading-mode="leading"
          size="sm"
          type="button"
          variant="outline"
          @click="closeCurrentPullRequest"
        >
          <XCircle class="size-3.5" />
          <span>{{ t('pullRequest.actions.close') }}</span>
        </Button>
      </div>
    </WorkItemSidebarSection>

    <Dialog
      :open="isMergeDialogOpen"
      @update:open="setMergeDialogOpen"
    >
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ t('pullRequest.merge.confirmTitle') }}</DialogTitle>
          <DialogDescription>
            {{ t('pullRequest.merge.confirmDescription') }}
          </DialogDescription>
        </DialogHeader>

        <form
          class="space-y-4"
          @submit.prevent="confirmMerge"
        >
          <div class="space-y-2">
            <Label for="pull-request-merge-commit-title">
              {{ t('pullRequest.merge.commitTitle') }}
            </Label>
            <Input
              id="pull-request-merge-commit-title"
              v-model="mergeCommitTitle"
              autocomplete="off"
              :disabled="isMerging"
            />
          </div>

          <div class="space-y-2">
            <Label for="pull-request-merge-commit-message">
              {{ t('pullRequest.merge.commitMessage') }}
            </Label>
            <Textarea
              id="pull-request-merge-commit-message"
              v-model="mergeCommitMessage"
              class="min-h-40 max-h-[40vh] resize-y overflow-y-auto"
              :disabled="isMerging"
              :placeholder="t('pullRequest.merge.commitMessagePlaceholder')"
            />
          </div>

          <p
            v-if="mergeDialogError"
            class="text-body text-destructive"
            role="alert"
          >
            {{ mergeDialogError }}
          </p>

          <DialogFooter>
            <Button
              :disabled="isMerging"
              type="button"
              variant="ghost"
              @click="setMergeDialogOpen(false)"
            >
              {{ t('pullRequest.merge.cancel') }}
            </Button>
            <Button
              :disabled="!mergeCommitTitle.trim() || isMerging"
              :loading="isMerging"
              loading-mode="leading"
              type="submit"
            >
              {{ mergeDialogConfirmLabel }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <WorkItemSidebarSection :title="t('pullRequest.sidebar.sections.reviewers')">
      <template
        v-if="pullRequest.viewerCanUpdate"
        #action
      >
        <MultiSelectPicker
          v-model:open="reviewerPickerOpen"
          :empty-label="t('pullRequest.sidebar.noMatches')"
          :loading="reviewerUsersQuery.isLoading.value"
          :loading-label="t('pullRequest.sidebar.loading')"
          :model-value="reviewerLogins"
          :options="reviewerOptions"
          :pending-ids="pendingReviewerIds"
          :search-placeholder="t('pullRequest.sidebar.searchReviewers')"
          :trigger-label="t('pullRequest.sidebar.edit')"
          @update:model-value="onReviewersChange"
        >
          <template #option="{ option }">
            <span class="flex min-w-0 items-center gap-2">
              <Avatar class="size-5 shrink-0">
                <AvatarImage :alt="option.label" :src="option.avatarUrl || createGitHubAvatarUrl(option.label)" />
                <AvatarFallback>{{ option.label.slice(0, 1).toUpperCase() }}</AvatarFallback>
              </Avatar>
              <span class="min-w-0 truncate">{{ option.label }}</span>
            </span>
          </template>
        </MultiSelectPicker>
      </template>
      <div
        v-if="reviewRequests.length > 0"
        class="grid gap-2"
      >
        <div
          v-for="request in reviewRequests"
          :key="request.id"
          class="flex min-w-0 text-body"
        >
          <GitHubActorLink
            :avatar-url="request.reviewer.avatarUrl"
            :login="request.reviewer.login"
          />
        </div>
      </div>
      <p
        v-else
        class="text-body text-muted-foreground"
      >
        {{ t('pullRequest.sidebar.empty.reviewers') }}
      </p>
    </WorkItemSidebarSection>

    <WorkItemSidebarSection :title="t('pullRequest.sidebar.sections.assignees')">
      <template
        v-if="pullRequest.viewerCanUpdate"
        #action
      >
        <MultiSelectPicker
          v-model:open="assigneePickerOpen"
          :empty-label="t('pullRequest.sidebar.noMatches')"
          :loading="assignableUsersQuery.isLoading.value"
          :loading-label="t('pullRequest.sidebar.loading')"
          :model-value="assigneeLogins"
          :options="assigneeOptions"
          :pending-ids="pendingAssigneeIds"
          :search-placeholder="t('pullRequest.sidebar.searchAssignees')"
          :trigger-label="t('pullRequest.sidebar.edit')"
          @update:model-value="onAssigneesChange"
        >
          <template #option="{ option }">
            <span class="flex min-w-0 items-center gap-2">
              <Avatar class="size-5 shrink-0">
                <AvatarImage :alt="option.label" :src="option.avatarUrl || createGitHubAvatarUrl(option.label)" />
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
        {{ t('pullRequest.sidebar.empty.assignees') }}
      </p>
    </WorkItemSidebarSection>

    <WorkItemSidebarSection :title="t('pullRequest.sidebar.sections.labels')">
      <template
        v-if="pullRequest.viewerCanUpdate"
        #action
      >
        <MultiSelectPicker
          v-model:open="labelPickerOpen"
          :empty-label="t('pullRequest.sidebar.noMatches')"
          :loading="repositoryLabelsQuery.isLoading.value"
          :loading-label="t('pullRequest.sidebar.loading')"
          :model-value="labelNames"
          :options="labelOptions"
          :pending-ids="pendingLabelIds"
          :search-placeholder="t('pullRequest.sidebar.searchLabels')"
          :trigger-label="t('pullRequest.sidebar.edit')"
          @update:model-value="onLabelsChange"
        >
          <template #option="{ option }">
            <LabelBadge :label="{ name: option.label, color: labelColorByName.get(option.id) ?? '' }" />
          </template>
        </MultiSelectPicker>
      </template>
      <WorkItemLabelList
        :empty-label="t('pullRequest.sidebar.empty.labels')"
        :labels="labels"
      />
    </WorkItemSidebarSection>

    <WorkItemSidebarSection :title="t('pullRequest.sidebar.sections.milestone')">
      <template
        v-if="pullRequest.viewerCanUpdate"
        #action
      >
        <MultiSelectPicker
          :empty-label="t('pullRequest.sidebar.noMatches')"
          :model-value="milestoneIds"
          :options="milestoneOptions"
          :pending-ids="pendingMilestoneIds"
          :search-placeholder="t('pullRequest.sidebar.searchMilestones')"
          :trigger-label="t('pullRequest.sidebar.edit')"
          single
          @update:model-value="onMilestoneSelect"
        />
      </template>
      <div
        v-if="pullRequest.milestone"
        class="grid gap-1 text-body"
      >
        <a
          v-if="pullRequest.milestone.url"
          class="truncate font-medium text-foreground underline-offset-4 outline-hidden hover:underline focus-visible:underline"
          :href="pullRequest.milestone.url"
          rel="noreferrer"
          target="_blank"
        >
          {{ pullRequest.milestone.title }}
        </a>
        <span
          v-else
          class="truncate font-medium text-foreground"
        >
          {{ pullRequest.milestone.title }}
        </span>
        <span
          v-if="pullRequest.milestone.dueOn"
          class="text-muted-foreground"
        >
          {{ t('pullRequest.sidebar.dates.due', { date: formatDate(pullRequest.milestone.dueOn) }) }}
        </span>
      </div>
      <p
        v-else
        class="text-body text-muted-foreground"
      >
        {{ t('pullRequest.sidebar.empty.milestone') }}
      </p>
    </WorkItemSidebarSection>

    <WorkItemSidebarSection :title="t('pullRequest.sidebar.sections.linkedIssues')">
      <div
        v-if="linkedIssues.length > 0"
        class="grid min-w-0 gap-1.5"
      >
        <GitHubReferenceLink
          v-for="issue in linkedIssues"
          :key="issue.id"
          class="text-body"
          :current-owner="pullRequest.owner"
          :current-repo="pullRequest.repo"
          :fallback-href="issue.url"
          initial-kind="issue"
          :initial-state="issue.state"
          :initial-title="issue.title"
          kind-hint="issue"
          :number="issue.number"
          :owner="issue.owner"
          :repo="issue.repo"
        />
      </div>
      <p
        v-else
        class="text-body text-muted-foreground"
      >
        {{ t('pullRequest.sidebar.empty.linkedIssues') }}
      </p>
    </WorkItemSidebarSection>

    <WorkItemSidebarSection :title="t('pullRequest.sidebar.sections.branches')">
      <div class="grid gap-2.5">
        <div
          v-for="branch in [pullRequest.baseBranch, pullRequest.headBranch]"
          :key="`${branch.repository ?? pullRequest.repository}:${branch.name}`"
          class="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-2 text-body"
        >
          <GitBranch class="mt-0.5 size-3.5 text-muted-foreground" />
          <div class="min-w-0">
            <div class="truncate text-muted-foreground">
              {{ branch === pullRequest.baseBranch ? t('pullRequest.sidebar.branches.base') : t('pullRequest.sidebar.branches.head') }}
            </div>
            <a
              v-if="branch.url"
              class="block truncate font-medium text-foreground underline-offset-4 outline-hidden hover:underline focus-visible:underline"
              :href="branch.url"
              rel="noreferrer"
              target="_blank"
            >
              {{ branch.repository ? `${branch.repository}:${branch.name}` : branch.name }}
            </a>
            <div
              v-else
              class="truncate font-medium text-foreground"
            >
              {{ branch.repository ? `${branch.repository}:${branch.name}` : branch.name }}
            </div>
          </div>
        </div>
      </div>
    </WorkItemSidebarSection>

    <WorkItemSidebarSection :title="t('pullRequest.sidebar.sections.diff')">
      <div class="grid gap-2.5">
        <div
          v-for="item in diffItems"
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

    <WorkItemSidebarSection :title="t('pullRequest.sidebar.sections.projects')">
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
        {{ t('pullRequest.sidebar.empty.projects') }}
      </p>
    </WorkItemSidebarSection>

    <WorkItemSidebarSection :title="t('pullRequest.sidebar.sections.dates')">
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

    <WorkItemSidebarSection :title="t('pullRequest.sidebar.sections.participants')">
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
        {{ t('pullRequest.sidebar.empty.participants') }}
      </p>
    </WorkItemSidebarSection>

    <WorkItemSidebarSection
      v-if="latestReviews.length > 0"
      :title="t('pullRequest.sidebar.sections.latestReviews')"
    >
      <div class="grid gap-2.5">
        <a
          v-for="review in latestReviews"
          :key="review.id"
          class="grid min-w-0 gap-1 rounded-md p-1 -m-1 text-body outline-hidden underline-offset-4 hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring/30"
          :href="review.url"
          rel="noreferrer"
          target="_blank"
        >
          <span class="flex min-w-0 items-center justify-between gap-2">
            <GitHubActorLink
              :avatar-url="review.author.avatarUrl"
              :interactive="false"
              :login="review.author.login"
            />
            <span class="shrink-0 text-muted-foreground">{{ t(`pullRequest.reviewStates.${review.state}`) }}</span>
          </span>
          <span
            v-if="review.body"
            class="line-clamp-2 text-muted-foreground"
          >
            {{ review.body }}
          </span>
        </a>
      </div>
    </WorkItemSidebarSection>
  </aside>
</template>
