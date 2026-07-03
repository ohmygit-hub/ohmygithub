<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshCw, RotateCcw } from 'lucide-vue-next'
import { Button, Skeleton, Spinner } from '@oh-my-github/ui'
import ActionStatusBadge from '@/components/actions/action-status-badge.vue'

const props = defineProps<{
  canRerunFailedJobs: boolean
  canRerunRun: boolean
  hasError: boolean
  isLoading: boolean
  isRerunningAllJobs: boolean
  isRerunningFailedJobs: boolean
  owner: string
  rerunDisabled: boolean
  repo: string
  run: GitHubActionRun | null
  runId: number
}>()

const emit = defineEmits<{
  rerunAllJobs: []
  rerunFailedJobs: []
  retry: []
}>()

const { t } = useI18n()

const title = computed(() => props.run?.displayTitle ?? t('actions.detail.titleFallback', { runId: props.runId }))
const subtitle = computed(() => `${props.owner}/${props.repo}`)
</script>

<template>
  <header class="border-b border-border bg-background px-5 py-4">
    <div class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="grid min-w-0 gap-2">
        <div class="grid min-w-0 gap-1">
          <Skeleton
            v-if="isLoading && !run"
            class="h-6 w-80 max-w-full rounded-md"
          />
          <h1
            v-else
            class="min-w-0 truncate text-heading font-semibold text-foreground"
          >
            {{ title }}
          </h1>
          <p class="select-none text-body text-muted-foreground">
            {{ t('actions.detail.subtitle', { repository: subtitle, runId }) }}
          </p>
        </div>
      </div>

      <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <ActionStatusBadge
          v-if="run"
          :conclusion="run.conclusion"
          size="default"
          :status="run.status"
        />
        <Button
          size="sm"
          type="button"
          variant="outline"
          :disabled="rerunDisabled || !canRerunFailedJobs"
          :loading="isRerunningFailedJobs"
          loading-mode="manual"
          @click="emit('rerunFailedJobs')"
        >
          <Spinner
            v-if="isRerunningFailedJobs"
            class="size-3.5"
          />
          <RotateCcw
            v-else
            class="size-3.5"
          />
          {{ t('actions.detail.rerun.failedJobs') }}
        </Button>
        <Button
          size="sm"
          type="button"
          variant="secondary"
          :disabled="rerunDisabled || !canRerunRun"
          :loading="isRerunningAllJobs"
          loading-mode="manual"
          @click="emit('rerunAllJobs')"
        >
          <Spinner
            v-if="isRerunningAllJobs"
            class="size-3.5"
          />
          <RotateCcw
            v-else
            class="size-3.5"
          />
          {{ t('actions.detail.rerun.allJobs') }}
        </Button>
        <Button
          v-if="hasError"
          size="sm"
          type="button"
          variant="outline"
          @click="emit('retry')"
        >
          <RefreshCw class="size-3.5" />
          {{ t('actions.detail.retry') }}
        </Button>
      </div>
    </div>
  </header>
</template>
