<script setup lang="ts">
import type { WorkspaceTab } from './types'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { SidebarInset, SidebarProvider } from '@oh-my-github/ui'
import { useWorkspaceBookmarks } from './composables/use-workspace-bookmarks'
import { useWorkspaceSearchRequestSignal } from './composables/use-workspace-search-request'
import { useOrganizationsQuery } from '@/composables/github/use-organizations'
import { useViewerRepositoriesQuery } from '@/composables/github/use-accounts'
import { useRightPanel } from '@/composables/use-right-panel'
import { useToast } from '@/composables/use-toast'
import { registerKeyboardShortcutHandler } from '@/keyboard/shortcut-runtime'
import { useWorkspaceTabs } from './composables/use-workspace-tabs'
import { getWorkspaceTabView } from './tab-presentation'
import { workspaceTabToGitHubUrl } from './workspace-github-url'
import WorkspaceSidebar from './components/workspace-sidebar.vue'
import WorkspaceSearchDialog from './components/workspace-search-dialog.vue'
import WorkspaceTabs from './components/workspace-tabs.vue'

const SIDEBAR_WIDTH_STORAGE_KEY = 'oh-my-github:workspace-sidebar-width:v1'
const DEFAULT_SIDEBAR_WIDTH = 384
const MIN_SIDEBAR_WIDTH = 240
const MAX_SIDEBAR_WIDTH = 640

const isSidebarOpen = ref(true)
const isSidebarResizing = ref(false)
const isSearchDialogOpen = ref(false)
const isWindowFullscreen = ref(false)
const sidebarWidth = ref(readStoredSidebarWidth())
const viewer = ref<AuthViewer | null>(null)
let stopFullscreenListener: (() => void) | undefined
const shortcutUnregisters: Array<() => void> = []
let resizeStartX = 0
let resizeStartWidth = 0

const route = useRoute()
const { t } = useI18n()
const { toggleRightPanel } = useRightPanel()
const toast = useToast()
const {
  activeTab,
  activeUrl,
  canGoBack,
  canGoForward,
  closeTab,
  goBack,
  goForward,
  openWorkspaceTab,
  replaceActiveTabUrl,
  selectTab,
  tabs,
} = useWorkspaceTabs()

const organizationsQuery = useOrganizationsQuery()
// Warm the Ctrl-K palette's repository cache on workspace load so the first search is
// instant; the query stays session-warm (see useViewerRepositoriesQuery).
useViewerRepositoriesQuery()
const activeGithubUrl = computed(() => activeTab.value ? workspaceTabToGitHubUrl(activeTab.value) : null)
const organizations = computed(() => organizationsQuery.data.value ?? [])
const organizationsLoading = computed(() => organizationsQuery.isLoading.value)
const organizationsError = computed(() => Boolean(organizationsQuery.error.value))
const sidebarWidthValue = computed(() => `${sidebarWidth.value}px`)
const organizationsByLogin = computed(() => {
  return new Map(organizations.value.map((organization) => [organization.login, organization]))
})
const {
  bookmarkedUrls,
  bookmarks,
  createFolder: createBookmarkFolder,
  folders: bookmarkFolders,
  moveBookmarkToFolder,
  removeBookmark,
  removeBookmarkById,
  removeFolder: deleteBookmarkFolder,
  renameBookmark,
  renameFolder: renameBookmarkFolder,
  reorderBookmarkList,
  addBookmark,
} = useWorkspaceBookmarks()
const canUseWorkspaceShortcuts = computed(() => route.name !== 'settings' && !isSearchDialogOpen.value)

onMounted(async () => {
  registerWorkspaceShortcuts()

  try {
    const authState = await window.ohMyGithub?.auth?.get?.()
    viewer.value = authState?.auth?.viewer ?? null
  } catch {
    viewer.value = null
  }

  try {
    const state = await window.ohMyGithub?.windowControls?.getState?.()
    isWindowFullscreen.value = Boolean(state?.isFullScreen)
    stopFullscreenListener = window.ohMyGithub?.windowControls?.onFullscreenChange?.((nextState) => {
      isWindowFullscreen.value = nextState.isFullScreen
    })
  } catch {
    isWindowFullscreen.value = false
  }
})

onBeforeUnmount(() => {
  stopFullscreenListener?.()
  stopSidebarResize()
  shortcutUnregisters.splice(0).forEach((unregister) => unregister())
})

function readStoredSidebarWidth(): number {
  const stored = Number(localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY))
  return clampSidebarWidth(Number.isFinite(stored) ? stored : DEFAULT_SIDEBAR_WIDTH)
}

function clampSidebarWidth(width: number): number {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, Math.round(width)))
}

function setSidebarWidth(width: number): void {
  sidebarWidth.value = clampSidebarWidth(width)
}

function startSidebarResize(event: PointerEvent): void {
  if (!isSidebarOpen.value) return

  event.preventDefault()
  isSidebarResizing.value = true
  resizeStartX = event.clientX
  resizeStartWidth = sidebarWidth.value
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', resizeSidebar)
  window.addEventListener('pointerup', stopSidebarResize, { once: true })
}

function resizeSidebar(event: PointerEvent): void {
  if (!isSidebarResizing.value) return
  setSidebarWidth(resizeStartWidth + event.clientX - resizeStartX)
}

function stopSidebarResize(): void {
  if (!isSidebarResizing.value) return

  isSidebarResizing.value = false
  localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth.value))
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('pointermove', resizeSidebar)
}

function addTabBookmark(input: {
  folderId: string | null
  tab: WorkspaceTab
  title: string
}): void {
  const organization = input.tab.type === 'account' && input.tab.owner
    ? organizationsByLogin.value.get(input.tab.owner)
    : undefined

  addBookmark({
    folderId: input.folderId,
    organization,
    tab: input.tab,
    title: input.title,
  })
}

function openSearchDialog(): void {
  isSearchDialogOpen.value = true
}

const searchRequestSignal = useWorkspaceSearchRequestSignal()
let handledSearchRequest = searchRequestSignal.value

function consumeSearchRequestIfPending(): void {
  if (searchRequestSignal.value !== handledSearchRequest) {
    handledSearchRequest = searchRequestSignal.value
    openSearchDialog()
  }
}

watch(searchRequestSignal, consumeSearchRequestIfPending)
onMounted(consumeSearchRequestIfPending)

function registerWorkspaceShortcuts(): void {
  if (shortcutUnregisters.length > 0) return

  shortcutUnregisters.push(
    registerKeyboardShortcutHandler('workspace.search', () => {
      openSearchDialog()
      return true
    }, { enabled: () => canUseWorkspaceShortcuts.value }),
    registerKeyboardShortcutHandler('workspace.closeTab', () => {
      if (tabs.value.length <= 1) return false

      void closeTab(activeUrl.value)
      return true
    }, { enabled: () => canUseWorkspaceShortcuts.value }),
    registerKeyboardShortcutHandler('workspace.goBack', () => {
      if (!canGoBack.value) return false

      void goBack()
      return true
    }, { enabled: () => canUseWorkspaceShortcuts.value }),
    registerKeyboardShortcutHandler('workspace.goForward', () => {
      if (!canGoForward.value) return false

      void goForward()
      return true
    }, { enabled: () => canUseWorkspaceShortcuts.value }),
    registerKeyboardShortcutHandler('workspace.toggleSidebar', () => {
      isSidebarOpen.value = !isSidebarOpen.value
      return true
    }, { enabled: () => canUseWorkspaceShortcuts.value }),
    registerKeyboardShortcutHandler('workspace.toggleRightPanel', () => {
      toggleRightPanel()
      return true
    }, { enabled: () => canUseWorkspaceShortcuts.value }),
    registerKeyboardShortcutHandler('workspace.toggleBookmark', () => toggleActiveBookmark(), {
      enabled: () => canUseWorkspaceShortcuts.value,
    }),
    registerKeyboardShortcutHandler('workspace.copyGitHubUrl', () => {
      if (!activeGithubUrl.value) return false

      void copyActiveGitHubUrl()
      return true
    }, { enabled: () => canUseWorkspaceShortcuts.value }),
    registerKeyboardShortcutHandler('workspace.openInBrowser', () => {
      if (!activeGithubUrl.value) return false

      void openActiveGitHubUrl()
      return true
    }, { enabled: () => canUseWorkspaceShortcuts.value }),
  )
}

async function copyActiveGitHubUrl(): Promise<void> {
  const url = activeGithubUrl.value
  if (!url) return

  await copyGitHubUrl(url)
}

async function openActiveGitHubUrl(): Promise<void> {
  const url = activeGithubUrl.value
  if (!url) return

  await openGitHubUrl(url)
}

async function copyGitHubUrl(url: string): Promise<void> {
  try {
    await writeClipboardText(url)
    toast.success(t('workspace.copy.success'))
  } catch {
    toast.error(t('workspace.copy.error'))
  }
}

async function openGitHubUrl(url: string): Promise<void> {
  try {
    await window.ohMyGithub?.links?.openGitHubUrl?.(url)
  } catch {
    toast.error(t('workspace.openGitHub.error'))
  }
}

async function openNewWorkspaceTab(url: string): Promise<void> {
  await openWorkspaceTab(url)
}

async function openBookmarkFolder(urls: string[]): Promise<void> {
  if (urls.length === 0) return

  for (const [index, url] of urls.entries()) {
    await openWorkspaceTab(url, { activate: index === 0 })
  }
}

function toggleActiveBookmark(): boolean {
  const tab = activeTab.value
  if (!tab) return false

  if (bookmarkedUrls.value.has(tab.url)) {
    removeBookmark(tab.url)
    return true
  }

  addTabBookmark({
    folderId: null,
    tab,
    title: tabTitle(tab),
  })

  return true
}

function tabTitle(tab: WorkspaceTab): string {
  const view = getWorkspaceTabView(tab)
  if (view.titleKey) {
    return t(view.titleKey, view.titleParams ?? {})
  }

  return view.title
}

async function writeClipboardText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.append(textarea)
  textarea.select()

  try {
    if (!document.execCommand('copy')) {
      throw new Error('Clipboard copy failed')
    }
  } finally {
    textarea.remove()
  }
}
</script>

<template>
  <SidebarProvider
    v-model:open="isSidebarOpen"
    :width="sidebarWidthValue"
    class="h-full min-h-0 bg-background"
  >
    <WorkspaceSidebar
      :active-url="activeUrl"
      :bookmark-folders="bookmarkFolders"
      :bookmarks="bookmarks"
      :create-bookmark-folder="createBookmarkFolder"
      :delete-bookmark="removeBookmarkById"
      :delete-bookmark-folder="deleteBookmarkFolder"
      :is-fullscreen="isWindowFullscreen"
      :move-bookmark-to-folder="moveBookmarkToFolder"
      :organizations="organizations"
      :organizations-error="organizationsError"
      :organizations-loading="organizationsLoading"
      :rename-bookmark="renameBookmark"
      :rename-bookmark-folder="renameBookmarkFolder"
      :reorder-bookmark-list="reorderBookmarkList"
      :viewer="viewer"
      :width="sidebarWidth"
      @copy-git-hub-url="copyGitHubUrl"
      @open-bookmark-folder="openBookmarkFolder"
      @open-git-hub-url="openGitHubUrl"
      @open-new-tab="openNewWorkspaceTab"
      @search="openSearchDialog"
      @select="selectTab"
      @start-resize="startSidebarResize"
    />

    <SidebarInset class="min-w-0 overflow-hidden">
      <div class="flex h-full min-h-0 flex-col bg-background">
        <WorkspaceTabs
          :active-github-url="activeGithubUrl"
          :active-url="activeUrl"
          :bookmark-folders="bookmarkFolders"
          :bookmarks="bookmarks"
          :bookmarked-urls="bookmarkedUrls"
          :can-go-back="canGoBack"
          :can-go-forward="canGoForward"
          :is-fullscreen="isWindowFullscreen"
          :tabs="tabs"
          :viewer="viewer"
          @back="goBack"
          @bookmark="addTabBookmark"
          @close="closeTab"
          @copy-git-hub-url="copyActiveGitHubUrl"
          @open-git-hub-url="openActiveGitHubUrl"
          @forward="goForward"
          @replace-active-url="replaceActiveTabUrl"
          @remove-bookmark="removeBookmark"
          @search="openSearchDialog"
          @select="selectTab"
        />
      </div>
    </SidebarInset>

    <WorkspaceSearchDialog
      v-model:open="isSearchDialogOpen"
      @navigate="selectTab"
    />
  </SidebarProvider>
</template>
