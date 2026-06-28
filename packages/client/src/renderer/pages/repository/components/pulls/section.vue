<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRepositoryPullRequestSearchQuery } from '../../../../composables/github/use-pull-requests'
import FilterBar from './filter-bar.vue'
import PullRequestList from './list.vue'

const props = defineProps<{
  owner: string
  repo: string
}>()

const PER_PAGE = 20
const SEARCH_DEBOUNCE_MS = 300

const router = useRouter()
const state = ref<GitHubPullRequestSearchState>('open')
const searchInput = ref('')
const debouncedSearch = ref('')
const page = ref(1)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const hasRepositoryIdentity = computed(() => Boolean(props.owner && props.repo))
const pullRequestsQuery = useRepositoryPullRequestSearchQuery(
  () => props.owner,
  () => props.repo,
  state,
  debouncedSearch,
  page,
  PER_PAGE,
  hasRepositoryIdentity,
)
const result = computed(() => pullRequestsQuery.data.value ?? null)
const pullRequests = computed(() => result.value?.items ?? [])
const totalCount = computed(() => result.value?.totalCount ?? 0)
const incompleteResults = computed(() => result.value?.incompleteResults ?? false)
const hasError = computed(() => Boolean(pullRequestsQuery.error.value))
const isLoading = computed(() => pullRequestsQuery.isLoading.value)

watch(searchInput, (value) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    debouncedSearch.value = value.trim()
    page.value = 1
    searchTimer = null
  }, SEARCH_DEBOUNCE_MS)
})

watch(
  () => [props.owner, props.repo, state.value] as const,
  () => {
    page.value = 1
  },
)

watch(result, (currentResult) => {
  if (currentResult && currentResult.items.length === 0 && currentResult.totalCount > 0 && page.value > 1) {
    page.value = 1
  }
})

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
})

function openPullRequest(pullRequest: GitHubPullRequest): void {
  void router.push(
    `/${encodeURIComponent(pullRequest.owner)}/${encodeURIComponent(pullRequest.repo)}/pull/${pullRequest.number}`
  )
}

function refetchPullRequests(): void {
  void pullRequestsQuery.refetch()
}
</script>

<template>
  <section class="grid gap-3">
    <FilterBar
      v-model:search="searchInput"
      v-model:state="state"
      :disabled="!hasRepositoryIdentity"
    />

    <PullRequestList
      :disabled="!hasRepositoryIdentity"
      :has-error="hasError"
      :has-identity="hasRepositoryIdentity"
      :incomplete-results="incompleteResults"
      :is-loading="isLoading"
      :page="page"
      :per-page="PER_PAGE"
      :pull-requests="pullRequests"
      :search="debouncedSearch"
      :state="state"
      :total-count="totalCount"
      @retry="refetchPullRequests"
      @select="openPullRequest"
      @update:page="page = $event"
    />
  </section>
</template>
