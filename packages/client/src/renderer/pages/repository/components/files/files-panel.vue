<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, Folder } from 'lucide-vue-next'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
} from '@oh-my-github/ui'
import { useRepositoryFilesQuery } from '../../../../composables/github/use-repositories'
import { useRightPanel } from '../../../../composables/use-right-panel'
import FileTreeItem from './file-tree-item.vue'

const props = defineProps<{
  defaultBranch: string | null
  owner: string
  repo: string
}>()

const { t } = useI18n()
const expandedPaths = ref(new Set<string>())
const selectedPath = ref<string | null>(null)
const previewRequestId = ref(0)
const {
  openRightPanel,
  setRightPanelContent,
} = useRightPanel()

const hasRepositoryIdentity = computed(() => Boolean(props.owner && props.repo))
const filesQuery = useRepositoryFilesQuery(
  () => props.owner,
  () => props.repo,
  () => props.defaultBranch,
  hasRepositoryIdentity,
)
const fileTree = computed(() => filesQuery.data.value ?? null)
const fileItems = computed(() => fileTree.value?.items ?? [])
const isLoading = computed(() => filesQuery.isLoading.value)
const hasError = computed(() => Boolean(filesQuery.error.value))
const branchLabel = computed(() => fileTree.value?.ref ?? props.defaultBranch ?? 'HEAD')
const fileCount = computed(() => countFileNodes(fileItems.value))
const formattedFileCount = computed(() => new Intl.NumberFormat().format(fileCount.value))

function toggleFolder(path: string): void {
  const nextExpandedPaths = new Set(expandedPaths.value)

  if (nextExpandedPaths.has(path)) {
    nextExpandedPaths.delete(path)
  } else {
    nextExpandedPaths.add(path)
  }

  expandedPaths.value = nextExpandedPaths
}

async function selectFile(item: GitHubRepositoryFileNode): Promise<void> {
  if (item.type !== 'file' || !window.ohMyGithub?.repositories) return

  const requestId = previewRequestId.value + 1
  previewRequestId.value = requestId
  selectedPath.value = item.path
  openRightPanel({
    type: 'markdown',
    content: t('repository.files.preview.loading'),
    title: item.path,
  })

  try {
    const preview = await window.ohMyGithub.repositories.getFilePreview(
      props.owner,
      props.repo,
      item.path,
      branchLabel.value,
    )

    if (previewRequestId.value !== requestId) return
    setRightPanelContent(toRightPanelContent(preview))
  } catch {
    if (previewRequestId.value !== requestId) return
    setRightPanelContent({
      type: 'download',
      url: item.downloadUrl ?? item.htmlUrl ?? '',
      filename: item.name,
      title: item.path,
      description: t('repository.files.preview.error'),
    })
  }
}

function toRightPanelContent(preview: GitHubRepositoryFilePreview) {
  if (preview.type === 'markdown') {
    return {
      type: 'markdown' as const,
      content: preview.content,
      title: preview.title,
    }
  }

  if (preview.type === 'code') {
    return {
      type: 'code' as const,
      code: preview.content,
      filename: preview.name,
      language: preview.language,
      title: preview.title,
    }
  }

  if (preview.type === 'image') {
    return {
      type: 'image' as const,
      src: preview.url,
      alt: preview.name,
      title: preview.title,
    }
  }

  if (preview.type === 'video') {
    return {
      type: 'video' as const,
      src: preview.url,
      poster: preview.posterUrl ?? undefined,
      title: preview.title,
    }
  }

  return {
    type: 'download' as const,
    url: preview.url,
    filename: preview.name,
    title: preview.title,
    description: t('repository.files.preview.downloadDescription'),
  }
}

function countFileNodes(items: GitHubRepositoryFileNode[]): number {
  return items.reduce((count, item) => (
    count + 1 + countFileNodes(item.children)
  ), 0)
}

watch(
  () => [props.owner, props.repo, props.defaultBranch] as const,
  () => {
    expandedPaths.value = new Set()
    selectedPath.value = null
  },
)
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-border bg-card">
    <header class="flex min-h-11 items-center justify-between gap-3 border-b border-border px-4">
      <div class="flex min-w-0 items-center gap-2">
        <Folder class="size-4 shrink-0 text-muted-foreground" />
        <h2 class="truncate text-label font-medium text-foreground">
          {{ t('repository.files.title') }}
        </h2>
      </div>

      <div class="flex min-w-0 shrink-0 items-center gap-2 text-body text-muted-foreground">
        <span class="max-w-40 truncate">
          {{ t('repository.files.branch', { branch: branchLabel }) }}
        </span>
        <span aria-hidden="true">/</span>
        <span class="tabular-nums">
          {{ t('repository.files.count', { count: formattedFileCount }) }}
        </span>
      </div>
    </header>

    <div class="min-h-[24rem] p-3">
      <Empty
        v-if="!hasRepositoryIdentity"
        class="min-h-[20rem] border border-dashed border-border bg-transparent"
      >
        <EmptyHeader>
          <EmptyTitle>
            {{ t('repository.files.missingIdentity.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('repository.files.missingIdentity.description') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <div
        v-else-if="isLoading && !fileTree"
        class="grid gap-1"
      >
        <div
          v-for="index in 12"
          :key="index"
          class="grid h-8 grid-cols-[1rem_minmax(0,1fr)] items-center gap-2 px-2"
          :class="index > 2 ? 'ml-5' : ''"
        >
          <Skeleton class="size-3.5 rounded-md" />
          <Skeleton
            class="h-3.5 rounded-md"
            :class="index % 3 === 0 ? 'w-36' : index % 3 === 1 ? 'w-52' : 'w-28'"
          />
        </div>
      </div>

      <div
        v-else-if="hasError && !fileTree"
        class="rounded-lg border border-dashed border-border p-4 text-body text-muted-foreground"
      >
        {{ t('repository.files.error') }}
      </div>

      <template v-else>
        <div
          v-if="fileTree?.truncated"
          class="mb-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-body text-foreground"
        >
          <AlertTriangle class="mt-0.5 size-4 shrink-0 text-warning" />
          <div class="grid gap-1">
            <div class="font-medium">
              {{ t('repository.files.truncated.title') }}
            </div>
            <p class="text-muted-foreground">
              {{ t('repository.files.truncated.description') }}
            </p>
          </div>
        </div>

        <ul
          v-if="fileItems.length > 0"
          class="grid gap-0.5"
        >
          <FileTreeItem
            v-for="item in fileItems"
            :key="item.path"
            :expanded-paths="expandedPaths"
            :item="item"
            :level="0"
            :selected-path="selectedPath"
            @select="selectFile"
            @toggle="toggleFolder"
          />
        </ul>

        <Empty
          v-else
          class="min-h-[20rem] border border-dashed border-border bg-transparent"
        >
          <EmptyHeader>
            <EmptyTitle>
              {{ t('repository.files.empty.title') }}
            </EmptyTitle>
            <EmptyDescription>
              {{ t('repository.files.empty.description') }}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </template>
    </div>
  </section>
</template>
