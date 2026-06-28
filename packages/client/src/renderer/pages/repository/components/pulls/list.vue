<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
} from '@oh-my-github/ui'
import PullRequestPagination from './pagination.vue'
import PullRequestRow from './row.vue'

const props = defineProps<{
  disabled?: boolean
  hasError: boolean
  hasIdentity: boolean
  incompleteResults: boolean
  isLoading: boolean
  page: number
  perPage: number
  pullRequests: GitHubPullRequest[]
  search: string
  state: GitHubPullRequestSearchState
  totalCount: number
}>()

const emit = defineEmits<{
  retry: []
  select: [pullRequest: GitHubPullRequest]
  'update:page': [page: number]
}>()

const { t } = useI18n()

const showLoading = computed(() => props.isLoading && props.pullRequests.length === 0)
const showEmpty = computed(() =>
  props.hasIdentity
  && !props.hasError
  && !props.isLoading
  && props.pullRequests.length === 0
)
const emptyDescription = computed(() =>
  props.search.trim()
    ? t('repository.pullRequests.empty.searchDescription')
    : t(`repository.pullRequests.empty.${props.state}Description`)
)

function updatePage(page: number): void {
  emit('update:page', page)
}
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-border bg-card">
    <div class="min-h-[18rem]">
      <div
        v-if="showLoading"
        class="divide-y divide-border"
      >
        <div
          v-for="index in 6"
          :key="index"
          class="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 p-4"
        >
          <Skeleton class="mt-0.5 size-5 rounded-md" />
          <div class="grid min-w-0 gap-2">
            <Skeleton class="h-4 w-4/5 rounded-md" />
            <Skeleton class="h-3 w-2/5 rounded-md" />
            <div class="flex gap-1.5">
              <Skeleton class="h-5 w-14 rounded-full" />
              <Skeleton class="h-5 w-20 rounded-full" />
            </div>
          </div>
          <Skeleton class="hidden h-5 w-16 rounded-full sm:block" />
        </div>
      </div>

      <Empty
        v-else-if="!hasIdentity"
        class="min-h-[18rem] border-0 bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('repository.pullRequests.empty.missingRepositoryTitle') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('repository.pullRequests.empty.missingRepositoryDescription') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <Empty
        v-else-if="hasError"
        class="min-h-[18rem] border-0 bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('repository.pullRequests.error.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('repository.pullRequests.error.description') }}
          </EmptyDescription>
          <Button
            class="justify-self-center"
            size="sm"
            type="button"
            variant="outline"
            @click="emit('retry')"
          >
            {{ t('repository.pullRequests.error.retry') }}
          </Button>
        </EmptyHeader>
      </Empty>

      <Empty
        v-else-if="showEmpty"
        class="min-h-[18rem] border-0 bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('repository.pullRequests.empty.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ emptyDescription }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <div
        v-else
        class="divide-y divide-border"
      >
        <PullRequestRow
          v-for="pullRequest in pullRequests"
          :key="pullRequest.id"
          :pull-request="pullRequest"
          @select="emit('select', $event)"
        />
      </div>
    </div>

    <footer class="grid gap-2 border-t border-border px-4 py-3">
      <p
        v-if="incompleteResults"
        class="text-body text-muted-foreground"
      >
        {{ t('repository.pullRequests.pagination.incomplete') }}
      </p>
      <PullRequestPagination
        :disabled="disabled || isLoading || hasError || !hasIdentity"
        :page="page"
        :per-page="perPage"
        :total-count="totalCount"
        @update:page="updatePage"
      />
    </footer>
  </section>
</template>
