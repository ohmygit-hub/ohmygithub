<script setup lang="ts">
import type {
  WorkspaceBookmark,
  WorkspaceBookmarkFolder,
  WorkspaceMessageParams,
  WorkspaceTab,
} from '@/pages/workspace/types'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChevronsRight,
  Copy,
  Folder,
  Github,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  X,
} from 'lucide-vue-next'
import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useSidebar,
} from '@oh-my-github/ui'
import { useRightPanel } from '@/composables/use-right-panel'
import { getWorkspaceTabView } from '@/pages/workspace/tab-presentation'
import {
  MIN_RIGHT_PANEL_WIDTH,
  clampRightPanelWidth,
  getDefaultRightPanelWidth,
  getRightPanelMaxWidth,
} from '@/pages/workspace/right-panel-width'
import WorkspacePanel from './workspace-panel.vue'
import WorkspaceRightPanel from './workspace-right-panel.vue'

const props = defineProps<{
  activeGithubUrl: string | null
  activeUrl: string
  bookmarkFolders: WorkspaceBookmarkFolder[]
  bookmarks: WorkspaceBookmark[]
  bookmarkedUrls: Set<string>
  canGoBack: boolean
  canGoForward: boolean
  isFullscreen: boolean
  tabs: WorkspaceTab[]
  viewer: AuthViewer | null
}>()

const emit = defineEmits<{
  back: []
  bookmark: [input: { folderId: string | null; tab: WorkspaceTab; title: string }]
  close: [url: string]
  closeOthers: [url: string]
  closeToRight: [url: string]
  closeAll: []
  copyGitHubUrl: []
  openGitHubUrl: []
  forward: []
  replaceActiveUrl: [url: string]
  removeBookmark: [url: string]
  search: []
  select: [url: string]
}>()

const { t } = useI18n()
const { state, toggleSidebar } = useSidebar()
const {
  isOpen: isRightPanelOpen,
  toggleRightPanel,
} = useRightPanel()
const RIGHT_PANEL_WIDTH_STORAGE_KEY = 'oh-my-github:workspace-right-panel-width:v1'
const isMac = navigator.platform.toLowerCase().includes('mac')
const scrollHost = ref<HTMLElement>()
const workspaceContent = ref<HTMLElement>()
const scrollMetrics = ref({ clientWidth: 0, scrollLeft: 0, scrollWidth: 0 })
const isDraggingScrollbar = ref(false)
const isRightPanelResizing = ref(false)
const isRightPanelExpanded = ref(false)
const preferredRightPanelWidth = ref(readStoredRightPanelWidth())
const workspaceContentWidth = ref(window.innerWidth)
const bookmarkMenuItemClass = 'h-7 !gap-1.5 !px-2 !py-1 !text-body'
let resizeObserver: ResizeObserver | undefined
let workspaceResizeObserver: ResizeObserver | undefined
let dragStartX = 0
let dragStartScrollLeft = 0
let rightPanelResizeStartX = 0
let rightPanelResizeStartWidth = 0
let didRightPanelResize = false

const sidebarLabel = computed(() =>
  state.value === 'expanded'
    ? t('workspace.toolbar.collapseSidebar')
    : t('workspace.toolbar.expandSidebar'),
)
const shouldReserveTrafficLights = computed(() => (
  isMac && state.value === 'collapsed' && !props.isFullscreen
))
const activeTab = computed(() => props.tabs.find((tab) => tab.url === props.activeUrl) ?? props.tabs[0])
const activeBookmark = computed(() => {
  const tab = activeTab.value
  return tab ? props.bookmarks.find((bookmark) => bookmark.url === tab.url) : undefined
})
const isActiveTabBookmarked = computed(() => activeTab.value ? props.bookmarkedUrls.has(activeTab.value.url) : false)
const activeBookmarkLabel = computed(() =>
  t(isActiveTabBookmarked.value ? 'workspace.bookmarks.removeCurrent' : 'workspace.bookmarks.addCurrent'),
)
const rightPanelLabel = computed(() =>
  t(isRightPanelOpen.value ? 'workspace.rightPanel.close' : 'workspace.rightPanel.open'),
)
const rightPanelMaxWidth = computed(() => getRightPanelMaxWidth(workspaceContentWidth.value))
const rightPanelWidth = computed(() => {
  const preferredWidth = preferredRightPanelWidth.value
    ?? getDefaultRightPanelWidth(workspaceContentWidth.value)
  const width = isRightPanelExpanded.value ? rightPanelMaxWidth.value : preferredWidth
  return clampRightPanelWidth(width, workspaceContentWidth.value)
})
const canExpandRightPanel = computed(() => rightPanelMaxWidth.value - rightPanelWidth.value > 1)
const rightPanelExpandLabel = computed(() => t(
  isRightPanelExpanded.value
    ? 'workspace.rightPanel.restoreWidth'
    : 'workspace.rightPanel.expand',
))
const hasTabOverflow = computed(() => scrollMetrics.value.scrollWidth > scrollMetrics.value.clientWidth + 1)
const canScrollTabsLeft = computed(() => hasTabOverflow.value && scrollMetrics.value.scrollLeft > 1)
const canScrollTabsRight = computed(() => {
  const { clientWidth, scrollLeft, scrollWidth } = scrollMetrics.value
  return hasTabOverflow.value && scrollLeft + clientWidth < scrollWidth - 1
})
const scrollbarThumbStyle = computed(() => {
  const { clientWidth, scrollLeft, scrollWidth } = scrollMetrics.value

  if (!clientWidth || !scrollWidth || scrollWidth <= clientWidth) {
    return {
      width: '0px',
      translate: '0px',
    }
  }

  const thumbWidth = Math.max(24, (clientWidth / scrollWidth) * clientWidth)
  const maxScrollLeft = scrollWidth - clientWidth
  const maxThumbOffset = clientWidth - thumbWidth
  const thumbOffset = maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * maxThumbOffset : 0

  return {
    width: `${thumbWidth}px`,
    translate: `${thumbOffset}px`,
  }
})

function setActiveTab(value: string | number): void {
  emit('select', String(value))
}

function translate(key: string, params?: WorkspaceMessageParams): string {
  return t(key, params ?? {})
}

function tabTitle(tab: WorkspaceTab): string {
  const view = getWorkspaceTabView(tab)
  if (view.titleKey) {
    return translate(view.titleKey, view.titleParams)
  }

  return view.title
}

function tabIdentity(tab: WorkspaceTab): string {
  if (tab.type === 'repo' && tab.owner && tab.repo) {
    return `repo:${tab.owner}/${tab.repo}`
  }

  return tab.url
}

function canCloseOtherTabs(url: string): boolean {
  return props.tabs.some((tab) => tab.url !== url)
}

function canCloseTabsToRight(url: string): boolean {
  const index = props.tabs.findIndex((tab) => tab.url === url)
  return index !== -1 && index < props.tabs.length - 1
}

function bookmarkRootLabel(): string {
  return t(isActiveTabBookmarked.value ? 'workspace.bookmarks.moveToRoot' : 'workspace.bookmarks.addToRoot')
}

function bookmarkFolderLabel(folder: WorkspaceBookmarkFolder): string {
  return t(isActiveTabBookmarked.value ? 'workspace.bookmarks.moveToFolder' : 'workspace.bookmarks.addToFolder', {
    title: folder.title,
  })
}

function isCurrentBookmarkFolder(folderId: string | null): boolean {
  return activeBookmark.value?.folderId === folderId
}

function bookmarkActiveTab(folderId: string | null): void {
  const tab = activeTab.value
  if (!tab) return

  emit('bookmark', {
    folderId,
    tab,
    title: tabTitle(tab),
  })
}

function removeActiveBookmark(): void {
  const tab = activeTab.value
  if (!tab) return

  emit('removeBookmark', tab.url)
}

function updateScrollMetrics(): void {
  const element = scrollHost.value
  if (!element) return

  scrollMetrics.value = {
    clientWidth: element.clientWidth,
    scrollLeft: element.scrollLeft,
    scrollWidth: element.scrollWidth,
  }
}

function scrollActiveTabIntoView(): void {
  const element = scrollHost.value
  if (!element) {
    return
  }

  const activeElement = element.querySelector<HTMLElement>('.workspace-tab-chip[data-active="true"]')
  if (!activeElement) {
    updateScrollMetrics()
    return
  }

  const hostRect = element.getBoundingClientRect()
  const activeRect = activeElement.getBoundingClientRect()
  const leftOverflow = activeRect.left - hostRect.left
  const rightOverflow = activeRect.right - hostRect.right

  if (leftOverflow < 0) {
    element.scrollLeft += leftOverflow
  } else if (rightOverflow > 0) {
    element.scrollLeft += rightOverflow
  }

  updateScrollMetrics()
}

function onScrollbarPointerDown(event: PointerEvent): void {
  const element = scrollHost.value
  if (!element || !hasTabOverflow.value) return

  event.preventDefault()
  event.stopPropagation()
  isDraggingScrollbar.value = true
  dragStartX = event.clientX
  dragStartScrollLeft = element.scrollLeft
  window.addEventListener('pointermove', onScrollbarPointerMove)
  window.addEventListener('pointerup', stopScrollbarDrag, { once: true })
  window.addEventListener('pointercancel', stopScrollbarDrag, { once: true })
}

function onScrollbarPointerMove(event: PointerEvent): void {
  const element = scrollHost.value
  if (!element) return

  const { clientWidth, scrollWidth } = scrollMetrics.value
  const thumbWidth = Math.max(24, (clientWidth / scrollWidth) * clientWidth)
  const maxThumbOffset = clientWidth - thumbWidth
  const maxScrollLeft = scrollWidth - clientWidth
  const delta = event.clientX - dragStartX
  const scrollDelta = maxThumbOffset > 0 ? (delta / maxThumbOffset) * maxScrollLeft : 0

  element.scrollLeft = dragStartScrollLeft + scrollDelta
  updateScrollMetrics()
}

function stopScrollbarDrag(): void {
  isDraggingScrollbar.value = false
  window.removeEventListener('pointermove', onScrollbarPointerMove)
}

function readStoredRightPanelWidth(): number | null {
  const stored = localStorage.getItem(RIGHT_PANEL_WIDTH_STORAGE_KEY)
  if (stored === null) return null

  const width = Number(stored)
  return Number.isFinite(width) && width > 0 ? width : null
}

function updateWorkspaceContentWidth(): void {
  const width = workspaceContent.value?.clientWidth
  if (width && width > 0) {
    workspaceContentWidth.value = width
  }
}

function setRightPanelWidth(width: number, persist = false): void {
  isRightPanelExpanded.value = false
  preferredRightPanelWidth.value = clampRightPanelWidth(width, workspaceContentWidth.value)

  if (persist) {
    localStorage.setItem(RIGHT_PANEL_WIDTH_STORAGE_KEY, String(preferredRightPanelWidth.value))
  }
}

function toggleRightPanelExpanded(): void {
  if (!isRightPanelExpanded.value && !canExpandRightPanel.value) return
  isRightPanelExpanded.value = !isRightPanelExpanded.value
}

function startRightPanelResize(event: PointerEvent): void {
  if (!isRightPanelOpen.value) return

  event.preventDefault()
  isRightPanelResizing.value = true
  didRightPanelResize = false
  rightPanelResizeStartX = event.clientX
  rightPanelResizeStartWidth = rightPanelWidth.value
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', resizeRightPanel)
  window.addEventListener('pointerup', stopRightPanelResize, { once: true })
  window.addEventListener('pointercancel', stopRightPanelResize, { once: true })
}

function resizeRightPanel(event: PointerEvent): void {
  if (!isRightPanelResizing.value) return
  didRightPanelResize = true
  setRightPanelWidth(rightPanelResizeStartWidth + rightPanelResizeStartX - event.clientX)
}

function stopRightPanelResize(): void {
  window.removeEventListener('pointermove', resizeRightPanel)
  window.removeEventListener('pointerup', stopRightPanelResize)
  window.removeEventListener('pointercancel', stopRightPanelResize)
  if (!isRightPanelResizing.value) return

  isRightPanelResizing.value = false
  if (didRightPanelResize) {
    localStorage.setItem(RIGHT_PANEL_WIDTH_STORAGE_KEY, String(rightPanelWidth.value))
  }
  didRightPanelResize = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

onMounted(() => {
  void nextTick(scrollActiveTabIntoView)
  if (scrollHost.value) {
    resizeObserver = new ResizeObserver(scrollActiveTabIntoView)
    resizeObserver.observe(scrollHost.value)
  }
  if (workspaceContent.value) {
    updateWorkspaceContentWidth()
    workspaceResizeObserver = new ResizeObserver(updateWorkspaceContentWidth)
    workspaceResizeObserver.observe(workspaceContent.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  workspaceResizeObserver?.disconnect()
  stopScrollbarDrag()
  stopRightPanelResize()
})

watch(
  () => ({
    activeUrl: props.activeUrl,
    tabCount: props.tabs.length,
  }),
  () => nextTick(scrollActiveTabIntoView),
)
</script>

<template>
  <Tabs
    :model-value="activeUrl"
    data-workspace-tabs
    class="min-h-0 flex-1 gap-0"
    @update:model-value="setActiveTab"
  >
    <div class="workspace-tabs-bar flex h-10 shrink-0 items-center gap-1 border-b border-border bg-background px-2">
      <div
        v-if="shouldReserveTrafficLights"
        aria-hidden="true"
        class="workspace-traffic-light-spacer"
      />
      <Button
        :aria-label="sidebarLabel"
        class="size-7"
        size="icon-sm"
        type="button"
        variant="ghost"
        @click="toggleSidebar"
      >
        <PanelLeftClose
          v-if="state === 'expanded'"
          class="size-3.5"
        />
        <PanelLeftOpen
          v-else
          class="size-3.5"
        />
      </Button>
      <Button
        :aria-label="t('workspace.toolbar.back')"
        class="size-7"
        :disabled="!props.canGoBack"
        size="icon-sm"
        type="button"
        variant="ghost"
        @click="emit('back')"
      >
        <ArrowLeft class="size-3.5" />
      </Button>
      <Button
        :aria-label="t('workspace.toolbar.forward')"
        class="size-7"
        :disabled="!props.canGoForward"
        size="icon-sm"
        type="button"
        variant="ghost"
        @click="emit('forward')"
      >
        <ArrowRight class="size-3.5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            :aria-label="activeBookmarkLabel"
            class="size-7"
            :disabled="!activeTab"
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <Bookmark
              class="size-3.5"
              :class="isActiveTabBookmarked ? 'fill-current text-foreground' : 'fill-none'"
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="center"
          class="w-44 !gap-0.5 !p-1"
          side="bottom"
          :side-offset="4"
        >
          <DropdownMenuItem
            :class="bookmarkMenuItemClass"
            :disabled="isCurrentBookmarkFolder(null)"
            @select="bookmarkActiveTab(null)"
          >
            <Bookmark class="size-3.5" />
            <span class="min-w-0 flex-1 truncate">{{ bookmarkRootLabel() }}</span>
            <Check
              v-if="isCurrentBookmarkFolder(null)"
              class="ml-auto size-3"
            />
          </DropdownMenuItem>

          <DropdownMenuSeparator
            v-if="bookmarkFolders.length > 0"
            class="!my-0.5"
          />

          <DropdownMenuItem
            v-for="folder in bookmarkFolders"
            :key="folder.id"
            :class="bookmarkMenuItemClass"
            :disabled="isCurrentBookmarkFolder(folder.id)"
            @select="bookmarkActiveTab(folder.id)"
          >
            <Folder class="size-3.5" />
            <span class="min-w-0 flex-1 truncate">{{ bookmarkFolderLabel(folder) }}</span>
            <Check
              v-if="isCurrentBookmarkFolder(folder.id)"
              class="ml-auto size-3"
            />
          </DropdownMenuItem>

          <template v-if="isActiveTabBookmarked">
            <DropdownMenuSeparator class="!my-0.5" />
            <DropdownMenuItem
              :class="bookmarkMenuItemClass"
              variant="destructive"
              @select="removeActiveBookmark"
            >
              <X class="size-3.5" />
              <span>{{ t('workspace.bookmarks.remove') }}</span>
            </DropdownMenuItem>
          </template>
        </DropdownMenuContent>
      </DropdownMenu>

      <div class="mx-1 h-4 w-px shrink-0 bg-border" />

      <div
        class="workspace-tabs-scroll-frame min-w-0 flex-1"
        :data-can-scroll-left="canScrollTabsLeft ? 'true' : undefined"
        :data-can-scroll-right="canScrollTabsRight ? 'true' : undefined"
        :data-overflowing="hasTabOverflow ? 'true' : undefined"
      >
        <div
          ref="scrollHost"
          class="workspace-tabs-scroll overflow-x-auto"
          @scroll="updateScrollMetrics"
        >
          <TabsList class="w-auto min-w-max border-b-0">
            <ContextMenu
              v-for="tab in props.tabs"
              :key="tabIdentity(tab)"
            >
              <ContextMenuTrigger as-child>
                <div
                  class="workspace-tab-chip"
                  :data-active="activeUrl === tab.url ? 'true' : undefined"
                >
                  <TabsTrigger
                    :value="tab.url"
                    class="workspace-tab-trigger max-w-40 min-w-0"
                  >
                    <component :is="getWorkspaceTabView(tab).icon" />
                    <span class="truncate">{{ tabTitle(tab) }}</span>
                  </TabsTrigger>
                  <Button
                    :aria-label="t('workspace.tabs.closeTab', { title: tabTitle(tab) })"
                    class="workspace-tab-close"
                    :disabled="props.tabs.length <= 1"
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                    @click.stop="emit('close', tab.url)"
                  >
                    <X class="size-3.5" />
                  </Button>
                </div>
              </ContextMenuTrigger>

              <ContextMenuContent class="w-48">
                <ContextMenuItem
                  :disabled="props.tabs.length <= 1"
                  @select="emit('close', tab.url)"
                >
                  <X />
                  <span>{{ t('workspace.tabs.context.close') }}</span>
                </ContextMenuItem>
                <ContextMenuItem
                  :disabled="!canCloseOtherTabs(tab.url)"
                  @select="emit('closeOthers', tab.url)"
                >
                  <X />
                  <span>{{ t('workspace.tabs.context.closeOthers') }}</span>
                </ContextMenuItem>
                <ContextMenuItem
                  :disabled="!canCloseTabsToRight(tab.url)"
                  @select="emit('closeToRight', tab.url)"
                >
                  <ChevronsRight />
                  <span>{{ t('workspace.tabs.context.closeToRight') }}</span>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  variant="destructive"
                  @select="emit('closeAll')"
                >
                  <X />
                  <span>{{ t('workspace.tabs.context.closeAll') }}</span>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </TabsList>
        </div>
        <div
          v-if="hasTabOverflow"
          aria-hidden="true"
          class="workspace-tabs-scrollbar"
          :data-dragging="isDraggingScrollbar ? 'true' : undefined"
        >
          <div
            class="workspace-tabs-scrollbar-thumb"
            :style="scrollbarThumbStyle"
            @pointerdown="onScrollbarPointerDown"
          />
        </div>
      </div>

      <Button
        :aria-label="t('workspace.toolbar.copyGitHubLink')"
        class="size-7"
        :disabled="!props.activeGithubUrl"
        size="icon-sm"
        type="button"
        variant="ghost"
        @click="emit('copyGitHubUrl')"
      >
        <Copy class="size-3.5" />
      </Button>

      <Button
        :aria-label="t('workspace.toolbar.openGitHubLink')"
        class="size-7"
        :disabled="!props.activeGithubUrl"
        size="icon-sm"
        type="button"
        variant="ghost"
        @click="emit('openGitHubUrl')"
      >
        <Github class="size-3.5" />
      </Button>

      <TooltipProvider>
        <Tooltip v-if="isRightPanelOpen">
          <TooltipTrigger as-child>
            <Button
              :aria-label="rightPanelExpandLabel"
              :aria-pressed="isRightPanelExpanded"
              class="size-7"
              :disabled="!isRightPanelExpanded && !canExpandRightPanel"
              size="icon-sm"
              type="button"
              variant="ghost"
              @click="toggleRightPanelExpanded"
            >
              <Minimize2
                v-if="isRightPanelExpanded"
                class="size-3.5"
              />
              <Maximize2
                v-else
                class="size-3.5"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{{ rightPanelExpandLabel }}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              :aria-label="rightPanelLabel"
              :aria-pressed="isRightPanelOpen"
              class="size-7"
              :data-state="isRightPanelOpen ? 'open' : undefined"
              size="icon-sm"
              type="button"
              variant="ghost"
              @click="toggleRightPanel()"
            >
              <PanelRightClose
                v-if="isRightPanelOpen"
                class="size-3.5"
              />
              <PanelRightOpen
                v-else
                class="size-3.5"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{{ rightPanelLabel }}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <div
      ref="workspaceContent"
      class="flex min-h-0 flex-1 overflow-hidden"
    >
      <div class="min-w-0 flex-1 overflow-hidden">
        <TabsContent
          v-for="tab in props.tabs"
          :key="tabIdentity(tab)"
          class="h-full min-h-0 overflow-auto"
          :value="tab.url"
        >
          <WorkspacePanel
            :is-active="tab.url === activeUrl"
            :tab="tab"
            :viewer="viewer"
            @replace-active-url="emit('replaceActiveUrl', $event)"
            @search="emit('search')"
          />
        </TabsContent>
      </div>

      <WorkspaceRightPanel
        :expanded="isRightPanelExpanded"
        :is-resizing="isRightPanelResizing"
        :max-width="rightPanelMaxWidth"
        :min-width="MIN_RIGHT_PANEL_WIDTH"
        :width="rightPanelWidth"
        @resize="setRightPanelWidth($event, true)"
        @start-resize="startRightPanelResize"
        @toggle-expanded="toggleRightPanelExpanded"
      />
    </div>
  </Tabs>
</template>

<style scoped>
.workspace-traffic-light-spacer {
  width: 4.875rem;
  height: 100%;
  flex: 0 0 auto;
  -webkit-app-region: drag;
}

.workspace-tabs-bar {
  -webkit-app-region: drag;
}

.workspace-tabs-bar :deep(button),
.workspace-tabs-bar :deep([role="tab"]),
.workspace-tabs-bar :deep([data-slot="tabs-list"]),
.workspace-tab-chip {
  -webkit-app-region: no-drag;
}

/*
 * Chromium collects app-region rects from UNCLIPPED absolute bounds
 * (electron/electron#40610): once the tab strip scrolls, the no-drag rect of
 * the scrolled tabs list extends `scrollLeft` px past the frame's left edge
 * and carves the titlebar drag strip above the sidebar out of the window's
 * draggable region. While the strip overflows, hoist the single no-drag onto
 * the static (never-scrolled) frame and strip app-region from everything the
 * scroller moves. While it fits, keep the per-element rects so the empty bar
 * to the right of the last tab stays a window-drag surface.
 */
.workspace-tabs-scroll-frame[data-overflowing="true"] {
  -webkit-app-region: no-drag;
}

/*
 * `initial`, NOT `none`: Blink parses `app-region: none` but applies every
 * specified value other than `drag` as no-drag, so `none` would still emit
 * the runaway rects. Only initial/unset restore the no-region default.
 */
.workspace-tabs-scroll-frame[data-overflowing="true"] :deep(button),
.workspace-tabs-scroll-frame[data-overflowing="true"] :deep([role="tab"]),
.workspace-tabs-scroll-frame[data-overflowing="true"] :deep([data-slot="tabs-list"]),
.workspace-tabs-scroll-frame[data-overflowing="true"] .workspace-tab-chip {
  -webkit-app-region: initial;
}

[data-workspace-tabs] :deep([data-slot="tabs-list"]) {
  gap: 0.125rem;
}

.workspace-tabs-scroll-frame {
  position: relative;
}

.workspace-tabs-scroll-frame::before,
.workspace-tabs-scroll-frame::after {
  position: absolute;
  z-index: 1;
  top: 0;
  bottom: 0;
  width: 2rem;
  content: '';
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.16s ease;
}

.workspace-tabs-scroll-frame::before {
  left: 0;
  background: linear-gradient(to right, var(--background), transparent);
  backdrop-filter: blur(2px);
  mask-image: linear-gradient(to right, black, transparent);
}

.workspace-tabs-scroll-frame::after {
  right: 0;
  background: linear-gradient(to left, var(--background), transparent);
  backdrop-filter: blur(2px);
  mask-image: linear-gradient(to left, black, transparent);
}

.workspace-tabs-scroll-frame[data-can-scroll-left="true"]::before,
.workspace-tabs-scroll-frame[data-can-scroll-right="true"]::after {
  opacity: 1;
}

.workspace-tabs-scroll {
  scrollbar-width: none;
}

.workspace-tabs-scroll::-webkit-scrollbar {
  display: none;
}

.workspace-tabs-scrollbar {
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: 0.125rem;
  left: 0;
  height: 0.25rem;
  border-radius: var(--radius-sm);
  background-color: transparent;
  -webkit-app-region: no-drag;
}

.workspace-tabs-scrollbar-thumb {
  height: 100%;
  border-radius: inherit;
  background-color: var(--muted-foreground);
  opacity: 0.34;
  transition: opacity 0.12s ease;
  cursor: default;
  -webkit-app-region: no-drag;
}

.workspace-tabs-scrollbar:hover .workspace-tabs-scrollbar-thumb,
.workspace-tabs-scrollbar[data-dragging="true"] .workspace-tabs-scrollbar-thumb {
  opacity: 0.52;
}

.workspace-tab-chip {
  display: flex;
  min-width: 0;
  align-items: center;
  height: 2rem;
  border-radius: var(--radius-md);
  color: var(--muted-foreground);
}

.workspace-tab-chip:hover {
  background-color: var(--ui-hover);
  color: var(--foreground);
}

.workspace-tab-chip[data-active="true"] {
  background-color: var(--ui-selected);
  color: var(--foreground);
}

[data-workspace-tabs] :deep([data-slot="tabs-trigger"]) {
  height: 2rem;
  padding-inline: 0.75rem 0.5rem;
  border-radius: var(--radius-md);
  font-size: var(--text-label);
  line-height: var(--text-label--line-height);
  letter-spacing: var(--text-label--letter-spacing);
  color: inherit;
}

[data-workspace-tabs] :deep([data-slot="tabs-trigger"][data-state="inactive"]:hover) {
  background-color: transparent;
  color: inherit;
}

[data-workspace-tabs] :deep([data-slot="tabs-trigger"][data-state="active"]) {
  background-color: transparent;
  color: inherit;
}

[data-workspace-tabs] :deep([data-slot="tabs-trigger"] svg) {
  width: 1rem;
  height: 1rem;
}

[data-workspace-tabs] :deep(.tabs-underline) {
  display: none;
}

.workspace-tab-close {
  width: 1.5rem;
  height: 1.5rem;
  margin-right: 0.25rem;
  color: inherit;
}

</style>
