<script setup lang="ts">
import type { FeedEventCard } from '../activity-helpers'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Book, GitCommitHorizontal, Star } from 'lucide-vue-next'

const props = defineProps<{
  card: FeedEventCard
  repoCards?: Map<string, GitHubFeedRepoCard | null>
}>()

const router = useRouter()

const repoCard = computed(() =>
  props.card.kind === 'repo' ? props.repoCards?.get(props.card.repoFullName) ?? null : null,
)

const starCount = computed(() => {
  if (!repoCard.value) return null

  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 })
    .format(repoCard.value.stars)
})

function open(): void {
  if (props.card.url) void router.push(props.card.url)
}
</script>

<template>
  <div
    class="grid gap-1.5 rounded-lg border border-border bg-card p-3 transition-colors"
    :class="card.url ? 'cursor-pointer hover:border-muted-foreground/40' : ''"
    :role="card.url ? 'button' : undefined"
    @click.stop="open"
  >
    <template v-if="card.kind === 'repo'">
      <div class="flex min-w-0 items-center gap-1.5">
        <Book class="size-3.5 shrink-0 text-muted-foreground" />
        <span class="min-w-0 truncate text-label font-medium text-foreground">{{ card.repoFullName }}</span>
      </div>
      <p
        v-if="repoCard?.description"
        class="line-clamp-2 text-body text-muted-foreground"
      >
        {{ repoCard.description }}
      </p>
      <div
        v-if="repoCard"
        class="flex items-center gap-3 text-caption text-muted-foreground"
      >
        <span
          v-if="repoCard.language"
          class="inline-flex items-center gap-1.5"
        >
          <span
            class="size-2.5 rounded-full"
            :style="{ backgroundColor: repoCard.languageColor ?? 'var(--muted-foreground)' }"
          />
          {{ repoCard.language }}
        </span>
        <span class="inline-flex items-center gap-1">
          <Star class="size-3" />
          {{ starCount }}
        </span>
      </div>
    </template>

    <template v-else-if="card.kind === 'text'">
      <span class="truncate text-label font-medium text-foreground">{{ card.title }}</span>
      <p
        v-if="card.excerpt"
        class="line-clamp-3 whitespace-pre-line text-body text-muted-foreground"
      >
        {{ card.excerpt }}
      </p>
    </template>

    <template v-else>
      <div
        v-for="(message, index) in card.messages"
        :key="index"
        class="flex min-w-0 items-center gap-1.5"
      >
        <GitCommitHorizontal class="size-3.5 shrink-0 text-muted-foreground" />
        <span class="min-w-0 truncate text-body text-foreground">{{ message }}</span>
      </div>
    </template>
  </div>
</template>
