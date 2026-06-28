<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Check,
  Circle,
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
  GitPullRequestDraft,
  X,
} from 'lucide-vue-next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
} from '@oh-my-github/ui'

const props = defineProps<{
  pullRequest: GitHubPullRequest
}>()

const emit = defineEmits<{
  select: [pullRequest: GitHubPullRequest]
}>()

const { t } = useI18n()

const stateIcon = computed<Component>(() => {
  if (props.pullRequest.state === 'draft') return GitPullRequestDraft
  if (props.pullRequest.state === 'merged') return GitMerge
  if (props.pullRequest.state === 'closed') return GitPullRequestClosed

  return GitPullRequest
})

const stateIconClass = computed(() => {
  if (props.pullRequest.state === 'draft') return 'text-muted-foreground'
  if (props.pullRequest.state === 'merged') return 'text-[color:var(--accent-purple)]'
  if (props.pullRequest.state === 'closed') return 'text-destructive'

  return 'text-success'
})

const stateLabel = computed(() => t(`repository.pullRequests.states.${props.pullRequest.state}`))
const updatedAt = computed(() => formatDate(props.pullRequest.updatedAt))
const authorFallback = computed(() => props.pullRequest.author.login.slice(0, 2).toUpperCase())

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function selectPullRequest(): void {
  emit('select', props.pullRequest)
}
</script>

<template>
  <button
    class="grid w-full grid-cols-[auto_minmax(0,1fr)] gap-3 p-4 text-left outline-hidden transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/30"
    type="button"
    @click="selectPullRequest"
  >
    <div class="relative mt-0.5 flex size-5 items-center justify-center">
      <component
        :is="stateIcon"
        class="size-4"
        :class="stateIconClass"
        :stroke-width="1.8"
      />
      <span
        v-if="pullRequest.hasUpdates"
        class="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-info"
      />
    </div>

    <div class="grid min-w-0 gap-2">
      <div class="flex min-w-0 items-start gap-2">
        <div class="min-w-0 flex-1">
          <div class="flex min-w-0 items-center gap-2 text-control font-medium text-foreground">
            <span class="min-w-0 truncate">
              #{{ pullRequest.number }} {{ pullRequest.title }}
            </span>
            <span
              v-if="pullRequest.ciState"
              class="flex size-4 shrink-0 items-center justify-center"
              :title="t(`repository.pullRequests.checks.${pullRequest.ciState}`)"
            >
              <Check
                v-if="pullRequest.ciState === 'success'"
                class="size-4 text-success"
                :stroke-width="2"
              />
              <X
                v-else-if="pullRequest.ciState === 'failure'"
                class="size-4 text-destructive"
                :stroke-width="2"
              />
              <Circle
                v-else
                class="size-3 fill-warning text-warning"
                :stroke-width="2"
              />
            </span>
          </div>
          <div class="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-body text-muted-foreground">
            <Badge
              size="sm"
              variant="secondary"
            >
              {{ stateLabel }}
            </Badge>
            <span>{{ t('repository.pullRequests.meta.updated', { date: updatedAt }) }}</span>
            <span class="inline-flex min-w-0 items-center gap-1">
              <Avatar class="size-4">
                <AvatarImage
                  v-if="pullRequest.author.avatarUrl"
                  :alt="pullRequest.author.login"
                  :src="pullRequest.author.avatarUrl"
                />
                <AvatarFallback class="text-[9px]">
                  {{ authorFallback }}
                </AvatarFallback>
              </Avatar>
              <span class="truncate">{{ pullRequest.author.login }}</span>
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="pullRequest.labels.length > 0"
        class="flex min-w-0 flex-wrap gap-1.5"
      >
        <Badge
          v-for="label in pullRequest.labels"
          :key="label"
          size="sm"
          variant="outline"
        >
          {{ label }}
        </Badge>
      </div>
    </div>
  </button>
</template>
