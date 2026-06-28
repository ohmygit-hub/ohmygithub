<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Pagination as UiPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '@oh-my-github/ui'

const props = defineProps<{
  disabled?: boolean
  page: number
  perPage: number
  totalCount: number
}>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const { t } = useI18n()

const pageModel = computed({
  get: () => props.page,
  set: (page: number) => {
    emit('update:page', page)
  },
})

const totalForPagination = computed(() => Math.min(Math.max(props.totalCount, props.perPage), 1000))
const pageCount = computed(() => Math.max(1, Math.ceil(totalForPagination.value / props.perPage)))
</script>

<template>
  <div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div class="text-body text-muted-foreground">
      {{ t('repository.pullRequests.pagination.summary', { page, pageCount, totalCount }) }}
    </div>

    <UiPagination
      v-model:page="pageModel"
      class="mx-0 w-auto justify-start sm:justify-end"
      :disabled="disabled"
      :items-per-page="perPage"
      :sibling-count="1"
      show-edges
      :total="totalForPagination"
    >
      <PaginationContent v-slot="{ items }">
        <PaginationFirst size="icon-sm" />
        <PaginationPrevious size="icon-sm" />

        <template
          v-for="(item, index) in items"
          :key="index"
        >
          <PaginationItem
            v-if="item.type === 'page'"
            :is-active="item.value === page"
            :value="item.value"
            size="icon-sm"
          >
            {{ item.value }}
          </PaginationItem>
          <PaginationEllipsis
            v-else
            :index="index"
          />
        </template>

        <PaginationNext size="icon-sm" />
        <PaginationLast size="icon-sm" />
      </PaginationContent>
    </UiPagination>
  </div>
</template>
