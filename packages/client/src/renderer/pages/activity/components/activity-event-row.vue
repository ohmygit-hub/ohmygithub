<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import GithubActorLink from '@/components/github/github-actor-link.vue'
import { formatRelativeTime } from '@/components/conversation/format'
import { presentFeedEvent } from '../activity-helpers'
import ActivityFeedCard from './activity-feed-card.vue'

const props = defineProps<{
  event: GitHubFeedEvent
  repoCards?: Map<string, GitHubFeedRepoCard | null>
}>()

const { locale } = useI18n()
const router = useRouter()

const presentation = computed(() => presentFeedEvent(props.event))
const relativeTime = computed(() => formatRelativeTime(props.event.createdAt, { locale: locale.value }))

function openTarget(): void {
  if (presentation.value.targetUrl) void router.push(presentation.value.targetUrl)
}

function openPart(url: string | null): void {
  if (url) void router.push(url)
}
</script>

<template>
  <div
    class="group flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-muted-foreground/40"
    role="button"
    tabindex="0"
    @click="openTarget"
    @keydown.enter.prevent="openTarget"
  >
    <GithubActorLink
      :login="event.actor.login"
      :avatar-url="event.actor.avatarUrl"
      avatar-size="sm"
      :show-username="false"
      class="mt-0.5 shrink-0"
    />

    <div class="grid min-w-0 flex-1 gap-0.5">
      <span class="min-w-0 text-label text-foreground">
        <GithubActorLink
          :login="event.actor.login"
          :show-avatar="false"
          class="align-baseline"
        />
        {{ ' ' }}
        <i18n-t
          :keypath="presentation.sentenceKey"
          :plural="presentation.pluralCount ?? undefined"
          scope="global"
          tag="span"
        >
          <template
            v-for="(part, name) in presentation.parts"
            :key="name"
            #[name]
          >
            <button
              v-if="part.url"
              class="font-medium underline-offset-4 hover:underline"
              type="button"
              @click.stop="openPart(part.url)"
            >{{ part.label }}</button>
            <span
              v-else
              class="font-medium"
            >{{ part.label }}</span>
          </template>
        </i18n-t>
      </span>
      <ActivityFeedCard
        v-if="presentation.card"
        class="mt-2"
        :card="presentation.card"
        :repo-cards="repoCards"
      />
    </div>

    <span
      v-if="relativeTime"
      class="shrink-0 text-caption text-muted-foreground"
    >{{ relativeTime }}</span>
  </div>
</template>
