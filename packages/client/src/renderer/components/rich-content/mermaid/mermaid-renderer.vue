<script setup lang="ts">
import { computed } from 'vue'
import { MermaidBlockNode } from 'markstream-vue'
import { useSettingsStore } from '../../../stores/settings'
import type { MarkdownCodeNode, MarkstreamCodeNode } from '../shared/markstream-node-types'

const props = withDefaults(defineProps<{
  node?: MarkdownCodeNode
  code?: string
  loading?: boolean
  isDark?: boolean
}>(), {
  code: undefined,
  isDark: undefined,
  loading: false,
  node: undefined
})

const settings = useSettingsStore()
const isDark = computed(() => props.isDark ?? settings.isDark)
const node = computed<MarkstreamCodeNode>(() => props.node as MarkstreamCodeNode ?? {
  type: 'code_block',
  raw: props.code ?? '',
  code: props.code ?? '',
  content: props.code ?? '',
  language: 'mermaid',
  loading: props.loading
} as MarkstreamCodeNode)
</script>

<template>
  <MermaidBlockNode
    :enable-mermaid-interactions="false"
    :is-dark="isDark"
    :loading="props.loading"
    :node="node"
    :show-copy-button="false"
    :show-export-button="false"
    :show-fullscreen-button="false"
    :show-header="false"
    :show-mode-toggle="false"
    :show-tooltips="false"
    class="rich-content-mermaid"
  />
</template>
