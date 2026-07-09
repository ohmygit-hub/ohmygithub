<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CommandDialog } from '@oh-my-github/ui'
import WorkspaceSearchDialogContent from './workspace-search-dialog-content.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  navigate: [url: string]
  'update:open': [open: boolean]
}>()

const { t } = useI18n()
const isResolving = ref(false)
const resolveError = ref(false)
const gotoRequestId = ref(0)

function updateOpen(open: boolean): void {
  if (!open) {
    resolveError.value = false
    isResolving.value = false
  }

  emit('update:open', open)
}

async function gotoQuery(query: string): Promise<void> {
  const normalizedQuery = query.trim()
  if (isResolving.value || !normalizedQuery) return

  const requestId = gotoRequestId.value + 1
  gotoRequestId.value = requestId
  isResolving.value = true
  resolveError.value = false
  updateOpen(false)

  try {
    if (!window.ohMyGithub?.search) {
      throw new Error('GitHub search bridge is unavailable')
    }

    const result = await window.ohMyGithub.search.resolveGoto(normalizedQuery)
    if (requestId === gotoRequestId.value) {
      emit('navigate', result.url)
    }
  } catch {
    if (requestId === gotoRequestId.value) {
      emit('navigate', createNotFoundUrl(normalizedQuery))
    }
  } finally {
    if (requestId === gotoRequestId.value) {
      isResolving.value = false
    }
  }
}

function searchQuery(mode: GitHubWorkspaceSearchMode, query: string): void {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return

  gotoRequestId.value += 1
  updateOpen(false)
  emit('navigate', `/search/${mode}?q=${encodeURIComponent(normalizedQuery)}`)
}

// A cached repository picked from the palette navigates straight to its workspace URL,
// skipping the goto resolution round-trip.
function navigateToUrl(url: string): void {
  if (!url) return

  gotoRequestId.value += 1
  updateOpen(false)
  emit('navigate', url)
}

function createNotFoundUrl(input: string): string {
  const params = new URLSearchParams()
  params.set('q', input)

  return `/not-found?${params.toString()}`
}
</script>

<template>
  <CommandDialog
    :description="t('workspace.search.description')"
    :open="props.open"
    :title="t('workspace.search.title')"
    highlight-first-on-open
    @update:open="updateOpen"
  >
    <WorkspaceSearchDialogContent
      :is-resolving="isResolving"
      :open="props.open"
      :resolve-error="resolveError"
      @goto="gotoQuery"
      @search="searchQuery"
      @navigate="navigateToUrl"
    />
  </CommandDialog>
</template>
