<script setup lang="ts">
import type { WorkspaceNavGroup } from './types'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  Bell,
  GitPullRequest,
  Inbox,
  Monitor,
  Package,
  Star,
} from 'lucide-vue-next'
import { SidebarInset, SidebarProvider } from '@oh-my-github/ui'
import { useWorkspaceTabs } from './composables/useWorkspaceTabs'
import WorkspaceSidebar from './components/WorkspaceSidebar.vue'
import WorkspaceTabs from './components/WorkspaceTabs.vue'

const isSidebarOpen = ref(true)
const isWindowFullscreen = ref(false)
let stopFullscreenListener: (() => void) | undefined

const {
  activeUrl,
  closeTab,
  createTab,
  selectTab,
  tabs,
} = useWorkspaceTabs()

const navGroups: WorkspaceNavGroup[] = [
  {
    id: 'primary',
    labelKey: 'workspace.sidebar.groups.primary',
    items: [
      { id: 'inbox', labelKey: 'workspace.sidebar.items.inbox', icon: Inbox, url: '/inbox' },
      { id: 'reviews', labelKey: 'workspace.sidebar.items.reviews', icon: GitPullRequest, url: '/reviews' },
      { id: 'activity', labelKey: 'workspace.sidebar.items.activity', icon: Bell, url: '/activity' },
    ],
  },
  {
    id: 'repositories',
    labelKey: 'workspace.sidebar.groups.repositories',
    items: [
      { id: 'client', labelKey: 'workspace.sidebar.items.client', icon: Monitor, url: '/oh-my-github/client' },
      { id: 'ui', labelKey: 'workspace.sidebar.items.ui', icon: Package, url: '/oh-my-github/ui' },
      { id: 'pinned', labelKey: 'workspace.sidebar.items.pinned', icon: Star, url: '/github?type=org' },
    ],
  },
]

const activeNavItemId = computed(() => {
  for (const group of navGroups) {
    const item = group.items.find((navItem) => navItem.url === activeUrl.value)
    if (item) return item.id
  }

  return ''
})

onMounted(async () => {
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
})
</script>

<template>
  <SidebarProvider
    v-model:open="isSidebarOpen"
    width="12rem"
    class="h-full min-h-0 bg-background"
  >
    <WorkspaceSidebar
      :active-item-id="activeNavItemId"
      :groups="navGroups"
      :is-fullscreen="isWindowFullscreen"
      @select="selectTab"
    />

    <SidebarInset class="min-w-0 overflow-hidden">
      <div class="flex h-full min-h-0 flex-col bg-background">
        <WorkspaceTabs
          :active-url="activeUrl"
          :is-fullscreen="isWindowFullscreen"
          :tabs="tabs"
          @close="closeTab"
          @create="createTab"
          @select="selectTab"
        />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
