<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Button,
  SegmentedControl,
  Textarea,
} from '@oh-my-github/ui'
import { Send } from 'lucide-vue-next'
import { MarkdownRenderer } from '../../../components'

const props = withDefaults(defineProps<{
  modelValue: string
  mode: 'write' | 'preview'
  isSubmitting?: boolean
  error?: string | null
}>(), {
  error: null,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'update:mode', value: 'write' | 'preview'): void
  (event: 'submit'): void
}>()

const { t } = useI18n()

const body = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', String(value)),
})
const modeItems = computed(() => [
  {
    value: 'write' as const,
    label: t('issue.comment.write'),
  },
  {
    value: 'preview' as const,
    label: t('issue.comment.preview'),
  },
])
const mode = computed({
  get: () => props.mode,
  set: (value: 'write' | 'preview') => emit('update:mode', value),
})
const hasBody = computed(() => body.value.trim().length > 0)
const canSubmit = computed(() => hasBody.value && !props.isSubmitting)

function submitComment(): void {
  if (!canSubmit.value) return

  emit('submit')
}
</script>

<template>
  <form
    class="grid min-w-0 gap-3 rounded-lg border border-border bg-card p-3"
    @submit.prevent="submitComment"
  >
    <div class="grid gap-3">
      <SegmentedControl
        v-model="mode"
        :aria-label="t('issue.comment.modeLabel')"
        class="justify-self-start"
        :items="modeItems"
      />

      <div
        v-if="mode === 'write'"
        class="min-w-0"
      >
        <Textarea
          v-model="body"
          :aria-label="t('issue.comment.inputLabel')"
          :disabled="isSubmitting"
          :placeholder="t('issue.comment.placeholder')"
          size="lg"
        />
      </div>

      <div
        v-else
        class="min-w-0 rounded-md border border-border bg-background/60 p-3"
      >
        <MarkdownRenderer
          v-if="hasBody"
          class="rich-content-markdown--compact"
          :content="body"
        />
        <p
          v-else
          class="text-body text-muted-foreground"
        >
          {{ t('issue.comment.emptyPreview') }}
        </p>
      </div>
    </div>

    <div class="flex min-w-0 items-center justify-between gap-3">
      <p
        v-if="error"
        class="min-w-0 text-body text-destructive"
        role="alert"
      >
        {{ error }}
      </p>
      <span
        v-else
        aria-hidden="true"
      />

      <Button
        class="shrink-0"
        :disabled="!canSubmit"
        :loading="isSubmitting"
        loading-mode="leading"
        size="sm"
        type="submit"
      >
        <Send class="size-3.5" />
        <span>{{ t('issue.comment.submit') }}</span>
      </Button>
    </div>
  </form>
</template>
