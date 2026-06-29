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
import AppPagination from '../../../../components/navigation/app-pagination.vue'
import IssueRow from './row.vue'

const props = defineProps<{
  disabled?: boolean
  hasError: boolean
  hasIdentity: boolean
  incompleteResults: boolean
  isLoading: boolean
  issues: GitHubIssue[]
  page: number
  perPage: number
  search: string
  state: GitHubIssueSearchState
  totalCount: number
}>()

const emit = defineEmits<{
  retry: []
  select: [issue: GitHubIssue]
  'update:page': [page: number]
}>()

const { t } = useI18n()

const showLoading = computed(() => props.isLoading && props.issues.length === 0)
const showEmpty = computed(() =>
  props.hasIdentity
  && !props.hasError
  && !props.isLoading
  && props.issues.length === 0
)
const emptyDescription = computed(() =>
  props.search.trim()
    ? t('repository.issues.empty.searchDescription')
    : t(`repository.issues.empty.${props.state}Description`)
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
          class="grid grid-cols-[auto_minmax(0,1fr)] gap-3 p-4"
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
        </div>
      </div>

      <Empty
        v-else-if="!hasIdentity"
        class="min-h-[18rem] border-0 bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('repository.issues.empty.missingRepositoryTitle') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('repository.issues.empty.missingRepositoryDescription') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <Empty
        v-else-if="hasError"
        class="min-h-[18rem] border-0 bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('repository.issues.error.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('repository.issues.error.description') }}
          </EmptyDescription>
          <Button
            class="justify-self-center"
            size="sm"
            type="button"
            variant="outline"
            @click="emit('retry')"
          >
            {{ t('repository.issues.error.retry') }}
          </Button>
        </EmptyHeader>
      </Empty>

      <Empty
        v-else-if="showEmpty"
        class="min-h-[18rem] border-0 bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('repository.issues.empty.title') }}
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
        <IssueRow
          v-for="issue in issues"
          :key="issue.id"
          :issue="issue"
          @select="emit('select', $event)"
        />
      </div>
    </div>

    <footer class="grid gap-2 border-t border-border px-4 py-3">
      <p
        v-if="incompleteResults"
        class="text-body text-muted-foreground"
      >
        {{ t('repository.issues.pagination.incomplete') }}
      </p>
      <AppPagination
        :disabled="disabled || isLoading || hasError || !hasIdentity"
        :page="page"
        :per-page="perPage"
        summary-key="repository.issues.pagination.summary"
        :total-count="totalCount"
        @update:page="updatePage"
      />
    </footer>
  </section>
</template>
