<script setup lang="ts">
import type { WorkspaceTab } from './types'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { SidebarInset, SidebarProvider } from '@oh-my-github/ui'
import { useWorkspaceBookmarks } from './composables/use-workspace-bookmarks'
import { useOrganizationsQuery } from '../../composables/github/use-organizations'
import { useWorkspaceTabs } from './composables/use-workspace-tabs'
import WorkspaceSidebar from './components/workspace-sidebar.vue'
import WorkspaceTabs from './components/workspace-tabs.vue'

const SIDEBAR_WIDTH_STORAGE_KEY = 'oh-my-github:workspace-sidebar-width:v1'
const DEFAULT_SIDEBAR_WIDTH = 384
const MIN_SIDEBAR_WIDTH = 240
const MAX_SIDEBAR_WIDTH = 640

const isSidebarOpen = ref(true)
const isSidebarResizing = ref(false)
const isWindowFullscreen = ref(false)
const sidebarWidth = ref(readStoredSidebarWidth())
const viewer = ref<AuthViewer | null>(null)
let stopFullscreenListener: (() => void) | undefined
let resizeStartX = 0
let resizeStartWidth = 0

const {
  activeUrl,
  closeTab,
  createTab,
  selectTab,
  tabs,
} = useWorkspaceTabs()

const organizationsQuery = useOrganizationsQuery()
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
  removeBookmark,
  addBookmark,
} = useWorkspaceBookmarks()

onMounted(async () => {
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
  const organization = input.tab.type === 'org' && input.tab.owner
    ? organizationsByLogin.value.get(input.tab.owner)
    : undefined

  addBookmark({
    folderId: input.folderId,
    organization,
    tab: input.tab,
    title: input.title,
  })
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
      :is-fullscreen="isWindowFullscreen"
      :organizations="organizations"
      :organizations-error="organizationsError"
      :organizations-loading="organizationsLoading"
      :viewer="viewer"
      :width="sidebarWidth"
      @select="selectTab"
      @start-resize="startSidebarResize"
    />

    <SidebarInset class="min-w-0 overflow-hidden">
      <div class="flex h-full min-h-0 flex-col bg-background">
        <WorkspaceTabs
          :active-url="activeUrl"
          :bookmark-folders="bookmarkFolders"
          :bookmarks="bookmarks"
          :bookmarked-urls="bookmarkedUrls"
          :is-fullscreen="isWindowFullscreen"
          :tabs="tabs"
          @bookmark="addTabBookmark"
          @close="closeTab"
          @create="createTab"
          @remove-bookmark="removeBookmark"
          @select="selectTab"
        />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
