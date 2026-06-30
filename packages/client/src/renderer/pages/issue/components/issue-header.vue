<script setup lang="ts">
import type {
  IssueDetail,
  IssueStateUpdatePayload,
  IssueTitleUpdatePayload,
} from './types'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from '@oh-my-github/ui'
import {
  Check,
  CircleDot,
  CircleOff,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  X,
} from 'lucide-vue-next'
import { GitHubActorLink, WorkItemStateBadge } from '../../../components'

const props = withDefaults(defineProps<{
  issue: IssueDetail
  repository: string
  isUpdatingTitle?: boolean
  isUpdatingState?: boolean
  titleActionsDisabled?: boolean
  stateActionsDisabled?: boolean
}>(), {
  isUpdatingTitle: false,
  isUpdatingState: false,
  titleActionsDisabled: false,
  stateActionsDisabled: false,
})

const emit = defineEmits<{
  updateTitle: [payload: IssueTitleUpdatePayload]
  updateState: [payload: IssueStateUpdatePayload]
}>()

const { t } = useI18n()
const router = useRouter()
const isEditingTitle = ref(false)
const titleDraft = ref(props.issue.title)

const issueNumber = computed(() => `#${props.issue.number}`)
const createdAt = computed(() => formatDate(props.issue.createdAt))
const updatedAt = computed(() => formatDate(props.issue.updatedAt))
const isIssueOpen = computed(() => props.issue.state === 'open')
const stateLabel = computed(() => {
  const state = normalizeState(props.issue.state)

  return t(`issue.states.${state}`)
})
const nextIssueState = computed<GitHubIssueUpdateState>(() => (isIssueOpen.value ? 'closed' : 'open'))
const stateToggleLabel = computed(() =>
  isIssueOpen.value ? t('issue.actions.closeIssue') : t('issue.actions.reopenIssue')
)
const updatedMeta = computed(() =>
  t('issue.meta.updated', {
    date: updatedAt.value,
  })
)
const repositoryUrl = computed(() =>
  props.issue.owner && props.issue.repo
    ? `/${encodeURIComponent(props.issue.owner)}/${encodeURIComponent(props.issue.repo)}`
    : null
)
const trimmedTitleDraft = computed(() => titleDraft.value.trim())
const canSaveTitle = computed(() =>
  trimmedTitleDraft.value.length > 0
  && trimmedTitleDraft.value !== props.issue.title.trim()
  && !props.isUpdatingTitle
  && !props.titleActionsDisabled
)

watch(() => props.issue.title, (title) => {
  if (!isEditingTitle.value) titleDraft.value = title
})

async function copyIssueUrl(): Promise<void> {
  if (!props.issue.url || !navigator.clipboard) return

  await navigator.clipboard.writeText(props.issue.url)
}

function startTitleEdit(): void {
  titleDraft.value = props.issue.title
  isEditingTitle.value = true
}

function cancelTitleEdit(): void {
  titleDraft.value = props.issue.title
  isEditingTitle.value = false
}

function submitTitleEdit(): void {
  if (!canSaveTitle.value) {
    if (trimmedTitleDraft.value === props.issue.title.trim()) cancelTitleEdit()
    return
  }

  emit('updateTitle', {
    title: trimmedTitleDraft.value,
  })
  isEditingTitle.value = false
}

function toggleIssueState(): void {
  if (props.isUpdatingState || props.stateActionsDisabled) return

  emit('updateState', {
    state: nextIssueState.value,
  })
}

function openRepository(): void {
  if (!repositoryUrl.value) return

  void router.push(repositoryUrl.value)
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
            kind="issue"
            :label="stateLabel"
            :state="issue.state"
          />
          <button
            v-if="repositoryUrl"
            class="truncate rounded-sm text-body text-muted-foreground outline-hidden underline-offset-4 hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline focus-visible:ring-2 focus-visible:ring-ring/30"
            type="button"
            @click="openRepository"
          >
            {{ repository }} {{ issueNumber }}
          </button>
          <span
            v-else
            class="truncate text-body text-muted-foreground"
          >
            {{ repository }} {{ issueNumber }}
          </span>
        </div>

        <form
          v-if="isEditingTitle"
          class="grid min-w-0 gap-2"
          @submit.prevent="submitTitleEdit"
        >
          <Input
            v-model="titleDraft"
            :aria-label="t('issue.title.inputLabel')"
            autofocus
            class="h-9 rounded-md text-heading font-semibold leading-tight tracking-normal"
            :disabled="isUpdatingTitle"
            size="lg"
            @keydown.esc.prevent="cancelTitleEdit"
          />
          <div class="flex min-w-0 flex-wrap items-center gap-1.5">
            <Button
              :disabled="!canSaveTitle"
              :loading="isUpdatingTitle"
              size="sm"
              type="submit"
              variant="primary"
            >
              <Check class="size-3.5" />
              <span>{{ t('issue.actions.saveTitle') }}</span>
            </Button>
            <Button
              :disabled="isUpdatingTitle"
              size="sm"
              type="button"
              variant="outline"
              @click="cancelTitleEdit"
            >
              <X class="size-3.5" />
              <span>{{ t('issue.actions.cancelTitleEdit') }}</span>
            </Button>
          </div>
        </form>

        <div
          v-else
          class="flex min-w-0 items-start gap-1.5"
        >
          <h1 class="min-w-0 text-heading font-semibold leading-tight text-foreground">
            {{ issue.title }}
          </h1>
          <Button
            :aria-label="t('issue.actions.editTitle')"
            class="mt-0.5 text-muted-foreground"
            :disabled="titleActionsDisabled"
            size="icon-sm"
            :title="t('issue.actions.editTitle')"
            type="button"
            variant="ghost"
            @click="startTitleEdit"
          >
            <Pencil class="size-3.5" />
          </Button>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <Button
          :aria-label="stateToggleLabel"
          :disabled="stateActionsDisabled"
          :loading="isUpdatingState"
          size="sm"
          type="button"
          variant="outline"
          @click="toggleIssueState"
        >
          <CircleOff
            v-if="isIssueOpen"
            class="size-3.5"
          />
          <CircleDot
            v-else
            class="size-3.5"
          />
          <span>{{ stateToggleLabel }}</span>
        </Button>

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
      <span class="shrink-0">{{ t('issue.meta.createdByPrefix') }}</span>
      <GitHubActorLink
        class="text-body"
        :avatar-url="issue.author.avatarUrl"
        :login="issue.author.login"
        :show-avatar="false"
      />
      <span class="truncate">{{ t('issue.meta.createdByDate', { date: createdAt }) }}</span>
      <span aria-hidden="true">·</span>
      <span class="truncate">{{ updatedMeta }}</span>
    </div>
  </header>
</template>
