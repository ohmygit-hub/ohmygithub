<script setup lang="ts">
import type {
  WorkspaceBookmark,
  WorkspaceBookmarkFolder,
  WorkspaceSidebarTreeItem,
  WorkspaceSidebarTreeMenuAction,
  WorkspaceSidebarTreeSortInput,
} from '../types'
import type { BookmarkMutationResult, CreateBookmarkFolderResult } from '../composables/use-workspace-bookmarks'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, ChevronRight, Folder, Inbox, Plus, Search } from 'lucide-vue-next'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from '@oh-my-github/ui'
import { BOOKMARK_ROOT_LIST_ID } from '../composables/use-workspace-bookmarks'
import {
  accountToTreeItem,
  bookmarkToTreeItem,
  organizationToTreeItem,
} from '../sidebar-tree-items'
import {
  ISSUE_CATEGORIES,
  PULL_REQUEST_CATEGORIES,
  issueCategoryToTreeItem,
  pullRequestCategoryToTreeItem,
} from '../sidebar-work-items'
import WorkspaceSidebarTree from './workspace-sidebar-tree.vue'
import WorkspaceUserPanel from './workspace-user-panel.vue'

type BookmarkRenameTarget =
  | { kind: 'bookmark'; id: string; title: string }
  | { kind: 'folder'; id: string; title: string }

const props = defineProps<{
  activeUrl: string
  bookmarkFolders: WorkspaceBookmarkFolder[]
  bookmarks: WorkspaceBookmark[]
  createBookmarkFolder: (title: string) => CreateBookmarkFolderResult
  deleteBookmark: (bookmarkId: string) => void
  deleteBookmarkFolder: (folderId: string) => void
  isFullscreen: boolean
  moveBookmarkToFolder: (bookmarkId: string, folderId: string | null) => void
  organizations: GitHubOrganization[]
  organizationsError: boolean
  organizationsLoading: boolean
  renameBookmark: (bookmarkId: string, title: string) => BookmarkMutationResult
  renameBookmarkFolder: (folderId: string, title: string) => BookmarkMutationResult
  reorderBookmarkList: (input: WorkspaceSidebarTreeSortInput) => void
  viewer: AuthViewer | null
  width: number
}>()

type WorkspaceSidebarSectionId = 'bookmarks' | 'pull-requests' | 'issues' | 'organizations'
const INBOX_ITEM_ID = 'workspace-sidebar:inbox'
const PINNED_ORGANIZATIONS_STORAGE_KEY = 'oh-my-github:workspace-pinned-organizations:v1'

const emit = defineEmits<{
  copyGitHubUrl: [url: string]
  openBookmarkFolder: [urls: string[]]
  openGitHubUrl: [url: string]
  openNewTab: [url: string]
  search: []
  select: [url: string]
  startResize: [event: PointerEvent]
}>()

const { t } = useI18n()
const { state } = useSidebar()
const expandedIds = reactive(new Set<string>())
const collapsedSectionIds = reactive(new Set<WorkspaceSidebarSectionId>())
const visibleCounts = reactive(new Map<string, number>())
const activeItemId = ref<string | null>(null)
const activeItemUrl = ref<string | null>(null)
const pendingSelectedUrl = ref<string | null>(null)
const isBookmarkFolderDialogOpen = ref(false)
const bookmarkFolderTitle = ref('')
const bookmarkFolderError = ref<'duplicate' | 'empty' | null>(null)
const bookmarkRenameTarget = ref<BookmarkRenameTarget | null>(null)
const bookmarkRenameTitle = ref('')
const bookmarkRenameError = ref<'duplicate' | 'empty' | 'not-found' | null>(null)
const pinnedOrganizationLogins = ref(readPinnedOrganizationLogins())
const hasOrganizations = computed(() => Boolean(props.viewer) || props.organizations.length > 0)
const showOrganizationsLoading = computed(() => props.organizationsLoading && !hasOrganizations.value)
const showOrganizationsError = computed(() => props.organizationsError && !hasOrganizations.value)
const showOrganizationsEmpty = computed(() =>
  !props.organizationsLoading && !props.organizationsError && !hasOrganizations.value,
)
const treeLabels = computed(() => ({
  issues: t('workspace.sidebar.groups.issues'),
  pullRequests: t('workspace.sidebar.groups.pullRequests'),
}))
const sidebarStyle = computed<Record<string, string>>(() => ({
  width: `${props.width}px`,
  marginLeft: state.value === 'expanded' ? '0px' : `-${props.width}px`,
  transition: 'margin-left 200ms cubic-bezier(0.32, 0.72, 0, 1)',
  '--sidebar-primary': 'var(--foreground)',
  '--sidebar-ring': 'var(--border)',
  '--color-sidebar-primary': 'var(--foreground)',
  '--color-sidebar-ring': 'var(--border)',
}))
const rootBookmarks = computed(() => props.bookmarks.filter((bookmark) => bookmark.folderId === null))
const pinnedOrganizationLoginSet = computed(() => new Set(pinnedOrganizationLogins.value))
const sortedOrganizations = computed(() => {
  const organizationsByLogin = new Map(props.organizations.map((organization) => [organization.login, organization]))
  const pinnedOrganizations = pinnedOrganizationLogins.value
    .map((login) => organizationsByLogin.get(login))
    .filter((organization): organization is GitHubOrganization => Boolean(organization))
  const pinnedLogins = new Set(pinnedOrganizations.map((organization) => organization.login))

  return [
    ...pinnedOrganizations,
    ...props.organizations.filter((organization) => !pinnedLogins.has(organization.login)),
  ]
})
const bookmarkItems = computed<WorkspaceSidebarTreeItem[]>(() => {
  const folderItems = props.bookmarkFolders.map((folder) => {
    const children = props.bookmarks
      .filter((bookmark) => bookmark.folderId === folder.id)
      .map((bookmark) => bookmarkToTreeItem(bookmark, {
        activeItemId: activeItemId.value,
        activeUrl: props.activeUrl,
        labels: treeLabels.value,
      }))

    return {
      id: `bookmark-folder:${folder.id}`,
      label: folder.title,
      actionContext: {
        kind: 'bookmark-folder' as const,
        folderId: folder.id,
      },
      icon: Folder,
      canExpand: children.length > 0,
      children,
    }
  })

  return [
    ...folderItems,
    ...rootBookmarks.value.map((bookmark) => bookmarkToTreeItem(bookmark, {
      activeItemId: activeItemId.value,
      activeUrl: props.activeUrl,
      labels: treeLabels.value,
    })),
  ]
})
const showBookmarksEmpty = computed(() => props.bookmarkFolders.length === 0 && props.bookmarks.length === 0)
const bookmarkFolderErrorMessage = computed(() => {
  if (!bookmarkFolderError.value) return ''
  return t(`workspace.bookmarks.folderErrors.${bookmarkFolderError.value}`)
})
const bookmarkRenameErrorMessage = computed(() => {
  if (!bookmarkRenameError.value) return ''
  return t(`workspace.bookmarks.renameErrors.${bookmarkRenameError.value}`)
})
const bookmarkRenameTitleLabel = computed(() => {
  if (bookmarkRenameTarget.value?.kind === 'folder') return t('workspace.bookmarks.renameFolder')

  return t('workspace.bookmarks.renameBookmark')
})
const pullRequestItems = computed<WorkspaceSidebarTreeItem[]>(() => {
  return PULL_REQUEST_CATEGORIES.map((category) =>
    pullRequestCategoryToTreeItem(
      category,
      t(`workspace.sidebar.pullRequestCategories.${category}`),
      activeItemId.value,
      props.activeUrl,
    )
  )
})
const issueItems = computed<WorkspaceSidebarTreeItem[]>(() => {
  return ISSUE_CATEGORIES.map((category) =>
    issueCategoryToTreeItem(
      category,
      t(`workspace.sidebar.issueCategories.${category}`),
      activeItemId.value,
      props.activeUrl,
    )
  )
})

const organizationItems = computed<WorkspaceSidebarTreeItem[]>(() => {
  const accountItem = props.viewer
    ? [accountToTreeItem(props.viewer, {
      activeItemId: activeItemId.value,
      activeUrl: props.activeUrl,
      labels: treeLabels.value,
      scope: 'organizations',
    })]
    : []

  return [
    ...accountItem,
    ...sortedOrganizations.value.map((organization) =>
      organizationToTreeItem(organization, {
        activeItemId: activeItemId.value,
        activeUrl: props.activeUrl,
        labels: treeLabels.value,
        scope: 'organizations',
      })
    ),
  ]
})

function toggleExpanded(id: string): void {
  if (expandedIds.has(id)) {
    expandedIds.delete(id)
    return
  }

  expandedIds.add(id)
}

function toggleSection(id: WorkspaceSidebarSectionId): void {
  if (collapsedSectionIds.has(id)) {
    collapsedSectionIds.delete(id)
    return
  }

  collapsedSectionIds.add(id)
}

function isSectionExpanded(id: WorkspaceSidebarSectionId): boolean {
  return !collapsedSectionIds.has(id)
}

function sectionToggleLabel(id: WorkspaceSidebarSectionId, title: string): string {
  return t(isSectionExpanded(id) ? 'workspace.sidebar.collapseGroup' : 'workspace.sidebar.expandGroup', {
    title,
  })
}

function setVisibleCount(listId: string, visibleCount: number): void {
  visibleCounts.set(listId, visibleCount)
}

function selectSidebarItem(url: string, itemId: string): void {
  activeItemId.value = itemId
  activeItemUrl.value = url
  pendingSelectedUrl.value = url === props.activeUrl ? null : url
  emit('select', url)
}

function isInboxActive(): boolean {
  return activeItemId.value ? activeItemId.value === INBOX_ITEM_ID : props.activeUrl === '/inbox'
}

function syncActiveItem(): void {
  if (pendingSelectedUrl.value) {
    if (pendingSelectedUrl.value === props.activeUrl) {
      pendingSelectedUrl.value = null
    }

    return
  }

  if (activeItemId.value && activeItemUrl.value === props.activeUrl) {
    return
  }

  const nextItemId = props.activeUrl === '/inbox'
    ? INBOX_ITEM_ID
    : findFirstItemIdByUrl([
      ...bookmarkItems.value,
      ...pullRequestItems.value,
      ...issueItems.value,
      ...organizationItems.value,
    ], props.activeUrl)

  activeItemId.value = nextItemId
  activeItemUrl.value = nextItemId ? props.activeUrl : null
}

function findFirstItemIdByUrl(items: WorkspaceSidebarTreeItem[], url: string): string | null {
  for (const item of items) {
    if (item.url === url) {
      return item.id
    }

    if (item.children?.length) {
      const childItemId = findFirstItemIdByUrl(item.children, url)
      if (childItemId) return childItemId
    }
  }

  return null
}

function submitBookmarkFolder(): void {
  const result = props.createBookmarkFolder(bookmarkFolderTitle.value)

  if (!result.ok) {
    bookmarkFolderError.value = result.reason
    return
  }

  isBookmarkFolderDialogOpen.value = false
}

function resetBookmarkFolderDialog(): void {
  bookmarkFolderTitle.value = ''
  bookmarkFolderError.value = null
}

function handleTreeAction(action: WorkspaceSidebarTreeMenuAction): void {
  if (action.type === 'open-new-tab' && action.item.url) {
    emit('openNewTab', action.item.url)
    return
  }

  if (action.type === 'copy-github-url') {
    emit('copyGitHubUrl', action.url)
    return
  }

  if (action.type === 'open-github-url') {
    emit('openGitHubUrl', action.url)
    return
  }

  if (action.type === 'rename-bookmark') {
    openBookmarkRenameDialog({ kind: 'bookmark', id: action.bookmarkId, title: action.item.label })
    return
  }

  if (action.type === 'delete-bookmark') {
    props.deleteBookmark(action.bookmarkId)
    return
  }

  if (action.type === 'move-bookmark') {
    props.moveBookmarkToFolder(action.bookmarkId, action.folderId)
    return
  }

  if (action.type === 'open-bookmark-folder') {
    const urls = props.bookmarks
      .filter((bookmark) => bookmark.folderId === action.folderId)
      .map((bookmark) => bookmark.url)

    if (urls.length > 0) {
      emit('openBookmarkFolder', urls)
    }
    return
  }

  if (action.type === 'rename-bookmark-folder') {
    openBookmarkRenameDialog({ kind: 'folder', id: action.folderId, title: action.item.label })
    return
  }

  if (action.type === 'delete-bookmark-folder') {
    props.deleteBookmarkFolder(action.folderId)
    return
  }

  if (action.type === 'toggle-organization-pin') {
    toggleOrganizationPin(action.login)
  }
}

function openBookmarkRenameDialog(target: BookmarkRenameTarget): void {
  bookmarkRenameTarget.value = target
  bookmarkRenameTitle.value = target.title
  bookmarkRenameError.value = null
}

function submitBookmarkRename(): void {
  const target = bookmarkRenameTarget.value
  if (!target) return

  const result = target.kind === 'bookmark'
    ? props.renameBookmark(target.id, bookmarkRenameTitle.value)
    : props.renameBookmarkFolder(target.id, bookmarkRenameTitle.value)

  if (!result.ok) {
    bookmarkRenameError.value = result.reason
    return
  }

  closeBookmarkRenameDialog()
}

function closeBookmarkRenameDialog(): void {
  bookmarkRenameTarget.value = null
  bookmarkRenameTitle.value = ''
  bookmarkRenameError.value = null
}

function toggleOrganizationPin(login: string): void {
  const isPinned = pinnedOrganizationLogins.value.includes(login)
  pinnedOrganizationLogins.value = isPinned
    ? pinnedOrganizationLogins.value.filter((item) => item !== login)
    : [login, ...pinnedOrganizationLogins.value.filter((item) => item !== login)]

  persistPinnedOrganizationLogins(pinnedOrganizationLogins.value)
}

function reorderBookmarkList(input: WorkspaceSidebarTreeSortInput): void {
  props.reorderBookmarkList(input)
}

watch(isBookmarkFolderDialogOpen, (isOpen) => {
  if (!isOpen) {
    resetBookmarkFolderDialog()
  }
})

watch(bookmarkFolderTitle, () => {
  bookmarkFolderError.value = null
})

watch(bookmarkRenameTitle, () => {
  bookmarkRenameError.value = null
})

watch(
  () => [props.activeUrl, bookmarkItems.value, pullRequestItems.value, issueItems.value, organizationItems.value],
  () => {
    syncActiveItem()
  },
  { immediate: true },
)

function readPinnedOrganizationLogins(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(PINNED_ORGANIZATIONS_STORAGE_KEY) ?? '[]') as unknown
    if (!Array.isArray(parsed)) return []

    return parsed.filter((login): login is string => typeof login === 'string' && login.trim().length > 0)
  } catch {
    return []
  }
}

function persistPinnedOrganizationLogins(logins: string[]): void {
  localStorage.setItem(PINNED_ORGANIZATIONS_STORAGE_KEY, JSON.stringify(logins))
}
</script>

<template>
  <aside
    data-workspace-sidebar
    class="relative flex h-full shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground"
    :style="sidebarStyle"
  >
    <SidebarHeader
      :class="isFullscreen
        ? 'gap-0 px-2 pb-1 pt-0'
        : 'gap-2 px-2 pb-2 pt-0'"
    >
      <div
        aria-hidden="true"
        class="workspace-titlebar-spacer"
        :data-fullscreen="isFullscreen ? 'true' : undefined"
      />
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            class="before:hidden focus-visible:ring-0 focus-visible:ring-offset-0"
            size="sm"
            :tooltip="t('workspace.sidebar.search')"
            type="button"
            @click="emit('search')"
          >
            <Search />
            <span>{{ t('workspace.sidebar.search') }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            class="before:hidden"
            size="sm"
            :is-active="isInboxActive()"
            :tooltip="t('workspace.sidebar.items.inbox')"
            type="button"
            @click="selectSidebarItem('/inbox', INBOX_ITEM_ID)"
          >
            <Inbox />
            <span>{{ t('workspace.sidebar.items.inbox') }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup class="px-2 py-1">
        <div class="flex h-7 items-center gap-1 px-2 pr-1">
          <SidebarGroupLabel class="h-6 flex-1 px-0 text-caption">
            {{ t('workspace.bookmarks.title') }}
          </SidebarGroupLabel>
          <button
            :aria-label="t('workspace.bookmarks.newFolder')"
            class="flex size-5 shrink-0 items-center justify-center text-muted-foreground outline-hidden transition-colors hover:text-foreground focus-visible:text-foreground"
            type="button"
            @click="isBookmarkFolderDialogOpen = true"
          >
            <Plus class="size-3.5" />
          </button>
          <button
            :aria-label="sectionToggleLabel('bookmarks', t('workspace.bookmarks.title'))"
            class="flex size-5 shrink-0 items-center justify-center text-muted-foreground outline-hidden transition-colors hover:text-foreground focus-visible:text-foreground"
            type="button"
            @click="toggleSection('bookmarks')"
          >
            <ChevronDown
              v-if="isSectionExpanded('bookmarks')"
              class="size-3.5"
            />
            <ChevronRight
              v-else
              class="size-3.5"
            />
          </button>
        </div>

        <SidebarGroupContent v-if="isSectionExpanded('bookmarks')">
          <p
            v-if="showBookmarksEmpty"
            class="px-2 py-1.5 text-caption text-muted-foreground"
          >
            {{ t('workspace.bookmarks.empty') }}
          </p>

          <WorkspaceSidebarTree
            v-else
            :active-item-id="activeItemId"
            :active-url="activeUrl"
            :bookmark-folders="bookmarkFolders"
            :expanded-ids="expandedIds"
            :items="bookmarkItems"
            list-id="bookmarks"
            :pinned-organization-logins="pinnedOrganizationLoginSet"
            sortable
            :sortable-list-id="BOOKMARK_ROOT_LIST_ID"
            :visible-counts="visibleCounts"
            @action="handleTreeAction"
            @select="selectSidebarItem"
            @show-more="setVisibleCount"
            @sort="reorderBookmarkList"
            @toggle="toggleExpanded"
          />
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup class="px-2 py-1">
        <div class="flex h-7 items-center gap-1 px-2 pr-1">
          <SidebarGroupLabel class="h-6 flex-1 px-0 text-caption">
            {{ t('workspace.sidebar.groups.pullRequests') }}
          </SidebarGroupLabel>
          <button
            :aria-label="sectionToggleLabel('pull-requests', t('workspace.sidebar.groups.pullRequests'))"
            class="flex size-5 shrink-0 items-center justify-center text-muted-foreground outline-hidden transition-colors hover:text-foreground focus-visible:text-foreground"
            type="button"
            @click="toggleSection('pull-requests')"
          >
            <ChevronDown
              v-if="isSectionExpanded('pull-requests')"
              class="size-3.5"
            />
            <ChevronRight
              v-else
              class="size-3.5"
            />
          </button>
        </div>

        <SidebarGroupContent v-if="isSectionExpanded('pull-requests')">
          <WorkspaceSidebarTree
            :active-item-id="activeItemId"
            :active-url="activeUrl"
            :bookmark-folders="bookmarkFolders"
            :expanded-ids="expandedIds"
            :items="pullRequestItems"
            list-id="viewer-pull-requests"
            :pinned-organization-logins="pinnedOrganizationLoginSet"
            :visible-counts="visibleCounts"
            @action="handleTreeAction"
            @select="selectSidebarItem"
            @show-more="setVisibleCount"
            @toggle="toggleExpanded"
          />
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup class="px-2 py-1">
        <div class="flex h-7 items-center gap-1 px-2 pr-1">
          <SidebarGroupLabel class="h-6 flex-1 px-0 text-caption">
            {{ t('workspace.sidebar.groups.issues') }}
          </SidebarGroupLabel>
          <button
            :aria-label="sectionToggleLabel('issues', t('workspace.sidebar.groups.issues'))"
            class="flex size-5 shrink-0 items-center justify-center text-muted-foreground outline-hidden transition-colors hover:text-foreground focus-visible:text-foreground"
            type="button"
            @click="toggleSection('issues')"
          >
            <ChevronDown
              v-if="isSectionExpanded('issues')"
              class="size-3.5"
            />
            <ChevronRight
              v-else
              class="size-3.5"
            />
          </button>
        </div>

        <SidebarGroupContent v-if="isSectionExpanded('issues')">
          <WorkspaceSidebarTree
            :active-item-id="activeItemId"
            :active-url="activeUrl"
            :bookmark-folders="bookmarkFolders"
            :expanded-ids="expandedIds"
            :items="issueItems"
            list-id="viewer-issues"
            :pinned-organization-logins="pinnedOrganizationLoginSet"
            :visible-counts="visibleCounts"
            @action="handleTreeAction"
            @select="selectSidebarItem"
            @show-more="setVisibleCount"
            @toggle="toggleExpanded"
          />
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup class="px-2 py-1">
        <div class="flex h-7 items-center gap-1 px-2 pr-1">
          <SidebarGroupLabel class="h-6 flex-1 px-0 text-caption">
            {{ t('workspace.sidebar.groups.organizations') }}
          </SidebarGroupLabel>
          <button
            :aria-label="sectionToggleLabel('organizations', t('workspace.sidebar.groups.organizations'))"
            class="flex size-5 shrink-0 items-center justify-center text-muted-foreground outline-hidden transition-colors hover:text-foreground focus-visible:text-foreground"
            type="button"
            @click="toggleSection('organizations')"
          >
            <ChevronDown
              v-if="isSectionExpanded('organizations')"
              class="size-3.5"
            />
            <ChevronRight
              v-else
              class="size-3.5"
            />
          </button>
        </div>
        <SidebarGroupContent v-if="isSectionExpanded('organizations')">
          <SidebarMenu v-if="showOrganizationsLoading">
            <SidebarMenuItem
              v-for="index in 3"
              :key="index"
            >
              <SidebarMenuSkeleton show-icon />
            </SidebarMenuItem>
          </SidebarMenu>

          <p
            v-else-if="showOrganizationsError"
            class="px-2 py-1.5 text-caption text-muted-foreground"
          >
            {{ t('workspace.sidebar.organizations.error') }}
          </p>

          <p
            v-else-if="showOrganizationsEmpty"
            class="px-2 py-1.5 text-caption text-muted-foreground"
          >
            {{ t('workspace.sidebar.organizations.empty') }}
          </p>

          <WorkspaceSidebarTree
            v-else
            :active-item-id="activeItemId"
            :active-url="activeUrl"
            :bookmark-folders="bookmarkFolders"
            :expanded-ids="expandedIds"
            :items="organizationItems"
            list-id="organizations"
            :pinned-organization-logins="pinnedOrganizationLoginSet"
            :visible-counts="visibleCounts"
            @action="handleTreeAction"
            @select="selectSidebarItem"
            @show-more="setVisibleCount"
            @toggle="toggleExpanded"
          />
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter
      v-if="viewer"
      class="border-t border-border"
    >
      <WorkspaceUserPanel :viewer="viewer" />
    </SidebarFooter>

    <button
      class="group absolute right-0 top-0 z-20 h-full w-1 translate-x-1/2 cursor-col-resize bg-transparent outline-hidden"
      :aria-label="t('workspace.sidebar.resize')"
      role="separator"
      type="button"
      @pointerdown="emit('startResize', $event)"
    >
      <span class="block h-full w-full transition-colors group-hover:bg-border group-focus-visible:bg-sidebar-ring" />
    </button>
  </aside>

  <Dialog v-model:open="isBookmarkFolderDialogOpen">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ t('workspace.bookmarks.newFolder') }}</DialogTitle>
        <DialogDescription class="sr-only">
          {{ t('workspace.bookmarks.newFolderDescription') }}
        </DialogDescription>
      </DialogHeader>

      <form
        class="space-y-4"
        @submit.prevent="submitBookmarkFolder"
      >
        <div class="space-y-2">
          <Label for="workspace-bookmark-folder-title">
            {{ t('workspace.bookmarks.folderName') }}
          </Label>
          <Input
            id="workspace-bookmark-folder-title"
            v-model="bookmarkFolderTitle"
            autocomplete="off"
            :placeholder="t('workspace.bookmarks.folderNamePlaceholder')"
          />
          <p
            v-if="bookmarkFolderErrorMessage"
            class="text-caption text-destructive"
          >
            {{ bookmarkFolderErrorMessage }}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            @click="isBookmarkFolderDialogOpen = false"
          >
            {{ t('workspace.bookmarks.cancel') }}
          </Button>
          <Button type="submit">
            {{ t('workspace.bookmarks.createFolder') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>

  <Dialog
    :open="Boolean(bookmarkRenameTarget)"
    @update:open="(isOpen) => { if (!isOpen) closeBookmarkRenameDialog() }"
  >
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ bookmarkRenameTitleLabel }}</DialogTitle>
        <DialogDescription class="sr-only">
          {{ t('workspace.bookmarks.renameDescription') }}
        </DialogDescription>
      </DialogHeader>

      <form
        class="space-y-4"
        @submit.prevent="submitBookmarkRename"
      >
        <div class="space-y-2">
          <Label for="workspace-bookmark-rename-title">
            {{ t('workspace.bookmarks.name') }}
          </Label>
          <Input
            id="workspace-bookmark-rename-title"
            v-model="bookmarkRenameTitle"
            autocomplete="off"
          />
          <p
            v-if="bookmarkRenameErrorMessage"
            class="text-caption text-destructive"
          >
            {{ bookmarkRenameErrorMessage }}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            @click="closeBookmarkRenameDialog"
          >
            {{ t('workspace.bookmarks.cancel') }}
          </Button>
          <Button type="submit">
            {{ t('workspace.bookmarks.save') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.workspace-titlebar-spacer {
  height: 2.25rem;
  -webkit-app-region: drag;
}

.workspace-titlebar-spacer[data-fullscreen="true"] {
  height: 0.25rem;
}

[data-workspace-sidebar] :deep([data-slot="sidebar-header"]) {
  -webkit-app-region: drag;
}

[data-workspace-sidebar] :deep([data-slot="sidebar-header"] button),
[data-workspace-sidebar] :deep([data-slot="sidebar-header"] [role="button"]) {
  -webkit-app-region: no-drag;
}

:deep([data-workspace-sidebar] [data-sidebar="menu-button"][data-active="true"]::before) {
  display: none !important;
}

:deep([data-workspace-sidebar] [data-sidebar="menu-button"]:focus-visible) {
  box-shadow: none !important;
}

:deep([data-workspace-sidebar] [data-sidebar="menu-sub-button"]:focus-visible) {
  box-shadow: none !important;
}
</style>
