<script setup lang="ts">
import type { ConversationActor } from '@/components/conversation/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge, Button, Card } from '@oh-my-github/ui'
import GitHubMarkdownRenderer from '@/components/github/github-markdown-renderer.vue'
import ShikiDiff from '@/components/code/shiki-diff.vue'
import ConversationActorLine from '@/components/conversation/conversation-actor-line.vue'
import ConversationCommentComposer from '@/components/conversation/conversation-comment-composer.vue'
import { trimDiffHunk } from '@/components/code/diff-hunk'
import {
  replyToPullRequestReviewThread,
  setPullRequestReviewThreadResolved,
} from '@/composables/github/use-pull-requests'

const props = defineProps<{
  owner: string
  repo: string
  number: number
  thread: GitHubPullRequestReviewThread
  highlighted: boolean
}>()

const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()

const collapsed = ref(props.thread.isResolved)
const isReplying = ref(false)
const replyBody = ref('')
const replyError = ref<string | null>(null)
const isSubmittingReply = ref(false)
const isTogglingResolved = ref(false)
const actionError = ref<string | null>(null)

const rootComment = computed(() => props.thread.comments[0] ?? null)
const trimmedHunk = computed(() => trimDiffHunk(rootComment.value?.diffHunk ?? null))
// Replies to pending comments 404 on the REST endpoint (they are not
// published yet), so replying is gated on the thread being submitted.
const canReply = computed(() =>
  props.thread.viewerCanReply
  && !props.thread.isPending
  && rootComment.value !== null
  && rootComment.value.databaseId !== null
)
const canToggleResolved = computed(() =>
  props.thread.isResolved ? props.thread.viewerCanUnresolve : props.thread.viewerCanResolve
)

const lineLabel = computed(() => {
  const { startLine, line, side, path } = props.thread
  if (line === null) return `${path} · ${t('pullRequest.review.threads.outdatedLine')}`
  const range = startLine === null ? `L${line}` : `L${startLine}–L${line}`
  return side === 'LEFT'
    ? `${path} · ${range} ${t('pullRequest.review.anchor.oldSide')}`
    : `${path} · ${range}`
})

function toCommentActor(author: GitHubActor): ConversationActor {
  return {
    login: author.login,
    avatarUrl: author.avatarUrl ?? undefined,
    isBot: author.isBot ?? undefined,
  }
}

async function submitReply(): Promise<void> {
  const databaseId = rootComment.value?.databaseId
  const body = replyBody.value.trim()
  if (!databaseId || !body || isSubmittingReply.value) return

  isSubmittingReply.value = true
  replyError.value = null

  try {
    await replyToPullRequestReviewThread(props.owner, props.repo, props.number, {
      commentDatabaseId: databaseId,
      body,
    })
    replyBody.value = ''
    isReplying.value = false
    emit('changed')
  } catch {
    replyError.value = t('pullRequest.review.threads.replyError')
  } finally {
    isSubmittingReply.value = false
  }
}

async function toggleResolved(): Promise<void> {
  if (isTogglingResolved.value) return

  isTogglingResolved.value = true
  actionError.value = null

  try {
    await setPullRequestReviewThreadResolved(props.owner, props.repo, props.thread.id, !props.thread.isResolved)
    emit('changed')
  } catch {
    actionError.value = t('pullRequest.review.threads.resolveError')
  } finally {
    isTogglingResolved.value = false
  }
}
</script>

<template>
  <Card
    class="grid min-w-0 gap-3 rounded-lg p-3 transition-colors"
    :class="highlighted ? 'bg-accent' : ''"
    :data-thread-id="thread.id"
  >
    <div class="flex min-w-0 flex-wrap items-center gap-2">
      <button
        class="min-w-0 flex-1 truncate text-left font-mono text-body text-foreground"
        type="button"
        @click="collapsed = !collapsed"
      >
        {{ lineLabel }}
      </button>
      <Badge
        v-if="thread.isPending"
        size="sm"
        variant="secondary"
      >
        {{ t('pullRequest.review.threads.pendingBadge') }}
      </Badge>
      <Badge
        v-if="thread.isOutdated"
        size="sm"
        variant="warning"
      >
        {{ t('pullRequest.review.threads.outdatedBadge') }}
      </Badge>
      <Badge
        v-if="thread.isResolved"
        size="sm"
        variant="secondary"
      >
        {{ t('pullRequest.review.threads.resolvedBadge') }}
      </Badge>
      <Button
        v-if="canToggleResolved"
        :disabled="isTogglingResolved"
        :loading="isTogglingResolved"
        loading-mode="leading"
        size="sm"
        type="button"
        variant="outline"
        @click="toggleResolved"
      >
        {{ thread.isResolved ? t('pullRequest.review.threads.unresolve') : t('pullRequest.review.threads.resolve') }}
      </Button>
    </div>

    <template v-if="!collapsed">
      <div
        v-if="trimmedHunk"
        class="min-w-0 overflow-x-auto rounded-md border border-border"
      >
        <ShikiDiff
          :filename="thread.path"
          :patch="trimmedHunk"
        />
      </div>

      <div
        v-for="comment in thread.comments"
        :key="comment.id"
        class="grid min-w-0 gap-1.5"
      >
        <ConversationActorLine
          :actor="toCommentActor(comment.author)"
          :created-at="comment.createdAt"
        />
        <GitHubMarkdownRenderer
          class="rich-content-markdown--compact"
          :content="comment.body"
          :owner="owner"
          :repo="repo"
        />
      </div>

      <p
        v-if="actionError"
        class="text-body text-destructive"
        role="alert"
      >
        {{ actionError }}
      </p>

      <div v-if="canReply">
        <Button
          v-if="!isReplying"
          size="sm"
          type="button"
          variant="outline"
          @click="isReplying = true"
        >
          {{ t('pullRequest.review.threads.reply') }}
        </Button>
        <ConversationCommentComposer
          v-else
          v-model="replyBody"
          :error="replyError"
          i18n-scope="pullRequest.review.replyComposer"
          :is-submitting="isSubmittingReply"
          :owner="owner"
          :repo="repo"
          @submit="submitReply"
        />
      </div>
    </template>
  </Card>
</template>
