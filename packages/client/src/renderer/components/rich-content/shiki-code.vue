<script setup lang="ts">
import { watch } from 'vue'
import { useShikiHighlighter } from '../../composables/use-shiki-highlighter'

const props = withDefaults(defineProps<{
  code: string
  language?: string
  filename?: string
}>(), {
  filename: undefined,
  language: undefined
})

const shiki = useShikiHighlighter()

watch(
  () => [props.code, props.language, props.filename] as const,
  ([code, language, filename]) => {
    if (!code) {
      shiki.html.value = ''
      return
    }

    void shiki.highlight(code, { filename, language })
  },
  { immediate: true }
)
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    v-if="shiki.html.value"
    class="rich-content-code min-w-0 font-mono text-body leading-relaxed [&_pre]:overflow-x-auto [&_pre]:p-0"
    v-html="shiki.html.value"
  />
  <!-- eslint-enable vue/no-v-html -->
  <pre
    v-else
    class="rich-content-code min-w-0 overflow-x-auto whitespace-pre font-mono text-body leading-relaxed text-foreground"
  ><code>{{ props.code }}</code></pre>
</template>
