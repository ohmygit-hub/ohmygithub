<script setup lang="ts">
import type { Component } from 'vue'
import type { ConversationActor, ConversationTimelineEvent } from './types'
import { computed } from 'vue'
import { CircleDot } from 'lucide-vue-next'
import GitHubActorLink from '../github/github-actor-link.vue'
import GitHubReferenceLink from '../github/github-reference-link.vue'
import {
  formatConversationDate,
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
  url?: string | null
  reference?: ConversationTimelineEvent['reference']
}

const props = defineProps<{
  event: ConversationTimelineEvent | ConversationEventRowEventLike
}>()

const icon = computed(() => props.event.icon ?? CircleDot)
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
const eventUrl = computed(() => props.event.url?.trim() || null)
const hasInlineContent = computed(() => Boolean(props.event.actor || eventText.value || props.event.reference))
</script>

<template>
  <div class="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-start gap-3">
    <div class="flex h-8 items-center justify-center">
      <span class="flex size-8 items-center justify-center rounded-full border border-border bg-background">
        <component
          :is="icon"
          class="size-4"
          :class="event.iconClass ?? 'text-muted-foreground'"
        />
      </span>
    </div>

    <div
      v-if="event.reference"
      class="min-h-8 min-w-0 py-1 text-body leading-6"
    >
      <GitHubActorLink
        v-if="event.actor"
        class="mr-2 text-label align-middle"
        avatar-size="sm"
        :avatar-url="event.actor.avatarUrl"
        :login="event.actor.login"
      />

      <span
        v-if="eventText"
        class="break-words text-muted-foreground"
      >
        {{ eventText }}
      </span>

      <GitHubReferenceLink
        class="mx-1 max-w-full align-middle"
        :fallback-href="event.reference.url"
        :initial-kind="event.reference.kind"
        :initial-state="event.reference.state"
        :initial-title="event.reference.title"
        :kind-hint="event.reference.kindHint"
        :number="event.reference.number"
        :owner="event.reference.owner"
        :repo="event.reference.repo"
        variant="inline"
      />

      <time
        v-if="createdLabel"
        class="whitespace-nowrap text-body text-muted-foreground align-baseline"
        :class="hasInlineContent ? 'ml-2' : ''"
        :datetime="createdDateTime"
      >
        {{ createdLabel }}
      </time>
    </div>

    <div
      v-else
      class="min-h-8 min-w-0 py-1 text-body leading-6"
    >
      <GitHubActorLink
        v-if="event.actor"
        class="mr-2 text-label align-middle"
        avatar-size="sm"
        :avatar-url="event.actor.avatarUrl"
        :login="event.actor.login"
      />

      <a
        v-if="eventText && eventUrl"
        class="break-words text-muted-foreground underline-offset-4 outline-hidden hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline focus-visible:ring-2 focus-visible:ring-ring/30"
        :href="eventUrl"
        rel="noreferrer"
        target="_blank"
      >
        {{ eventText }}
      </a>

      <span
        v-else-if="eventText"
        class="break-words text-muted-foreground"
      >
        {{ eventText }}
      </span>

      <time
        v-if="createdLabel"
        class="whitespace-nowrap text-body text-muted-foreground align-baseline"
        :class="hasInlineContent ? 'ml-2' : ''"
        :datetime="createdDateTime"
      >
        {{ createdLabel }}
      </time>
    </div>
  </div>
</template>
