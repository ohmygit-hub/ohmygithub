<script setup lang="ts">
import type {
  WorkspaceBookmarkFolder,
  WorkspaceSidebarTreeItem as WorkspaceSidebarTreeItemData,
  WorkspaceSidebarTreeMenuAction,
  WorkspaceSidebarTreeSortInput,
} from '../types'
import type { UseSortableOptions } from '@vueuse/integrations/useSortable'
import { computed, ref, watch } from 'vue'
import { useSortable } from '@vueuse/integrations/useSortable'
import { useI18n } from 'vue-i18n'
import { Ellipsis } from 'lucide-vue-next'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@oh-my-github/ui'
import { BOOKMARK_FOLDER_LIST_PREFIX, BOOKMARK_ITEM_ID_PREFIX } from '../composables/use-workspace-bookmarks'
import WorkspaceSidebarTreeItemComponent from './workspace-sidebar-tree-item.vue'

const ROOT_VISIBLE_STEP = 4
type WorkspaceSortableOptions = UseSortableOptions & {
  draggable?: string
}

const props = defineProps<{
  items: WorkspaceSidebarTreeItemData[]
  activeItemId: string | null
  expandedIds: Set<string>
  visibleCounts: Map<string, number>
  listId: string
  activeUrl: string
  bookmarkFolders?: WorkspaceBookmarkFolder[]
  pinnedOrganizationLogins?: Set<string>
  sortable?: boolean
  sortableListId?: string
}>()

const emit = defineEmits<{
  action: [action: WorkspaceSidebarTreeMenuAction]
  select: [url: string, itemId: string]
  showMore: [listId: string, visibleCount: number]
  sort: [input: WorkspaceSidebarTreeSortInput]
  toggle: [id: string]
}>()

const { t } = useI18n()
const rootList = ref<HTMLElement | null>(null)
const emptyPinnedOrganizationLogins = new Set<string>()

const visibleCount = computed(() => props.visibleCounts.get(props.listId) ?? ROOT_VISIBLE_STEP)
const visibleItems = computed(() => props.items.slice(0, visibleCount.value))
const showMore = computed(() => props.items.length > visibleCount.value)
const sortableListId = computed(() => props.sortableListId ?? props.listId)
const sortable = useSortable(rootList, visibleItems, {
  draggable: '[data-workspace-draggable="true"]',
  group: 'workspace-bookmarks',
  watchElement: true,
  onAdd: handleSortableChange,
  onMove: canMoveSortableItem,
  onUpdate: handleSortableChange,
} satisfies WorkspaceSortableOptions)

watch(
  () => props.sortable,
  (isSortable) => {
    sortable.option('disabled', !isSortable)
  },
  { immediate: true },
)

function showMoreItems(): void {
  emit('showMore', props.listId, Math.min(props.items.length, visibleCount.value + ROOT_VISIBLE_STEP))
}

function handleSortableChange(event: { to: HTMLElement }): void {
  if (!props.sortable) return

  const listId = event.to.dataset.sortableListId
  if (!listId) return

  emit('sort', {
    listId,
    itemIds: sortableItemIds(event.to),
  })
}

function canMoveSortableItem(event: { dragged: HTMLElement; to: HTMLElement }): boolean {
  if (!props.sortable) return false

  const itemId = event.dragged.dataset.sidebarItemId
  const listId = event.to.dataset.sortableListId
  if (!itemId || !listId) return false

  if (itemId.startsWith(BOOKMARK_FOLDER_LIST_PREFIX)) {
    return listId === sortableListId.value
  }

  return itemId.startsWith(BOOKMARK_ITEM_ID_PREFIX)
}

function sortableItemIds(container: HTMLElement): string[] {
  return Array.from(container.children)
    .flatMap((child) => {
      if (!(child instanceof HTMLElement)) return []
      const itemId = child.dataset.sidebarItemId
      return itemId ? [itemId] : []
    })
}
</script>

<template>
  <SidebarMenu
    ref="rootList"
    :data-sortable-list-id="sortable ? sortableListId : undefined"
  >
    <WorkspaceSidebarTreeItemComponent
      v-for="item in visibleItems"
      :key="item.id"
      :active-item-id="activeItemId"
      :active-url="activeUrl"
      :bookmark-folders="bookmarkFolders ?? []"
      :expanded-ids="expandedIds"
      :item="item"
      :level="0"
      :pinned-organization-logins="pinnedOrganizationLogins ?? emptyPinnedOrganizationLogins"
      :sortable-bookmarks="Boolean(sortable)"
      :visible-counts="visibleCounts"
      @action="emit('action', $event)"
      @select="(url: string, itemId: string) => emit('select', url, itemId)"
      @show-more="(listId: string, visibleCount: number) => emit('showMore', listId, visibleCount)"
      @sort="emit('sort', $event)"
      @toggle="emit('toggle', $event)"
    />

    <SidebarMenuItem v-if="showMore">
      <SidebarMenuButton
        size="sm"
        :tooltip="t('workspace.sidebar.more')"
        type="button"
        @click="showMoreItems"
      >
        <Ellipsis />
        <span>{{ t('workspace.sidebar.more') }}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
