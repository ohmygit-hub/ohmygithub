<script setup lang="ts">
import type { ConversationActor, ConversationBadge } from '@/components/conversation/types'
import type { PullRequestReviewCommentSummary } from './types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge, Card } from '@oh-my-github/ui'
import GitHubMarkdownRenderer from '@/components/github/github-markdown-renderer.vue'
import ShikiDiff from '@/components/code/shiki-diff.vue'
import ConversationActorLine from '@/components/conversation/conversation-actor-line.vue'
import ConversationReactionBar from '@/components/conversation/conversation-reaction-bar.vue'
import { hasRenderableText } from '@/components/conversation/format'
import { trimDiffHunk } from '@/components/code/diff-hunk'

const props = defineProps<{
  actor: ConversationActor
  createdAt?: string | null
  body: string
  reviewState: GitHubPullRequestReviewState
  comments: PullRequestReviewCommentSummary[]
  owner: string
  repo: string
  canReact?: boolean
}>()

const emit = defineEmits<{
  'reaction-toggle': [subjectId: string, content: string, reacted: boolean]
}>()

const { t } = useI18n()

const stateBadge = computed<ConversationBadge>(() => ({
  id: 'review-state',
  label: t(`pullRequest.reviewStates.${props.reviewState}`),
  variant: props.reviewState === 'approved'
    ? 'success'
    : props.reviewState === 'changes_requested'
      ? 'destructive'
      : 'secondary',
}))
const hasBody = computed(() => hasRenderableText(props.body))
const commentBlocks = computed(() => props.comments.map((comment) => ({
  ...comment,
  trimmedHunk: trimDiffHunk(comment.diffHunk),
  showReactionBar: props.canReact || (comment.reactions ?? []).some((reaction) => reaction.count > 0),
})))

function toCommentActor(author: GitHubActor): ConversationActor {
  return {
    login: author.login,
    avatarUrl: author.avatarUrl ?? undefined,
    isBot: author.isBot ?? undefined,
  }
}
</script>

<template>
  <div class="grid min-w-0 gap-3">
    <Card
      v-if="hasBody || $slots.default"
      class="gap-0 overflow-hidden rounded-lg py-0"
    >
      <div class="flex min-h-10 min-w-0 items-center justify-between gap-3 px-3 py-1.5" :class="hasBody ? 'border-b border-border' : ''">
        <ConversationActorLine
          class="min-w-0 flex-1"
          :actor="actor"
          :badges="[stateBadge]"
          :created-at="createdAt"
          :show-avatar="false"
        />
      </div>

      <div
        v-if="hasBody"
        class="min-w-0 px-3 py-2"
      >
        <GitHubMarkdownRenderer
          class="rich-content-markdown--compact"
          :content="body"
          :owner="owner"
          :repo="repo"
        />
      </div>
    </Card>

    <div
      v-else
      class="flex min-h-8 min-w-0 items-center"
    >
      <ConversationActorLine
        class="min-w-0 flex-1"
        :actor="actor"
        :badges="[stateBadge]"
        :created-at="createdAt"
        :show-avatar="false"
      />
    </div>

    <div
      v-if="commentBlocks.length > 0"
      class="grid min-w-0 gap-3 sm:pl-6"
    >
      <div
        v-for="comment in commentBlocks"
        :key="comment.id"
        class="min-w-0 overflow-hidden rounded-lg border border-border bg-card"
      >
        <div class="flex min-w-0 items-center gap-2 border-b border-border bg-muted/40 px-3 py-1.5">
          <span class="min-w-0 truncate font-mono text-caption text-foreground">{{ comment.path }}</span>
          <Badge
            v-if="comment.outdated"
            size="sm"
            variant="warning"
          >
            {{ t('pullRequest.review.outdated') }}
          </Badge>
        </div>

        <div
          v-if="comment.trimmedHunk"
          class="min-w-0 overflow-x-auto border-b border-border"
        >
          <ShikiDiff
            :filename="comment.path"
            :patch="comment.trimmedHunk"
          />
        </div>

        <div class="grid min-w-0 gap-2 px-3 py-2">
          <ConversationActorLine
            :actor="toCommentActor(comment.author)"
            :badges="comment.isReply ? [{ id: 'reply', label: t('pullRequest.review.reply') }] : []"
            :created-at="comment.createdAt"
          />
          <GitHubMarkdownRenderer
            class="rich-content-markdown--compact"
            :content="comment.body"
            :owner="owner"
            :repo="repo"
          />
          <ConversationReactionBar
            v-if="comment.showReactionBar"
            :can-react="canReact"
            :reactions="comment.reactions"
            @toggle="(content, reacted) => emit('reaction-toggle', comment.nodeId, content, reacted)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
