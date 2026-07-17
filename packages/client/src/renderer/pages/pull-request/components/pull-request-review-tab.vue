<script setup lang="ts">
import type { PullRequestDetail } from './types'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from '@oh-my-github/ui'
import { AlertCircle, FileDiff, MessageSquarePlus, X } from 'lucide-vue-next'
import { ChangedFilesTree, ConversationCommentComposer } from '@/components'
import { useReviewSelection } from '@/composables/use-review-selection'
import {
  addPullRequestReviewThread,
  discardPendingPullRequestReview,
  submitPendingPullRequestReview,
  submitPullRequestReview,
  usePullRequestFilesQuery,
  usePullRequestReviewThreadsQuery,
  useReviewThreadsInvalidation,
} from '@/composables/github/use-pull-requests'

const props = defineProps<{
  active: boolean
  owner: string
  repo: string
  number: number
  pullRequest: PullRequestDetail
}>()

const emit = defineEmits<{ refetch: [] }>()

const { t } = useI18n()

const filesQuery = usePullRequestFilesQuery(
  () => props.owner,
  () => props.repo,
  () => props.number,
  () => props.active,
)
const files = computed(() => filesQuery.data.value ?? [])
const isLoadingFiles = computed(() => filesQuery.isLoading.value && files.value.length === 0)
const hasFilesError = computed(() => Boolean(filesQuery.error.value))
const showFilesEmpty = computed(() =>
  !isLoadingFiles.value
  && !hasFilesError.value
  && files.value.length === 0
)

const threadsQuery = usePullRequestReviewThreadsQuery(
  () => props.owner,
  () => props.repo,
  () => props.number,
  () => props.active,
)
const pendingReview = computed(() => threadsQuery.data.value?.pendingReview ?? null)
const { invalidateReviewThreads } = useReviewThreadsInvalidation()
const { selection, clearSelection } = useReviewSelection()

const reviewBody = ref('')
const reviewError = ref<string | null>(null)
const submittingEvent = ref<GitHubPullRequestReviewEvent | null>(null)
const viewerLogin = ref<string | null>(null)
const isSubmittingThread = ref<'single' | 'review' | null>(null)
const isDiscardDialogOpen = ref(false)
const isDiscardingPending = ref(false)

const activeSelection = computed(() => {
  const value = selection.value
  if (!value) return null
  if (value.owner !== props.owner || value.repo !== props.repo || value.number !== props.number) return null
  return value
})

const anchorLabel = computed(() => {
  const anchor = activeSelection.value
  if (!anchor) return ''
  const range = anchor.startLine === null ? `L${anchor.line}` : `L${anchor.startLine}–L${anchor.line}`
  const label = t('pullRequest.review.anchor.commentingOn', { path: anchor.path, range })
  return anchor.side === 'LEFT' ? `${label} ${t('pullRequest.review.anchor.oldSide')}` : label
})

const isOwnPullRequest = computed(() =>
  viewerLogin.value !== null
  && viewerLogin.value === props.pullRequest.author.login
)
const hasBody = computed(() => Boolean(reviewBody.value.trim()))
const diffSummary = computed(() =>
  t('pullRequest.review.diffSummary', {
    files: props.pullRequest.diffStats.changedFiles,
    additions: props.pullRequest.diffStats.additions,
    deletions: props.pullRequest.diffStats.deletions,
  })
)

onMounted(async () => {
  try {
    const authState = await window.ohMyGithub?.auth?.get?.()
    viewerLogin.value = authState?.auth?.viewer?.login ?? null
  } catch {
    viewerLogin.value = null
  }
})

function retryFiles(): void {
  void filesQuery.refetch()
}

async function submitReview(event: GitHubPullRequestReviewEvent): Promise<void> {
  if (submittingEvent.value || isSubmittingThread.value) return

  const pending = pendingReview.value
  const body = reviewBody.value.trim()
  if (!body && event !== 'APPROVE' && !pending) return

  submittingEvent.value = event
  reviewError.value = null

  try {
    if (pending) {
      await submitPendingPullRequestReview(props.owner, props.repo, props.number, {
        reviewId: pending.id,
        event,
        ...(body ? { body } : {}),
      })
    } else {
      await submitPullRequestReview(props.owner, props.repo, props.number, {
        event,
        ...(body ? { body } : {}),
      })
    }
    reviewBody.value = ''
    invalidateReviewThreads(props.owner, props.repo, props.number)
    emit('refetch')
  } catch {
    reviewError.value = t('pullRequest.review.error')
  } finally {
    submittingEvent.value = null
  }
}

async function submitLineComment(mode: 'single' | 'review'): Promise<void> {
  const anchor = activeSelection.value
  const body = reviewBody.value.trim()
  if (!anchor || !body || isSubmittingThread.value || submittingEvent.value) return

  isSubmittingThread.value = mode
  reviewError.value = null

  try {
    await addPullRequestReviewThread(props.owner, props.repo, props.number, {
      pullRequestId: props.pullRequest.nodeId,
      pendingReviewId: pendingReview.value?.id ?? null,
      mode,
      path: anchor.path,
      side: anchor.side,
      line: anchor.line,
      startLine: anchor.startLine,
      startSide: anchor.startLine === null ? null : anchor.side,
      body,
    })
    reviewBody.value = ''
    clearSelection()
    invalidateReviewThreads(props.owner, props.repo, props.number)
    emit('refetch')
  } catch {
    reviewError.value = t('pullRequest.review.threadError')
  } finally {
    isSubmittingThread.value = null
  }
}

async function discardPendingReview(): Promise<void> {
  const pending = pendingReview.value
  if (!pending || isDiscardingPending.value) return

  isDiscardingPending.value = true
  reviewError.value = null

  try {
    await discardPendingPullRequestReview(props.owner, props.repo, pending.id)
    isDiscardDialogOpen.value = false
    invalidateReviewThreads(props.owner, props.repo, props.number)
    emit('refetch')
  } catch {
    reviewError.value = t('pullRequest.review.pending.discardError')
  } finally {
    isDiscardingPending.value = false
  }
}
</script>

<template>
  <div class="grid min-w-0 content-start gap-4">
    <section class="grid gap-3">
      <div class="flex flex-wrap items-baseline gap-2">
        <h2 class="text-title font-medium text-foreground">
          {{ t('pullRequest.review.title') }}
        </h2>
        <span
          v-if="pendingReview"
          class="select-none text-body text-muted-foreground"
        >
          {{ t('pullRequest.review.pending.count', { count: pendingReview.commentCount }) }}
        </span>
        <span
          v-else-if="isOwnPullRequest"
          class="text-body text-muted-foreground"
        >
          {{ t('pullRequest.review.ownPullRequest') }}
        </span>
      </div>

      <div
        v-if="activeSelection"
        class="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
      >
        <MessageSquarePlus class="size-4 shrink-0 text-muted-foreground" />
        <span class="min-w-0 flex-1 truncate text-body text-foreground">{{ anchorLabel }}</span>
        <Button
          :aria-label="t('pullRequest.review.anchor.clear')"
          size="icon-sm"
          type="button"
          variant="ghost"
          @click="clearSelection"
        >
          <X class="size-3.5" />
        </Button>
      </div>

      <ConversationCommentComposer
        v-model="reviewBody"
        :error="reviewError"
        i18n-scope="pullRequest.review"
        :is-submitting="Boolean(submittingEvent)"
        :owner="owner"
        :repo="repo"
      >
        <template #actions>
          <div
            v-if="activeSelection"
            class="flex shrink-0 items-center gap-2"
          >
            <Button
              :disabled="!hasBody || Boolean(pendingReview) || Boolean(isSubmittingThread)"
              :loading="isSubmittingThread === 'single'"
              loading-mode="leading"
              size="sm"
              :title="pendingReview ? t('pullRequest.review.singleDisabledPending') : undefined"
              type="button"
              variant="outline"
              @click="submitLineComment('single')"
            >
              {{ t('pullRequest.review.addSingleComment') }}
            </Button>
            <Button
              :disabled="!hasBody || Boolean(isSubmittingThread)"
              :loading="isSubmittingThread === 'review'"
              loading-mode="leading"
              size="sm"
              type="button"
              @click="submitLineComment('review')"
            >
              {{ t('pullRequest.review.addToReview') }}
            </Button>
          </div>
          <div
            v-else
            class="flex shrink-0 items-center gap-2"
          >
            <Button
              v-if="pendingReview"
              :disabled="Boolean(submittingEvent) || isDiscardingPending"
              size="sm"
              type="button"
              variant="ghost"
              @click="isDiscardDialogOpen = true"
            >
              {{ t('pullRequest.review.pending.discard') }}
            </Button>
            <Button
              :disabled="(!hasBody && !pendingReview) || Boolean(submittingEvent)"
              :loading="submittingEvent === 'COMMENT'"
              loading-mode="leading"
              size="sm"
              type="button"
              variant="outline"
              @click="submitReview('COMMENT')"
            >
              {{ t('pullRequest.review.comment') }}
            </Button>
            <Button
              :disabled="isOwnPullRequest || (!hasBody && !pendingReview) || Boolean(submittingEvent)"
              :loading="submittingEvent === 'REQUEST_CHANGES'"
              loading-mode="leading"
              size="sm"
              type="button"
              variant="outline"
              @click="submitReview('REQUEST_CHANGES')"
            >
              {{ t('pullRequest.review.requestChanges') }}
            </Button>
            <Button
              :disabled="isOwnPullRequest || Boolean(submittingEvent)"
              :loading="submittingEvent === 'APPROVE'"
              loading-mode="leading"
              size="sm"
              type="button"
              @click="submitReview('APPROVE')"
            >
              {{ t('pullRequest.review.approve') }}
            </Button>
          </div>
        </template>
      </ConversationCommentComposer>
    </section>

    <section class="grid gap-2">
      <div class="flex flex-wrap items-baseline gap-2">
        <h2 class="text-title font-medium text-foreground">
          {{ t('pullRequest.review.filesTitle') }}
        </h2>
        <span class="text-body text-muted-foreground">{{ diffSummary }}</span>
      </div>

      <div
        v-if="isLoadingFiles"
        class="grid gap-2 rounded-xl border border-border bg-card p-2"
      >
        <Skeleton
          v-for="index in 6"
          :key="index"
          class="h-7 rounded-md"
        />
      </div>

      <Empty
        v-else-if="hasFilesError"
        class="border border-border bg-card"
      >
        <EmptyHeader>
          <EmptyMedia>
            <AlertCircle class="size-5" />
          </EmptyMedia>
          <EmptyTitle>
            {{ t('pullRequest.review.filesErrorTitle') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('pullRequest.review.filesErrorDescription') }}
          </EmptyDescription>
          <Button
            class="justify-self-center"
            size="sm"
            type="button"
            variant="outline"
            @click="retryFiles"
          >
            {{ t('pullRequest.review.retry') }}
          </Button>
        </EmptyHeader>
      </Empty>

      <Empty
        v-else-if="showFilesEmpty"
        class="border border-border bg-card"
      >
        <EmptyHeader>
          <EmptyMedia>
            <FileDiff class="size-5" />
          </EmptyMedia>
          <EmptyTitle>
            {{ t('pullRequest.review.filesEmptyTitle') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('pullRequest.review.filesEmptyDescription') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <div
        v-else
        class="rounded-xl border border-border bg-card p-2"
      >
        <ChangedFilesTree
          :files="files"
          :owner="owner"
          :pull-request-number="number"
          :repo="repo"
        />
      </div>
    </section>

    <Dialog v-model:open="isDiscardDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('pullRequest.review.pending.discardTitle') }}</DialogTitle>
          <DialogDescription>{{ t('pullRequest.review.pending.discardDescription') }}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            :disabled="isDiscardingPending"
            type="button"
            variant="ghost"
            @click="isDiscardDialogOpen = false"
          >
            {{ t('pullRequest.review.pending.discardCancel') }}
          </Button>
          <Button
            :loading="isDiscardingPending"
            loading-mode="leading"
            type="button"
            variant="destructive"
            @click="discardPendingReview"
          >
            {{ t('pullRequest.review.pending.discardConfirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
