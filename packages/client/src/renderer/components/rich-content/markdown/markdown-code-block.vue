<script setup lang="ts">
import { computed } from 'vue'
import ShikiCode from '../code/preview/shiki-code.vue'
import type { MarkdownCodeNode } from '../shared/markstream-node-types'

const props = defineProps<{
  node: MarkdownCodeNode
}>()

const code = computed(() => props.node.code ?? props.node.content ?? props.node.raw ?? '')
const language = computed(() => props.node.language ?? 'plaintext')
</script>

<template>
  <div class="my-3 overflow-hidden rounded-lg border border-border bg-card p-3">
    <ShikiCode
      :code="code"
      :language="language"
    />
  </div>
</template>
