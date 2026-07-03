import type { MaybeRefOrGetter } from 'vue'
import { computed, onBeforeUnmount, toValue, watch } from 'vue'

const RUN_POLL_INTERVAL_MS = 5000
const LOG_POLL_INTERVAL_MS = 3000

export function useActionRunLiveRefresh(options: {
  isActive: MaybeRefOrGetter<boolean>
  refetchJobs: () => void
  refetchLog: () => void
  refetchRun: () => void
  run: MaybeRefOrGetter<GitHubActionRun | null>
  selectedJob: MaybeRefOrGetter<GitHubActionJob | null>
}) {
  let runTimer: ReturnType<typeof setInterval> | null = null
  let logTimer: ReturnType<typeof setInterval> | null = null

  const isRunLive = computed(() => {
    const run = toValue(options.run)

    return Boolean(run && run.status !== 'completed')
  })
  const isSelectedJobLive = computed(() => {
    const job = toValue(options.selectedJob)

    return Boolean(job && job.status !== 'completed')
  })
  const isStreamingLog = computed(() => toValue(options.isActive) && isSelectedJobLive.value)

  watch(
    () => [toValue(options.isActive), isRunLive.value] as const,
    restartRunPolling,
    { immediate: true },
  )

  watch(
    () => [toValue(options.isActive), isSelectedJobLive.value, toValue(options.selectedJob)?.id ?? null] as const,
    (current, previous) => {
      restartLogPolling()

      // Refetch once after the job completes so the final per-step log from
      // the run archive replaces the streamed text.
      if (shouldRefetchCompletedLog(previous, current)) {
        options.refetchLog()
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    stopRunPolling()
    stopLogPolling()
  })

  function restartRunPolling(): void {
    stopRunPolling()

    if (!toValue(options.isActive) || !isRunLive.value) return

    runTimer = setInterval(() => {
      options.refetchRun()
      options.refetchJobs()
    }, RUN_POLL_INTERVAL_MS)
  }

  function restartLogPolling(): void {
    stopLogPolling()

    if (!toValue(options.isActive) || !isSelectedJobLive.value) return

    logTimer = setInterval(() => {
      options.refetchLog()
    }, LOG_POLL_INTERVAL_MS)
  }

  function stopRunPolling(): void {
    if (!runTimer) return

    clearInterval(runTimer)
    runTimer = null
  }

  function stopLogPolling(): void {
    if (!logTimer) return

    clearInterval(logTimer)
    logTimer = null
  }

  return {
    isRunLive,
    isSelectedJobLive,
    isStreamingLog,
  }
}

export function shouldRefetchCompletedLog(
  previous: readonly [boolean, boolean, number | null] | undefined,
  current: readonly [boolean, boolean, number | null],
): boolean {
  if (!previous) return false

  const [, wasLive, previousJobId] = previous
  const [isActive, isLive, jobId] = current

  return isActive && wasLive && !isLive && jobId !== null && jobId === previousJobId
}
