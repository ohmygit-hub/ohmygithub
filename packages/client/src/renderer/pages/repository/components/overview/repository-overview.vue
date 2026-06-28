<script setup lang="ts">
import type { RepositoryOverviewInfoItem } from '../types'
import OverviewDocumentsCard from './overview-documents-card.vue'
import OverviewSummaryCard from './overview-summary-card.vue'

defineProps<{
  activeDocument: GitHubRepositoryDocument | null
  activeDocumentKind: GitHubRepositoryDocumentKind
  availableDocuments: GitHubRepositoryDocument[]
  hasOverviewError: boolean
  isOverviewLoading: boolean
  missingScopesText: string
  overview: GitHubRepositoryOverview | null
  overviewDescription: string
  overviewInfoItems: RepositoryOverviewInfoItem[]
}>()

const emit = defineEmits<{
  'update:activeDocumentKind': [value: GitHubRepositoryDocumentKind]
}>()
</script>

<template>
  <OverviewSummaryCard
    :has-overview-error="hasOverviewError"
    :is-overview-loading="isOverviewLoading"
    :missing-scopes-text="missingScopesText"
    :overview="overview"
    :overview-description="overviewDescription"
    :overview-info-items="overviewInfoItems"
  />

  <OverviewDocumentsCard
    :active-document="activeDocument"
    :active-document-kind="activeDocumentKind"
    :available-documents="availableDocuments"
    :has-overview-error="hasOverviewError"
    :is-overview-loading="isOverviewLoading"
    :overview="overview"
    @update:active-document-kind="emit('update:activeDocumentKind', $event)"
  />
</template>
