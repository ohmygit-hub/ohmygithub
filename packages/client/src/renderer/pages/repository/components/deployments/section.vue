<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  useRepositoryDeploymentRunsQuery,
  useRepositoryEnvironmentsQuery,
} from '@/composables/github/use-deployments'
import { createActionRunWorkspaceUrl } from '@/pages/workspace/workspace-url'
import RunList from '../actions/run-list.vue'
import EnvironmentSelect from './environment-select.vue'

const props = defineProps<{
  isActive: boolean
  owner: string
  repo: string
}>()

const ALL_ENVIRONMENTS_VALUE = 'all'
const PER_PAGE = 20

const router = useRouter()
const { t } = useI18n()

const environmentValue = ref(ALL_ENVIRONMENTS_VALUE)
const page = ref(1)

const hasRepositoryIdentity = computed(() => Boolean(props.owner && props.repo))
const selectedEnvironment = computed(() =>
  environmentValue.value === ALL_ENVIRONMENTS_VALUE ? null : environmentValue.value
)

const environmentsQuery = useRepositoryEnvironmentsQuery(
  () => props.owner,
  () => props.repo,
  hasRepositoryIdentity,
)
const deploymentRunsQuery = useRepositoryDeploymentRunsQuery({
  owner: () => props.owner,
  repo: () => props.repo,
  environment: selectedEnvironment,
  page,
  perPage: PER_PAGE,
  enabled: hasRepositoryIdentity,
})

const environments = computed(() => environmentsQuery.data.value?.items ?? [])
const isEnvironmentsLoading = computed(() => environmentsQuery.isLoading.value)

const result = computed(() => deploymentRunsQuery.data.value ?? null)
const runs = computed(() => result.value?.items ?? [])
const hasNextPage = computed(() => result.value?.hasNextPage ?? false)
const hasError = computed(() => Boolean(deploymentRunsQuery.error.value))
const isLoading = computed(() => deploymentRunsQuery.isLoading.value)
const syntheticTotalCount = computed(() =>
  (page.value - 1) * PER_PAGE + runs.value.length + (hasNextPage.value ? PER_PAGE : 0)
)
const selectDisabled = computed(() => !hasRepositoryIdentity.value || isEnvironmentsLoading.value)

watch(
  () => [props.owner, props.repo, environmentValue.value] as const,
  () => {
    page.value = 1
  },
)

function openRun(run: GitHubActionRun): void {
  if (!props.owner || !props.repo) return

  void router.push(createActionRunWorkspaceUrl(props.owner, props.repo, run.id))
}

function refetchDeploymentRuns(): void {
  void deploymentRunsQuery.refetch()
}
</script>

<template>
  <section class="grid gap-3">
    <div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="grid min-w-0 gap-1">
        <h2 class="select-none truncate text-title font-semibold text-foreground">
          {{ t('repository.deployments.title') }}
        </h2>
        <p class="select-none text-body text-muted-foreground">
          {{ t('repository.deployments.description') }}
        </p>
      </div>
      <EnvironmentSelect
        v-model="environmentValue"
        :disabled="selectDisabled"
        :environments="environments"
      />
    </div>

    <RunList
      :disabled="!hasRepositoryIdentity"
      :has-error="hasError"
      :has-identity="hasRepositoryIdentity"
      :has-next-page="hasNextPage"
      :is-loading="isLoading"
      :page="page"
      :per-page="PER_PAGE"
      :runs="runs"
      :total-count="syntheticTotalCount"
      :workflow-name="selectedEnvironment"
      @retry="refetchDeploymentRuns"
      @select="openRun"
      @update:page="page = $event"
    />
  </section>
</template>
