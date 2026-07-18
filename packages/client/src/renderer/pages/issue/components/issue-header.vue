<script setup lang="ts">
import type { IssueDetail } from './types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from '@oh-my-github/ui'
import { Bell, BellOff, Check, Lock, MoreHorizontal, Pencil, Pin, Trash2, Unlock, X } from 'lucide-vue-next'
import { GitHubActorLink, WorkItemStateBadge } from '@/components'
import {
  deleteIssue,
  setIssueLock,
  setIssuePinned,
  setIssueSubscription,
  updateIssue,
  useIssueListInvalidation,
} from '@/composables/github/use-issues'
import { useToast } from '@/composables/use-toast'

const props = defineProps<{
  issue: IssueDetail
  repository: string
}>()

const emit = defineEmits<{ refetch: [] }>()

const { t } = useI18n()
const router = useRouter()
const { invalidateIssueLists } = useIssueListInvalidation()
const toast = useToast()

const issueNumber = computed(() => `#${props.issue.number}`)
const createdAt = computed(() => formatDate(props.issue.createdAt))
const updatedAt = computed(() => formatDate(props.issue.updatedAt))
const stateLabel = computed(() => {
  const state = normalizeState(props.issue.state)

  return t(`issue.states.${state}`)
})
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
const isEditingTitle = ref(false)
const titleDraft = ref('')
const titleError = ref<string | null>(null)
const isSavingTitle = ref(false)

const isBusy = ref(false)
const isDeleteDialogOpen = ref(false)
const nodeId = computed(() => props.issue.nodeId ?? '')
const isSubscribed = computed(() => props.issue.viewerSubscription === 'SUBSCRIBED')
const isLocked = computed(() => Boolean(props.issue.locked))
const isPinned = computed(() => Boolean(props.issue.isPinned))

async function runAction(action: () => Promise<void>, successMessage: string): Promise<void> {
  if (isBusy.value) return
  isBusy.value = true
  try {
    await action()
    toast.success(successMessage)
    emit('refetch')
  } catch {
    toast.error(t('issue.toasts.actionFailed'))
  } finally {
    isBusy.value = false
  }
}

function toggleSubscription(): void {
  if (!nodeId.value) return
  const nextSubscribed = !isSubscribed.value
  void runAction(
    () => setIssueSubscription(nodeId.value, nextSubscribed),
    t(nextSubscribed ? 'issue.toasts.subscribed' : 'issue.toasts.unsubscribed'),
  )
}

function toggleLock(): void {
  const nextLocked = !isLocked.value
  void runAction(
    () => setIssueLock(props.issue.owner, props.issue.repo, props.issue.number, nextLocked),
    t(nextLocked ? 'issue.toasts.locked' : 'issue.toasts.unlocked'),
  )
}

function togglePin(): void {
  if (!nodeId.value) return
  const nextPinned = !isPinned.value
  void runAction(
    () => setIssuePinned(nodeId.value, nextPinned),
    t(nextPinned ? 'issue.toasts.pinned' : 'issue.toasts.unpinned'),
  )
}

function openDeleteDialog(): void {
  isDeleteDialogOpen.value = true
}

async function confirmDelete(): Promise<void> {
  if (!nodeId.value || isBusy.value) return

  isBusy.value = true

  try {
    await deleteIssue(nodeId.value)
    isDeleteDialogOpen.value = false
    toast.success(t('issue.toasts.deleted'))
    emit('refetch')
    invalidateIssueLists(props.issue.owner, props.issue.repo)
  } catch {
    toast.error(t('issue.toasts.deleteFailed'))
  } finally {
    isBusy.value = false
  }
}

function openRepository(): void {
  if (!repositoryUrl.value) return

  void router.push(repositoryUrl.value)
}

function startTitleEdit(): void {
  if (!props.issue.viewerCanUpdate) return

  titleDraft.value = props.issue.title
  titleError.value = null
  isEditingTitle.value = true
}

function cancelTitleEdit(): void {
  titleDraft.value = ''
  titleError.value = null
  isEditingTitle.value = false
}

async function saveTitle(): Promise<void> {
  const nextTitle = titleDraft.value.trim()
  if (!props.issue.viewerCanUpdate || !nextTitle || isSavingTitle.value) return

  if (nextTitle === props.issue.title) {
    cancelTitleEdit()
    return
  }

  isSavingTitle.value = true
  titleError.value = null

  try {
    await updateIssue(props.issue.owner, props.issue.repo, props.issue.number, {
      title: nextTitle,
    })
    cancelTitleEdit()
    toast.success(t('issue.toasts.titleUpdated'))
    emit('refetch')
    invalidateIssueLists(props.issue.owner, props.issue.repo)
  } catch {
    titleError.value = t('issue.edit.titleError')
  } finally {
    isSavingTitle.value = false
  }
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
      <div class="grid min-w-0 gap-2 md:flex-1">
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
          @submit.prevent="saveTitle"
        >
          <div class="flex min-w-0 items-center gap-2">
            <Input
              v-model="titleDraft"
              :aria-label="t('issue.edit.titleInput')"
              class="min-w-0 flex-1"
              :disabled="isSavingTitle"
              size="lg"
            />
            <Button
              :aria-label="t('issue.edit.cancelTitle')"
              class="size-9"
              :disabled="isSavingTitle"
              size="icon"
              type="button"
              variant="outline"
              @click="cancelTitleEdit"
            >
              <X class="size-4" />
            </Button>
            <Button
              :aria-label="t('issue.edit.saveTitle')"
              class="size-9"
              :disabled="!titleDraft.trim()"
              :loading="isSavingTitle"
              size="icon"
              type="submit"
            >
              <Check class="size-4" />
            </Button>
          </div>
          <p
            v-if="titleError"
            class="text-body text-destructive"
            role="alert"
          >
            {{ titleError }}
          </p>
        </form>
        <div
          v-else
          class="flex min-w-0 items-center gap-2"
        >
          <h1 class="min-w-0 text-heading font-semibold leading-tight text-foreground">
            {{ issue.title }}
          </h1>
          <Button
            v-if="issue.viewerCanUpdate"
            :aria-label="t('issue.edit.editTitle')"
            class="size-7 shrink-0 text-muted-foreground"
            size="icon-sm"
            type="button"
            variant="ghost"
            @click="startTitleEdit"
          >
            <Pencil class="size-3.5" />
          </Button>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
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
            <DropdownMenuItem
              :disabled="isBusy || !nodeId"
              @select="toggleSubscription"
            >
              <component
                :is="isSubscribed ? BellOff : Bell"
                class="size-3.5"
              />
              <span>{{ isSubscribed ? t('issue.actions.unsubscribe') : t('issue.actions.subscribe') }}</span>
            </DropdownMenuItem>
            <template v-if="issue.viewerCanUpdate">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                :disabled="isBusy"
                @select="toggleLock"
              >
                <component
                  :is="isLocked ? Unlock : Lock"
                  class="size-3.5"
                />
                <span>{{ isLocked ? t('issue.actions.unlock') : t('issue.actions.lock') }}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                :disabled="isBusy || !nodeId"
                @select="togglePin"
              >
                <Pin class="size-3.5" />
                <span>{{ isPinned ? t('issue.actions.unpin') : t('issue.actions.pin') }}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                :disabled="isBusy || !nodeId"
                variant="destructive"
                @select="openDeleteDialog"
              >
                <Trash2 class="size-3.5" />
                <span>{{ t('issue.actions.delete') }}</span>
              </DropdownMenuItem>
            </template>
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

    <Dialog v-model:open="isDeleteDialogOpen">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{{ t('issue.actions.deleteConfirmTitle') }}</DialogTitle>
          <DialogDescription>{{ t('issue.actions.deleteConfirmDescription') }}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            :disabled="isBusy"
            size="sm"
            type="button"
            variant="outline"
            @click="isDeleteDialogOpen = false"
          >
            {{ t('issue.actions.cancel') }}
          </Button>
          <Button
            :disabled="isBusy"
            size="sm"
            type="button"
            variant="destructive"
            @click="confirmDelete"
          >
            {{ t('issue.actions.delete') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </header>
</template>
