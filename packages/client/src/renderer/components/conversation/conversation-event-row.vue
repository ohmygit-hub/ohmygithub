<script setup lang="ts">
import type { Component } from 'vue'
import type { ConversationActor, ConversationTimelineEvent } from './types'
import { computed } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@oh-my-github/ui'
import { CircleDot } from 'lucide-vue-next'
import {
  formatConversationDate,
  getActorFallback,
  toConversationDateTime,
} from './format'

interface ConversationEventRowEventLike {
  id: string | number
  icon?: Component
  iconClass?: string
  text?: string | null
  body?: string | null
  type?: string | null
  actor?: ConversationActor | null
  createdAt?: string | null
}

const props = defineProps<{
  event: ConversationTimelineEvent | ConversationEventRowEventLike
}>()

const icon = computed(() => props.event.icon ?? CircleDot)
const actorFallback = computed(() => getActorFallback(props.event.actor))
const eventText = computed(() => {
  const text = props.event.text?.trim()
  if (text) return text

  if ('body' in props.event) {
    const body = props.event.body?.trim()
    if (body) return body
  }

  if ('type' in props.event) {
    return props.event.type?.trim() ?? ''
  }

  return ''
})
const createdLabel = computed(() => formatConversationDate(props.event.createdAt))
const createdDateTime = computed(() => toConversationDateTime(props.event.createdAt))
</script>

<template>
  <div class="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-3">
    <div class="flex justify-center pt-0.5">
      <span class="flex size-8 items-center justify-center rounded-full border border-border bg-background">
        <component
          :is="icon"
          class="size-4"
          :class="event.iconClass ?? 'text-muted-foreground'"
        />
      </span>
    </div>

    <div class="min-w-0 py-1.5">
      <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-body">
        <span
          v-if="event.actor"
          class="inline-flex min-w-0 items-center gap-1.5 text-label font-medium text-foreground"
        >
          <Avatar class="size-5">
            <AvatarImage
              v-if="event.actor.avatarUrl"
              :src="event.actor.avatarUrl"
              :alt="event.actor.login"
            />
            <AvatarFallback class="text-caption">
              {{ actorFallback }}
            </AvatarFallback>
          </Avatar>
          <span class="truncate">{{ event.actor.login }}</span>
        </span>

        <span
          v-if="eventText"
          class="min-w-0 break-words text-muted-foreground"
        >
          {{ eventText }}
        </span>

        <time
          v-if="createdLabel"
          class="shrink-0 text-caption text-muted-foreground"
          :datetime="createdDateTime"
        >
          {{ createdLabel }}
        </time>
      </div>
    </div>
  </div>
</template>
