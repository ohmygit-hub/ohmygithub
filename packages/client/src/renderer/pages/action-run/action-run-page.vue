<script setup lang="ts">
import type { WorkspaceTab } from '@/pages/workspace/types'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@oh-my-github/ui'
import {
  rerunFailedWorkflowRunJobs,
  rerunWorkflowJob,
  rerunWorkflowRun,
  useWorkflowJobLogQuery,
  useWorkflowRunJobsQuery,
  useWorkflowRunQuery,
} from '@/composables/github/use-actions'
import { useToast } from '@/composables/use-toast'
import { createActionRunWorkspaceUrl } from '@/pages/workspace/workspace-url'
import { useActionRunLiveRefresh } from './composables/use-action-run-live-refresh'
import ActionRunHeader from './components/action-run-header.vue'
import ActionRunJobLog from './components/action-run-job-log.vue'
import ActionRunJobSteps from './components/action-run-job-steps.vue'
import ActionRunJobsSidebar from './components/action-run-jobs-sidebar.vue'
import ActionRunSummary from './components/action-run-summary.vue'

const props = defineProps<{
  isActive: boolean
  tab: WorkspaceTab
}>()

const emit = defineEmits<{
  replaceActiveUrl: [url: string]
}>()

const { t } = useI18n()
const toast = useToast()

const selectedJobId = ref<number | null>(null)
const logCard = ref<InstanceType<typeof ActionRunJobLog> | null>(null)
const rerunningRunMode = ref<'all' | 'failed' | null>(null)
const rerunningJobId = ref<number | null>(null)

const owner = computed(() => props.tab.owner ?? '')
const repo = computed(() => props.tab.repo ?? '')
const runId = computed(() => props.tab.runId ?? 0)
const hasIdentity = computed(() => Boolean(owner.value && repo.value && runId.value > 0))
const selectedJobIdForQuery = computed(() => selectedJobId.value ?? 0)

const runQuery = useWorkflowRunQuery(owner, repo, runId, hasIdentity)
const jobsQuery = useWorkflowRunJobsQuery(owner, repo, runId, hasIdentity)

const run = computed(() => runQuery.data.value ?? null)
const jobs = computed(() => jobsQuery.data.value ?? [])
const selectedJob = computed(() =>
  jobs.value.find((job) => job.id === selectedJobId.value) ?? null
)

const logQuery = useWorkflowJobLogQuery(
  owner,
  repo,
  selectedJobIdForQuery,
  () => hasIdentity.value && Boolean(selectedJobId.value),
  selectedJob,
)
const log = computed(() => logQuery.data.value ?? null)
const hasRunError = computed(() => Boolean(runQuery.error.value))
const hasJobsError = computed(() => Boolean(jobsQuery.error.value))
const hasLogError = computed(() => Boolean(logQuery.error.value))
const isRunLoading = computed(() => runQuery.isLoading.value)
const isJobsLoading = computed(() => jobsQuery.isLoading.value)
const isLogLoading = computed(() => logQuery.isLoading.value)
const canRerunRun = computed(() => Boolean(run.value && run.value.status === 'completed'))
const rerunnableFailedJobCount = computed(() => jobs.value.filter(isRerunnableFailedJob).length)
const canRerunFailedJobs = computed(() => canRerunRun.value && rerunnableFailedJobCount.value > 0)
const isRerunning = computed(() => Boolean(rerunningRunMode.value || rerunningJobId.value))

const liveRefresh = useActionRunLiveRefresh({
  isActive: () => props.isActive,
  run,
  selectedJob,
  refetchRun: () => {
    void runQuery.refetch()
  },
  refetchJobs: () => {
    void jobsQuery.refetch()
  },
  refetchLog: () => {
    if (selectedJobId.value) {
      void logQuery.refetch()
    }
  },
})

watch(
  jobs,
  (currentJobs) => {
    if (currentJobs.length === 0) {
      selectedJobId.value = null
      return
    }

    const requestedJobId = props.tab.jobId ?? null
    if (requestedJobId && currentJobs.some((job) => job.id === requestedJobId)) {
      selectedJobId.value = requestedJobId
      return
    }

    if (!currentJobs.some((job) => job.id === selectedJobId.value)) {
      selectedJobId.value = currentJobs[0].id
    }
  },
  { immediate: true },
)

watch(
  () => props.tab.jobId,
  (jobId) => {
    if (jobId && jobs.value.some((job) => job.id === jobId)) {
      selectedJobId.value = jobId
      return
    }

    if (!jobId && jobs.value.length > 0 && !jobs.value.some((job) => job.id === selectedJobId.value)) {
      selectedJobId.value = jobs.value[0].id
    }
  },
)

function scrollToLogStep(stepNumber: number): void {
  logCard.value?.scrollToStep(stepNumber)
}

function selectJob(jobId: number): void {
  selectedJobId.value = jobId
  emit('replaceActiveUrl', createActionRunWorkspaceUrl(owner.value, repo.value, runId.value, jobId))
}

function retryRun(): void {
  void runQuery.refetch()
  void jobsQuery.refetch()
}

function retryJobs(): void {
  void jobsQuery.refetch()
}

function retryLog(): void {
  if (!selectedJobId.value) return

  void logQuery.refetch()
}

async function rerunAllJobs(): Promise<void> {
  if (!canRerunRun.value || isRerunning.value) return

  rerunningRunMode.value = 'all'

  try {
    await rerunWorkflowRun(owner.value, repo.value, runId.value)
    toast.success(t('actions.detail.rerun.allSuccess'))
    await refetchActionRun()
  } catch (error) {
    toast.error(t('actions.detail.rerun.errorTitle'), {
      description: resolveErrorMessage(error),
    })
  } finally {
    rerunningRunMode.value = null
  }
}

async function rerunFailedJobs(): Promise<void> {
  if (!canRerunFailedJobs.value || isRerunning.value) return

  rerunningRunMode.value = 'failed'

  try {
    await rerunFailedWorkflowRunJobs(owner.value, repo.value, runId.value)
    toast.success(t('actions.detail.rerun.failedSuccess'))
    await refetchActionRun()
  } catch (error) {
    toast.error(t('actions.detail.rerun.errorTitle'), {
      description: resolveErrorMessage(error),
    })
  } finally {
    rerunningRunMode.value = null
  }
}

async function rerunSingleJob(jobId: number): Promise<void> {
  const job = jobs.value.find((item) => item.id === jobId)
  if (!job || !canRerunJob(job) || isRerunning.value) return

  rerunningJobId.value = jobId

  try {
    await rerunWorkflowJob(owner.value, repo.value, jobId)
    toast.success(t('actions.detail.rerun.jobSuccess', { job: job.name }))
    await refetchActionRun()
  } catch (error) {
    toast.error(t('actions.detail.rerun.errorTitle'), {
      description: resolveErrorMessage(error),
    })
  } finally {
    rerunningJobId.value = null
  }
}

function canRerunJob(job: GitHubActionJob): boolean {
  return canRerunRun.value && job.status === 'completed'
}

function isRerunnableFailedJob(job: GitHubActionJob): boolean {
  return job.conclusion === 'failure'
    || job.conclusion === 'cancelled'
    || job.conclusion === 'timed_out'
    || job.conclusion === 'action_required'
}

async function refetchActionRun(): Promise<void> {
  await Promise.all([
    runQuery.refetch(),
    jobsQuery.refetch(),
    selectedJobId.value ? logQuery.refetch() : Promise.resolve(),
  ])
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message

  return t('actions.detail.rerun.errorDescription')
}
</script>

<template>
  <section class="flex h-full min-h-[34rem] flex-col bg-background">
    <Empty
      v-if="!hasIdentity"
      class="m-4 min-h-[24rem] border border-border bg-card"
    >
      <EmptyHeader>
        <EmptyTitle>
          {{ t('actions.detail.emptyIdentityTitle') }}
        </EmptyTitle>
        <EmptyDescription>
          {{ t('actions.detail.emptyIdentityDescription') }}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>

    <template v-else>
      <ActionRunHeader
        :can-rerun-failed-jobs="canRerunFailedJobs"
        :can-rerun-run="canRerunRun"
        :has-error="hasRunError"
        :is-loading="isRunLoading"
        :is-rerunning-all-jobs="rerunningRunMode === 'all'"
        :is-rerunning-failed-jobs="rerunningRunMode === 'failed'"
        :owner="owner"
        :rerun-disabled="isRerunning"
        :repo="repo"
        :run="run"
        :run-id="runId"
        @rerun-all-jobs="rerunAllJobs"
        @rerun-failed-jobs="rerunFailedJobs"
        @retry="retryRun"
      />

      <div class="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[18rem_minmax(0,1fr)]">
        <ActionRunJobsSidebar
          :can-rerun-jobs="canRerunRun"
          :has-error="hasJobsError"
          :is-loading="isJobsLoading"
          :jobs="jobs"
          :rerun-disabled="isRerunning"
          :rerunning-job-id="rerunningJobId"
          :selected-job-id="selectedJobId"
          @rerun="rerunSingleJob"
          @retry="retryJobs"
          @select="selectJob"
        />

        <main class="min-h-0 overflow-auto p-4">
          <div class="mx-auto grid w-full max-w-5xl gap-4">
            <ActionRunSummary
              :is-loading="isRunLoading"
              :run="run"
            />

            <ActionRunJobSteps
              :job="selectedJob"
              @select-step="scrollToLogStep"
            />

            <ActionRunJobLog
              ref="logCard"
              :has-error="hasLogError"
              :is-loading="isLogLoading"
              :is-streaming="liveRefresh.isStreamingLog.value"
              :job="selectedJob"
              :log="log"
              @retry="retryLog"
            />
          </div>
        </main>
      </div>
    </template>
  </section>
</template>
