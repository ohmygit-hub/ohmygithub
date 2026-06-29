<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Archive, BookOpen, Clock3, GitFork, Lock, Star } from 'lucide-vue-next'
import { Badge, Card } from '@oh-my-github/ui'

const props = defineProps<{
  repository: GitHubAccountRepository
}>()

const emit = defineEmits<{
  select: [repository: GitHubAccountRepository]
}>()

const { t } = useI18n()

const description = computed(() =>
  props.repository.description?.trim() || t('repositoryCard.noDescription')
)
const updatedAt = computed(() => props.repository.updatedAt ?? props.repository.pushedAt)

function selectRepository(): void {
  emit('select', props.repository)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value)
}

function formatDate(value: string | null): string {
  if (!value) return t('repositoryCard.unknownDate')

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
</script>

<template>
  <Card
    class="min-h-[12.5rem] cursor-pointer gap-3 rounded-lg p-4 py-4 outline-hidden transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/30"
    role="button"
    tabindex="0"
    @click="selectRepository"
    @keydown.enter.prevent="selectRepository"
    @keydown.space.prevent="selectRepository"
  >
    <div class="flex min-w-0 items-start justify-between gap-3">
      <div class="grid min-w-0 gap-1">
        <div class="inline-flex min-w-0 select-none items-center gap-2 text-control font-semibold text-foreground">
          <BookOpen class="size-4 shrink-0" />
          <span class="truncate">{{ repository.name }}</span>
        </div>
        <div class="truncate text-body text-muted-foreground">
          {{ repository.owner }}
        </div>
      </div>
    </div>

    <p
      class="line-clamp-2 min-h-10 text-body leading-relaxed"
      :class="repository.description ? 'text-foreground' : 'text-muted-foreground'"
    >
      {{ description }}
    </p>

    <div
      v-if="repository.isPrivate || repository.isFork || repository.isArchived || repository.isTemplate"
      class="flex flex-wrap gap-1.5"
    >
      <Badge
        v-if="repository.isPrivate"
        size="sm"
        variant="warning"
      >
        <Lock />
        {{ t('repositoryCard.badges.private') }}
      </Badge>
      <Badge
        v-if="repository.isFork"
        size="sm"
        variant="secondary"
      >
        <GitFork />
        {{ t('repositoryCard.badges.fork') }}
      </Badge>
      <Badge
        v-if="repository.isArchived"
        size="sm"
        variant="secondary"
      >
        <Archive />
        {{ t('repositoryCard.badges.archived') }}
      </Badge>
      <Badge
        v-if="repository.isTemplate"
        size="sm"
        variant="secondary"
      >
        {{ t('repositoryCard.badges.template') }}
      </Badge>
    </div>

    <div class="mt-auto flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-body text-muted-foreground">
      <span
        v-if="repository.primaryLanguage"
        class="inline-flex min-w-0 items-center gap-1.5"
      >
        <span class="size-2 shrink-0 rounded-full bg-muted-foreground" />
        <span class="truncate">{{ repository.primaryLanguage }}</span>
      </span>
      <span class="inline-flex items-center gap-1 tabular-nums">
        <Star class="size-3.5" />
        {{ formatNumber(repository.stars) }}
      </span>
      <span class="inline-flex items-center gap-1 tabular-nums">
        <GitFork class="size-3.5" />
        {{ formatNumber(repository.forks) }}
      </span>
      <span class="inline-flex min-w-0 items-center gap-1">
        <Clock3 class="size-3.5 shrink-0" />
        <span class="truncate">{{ formatDate(updatedAt) }}</span>
      </span>
    </div>
  </Card>
</template>
