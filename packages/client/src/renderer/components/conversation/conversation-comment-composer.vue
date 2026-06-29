<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Button,
  Textarea,
} from '@oh-my-github/ui'
import { Send } from 'lucide-vue-next'
import GitHubMarkdownRenderer from '../github/github-markdown-renderer.vue'
import MarkdownRenderer from '../markdown/markdown-renderer.vue'

const props = withDefaults(defineProps<{
  modelValue: string
  isSubmitting?: boolean
  error?: string | null
  owner?: string | null
  repo?: string | null
  i18nScope?: string
}>(), {
  error: null,
  owner: null,
  repo: null,
  i18nScope: 'issue.comment',
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'submit'): void
}>()

const { t } = useI18n()

const body = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', String(value)),
})
const hasBody = computed(() => body.value.trim().length > 0)
const canSubmit = computed(() => hasBody.value && !props.isSubmitting)

function message(key: string): string {
  return t(`${props.i18nScope}.${key}`)
}

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
    <div class="grid min-w-0 gap-3 md:grid-cols-2">
      <div class="grid min-w-0 gap-1.5">
        <div class="select-none text-label font-medium text-foreground">
          {{ message('write') }}
        </div>
        <Textarea
          v-model="body"
          class="min-h-32"
          :aria-label="message('inputLabel')"
          :disabled="isSubmitting"
          :placeholder="message('placeholder')"
          size="lg"
        />
      </div>

      <div class="grid min-w-0 gap-1.5">
        <div class="select-none text-label font-medium text-foreground">
          {{ message('preview') }}
        </div>
        <div class="min-h-32 min-w-0 overflow-auto rounded-md border border-border bg-background/60 p-3">
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
        <span>{{ message('submit') }}</span>
      </Button>
    </div>
  </form>
</template>
