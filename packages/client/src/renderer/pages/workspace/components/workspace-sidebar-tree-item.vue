<script setup lang="ts">
import type { WorkspaceSidebarTreeItem } from '../types'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Ellipsis,
  X,
} from 'lucide-vue-next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@oh-my-github/ui'
import { useIssueCategoryQuery, useRepositoryIssuesQuery } from '../../../composables/github/use-issues'
import { useOrganizationRepositoriesQuery } from '../../../composables/github/use-organizations'
import {
  usePullRequestCategoryQuery,
  useRepositoryPullRequestsQuery,
} from '../../../composables/github/use-pull-requests'
import { repositoryToTreeItem } from '../sidebar-tree-items'
import { issueToTreeItem, pullRequestToTreeItem } from '../sidebar-work-items'

defineOptions({
  name: 'WorkspaceSidebarTreeItem',
})

const CHILD_VISIBLE_STEP = 10

const props = defineProps<{
  activeItemId: string | null
  activeUrl: string
  expandedIds: Set<string>
  item: WorkspaceSidebarTreeItem
  level: number
  visibleCounts: Map<string, number>
}>()

const emit = defineEmits<{
  autoExpand: [id: string]
  select: [url: string, itemId: string]
  showMore: [listId: string, visibleCount: number]
  toggle: [id: string]
}>()

const { t } = useI18n()

const isExpanded = computed(() => props.expandedIds.has(props.item.id))
const hasChevron = computed(() => props.item.canExpand || Boolean(props.item.children?.length))
const loaderType = computed(() => props.item.childrenLoader?.type)
const repositoryOwner = computed(() => props.item.childrenLoader?.owner ?? '')
const repositoryName = computed(() => props.item.childrenLoader?.repo ?? '')
const pullRequestCategory = computed<GitHubPullRequestCategory>(() =>
  props.item.childrenLoader?.pullRequestCategory ?? 'inbox'
)
const issueCategory = computed<GitHubIssueCategory>(() =>
  props.item.childrenLoader?.issueCategory ?? 'inbox'
)
const loaderScope = computed(() => props.item.childrenLoader?.scope ?? props.item.id)
const treeLabels = computed(() => ({
  issues: t('workspace.sidebar.groups.issues'),
  pullRequests: t('workspace.sidebar.groups.pullRequests'),
}))

const repositoriesQuery = useOrganizationRepositoriesQuery(
  repositoryOwner,
  computed(() => isExpanded.value && loaderType.value === 'organization-repositories'),
)
const pullRequestCategoryQuery = usePullRequestCategoryQuery(
  pullRequestCategory,
  computed(() => isExpanded.value && loaderType.value === 'pull-request-category'),
)
const issueCategoryQuery = useIssueCategoryQuery(
  issueCategory,
  computed(() => isExpanded.value && loaderType.value === 'issue-category'),
)
const pullRequestsQuery = useRepositoryPullRequestsQuery(
  repositoryOwner,
  repositoryName,
  computed(() => isExpanded.value && loaderType.value === 'repository-pull-requests'),
)
const issuesQuery = useRepositoryIssuesQuery(
  repositoryOwner,
  repositoryName,
  computed(() => isExpanded.value && loaderType.value === 'repository-issues'),
)

const loadedChildren = computed<WorkspaceSidebarTreeItem[]>(() => {
  if (props.item.children) return props.item.children

  if (loaderType.value === 'organization-repositories') {
    return (repositoriesQuery.data.value ?? []).map((repository) =>
      repositoryToTreeItem(repository, {
        activeItemId: props.activeItemId,
        activeUrl: props.activeUrl,
        labels: treeLabels.value,
        scope: loaderScope.value,
      })
    )
  }

  if (loaderType.value === 'repository-pull-requests') {
    return (pullRequestsQuery.data.value ?? []).map((pullRequest) =>
      pullRequestToTreeItem(pullRequest, props.activeUrl, props.activeItemId, loaderScope.value)
    )
  }

  if (loaderType.value === 'pull-request-category') {
    return (pullRequestCategoryQuery.data.value ?? []).map((pullRequest) =>
      pullRequestToTreeItem(pullRequest, props.activeUrl, props.activeItemId, loaderScope.value)
    )
  }

  if (loaderType.value === 'repository-issues') {
    return (issuesQuery.data.value ?? []).map((issue) =>
      issueToTreeItem(issue, props.activeUrl, props.activeItemId, loaderScope.value)
    )
  }

  if (loaderType.value === 'issue-category') {
    return (issueCategoryQuery.data.value ?? []).map((issue) =>
      issueToTreeItem(issue, props.activeUrl, props.activeItemId, loaderScope.value)
    )
  }

  return []
})

const childVisibleCount = computed(() => props.visibleCounts.get(props.item.id) ?? CHILD_VISIBLE_STEP)
const visibleChildren = computed(() => loadedChildren.value.slice(0, childVisibleCount.value))
const showMoreChildren = computed(() => loadedChildren.value.length > childVisibleCount.value)
const childStateVisible = computed(() => isExpanded.value && Boolean(loaderType.value))
const hasLoadedChildren = computed(() => loadedChildren.value.length > 0)
const activeQuery = computed(() => {
  if (loaderType.value === 'organization-repositories') return repositoriesQuery
  if (loaderType.value === 'pull-request-category') return pullRequestCategoryQuery
  if (loaderType.value === 'issue-category') return issueCategoryQuery
  if (loaderType.value === 'repository-pull-requests') return pullRequestsQuery
  if (loaderType.value === 'repository-issues') return issuesQuery

  return null
})
const childEmptyKey = computed(() => {
  if (loaderType.value === 'repository-pull-requests' || loaderType.value === 'pull-request-category') {
    return 'workspace.sidebar.pullRequests.empty'
  }

  if (loaderType.value === 'repository-issues' || loaderType.value === 'issue-category') {
    return 'workspace.sidebar.issues.empty'
  }

  return 'workspace.sidebar.repositories.empty'
})
const childErrorKey = computed(() => {
  if (loaderType.value === 'repository-pull-requests' || loaderType.value === 'pull-request-category') {
    return 'workspace.sidebar.pullRequests.error'
  }

  if (loaderType.value === 'repository-issues' || loaderType.value === 'issue-category') {
    return 'workspace.sidebar.issues.error'
  }

  return 'workspace.sidebar.repositories.error'
})
const showChildLoading = computed(() =>
  childStateVisible.value && Boolean(activeQuery.value?.isLoading.value) && !hasLoadedChildren.value,
)
const showChildError = computed(() =>
  childStateVisible.value && Boolean(activeQuery.value?.error.value) && !hasLoadedChildren.value,
)
const showChildEmpty = computed(() =>
  childStateVisible.value
  && !activeQuery.value?.isLoading.value
  && !activeQuery.value?.error.value
  && !hasLoadedChildren.value,
)

function workItemIconClass(item: WorkspaceSidebarTreeItem): string {
  if (item.workItem?.iconTone === 'success') return 'text-success'
  if (item.workItem?.iconTone === 'destructive') return 'text-destructive'
  if (item.workItem?.iconTone === 'merged') return 'text-[color:var(--accent-purple)]'
  if (item.workItem?.iconTone === 'muted') return 'text-muted-foreground'

  return ''
}

function selectItem(): void {
  if (props.item.url) {
    emit('select', props.item.url, props.item.id)
  }
}

function toggleItem(): void {
  if (hasChevron.value) {
    emit('toggle', props.item.id)
  }
}

function showMoreItems(): void {
  emit(
    'showMore',
    props.item.id,
    Math.min(loadedChildren.value.length, childVisibleCount.value + CHILD_VISIBLE_STEP),
  )
}

watch(
  () => [props.item.id, props.item.forceExpanded] as const,
  ([id, forceExpanded]) => {
    if (forceExpanded && !props.expandedIds.has(id)) {
      emit('autoExpand', id)
    }
  },
  { immediate: true },
)
</script>

<template>
  <SidebarMenuItem v-if="level === 0">
    <SidebarMenuButton
      as="div"
      class="relative gap-1 pr-1 before:hidden"
      :class="item.url ? 'cursor-pointer' : 'cursor-default'"
      role="button"
      size="sm"
      tabindex="0"
      :is-active="item.isActive"
      :tooltip="item.label"
      @click="selectItem"
      @keydown.enter.prevent="selectItem"
      @keydown.space.prevent="selectItem"
    >
      <span
        v-if="item.workItem?.hasUpdates"
        class="absolute left-1 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-info"
      />
      <span class="flex min-w-0 flex-1 items-center gap-2 text-left text-inherit">
        <Avatar
          v-if="item.avatarUrl"
          class="size-4"
        >
          <AvatarImage
            :alt="item.label"
            :src="item.avatarUrl"
          />
          <AvatarFallback class="text-[10px]">
            {{ item.avatarFallback }}
          </AvatarFallback>
        </Avatar>
        <component
          :is="item.icon"
          v-else-if="item.icon"
          class="size-3.5 shrink-0"
          :class="workItemIconClass(item)"
        />
        <span
          v-if="item.workItem?.type === 'pull-request' && item.workItem.ciState"
          class="-ml-3 mt-2 flex size-2.5 shrink-0 items-center justify-center rounded-full border border-sidebar bg-background"
          :class="{
            'bg-warning text-warning-solid-foreground': item.workItem.ciState === 'pending',
            'bg-success text-success-solid-foreground': item.workItem.ciState === 'success',
            'bg-destructive text-destructive-foreground': item.workItem.ciState === 'failure',
          }"
        >
          <Check
            v-if="item.workItem.ciState === 'success'"
            class="size-2"
          />
          <X
            v-else-if="item.workItem.ciState === 'failure'"
            class="size-2"
          />
        </span>
        <span class="truncate">{{ item.label }}</span>
      </span>

      <button
        v-if="hasChevron"
        class="flex size-5 shrink-0 items-center justify-center text-muted-foreground"
        type="button"
        @click.stop="toggleItem"
      >
        <ChevronDown
          v-if="isExpanded"
          class="size-3.5"
        />
        <ChevronRight
          v-else
          class="size-3.5"
        />
      </button>
    </SidebarMenuButton>

    <SidebarMenuSub
      v-if="isExpanded"
      class="!mx-0 !ml-2 !translate-x-0 !border-l-0 !px-0 !pl-1"
    >
      <SidebarMenuSubItem v-if="showChildLoading">
        <SidebarMenuSkeleton show-icon />
      </SidebarMenuSubItem>

      <SidebarMenuSubItem v-else-if="showChildError">
        <p class="px-2 py-1.5 text-caption text-muted-foreground">
          {{ t(childErrorKey) }}
        </p>
      </SidebarMenuSubItem>

      <SidebarMenuSubItem v-else-if="showChildEmpty">
        <p class="px-2 py-1.5 text-caption text-muted-foreground">
          {{ t(childEmptyKey) }}
        </p>
      </SidebarMenuSubItem>

      <WorkspaceSidebarTreeItem
        v-for="child in visibleChildren"
        :key="child.id"
        :active-item-id="activeItemId"
        :active-url="activeUrl"
        :expanded-ids="expandedIds"
        :item="child"
        :level="level + 1"
        :visible-counts="visibleCounts"
        @auto-expand="emit('autoExpand', $event)"
        @select="(url, itemId) => emit('select', url, itemId)"
        @show-more="(listId, visibleCount) => emit('showMore', listId, visibleCount)"
        @toggle="emit('toggle', $event)"
      />

      <SidebarMenuSubItem v-if="showMoreChildren">
        <SidebarMenuSubButton
          as="button"
          class="w-full justify-start"
          size="sm"
          type="button"
          @click="showMoreItems"
        >
          <Ellipsis />
          <span>{{ t('workspace.sidebar.more') }}</span>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    </SidebarMenuSub>
  </SidebarMenuItem>

  <SidebarMenuSubItem v-else>
    <SidebarMenuSubButton
      as="div"
      class="relative gap-1 pr-1"
      :class="item.url ? 'cursor-pointer' : 'cursor-default'"
      role="button"
      size="sm"
      tabindex="0"
      :is-active="item.isActive"
      @click="selectItem"
      @keydown.enter.prevent="selectItem"
      @keydown.space.prevent="selectItem"
    >
      <span
        v-if="item.workItem?.hasUpdates"
        class="absolute left-1 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-info"
      />
      <span class="flex min-w-0 flex-1 items-center gap-2 text-left text-inherit">
        <component
          :is="item.icon"
          v-if="item.icon"
          class="size-3.5 shrink-0"
          :class="workItemIconClass(item)"
        />
        <span
          v-if="item.workItem?.type === 'pull-request' && item.workItem.ciState"
          class="-ml-3 mt-2 flex size-2.5 shrink-0 items-center justify-center rounded-full border border-sidebar bg-background"
          :class="{
            'bg-warning text-warning-solid-foreground': item.workItem.ciState === 'pending',
            'bg-success text-success-solid-foreground': item.workItem.ciState === 'success',
            'bg-destructive text-destructive-foreground': item.workItem.ciState === 'failure',
          }"
        >
          <Check
            v-if="item.workItem.ciState === 'success'"
            class="size-2"
          />
          <X
            v-else-if="item.workItem.ciState === 'failure'"
            class="size-2"
          />
        </span>
        <span class="truncate">{{ item.label }}</span>
      </span>

      <button
        v-if="hasChevron"
        class="flex size-5 shrink-0 items-center justify-center text-muted-foreground"
        type="button"
        @click.stop="toggleItem"
      >
        <ChevronDown
          v-if="isExpanded"
          class="size-3.5"
        />
        <ChevronRight
          v-else
          class="size-3.5"
        />
      </button>
    </SidebarMenuSubButton>

    <SidebarMenuSub
      v-if="isExpanded"
      class="!mx-0 !ml-2 !translate-x-0 !border-l-0 !px-0 !pl-1"
    >
      <WorkspaceSidebarTreeItem
        v-for="child in visibleChildren"
        :key="child.id"
        :active-item-id="activeItemId"
        :active-url="activeUrl"
        :expanded-ids="expandedIds"
        :item="child"
        :level="level + 1"
        :visible-counts="visibleCounts"
        @auto-expand="emit('autoExpand', $event)"
        @select="(url, itemId) => emit('select', url, itemId)"
        @show-more="(listId, visibleCount) => emit('showMore', listId, visibleCount)"
        @toggle="emit('toggle', $event)"
      />

      <SidebarMenuSubItem v-if="showMoreChildren">
        <SidebarMenuSubButton
          as="button"
          class="w-full justify-start"
          size="sm"
          type="button"
          @click="showMoreItems"
        >
          <Ellipsis />
          <span>{{ t('workspace.sidebar.more') }}</span>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    </SidebarMenuSub>
  </SidebarMenuSubItem>
</template>
