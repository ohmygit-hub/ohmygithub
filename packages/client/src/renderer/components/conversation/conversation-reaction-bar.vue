<script setup lang="ts">
import type { ConversationReaction } from './types'
import { computed } from 'vue'
import { Badge } from '@oh-my-github/ui'

const props = withDefaults(defineProps<{
  reactions?: ConversationReaction[]
}>(), {
  reactions: () => [],
})

const visibleReactions = computed(() => props.reactions.filter((reaction) => reaction.count > 0))
</script>

<template>
  <div
    v-if="visibleReactions.length > 0"
    class="flex min-w-0 flex-wrap items-center gap-1.5"
  >
    <Badge
      v-for="reaction in visibleReactions"
      :key="reaction.content"
      class="gap-1.5"
      :class="reaction.viewerHasReacted ? 'border-primary/30 bg-primary/10 text-primary' : undefined"
      size="sm"
      variant="outline"
    >
      <span class="truncate">{{ reaction.content }}</span>
      <span class="tabular-nums">{{ reaction.count }}</span>
    </Badge>
  </div>
</template>
