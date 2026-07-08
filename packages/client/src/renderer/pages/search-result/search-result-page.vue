<script setup lang="ts">
import type { Component } from 'vue'
import type { WorkspaceTab } from '@/pages/workspace/types'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  Building2,
  ChevronRight,
  Book,
  Search,
  Star,
  UserRound,
} from 'lucide-vue-next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
} from '@oh-my-github/ui'
import AppPagination from '@/components/navigation/app-pagination.vue'
import { useWorkspaceSearchQuery } from '@/composables/github/use-workspace-search'

const props = defineProps<{
  tab: WorkspaceTab
}>()

const PER_PAGE = 20

const { t } = useI18n()
const router = useRouter()
const page = ref(1)

const mode = computed(() => props.tab.searchMode ?? 'all')
const query = computed(() => props.tab.searchQuery ?? '')
const hasQuery = computed(() => Boolean(query.value.trim()))
const searchQuery = useWorkspaceSearchQuery(mode, query, page, PER_PAGE, hasQuery)
const result = computed(() => searchQuery.data.value ?? null)
const items = computed(() => result.value?.items ?? [])
const totalCount = computed(() => result.value?.totalCount ?? 0)
const hasError = computed(() => Boolean(searchQuery.error.value))
const isLoading = computed(() => searchQuery.isLoading.value)
const showLoading = computed(() => isLoading.value && items.value.length === 0)
const showEmpty = computed(() =>
  hasQuery.value
  && !hasError.value
  && !isLoading.value
  && items.value.length === 0
)
const groups = computed(() => [
  {
    id: 'users',
    title: t('searchResult.groups.users'),
    items: items.value.filter((item) => item.kind === 'user'),
  },
  {
    id: 'orgs',
    title: t('searchResult.groups.orgs'),
    items: items.value.filter((item) => item.kind === 'org'),
  },
  {
    id: 'repos',
    title: t('searchResult.groups.repos'),
    items: items.value.filter((item) => item.kind === 'repo'),
  },
])

watch(
  () => props.tab.url,
  () => {
    page.value = 1
  },
)

watch(result, (currentResult) => {
  if (currentResult && currentResult.items.length === 0 && currentResult.totalCount > 0 && page.value > 1) {
    page.value = 1
  }
})

function itemIcon(item: GitHubWorkspaceSearchItem): Component {
  if (item.kind === 'repo') return Book
  if (item.kind === 'org') return Building2
  return UserRound
}

function itemKindLabel(item: GitHubWorkspaceSearchItem): string {
  return t(`searchResult.kinds.${item.kind}`)
}

function itemFallback(item: GitHubWorkspaceSearchItem): string {
  return item.title.slice(0, 2).toUpperCase()
}

const starFormatter = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 })

function formatStars(value: number): string {
  return starFormatter.format(value)
}

function openItem(item: GitHubWorkspaceSearchItem): void {
  void router.push(item.workspaceUrl)
}

function refetch(): void {
  void searchQuery.refetch()
}
</script>

<template>
  <section class="min-h-full bg-background">
    <div class="mx-auto grid w-full max-w-5xl gap-5 px-6 py-6">
      <div class="grid max-w-3xl gap-2">
        <Badge
          class="justify-self-start"
          variant="secondary"
        >
          <Search />
          {{ t('searchResult.eyebrow') }}
        </Badge>
        <h1 class="select-none truncate text-heading font-semibold text-foreground">
          {{ t('searchResult.title', { query }) }}
        </h1>
        <p class="max-w-2xl select-none text-label text-muted-foreground">
          {{ t(`searchResult.descriptions.${mode}`) }}
        </p>
      </div>

      <section class="overflow-hidden rounded-xl border border-border bg-card">
        <div class="min-h-[22rem]">
          <div
            v-if="showLoading"
            class="divide-y divide-border"
          >
            <div
              v-for="index in 6"
              :key="index"
              class="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 p-4"
            >
              <Skeleton class="size-9 rounded-full" />
              <div class="grid min-w-0 gap-2">
                <Skeleton class="h-4 w-1/2 rounded-md" />
                <Skeleton class="h-3 w-4/5 rounded-md" />
              </div>
              <Skeleton class="h-5 w-16 rounded-full" />
            </div>
          </div>

          <Empty
            v-else-if="!hasQuery"
            class="min-h-[22rem] border-0 bg-transparent"
          >
            <EmptyHeader>
              <EmptyTitle>{{ t('searchResult.empty.noQueryTitle') }}</EmptyTitle>
              <EmptyDescription>{{ t('searchResult.empty.noQueryDescription') }}</EmptyDescription>
            </EmptyHeader>
          </Empty>

          <Empty
            v-else-if="hasError"
            class="min-h-[22rem] border-0 bg-transparent"
          >
            <EmptyHeader>
              <EmptyTitle>{{ t('searchResult.error.title') }}</EmptyTitle>
              <EmptyDescription>{{ t('searchResult.error.description') }}</EmptyDescription>
              <Button
                class="justify-self-center"
                size="sm"
                type="button"
                variant="outline"
                @click="refetch"
              >
                {{ t('searchResult.error.retry') }}
              </Button>
            </EmptyHeader>
          </Empty>

          <Empty
            v-else-if="showEmpty"
            class="min-h-[22rem] border-0 bg-transparent"
          >
            <EmptyHeader>
              <EmptyTitle>{{ t('searchResult.empty.title') }}</EmptyTitle>
              <EmptyDescription>{{ t('searchResult.empty.description') }}</EmptyDescription>
            </EmptyHeader>
          </Empty>

          <div
            v-else-if="mode === 'all'"
            class="divide-y divide-border"
          >
            <template
              v-for="group in groups"
              :key="group.id"
            >
              <div
                v-if="group.items.length > 0"
                class="grid"
              >
                <div class="select-none border-b border-border px-4 py-2 text-body font-medium text-muted-foreground">
                  {{ group.title }}
                </div>
                <button
                  v-for="item in group.items"
                  :key="`${item.kind}:${item.id}`"
                  class="grid w-full select-none grid-cols-[auto_minmax(0,1fr)_auto] gap-3 p-4 text-left outline-hidden transition-colors hover:bg-[color:var(--ui-hover)] focus-visible:bg-[color:var(--ui-hover)] focus-visible:ring-2 focus-visible:ring-ring/30"
                  type="button"
                  @click="openItem(item)"
                >
                  <Avatar class="size-9">
                    <AvatarImage
                      v-if="item.avatarUrl"
                      :alt="item.title"
                      :src="item.avatarUrl"
                    />
                    <AvatarFallback>{{ itemFallback(item) }}</AvatarFallback>
                  </Avatar>
                  <div class="min-w-0">
                    <div class="flex min-w-0 items-center gap-2 text-control font-medium text-foreground">
                      <component
                        :is="itemIcon(item)"
                        class="size-3.5 shrink-0 text-muted-foreground"
                      />
                      <span class="truncate">{{ item.title }}</span>
                      <span
                        v-if="item.kind === 'repo' && item.starCount !== undefined"
                        class="inline-flex shrink-0 select-none items-center gap-1 text-body font-normal tabular-nums text-muted-foreground"
                      >
                        <Star class="size-3.5" />
                        {{ formatStars(item.starCount) }}
                      </span>
                    </div>
                    <p class="mt-1 line-clamp-2 text-body text-muted-foreground">
                      {{ item.description || t('searchResult.noDescription') }}
                    </p>
                  </div>
                  <Badge
                    class="self-start"
                    size="sm"
                    variant="outline"
                  >
                    {{ itemKindLabel(item) }}
                  </Badge>
                </button>
              </div>
            </template>
          </div>

          <div
            v-else
            class="divide-y divide-border"
          >
            <button
              v-for="item in items"
              :key="`${item.kind}:${item.id}`"
              class="grid w-full select-none grid-cols-[auto_minmax(0,1fr)_auto] gap-3 p-4 text-left outline-hidden transition-colors hover:bg-[color:var(--ui-hover)] focus-visible:bg-[color:var(--ui-hover)] focus-visible:ring-2 focus-visible:ring-ring/30"
              type="button"
              @click="openItem(item)"
            >
              <Avatar class="size-9">
                <AvatarImage
                  v-if="item.avatarUrl"
                  :alt="item.title"
                  :src="item.avatarUrl"
                />
                <AvatarFallback>{{ itemFallback(item) }}</AvatarFallback>
              </Avatar>
              <div class="min-w-0">
                <div class="flex min-w-0 items-center gap-2 text-control font-medium text-foreground">
                  <component
                    :is="itemIcon(item)"
                    class="size-3.5 shrink-0 text-muted-foreground"
                  />
                  <span class="truncate">{{ item.title }}</span>
                  <Badge
                    v-if="item.isPrivate"
                    size="sm"
                    variant="secondary"
                  >
                    {{ t('searchResult.private') }}
                  </Badge>
                  <span
                    v-if="item.kind === 'repo' && item.starCount !== undefined"
                    class="inline-flex shrink-0 select-none items-center gap-1 text-body font-normal tabular-nums text-muted-foreground"
                  >
                    <Star class="size-3.5" />
                    {{ formatStars(item.starCount) }}
                  </span>
                </div>
                <p class="mt-1 line-clamp-2 text-body text-muted-foreground">
                  {{ item.description || t('searchResult.noDescription') }}
                </p>
              </div>
              <ChevronRight class="mt-1 size-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <footer
          v-if="hasQuery && !hasError && !showEmpty"
          class="border-t border-border px-4 py-3"
        >
          <AppPagination
            v-model:page="page"
            :disabled="isLoading"
            :per-page="PER_PAGE"
            summary-key="searchResult.summary"
            :total-count="totalCount"
          />
        </footer>

        <p
          v-if="result?.incompleteResults"
          class="border-t border-border px-4 py-2 text-body text-muted-foreground"
        >
          {{ t('searchResult.incomplete') }}
        </p>
      </section>
    </div>
  </section>
</template>
