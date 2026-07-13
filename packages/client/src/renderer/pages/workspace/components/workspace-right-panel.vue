<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download } from 'lucide-vue-next'
import { Button } from '@oh-my-github/ui'
import { useRightPanel } from '@/composables/use-right-panel'
import { GitHubMarkdownRenderer, MarkdownRenderer, ShikiCode } from '@/components'

const props = defineProps<{
  expanded: boolean
  isResizing: boolean
  maxWidth: number
  minWidth: number
  width: number
}>()

const emit = defineEmits<{
  resize: [width: number]
  startResize: [event: PointerEvent]
  toggleExpanded: []
}>()

const { t } = useI18n()
const {
  content,
  isOpen,
} = useRightPanel()

const panelTitle = computed(() => content.value?.title ?? t('workspace.rightPanel.title'))
const panelStyle = computed<Record<string, string>>(() => ({
  '--workspace-right-panel-width': `${props.width}px`,
}))

function resizeWithKeyboard(event: KeyboardEvent): void {
  let nextWidth: number | undefined

  if (event.key === 'ArrowLeft') nextWidth = props.width + 32
  if (event.key === 'ArrowRight') nextWidth = props.width - 32
  if (event.key === 'Home') nextWidth = props.minWidth
  if (event.key === 'End') nextWidth = props.maxWidth
  if (nextWidth === undefined) return

  event.preventDefault()
  emit('resize', nextWidth)
}
</script>

<template>
  <Transition name="workspace-right-panel">
    <aside
      v-if="isOpen"
      class="workspace-right-panel relative grid h-full min-h-0 shrink-0 grid-rows-[minmax(0,1fr)] border-l border-border bg-background"
      :aria-label="panelTitle"
      :data-expanded="props.expanded ? 'true' : undefined"
      :data-resizing="isResizing ? 'true' : undefined"
      :style="panelStyle"
    >
      <button
        class="group absolute left-0 top-0 z-20 h-full w-2 -translate-x-1/2 cursor-col-resize bg-transparent outline-hidden"
        :aria-label="t('workspace.rightPanel.resize')"
        aria-orientation="vertical"
        :aria-valuemax="props.maxWidth"
        :aria-valuemin="props.minWidth"
        :aria-valuenow="Math.round(props.width)"
        role="separator"
        type="button"
        @dblclick="emit('toggleExpanded')"
        @keydown="resizeWithKeyboard"
        @pointerdown="emit('startResize', $event)"
      >
        <span class="mx-auto block h-full w-px transition-colors group-hover:bg-border group-focus-visible:bg-ring" />
      </button>

      <div
        v-if="content"
        class="workspace-right-panel-scrollbar h-full min-h-0 overflow-auto"
      >
        <div
          v-if="content.type === 'code'"
          class="workspace-right-panel-code min-h-full"
        >
          <ShikiCode
            :code="content.code"
            :filename="content.filename"
            :language="content.language"
            :padded="true"
            :themed-background="true"
          />
        </div>

        <div
          v-else-if="content.type === 'diff'"
          class="workspace-right-panel-code min-h-full"
        >
          <ShikiCode
            :code="content.patch"
            :diff="true"
            :filename="content.filename"
            :language="content.language"
            :themed-background="true"
          />
        </div>

        <div
          v-else-if="content.type === 'markdown'"
          class="p-4"
        >
          <MarkdownRenderer
            v-if="!(content.owner && content.repo)"
            :content="content.content"
          />
          <GitHubMarkdownRenderer
            v-else
            :content="content.content"
            :owner="content.owner"
            :repo="content.repo"
          />
        </div>

        <div
          v-else-if="content.type === 'image'"
          class="flex h-full min-h-full items-center justify-center bg-card p-4"
        >
          <img
            :alt="content.alt ?? ''"
            class="max-h-full max-w-full rounded-md object-contain"
            :src="content.src"
          >
        </div>

        <div
          v-else-if="content.type === 'video'"
          class="flex h-full min-h-full items-center justify-center bg-card p-4"
        >
          <video
            class="max-h-full max-w-full rounded-md"
            controls
            :poster="content.poster"
            :src="content.src"
          />
        </div>

        <div
          v-else-if="content.type === 'download'"
          class="grid min-h-full place-items-center p-6"
        >
          <div class="grid w-full max-w-72 gap-4 text-center">
            <div class="grid gap-1">
              <h2 class="break-words text-label font-medium text-foreground">
                {{ content.filename ?? content.title ?? t('workspace.rightPanel.download.title') }}
              </h2>
              <p class="text-body text-muted-foreground">
                {{ content.description ?? t('workspace.rightPanel.download.description') }}
              </p>
            </div>

            <Button
              v-if="content.url"
              as="a"
              :download="content.filename"
              :href="content.url"
              rel="noreferrer"
              target="_blank"
              variant="primary"
            >
              <Download class="size-4" />
              {{ t('workspace.rightPanel.download.action') }}
            </Button>

            <Button
              v-else
              disabled
              type="button"
              variant="outline"
            >
              <Download class="size-4" />
              {{ t('workspace.rightPanel.download.unavailable') }}
            </Button>
          </div>
        </div>
      </div>

      <div
        v-else
        class="grid min-h-0 place-items-center px-6 text-center"
      >
        <p class="max-w-64 text-body text-muted-foreground">
          {{ t('workspace.rightPanel.empty') }}
        </p>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.workspace-right-panel {
  transform-origin: right center;
  width: var(--workspace-right-panel-width);
  max-width: 100%;
  transition: width 0.18s ease;
}

.workspace-right-panel[data-resizing="true"] {
  transition: none;
}

/* min-height percentages don't resolve against the auto-height wrapper,
   so stretch the code block with grid instead */
.workspace-right-panel-code,
.workspace-right-panel-code :deep(.rich-content-code) {
  display: grid;
}

.workspace-right-panel-code :deep(.shiki) {
  box-sizing: border-box;
  min-width: 100%;
  overflow: visible !important;
  width: max-content;
}

.workspace-right-panel-enter-active,
.workspace-right-panel-leave-active {
  overflow: hidden;
  transition:
    width 0.18s ease,
    max-width 0.18s ease,
    opacity 0.14s ease,
    transform 0.18s ease,
    border-color 0.18s ease;
}

.workspace-right-panel-enter-from,
.workspace-right-panel-leave-to {
  width: 0;
  max-width: 0;
  opacity: 0;
  transform: translateX(0.75rem);
  border-left-color: transparent;
}

@media (prefers-reduced-motion: reduce) {
  .workspace-right-panel,
  .workspace-right-panel-enter-active,
  .workspace-right-panel-leave-active {
    transition: none;
  }
}
</style>
