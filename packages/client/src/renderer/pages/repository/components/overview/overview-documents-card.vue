<script setup lang="ts">
import { FileText } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
} from '@oh-my-github/ui'
import { MarkdownRenderer } from '../../../../components'

defineProps<{
  activeDocument: GitHubRepositoryDocument | null
  activeDocumentKind: GitHubRepositoryDocumentKind
  availableDocuments: GitHubRepositoryDocument[]
  hasOverviewError: boolean
  isOverviewLoading: boolean
  overview: GitHubRepositoryOverview | null
}>()

const emit = defineEmits<{
  'update:activeDocumentKind': [value: GitHubRepositoryDocumentKind]
}>()

const { t } = useI18n()

function documentTitle(kind: GitHubRepositoryDocumentKind): string {
  return t(`repository.documents.${kind}.title`)
}
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-border bg-card">
    <div class="flex min-h-11 items-center justify-between border-b border-border px-3">
      <div class="flex min-w-0 items-center overflow-x-auto">
        <button
          v-for="document in availableDocuments"
          :key="document.kind"
          class="flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-body font-medium outline-hidden transition-colors"
          :class="activeDocument?.kind === document.kind
            ? 'border-foreground text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'"
          type="button"
          @click="emit('update:activeDocumentKind', document.kind)"
        >
          <FileText class="size-4" />
          {{ documentTitle(document.kind) }}
        </button>
        <div
          v-if="availableDocuments.length === 0"
          class="flex h-11 items-center gap-2 px-3 text-body font-medium text-muted-foreground"
        >
          <FileText class="size-4" />
          {{ t('repository.documents.readme.title') }}
        </div>
      </div>
    </div>

    <div class="min-h-[20rem] p-4">
      <div
        v-if="isOverviewLoading && !overview"
        class="grid gap-3"
      >
        <Skeleton class="h-5 w-1/3 rounded-md" />
        <Skeleton class="h-4 w-full rounded-md" />
        <Skeleton class="h-4 w-11/12 rounded-md" />
        <Skeleton class="h-4 w-4/5 rounded-md" />
        <div class="grid gap-2 pt-2">
          <Skeleton class="h-24 w-full rounded-lg" />
          <Skeleton class="h-4 w-2/3 rounded-md" />
        </div>
      </div>

      <div
        v-else-if="hasOverviewError && !overview"
        class="rounded-lg border border-dashed border-border p-4 text-body text-muted-foreground"
      >
        {{ t('repository.documents.error') }}
      </div>

      <MarkdownRenderer
        v-else-if="activeDocument?.format === 'markdown'"
        :content="activeDocument.content"
      />

      <pre
        v-else-if="activeDocument"
        class="max-h-[42rem] overflow-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-4 font-mono text-body leading-relaxed text-foreground"
      >{{ activeDocument.content }}</pre>

      <Empty
        v-else
        class="min-h-[18rem] border border-dashed border-border bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('repository.documents.empty.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('repository.documents.empty.description') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  </section>
</template>
