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
import AppPagination from '@/components/navigation/app-pagination.vue'
import ReleaseRow from './row.vue'

const props = defineProps<{
  releases: GitHubRelease[]
  hasError: boolean
  hasIdentity: boolean
  hasNextPage: boolean
  isLoading: boolean
  latestReleaseId: number | null
  owner: string
  page: number
  perPage: number
  repo: string
}>()

const emit = defineEmits<{
  retry: []
  edit: [release: GitHubRelease]
  publish: [release: GitHubRelease]
  delete: [release: GitHubRelease]
  'update:page': [page: number]
}>()

const { t } = useI18n()

const showLoading = computed(() => props.isLoading && props.releases.length === 0)
const showEmpty = computed(() =>
  props.hasIdentity
  && !props.hasError
  && !props.isLoading
  && props.releases.length === 0
)
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
          class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4"
        >
          <Skeleton class="size-4 rounded-md" />
          <div class="grid min-w-0 gap-2">
            <Skeleton class="h-4 w-2/5 rounded-md" />
            <Skeleton class="h-3 w-3/5 rounded-md" />
          </div>
          <Skeleton class="hidden h-5 w-16 rounded-md sm:block" />
        </div>
      </div>

      <Empty
        v-else-if="!hasIdentity"
        class="min-h-[18rem] border-0 bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('repository.releases.empty.missingRepositoryTitle') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('repository.releases.empty.missingRepositoryDescription') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <Empty
        v-else-if="hasError"
        class="min-h-[18rem] border-0 bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('repository.releases.error.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('repository.releases.error.description') }}
          </EmptyDescription>
          <Button
            class="justify-self-center"
            size="sm"
            type="button"
            variant="outline"
            @click="emit('retry')"
          >
            {{ t('repository.releases.error.retry') }}
          </Button>
        </EmptyHeader>
      </Empty>

      <Empty
        v-else-if="showEmpty"
        class="min-h-[18rem] border-0 bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('repository.releases.empty.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('repository.releases.empty.description') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <div
        v-else
        class="divide-y divide-border"
      >
        <ReleaseRow
          v-for="release in releases"
          :key="release.id"
          :is-latest="release.id === latestReleaseId"
          :owner="owner"
          :release="release"
          :repo="repo"
          @delete="emit('delete', $event)"
          @edit="emit('edit', $event)"
          @publish="emit('publish', $event)"
        />
      </div>
    </div>

    <footer class="border-t border-border px-4 py-3">
      <AppPagination
        :disabled="isLoading"
        :has-next-page="hasNextPage"
        :page="page"
        :per-page="perPage"
        summary-key="repository.releases.pagination.summary"
        :total-count="0"
        variant="compact"
        @update:page="emit('update:page', $event)"
      />
    </footer>
  </section>
</template>
