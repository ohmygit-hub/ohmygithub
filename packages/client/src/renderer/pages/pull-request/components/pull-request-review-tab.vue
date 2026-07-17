<script setup lang="ts">
import type { PullRequestDetail } from './types'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from '@oh-my-github/ui'
import { AlertCircle, FileDiff } from 'lucide-vue-next'
import { ChangedFilesTree, ConversationCommentComposer } from '@/components'
import {
  submitPullRequestReview,
  usePullRequestFilesQuery,
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

const reviewBody = ref('')
const reviewError = ref<string | null>(null)
const submittingEvent = ref<GitHubPullRequestReviewEvent | null>(null)
const viewerLogin = ref<string | null>(null)

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
  if (submittingEvent.value) return

  const body = reviewBody.value.trim()
  if (!body && event !== 'APPROVE') return

  submittingEvent.value = event
  reviewError.value = null

  try {
    await submitPullRequestReview(props.owner, props.repo, props.number, {
      event,
      ...(body ? { body } : {}),
    })
    reviewBody.value = ''
    emit('refetch')
  } catch {
    reviewError.value = t('pullRequest.review.error')
  } finally {
    submittingEvent.value = null
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
          v-if="isOwnPullRequest"
          class="text-body text-muted-foreground"
        >
          {{ t('pullRequest.review.ownPullRequest') }}
        </span>
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
          <div class="flex shrink-0 items-center gap-2">
            <Button
              :disabled="!hasBody || Boolean(submittingEvent)"
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
              :disabled="isOwnPullRequest || !hasBody || Boolean(submittingEvent)"
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
  </div>
</template>
