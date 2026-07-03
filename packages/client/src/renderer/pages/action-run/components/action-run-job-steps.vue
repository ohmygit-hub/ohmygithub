<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Clock3, Server } from 'lucide-vue-next'
import { Badge, Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@oh-my-github/ui'
import ActionStatusBadge from '@/components/actions/action-status-badge.vue'
import ActionStatusIcon from '@/components/actions/action-status-icon.vue'

const props = defineProps<{
  job: GitHubActionJob | null
}>()

const emit = defineEmits<{
  selectStep: [stepNumber: number]
}>()

const { t } = useI18n()

const labels = computed(() => props.job?.labels ?? [])

function formatTime(value: string | null): string {
  if (!value) return t('actions.values.unknown')

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

function durationLabel(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return t('actions.values.unknownDuration')

  const durationMs = Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime())
  const seconds = Math.round(durationMs / 1000)
  if (seconds < 60) return t('actions.values.durationSeconds', { count: seconds })

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return t('actions.values.durationMinutes', {
    minutes,
    seconds: remainingSeconds,
  })
}
</script>

<template>
  <section class="grid min-h-0 gap-3 rounded-xl border border-border bg-card p-4">
    <div
      v-if="job"
      class="grid gap-3"
    >
      <div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div class="grid min-w-0 gap-1">
          <h2 class="min-w-0 truncate text-title font-semibold text-foreground">
            {{ job.name }}
          </h2>
          <div class="flex min-w-0 flex-wrap items-center gap-1.5 text-body text-muted-foreground">
            <span class="select-none">
              {{ t('actions.detail.steps.started', { time: formatTime(job.startedAt) }) }}
            </span>
            <span aria-hidden="true">·</span>
            <span class="select-none">
              {{ t('actions.detail.steps.duration', { duration: durationLabel(job.startedAt, job.completedAt) }) }}
            </span>
          </div>
        </div>

        <ActionStatusBadge
          :conclusion="job.conclusion"
          :status="job.status"
        />
      </div>

      <div
        v-if="job.runnerName || labels.length > 0"
        class="flex min-w-0 flex-wrap items-center gap-1.5"
      >
        <Badge
          v-if="job.runnerName"
          size="sm"
          variant="outline"
        >
          <Server class="size-3" />
          {{ job.runnerName }}
        </Badge>
        <Badge
          v-for="label in labels"
          :key="label"
          size="sm"
          variant="secondary"
        >
          {{ label }}
        </Badge>
      </div>

      <div class="divide-y divide-border rounded-lg border border-border bg-background/60">
        <button
          v-for="step in job.steps"
          :key="`${step.number}:${step.name}`"
          class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
          type="button"
          @click="emit('selectStep', step.number)"
        >
          <ActionStatusIcon
            class="mt-0.5"
            :conclusion="step.conclusion"
            size="sm"
            :status="step.status"
          />
          <div class="grid min-w-0 gap-0.5">
            <div class="min-w-0 truncate text-control font-medium text-foreground">
              {{ step.name }}
            </div>
            <div class="flex min-w-0 flex-wrap items-center gap-1.5 text-body text-muted-foreground">
              <span class="select-none">
                {{ t('actions.detail.steps.stepNumber', { number: step.number }) }}
              </span>
              <span aria-hidden="true">·</span>
              <span class="select-none">
                {{ formatTime(step.startedAt) }}
              </span>
              <span aria-hidden="true">·</span>
              <span class="select-none">
                {{ durationLabel(step.startedAt, step.completedAt) }}
              </span>
            </div>
          </div>
          <Clock3 class="mt-0.5 size-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>

    <Empty
      v-else
      class="min-h-[14rem] border-0 bg-transparent"
    >
      <EmptyHeader>
        <EmptyTitle>
          {{ t('actions.detail.steps.emptyTitle') }}
        </EmptyTitle>
        <EmptyDescription>
          {{ t('actions.detail.steps.emptyDescription') }}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  </section>
</template>
