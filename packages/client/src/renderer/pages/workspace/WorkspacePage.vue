<script setup lang="ts">
import type { WorkspaceNavGroup, WorkspaceTab } from './types'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  Bell,
  CircleDot,
  FileText,
  GitPullRequest,
  Inbox,
  Monitor,
  Package,
  PlayCircle,
  Star,
} from 'lucide-vue-next'
import { SidebarInset, SidebarProvider } from '@oh-my-github/ui'
import WorkspaceSidebar from './components/WorkspaceSidebar.vue'
import WorkspaceTabs from './components/WorkspaceTabs.vue'

const isSidebarOpen = ref(true)
const isWindowFullscreen = ref(false)
const activeNavItemId = ref('inbox')
const nextDraftNumber = ref(1)
let stopFullscreenListener: (() => void) | undefined

const navGroups: WorkspaceNavGroup[] = [
  {
    id: 'primary',
    labelKey: 'workspace.sidebar.groups.primary',
    items: [
      { id: 'inbox', labelKey: 'workspace.sidebar.items.inbox', icon: Inbox },
      { id: 'pulls', labelKey: 'workspace.sidebar.items.pulls', icon: GitPullRequest },
      { id: 'issues', labelKey: 'workspace.sidebar.items.issues', icon: CircleDot },
      { id: 'actions', labelKey: 'workspace.sidebar.items.actions', icon: PlayCircle },
    ],
  },
  {
    id: 'repositories',
    labelKey: 'workspace.sidebar.groups.repositories',
    items: [
      { id: 'client', labelKey: 'workspace.sidebar.items.client', icon: Monitor },
      { id: 'ui', labelKey: 'workspace.sidebar.items.ui', icon: Package },
      { id: 'pinned', labelKey: 'workspace.sidebar.items.pinned', icon: Star },
    ],
  },
]

const tabs = ref<WorkspaceTab[]>([
  {
    id: 'inbox',
    titleKey: 'workspace.tabs.items.inbox',
    icon: Inbox,
    eyebrowKey: 'workspace.panel.eyebrows.triage',
    headingKey: 'workspace.panel.headings.inbox',
    descriptionKey: 'workspace.panel.descriptions.inbox',
    stats: [
      { id: 'unread', labelKey: 'workspace.panel.stats.unread', valueKey: 'workspace.panel.values.unread' },
      { id: 'reviews', labelKey: 'workspace.panel.stats.reviews', valueKey: 'workspace.panel.values.reviews' },
      { id: 'mentions', labelKey: 'workspace.panel.stats.mentions', valueKey: 'workspace.panel.values.mentions' },
    ],
    blocks: [
      {
        id: 'review-queue',
        titleKey: 'workspace.panel.blocks.reviewQueue.title',
        descriptionKey: 'workspace.panel.blocks.reviewQueue.description',
        metaKey: 'workspace.panel.blocks.reviewQueue.meta',
      },
      {
        id: 'release-watch',
        titleKey: 'workspace.panel.blocks.releaseWatch.title',
        descriptionKey: 'workspace.panel.blocks.releaseWatch.description',
        metaKey: 'workspace.panel.blocks.releaseWatch.meta',
      },
    ],
  },
  {
    id: 'reviews',
    titleKey: 'workspace.tabs.items.reviews',
    icon: GitPullRequest,
    eyebrowKey: 'workspace.panel.eyebrows.review',
    headingKey: 'workspace.panel.headings.reviews',
    descriptionKey: 'workspace.panel.descriptions.reviews',
    stats: [
      { id: 'assigned', labelKey: 'workspace.panel.stats.assigned', valueKey: 'workspace.panel.values.assigned' },
      { id: 'waiting', labelKey: 'workspace.panel.stats.waiting', valueKey: 'workspace.panel.values.waiting' },
      { id: 'drafts', labelKey: 'workspace.panel.stats.drafts', valueKey: 'workspace.panel.values.drafts' },
    ],
    blocks: [
      {
        id: 'review-stack',
        titleKey: 'workspace.panel.blocks.reviewStack.title',
        descriptionKey: 'workspace.panel.blocks.reviewStack.description',
        metaKey: 'workspace.panel.blocks.reviewStack.meta',
      },
      {
        id: 'merge-readiness',
        titleKey: 'workspace.panel.blocks.mergeReadiness.title',
        descriptionKey: 'workspace.panel.blocks.mergeReadiness.description',
        metaKey: 'workspace.panel.blocks.mergeReadiness.meta',
      },
    ],
  },
  {
    id: 'activity',
    titleKey: 'workspace.tabs.items.activity',
    icon: Bell,
    eyebrowKey: 'workspace.panel.eyebrows.activity',
    headingKey: 'workspace.panel.headings.activity',
    descriptionKey: 'workspace.panel.descriptions.activity',
    stats: [
      { id: 'runs', labelKey: 'workspace.panel.stats.runs', valueKey: 'workspace.panel.values.runs' },
      { id: 'alerts', labelKey: 'workspace.panel.stats.alerts', valueKey: 'workspace.panel.values.alerts' },
      { id: 'repos', labelKey: 'workspace.panel.stats.repos', valueKey: 'workspace.panel.values.repos' },
    ],
    blocks: [
      {
        id: 'workflow-feed',
        titleKey: 'workspace.panel.blocks.workflowFeed.title',
        descriptionKey: 'workspace.panel.blocks.workflowFeed.description',
        metaKey: 'workspace.panel.blocks.workflowFeed.meta',
      },
      {
        id: 'repository-focus',
        titleKey: 'workspace.panel.blocks.repositoryFocus.title',
        descriptionKey: 'workspace.panel.blocks.repositoryFocus.description',
        metaKey: 'workspace.panel.blocks.repositoryFocus.meta',
      },
    ],
  },
])

const activeTabId = ref(tabs.value[0]?.id ?? '')

const hasActiveTab = computed(() => tabs.value.some((tab) => tab.id === activeTabId.value))

function closeTab(id: string): void {
  if (tabs.value.length <= 1) return

  const index = tabs.value.findIndex((tab) => tab.id === id)
  if (index === -1) return

  tabs.value.splice(index, 1)

  if (activeTabId.value === id) {
    activeTabId.value = tabs.value[Math.min(index, tabs.value.length - 1)]?.id ?? tabs.value[0]?.id ?? ''
  }
}

function createTab(): void {
  const number = nextDraftNumber.value
  nextDraftNumber.value += 1

  const id = `draft-${number}`
  tabs.value.push({
    id,
    titleKey: 'workspace.tabs.items.draft',
    titleParams: { number },
    icon: FileText,
    eyebrowKey: 'workspace.panel.eyebrows.draft',
    headingKey: 'workspace.panel.headings.draft',
    descriptionKey: 'workspace.panel.descriptions.draft',
    stats: [
      { id: 'scope', labelKey: 'workspace.panel.stats.scope', valueKey: 'workspace.panel.values.scope' },
      { id: 'source', labelKey: 'workspace.panel.stats.source', valueKey: 'workspace.panel.values.source' },
      { id: 'status', labelKey: 'workspace.panel.stats.status', valueKey: 'workspace.panel.values.status' },
    ],
    blocks: [
      {
        id: 'draft-outline',
        titleKey: 'workspace.panel.blocks.draftOutline.title',
        descriptionKey: 'workspace.panel.blocks.draftOutline.description',
        metaKey: 'workspace.panel.blocks.draftOutline.meta',
      },
      {
        id: 'next-step',
        titleKey: 'workspace.panel.blocks.nextStep.title',
        descriptionKey: 'workspace.panel.blocks.nextStep.description',
        metaKey: 'workspace.panel.blocks.nextStep.meta',
      },
    ],
  })
  activeTabId.value = id
}

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
      @select="activeNavItemId = $event"
    />

    <SidebarInset class="min-w-0 overflow-hidden">
      <div class="flex h-full min-h-0 flex-col bg-background">
        <WorkspaceTabs
          v-if="hasActiveTab"
          v-model:active-tab-id="activeTabId"
          :is-fullscreen="isWindowFullscreen"
          :tabs="tabs"
          @close="closeTab"
          @create="createTab"
        />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
