<script setup lang="ts">
import type { ConversationActor, ConversationBadge, ConversationReaction } from './types'
import { computed } from 'vue'
import { Card } from '@oh-my-github/ui'
import MarkdownRenderer from '../markdown/markdown-renderer.vue'
import ConversationActorLine from './conversation-actor-line.vue'
import ConversationReactionBar from './conversation-reaction-bar.vue'
import { hasRenderableText } from './format'

const props = defineProps<{
  actor?: ConversationActor | null
  author?: ConversationActor | null
  body?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  badges?: ConversationBadge[]
  reactions?: ConversationReaction[]
  emptyLabel?: string
}>()

const resolvedActor = computed(() => props.actor ?? props.author ?? null)
const resolvedBody = computed(() => props.body ?? '')
const resolvedBadges = computed(() => props.badges ?? [])
const resolvedReactions = computed(() => props.reactions ?? [])
const hasBody = computed(() => hasRenderableText(resolvedBody.value))
const hasReactions = computed(() => resolvedReactions.value.some((reaction) => reaction.count > 0))
</script>

<template>
  <Card class="gap-0 overflow-hidden rounded-lg py-0">
    <div
      v-if="resolvedActor || $slots.actions"
      class="flex min-h-10 min-w-0 items-center justify-between gap-3 border-b border-border px-3 py-1.5"
    >
      <ConversationActorLine
        v-if="resolvedActor"
        class="min-w-0 flex-1"
        :actor="resolvedActor"
        :badges="resolvedBadges"
        :created-at="createdAt"
        :updated-at="updatedAt"
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
      v-if="hasReactions"
      class="flex items-center border-t border-border px-3 py-2"
    >
      <ConversationReactionBar :reactions="resolvedReactions" />
    </div>
  </Card>
</template>
