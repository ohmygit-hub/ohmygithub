<script setup lang="ts">
import type { ConversationActor, ConversationBadge } from './types'
import { computed } from 'vue'
import { Avatar, AvatarFallback, AvatarImage, Badge } from '@oh-my-github/ui'
import {
  formatConversationDate,
  getActorFallback,
  toConversationDateTime,
} from './format'

const props = withDefaults(defineProps<{
  actor: ConversationActor
  createdAt?: string | null
  updatedAt?: string | null
  badges?: ConversationBadge[]
  showAvatar?: boolean
}>(), {
  badges: () => [],
  showAvatar: true,
})

const actorFallback = computed(() => getActorFallback(props.actor))
const createdLabel = computed(() => formatConversationDate(props.createdAt))
const updatedLabel = computed(() => {
  if (!props.updatedAt || props.updatedAt === props.createdAt) return null

  return formatConversationDate(props.updatedAt)
})
const createdDateTime = computed(() => toConversationDateTime(props.createdAt))
const updatedDateTime = computed(() => toConversationDateTime(props.updatedAt))
const visibleBadges = computed(() => props.badges.filter((badge) => badge.label.trim().length > 0))
</script>

<template>
  <div class="flex min-w-0 items-center gap-2">
    <Avatar
      v-if="showAvatar"
      class="size-7"
    >
      <AvatarImage
        v-if="actor.avatarUrl"
        :src="actor.avatarUrl"
        :alt="actor.login"
      />
      <AvatarFallback class="text-caption">
        {{ actorFallback }}
      </AvatarFallback>
    </Avatar>

    <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span class="min-w-0 truncate text-label font-medium text-foreground">
        {{ actor.login }}
      </span>

      <span
        v-if="createdLabel || updatedLabel"
        class="inline-flex min-w-0 items-center gap-1 text-caption text-muted-foreground"
      >
        <time
          v-if="createdLabel"
          class="truncate"
          :datetime="createdDateTime"
        >
          {{ createdLabel }}
        </time>
        <span
          v-if="createdLabel && updatedLabel"
          aria-hidden="true"
        >·</span>
        <time
          v-if="updatedLabel"
          class="truncate"
          :datetime="updatedDateTime"
        >
          {{ updatedLabel }}
        </time>
      </span>

      <span
        v-if="visibleBadges.length > 0"
        class="flex min-w-0 flex-wrap items-center gap-1"
      >
        <Badge
          v-for="badge in visibleBadges"
          :key="badge.id"
          class="max-w-full"
          size="sm"
          :variant="badge.variant ?? 'secondary'"
        >
          <span class="truncate">{{ badge.label }}</span>
        </Badge>
      </span>
    </div>
  </div>
</template>
