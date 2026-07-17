<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRightPanel } from '@/composables/use-right-panel'
import FileTree from './file-tree.vue'

const props = defineProps<{
  files: GitHubCommitFile[]
  owner: string
  repo: string
  /** When set, file diffs open as commentable pull-request diffs. */
  pullRequestNumber?: number
}>()

const { t } = useI18n()
const {
  clearRightPanel,
  closeRightPanel,
  openRightPanel,
} = useRightPanel()

onUnmounted(() => {
  closeRightPanel()
  clearRightPanel()
})

const selectedPath = ref<string | null>(null)
const expandedPaths = ref(new Set<string>())

const fileByPath = computed(() => {
  const map = new Map<string, GitHubCommitFile>()
  for (const file of props.files) {
    map.set(file.filename, file)
  }
  return map
})

const treeItems = computed(() => buildCommitFileTree(props.files))

watch(
  treeItems,
  (items) => {
    const next = new Set<string>()
    collectFolderPaths(items, next)
    expandedPaths.value = next
  },
  { immediate: true },
)

watch(
  () => [props.owner, props.repo] as const,
  () => {
    selectedPath.value = null
  },
)

function toggleFolder(path: string): void {
  const next = new Set(expandedPaths.value)
  if (next.has(path)) {
    next.delete(path)
  } else {
    next.add(path)
  }
  expandedPaths.value = next
}

function selectNode(node: GitHubRepositoryFileNode): void {
  if (node.type !== 'file') return

  const file = fileByPath.value.get(node.path)
  if (!file) return

  selectedPath.value = node.path

  if (!file.patch) {
    openRightPanel({
      type: 'download',
      url: '',
      filename: file.filename,
      title: file.filename,
      description: t('commit.files.noDiff'),
    })
    return
  }

  if (props.pullRequestNumber) {
    openRightPanel({
      type: 'pull-request-diff',
      owner: props.owner,
      repo: props.repo,
      number: props.pullRequestNumber,
      path: file.filename,
      patch: file.patch,
      additions: file.additions,
      deletions: file.deletions,
      title: file.filename,
    })
    return
  }

  openRightPanel({
    type: 'diff',
    patch: file.patch,
    filename: file.filename,
    additions: file.additions,
    deletions: file.deletions,
    title: file.filename,
  })
}

function parentPathOf(path: string): string {
  const index = path.lastIndexOf('/')
  return index === -1 ? '' : path.slice(0, index)
}

function buildCommitFileTree(files: GitHubCommitFile[]): GitHubRepositoryFileNode[] {
  const root: GitHubRepositoryFileNode[] = []
  const folders = new Map<string, GitHubRepositoryFileNode>()

  function ensureFolder(path: string): GitHubRepositoryFileNode {
    const existing = folders.get(path)
    if (existing) return existing

    const node: GitHubRepositoryFileNode = {
      type: 'tree',
      name: path.split('/').pop() ?? path,
      path,
      sha: '',
      size: null,
      downloadUrl: null,
      htmlUrl: null,
      children: [],
    }
    folders.set(path, node)

    const parentPath = parentPathOf(path)
    if (parentPath) {
      ensureFolder(parentPath).children.push(node)
    } else {
      root.push(node)
    }

    return node
  }

  for (const file of files) {
    const name = file.filename.split('/').pop() ?? file.filename
    const previousName = file.previousFilename?.split('/').pop()
    const leaf: GitHubRepositoryFileNode = {
      type: 'file',
      name: file.status === 'renamed' && previousName ? `${previousName} → ${name}` : name,
      path: file.filename,
      sha: '',
      size: null,
      downloadUrl: null,
      htmlUrl: null,
      additions: file.additions,
      deletions: file.deletions,
      children: [],
    }

    const parentPath = parentPathOf(file.filename)
    if (parentPath) {
      ensureFolder(parentPath).children.push(leaf)
    } else {
      root.push(leaf)
    }
  }

  return sortNodes(root)
}

function sortNodes(nodes: GitHubRepositoryFileNode[]): GitHubRepositoryFileNode[] {
  return nodes
    .map((node) => ({ ...node, children: sortNodes(node.children) }))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'tree' ? -1 : 1
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
}

function collectFolderPaths(nodes: GitHubRepositoryFileNode[], into: Set<string>): void {
  for (const node of nodes) {
    if (node.type === 'tree') {
      into.add(node.path)
      collectFolderPaths(node.children, into)
    }
  }
}
</script>

<template>
  <FileTree
    :expanded-paths="expandedPaths"
    :items="treeItems"
    :selected-path="selectedPath"
    @select="selectNode"
    @toggle="toggleFolder"
  />
</template>
