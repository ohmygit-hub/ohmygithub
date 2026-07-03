<script setup lang="ts">
import { computed } from 'vue'
import { BellOff, Eye, GitFork, Star } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import {
  Button,
  ButtonGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@oh-my-github/ui'
import SectionSidebar from '@/components/navigation/section-sidebar.vue'
import {
  createRepositorySectionCountLabel,
  type RepositorySectionCounts,
} from './repository-section-counts'
import type { RepositorySection, RepositorySectionId } from './types'

const props = defineProps<{
  activeSection: RepositorySectionId
  forkButtonDisabled: boolean
  formattedStarCount: string
  isStarred: boolean
  owner: string
  repository: string
  repositoryCounts: RepositorySectionCounts | null
  sections: readonly RepositorySection[]
  starButtonDisabled: boolean
  starLabel: string
  subscription: GitHubRepositorySubscription
  watchButtonDisabled: boolean
  watchLabel: string
}>()

const emit = defineEmits<{
  fork: []
  openOwner: []
  setSubscription: [value: GitHubRepositorySubscription]
  toggleStarred: []
  'update:activeSection': [value: RepositorySectionId]
}>()

const { t } = useI18n()

const subscriptionOptions: readonly GitHubRepositorySubscription[] = ['participating', 'all', 'ignore']

const sidebarItems = computed(() =>
  props.sections.map((section) => ({
    id: section.id,
    countLabel: createRepositorySectionCountLabel(section.id, props.repositoryCounts),
    icon: section.icon,
    label: t(`repository.sections.${section.id}.title`),
  }))
)

const watchIcon = computed(() => (props.subscription === 'ignore' ? BellOff : Eye))

function updateActiveSection(id: string): void {
  emit('update:activeSection', id as RepositorySectionId)
}

function updateSubscription(value: unknown): void {
  if (typeof value !== 'string' || value === props.subscription) return
  emit('setSubscription', value as GitHubRepositorySubscription)
}
</script>

<template>
  <SectionSidebar
    :active-id="activeSection"
    :items="sidebarItems"
    :navigation-label="t('repository.sidebar.navigation')"
    @update:active-id="updateActiveSection"
  >
    <template #header>
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
              :disabled="forkButtonDisabled"
              class="size-8 text-muted-foreground"
              size="icon-sm"
              type="button"
              variant="outline"
              @click="emit('fork')"
            >
              <GitFork
                class="size-3.5"
                :stroke-width="1.75"
              />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  :aria-label="watchLabel"
                  :disabled="watchButtonDisabled"
                  class="size-8"
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <component
                    :is="watchIcon"
                    class="size-3.5"
                    :class="subscription === 'participating' ? 'text-muted-foreground' : 'text-foreground'"
                    :stroke-width="1.75"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                class="w-72"
              >
                <DropdownMenuLabel>{{ t('repository.watch.menuLabel') }}</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  :model-value="subscription"
                  @update:model-value="updateSubscription"
                >
                  <DropdownMenuRadioItem
                    v-for="option in subscriptionOptions"
                    :key="option"
                    :value="option"
                  >
                    <span class="grid gap-0.5">
                      <span>{{ t(`repository.watch.${option}`) }}</span>
                      <span class="text-caption font-normal text-muted-foreground">
                        {{ t(`repository.watch.${option}Description`) }}
                      </span>
                    </span>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </div>
      </header>
    </template>
  </SectionSidebar>
</template>
