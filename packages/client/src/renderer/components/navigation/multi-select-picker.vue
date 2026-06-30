<script setup lang="ts">
import { computed } from 'vue'
import { Check, Pencil } from 'lucide-vue-next'
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

interface PickerOption {
  id: string
  label: string
  description?: string | null
  avatarUrl?: string | null
}

const props = defineProps<{
  options: PickerOption[]
  modelValue: string[]
  triggerLabel: string
  searchPlaceholder?: string
  emptyLabel?: string
  loadingLabel?: string
  loading?: boolean
  disabled?: boolean
  single?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

const open = defineModel<boolean>('open', { default: false })

const selected = computed(() => new Set(props.modelValue))

function toggle(id: string): void {
  if (props.single) {
    emit('update:modelValue', selected.value.has(id) ? [] : [id])
    open.value = false
    return
  }

  const next = new Set(props.modelValue)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  emit('update:modelValue', [...next])
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        :aria-label="triggerLabel"
        class="size-7 text-muted-foreground"
        :disabled="disabled"
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <Pencil class="size-3.5" />
      </Button>
    </PopoverTrigger>
    <PopoverContent
      align="start"
      class="w-64 p-0"
      menu
    >
      <Command :model-value="undefined">
        <CommandInput
          :placeholder="searchPlaceholder"
          search-icon
          size="md"
        />
        <CommandList>
          <CommandEmpty>{{ loading ? (loadingLabel ?? '') : emptyLabel }}</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="option in options"
              :key="option.id"
              :value="option.label"
              @select="toggle(option.id)"
            >
              <Check
                class="size-4 shrink-0"
                :class="selected.has(option.id) ? 'opacity-100' : 'opacity-0'"
              />
              <slot
                name="option"
                :option="option"
              >
                <span class="min-w-0 truncate">{{ option.label }}</span>
              </slot>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
