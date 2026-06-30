<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import {
  ChevronDown,
  ChevronRight,
  File,
  FileArchive,
  FileCode,
  FileImage,
  FileText,
  FileVideoCamera,
  Folder,
  FolderOpen,
} from 'lucide-vue-next'

defineOptions({
  name: 'FileTreeItem',
})

const props = defineProps<{
  expandedPaths: Set<string>
  item: GitHubRepositoryFileNode
  level: number
  selectedPath: string | null
}>()

const emit = defineEmits<{
  select: [item: GitHubRepositoryFileNode]
  toggle: [path: string]
}>()

const isFolder = computed(() => props.item.type === 'tree')
const isExpanded = computed(() => props.expandedPaths.has(props.item.path))
const isSelected = computed(() => props.selectedPath === props.item.path)
const hasStats = computed(() =>
  !isFolder.value && (props.item.additions !== undefined || props.item.deletions !== undefined)
)
const rowStyle = computed(() => ({
  paddingLeft: `${0.5 + props.level * 1.125}rem`,
}))
const itemIcon = computed<Component>(() => {
  if (isFolder.value) return isExpanded.value ? FolderOpen : Folder

  const path = props.item.path.toLowerCase()
  if (/\.(?:apng|avif|gif|jpe?g|png|svg|webp)$/.test(path)) return FileImage
  if (/\.(?:mov|mp4|m4v|ogg|ogv|webm)$/.test(path)) return FileVideoCamera
  if (/\.(?:7z|br|bz2|gz|rar|tar|tgz|xz|zip)$/.test(path)) return FileArchive
  if (/\.(?:md|mdx|markdown|txt)$/.test(path)) return FileText
  if (/\.(?:css|go|html|js|json|jsx|rs|sh|ts|tsx|vue|yaml|yml)$/.test(path)) return FileCode

  return File
})

function activateItem(): void {
  if (isFolder.value) {
    emit('toggle', props.item.path)
    return
  }

  emit('select', props.item)
}
</script>

<template>
  <li>
    <button
      class="grid h-8 w-full grid-cols-[1rem_1rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md pr-2 text-left text-body outline-hidden transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring/30"
      :class="isSelected ? 'bg-accent text-foreground' : 'text-muted-foreground'"
      :style="rowStyle"
      :aria-expanded="isFolder ? isExpanded : undefined"
      :aria-label="item.path"
      :title="item.path"
      type="button"
      @click="activateItem"
      @keydown.enter.prevent="activateItem"
      @keydown.space.prevent="activateItem"
    >
      <ChevronDown
        v-if="isFolder && isExpanded"
        class="size-3.5 justify-self-center text-muted-foreground"
      />
      <ChevronRight
        v-else-if="isFolder"
        class="size-3.5 justify-self-center text-muted-foreground"
      />
      <span
        v-else
        aria-hidden="true"
      />

      <component
        :is="itemIcon"
        class="size-3.5 justify-self-center"
        :class="isSelected ? 'text-foreground' : 'text-muted-foreground'"
        :stroke-width="1.75"
      />

      <span class="min-w-0 truncate">
        {{ item.name }}
      </span>

      <span
        v-if="hasStats"
        class="flex shrink-0 items-center gap-1.5 pl-2 font-mono text-[0.6875rem] leading-none tabular-nums"
      >
        <span class="text-success">+{{ item.additions ?? 0 }}</span>
        <span class="text-destructive">&minus;{{ item.deletions ?? 0 }}</span>
      </span>
      <span
        v-else
        aria-hidden="true"
      />
    </button>

    <ul
      v-if="isFolder && isExpanded"
      class="grid gap-0.5"
    >
      <FileTreeItem
        v-for="child in item.children"
        :key="child.path"
        :expanded-paths="expandedPaths"
        :item="child"
        :level="level + 1"
        :selected-path="selectedPath"
        @select="emit('select', $event)"
        @toggle="emit('toggle', $event)"
      />
    </ul>
  </li>
</template>
