<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { MonacoLanguage, MonacoOptions, MonacoTheme } from 'stream-monaco'
import { ensureMonacoWorkers, useMonaco } from 'stream-monaco'
import { useCodeTheme } from '../index'
import { resolveCodeLanguage } from '../index'

const props = withDefaults(defineProps<{
  modelValue: string
  filename?: string
  language?: string
  readonly?: boolean
  options?: MonacoOptions
}>(), {
  filename: undefined,
  language: undefined,
  options: undefined,
  readonly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorElement = ref<HTMLElement>()
const { activeTheme, themes } = useCodeTheme()
let isUpdatingFromOutside = false

function resolveLanguage(): MonacoLanguage {
  return resolveCodeLanguage({
    filename: props.filename,
    language: props.language
  }) as MonacoLanguage
}

const monaco = useMonaco({
  automaticLayout: true,
  autoScrollInitial: false,
  autoScrollOnUpdate: false,
  fontSize: 13,
  lineNumbers: 'on',
  minimap: { enabled: false },
  padding: { bottom: 12, top: 12 },
  readOnly: props.readonly,
  renderLineHighlight: 'line',
  scrollBeyondLastLine: false,
  tabSize: 2,
  theme: activeTheme.value,
  themes: [themes.value.dark, themes.value.light] as MonacoTheme[],
  wordWrap: 'on',
  ...props.options
})

onMounted(async () => {
  if (!editorElement.value) return

  ensureMonacoWorkers()
  const editor = await monaco.createEditor(editorElement.value, props.modelValue, resolveLanguage())

  editor.onDidChangeModelContent(() => {
    if (isUpdatingFromOutside) return
    emit('update:modelValue', editor.getValue())
  })
})

onBeforeUnmount(() => {
  monaco.cleanupEditor()
})

watch(
  () => props.modelValue,
  (value) => {
    const editor = monaco.getEditorView()
    if (!editor || editor.getValue() === value) return

    isUpdatingFromOutside = true
    monaco.updateCode(value, resolveLanguage())
    isUpdatingFromOutside = false
  }
)

watch(
  () => props.readonly,
  (readonly) => {
    monaco.getEditorView()?.updateOptions({ readOnly: readonly })
  }
)

watch(
  () => [props.language, props.filename] as const,
  () => {
    monaco.setLanguage(resolveLanguage())
  }
)

watch(activeTheme, (theme) => {
  void monaco.setTheme(theme as MonacoTheme, true)
})
</script>

<template>
  <div
    ref="editorElement"
    class="h-full min-h-0 w-full overflow-hidden bg-card"
  />
</template>

<style scoped>
:deep(.monaco-editor),
:deep(.monaco-editor .overflow-guard),
:deep(.monaco-editor-background),
:deep(.monaco-editor .margin) {
  background-color: var(--card) !important;
}
</style>
