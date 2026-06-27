<script setup lang="ts">
import type { WorkspaceSidebarTreeItem } from '../types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Book, ChevronDown, ChevronRight, Ellipsis } from 'lucide-vue-next'
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
import { useWorkspaceOrganizationRepositories } from '../composables/use-workspace-organizations'

defineOptions({
  name: 'WorkspaceSidebarTreeItem',
})

const CHILD_VISIBLE_STEP = 10

const props = defineProps<{
  activeUrl: string
  expandedIds: Set<string>
  item: WorkspaceSidebarTreeItem
  level: number
  visibleCounts: Map<string, number>
}>()

const emit = defineEmits<{
  select: [url: string]
  showMore: [listId: string, visibleCount: number]
  toggle: [id: string]
}>()

const { t } = useI18n()

const isExpanded = computed(() => props.item.forceExpanded || props.expandedIds.has(props.item.id))
const hasChevron = computed(() => props.item.canExpand || Boolean(props.item.children?.length))
const repositoryOwner = computed(() => props.item.childrenLoader?.owner ?? '')

const repositoriesQuery = useWorkspaceOrganizationRepositories(
  repositoryOwner,
  computed(() => isExpanded.value && props.item.childrenLoader?.type === 'organization-repositories'),
)

const loadedChildren = computed<WorkspaceSidebarTreeItem[]>(() => {
  if (props.item.children) return props.item.children
  if (props.item.childrenLoader?.type !== 'organization-repositories') return []

  return (repositoriesQuery.data.value ?? []).map((repository) => {
    const url = `/${repository.owner}/${repository.name}`

    return {
      id: `repo:${repository.nameWithOwner}`,
      label: repository.name,
      url,
      icon: Book,
      isActive: props.activeUrl === url,
    }
  })
})

const childVisibleCount = computed(() => props.visibleCounts.get(props.item.id) ?? CHILD_VISIBLE_STEP)
const visibleChildren = computed(() => loadedChildren.value.slice(0, childVisibleCount.value))
const showMoreChildren = computed(() => loadedChildren.value.length > childVisibleCount.value)
const childStateVisible = computed(() => isExpanded.value && props.item.childrenLoader?.type === 'organization-repositories')
const hasLoadedChildren = computed(() => loadedChildren.value.length > 0)
const showChildLoading = computed(() =>
  childStateVisible.value && repositoriesQuery.isLoading.value && !hasLoadedChildren.value,
)
const showChildError = computed(() =>
  childStateVisible.value && Boolean(repositoriesQuery.error.value) && !hasLoadedChildren.value,
)
const showChildEmpty = computed(() =>
  childStateVisible.value
  && !repositoriesQuery.isLoading.value
  && !repositoriesQuery.error.value
  && !hasLoadedChildren.value,
)

function selectItem(): void {
  if (props.item.url) {
    emit('select', props.item.url)
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
</script>

<template>
  <SidebarMenuItem v-if="level === 0">
    <SidebarMenuButton
      as="div"
      class="gap-1 pr-1"
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
        />
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
          {{ t('workspace.sidebar.repositories.error') }}
        </p>
      </SidebarMenuSubItem>

      <SidebarMenuSubItem v-else-if="showChildEmpty">
        <p class="px-2 py-1.5 text-caption text-muted-foreground">
          {{ t('workspace.sidebar.repositories.empty') }}
        </p>
      </SidebarMenuSubItem>

      <WorkspaceSidebarTreeItem
        v-for="child in visibleChildren"
        :key="child.id"
        :active-url="activeUrl"
        :expanded-ids="expandedIds"
        :item="child"
        :level="level + 1"
        :visible-counts="visibleCounts"
        @select="emit('select', $event)"
        @show-more="(listId, visibleCount) => emit('showMore', listId, visibleCount)"
        @toggle="emit('toggle', $event)"
      />

      <SidebarMenuSubItem v-if="showMoreChildren">
        <SidebarMenuSubButton
          as="button"
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
      class="gap-1 pr-1"
      :class="item.url ? 'cursor-pointer' : 'cursor-default'"
      role="button"
      size="sm"
      tabindex="0"
      :is-active="item.isActive"
      @click="selectItem"
      @keydown.enter.prevent="selectItem"
      @keydown.space.prevent="selectItem"
    >
      <span class="flex min-w-0 flex-1 items-center gap-2 text-left text-inherit">
        <component
          :is="item.icon"
          v-if="item.icon"
          class="size-3.5 shrink-0"
        />
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
        :active-url="activeUrl"
        :expanded-ids="expandedIds"
        :item="child"
        :level="level + 1"
        :visible-counts="visibleCounts"
        @select="emit('select', $event)"
        @show-more="(listId, visibleCount) => emit('showMore', listId, visibleCount)"
        @toggle="emit('toggle', $event)"
      />

      <SidebarMenuSubItem v-if="showMoreChildren">
        <SidebarMenuSubButton
          as="button"
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
