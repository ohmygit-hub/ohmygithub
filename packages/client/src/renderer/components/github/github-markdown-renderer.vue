<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import MarkdownRender, { enableKatex, enableMermaid, setCustomComponents } from 'markstream-vue'
import { useSettingsStore } from '@/stores/settings'
import MermaidRenderer from '@/components/mermaid/mermaid-renderer.vue'
import MarkdownCodeBlock from '@/components/markdown/markdown-code-block.vue'
import MarkdownImage from '@/components/markdown/markdown-image.vue'
import { unwrapSubWrappedBadges } from '@/components/markdown/markdown-content'
import GitHubMarkdownLink from './github-markdown-link.vue'
import { GITHUB_MARKDOWN_CONTEXT_KEY } from './github-markdown-context'
import GitHubMarkdownText from './github-markdown-text.vue'

const GITHUB_MARKDOWN_ID = 'oh-my-github-github-rich-content'

enableKatex()
enableMermaid()
setCustomComponents(GITHUB_MARKDOWN_ID, {
  code_block: MarkdownCodeBlock,
  image: MarkdownImage,
  link: GitHubMarkdownLink,
  mermaid: MermaidRenderer,
  text: GitHubMarkdownText,
})

const props = withDefaults(defineProps<{
  content: string
  final?: boolean
  owner?: string | null
  repo?: string | null
}>(), {
  final: true,
  owner: null,
  repo: null,
})

const settings = useSettingsStore()
const isDark = computed(() => settings.isDark)
const markdownRoot = ref<HTMLElement | null>(null)
const renderableContent = computed(() => unwrapSubWrappedBadges(props.content))
const markdownContext = computed(() => ({
  owner: props.owner,
  repo: props.repo,
}))

provide(GITHUB_MARKDOWN_CONTEXT_KEY, markdownContext)

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

    image.style.setProperty('height', 'auto', 'important')
    image.style.setProperty('max-width', '100%', 'important')

    if (width) {
      image.style.setProperty('width', width, 'important')
      image.style.removeProperty('max-height')
    } else if (height) {
      image.style.setProperty('max-height', height, 'important')
      image.style.setProperty('width', 'auto', 'important')
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
      :batch-rendering="false"
      code-renderer="shiki"
      :code-block-props="{ showHeader: false, showCopyButton: false }"
      custom-id="oh-my-github-github-rich-content"
      :content="renderableContent"
      :defer-nodes-until-visible="false"
      :fade="false"
      :final="props.final"
      :is-dark="isDark"
      :mermaid-props="{ showTooltips: false, showHeader: false, showModeToggle: false, showCopyButton: false }"
      mode="docs"
      :node-virtual="false"
      :show-tooltips="false"
      :typewriter="false"
    />
  </div>
</template>
