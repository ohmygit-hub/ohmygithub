<script setup lang="ts">
import FileTreeItem from './file-tree-item.vue'

defineProps<{
  items: GitHubRepositoryFileNode[]
  expandedPaths: Set<string>
  selectedPath: string | null
}>()

const emit = defineEmits<{
  select: [item: GitHubRepositoryFileNode]
  toggle: [path: string]
}>()
</script>

<template>
  <ul class="grid gap-0.5">
    <FileTreeItem
      v-for="item in items"
      :key="item.path"
      :expanded-paths="expandedPaths"
      :item="item"
      :level="0"
      :selected-path="selectedPath"
      @select="emit('select', $event)"
      @toggle="emit('toggle', $event)"
    />
  </ul>
</template>
