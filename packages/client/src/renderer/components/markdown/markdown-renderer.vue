<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MarkdownRender, { enableKatex, enableMermaid, setCustomComponents } from 'markstream-vue'
import { useSettingsStore } from '../../stores/settings'
import MermaidRenderer from '../mermaid/mermaid-renderer.vue'
import MarkdownCodeBlock from './markdown-code-block.vue'
import MarkdownImage from './markdown-image.vue'

const RICH_CONTENT_MARKDOWN_ID = 'oh-my-github-rich-content'

enableKatex()
enableMermaid()
setCustomComponents(RICH_CONTENT_MARKDOWN_ID, {
  code_block: MarkdownCodeBlock,
  image: MarkdownImage,
  mermaid: MermaidRenderer
})

const props = withDefaults(defineProps<{
  content: string
  final?: boolean
}>(), {
  final: true
})

const settings = useSettingsStore()
const isDark = computed(() => settings.isDark)
const markdownRoot = ref<HTMLElement | null>(null)

let imageDimensionObserver: MutationObserver | null = null
let pendingImageDimensionFrame: number | null = null

function scheduleImageDimensionSync(): void {
  if (typeof window === 'undefined' || pendingImageDimensionFrame !== null) return

  void nextTick(() => {
    pendingImageDimensionFrame = window.requestAnimationFrame(() => {
      pendingImageDimensionFrame = null
      syncImageDimensions()
    })
  })
}

function syncImageDimensions(): void {
  const root = markdownRoot.value
  if (!root) return

  for (const image of root.querySelectorAll<HTMLImageElement>('img[height], img[width]')) {
    const height = dimensionAttributeToCssValue(image.getAttribute('height'))
    const width = dimensionAttributeToCssValue(image.getAttribute('width'))

    if (height) {
      image.style.setProperty('height', height, 'important')
      if (!width) {
        image.style.setProperty('width', 'auto', 'important')
      }
    }

    if (width) {
      image.style.setProperty('width', width, 'important')
    }
  }
}

function dimensionAttributeToCssValue(value: string | null): string | null {
  const trimmedValue = value?.trim()
  if (!trimmedValue) return null

  if (/^\d+(?:\.\d+)?$/.test(trimmedValue)) return `${trimmedValue}px`
  if (/^\d+(?:\.\d+)?(?:px|rem|em|vh|vw|vmin|vmax|%)$/i.test(trimmedValue)) {
    return trimmedValue
  }

  return null
}

watch(() => props.content, scheduleImageDimensionSync, { flush: 'post' })

onMounted(() => {
  scheduleImageDimensionSync()

  if (typeof MutationObserver === 'undefined' || !markdownRoot.value) return

  imageDimensionObserver = new MutationObserver(scheduleImageDimensionSync)
  imageDimensionObserver.observe(markdownRoot.value, {
    childList: true,
    subtree: true,
  })
})

onBeforeUnmount(() => {
  imageDimensionObserver?.disconnect()
  imageDimensionObserver = null

  if (pendingImageDimensionFrame !== null && typeof window !== 'undefined') {
    window.cancelAnimationFrame(pendingImageDimensionFrame)
    pendingImageDimensionFrame = null
  }
})
</script>

<template>
  <div
    ref="markdownRoot"
    class="rich-content-markdown min-w-0"
  >
    <MarkdownRender
      :content="props.content"
      :fade="false"
      :final="props.final"
      :is-dark="isDark"
      :show-tooltips="false"
      :typewriter="false"
      code-renderer="shiki"
      :code-block-props="{ showHeader: false, showCopyButton: false }"
      :batch-rendering="false"
      :defer-nodes-until-visible="false"
      :mermaid-props="{ showTooltips: false, showHeader: false, showModeToggle: false, showCopyButton: false }"
      :node-virtual="false"
      custom-id="oh-my-github-rich-content"
      mode="docs"
    />
  </div>
</template>
