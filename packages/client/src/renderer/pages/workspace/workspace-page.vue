<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { SidebarInset, SidebarProvider } from '@oh-my-github/ui'
import { useWorkspaceOrganizations } from './composables/use-workspace-organizations'
import { useWorkspaceTabs } from './composables/use-workspace-tabs'
import WorkspaceSidebar from './components/workspace-sidebar.vue'
import WorkspaceTabs from './components/workspace-tabs.vue'

const isSidebarOpen = ref(true)
const isWindowFullscreen = ref(false)
const viewer = ref<AuthViewer | null>(null)
let stopFullscreenListener: (() => void) | undefined

const {
  activeUrl,
  closeTab,
  createTab,
  selectTab,
  tabs,
} = useWorkspaceTabs()

const organizationsQuery = useWorkspaceOrganizations()
const organizations = computed(() => organizationsQuery.data.value ?? [])
const organizationsLoading = computed(() => organizationsQuery.isLoading.value)
const organizationsError = computed(() => Boolean(organizationsQuery.error.value))

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
})
</script>

<template>
  <SidebarProvider
    v-model:open="isSidebarOpen"
    width="24rem"
    class="h-full min-h-0 bg-background"
  >
    <WorkspaceSidebar
      :active-url="activeUrl"
      :is-fullscreen="isWindowFullscreen"
      :organizations="organizations"
      :organizations-error="organizationsError"
      :organizations-loading="organizationsLoading"
      :viewer="viewer"
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
