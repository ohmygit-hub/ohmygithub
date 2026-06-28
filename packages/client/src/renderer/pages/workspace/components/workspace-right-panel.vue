<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download } from 'lucide-vue-next'
import { Button } from '@oh-my-github/ui'
import { useRightPanel } from '../../../composables/use-right-panel'
import { MarkdownRenderer, ShikiCode } from '../../../components'

const props = defineProps<{
  isResizing: boolean
  width: number
}>()

const emit = defineEmits<{
  startResize: [event: PointerEvent]
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
</script>

<template>
  <Transition name="workspace-right-panel">
    <aside
      v-if="isOpen"
      class="workspace-right-panel relative grid h-full min-h-0 shrink-0 grid-rows-[minmax(0,1fr)] border-l border-border bg-background"
      :aria-label="panelTitle"
      :data-resizing="isResizing ? 'true' : undefined"
      :style="panelStyle"
    >
      <button
        class="group absolute left-0 top-0 z-20 h-full w-1 -translate-x-1/2 cursor-col-resize bg-transparent outline-hidden"
        :aria-label="t('workspace.rightPanel.resize')"
        role="separator"
        type="button"
        @pointerdown="emit('startResize', $event)"
      >
        <span class="block h-full w-full transition-colors group-hover:bg-border group-focus-visible:bg-ring" />
      </button>

      <div
        v-if="content"
        class="min-h-0 overflow-auto"
      >
        <div
          v-if="content.type === 'code'"
          class="p-3"
        >
          <ShikiCode
            :code="content.code"
            :filename="content.filename"
            :language="content.language"
          />
        </div>

        <div
          v-else-if="content.type === 'markdown'"
          class="p-4"
        >
          <MarkdownRenderer :content="content.content" />
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
  width: min(var(--workspace-right-panel-width), 70vw);
  max-width: 48rem;
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
  .workspace-right-panel-enter-active,
  .workspace-right-panel-leave-active {
    transition: none;
  }
}
</style>
