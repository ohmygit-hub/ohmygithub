<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, ref } from 'vue'
import { Check, ChevronsUpDown } from 'lucide-vue-next'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@oh-my-github/ui'

export interface SearchableSelectOption {
  id: string
  label: string
  description?: string | null
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  disabled?: boolean
  emptyLabel: string
  modelValue: string
  options: SearchableSelectOption[]
  placeholder: string
  searchPlaceholder: string
  selectLabel: string
  triggerClass?: HTMLAttributes['class']
  triggerSize?: 'sm' | 'default'
}>(), {
  triggerClass: undefined,
  triggerSize: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const selectedOption = computed(() =>
  props.options.find((option) => option.id === props.modelValue) ?? null
)
const selectedLabel = computed(() => selectedOption.value?.label ?? props.placeholder)

function selectOption(option: SearchableSelectOption): void {
  if (option.disabled) return

  emit('update:modelValue', option.id)
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        :aria-label="selectLabel"
        class="min-w-[14rem] max-w-full justify-between"
        :class="triggerClass"
        :disabled="disabled"
        role="combobox"
        :aria-expanded="open"
        :size="triggerSize"
        type="button"
        variant="outline"
      >
        <span class="min-w-0 select-none truncate text-left">
          {{ selectedLabel }}
        </span>
        <ChevronsUpDown class="size-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent
      align="start"
      class="w-[var(--reka-popover-trigger-width)] p-0"
      menu
    >
      <Command :model-value="modelValue">
        <CommandInput
          :placeholder="searchPlaceholder"
          search-icon
          size="md"
        />
        <CommandList>
          <CommandEmpty>
            {{ emptyLabel }}
          </CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="option in options"
              :key="option.id"
              class="grid grid-cols-[1rem_minmax(0,1fr)] items-start gap-2"
              :disabled="option.disabled"
              :value="option.id"
              @select="selectOption(option)"
            >
              <Check
                class="mt-0.5 size-3.5"
                :class="option.id === modelValue ? 'opacity-100' : 'opacity-0'"
              />
              <span class="grid min-w-0 gap-0.5">
                <span class="min-w-0 select-none truncate text-control">
                  {{ option.label }}
                </span>
                <span
                  v-if="option.description"
                  class="min-w-0 select-none truncate text-body text-muted-foreground"
                >
                  {{ option.description }}
                </span>
              </span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
