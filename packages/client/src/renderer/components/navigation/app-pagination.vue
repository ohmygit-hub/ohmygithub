<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import {
  Button,
  Input,
  Pagination as UiPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '@oh-my-github/ui'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  disabled?: boolean
  hasNextPage?: boolean
  hideWhenSinglePage?: boolean
  maxTotal?: number
  page: number
  perPage: number
  summaryKey: string
  totalCount: number
  variant?: 'pages' | 'compact'
}>(), {
  maxTotal: 1000,
  variant: 'pages',
})

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const { t } = useI18n()
const pageInput = ref(String(props.page))

const normalizedPerPage = computed(() => Math.max(1, Math.floor(Number(props.perPage) || 1)))
const normalizedMaxTotal = computed(() => Math.max(normalizedPerPage.value, Math.floor(Number(props.maxTotal) || 1000)))
const totalForPagination = computed(() =>
  Math.min(Math.max(props.totalCount, normalizedPerPage.value), normalizedMaxTotal.value)
)
const pageCount = computed(() => Math.max(1, Math.ceil(totalForPagination.value / normalizedPerPage.value)))
const pageModel = computed({
  get: () => props.page,
  set: (page: number) => {
    setPage(page)
  },
})
const shouldRender = computed(() =>
  !props.hideWhenSinglePage
  || props.totalCount > normalizedPerPage.value
  || props.page > 1
)
const canGoPrevious = computed(() => props.page > 1)
const canGoNext = computed(() => props.hasNextPage ?? props.page < pageCount.value)
const summaryValues = computed(() => ({
  count: new Intl.NumberFormat().format(props.totalCount),
  page: props.page,
  pageCount: pageCount.value,
  totalCount: props.totalCount,
}))
const pageInputMax = computed(() => props.variant === 'pages' ? pageCount.value : undefined)

watch(
  () => props.page,
  (page) => {
    pageInput.value = String(page)
  },
)

function boundedPage(page: number): number {
  const upperBound = props.variant === 'compact' ? Number.MAX_SAFE_INTEGER : pageCount.value
  return Math.min(Math.max(1, Math.floor(page)), upperBound)
}

function setPage(page: number): void {
  if (props.disabled) return

  const nextPage = boundedPage(page)
  pageInput.value = String(nextPage)

  if (nextPage !== props.page) {
    emit('update:page', nextPage)
  }
}

function commitPageInput(): void {
  const value = pageInput.value.trim()

  if (!/^\d+$/.test(value)) {
    pageInput.value = String(props.page)
    return
  }

  setPage(Number(value))
}

function resetPageInput(): void {
  pageInput.value = String(props.page)
}

function goToPreviousPage(): void {
  if (!canGoPrevious.value) return
  setPage(props.page - 1)
}

function goToNextPage(): void {
  if (!canGoNext.value) return
  setPage(props.page + 1)
}
</script>

<template>
  <div
    v-if="shouldRender"
    :class="[
      'flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
      props.class,
    ]"
  >
    <p class="min-w-0 select-none truncate text-body text-muted-foreground">
      {{ t(summaryKey, summaryValues) }}
    </p>

    <div
      v-if="variant === 'compact'"
      class="flex shrink-0 items-center gap-1"
    >
      <Button
        :aria-label="t('pagination.previous')"
        :disabled="disabled || !canGoPrevious"
        size="icon-sm"
        type="button"
        variant="ghost"
        @click="goToPreviousPage"
      >
        <ChevronLeft class="size-3.5" />
      </Button>
      <Button
        :aria-label="t('pagination.next')"
        :disabled="disabled || !canGoNext"
        size="icon-sm"
        type="button"
        variant="ghost"
        @click="goToNextPage"
      >
        <ChevronRight class="size-3.5" />
      </Button>
      <Input
        v-model="pageInput"
        :aria-label="t('pagination.pageInput')"
        :disabled="disabled"
        inputmode="numeric"
        :max="pageInputMax"
        min="1"
        pattern="[0-9]*"
        size="sm"
        type="text"
        class="w-14 px-2 text-center tabular-nums"
        @blur="commitPageInput"
        @keydown.enter.prevent="commitPageInput"
        @keydown.esc.prevent="resetPageInput"
      />
    </div>

    <div
      v-else
      class="flex shrink-0 flex-wrap items-center justify-start gap-1 sm:justify-end"
    >
      <UiPagination
        v-model:page="pageModel"
        class="mx-0 w-auto justify-start sm:justify-end"
        :disabled="disabled"
        :items-per-page="normalizedPerPage"
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
      <Input
        v-model="pageInput"
        :aria-label="t('pagination.pageInput')"
        :disabled="disabled"
        inputmode="numeric"
        :max="pageInputMax"
        min="1"
        pattern="[0-9]*"
        size="sm"
        type="text"
        class="w-14 px-2 text-center tabular-nums"
        @blur="commitPageInput"
        @keydown.enter.prevent="commitPageInput"
        @keydown.esc.prevent="resetPageInput"
      />
    </div>
  </div>
</template>
