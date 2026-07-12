<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MonacoCodeEditor from '@/components/editor/monaco-code-editor.vue'
import GitHubMarkdownRenderer from '@/components/github/github-markdown-renderer.vue'
import MarkdownRenderer from '@/components/markdown/markdown-renderer.vue'
import {
  buildMarkdownFormatEdit,
  type MarkdownFormatAction,
} from './markdown-format-actions'
import MarkdownFormatToolbar from './markdown-format-toolbar.vue'
import {
  buildMentionInsertText,
  detectMentionQuery,
  type MentionCandidate,
  type MentionQuery,
} from './mention-query'
import MentionSuggestionMenu from './mention-suggestion-menu.vue'

const props = withDefaults(defineProps<{
  modelValue: string
  disabled?: boolean
  owner?: string | null
  repo?: string | null
  i18nScope?: string
}>(), {
  disabled: false,
  owner: null,
  repo: null,
  i18nScope: 'conversation.editor',
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const { t } = useI18n()

const editorRef = ref<InstanceType<typeof MonacoCodeEditor> | null>(null)

const body = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', String(value)),
})
const hasBody = computed(() => body.value.trim().length > 0)

const mentionOpen = ref(false)
const mentionQuery = ref('')
const mentionRange = ref<{
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
} | null>(null)
const mentionTop = ref(0)
const mentionLeft = ref(0)
const mentionActiveIndex = ref(0)
const mentionCandidates = ref<MentionCandidate[]>([])

let unsubscribeCursor: (() => void) | null = null

function message(key: string): string {
  return t(`${props.i18nScope}.${key}`)
}

function applyFormatAction(action: MarkdownFormatAction): void {
  const editor = editorRef.value
  if (!editor || props.disabled) return

  const edit = buildMarkdownFormatEdit(action, editor.getSelectionText())
  if (edit.kind === 'wrap') {
    editor.wrapSelection({
      before: edit.before,
      after: edit.after,
      placeholder: edit.placeholder,
    })
    return
  }

  editor.replaceSelection(edit.text)
}

function closeMention(): void {
  mentionOpen.value = false
  mentionQuery.value = ''
  mentionRange.value = null
  mentionActiveIndex.value = 0
  mentionCandidates.value = []
}

function syncMentionFromCursor(): void {
  const editor = editorRef.value
  if (!editor || props.disabled) {
    closeMention()
    return
  }

  const context = editor.getCursorContext()
  if (!context) {
    closeMention()
    return
  }

  const detected: MentionQuery | null = detectMentionQuery(
    context.lineContent,
    context.column,
  )
  if (!detected) {
    closeMention()
    return
  }

  const screen = editor.getCursorScreenPosition()
  if (!screen) {
    closeMention()
    return
  }

  mentionOpen.value = true
  mentionQuery.value = detected.query
  mentionRange.value = {
    startLineNumber: context.lineNumber,
    startColumn: detected.startColumn,
    endLineNumber: context.lineNumber,
    endColumn: detected.endColumn,
  }
  mentionTop.value = screen.top + 4
  mentionLeft.value = Math.max(8, screen.left)
}

function selectMention(candidate: MentionCandidate): void {
  const editor = editorRef.value
  const range = mentionRange.value
  if (!editor || !range) return

  editor.replaceRange(range, buildMentionInsertText(candidate.login))
  closeMention()
}

function handleMentionKey(key: 'Enter' | 'ArrowUp' | 'ArrowDown' | 'Escape'): boolean {
  if (!mentionOpen.value) return false

  if (key === 'Escape') {
    closeMention()
    return true
  }

  // With no candidates to navigate, let the editor move the caret instead of
  // trapping it; the cursor sync then closes the menu when the caret leaves.
  if (key === 'ArrowDown') {
    if (mentionCandidates.value.length === 0) return false
    mentionActiveIndex.value = (mentionActiveIndex.value + 1) % mentionCandidates.value.length
    return true
  }

  if (key === 'ArrowUp') {
    if (mentionCandidates.value.length === 0) return false
    mentionActiveIndex.value = (
      mentionActiveIndex.value - 1 + mentionCandidates.value.length
    ) % mentionCandidates.value.length
    return true
  }

  if (key === 'Enter') {
    const candidate = mentionCandidates.value[mentionActiveIndex.value]
    if (!candidate) return false
    selectMention(candidate)
    return true
  }

  return false
}

watch(editorRef, (editor, _prev, onCleanup) => {
  unsubscribeCursor?.()
  unsubscribeCursor = null
  editor?.setKeyInterceptor(null)

  if (!editor) return

  unsubscribeCursor = editor.onCursorChange(syncMentionFromCursor)
  editor.setKeyInterceptor(handleMentionKey)

  onCleanup(() => {
    unsubscribeCursor?.()
    unsubscribeCursor = null
    editor.setKeyInterceptor(null)
  })
}, { immediate: true })

watch(() => props.disabled, (disabled) => {
  if (disabled) closeMention()
})

onBeforeUnmount(() => {
  unsubscribeCursor?.()
  editorRef.value?.setKeyInterceptor(null)
})
</script>

<template>
  <div class="relative grid min-w-0 overflow-hidden rounded-md border border-border">
    <MarkdownFormatToolbar
      :disabled="disabled"
      @action="applyFormatAction"
    />

    <div class="grid min-w-0 md:grid-cols-2">
      <div class="relative h-48 min-w-0 border-b border-border md:border-b-0 md:border-r">
        <MonacoCodeEditor
          ref="editorRef"
          v-model="body"
          language="markdown"
          :options="{
            ariaLabel: message('inputLabel'),
            folding: false,
            hideCursorInOverviewRuler: true,
            lineNumbers: 'on',
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            placeholder: message('placeholder'),
            renderLineHighlight: 'line',
          }"
          :readonly="disabled"
        />

        <MentionSuggestionMenu
          :active-index="mentionActiveIndex"
          :left="mentionLeft"
          :open="mentionOpen"
          :owner="owner"
          :query="mentionQuery"
          :repo="repo"
          :top="mentionTop"
          @candidates="mentionCandidates = $event"
          @select="selectMention"
          @update:active-index="mentionActiveIndex = $event"
        />
      </div>

      <div class="h-48 min-w-0 overflow-auto bg-card p-3">
        <MarkdownRenderer
          v-if="hasBody && !(owner && repo)"
          class="rich-content-markdown--compact"
          :content="body"
        />
        <GitHubMarkdownRenderer
          v-else-if="hasBody"
          class="rich-content-markdown--compact"
          :content="body"
          :owner="owner"
          :repo="repo"
        />
        <p
          v-else
          class="text-body text-muted-foreground"
        >
          {{ message('emptyPreview') }}
        </p>
      </div>
    </div>
  </div>
</template>
