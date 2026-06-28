<script setup lang="ts">
import { Eye, GitFork, Star } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { Button, ButtonGroup } from '@oh-my-github/ui'
import type { RepositorySection, RepositorySectionId } from './types'

defineProps<{
  activeSection: RepositorySectionId
  formattedStarCount: string
  isStarred: boolean
  isWatching: boolean
  owner: string
  repository: string
  sections: readonly RepositorySection[]
  starButtonDisabled: boolean
  starLabel: string
  watchButtonDisabled: boolean
  watchLabel: string
}>()

const emit = defineEmits<{
  openOwner: []
  toggleStarred: []
  toggleWatching: []
  'update:activeSection': [value: RepositorySectionId]
}>()

const { t } = useI18n()
</script>

<template>
  <aside class="flex h-full w-56 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
    <header class="grid grid-cols-[0.25rem_1rem_minmax(0,1fr)] gap-x-1 px-2 py-3">
      <div class="col-start-2 col-end-4 grid min-w-0 gap-2.5">
        <div class="flex min-w-0 items-center text-control font-medium text-foreground">
          <button
            v-if="owner"
            class="min-w-0 max-w-24 truncate text-left font-normal text-muted-foreground underline-offset-4 outline-hidden hover:underline focus-visible:underline"
            type="button"
            @click="emit('openOwner')"
          >
            {{ owner }}
          </button>
          <span
            v-else
            class="truncate"
          >
            {{ t('repository.ownerFallback') }}
          </span>
          <span class="shrink-0 text-muted-foreground">/</span>
          <span class="min-w-0 truncate px-1">{{ repository }}</span>
        </div>

        <ButtonGroup class="justify-self-start">
          <Button
            :aria-label="starLabel"
            :aria-pressed="isStarred"
            :disabled="starButtonDisabled"
            class="h-8 min-w-16 justify-start px-2"
            size="sm"
            type="button"
            variant="outline"
            @click="emit('toggleStarred')"
          >
            <Star
              class="size-3.5"
              :class="isStarred ? 'fill-warning text-warning' : 'fill-none text-muted-foreground'"
              :stroke-width="1.75"
            />
            <span class="text-body font-normal tabular-nums text-muted-foreground">
              {{ formattedStarCount }}
            </span>
          </Button>

          <Button
            :aria-label="t('repository.actions.fork')"
            disabled
            class="size-8 text-muted-foreground"
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <GitFork
              class="size-3.5"
              :stroke-width="1.75"
            />
          </Button>

          <Button
            :aria-label="watchLabel"
            :aria-pressed="isWatching"
            :disabled="watchButtonDisabled"
            class="size-8"
            size="icon-sm"
            type="button"
            variant="outline"
            @click="emit('toggleWatching')"
          >
            <Eye
              class="size-3.5"
              :class="isWatching ? 'text-foreground' : 'text-muted-foreground'"
              :stroke-width="1.75"
            />
          </Button>
        </ButtonGroup>
      </div>
    </header>

    <nav
      class="grid gap-1 px-2 py-1.5"
      :aria-label="t('repository.sidebar.navigation')"
    >
      <button
        v-for="section in sections"
        :key="section.id"
        :class="[
          'grid h-9 w-full grid-cols-[0.25rem_1rem_minmax(0,1fr)] items-center gap-x-1 rounded-lg pr-2 text-left text-body font-normal outline-hidden transition-colors hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/30',
          activeSection === section.id ? 'text-foreground' : 'text-muted-foreground',
        ]"
        :aria-current="activeSection === section.id ? 'page' : undefined"
        type="button"
        @click="emit('update:activeSection', section.id)"
      >
        <span
          class="h-4 w-0.5 justify-self-center rounded-full"
          :class="activeSection === section.id ? 'bg-muted-foreground' : 'bg-transparent'"
        />
        <component
          :is="section.icon"
          class="size-3.5 justify-self-center"
          :stroke-width="1.75"
        />
        <span class="ml-1 truncate">{{ t(`repository.sections.${section.id}.title`) }}</span>
      </button>
    </nav>
  </aside>
</template>
