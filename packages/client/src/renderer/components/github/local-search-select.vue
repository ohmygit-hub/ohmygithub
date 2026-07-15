<script setup lang="ts">
import { Command } from '@oh-my-github/ui'
import LocalSearchSelectContent from './local-search-select-content.vue'
import type { LocalSearchSelectItem } from './local-search-select-types'

defineProps<{
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
</script>

<template>
  <!--
    The same field-skinned Command as user-search-input, but filtering a
    caller-provided finite list instead of a remote search, with the list
    always drawn so the picker reads as a filterable listbox inside dialogs.
  -->
  <Command
    class="h-auto overflow-visible rounded-md border-0 bg-transparent shadow-[inset_0_0_0_1px_var(--field-edge-rest)] transition-shadow focus-within:shadow-[inset_0_0_0_1px_var(--field-edge-solid)] [&_[data-slot=command-input-wrapper]]:border-b-0"
    model-value=""
  >
    <LocalSearchSelectContent
      :disabled="disabled"
      :empty-label="emptyLabel"
      :input-id="inputId"
      :items="items"
      :model-value="modelValue"
      :placeholder="placeholder"
      @select="emit('select', $event)"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </Command>
</template>
