<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  useCommand,
} from '@oh-my-github/ui'
import type { LocalSearchSelectItem } from './local-search-select-types'

const props = defineProps<{
  disabled?: boolean
  emptyLabel: string
  inputId?: string
  items: LocalSearchSelectItem[]
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  select: [item: LocalSearchSelectItem]
  'update:modelValue': [value: string]
}>()

const { filterState } = useCommand()

onMounted(() => {
  if (props.modelValue && props.modelValue !== filterState.search) {
    filterState.search = props.modelValue
  }
})

watch(
  () => props.modelValue,
  (value) => {
    if (value !== filterState.search) {
      filterState.search = value
    }
  },
)

watch(
  () => filterState.search,
  (value) => {
    if (value !== props.modelValue) {
      emit('update:modelValue', value)
    }
  },
)

// Filtering is manual (force-render + computed) so row visibility never
// depends on Command's internal matcher semantics.
const filteredItems = computed(() => {
  const query = filterState.search.trim().toLowerCase()
  if (!query) return props.items

  return props.items.filter((item) =>
    item.label.toLowerCase().includes(query)
    || (item.sublabel ?? '').toLowerCase().includes(query))
})

function selectItem(item: LocalSearchSelectItem): void {
  filterState.search = item.label
  emit('select', item)
}

function fallbackInitials(label: string): string {
  return label.slice(0, 2).toUpperCase()
}
</script>

<template>
  <CommandInput
    :id="inputId"
    :disabled="disabled"
    :placeholder="placeholder"
    :search-icon="false"
    size="sm"
  />

  <CommandList class="max-h-48 border-t border-border/40">
    <CommandGroup
      v-if="filteredItems.length > 0"
      force-render
    >
      <CommandItem
        v-for="item in filteredItems"
        :key="item.id"
        class="flex items-center gap-2"
        force-render
        :value="item.id"
        @select="selectItem(item)"
      >
        <Avatar
          v-if="item.avatarUrl !== undefined"
          class="size-5 shrink-0"
        >
          <AvatarImage
            :alt="item.label"
            :src="item.avatarUrl ?? ''"
          />
          <AvatarFallback class="text-caption">
            {{ fallbackInitials(item.label) }}
          </AvatarFallback>
        </Avatar>
        <span class="min-w-0 truncate">{{ item.label }}</span>
        <span
          v-if="item.sublabel"
          class="min-w-0 truncate text-caption text-muted-foreground"
        >
          {{ item.sublabel }}
        </span>
      </CommandItem>
    </CommandGroup>

    <p
      v-else
      class="px-3.5 py-2.5 text-body text-muted-foreground"
    >
      {{ emptyLabel }}
    </p>
  </CommandList>
</template>
