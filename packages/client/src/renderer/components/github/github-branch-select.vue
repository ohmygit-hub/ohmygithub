<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SearchableSelect from '@/components/navigation/searchable-select.vue'
import type { SearchableSelectOption } from '@/components/navigation/searchable-select.vue'
import { useRepositoryBranchesQuery } from '@/composables/github/use-repositories'

const props = withDefaults(defineProps<{
  owner: string
  repo: string
  modelValue: string | null
  defaultBranch?: string | null
  // Trigger width/layout. Defaults to a bounded picker for toolbars; pass
  // `w-full` in forms so it fills its column and lines up with sibling fields.
  triggerClass?: string
  triggerSize?: 'sm' | 'default'
}>(), {
  triggerClass: 'w-full sm:w-72',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

const hasIdentity = computed(() => Boolean(props.owner && props.repo))
const branchesQuery = useRepositoryBranchesQuery(
  () => props.owner,
  () => props.repo,
  hasIdentity,
)
const branches = computed(() => branchesQuery.data.value ?? [])
const isLoading = computed(() => branchesQuery.isLoading.value)
const currentValue = computed(() => props.modelValue ?? props.defaultBranch ?? '')

const options = computed<SearchableSelectOption[]>(() => {
  const items: SearchableSelectOption[] = branches.value.map((branch) => ({
    id: branch.name,
    label: branch.name,
  }))

  if (currentValue.value && !items.some((item) => item.id === currentValue.value)) {
    items.unshift({ id: currentValue.value, label: currentValue.value })
  }

  return items
})

const emptyLabel = computed(() =>
  isLoading.value
    ? t('repository.commits.branch.loading')
    : t('repository.commits.branch.empty')
)

function selectBranch(value: string): void {
  if (value === currentValue.value) return
  emit('update:modelValue', value)
}
</script>

<template>
  <SearchableSelect
    :disabled="!hasIdentity"
    :empty-label="emptyLabel"
    :model-value="currentValue"
    :options="options"
    :placeholder="t('repository.commits.branch.placeholder')"
    :search-placeholder="t('repository.commits.branch.searchPlaceholder')"
    :select-label="t('repository.commits.branch.selectLabel')"
    :trigger-class="triggerClass"
    :trigger-size="triggerSize"
    @update:model-value="selectBranch"
  />
</template>
