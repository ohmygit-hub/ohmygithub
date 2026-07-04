<script setup lang="ts">
import type { WorkspaceMessageParams, WorkspaceTab } from '@/pages/workspace/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge } from '@oh-my-github/ui'
import AccountPage from '@/pages/account/account-page.vue'
import AppPage from '@/pages/app/app-page.vue'
import ActionRunPage from '@/pages/action-run/action-run-page.vue'
import CommitPage from '@/pages/commit/commit-page.vue'
import IssueListPage from '@/pages/issue-list/issue-list-page.vue'
import IssuePage from '@/pages/issue/issue-page.vue'
import PullRequestListPage from '@/pages/pull-request-list/pull-request-list-page.vue'
import PullRequestPage from '@/pages/pull-request/pull-request-page.vue'
import RepositoryPage from '@/pages/repository/repository-page.vue'
import SearchResultPage from '@/pages/search-result/search-result-page.vue'
import NotFoundPage from '@/pages/not-found/not-found-page.vue'
import InboxPage from '@/pages/inbox/inbox-page.vue'
import NewRepositoryPage from '@/pages/new-repository/new-repository-page.vue'
import { getWorkspaceTabView } from '@/pages/workspace/tab-presentation'

const props = defineProps<{
  isActive: boolean
  tab: WorkspaceTab
  viewer: AuthViewer | null
}>()

const emit = defineEmits<{
  replaceActiveUrl: [url: string]
  search: []
}>()

const { t } = useI18n()
const view = computed(() => getWorkspaceTabView(props.tab))

function translate(key: string, params?: WorkspaceMessageParams): string {
  return t(key, params ?? {})
}
</script>

<template>
  <AccountPage
    v-if="tab.type === 'account'"
    :tab="tab"
    :viewer="viewer"
    @replace-active-url="emit('replaceActiveUrl', $event)"
  />

  <AppPage
    v-else-if="tab.type === 'app'"
    :tab="tab"
  />

  <RepositoryPage
    v-else-if="tab.type === 'repo'"
    :is-active="isActive"
    :tab="tab"
    @replace-active-url="emit('replaceActiveUrl', $event)"
  />

  <PullRequestPage
    v-else-if="tab.type === 'pull-request'"
    :tab="tab"
  />

  <PullRequestListPage
    v-else-if="tab.type === 'pull-request-list'"
    :tab="tab"
  />

  <IssuePage
    v-else-if="tab.type === 'issue'"
    :tab="tab"
  />

  <ActionRunPage
    v-else-if="tab.type === 'action-run'"
    :is-active="isActive"
    :tab="tab"
    @replace-active-url="emit('replaceActiveUrl', $event)"
  />

  <CommitPage
    v-else-if="tab.type === 'commit'"
    :tab="tab"
  />

  <IssueListPage
    v-else-if="tab.type === 'issue-list'"
    :tab="tab"
  />

  <SearchResultPage
    v-else-if="tab.type === 'search-result'"
    :tab="tab"
  />

  <NotFoundPage
    v-else-if="tab.type === 'not-found'"
    :tab="tab"
    @search="emit('search')"
  />

  <InboxPage
    v-else-if="tab.type === 'inbox'"
    :tab="tab"
  />

  <NewRepositoryPage
    v-else-if="tab.type === 'new-repository'"
    :viewer="viewer"
    @replace-active-url="emit('replaceActiveUrl', $event)"
  />

  <section
    v-else
    class="min-h-full bg-background"
  >
    <div class="mx-auto grid w-full max-w-4xl gap-5 px-6 py-6">
      <div class="grid max-w-3xl gap-2">
        <Badge
          class="justify-self-start"
          variant="secondary"
        >
          <component :is="view.icon" />
          {{ translate(view.eyebrowKey) }}
        </Badge>
        <h1 class="select-none truncate text-heading font-semibold text-foreground">
          {{ translate(view.headingKey, view.headingParams) }}
        </h1>
        <p class="max-w-2xl select-none text-label text-muted-foreground">
          {{ translate(view.descriptionKey, view.descriptionParams) }}
        </p>
      </div>

      <div class="grid gap-2 sm:grid-cols-3">
        <div
          v-for="stat in view.stats"
          :key="stat.id"
          class="grid gap-1 rounded-lg border border-border bg-card p-3"
        >
          <div class="select-none text-body font-medium text-muted-foreground">
            {{ translate(stat.labelKey) }}
          </div>
          <div class="truncate text-control font-semibold text-foreground">
            {{ stat.value ?? translate(stat.valueKey ?? '') }}
          </div>
        </div>
      </div>

      <div class="grid gap-2">
        <div
          v-for="block in view.blocks"
          :key="block.id"
          class="grid gap-1 rounded-lg border border-border bg-card p-3"
        >
          <div class="flex min-w-0 items-center gap-2">
            <div class="min-w-0 flex-1 select-none truncate text-label font-medium text-foreground">
              {{ translate(block.titleKey) }}
            </div>
            <div class="shrink-0 select-none text-body text-muted-foreground">
              {{ translate(block.metaKey) }}
            </div>
          </div>
          <p class="text-body text-muted-foreground">
            {{ translate(block.descriptionKey) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
