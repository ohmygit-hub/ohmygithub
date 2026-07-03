<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshCw, Radio } from 'lucide-vue-next'
import {
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
} from '@oh-my-github/ui'
import ShikiCode from '@/components/code/shiki-code.vue'
import ActionStatusBadge from '@/components/actions/action-status-badge.vue'
import { buildActionRunLogSections } from '@/pages/action-run/action-run-log-sections'

const props = defineProps<{
  hasError: boolean
  isLoading: boolean
  isStreaming: boolean
  job: GitHubActionJob | null
  log: GitHubActionJobLog | null
}>()

const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n()

const sections = computed(() => buildActionRunLogSections(props.log, props.job?.steps ?? []))
const isLogUnavailable = computed(() => props.log && !props.log.isAvailable)
const fetchedAt = computed(() => {
  if (!props.log?.fetchedAt) return null

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(props.log.fetchedAt))
})

function sectionLineCount(content: string): number {
  return content ? content.split(/\r?\n/).length : 0
}

const rootEl = ref<HTMLElement | null>(null)

function scrollToStep(stepNumber: number): void {
  const target = rootEl.value?.querySelector(`[data-step-number="${stepNumber}"]`)
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

defineExpose({ scrollToStep })
</script>

<template>
  <section
    ref="rootEl"
    class="grid min-h-[18rem] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-card"
  >
    <div class="flex min-w-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
      <div class="grid min-w-0 gap-0.5">
        <h2 class="select-none text-title font-semibold text-foreground">
          {{ t('actions.detail.log.title') }}
        </h2>
        <p
          v-if="fetchedAt"
          class="select-none text-body text-muted-foreground"
        >
          {{ t('actions.detail.log.fetchedAt', { time: fetchedAt }) }}
        </p>
      </div>
      <Badge
        v-if="isStreaming"
        size="sm"
        variant="info"
      >
        <Radio class="size-3 animate-pulse" />
        {{ t('actions.detail.log.streaming') }}
      </Badge>
    </div>

    <div class="min-h-0 overflow-auto">
      <div
        v-if="isLoading && !log"
        class="grid gap-2 p-4"
      >
        <Skeleton
          v-for="index in 10"
          :key="index"
          class="h-4 rounded-md"
          :class="index % 3 === 0 ? 'w-2/3' : 'w-full'"
        />
      </div>

      <Empty
        v-else-if="hasError"
        class="min-h-[18rem] border-0 bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('actions.detail.log.errorTitle') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('actions.detail.log.errorDescription') }}
          </EmptyDescription>
          <Button
            class="justify-self-center"
            size="sm"
            type="button"
            variant="outline"
            @click="emit('retry')"
          >
            <RefreshCw class="size-3.5" />
            {{ t('actions.detail.retry') }}
          </Button>
        </EmptyHeader>
      </Empty>

      <Empty
        v-else-if="isLogUnavailable"
        class="min-h-[18rem] border-0 bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('actions.detail.log.pendingTitle') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('actions.detail.log.pendingDescription') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <Empty
        v-else-if="sections.length === 0"
        class="min-h-[18rem] border-0 bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('actions.detail.log.emptyTitle') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('actions.detail.log.emptyDescription') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <div
        v-else
        class="divide-y divide-border"
      >
        <section
          v-for="section in sections"
          :key="section.id"
          class="grid scroll-mt-2 gap-0"
          :data-step-number="section.step?.number"
        >
          <div class="flex min-w-0 items-center justify-between gap-3 bg-muted/30 px-4 py-2">
            <div class="flex min-w-0 items-center gap-2">
              <div class="min-w-0 truncate text-control font-medium text-foreground">
                {{ section.title }}
              </div>
              <Badge
                class="shrink-0"
                size="sm"
                variant="secondary"
              >
                {{ t('actions.detail.log.lines', { count: sectionLineCount(section.content) }) }}
              </Badge>
            </div>
            <ActionStatusBadge
              v-if="section.step"
              class="shrink-0"
              :conclusion="section.step.conclusion ?? null"
              :status="section.step.status ?? null"
            />
          </div>

          <div class="action-run-log-scrollbar max-h-[28rem] min-w-0 select-text overflow-auto bg-background">
            <ShikiCode
              :code="section.content"
              language="log"
              :padded="true"
              :show-line-numbers="true"
              :themed-background="true"
            />
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
