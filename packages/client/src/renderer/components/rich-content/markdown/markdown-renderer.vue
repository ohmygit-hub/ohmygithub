<script setup lang="ts">
import { computed } from 'vue'
import MarkdownRender, { enableKatex, enableMermaid, setCustomComponents } from 'markstream-vue'
import { useSettingsStore } from '../../../stores/settings'
import MermaidRenderer from '../mermaid/mermaid-renderer.vue'
import MarkdownCodeBlock from './markdown-code-block.vue'

const RICH_CONTENT_MARKDOWN_ID = 'oh-my-github-rich-content'

enableKatex()
enableMermaid()
setCustomComponents(RICH_CONTENT_MARKDOWN_ID, {
  code_block: MarkdownCodeBlock,
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
</script>

<template>
  <div class="rich-content-markdown min-w-0">
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
