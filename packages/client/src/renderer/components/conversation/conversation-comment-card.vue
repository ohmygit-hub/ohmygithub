<script setup lang="ts">
import type {
  ConversationActor,
  ConversationBadge,
  ConversationComment,
  ConversationReaction,
} from './types'
import { computed } from 'vue'
import { Card } from '@oh-my-github/ui'
import MarkdownRenderer from '../markdown/markdown-renderer.vue'
import ConversationActorLine from './conversation-actor-line.vue'
import ConversationReactionBar from './conversation-reaction-bar.vue'
import { hasRenderableText } from './format'

const props = defineProps<{
  commentId?: string
  comment?: ConversationComment
  actor?: ConversationActor | null
  author?: ConversationActor | null
  body?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  badges?: ConversationBadge[]
  reactions?: ConversationReaction[]
  emptyLabel?: string
  showAvatar?: boolean
}>()

const resolvedCommentId = computed(() => {
  const id = props.commentId ?? props.comment?.id

  return id === undefined ? undefined : String(id)
})
const resolvedActor = computed(() =>
  props.actor
  ?? props.author
  ?? props.comment?.actor
  ?? props.comment?.author
  ?? null
)
const resolvedBody = computed(() => props.body ?? props.comment?.body ?? '')
const resolvedCreatedAt = computed(() => props.createdAt ?? props.comment?.createdAt)
const resolvedUpdatedAt = computed(() => props.updatedAt ?? props.comment?.updatedAt)
const resolvedBadges = computed(() => props.badges ?? props.comment?.badges ?? [])
const resolvedReactions = computed(() => props.reactions ?? props.comment?.reactions ?? [])
const hasBody = computed(() => hasRenderableText(resolvedBody.value))
const hasReactions = computed(() => resolvedReactions.value.some((reaction) => reaction.count > 0))
</script>

<template>
  <Card
    :id="resolvedCommentId"
    :data-comment-id="resolvedCommentId"
    class="gap-0 overflow-hidden rounded-lg py-0"
  >
    <div
      v-if="resolvedActor || $slots.actions"
      class="flex min-h-10 min-w-0 items-center justify-between gap-3 border-b border-border px-3 py-1.5"
    >
      <ConversationActorLine
        v-if="resolvedActor"
        class="min-w-0 flex-1"
        :actor="resolvedActor"
        :badges="resolvedBadges"
        :created-at="resolvedCreatedAt"
        :show-avatar="showAvatar ?? true"
        :updated-at="resolvedUpdatedAt"
      />

      <div
        v-if="$slots.actions"
        class="flex shrink-0 items-center gap-1"
      >
        <slot name="actions" />
      </div>
    </div>

    <div
      v-if="hasBody || emptyLabel"
      class="min-w-0 px-3 py-2"
    >
      <MarkdownRenderer
        v-if="hasBody"
        class="rich-content-markdown--compact"
        :content="resolvedBody"
      />
      <p
        v-else-if="emptyLabel"
        class="text-body text-muted-foreground"
      >
        {{ emptyLabel }}
      </p>
    </div>

    <div
      v-if="hasReactions || $slots.footer"
      class="flex items-center border-t border-border px-3 py-2"
    >
      <div class="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
        <ConversationReactionBar
          v-if="hasReactions"
          :reactions="resolvedReactions"
        />
        <div
          v-if="$slots.footer"
          class="min-w-0"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Card>
</template>
