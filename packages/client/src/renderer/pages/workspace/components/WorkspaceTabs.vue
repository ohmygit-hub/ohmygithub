<script setup lang="ts">
import type { WorkspaceMessageParams, WorkspaceTab } from '../types'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, ArrowRight, PanelLeftClose, PanelLeftOpen, Plus, X } from 'lucide-vue-next'
import { Button, Tabs, TabsContent, TabsList, TabsTrigger, useSidebar } from '@oh-my-github/ui'
import { getWorkspaceTabView } from '../tabPresentation'
import WorkspacePanel from './WorkspacePanel.vue'

const props = defineProps<{
  tabs: WorkspaceTab[]
  activeUrl: string
  isFullscreen: boolean
}>()

const emit = defineEmits<{
  close: [url: string]
  create: []
  select: [url: string]
}>()

const { t } = useI18n()
const { state, toggleSidebar } = useSidebar()
const isMac = navigator.platform.toLowerCase().includes('mac')
const scrollHost = ref<HTMLElement>()
const scrollMetrics = ref({ clientWidth: 0, scrollLeft: 0, scrollWidth: 0 })
const isDraggingScrollbar = ref(false)
let resizeObserver: ResizeObserver | undefined
let dragStartX = 0
let dragStartScrollLeft = 0

const sidebarLabel = computed(() =>
  state.value === 'expanded'
    ? t('workspace.toolbar.collapseSidebar')
    : t('workspace.toolbar.expandSidebar'),
)
const shouldReserveTrafficLights = computed(() => (
  isMac && state.value === 'collapsed' && !props.isFullscreen
))
const hasTabOverflow = computed(() => scrollMetrics.value.scrollWidth > scrollMetrics.value.clientWidth + 1)
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

function updateScrollMetrics(): void {
  const element = scrollHost.value
  if (!element) return

  scrollMetrics.value = {
    clientWidth: element.clientWidth,
    scrollLeft: element.scrollLeft,
    scrollWidth: element.scrollWidth,
  }
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

onMounted(() => {
  nextTick(updateScrollMetrics)
  if (scrollHost.value) {
    resizeObserver = new ResizeObserver(updateScrollMetrics)
    resizeObserver.observe(scrollHost.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  stopScrollbarDrag()
})

watch(
  () => [props.tabs.length, props.activeUrl],
  () => nextTick(updateScrollMetrics),
)
</script>

<template>
  <Tabs
    :model-value="activeUrl"
    data-workspace-tabs
    class="min-h-0 flex-1 gap-0"
    @update:model-value="setActiveTab"
  >
    <div class="workspace-tabs-bar flex h-9 shrink-0 items-center gap-1 border-b border-border bg-background px-2">
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
        disabled
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <ArrowLeft class="size-3.5" />
      </Button>
      <Button
        :aria-label="t('workspace.toolbar.forward')"
        class="size-7"
        disabled
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <ArrowRight class="size-3.5" />
      </Button>

      <div class="mx-1 h-4 w-px shrink-0 bg-border" />

      <div class="workspace-tabs-scroll-frame min-w-0 flex-1">
        <div
          ref="scrollHost"
          class="workspace-tabs-scroll overflow-x-auto"
          @scroll="updateScrollMetrics"
        >
          <TabsList class="w-auto min-w-max border-b-0">
            <div
              v-for="tab in props.tabs"
              :key="tab.url"
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
                <X class="size-3" />
              </Button>
            </div>
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
        :aria-label="t('workspace.tabs.newTab')"
        class="size-7"
        size="icon-sm"
        type="button"
        variant="ghost"
        @click="emit('create')"
      >
        <Plus class="size-4" />
      </Button>
    </div>

    <TabsContent
      v-for="tab in props.tabs"
      :key="tab.url"
      class="min-h-0 overflow-auto"
      :value="tab.url"
    >
      <WorkspacePanel :tab="tab" />
    </TabsContent>
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

[data-workspace-tabs] :deep([data-slot="tabs-list"]) {
  gap: 0.125rem;
}

.workspace-tabs-scroll-frame {
  position: relative;
}

.workspace-tabs-scroll {
  scrollbar-width: none;
}

.workspace-tabs-scroll::-webkit-scrollbar {
  display: none;
}

.workspace-tabs-scrollbar {
  position: absolute;
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
  height: 1.75rem;
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
  height: 1.75rem;
  padding-inline: 0.5rem 0.25rem;
  border-radius: var(--radius-md);
  font-size: var(--text-body);
  line-height: var(--text-body--line-height);
  letter-spacing: var(--text-body--letter-spacing);
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
  width: 0.875rem;
  height: 0.875rem;
}

[data-workspace-tabs] :deep(.tabs-underline) {
  display: none;
}

.workspace-tab-close {
  margin-right: 0.1875rem;
  width: 1.375rem;
  height: 1.375rem;
  color: inherit;
}
</style>
